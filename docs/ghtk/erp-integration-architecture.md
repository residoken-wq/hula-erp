# Kiến Trúc Tích Hợp GHTK Vào Hệ Thống Hula ERP

Tài liệu này cung cấp thiết kế kiến trúc kỹ thuật chi tiết dành cho lập trình viên Backend và Frontend của **Hula ERP** để triển khai module kết nối **GHTK (Giao Hàng Tiết Kiệm)** theo chuẩn kiến trúc của dự án (NestJS, TypeORM, PostgreSQL, React).

---

## 1. Hiện trạng Data Model liên quan trong Hula ERP

Trong mã nguồn hiện tại của Hula ERP, hai thực thể đã được chuẩn bị sẵn cho vận chuyển:

1. **`ShippingCarrier`** (`src/inventory/entities/shipping-carrier.entity.ts`):
   * `code`: Mã ĐVVC (Ví dụ: `GHTK`)
   * `name`: Giao Hàng Tiết Kiệm
   * `tracking_url`: Template tra cứu vận đơn, ví dụ: `https://i.ghtk.vn/{code}`
   * `is_active`: `true`

2. **`SalesDelivery`** (`src/sales/sales-delivery.entity.ts`):
   * `code`: Mã phiếu giao hàng xuất kho (VD: `DO-260905-001`) -> Dùng làm `order.id` (partner_id) gửi sang GHTK
   * `shipping_carrier`: ĐVVC code (Lưu giá trị `'GHTK'`)
   * `tracking_code`: Mã vận đơn GHTK trả về (VD: `S1.A1.2001297581`)
   * `shipping_cost`: Chi phí vận chuyển thực tế từ GHTK
   * `status`: `PENDING_EXPORT` | `SHIPPED` | `COMPLETED` | `RETURNED` | `CANCELLED`
   * `delivery_address`, `contact_name`, `contact_phone`: Thông tin người nhận
   * `attachments`: Danh sách tệp đính kèm (Có thể lưu trữ link ảnh POD ký nhận từ GHTK)

---

## 2. Kiến trúc Module đề xuất: `ShippingModule`

Để mở rộng hỗ trợ nhiều đơn vị vận chuyển trong tương lai (GHTK, GHN, ViettelPost, AhaMove...) mà không làm phình to `SalesModule`, đề xuất khởi tạo một module độc lập:

```
src/shipping/
├── shipping.module.ts
├── shipping.service.ts                     # Interface chuẩn điều phối đa đơn vị vận chuyển
├── carriers/
│   ├── ghtk/
│   │   ├── ghtk.service.ts                 # Service đóng gói toàn bộ HTTP client gọi GHTK API
│   │   ├── ghtk.controller.ts              # Controller nhận Webhook và xử lý test
│   │   ├── ghtk.interface.ts               # Định nghĩa kiểu dữ liệu (Order, Product, Response)
│   │   ├── ghtk.constant.ts                # Định nghĩa hằng số (Status map, Tag map, Error codes)
│   │   └── dto/
│   │       ├── ghtk-create-order.dto.ts
│   │       ├── ghtk-calculate-fee.dto.ts
│   │       └── ghtk-webhook.dto.ts
└── entities/
    └── shipping-webhook-log.entity.ts      # Bảng lưu vết Idempotency của Webhook
```

---

## 3. Bản thiết kế chi tiết các thành phần

### 3.1. Hằng số và Bảng ánh xạ (`ghtk.constant.ts`)

```typescript
export const GHTK_STATUS_MAP: Record<number, string> = {
  [-1]: 'CANCELLED',      // Hủy đơn
  [1]: 'PENDING_EXPORT',  // Chưa tiếp nhận
  [2]: 'PENDING_EXPORT',  // Đã tiếp nhận
  [12]: 'PENDING_EXPORT', // Đang đi lấy hàng
  [3]: 'SHIPPED',         // Đã lấy hàng / Nhập kho
  [4]: 'SHIPPED',         // Đang giao hàng
  [5]: 'COMPLETED',       // Giao hàng thành công
  [6]: 'COMPLETED',       // Đã đối soát
  [7]: 'PENDING_EXPORT',  // Lấy thất bại
  [8]: 'PENDING_EXPORT',  // Hoãn lấy
  [9]: 'FAILED',          // Giao thất bại
  [10]: 'SHIPPED',        // Hoãn giao
  [20]: 'RETURNING',      // Đang chuyển hoàn
  [21]: 'RETURNED',       // Đã trả hàng về kho
};

export const GHTK_TAGS = {
  FRAGILE: 1,            // Dễ vỡ (+1000đ)
  HIGH_VALUE: 2,         // Giá trị cao
  AGRICULTURAL: 7,       // Nông sản / Thực phẩm
  VIEW_GOODS: 10,        // Cho xem hàng
  TRY_GOODS: 11,         // Cho thử hàng (+2000đ)
  CALL_SHOP_ON_FAIL: 13, // Gọi cho shop khi không giao được
  PARTIAL_DELIVER: 17,   // Giao hàng 1 phần
  ORIGINAL_BOX: 20,      // Hàng nguyên hộp (+1000đ)
};
```

---

### 3.2. Cốt lõi Service Client (`ghtk.service.ts`)

```typescript
import { Injectable, Logger, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class GhtkService {
  private readonly logger = new Logger(GhtkService.name);
  private readonly client: AxiosInstance;
  private readonly partnerCode: string;

  constructor(private configService: ConfigService) {
    const baseURL = this.configService.get<string>(
      'GHTK_API_URL',
      'https://services-staging.ghtklab.com',
    );
    const token = this.configService.get<string>('GHTK_API_TOKEN');
    this.partnerCode = this.configService.get<string>('GHTK_PARTNER_CODE', '');

    this.client = axios.create({
      baseURL,
      headers: {
        'Token': token,
        'X-Client-Source': this.partnerCode,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });
  }

  /**
   * 1. Tính phí vận chuyển ước tính
   */
  async calculateFee(params: {
    pickProvince: string;
    pickDistrict: string;
    province: string;
    district: string;
    address?: string;
    weightGram: number;
    valueVnd?: number;
    tags?: number[];
  }) {
    try {
      const response = await this.client.get('/services/shipment/fee', {
        params: {
          pick_province: params.pickProvince,
          pick_district: params.pickDistrict,
          province: params.province,
          district: params.district,
          address: params.address,
          weight: Math.round(params.weightGram),
          value: params.valueVnd || 0,
          deliver_option: 'none',
          tags: params.tags || [],
        },
      });

      if (!response.data?.success) {
        throw new BadRequestException(response.data?.message || 'Không thể tính phí vận chuyển GHTK');
      }

      return response.data.fee;
    } catch (error) {
      this.logger.error(`Error calculating fee: ${error.message}`, error.stack);
      throw new HttpException(
        error.response?.data?.message || error.message,
        error.response?.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * 2. Đăng đơn hàng giao nhận sang GHTK
   */
  async submitOrder(orderPayload: any) {
    try {
      this.logger.log(`Submitting order to GHTK: ${orderPayload.order.id}`);
      const response = await this.client.post('/services/shipment/order', orderPayload);

      if (!response.data?.success) {
        // Xử lý riêng biệt mã lỗi trùng đơn hàng ORDER_ID_EXIST
        if (response.data?.error?.code === 'ORDER_ID_EXIST') {
          return {
            isExisted: true,
            trackingCode: response.data.error.ghtk_label,
            partnerId: response.data.error.partner_id,
            status: response.data.error.status,
            message: response.data.message,
          };
        }
        throw new BadRequestException(response.data?.message || 'Đăng đơn GHTK thất bại');
      }

      return {
        isExisted: false,
        trackingCode: response.data.order.label,
        trackingId: response.data.order.tracking_id,
        fee: Number(response.data.order.fee),
        insuranceFee: Number(response.data.order.insurance_fee),
        estimatedPickTime: response.data.order.estimated_pick_time,
        estimatedDeliverTime: response.data.order.estimated_deliver_time,
        statusId: response.data.order.status_id,
      };
    } catch (error) {
      this.logger.error(`Failed to submit GHTK order: ${error.message}`, error.stack);
      throw new HttpException(
        error.response?.data?.message || error.message,
        error.response?.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * 3. Tra cứu trạng thái đơn hàng
   */
  async getOrderStatus(orderCodeOrPartnerId: string, isPartnerId = false) {
    const path = isPartnerId
      ? `/services/shipment/v2/partner_id:${orderCodeOrPartnerId}`
      : `/services/shipment/v2/${orderCodeOrPartnerId}`;
    const response = await this.client.get(path);
    return response.data?.order;
  }

  /**
   * 4. Hủy đơn hàng trước khi shipper lấy
   */
  async cancelOrder(partnerId: string) {
    const response = await this.client.post(`/services/shipment/cancel/partner_id:${partnerId}`);
    return response.data;
  }

  /**
   * 5. In nhãn vận đơn (Tải file PDF binary)
   */
  async getPrintLabelPdf(labelId: string): Promise<Buffer> {
    const response = await this.client.get(`/services/label/${labelId}`, {
      responseType: 'arraybuffer',
    });
    return Buffer.from(response.data);
  }

  /**
   * 6. Lấy danh sách kho lấy hàng đã cấu hình trên tài khoản
   */
  async getPickAddresses() {
    const response = await this.client.get('/services/shipment/list_pick_add');
    return response.data?.data || [];
  }

  /**
   * 7. Xác nhận hàng đã đóng gói xong, sẵn sàng lấy
   */
  async confirmReadyToShip(trackingId: number) {
    const response = await this.client.post('/open/api/v1/package/ready-to-ship/confirm', {
      pkg_orders: [trackingId],
      confirm_all: false,
    });
    return response.data;
  }
}
```

---

### 3.3. Controller Xử lý Webhook (`ghtk.controller.ts`)

```typescript
import { Controller, Post, Body, Query, Headers, HttpCode, HttpStatus, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalesDelivery } from 'src/sales/sales-delivery.entity';
import { GHTK_STATUS_MAP } from './ghtk.constant';

@Controller('api/webhooks/shipping')
export class GhtkWebhookController {
  private readonly logger = new Logger(GhtkWebhookController.name);

  constructor(
    private configService: ConfigService,
    @InjectRepository(SalesDelivery)
    private deliveryRepo: Repository<SalesDelivery>,
  ) {}

  @Post('ghtk')
  @HttpCode(HttpStatus.OK)
  async handleGhtkWebhook(
    @Body() payload: any,
    @Query('hash') hash: string,
  ) {
    // 1. Kiểm tra mã băm bảo mật
    const expectedHash = this.configService.get<string>('GHTK_WEBHOOK_SECRET_HASH');
    if (expectedHash && hash !== expectedHash) {
      this.logger.warn(`Unauthorized webhook call with invalid hash: ${hash}`);
      throw new UnauthorizedException('Invalid webhook signature');
    }

    this.logger.log(`Received GHTK Webhook for order: ${payload.partner_id}, label: ${payload.label_id}, status: ${payload.status_id}`);

    try {
      const partnerId = payload.partner_id; // Mã Delivery Order phía Hula ERP
      const statusId = Number(payload.status_id);

      // 2. Tìm phiếu giao hàng trong Hula ERP
      const delivery = await this.deliveryRepo.findOne({
        where: [{ code: partnerId }, { tracking_code: payload.label_id }],
      });

      if (!delivery) {
        this.logger.warn(`Delivery Order not found for partner_id: ${partnerId}`);
        return { success: true, message: 'Order not found in ERP, skipped' };
      }

      // 3. Ánh xạ trạng thái
      const newStatus = GHTK_STATUS_MAP[statusId];
      if (newStatus && delivery.status !== 'COMPLETED') {
        delivery.status = newStatus;
      }

      // 4. Nếu có ảnh xác thực phát hàng POD thì lưu vào attachments
      if (payload.pod?.proof_url?.length) {
        const currentAttachments = delivery.attachments || [];
        delivery.attachments = Array.from(new Set([...currentAttachments, ...payload.pod.proof_url]));
      }

      if (payload.fee) {
        delivery.shipping_cost = Number(payload.fee);
      }

      if (payload.reason) {
        delivery.note = (delivery.note ? delivery.note + ' | ' : '') + `[GHTK]: ${payload.reason}`;
      }

      await this.deliveryRepo.save(delivery);

      // Luôn trả về 200 OK
      return { success: true };
    } catch (error) {
      this.logger.error(`Error processing GHTK webhook: ${error.message}`, error.stack);
      // Vẫn trả về 200 OK để tránh GHTK spam retry nếu lỗi do logic nội bộ ERP
      return { success: true, error: error.message };
    }
  }
}
```

---

## 4. Tương tác Người Dùng Trên Frontend (React UI Flow)

Trên màn hình quản lý Phiếu xuất kho / Giao hàng (`SalesDeliveryDetail.tsx`):

1. **Khối chọn Nhà vận chuyển (Carrier Selection)**:
   - Dropdown chọn: `Giao Hàng Tiết Kiệm (GHTK)`.
   - Hiển thị nút **"Ước tính cước GHTK"**: Gọi API backend `GET /api/shipping/ghtk/fee` hiển thị cước vận chuyển dự kiến (cước chính, phí bảo hiểm, phụ phí).
2. **Nút bấm "Tạo đơn GHTK" (Push to GHTK)**:
   - Backend tự động thu thập thông tin người nhận, trọng lượng từ BOM/Sản phẩm, tạo payload chuẩn.
   - Khi thành công, hiển thị badge: `Đã kết nối GHTK - Mã vận đơn: S1.A1.2001297581`.
   - Có link click mở trực tiếp trang tra cứu: `https://i.ghtk.vn/S1.A1.2001297581`.
3. **Nút "In nhãn vận đơn" (Print Airway Bill)**:
   - Gọi `GET /api/shipping/ghtk/label/:deliveryId` trả về Blob PDF.
   - Tự động mở cửa sổ in (Print Dialog) hoặc tải PDF A6.
4. **Nút "Sẵn sàng lấy hàng" & "Hủy vận đơn"**:
   - Nếu kiện hàng đóng xong: Bấm "Báo Shipper lấy".
   - Nếu có sự cố xuất kho: Bấm "Hủy đơn GHTK" (chỉ kích hoạt khi đơn chưa sang trạng thái lấy hàng).
5. **Timeline hành trình đơn hàng**:
   - Hiển thị các mốc thời gian cập nhật realtime từ Webhook: *Chờ duyệt -> Shipper đang lấy -> Đang giao -> Giao thành công (Kèm ảnh ký nhận POD)*.
