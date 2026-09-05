# Cơ Chế Webhook & Bảng Mã Trạng Thái Đơn Hàng GHTK

Tài liệu này đặc tả cơ chế lắng nghe cập nhật tự động (Webhook) từ GHTK về Hula ERP, bảng tra cứu toàn bộ 25+ mã trạng thái vận chuyển (`status_id`), các mã lý do chậm/hủy (`reason_code`) và kiến trúc xử lý Idempotency chống trùng lặp.

---

## 1. Cơ chế hoạt động của Webhook

Thay vì Hula ERP phải liên tục gọi API tra cứu (polling) gây lãng phí tài nguyên, GHTK sẽ chủ động gửi HTTP POST Request tới **Callback URL** của Hula ERP ngay khi có sự thay đổi trạng thái kiện hàng (Shipper nhận hàng, đang giao, giao thành công, hoãn giao, hoàn hàng...).

### 1.1. Cấu hình Callback URL
* Doanh nghiệp cung cấp Callback URL trên Cổng khách hàng GHTK hoặc gửi đăng ký qua bộ phận hỗ trợ kỹ thuật:
  ```
  https://api.hula-erp.vn/api/webhooks/shipping/ghtk?hash={GHTK_WEBHOOK_SECRET_HASH}
  ```

### 1.2. Định dạng Request từ GHTK gửi sang
GHTK có thể gửi dưới 2 định dạng (tùy cấu hình tài khoản):
1. `application/x-www-form-urlencoded`
2. `application/json`

#### Dữ liệu mẫu (JSON):
```json
{
  "partner_id": "DO-260905-001",
  "label_id": "S1.A1.2001297581",
  "status_id": 5,
  "action_time": "2026-09-06T15:45:00+07:00",
  "reason_code": "",
  "reason": "",
  "weight": 1.2,
  "fee": 30400,
  "pick_money": 375000,
  "return_part_package": 0,
  "cur_station": {
    "address_l0": "VN",
    "address_l1": "TP. Hồ Chí Minh",
    "address_l2": "Quận 1",
    "address_l3": "Phường Bến Nghé",
    "site_name": "Bưu cục GHTK Bến Nghé"
  },
  "pod": {
    "proof_url": [
      "https://cache.giaohangtietkiem.vn/d/pod-sample-signature.jpg",
      "https://cache.giaohangtietkiem.vn/d/pod-sample-package.jpg"
    ]
  }
}
```

### 1.3. Quy tắc bắt buộc khi phản hồi Webhook (HTTP 200 OK)
* Backend Hula ERP **bắt buộc phải trả về HTTP 200 OK** trong thời gian < 3 giây.
* Nếu server ERP trả về `HTTP 500`, `HTTP 404`, hoặc bị `Timeout`, GHTK xem như thất bại và sẽ tự động gửi lại nhiều lần (Retry policy).

```http
HTTP/1.1 200 OK
Content-Type: application/json

{"success": true}
```

---

## 2. Bảng ánh xạ Mã trạng thái đơn hàng (Order Status Details)

Bảng dưới đây ánh xạ giữa mã `status_id` của GHTK và trạng thái trong bảng `sales_deliveries` của Hula ERP:

| GHTK `status_id` | Tên trạng thái GHTK (Tiếng Việt) | Diễn giải chi tiết | Trạng thái ánh xạ Hula ERP | Hành động nghiệp vụ trong Hula ERP |
| :---: | :--- | :--- | :--- | :--- |
| **`-1`** | **Đã hủy đơn hàng** | Đơn hàng đã bị hủy thành công (bởi Shop hoặc do lỗi điều phối). | `CANCELLED` | Mở lại phiếu xuất, hoàn tồn kho hoặc hủy phiếu giao hàng. |
| **`1`** | **Chưa tiếp nhận** | Đơn vừa đăng lên GHTK, đang chờ hệ thống duyệt. | `PENDING_EXPORT` | Chờ duyệt. |
| **`2`** | **Đã tiếp nhận** | GHTK đã duyệt đơn, đang tìm shipper đến lấy hàng. | `PENDING_EXPORT` | Kho chuẩn bị sẵn sàng hàng hóa và in nhãn. |
| **`12`** | **Đang đi lấy hàng** | Shipper đang trên đường tới kho của doanh nghiệp. | `PENDING_EXPORT` | Xuất kiện hàng ra quầy chờ bàn giao. |
| **`3`** | **Đã lấy hàng / Đã nhập kho** | Shipper đã nhận hàng từ kho và nhập về bưu cục trung chuyển. | `SHIPPED` | Chính thức trừ kho xuất bán, đánh dấu đơn hàng đang trên đường đi. |
| **`4`** | **Đang giao hàng** | Shipper bưu cục đích đang đi phát hàng cho khách. | `SHIPPED` | Bật cờ "Đang phát hàng", thông báo cho Sales/Khách nếu cần. |
| **`5`** | **Đã giao hàng thành công** | Khách đã nhận hàng và ký nhận (POD). | `COMPLETED` | Cập nhật hoàn thành giao hàng, lưu link ảnh POD ký nhận. |
| **`6`** | **Đã đối soát giao hàng** | GHTK đã thanh toán tiền COD và cước phí vào tài khoản công ty. | `COMPLETED` | Đồng bộ dữ liệu sang Module Tài chính/Kế toán để gạch nợ. |
| **`7`** | **Lấy hàng thất bại** | Shipper không lấy được hàng quá 3 lần hoặc shop báo hoãn. | `PENDING_EXPORT` | Thông báo kho kiểm tra lại lý do (`reason_code`). |
| **`8`** | **Hoãn lấy hàng (Delay)** | Shipper báo trễ lấy hàng vì thời tiết, quá tải hoặc shop hẹn ca sau. | `PENDING_EXPORT` | Cập nhật thời gian dự kiến lấy mới. |
| **`9`** | **Giao hàng thất bại** | Shipper phát hàng không thành công qua 3 lần -> Chuyển sang quy trình hoàn. | `FAILED` | Báo động nhân viên Sales gọi điện chăm sóc khách hàng xử lý gấp. |
| **`10`** | **Hoãn giao hàng (Delay)** | Khách hẹn lại giờ, sai số điện thoại, thời tiết mưa bão... | `SHIPPED` | Ghi chú lý do trễ giao để nhân viên theo dõi. |
| **`11`** | **Đã đối soát đơn chuyển hoàn** | GHTK đã hoàn tất quyết toán phí hoàn của đơn không giao được. | `RETURNED` | Trừ phí hoàn vào chi phí vận chuyển của công ty. |
| **`13`** | **Đơn bồi thường** | Kiện hàng bị mất mát, bể vỡ trong quá trình vận chuyển của GHTK. | `COMPENSATION` | Tạo phiếu khiếu nại bồi thường giá trị bảo hiểm (`order.value`). |
| **`20`** | **Đang chuyển hoàn** | Kiện hàng đang trên đường quay trở lại kho của doanh nghiệp. | `RETURNING` | Báo kho chuẩn bị nhận hàng hoàn. |
| **`21`** | **Đã trả hàng về kho** | Kho công ty đã nhận lại kiện hàng hoàn thành công. | `RETURNED` | Tạo phiếu nhập kho hàng hoàn trả lại kho xuất. |
| **`26`** | **Nhập kho hàng trả** | Kiện hàng hoàn đang nằm tại kho trung chuyển của GHTK. | `RETURNING` | Lưu vết di chuyển của kiện hoàn. |
| **`30`** | **Đến điểm trung chuyển** | Kiện hàng đã đến kho phân loại trung gian (Hub). | `SHIPPED` | Cập nhật vị trí trạm `cur_station`. |
| **`31`** | **Rời điểm trung chuyển** | Kiện hàng đã xuất kho trung chuyển để đi tiếp. | `SHIPPED` | Cập nhật vị trí trạm `cur_station`. |
| **`91`** | **Đến bưu cục đích** | Kiện hàng đã tới bưu cục phụ trách phát cho khách. | `SHIPPED` | Sắp phát hàng. |

> [!NOTE]
> Các mã trạng thái nội bộ shipper: `123` (Báo đã lấy), `127` (Báo không lấy được), `128` (Báo delay lấy), `45` (Báo đã giao), `49` (Báo không giao được), `410` (Báo delay giao) là các thông báo bước đệm, GHTK sẽ chuẩn hóa về các mã chính (`3`, `5`, `9`, `10`).

---

## 3. Bảng mã lý do (Reason Codes)

Khi đơn hàng gặp sự cố hoãn hoặc thất bại, trường `reason_code` sẽ chứa các mã định danh sau:

### 3.1. Lấy hàng thất bại (`status_id = 7`)
* `110`: Địa chỉ lấy hàng nằm ngoài vùng phục vụ của GHTK.
* `111`: Hàng hóa thuộc danh mục cấm vận chuyển (cháy nổ, chất lỏng cấm...).
* `112`: Shop chủ động yêu cầu hủy lấy hàng.
* `113`: Shipper đã ghé lấy quá 3 lần không thành công.
* `115`: Đối tác hủy đơn thông qua API Hula ERP.

### 3.2. Hoãn lấy hàng (`status_id = 8`)
* `100`: Shop yêu cầu dời sang ca sau.
* `101`: Shipper gọi điện cho shop không bắt máy.
* `102`: Kiện hàng chưa đóng gói xong.
* `103`: Shop yêu cầu đổi địa chỉ kho lấy.
* `105`: Shipper bị quá tải khu vực.
* `106`: Yếu tố khách quan (mưa bão ngập lụt, kẹt xe).

### 3.3. Hoãn giao hàng (`status_id = 10`)
* `120`: Shipper quá tải ca phát.
* `121`: Khách yêu cầu dời lịch giao sang ca sau.
* `122`: Không liên lạc được với người nhận (máy bận, tắt máy).
* `123`: Khách hẹn giao ngày khác.
* `124`: Khách đổi địa chỉ giao hàng mới.
* `125`: Địa chỉ giao hàng ghi sai, cần shop xác nhận lại.
* `126`: Yếu tố khách quan (thời tiết, phong tỏa...).
* `1200`: Số điện thoại người nhận bị sai số.

### 3.4. Giao hàng thất bại / Chuyển hoàn (`status_id = 9`)
* `130`: Khách từ chối nhận hàng (không ưng, không đặt, hết tiền...).
* `131`: Shipper gọi điện quá 3 lần trong 3 ngày không liên lạc được.
* `132`: Khách hẹn dời lịch quá 3 lần.
* `133`: Shop yêu cầu hủy đơn và chuyển hoàn về.
* `135`: Đối tác hủy đơn qua API.

---

## 4. Giải pháp kỹ thuật xử lý Webhook an toàn & Idempotency

### 4.1. Chống gửi trùng lặp (Idempotency)
GHTK có thể gửi lại cùng 1 sự kiện nếu đường truyền mạng chập chờn. Giải pháp trong Hula ERP:
1. Tạo bảng `shipping_webhook_logs` trong cơ sở dữ liệu:
   ```sql
   CREATE TABLE shipping_webhook_logs (
       id SERIAL PRIMARY KEY,
       carrier VARCHAR(20) DEFAULT 'GHTK',
       tracking_code VARCHAR(50) NOT NULL,
       partner_id VARCHAR(100),
       status_id INT NOT NULL,
       action_time TIMESTAMP WITH TIME ZONE NOT NULL,
       raw_payload JSONB,
       processed BOOLEAN DEFAULT FALSE,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       CONSTRAINT uq_ghtk_event UNIQUE (tracking_code, status_id, action_time)
   );
   ```
2. Nếu nhận request có `(tracking_code, status_id, action_time)` đã tồn tại: lập tức trả về `200 OK` mà không thực hiện xử lý lại nghiệp vụ.

### 4.2. Bảo mật xác thực Request từ GHTK
* Gắn mã băm bí mật trên query params: `?hash={GHTK_WEBHOOK_SECRET_HASH}`.
* Controller kiểm tra nếu `req.query.hash !== process.env.GHTK_WEBHOOK_SECRET_HASH` thì từ chối ngay với HTTP `401 Unauthorized`.
* Hỗ trợ whitelist IP dải máy chủ của GHTK nếu cần gia tăng an ninh mạng.

### 4.3. Lưu trữ ảnh bằng chứng giao hàng (POD - Proof of Delivery)
Khi `status_id = 5`, GHTK trả về mảng link ảnh `pod.proof_url`. Hula ERP sẽ lưu trực tiếp vào trường `attachments` hoặc `pod_urls` của thực thể `SalesDelivery` để đối soát khi khách khiếu nại.
