# Đặc Tả Kỹ Thuật API GHTK (API Reference)

Tài liệu này cung cấp chi tiết kỹ thuật toàn diện về các API của **Giao Hàng Tiết Kiệm (GHTK)** để đội ngũ kỹ sư Hula ERP lập trình kết nối hệ thống.

---

## 1. Quy chuẩn chung

### 1.1. Base URL
* **Staging**: `https://services-staging.ghtklab.com`
* **Production**: `https://services.giaohangtietkiem.vn`

### 1.2. Authentication Headers (Bắt buộc trên mọi Request)
```http
Token: {API_TOKEN}
X-Client-Source: {PARTNER_CODE}
Content-Type: application/json
```

---

## 2. Danh sách Endpoints chi tiết

### 2.1. API Đăng Đơn Hàng (Submit Order)

API tiếp nhận thông tin đơn giao hàng từ Hula ERP, tạo vận đơn trên hệ thống GHTK và phân bổ nhân viên giao nhận (shipper).

* **Method**: `POST`
* **Path**: `/services/shipment/order` (hoặc `/services/shipment/order/?ver=1.5`)
* **Content-Type**: `application/json`

#### Cấu trúc Request Body mẫu:
```json
{
  "products": [
    {
      "name": "Thùng carton 30x20x15cm (Đóng gói 50 cái)",
      "weight": 0.8,
      "quantity": 2,
      "product_code": "PROD-PACK-001",
      "price": 150000
    },
    {
      "name": "Băng keo dán thùng 5cm",
      "weight": 0.3,
      "quantity": 3,
      "product_code": "PROD-TAPE-002",
      "price": 25000
    }
  ],
  "order": {
    "id": "DO-260905-001",
    "pick_name": "Kho Tổng Hula Packaging",
    "pick_tel": "0901234567",
    "pick_address_id": 88256,
    "pick_address": "Khu Công Nghiệp Tân Bình, 105 Lĩnh Nam",
    "pick_province": "Hà Nội",
    "pick_district": "Quận Hoàng Mai",
    "pick_ward": "Phường Mai Động",
    "name": "Nguyễn Văn Khách",
    "tel": "0987654321",
    "address": "Phòng 502, Tòa A, 123 Nguyễn Chí Thanh",
    "province": "TP. Hồ Chí Minh",
    "district": "Quận 1",
    "ward": "Phường Bến Nghé",
    "hamlet": "Khác",
    "is_freeship": "1",
    "pick_money": 375000,
    "value": 375000,
    "transport": "fly",
    "pick_option": "cod",
    "note": "Hàng bao bì giấy dễ móp méo, giao giờ hành chính",
    "tags": [1, 10]
  }
}
```

#### Bảng tham số chi tiết - Đối tượng `order`:

| Tham số | Kiểu dữ liệu | Bắt buộc | Giới hạn | Ý nghĩa & Mô tả |
| :--- | :--- | :---: | :--- | :--- |
| `id` | String | **Y** | 250 ký tự | Mã đơn hàng phía đối tác (Sử dụng mã phiếu xuất kho `SalesDelivery.code`). Không được trùng. |
| `pick_name` | String | **Y** | 500 ký tự | Tên người liên hệ phía gửi hàng. |
| `pick_tel` | String | **Y** | 150 ký tự | Số điện thoại người gửi hàng. |
| `pick_address_id` | Integer | N | Integer | Mã địa chỉ kho lấy hàng đã cấu hình trên GHTK Shop. Ưu tiên sử dụng trường này nếu có. |
| `pick_address` | String | **Y** | 255 ký tự | Địa chỉ chi tiết nơi lấy hàng (Ví dụ: Số 5, Ngõ 45 đường XYZ). |
| `pick_province` | String | **Y** | 500 ký tự | Tỉnh/Thành phố lấy hàng (VD: Hà Nội). Không bắt buộc nếu có `pick_address_id`. |
| `pick_district` | String | **Y** | 500 ký tự | Quận/Huyện lấy hàng. Không bắt buộc nếu có `pick_address_id`. |
| `pick_ward` | String | N | 500 ký tự | Phường/Xã nơi lấy hàng. |
| `pick_street` | String | N | 500 ký tự | Đường/Phố nơi lấy hàng. |
| `name` | String | **Y** | 500 ký tự | Họ tên người nhận hàng. |
| `tel` | String | **Y** | 150 ký tự | Số điện thoại người nhận hàng. |
| `address` | String | **Y** | 500 ký tự | Địa chỉ chi tiết người nhận (Số nhà, tòa nhà, ngõ ngách). |
| `province` | String | **Y** | 500 ký tự | Tỉnh/Thành phố người nhận hàng. |
| `district` | String | **Y** | 500 ký tự | Quận/Huyện người nhận hàng. |
| `ward` | String | N | 500 ký tự | Phường/Xã người nhận hàng. |
| `street` | String | N | 500 ký tự | Đường/Phố người nhận hàng. |
| `hamlet` | String | **Y** | 500 ký tự | Địa chỉ cấp 4 (Thôn/Ấp/Tổ dân phố). Nếu không có, điền chuỗi `"Khác"`. |
| `is_freeship` | String/Int | N | `0` hoặc `1` | `1`: Shop miễn phí ship (Shipper chỉ thu `pick_money`). `0`: Khách trả ship (Shipper thu `pick_money + tiền ship`). Mặc định là `0`. |
| `pick_money` | Integer | **Y** | VNĐ | Số tiền cần thu hộ (COD). Nếu đã thanh toán trước (chuyển khoản), điền `0`. |
| `value` | Integer | **Y** | VNĐ | Giá trị khai giá bảo hiểm hàng hóa. GHTK bồi thường rủi ro dựa trên giá trị này. |
| `note` | String | N | Tối đa 120 ký tự | Ghi chú giao hàng (VD: Cho xem hàng, gọi trước khi giao). |
| `transport` | String | N | 10 ký tự | Hình thức vận chuyển: `"fly"` (đường bay) hoặc `"road"` (đường bộ). Tự động fallback nếu không hỗ trợ bay. |
| `pick_option` | String | N | 10 ký tự | `"cod"`: Shipper đến lấy tại kho/shop (mặc định). `"post"`: Shop tự mang hàng ra bưu cục GHTK gửi. |
| `deliver_option` | String | N | 10 ký tự | Dịch vụ giao: để trống (mặc định Express), hoặc `"xteam"` (Dịch vụ hỏa tốc XFAST). |
| `tags` | Array[Int] | N | Mảng số nguyên | Danh sách nhãn đặc biệt: `[1]`: Dễ vỡ, `[10]`: Cho xem hàng, `[11]`: Cho thử hàng... (Xem mục Tag). |
| `use_return_address`| Int | N | `0` hoặc `1` | `0`: Trả hàng về kho lấy (mặc định). `1`: Trả hàng về địa chỉ trả khác (kèm các trường `return_*`). |

#### Bảng tham số chi tiết - Mảng `products`:

| Tham số | Kiểu dữ liệu | Bắt buộc | Mô tả |
| :--- | :--- | :---: | :--- |
| `name` | String | **Y** | Tên sản phẩm hàng hóa. |
| `weight` | Double | **Y** | Trọng lượng sản phẩm. **Đơn vị: KILOGRAM (KG)**. Ví dụ `0.5` cho 500g. |
| `quantity` | Integer | N | Số lượng sản phẩm (mặc định 1). |
| `product_code` | String/Int | N | Mã SKU sản phẩm phía ERP hoặc mã hàng trên hệ thống GHTK. |
| `price` | Integer | N | Giá bán sản phẩm (VNĐ). |

#### Danh mục Nhãn đơn hàng (`tags`):
* `1` - **Dễ vỡ**: Phụ phí 1.000đ/đơn. GHTK cam kết đền bù nếu hư vỡ.
* `2` - **Giá trị cao**: Hàng > 3.000.000đ (phí bảo hiểm 0.5% giá trị, tối đa đền bù 20.000.000đ).
* `7` - **Hàng nông sản / thực phẩm khô**: Thời gian lưu kho không quá 7 ngày.
* `10` - **Cho xem hàng**: Khách được kiểm tra ngoại quan trước khi nhận.
* `11` - **Cho thử hàng / Đồng kiểm**: Phụ phí 2.000đ/đơn (không xé tem niêm phong).
* `13` - **Gọi cho shop khi không giao được**: Shipper liên hệ shop trước khi tạo báo hủy.
* `17` - **Giao hàng 1 phần**: Khách nhận 1 số món, trả về các món còn lại.
* `20` - **Hàng nguyên hộp**: Phụ phí 1.000đ/đơn.
* `81` - **Dịch vụ BBS Eco**: Dành cho hàng nặng/cồng kềnh.

#### Phản hồi thành công:
```json
{
  "success": true,
  "message": "Đăng đơn hàng thành công",
  "order": {
    "partner_id": "DO-260905-001",
    "label": "S1.A1.2001297581",
    "area": "1",
    "fee": "30400",
    "insurance_fee": "15000",
    "tracking_id": 2001297581,
    "estimated_pick_time": "Sáng 2026-09-06",
    "estimated_deliver_time": "Chiều 2026-09-07",
    "products": [],
    "status_id": 2
  }
}
```

#### Phản hồi lỗi trùng mã đơn (`ORDER_ID_EXIST`):
GHTK không cho phép đẩy lại mã đơn đã có trên hệ thống:
```json
{
  "success": false,
  "message": "Mã đơn hàng của bạn đã tồn tại trên hệ thống GHTK",
  "error": {
    "code": "ORDER_ID_EXIST",
    "partner_id": "DO-260905-001",
    "ghtk_label": "S1.A1.1737345",
    "created": "2026-09-05T10:15:00+07:00",
    "status": 2
  }
}
```

---

### 2.2. API Tính Cước Phí Vận Chuyển (Calculate Fee)

Dùng để hiển thị trước phí ship cho nhân viên kinh doanh / nhân viên xuất kho trước khi tạo vận đơn chính thức.

* **Method**: `GET`
* **Path**: `/services/shipment/fee`
* **Query Parameters**:

| Tham số | Bắt buộc | Mô tả |
| :--- | :---: | :--- |
| `pick_address_id` | N | Mã kho lấy hàng (Nếu có thì không cần gửi `pick_province`, `pick_district`). |
| `pick_province` | **Y*** | Tỉnh/thành nơi lấy hàng (*Bắt buộc nếu không có pick_address_id). |
| `pick_district` | **Y*** | Quận/huyện nơi lấy hàng. |
| `province` | **Y** | Tỉnh/thành người nhận. |
| `district` | **Y** | Quận/huyện người nhận. |
| `address` | N | Địa chỉ chi tiết người nhận. |
| `weight` | **Y** | Tổng trọng lượng kiện hàng tính bằng **GRAM (g)**. Ví dụ: `1500` (= 1.5kg). |
| `value` | N | Giá trị đơn hàng để tính phí bảo hiểm (VNĐ). |
| `transport` | N | `"fly"` hoặc `"road"`. |
| `deliver_option` | **Y** | `"xteam"` (nếu hỏa tốc) hoặc `"none"` (chuẩn Express). |
| `tags[]` | N | Danh sách tag phụ phí (Ví dụ `tags[]=1` cho hàng dễ vỡ). |

#### Request mẫu:
```http
GET /services/shipment/fee?pick_province=Hà+Nội&pick_district=Quận+Hoàng+Mai&province=TP.+Hồ+Chí+Minh&district=Quận+1&address=123+Nguyễn+Chí+Thanh&weight=1200&value=500000&deliver_option=none HTTP/1.1
Host: services.giaohangtietkiem.vn
Token: {API_TOKEN}
X-Client-Source: {PARTNER_CODE}
```

#### Phản hồi mẫu:
```json
{
  "success": true,
  "message": "",
  "fee": {
    "name": "area1",
    "fee": 35400,
    "ship_fee_only": 30400,
    "insurance_fee": 2500,
    "delivery": true,
    "extFees": [
      {
        "display": "(+ 2,500 đ)",
        "title": "Phí bảo hiểm",
        "amount": 2500,
        "type": "insurance"
      },
      {
        "display": "(+ 2,500 đ)",
        "title": "Phụ phí gia cố",
        "amount": 2500,
        "type": "reinforced"
      }
    ]
  }
}
```

> [!NOTE]
> Nếu `delivery: false`, GHTK chưa mở tuyến giao nhận tới địa chỉ quận/huyện được yêu cầu.

---

### 2.3. API Tra Cứu Trạng Thái Đơn Hàng (Get Order Status)

Dùng để truy vấn thủ công tình trạng đơn hàng bằng Mã vận đơn GHTK hoặc Mã phiếu giao hàng ERP.

* **Method**: `GET`
* **Path**: `/services/shipment/v2/{ORDER_CODE}`
  - Tra cứu theo GHTK Label ID: `/services/shipment/v2/S1.A1.2001297581`
  - Tra cứu theo Partner ID: `/services/shipment/v2/partner_id:DO-260905-001`

#### Phản hồi mẫu:
```json
{
  "success": true,
  "message": "",
  "order": {
    "label_id": "S1.A1.2001297581",
    "partner_id": "DO-260905-001",
    "status": 4,
    "status_text": "Đang giao hàng",
    "created": "2026-09-05 10:15:20",
    "modified": "2026-09-05 14:30:10",
    "message": "Giao giờ hành chính",
    "pick_date": "2026-09-05",
    "deliver_date": "2026-09-06",
    "customer_fullname": "Nguyễn Văn Khách",
    "customer_tel": "0987654321",
    "address": "123 Nguyễn Chí Thanh, Quận 1, TP Hồ Chí Minh",
    "ship_money": 30400,
    "insurance": 2500,
    "value": 500000,
    "weight": 1.2,
    "pick_money": 375000,
    "is_freeship": 1
  }
}
```

---

### 2.4. API Hủy Đơn Hàng (Cancel Order)

Dùng khi nhân viên hủy xuất kho hoặc khách hàng hủy mua trước khi Shipper đến lấy hàng.

* **Method**: `POST`
* **Path**: 
  - Hủy theo GHTK Label: `POST /services/shipment/cancel/{label_id}`
  - Hủy theo Partner ID: `POST /services/shipment/cancel/partner_id:{partner_id}`

> [!WARNING]
> GHTK **chỉ cho phép hủy** đơn hàng khi đơn còn ở các trạng thái:
> * Status `1` (Chưa tiếp nhận)
> * Status `2` (Đã tiếp nhận)
> * Status `12` (Đang điều phối shipper đi lấy)
> 
> Một khi đơn đã chuyển sang trạng thái `3` (Đã lấy hàng về kho), API hủy đơn sẽ báo lỗi.

#### Phản hồi hủy thành công:
```json
{
  "success": true,
  "message": "Hủy đơn hàng thành công",
  "log_id": "c068086a911e2cb"
}
```

#### Phản hồi khi không thể hủy:
```json
{
  "success": false,
  "message": "Đơn đã lấy hàng, không thể hủy đơn.",
  "log_id": "d168086a917cd2a"
}
```

---

### 2.5. API In Nhãn Vận Đơn (Print Label)

#### A. In nhãn đơn lẻ (Single Order Label - PDF)
* **Method**: `GET`
* **Path**: `/services/label/{label_id}`
* **Response**: `application/pdf` (Stream nhị phân PDF để in trực tiếp bằng máy in nhiệt).

#### B. In nhãn nhiều đơn (Multiple Order Labels - PDF)
* **Method**: `GET`
* **Path**: `/open/api/v1/package/print-label`
* **Query Parameters**:
  - `pkg_orders`: Danh sách mã vận đơn (dạng rút gọn hoặc phân cách dấu phẩy, tối đa 100 đơn).
  - `original`: Hướng in (`landscape` hoặc `portrait`). Mặc định `landscape`.
  - `page_size`: Khổ giấy (`A6` hoặc `A5`). Mặc định `A6`.

#### C. Lấy dữ liệu mã vạch & QR Code Base64 (Raw Print Data)
* **Method**: `GET`
* **Path**: `/open/api/v1/package/print-label-info?pkg_order={id}`
* **Ứng dụng**: Cho phép Hula ERP tự thiết kế mẫu in riêng biệt có gắn logo công ty, kết hợp Barcode & QR Code do GHTK tạo sẵn.

---

### 2.6. API Xác Nhận Đã Sẵn Sàng Lấy Hàng (Ready to Ship)

Báo hiệu cho GHTK rằng kiện hàng đã được đóng gói hoàn tất tại kho, shipper có thể ghé lấy ngay.

* **Method**: `POST`
* **Path**: `/open/api/v1/package/ready-to-ship/confirm`
* **Body**:
```json
{
  "pkg_orders": [2001297581],
  "confirm_all": false
}
```

---

### 2.7. API Danh Sách Kho Lấy Hàng (List Pick Addresses)

Lấy danh sách các kho hàng/cửa hàng của doanh nghiệp đã cấu hình trên tài khoản GHTK. Dùng để cấu hình đồng bộ kho hàng trong Hula ERP.

* **Method**: `GET`
* **Path**: `/services/shipment/list_pick_add`

#### Phản hồi mẫu:
```json
{
  "success": true,
  "message": "",
  "data": [
    {
      "pick_address_id": "88256",
      "address": "Số nhà 105, ngõ 13 Lĩnh Nam, Phường Mai Động, Quận Hoàng Mai, Hà Nội",
      "pick_tel": "0901234567",
      "pick_name": "Kho Tổng Hà Nội"
    },
    {
      "pick_address_id": "88260",
      "address": "1312, Phường 1, Quận Bình Thạnh, TP Hồ Chí Minh",
      "pick_tel": "0901234568",
      "pick_name": "Kho Chi Nhánh HCM"
    }
  ]
}
```

---

### 2.8. API Chuẩn Hóa & Bóc Tách Địa Chỉ (Parse Address)

Tự động phân tách chuỗi địa chỉ người nhận thành 4 cấp: Tỉnh/Thành, Quận/Huyện, Phường/Xã, Thôn/Ấp.

* **Method**: `GET`
* **Path**: `/open/api/v1/address/parse-address?address=Số+10+Đội+Cấn+Ba+Đình+Hà+Nội`

#### Phản hồi mẫu:
```json
{
  "success": true,
  "message": "Get parse address success!",
  "data": {
    "province": { "id": 863, "name": "Hà Nội" },
    "district": { "id": 1975, "name": "Quận Ba Đình" },
    "ward": { "id": 16820, "name": "Phường Đội Cấn" },
    "hamlet": { "id": 731098, "name": "Đội Cấn" }
  }
}
```
