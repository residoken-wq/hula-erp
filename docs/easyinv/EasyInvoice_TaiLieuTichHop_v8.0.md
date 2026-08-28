**TÀI LIỆU TÍCH HỢP KỸ THUẬT HOÁ ĐƠN ĐIỆN TỬ**

**![][image1]**

# Mục lục

[Mục lục	2](#mục-lục)

[I. Giới thiệu	4](#giới-thiệu)

[II. Lịch sử cập nhật](#lịch-sử-cập-nhật)

[III. Mô tả đầu hàm](#mô-tả-đầu-hàm)

[IV. Xác thực](#xác-thực)

[V. Danh sách chi tiết đầu hàm](#danh-sách-chi-tiết-đầu-hàm)

[*Ghi chú 1: Phần tiếp theo của tài liệu này sử dụng từ ikey thay cho cụm từ “khoá tích hợp”. Đối với mỗi khách hàng, khoá tích hợp là khoá duy nhất của hoá đơn tại client và được sử dụng để định danh hoá đơn đó mỗi khi tương tác với server.	5*](#ghi-chú-1:-phần-tiếp-theo-của-tài-liệu-này-sử-dụng-từ-ikey-thay-cho-cụm-từ-“khóa-tích-hợp”.-Đối-với-mỗi-khách-hàng,-khóa-tích-hợp-là-khóa-duy-nhất-của-hoá-đơn-tại-client-và-được-sử-dụng-để-định-danh-hóa-đơn-đó-mỗi-khi-tương-tác-với-server.)

[*Ghi chú 2: Các API được đánh ký hiệu BETA chưa phải bản chính thức.	5*](#ghi-chú-2:-các-api-được-đánh-ký-hiệu-beta-chưa-phải-bản-chính-thức.)

[1\. Tạo hóa đơn (bản nháp, chưa ký số, chưa có số hóa đơn)	6](#tạo-hóa-đơn-\(bản-nháp,-chưa-ký-số,-chưa-có-số-hóa-đơn\))

[2\. Tạo hóa đơn (bản nháp, chờ ký, có số hóa đơn gửi từ client)	10](#tạo-hóa-đơn-\(bản-nháp,-chờ-ký,-có-số-hóa-đơn-gửi-từ-client\))

[3\. Tạo và phát hành hóa đơn (ký server)	15](#tạo-và-phát-hành-hóa-đơn-\(ký-server\))

[4\. Điều chỉnh hóa đơn (ký server)	20](#Điều-chỉnh-hóa-đơn-\(ký-server\))

[5\. Thay thế hóa đơn (ký server)	25](#thay-thế-hóa-đơn-\(ký-server\))

[6\. Hủy bỏ hóa đơn đã phát hành (đã ký số)	29](#hủy-bỏ-hóa-đơn-đã-phát-hành-\(đã-ký-số\))

[7\. Xóa bỏ hóa đơn chưa phát hành (chưa ký số)	31](#xóa-bỏ-hóa-đơn-chưa-phát-hành-\(chưa-ký-số\))

[8\. Kiểm tra trạng thái hóa đơn	32](#kiểm-tra-trạng-thái-hóa-đơn)

[9\. Xem hóa đơn	32](#heading=h.1ksv4uv)

[10\. Phát hành hóa đơn	34](#phát-hành-hóa-đơn)

[11\. Phát hành hóa đơn tạm (được tạo từ IV.10.2, ký client)	36](#phát-hành-hóa-đơn-tạm-\(được-tạo-từ-v.10.2,-ký-client\))

[12\. Thêm/Sửa thông tin khách hàng	38](#thêm/sửa-thông-tin-khách-hàng)

[13\. Thêm/Sửa thông tin sản phẩm, dịch vụ	39](#thêm/sửa-thông-tin-sản-phẩm,-dịch-vụ)

[14\. Tạo dải hoá đơn chờ ký	40](#tạo-dải-hoá-đơn-chờ-ký)

[15\. Tạo hoá đơn tạm (được lưu cache, ký client)	42](#tạo-hoá-đơn-tạm-\(được-lưu-cache,-ký-client\))

[16\. Phát hành hóa đơn tạm (được tạo từ IV.15, ký client)	45](#phát-hành-hóa-đơn-tạm-\(được-tạo-từ-v.15,-ký-client\))

[17\. Tạo hoá đơn thay thế tạm (được lưu cache, ký client)	46](#tạo-hoá-đơn-thay-thế-tạm-\(được-lưu-cache,-ký-client\))

[18\. Phát hành hóa đơn thay thế tạm (được tạo từ IV.17, ký client)	48](#phát-hành-hóa-đơn-thay-thế-tạm-\(được-tạo-từ-v.17,-ký-client\))

[19\. Tạo hoá đơn điều chỉnh tạm (được lưu cache, ký client)	49](#tạo-hoá-đơn-điều-chỉnh-tạm-\(được-lưu-cache,-ký-client\))

[20\. Phát hành hóa đơn điều chỉnh tạm (được tạo từ IV.19, ký client)	50](#phát-hành-hóa-đơn-điều-chỉnh-tạm-\(được-tạo-từ-iv.19,-ký-client\))

[21\. Tải báo cáo tình hình sử dụng hoá đơn	52](#tải-báo-cáo-tình-hình-sử-dụng-hoá-đơn)

[22\. Tải bảng kê chứng từ hàng hóa, dịch vụ bán ra	52](#tải-bảng-kê-chứng-từ-hàng-hóa,-dịch-vụ-bán-ra)

[23\. Danh sách số hoá đơn chờ ký	53](#danh-sách-số-hoá-đơn-chờ-ký)

[24\. Tải hoá đơn định dạng PDF/XML	54](#tải-hoá-đơn-định-dạng-pdf/xml)

[25\. Truy vấn thông tin hoá đơn theo tập khoá Ikeys	54](#truy-vấn-thông-tin-hoá-đơn-theo-tập-khoá-ikeys)

[26\. Tải hoá đơn XML/PDF theo mã tra cứu	56](#tải-hoá-đơn-xml/pdf-theo-mã-tra-cứu)

[27\. Truy vấn thông tin hoá đơn theo ngày hóa đơn	56](#truy-vấn-thông-tin-hoá-đơn-theo-ngày-hóa-đơn)

[28\. Gửi lại thông báo phát hành hoá đơn	58](#heading=)

[29\. Điều chỉnh hóa đơn (bản nháp, chưa ký số, chưa có số hoá đơn)	59](#Điều-chỉnh-hóa-đơn-\(bản-nháp,-chưa-ký-số,-chưa-có-số-hoá-đơn\))

[30\. Thay thế hóa đơn (bản nháp, chưa ký số, chưa có số hoá đơn)	60](#thay-thế-hóa-đơn-\(bản-nháp,-chưa-ký-số,-chưa-có-số-hoá-đơn\))

[31\. Xem trước hóa đơn	62](#xem-trước-hóa-đơn)

[32\. Thêm Ikey vào hoá đơn đã cấp số (hoá đơn được tạo trên web hoá đơn điện tử Easy Invoice)	62](#thêm-ikey-vào-hoá-đơn-đã-cấp-số-\(hoá-đơn-được-tạo-trên-web-hoá-đơn-điện-tử-easy-invoice\))

[33\. Tải hoá đơn định dạng XML theo tập mã khách hàng BETA	63](#tải-hoá-đơn-định-dạng-xml-theo-tập-mã-khách-hàng-beta)

[34\. Thông báo sai sót](#heading=)

[VI. Mô tả chi tiết các trường xml hoá đơn](#vi.-mô-tả-chi-tiết-các-trường-xml-hoá-đơn)	[64](#heading=)

VII. [**Phụ lục	66**](#vii.-phụ-lục)

[1\. Phương thức thanh toán (trường bắt buộc)	66](#phương-thức-thanh-toán-\(trường-bắt-buộc\))

[2\. Trạng thái hoá đơn	66](#trạng-thái-hoá-đơn)

[3\. Thuế suất	67](#thuế-suất)

[4\. Hoá đơn chờ ký	67](#hoá-đơn-chờ-ký)

[5\. Tên sản phẩm	67](#heading=h.4k668n3)

[6\. Chiết khấu (quan trọng)	67](#chiết-khấu-\(quan-trọng\))

[7\. Product Extra (thông tin bổ sung cho sản phẩm)	69](#product-extra-\(thông-tin-bổ-sung-cho-sản-phẩm\))

[8\. Trường sản phẩm ghi chú	69](#trường-sản-phẩm-ghi-chú)

[9\. Mẫu XmlReport (Kết quả trả về của API IV.19)	70](#mẫu-xmlreport-\(kết-quả-trả-về-của-api-iv.19\))

[10\. Mã lỗi tích hợp	72](#mã-lỗi-tích-hợp)

[11\. Feature	72](#feature)

[12\. Đơn vị tiền tệ	73](#Đơn-vị-tiền-tệ)

[13\. Danh mục mã lý do điều chỉnh/thay thế hoá đơn](#danh-mục-mã-lý-do-điều-chỉnh/thay-thế-hoá-đơn) 

14\. [Danh mục mã nhóm ngành nghề](#danh-mục-mã-nhóm-ngành-nghề)

15\. [Danh mục loại hàng hoá đặc trưng](#danh-mục-loại-hàng-hoá-đắc-trưng-\(-theo-phụ-lục-xv-của-thuế-cung-cấp\))

16\. [Danh mục mã quốc tịch](#danh-mục-mã-quốc-tịch-\(-theo-phụ-lục-xix-thuế-cung-cấp\))

17\. [Luồng gửi email hoá đơn](#luỒng-gỬi-mail-hÓa-ĐƠn)	[73](#heading=)

[1\. Hóa đơn kèm chứng từ bảng kê	74](#hóa-đơn-kèm-chứng-từ-bảng-kê)

[2\. Hóa đơn bán tài sản công	77](#hóa-đơn-bán-tài-sản-công)

[3\. Hóa đơn bán hàng dự trữ quốc gia	79](#hóa-đơn-bán-hàng-dự-trữ-quốc-gia)

[1\. Nội dung request	83](#nội-dung-request)

[2\. Nội dung XML Data	84](#nội-dung-xml-data)

[3\. Các thẻ khuyến nghị thêm để đảm bảo đủ thông tin chính xác nhất theo chuẩn dữ liệu thông tư 78\.	87](#các-thẻ-khuyến-nghị-thêm-để-đảm-bảo-đủ-thông-tin-chính-xác-nhất-theo-chuẩn-dữ-liệu-thông-tư-78.)

[3.1. Thẻ trong sản phẩm \<Products\>	87](#thẻ-trong-sản-phẩm-\<products\>)

[3.2. Thẻ trong hóa đơn](#thẻ-trong-hóa-đơn)

      4. [Thay đổi theo NĐ70 và 254](#thay-đổi-theo-nĐ70)

             4.1. [Bổ sung thêm thông tin bên mua vào thông tin Invoice](#bổ-sung-thêm-thông-tin-bên-mua-vào-thông-tin-invoice)

             4.2. [Hoá đơn đặc trưng bổ sung thông tin vào Extra Product](#hoá-đơn-đặc-trưng-bổ-sung-thông-tin-vào-extra-product) 

             4.3. [Huỷ hoá đơn](#huỷ-hoá-đơn) 

             4.4. [Hoá đơn chiết khấu](#hoá-đơn-chiết-khấu)	[87](#thẻ-trong-hóa-đơn)

1. # **Giới thiệu**

- EasyInvoice là giải pháp hóa đơn điện tử được nghiên cứu chuyên sâu phù hợp với mọi loại hình doanh nghiệp.  
- Host name, Username, Password: Easy Invoice sẽ cung cấp cụ thể khi phối hợp thực hiện tích hợp.

2. # **Lịch sử cập nhật** 

| Ngày cập nhật | Người thực hiện | Phiên bản | Mô tả |
| :---- | :---- | :---- | :---- |
|  |  |  |  |

# 

3. # **Mô tả đầu hàm**

- Giao thức http mặc định: Post  
- Resource: Hàm thực thi (ví dụ: “api/publish/importInvoice”)  
- Data: Định dạng Json  
  * Request: Xem chi tiết từng API  
  * Response:  
    * Thành công: ***Status*** luôn là *2*, ***Message*** luôn là *“Ok”* và **Data** là tuỳ chọn. Http status code: 200

  		{

  		  "Status": 2,

  		  "Message": "Ok",

  		  "ErrorCode": "0"

  		  "Data": {

  		    \<Giá trị phụ thuộc vào từng API\> 

  		  }

  		}

* Lỗi: ***Status*** luôn khác *2*, ***Message*** là mô tả lỗi chung, phụ thuộc vào từng API, chi tiết lỗi trả về trong **Data.KeyInvoiceMsg** (nếu có). Http status code khác 200, phụ thuộc vào lỗi. **ErrorCode** chứa mã lỗi. Chi tiết mã lỗi và cách xử lý trong :  
  https://docs.google.com/spreadsheets/d/1qYGrgXzux5WkwOo28otb\_rGBTfyOlFJkQxILzTeb9Co/edit 

  		{

  		  "Status": \<Giá trị khác 2\>,

  		  "Message": \<Giá trị phụ thuộc vào từng API, có tính chất mô tả chung\>,

  		  "ErrorCode": "Mã lỗi"

  		  "Data": {

  		    "KeyInvoiceMsg": {

  		      "ikey1": "Chi tiết lỗi của hoá đơn có ikey1",

  		      "ikey2": "Chi tiết lỗi của hoá đơn có ikey2"

  		    }

  		  }

  		}

4. # **Xác thực**

- Request header chứa thông tin xác thực có:  
  * Name: “Authentication”  
  * Value: Chuỗi xác thực  
- Chuỗi xác thực có cấu trúc như sau: *signature:nonce:timestamp:username:password*  
  * timestamp: Số giây từ mốc thời gian năm 1970, tháng 01, ngày 01, 00 giờ, 00 phút, 00 giây, 000 mili giây đến thời điểm hiện tại (tính theo giờ Utc).  
  * nonce: Chuỗi ký tự ngẫu nhiên chỉ bao gồm chữ cái và chữ số  
  * signature: Giá trị base64 của mã MD5 cho chuỗi được tạo từ sự kết hợp giữa Http Method, timestamp và nonce ghép liền theo đúng thứ tự, ví dụ: POST155350749068CFE3F19B4B4668AE7746A514FAF2CD  
  * username: Tên đăng nhập.  
  * password: Mật khẩu.  
- Ví dụ về tạo chuỗi xác thực trong C\#  cũ trước ngày 01/01/2026:

private static string GenerateToken(string httpMethod, string username, string password)  
{  
    DateTime epochStart \= new DateTime(1970, 01, 01, 0, 0, 0, 0, DateTimeKind.Utc);  
    TimeSpan timeSpan \= DateTime.UtcNow \- epochStart;  
    string timestamp \= Convert.ToUInt64(timeSpan.TotalSeconds).ToString();  
    string nonce \= Guid.NewGuid().ToString("N").ToLower();  
    string signatureRawData \= $"{httpMethod.ToUpper()}{timestamp}{nonce}";	

    using (MD5 md5 \= MD5.Create())  
    {  
        var hash \= md5.ComputeHash(Encoding.UTF8.GetBytes(signatureRawData));  
        var signature \= Convert.ToBase64String(hash);  
        return $"{signature}:{nonce}:{timestamp}:{username}:{password}";  
    }  
}

- Ví dụ về tạo chuỗi xác thực trong C\# mới từ ngày 01/01/2026:

private static string GenerateToken(string httpMethod, string username, string password, string TaxCode)  
{  
    DateTime epochStart \= new DateTime(1970, 01, 01, 0, 0, 0, 0, DateTimeKind.Utc);  
    TimeSpan timeSpan \= DateTime.UtcNow \- epochStart;  
    string timestamp \= Convert.ToUInt64(timeSpan.TotalSeconds).ToString();  
    string nonce \= Guid.NewGuid().ToString("N").ToLower();  
    string signatureRawData \= $"{httpMethod.ToUpper()}{timestamp}{nonce}";

    using (MD5 md5 \= MD5.Create())  
    {  
        var hash \= md5.ComputeHash(Encoding.UTF8.GetBytes(signatureRawData));  
        var signature \= Convert.ToBase64String(hash);  
        return $"{signature}:{nonce}:{timestamp}:{username}:{password}:{TaxCode}";  
    }  
}

- Demo và tạo chuỗi xác thực trong một số ngôn ngữ khác:

[*https://git-sds.softdreams.vn:7990/projects/EINV/repos/easyinvoice-integration-demo/browse*](https://git-sds.softdreams.vn:7990/projects/EINV/repos/easyinvoice-integration-demo/browse)

* *Triển khai domain chung và cơ chế xác thực mới:*  
- Hệ thống EasyInvoice triển khai domain mới: ***https://***[**api.easyinvoice.vn](http://api.easyinvoice.vn)** thay vì domain cũ MST.easyinvoice.vn  
- Thay đổi cơ chế xác thực cũ: Bổ sung thêm thông tin mã số thuế **taxCode**. Khi đó Request header chứa thông tin xác thực sẽ có:  
+ Name: “Authentication”  
+ Value: Chuỗi xác thực

Trong đó, Chuỗi xác thực có cấu trúc như sau: *signature:nonce:timestamp:username:password:taxCode*

+ timestamp: Số giây từ mốc thời gian năm 1970, tháng 01, ngày 01, 00 giờ, 00 phút, 00 giây, 000 mili giây đến thời điểm hiện tại (tính theo giờ Utc).  
+ nonce: Chuỗi ký tự ngẫu nhiên chỉ bao gồm chữ cái và chữ số  
+ signature: Giá trị base64 của mã MD5 cho chuỗi được tạo từ sự kết hợp giữa Http Method, timestamp và nonce ghép liền theo đúng thứ tự, ví dụ: POST155350749068CFE3F19B4B4668AE7746A514FAF2CD  
+ username: Tên đăng nhập.  
+ password: Mật khẩu  
+ taxCode: Mã số thuế

*Lưu ý: khách hàng muốn sử dụng domain trang demo để test chức năng thì sử dụng **http://api.softdreams.vn/***

5. # **Danh sách chi tiết đầu hàm**

   # ***Ghi chú 1:*** Phần tiếp theo của tài liệu này sử dụng từ *ikey* thay cho cụm từ “*khóa tích hợp*”. Đối với mỗi khách hàng, khóa tích hợp là khóa duy nhất của hoá đơn tại client và được sử dụng để định danh hóa đơn đó mỗi khi tương tác với server.

   # ***Ghi chú 2:*** Các API được đánh ký hiệu **BETA** chưa phải bản chính thức. 

1. ## Tạo hóa đơn (bản nháp, chưa ký số, chưa có số hóa đơn)

   Resource: “**api/publish/importInvoice**”.  
   Data: {“XmlData”: “Chuỗi XML”, “Pattern”: “Ký hiệu hóa đơn”, “Serial”: “Ký hiệu mẫu số hóa đơn” }

**Mô tả: Tạo hóa đơn ở dạng chưa ký, chưa cấp số tại màn danh sách hóa đơn**

* **XmlData\***: Chuỗi Xml dữ liệu hóa đơn (xem cấu trúc cuối mục)  
* **Pattern**: Ký hiệu hóa đơn (cần có nếu dùng nhiều mẫu/ký hiệu)  
* **Serial**: Ký hiệu mẫu số hóa đơn của hóa đơn (cần có nếu dùng nhiều mẫu/ký hiệu)  
* **Trả về**: Json

| Kết quả trả về | Mô tả | Ghi chú |
| :---- | :---- | :---- |
| { “**Status**”: “2”, “**Message**”: “Ok”, “**ErrorCode**”: “0”, “**Data**”: {    “**Pattern**”: “Ký hiệu hóa đơn”,    “**Serial**”: “Ký hiệu mẫu số hóa đơn”,    “**Ikeys**”: \[“Ikey hoá đơn”\],    “**Invoices**”: \[       **Json object hoá đơn 1** (xem thuộc tính tại cột ghi chú),       **Json object hoá đơn 2** (xem thuộc tính tại cột ghi chú),      …     \]   } } | Thành công | Status 2: Thành công. Pattern: Ký hiệu hóa đơn của các hóa đơn đã phát hành. Serial: Ký hiệu mẫu số hóa đơn của dãy các hóa đơn phát hành. Ikey: Mã key duy nhất của hoá đơn Json object hoá đơn có cấu trúc như sau: { “**InvoiceStatus**”: Mã trạng thái của hóa đơn (xem phụ lục V.2), “**Buyer**”: “Người mua”, “**TaxAmount**”: “Tổng tiền thuế, **“PublishedBy”**: “Người phát hành”, “**Type”:** “Loại hoá đơn” “**Pattern**”: “Ký hiệu hóa đơn”, “**Serial**”: “Ký hiệu mẫu số hóa đơn”, “**No**”: “Số hoá đơn”, “**LookupCode**”: “Mã tra cứu”, “**Ikey**”: “khoá tích hợp ikey”, “**ArisingDate**”: “Ngày tạo lập”,   “**IssueDate**”: “Ngày phát hành”,   “**CustomerName**”: “Tên khách hàng”, “**CustomerCode**”: “Mã khách hàng”, “**CustomerTaxCode”** : “Mã số thuế của khách hàng”, “**Total**”: “Tổng tiền chưa thuế của hoá đơn”, “**Amount**”: “Giá trị hoá đơn”, “**LinkView”** : “Link tra cứu hoá đơn”, “**ModifiedDate**” : “Ngày sửa đổi”, “**IsSentTCTSummary”**: “Gửi thuế theo bảng tổng hợp \- true/fasle”, “**TCTCheckStatus**”: “trạng thái gửi Thuế”, “**TCTErrorMessage**”: “Lỗi gửi cơ quan Thuế”, “**TaxAuthorityCode**” : “mã cơ quan thuế cấp”, “**CusIdentification**” : “Số CCCD”, “**BudgetaryRelationshipCode**” : “Mã quan hệ ngân sách”, “**PassportNo**”: “Số hộ chiếu”  } |
| {   “**Status**”: “\<Mã trạng thái\>”,   “**Message**”: “\<Nội dung lỗi\>”,   “**ErrorCode**”: “\<Mã lỗi\>”,   “**Data**”: {     “**KeyInvoiceMsg**”: {        “**ikey1**”: “Chi tiết lỗi hđ1”,        “**ikey2**”: “Chi tiết lỗi hđ2”      }   } } | Thất bại. | Status 4: Lỗi từ phía client. Status 5: Lỗi từ phía server. KeyInvoiceMsg (tuỳ chọn) kiểu dictionary có Key là ikey hóa đơn (lấy từ đầu vào), Value là chi tiết lỗi hóa đơn tương ứng |


**Note:** 

* Chỉ chấp nhận request chứa tối đa 5000 hóa đơn.  
* Thông tin khách hàng trong hóa đơn sẽ được thêm mới, đồng thời tạo mới tài khoản tra cứu nếu chưa tồn tại trong hệ thống (chi tiết tài khoản được gửi về địa chỉ email cũng như hướng dẫn tra cứu mỗi khi có hóa đơn mới thuộc khách hàng đó được phát hành), hoặc được cập nhật nếu đã tồn tại trong hệ thống, khóa là trường CusCode (xem trong cấu trúc XmlData).  
* Hóa đơn sẽ được cập nhật thông tin nếu đã tồn tại hóa đơn có cùng ikey trong hệ thống và có trạng thái là mới tạo lập.

**Cấu trúc của XmlData (các trường high light là bắt buộc, các trường có gạch chân sẽ chỉ dành cho thông tư 78):**  
\<Invoices\>  
\<Inv\>  
\<Invoice\>  
\<Ikey\>**Giá trị khóa duy nhất của hóa đơn**\</Ikey\>  
**\<LocationCode\> Mã địa điểm kinh doanh (bắt buộc với HKD/CNKD) \</LocationCode\>**  
**\<LocationName\> Tên địa điểm kinh doanh (bắt buộc với HKD/CNKD)\</LocationName\>**  
**\<LocationAddress\>Địa chỉ địa điểm kinh doanh (bắt buộc với HKD/CNKD)\</LocationAddress\>**  
\<StoreCode\>**Mã cửa hàng**\</StoreCode\>  
\<StoreName\>**Tên cửa hàng**\</StoreName\>  
\<CusCode\>**Mã khách hàng**\</CusCode\>  
\<Buyer\>**Tên người mua hàng (bắt buộc với hoá đơn là hàng hoá đặc trưng loại 1\)**\</Buyer\>  
\<CusName\>**Tên khách hàng**\</CusName\>  
\<CusEmails\>**Danh sách Email \[ưu tiên sử dụng khi gửi mail ( xem luồng tại [VII.16](#luỒng-gỬi-mail-hÓa-ĐƠn)) \]\</**CusEmails\>  
\<Email\>**Email của khách nhận thông báo phát hành hoá đơn ( sử dụng  khi không có CusEmails và hệ thống tìm thấy Email trong Customer )**\</Email\>  
\<EmailCC\>**Danh sách email CC (ngăn cách bởi dấu phẩy) nhận thông báo phát hành hoá đơn ( sử dụng khi không có CusEmails và hệ thống tìm thấy EmailCC trong Customer )**\</EmailCC\>  
\<CusAddress\>**Địa chỉ khách hàng (bắt buộc với hoá đơn là hàng hoá đặc trưng loại 1\)**\</CusAddress\>  
\<CusBankName\>**Tên ngân hàng của khách hàng**\</CusBankName\>  
\<CusBankNo\>**Số tài khoản ngân hàng của khách hàng**\</CusBankNo\>  
\<CusPhone\>**Điện thoại khách hàng( bắt buộc với hoá đơn là hàng hoá đặc trưng loại 1\)**\</CusPhone\>  
\<CusTaxCode\>**Mã số thuế (Bắt buộc với KHDoanh nghiệp, bắt buộc với hoá đơn là hàng hoá đặc trưng loại 1)**\</CusTaxCode\>  
\<CusIdenification\> **Căn cước công dân người mua hàng ( bắt buộc với Hàng hoá đặc trưng loại 1\)**\</CusIdenification\>  
\<ProvinceCode\> **Mã tỉnh (Bắt buộc đối với hàng hóa đặc trưng loại 1\) ( xem tại [VII.18](#quyết-định-19/2025/qĐ-ttg))** \</ProvinceCode\>  
\<ProvinceName\> Tên tỉnh/thành phố **(Bắt buộc đối với hàng hóa đặc trưng loại 1)( xem tại [VII.18](#quyết-định-19/2025/qĐ-ttg))** \</ProvinceName \>  
\<CommuneCode\> **Mã xã** (**Bắt buộc đối với hàng hóa đặc trưng loại 1**) **( xem tại [VII.18](#quyết-định-19/2025/qĐ-ttg))**\</CommuneCode\>  
\<CommuneName \> Tên xã/phường  (**Bắt buộc đối với hàng hóa đặc trưng loại 1**) **( xem tại [VII.18](#quyết-định-19/2025/qĐ-ttg))\</**CommuneName **\>**  
\<PaymentMethod\>**Hình thức thanh toán bắt buộc (xem phụ lục V.1)**\</PaymentMethod\>  
\<ArisingDate\>**Ngày phát sinh hóa đơn (mặc định là ngày hiện tại, chuỗi định dạng dd/MM/yyyy)** \</ArisingDate\>  
\<ExchangeRate\>**Tỷ giá chuyển đổi**\</ExchangeRate\>  
\<CurrencyUnit\>**Đơn vị tiền tệ (ví dụ VND, USD)** \</CurrencyUnit\>  
\<Extra\>**Thông tin bổ sung (định dạng json có các thuộc tính theo quy ước riêng nếu có phát sinh)** \</Extra\>  
\<Products\>  
\<Product\>  
	\<Code\>**Mã sản phẩm\</**Code\>  
       \<No\>**Số thứ tự\</**No\>  
	\<Feature\>**Loại sản phẩm (xem phụ lục [V.11](#feature))\</**Feature\>  
\<ProdName\>**Tên sản phẩm**\</ProdName\>  
\<BusinessProdGroupCode \>**Mã nhóm ngành nghề (khuyễn khích thêm, không bắt buộc) (xem chi tiết ở [VII.14](#danh-mục-mã-nhóm-ngành-nghề))**\</BusinessProdGroupCode\>  
\<ProdUnit\>**Đơn vị tính**\</ProdUnit\>  
\<ProdQuantity\>**Số lượng**\</ProdQuantity\>  
\<ProdPrice\>**Đơn giá**\</ProdPrice\>  
\<Discount\>Tỉ lệ chiết khấu\</Discount\>  
\<DiscountAmount\>Tổng tiền chiết khấu\</DiscountAmount\>  
\<Total\>**Tổng tiền trước thuế**\</Total\>  
\<VATRate\>**Thuế suất (xem phụ lục [VII.3](#thuế-suất))** \</VATRate\>  
\<VATRateOther\>**Thuế suất trong trường hợp thuế khác (Khi VATRate \= \-3)**\</VATRateOther\>  
\<VATAmount\>**Tiền thuế**\</VATAmount\>  
\<Amount\>**Tổng tiền sau thuế**\</Amount\>  
\<Extra\>**Thông tin bổ sung (định dạng json có các thuộc tính theo quy ước riêng nếu có phát sinh)**\</Extra\>  
\</Product\>  
\</Products\>  
\<Total\>**Tổng tiền trước thuế**\</Total\>  
\<VATRate\>**Thuế GTGT (xem phụ lục [VII.3](#thuế-suất))**\</VATRate\>  
\<VATRateOther\>**Thuế suất trong trường hợp thuế khác (Khi VATRate \= \-3)**\</VATRateOther\>  
\<VATAmount\>**Tiền thuế GTGT**\</VATAmount\>  
\<Amount\>**Tổng tiền**\</Amount\>  
\<DiscountAmount\>**Tổng tiền chiết khấu**\</DiscountAmount\>  
\<GrossValue\>Tổng tiền trước thuế thuế KCT\</GrossValue\>  
\<GrossValue0\>Tổng tiền trước thuế thuế 0%\</GrossValue0\>  
\<GrossValue5\>Tổng tiền trước thuế thuế 5%\</GrossValue5\>  
\<GrossValue10\>Tổng tiền trước thuế thuế 10%\</GrossValue10\>  
\<GrossValueNDeclared\>Tổng tiền trước thuế thuế KKKN\</GrossValueNDeclared\>  
\<GrossValueContractor\>Tổng tiền trước thuế thuế Khác\</GrossValueContractor\>  
\<VatAmount0\>Tổng tiền thuế thuế 0%\</VatAmount0\>  
\<VatAmount5\>Tổng tiền thuế thuế 5%\</VatAmount5\>  
\<VatAmount10\>Tổng tiền thuế thuế 10%\</VatAmount10\>  
\<VatAmountNDeclared\>Tổng tiền thuế thuế KKKN\</VatAmountNDeclared\>  
\<VatAmountContractor\>Tổng tiền thuế thuế Khác\</VatAmountContractor\>  
\<Amount0\>Tổng tiền sau thuế thuế 0%\</Amount0\>  
\<Amount5\>Tổng tiền sau thuế thuế 5%\</Amount5\>  
\<Amount10\>Tổng tiền sau thuế thuế 10%\</Amount10\>  
\<AmountNDeclared\>Tổng tiền sau thuế thuế KKKN\</AmountNDeclared\>  
\<AmountOther\>Tổng tiền sau thuế thuế Khác\</AmountOther\>  
\<GrossValue8\>Tổng tiền trước thuế thuế 8%\</GrossValue8\>  
 \<VatAmount8\>Tổng tiền thuế thuế 8%\</VatAmount8\>   
\<Amount8\>Tổng tiền sau thuế thuế 8%\</Amount8\>  
\<GrossCTTC\>Tổng tiền trước thuế thuế CTTC\</GrossCTTC\>  
\<VatAmountCTTC\>Tổng tiền thuế thuế CTTC\</VatAmountCTTC\>  
\<AmountCTTC\>Tổng tiền thuế thuế CTTC\</AmountCTTC\>  
\<AmountInWords\>**Số tiền viết bằng chữ**\</AmountInWords\>  
\</Invoice\>  
\</Inv\>  
\<Inv\>...*thông tin xml hoá đơn khác*...\</Inv\>  
\</Invoices\>

2. ## Tạo hóa đơn (bản nháp, chờ ký, có số hóa đơn gửi từ client)

   Resource: “**api/publish/importReservedInvoice**”.  
   Data: {“XmlData”: “Chuỗi XML”, “Pattern”: “Ký hiệu hóa đơn”, “Serial”: “Ký hiệu hóa đơn” }

**Mô tả: Tạo hoá đơn có số và cập nhật vào dải hoá đơn chờ ký (hoá đơn để dành)**

* **XmlData\***: Chuỗi Xml dữ liệu hóa đơn (chứa số hoá đơn, xem cấu trúc ở dưới)  
* **Pattern**: Ký hiệu hóa đơn của hóa đơn (cần có nếu dùng nhiều mẫu/ký hiệu)  
* **Serial**: Ký hiệu mẫu số hóa đơn của hóa đơn (cần có nếu dùng nhiều mẫu/ký hiệu)  
* **Trả về**: Json

| Kết quả trả về | Mô tả | Ghi chú |
| :---- | :---- | :---- |
| { “**Status**”: “2”, “**Message**”: “Ok”, “**ErrorCode**”: “0”, “**Data**”: {    “**Pattern**”: “Ký hiệu hóa đơn”,    “**Serial**”: “Ký hiệu mẫu số hóa đơn”,    “**Invoices**”: \[       **Json object hoá đơn1** (xem thuộc tính tại cột ghi chú),       **Json object hoá đơn2** (xem thuộc tính tại cột ghi chú),      …     \]   } } | Thành công | Status 2: Thành công. Pattern: Ký hiệu hóa đơn của các hóa đơn đã phát hành. Serial: Ký hiệu mẫu số hóa đơn của dãy các hóa đơn phát hành. Json object hoá đơn có cấu trúc như sau: { “**InvoiceStatus**”: Mã trạng thái của hóa đơn (xem phụ lục V.2), “**Buyer**”: “Người mua”, “**No**”: “Số hoá đơn”, “**TaxAmount**”: “Tổng tiền thuế, **“PublishedBy”**: “Người phát hành”, “**Type”:** “Loại hoá đơn” “**Pattern**”: “Ký hiệu hóa đơn”, “**Serial**”: “Ký hiệu mẫu số hóa đơn”, “**No**”: “Số hoá đơn”, “**LookupCode**”: “Mã tra cứu”, “**Ikey**”: “khoá tích hợp ikey”, “**ArisingDate**”: “Ngày tạo lập”,   “**IssueDate**”: “Ngày phát hành”,   “**CustomerName**”: “Tên khách hàng”, “**CustomerCode**”: “Mã khách hàng”, “**CustomerTaxCode”** : “Mã số thuế của khách hàng”, “**Total**”: “Tổng tiền chưa thuế của hoá đơn”, “**Amount**”: “Giá trị hoá đơn”, “**LinkView”** : “Link tra cứu hoá đơn”, “**ModifiedDate**” : “Ngày sửa đổi”, “**IsSentTCTSummary”**: “Gửi thuế theo bảng tổng hợp \- true/fasle”, “**TCTCheckStatus**”: “trạng thái gửi Thuế”, “**TCTErrorMessage**”: “Lỗi gửi cơ quan Thuế”, “**TaxAuthorityCode**” : “mã cơ quan thuế cấp”, “**CusIdentification**” : “Số CCCD”, “**BudgetaryRelationshipCode**” : “Mã quan hệ ngân sách”, “**PassportNo**”: “Số hộ chiếu”  } |
| {   “**Status**”: “\<Mã trạng thái\>”,   “**Message**”: “\<Nội dung lỗi\>”,   “**ErrorCode**”: “\<Mã lỗi\>”,   “**Data**”: {     “**KeyInvoiceMsg**”: {        “**ikey1**”: “Chi tiết lỗi hđ1”,        “**ikey2**”: “Chi tiết lỗi hđ2”      }   } } | Thất bại. | Status 4: Lỗi từ phía client. Status 5: Lỗi từ phía server. KeyInvoiceMsg (tuỳ chọn) kiểu dictionary có Key là ikey hóa đơn (lấy từ đầu vào), Value là chi tiết lỗi hóa đơn tương ứng |


**Note:** 

* Chỉ chấp nhận phát hành gói tin chứa tối đa 5000 hóa đơn.  
* Thông tin khách hàng trong hóa đơn sẽ được thêm mới, đồng thời tạo mới tài khoản tra cứu nếu chưa tồn tại trong hệ thống (chi tiết tài khoản được gửi về địa chỉ email cũng như hướng dẫn tra cứu mỗi khi có hóa đơn mới thuộc khách hàng đó được phát hành), hoặc được cập nhật nếu đã tồn tại trong hệ thống, khóa là trường CusCode (xem trong cấu trúc XmlData).  
* Hóa đơn sẽ được cập nhật thông tin nếu đã tồn tại hóa đơn có cùng ikey trong hệ thống và có trạng thái là mới tạo lập.

  **Cấu trúc của XmlData(các trường bôi xanh là bắt buộc) :**

  \<Invoices\>

  \<Inv\>

  \<Invoice\>

  \<Ikey\>**Giá trị khóa duy nhất của hóa đơn**\</Ikey\>

  \<LocationCode\> **Mã địa điểm kinh doanh (bắt buộc với HKD/CNKD)** \</LocationCode\>

  \<LocationName\> **Tên địa điểm kinh doanh (bắt buộc với HKD/CNKD)**\</LocationName\>

  \<LocationAddress\>**Địa chỉ địa điểm kinh doanh (bắt buộc với HKD/CNKD)**\</LocationAddress\>

  \<**StoreAddress**\> **Địa chỉ kinh doanh** \</**StoreAddress**\>

  \<StoreCode\>**Mã cửa hàng**\</StoreCode\>

  \<StoreName\>**Tên cửa hàng**\</StoreName\>

  \<InvNo\>**Số hoá đơn, kiểu số nguyên dương (chỉ sử dụng trong hoá đơn chờ ký, xem thêm tại phụ lục [VII.4](#hoá-đơn-chờ-ký))**\</InvNo\>

  \<CusCode\>**Mã khách hàng**\</CusCode\>

  \<Buyer\>**Tên người mua hàng(bắt buộc với hoá đơn là hàng hoá đặc trưng loại 1\)**\</Buyer\>

  \<CusName\>**Tên khách hàng**\</CusName\>

  \<CusEmails\>**Danh sách Email \[ưu tiên sử dụng khi gửi mail ( xem luồng tại [VII.16](#luỒng-gỬi-mail-hÓa-ĐƠn)) \]\</**CusEmails\>

  \<Email\>**Email của khách nhận thông báo phát hành hoá đơn ( sử dụng  khi không có CusEmails và hệ thống tìm thấy Email trong Customer )**\</Email\>

  \<EmailCC\>**Danh sách email CC (ngăn cách bởi dấu phẩy) nhận thông báo phát hành hoá đơn ( sử dụng khi không có CusEmails và hệ thống tìm thấy EmailCC trong Customer )**\</EmailCC\>

  \<CusAddress\>**Địa chỉ khách hàng(bắt buộc với hoá đơn là hàng hoá đặc trưng loại 1\)**\</CusAddress\>

  \<CusBankName\>**Tên ngân hàng của khách hàng**\</CusBankName\>

  \<CusBankNo\>**Số tài khoản ngân hàng của khách hàng**\</CusBankNo\>

  \<CusPhone\>**Điện thoại khách hàng (bắt buộc với hoá đơn là hàng hoá đặc trưng loại 1\)**\</CusPhone\>

  \<CusTaxCode\>**Mã số thuế (Bắt buộc với KHDoanh nghiệp, bắt buộc với hoá đơn là hàng hoá đặc trưng loại 1)**\</CusTaxCode\>

  \<CusIdenification\> **Căn cước công dân người mua hàng ( bắt buộc với Hàng hoá đặc trưng loại 1\)**\</CusIdenification\>

  \<ProvinceCode\> **Mã tỉnh (Bắt buộc đối với hàng hóa đặc trưng loại 1\)** **( xem tại [VII.18](#quyết-định-19/2025/qĐ-ttg))**\</ProvinceCode\>

  \<ProvinceName\> Tên tỉnh/thành phố **(Bắt buộc đối với hàng hóa đặc trưng loại 1)( xem tại [VII.18](https://docs.google.com/document/d/1QN9NwhAYhBidQtGV_XZtXKtYefSJFLZR/edit#heading=h.b1lyy2kzbo8t))** \</ProvinceName \>

  \<CommuneCode\> **Mã xã** (**Bắt buộc đối với hàng hóa đặc trưng loại 1**) **( xem tại [VII.18](#quyết-định-19/2025/qĐ-ttg))**\</CommuneCode\>

  \<CommuneName \> Tên xã/phường  (**Bắt buộc đối với hàng hóa đặc trưng loại 1**) **( xem tại [VII.18](https://docs.google.com/document/d/1QN9NwhAYhBidQtGV_XZtXKtYefSJFLZR/edit#heading=h.b1lyy2kzbo8t))\</**CommuneName **\>** 

  \<PaymentMethod\>**Hình thức thanh toán bắt buộc (xem phụ lục [VII.1](#phương-thức-thanh-toán-\(trường-bắt-buộc\)))**\</PaymentMethod\>

  \<ArisingDate\>**Ngày phát sinh hóa đơn (mặc định là ngày hiện tại, chuỗiđịnh dạng dd/MM/yyyy)** \</ArisingDate\>

  \<ExchangeRate\>**Tỷ giá chuyển đổi**\</ExchangeRate\>

  \<CurrencyUnit\>**Đơn vị tiền tệ (ví dụ VND, USD) (xem thêm tại [VII.11](#Đơn-vị-tiền-tệ))** \</CurrencyUnit \>

  \<Extra\>**Thông tin bổ sung (định dạng json có các thuộc tính theo quy ước riêng nếu có phát sinh)** \</Extra\>

  \<Products\>

  > > > \<Product\>

  > > > 	\<Code\>**Mã sản phẩm**\</Code\>

  > > > \<No\>**Số thứ tự\</**No\>

  > > > 	\<Feature\>**Loại sản phẩm(xem phụ lục [VII.10](#feature))\</**Feature\>

  \<ProdName\>**Tên sản phẩm**\</ProdName\>

  \<BusinessProdGroupCode \>**Mã nhóm ngành nghề (khuyễn khích thêm, không bắt buộc) (xem chi tiết ở [VII.14](#danh-mục-mã-nhóm-ngành-nghề))**\</BusinessProdGroupCode\>

  \<ProdUnit\>**Đơn vị tính**\</ProdUnit\>

  \<ProdQuantity\>**Số lượng**\</ProdQuantity\>

  \<ProdPrice\>**Đơn giá**\</ProdPrice\>

  \<Discount\>Tỉ lệ chiết khấu\</Discount\>

  \<DiscountAmount\>Tổng tiền chiết khấu\</DiscountAmount\>

  \<Total\>**Tổng tiền trước thuế**\</Total\>

  \<VATRate\>**Thuế suất (xem phụ lục [VII.3](#thuế-suất))** \</VATRate\>

  \<VATRateOther\>**Thuế suất trong trường hợp thuế khác (Bắt buộc khi VATRate \= \-3)**\</VATRateOther\>

  \<VATAmount\>**Tiền thuế**\</VATAmount\>

  \<Amount\>**Tổng tiền sau thuế**\</Amount\>

  \<Extra\>**Thông tin bổ sung (định dạng json có các thuộc tính theo quy ước riêng nếu có phát sinh)**\</Extra\>

  > > > \</Product\>

  \</Products\>

  \<Total\>**Tổng tiền trước thuế**\</Total\>

  \<VATRate\>**Thuế GTGT (xem phụ lục [VII.3)](#thuế-suất)**\</VATRate\>

  \<VATRateOther\>**Thuế suất trong trường hợp thuế khác (Khi VATRate \= \-3)**\</VATRateOther\>

  \<VATAmount\>**Tiền thuế GTGT**\</VATAmount\>

  \<Amount\>**Tổng tiền**\</Amount\>

  \<DiscountAmount\>**Tổng tiền chiết khấu**\</DiscountAmount\>

  \<GrossValue\>Tổng tiền trước thuế thuế KCT\</GrossValue\>

  \<GrossValue0\>Tổng tiền trước thuế thuế 0%\</GrossValue0\>

  \<GrossValue5\>Tổng tiền trước thuế thuế 5%\</GrossValue5\>

  \<GrossValue10\>Tổng tiền trước thuế thuế 10%\</GrossValue10\>

  \<GrossValueNDeclared\>Tổng tiền trước thuế thuế KKKN\</GrossValueNDeclared\>

  \<GrossValueContractor\>Tổng tiền trước thuế thuế Khác\</GrossValueContractor\>

  \<VatAmount0\>Tổng tiền thuế thuế 0%\</VatAmount0\>

  \<VatAmount5\>Tổng tiền thuế thuế 5%\</VatAmount5\>

  \<VatAmount10\>Tổng tiền thuế thuế 10%\</VatAmount10\>

  \<VatAmountNDeclared\>Tổng tiền thuế thuế KKKN\</VatAmountNDeclared\>

  \<VatAmountContractor\>Tổng tiền thuế thuế Khác\</VatAmountContractor\>

  \<Amount0\>Tổng tiền sau thuế thuế 0%\</Amount0\>

  \<Amount5\>Tổng tiền sau thuế thuế 5%\</Amount5\>

  \<Amount10\>Tổng tiền sau thuế thuế 10%\</Amount10\>

  \<AmountNDeclared\>Tổng tiền sau thuế thuế KKKN\</AmountNDeclared\>

  \<AmountOther\>Tổng tiền sau thuế thuế Khác\</AmountOther\>

  \<GrossValue8\>Tổng tiền trước thuế thuế 8%\</GrossValue8\>

   \<VatAmount8\>Tổng tiền thuế thuế 8%\</VatAmount8\> 

  \<Amount8\>Tổng tiền sau thuế thuế 8%\</Amount8\>

  \<GrossCTTC\>Tổng tiền trước thuế thuế CTTC\</GrossCTTC\>

  \<VatAmountCTTC\>Tổng tiền thuế thuế CTTC\</VatAmountCTTC\>

  \<AmountCTTC\>Tổng tiền thuế thuế CTTC\</AmountCTTC\>

  \<AmountInWords\>**Số tiền viết bằng chữ**\</AmountInWords\>

  \</Invoice\>

  \</Inv\>

  \<Inv\>...\</Inv\>

\</Invoices\>

3. ## Tạo và phát hành hóa đơn (ký server)

   Resource: “**api/publish/importAndIssueInvoice**”.  
   Data: {“XmlData”: “Chuỗi Xml”, “Pattern”: “Ký hiệu hóa đơn”, “Serial”: “Ký hiệu mẫu số hóa đơn” }

**Mô tả**

* **XmlData\***: Chuỗi Xml dữ liệu hóa đơn (chứa số hoá đơn (tuỳ chọn), xem cấu trúc ở dưới)  
* **Pattern**: Ký hiệu hóa đơn của hóa đơn (cần có nếu dùng nhiều mẫu/ký hiệu)  
* **Serial**:Ký hiệu mẫu số hóa đơn của hóa đơn (cần có nếu dùng nhiều mẫu/ký hiệu)  
* **Trả về**: Json

| Kết quả trả về | Mô tả | Ghi chú |
| :---- | :---- | :---- |
| { “**Status**”: “2”, “**Message**”: “Ok”, “**ErrorCode**”: “0”, “**Data**”: {    “**Pattern**”: “Ký hiệu hóa đơn”,    “**Serial**”: “Ký hiệu mẫu số hóa đơn”,    “**KeyInvoiceNo**”: {       “**ikey1**”: “số hóa đơn 1”,       “**ikey2**”: “số hóa đơn 2”      },    “**Invoices**”: \[       **Json object hoá đơn1** (xem thuộc tính tại cột ghi chú),       **Json object hoá đơn2** (xem thuộc tính tại cột ghi chú),      …     \]   } } | Thành công | Status 2: Thành công.  KeyInvoiceNo: Dictionary có Key là ikey hóa đơn (lấy từ đầu vào), Value là số hóa đơn tương ứng. Json object hoá đơn có cấu trúc như sau: { “**InvoiceStatus**”: Mã trạng thái của hóa đơn (xem phụ lục V.2), “**Buyer**”: “Người mua”, “**No**”: “Số hoá đơn”, “**TaxAmount**”: “Tổng tiền thuế, **“PublishedBy”**: “Người phát hành”, “**Type”:** “Loại hoá đơn” “**Pattern**”: “Ký hiệu hóa đơn”, “**Serial**”: “Ký hiệu mẫu số hóa đơn”, “**No**”: “Số hoá đơn”, “**LookupCode**”: “Mã tra cứu”, “**Ikey**”: “khoá tích hợp ikey”, “**ArisingDate**”: “Ngày tạo lập”,   “**IssueDate**”: “Ngày phát hành”,   “**CustomerName**”: “Tên khách hàng”, “**CustomerCode**”: “Mã khách hàng”, “**CustomerTaxCode”** : “Mã số thuế của khách hàng”, “**Total**”: “Tổng tiền chưa thuế của hoá đơn”, “**Amount**”: “Giá trị hoá đơn”, “**LinkView”** : “Link tra cứu hoá đơn”, “**ModifiedDate**” : “Ngày sửa đổi”, “**IsSentTCTSummary”**: “Gửi thuế theo bảng tổng hợp \- true/fasle”, “**TCTCheckStatus**”: “trạng thái gửi Thuế”, “**TCTErrorMessage**”: “Lỗi gửi cơ quan Thuế”, “**TaxAuthorityCode**” : “mã cơ quan thuế cấp”, “**CusIdentification**” : “Số CCCD”, “**BudgetaryRelationshipCode**” : “Mã quan hệ ngân sách”, “**PassportNo**”: “Số hộ chiếu”  } |
| {   “**Status**”: “\<Mã trạng thái\>”,   “**Message**”: “\<Nội dung lỗi\>”,   “**ErrorCode**”: “\<Mã lỗi\>”,  “**Data**”: {     “**KeyInvoiceMsg**”: {        “**ikey1**”: “Chi tiết lỗi hđ1”,        “**ikey2**”: “Chi tiết lỗi hđ2”      }   } } | Thất bại. | Status 4: Lỗi từ phía client. Status 5: Lỗi từ phía server. KeyInvoiceMsg (tuỳ chọn) kiểu dictionary có Key là ikey hóa đơn (lấy từ đầu vào), Value là chi tiết lỗi hóa đơn tương ứng |

  

**Note:**

* Khuyến nghị nên gửi tối đa 50 hoá đơn trong 1 request để đảm bảo hiệu năng API  
* Thông tin khách hàng trong hóa đơn sẽ được thêm mới, đồng thời tạo mới tài khoản tra cứu nếu chưa tồn tại trong hệ thống (chi tiết tài khoản được gửi về địa chỉ email cũng như hướng dẫn tra cứu mỗi khi có hóa đơn mới thuộc khách hàng đó được phát hành), hoặc được cập nhật nếu đã tồn tại trong hệ thống, khóa là trường CusCode (xem trong cấu trúc XmlData).  
* Hóa đơn sẽ được cập nhật thông tin trước khi được phát hành nếu đã tồn tại hóa đơn có cùng ikey trong hệ thống và có trạng thái là mới tạo lập.

  **Cấu trúc của XmlData (các trường bôi xanh là bắt buộc):**

  \<Invoices\>

  \<Inv\>

  \<Invoice\>

  \<Ikey\>**Giá trị khóa duy nhất của hóa đơn**\</Ikey\>

  \<LocationCode\> **Mã địa điểm kinh doanh (bắt buộc với HKD/CNKD)** \</LocationCode\>

  \<LocationName\> **Tên địa điểm kinh doanh (bắt buộc với HKD/CNKD)**\</LocationName\>

  \<LocationAddress\>**Địa chỉ địa điểm kinh doanh (bắt buộc với HKD/CNKD)**\</LocationAddress\>

  \<StoreCode\>**Mã cửa hàng**\</StoreCode\>

  \<StoreName\>**Tên cửa hàng**\</StoreName\>

  \<CusCode\>**Mã khách hàng**\</CusCode\>

  \<Buyer\>**Tên người mua hàng(bắt buộc với hoá đơn là hàng hoá đặc trưng loại 1\)**\</Buyer\>

  \<CusName\>**Tên khách hàng**\</CusName\>

  \<CusEmails\>**Danh sách Email \[ưu tiên sử dụng khi gửi mail ( xem luồng tại [VII.16](#luỒng-gỬi-mail-hÓa-ĐƠn)) \]\</**CusEmails\>

  \<Email\>**Email của khách nhận thông báo phát hành hoá đơn ( sử dụng  khi không có CusEmails và hệ thống tìm thấy Email trong Customer )**\</Email\>

  \<EmailCC\>**Danh sách email CC (ngăn cách bởi dấu phẩy) nhận thông báo phát hành hoá đơn ( sử dụng khi không có CusEmails và hệ thống tìm thấy EmailCC trong Customer )**\</EmailCC\>

  \<CusAddress\>**Địa chỉ khách hàng(bắt buộc với hoá đơn là hàng hoá đặc trưng loại 1\)**\</CusAddress\>

  \<CusBankName\>**Tên ngân hàng của khách hàng**\</CusBankName\>

  \<CusBankNo\>**Số tài khoản ngân hàng của khách hàng**\</CusBankNo\>

  \<CusPhone\>**Điện thoại khách hàng (bắt buộc với hoá đơn là hàng hoá đặc trưng loại 1\)**\</CusPhone\>

  \<CusTaxCode\>**Mã số thuế (Bắt buộc với KH Doanh nghiệp, bắt buộc với hoá đơn là hàng hoá đặc trưng loại 1)**\</CusTaxCode\>

  \<CusIdenification\> **Căn cước công dân người mua hàng ( bắt buộc với Hàng hoá đặc trưng loại 1\)**\</CusIdenification\>

  \<ProvinceCode\> **Mã tỉnh (Bắt buộc đối với hàng hóa đặc trưng loại 1\)** **( xem tại [VII.18](#quyết-định-19/2025/qĐ-ttg))**\</ProvinceCode\>

  \<ProvinceName\> Tên tỉnh/thành phố **(Bắt buộc đối với hàng hóa đặc trưng loại 1)( xem tại [VII.18](https://docs.google.com/document/d/1QN9NwhAYhBidQtGV_XZtXKtYefSJFLZR/edit#heading=h.b1lyy2kzbo8t))** \</ProvinceName \>

  \<CommuneCode\> **Mã xã** (**Bắt buộc đối với hàng hóa đặc trưng loại 1**) **( xem tại [VII.18](#quyết-định-19/2025/qĐ-ttg))**\</CommuneCode\>

  \<CommuneName \> Tên xã/phường  (**Bắt buộc đối với hàng hóa đặc trưng loại 1**) **( xem tại [VII.18](https://docs.google.com/document/d/1QN9NwhAYhBidQtGV_XZtXKtYefSJFLZR/edit#heading=h.b1lyy2kzbo8t))\</**CommuneName **\>** 

  \<PaymentMethod\>**Hình thức thanh toán (xem phụ lục [VII.1](#phương-thức-thanh-toán-\(trường-bắt-buộc\)))**\</PaymentMethod\>

  \<ArisingDate\>**Ngày phát sinh hóa đơn (mặc định là ngày hiện tại, chuỗi định dạng dd/MM/yyyy)** \</ArisingDate\>

  \<ExchangeRate\>**Tỷ giá chuyển đổi**\</ExchangeRate\>

  \<CurrencyUnit\>**Đơn vị tiền tệ (ví dụ VND, USD) (xem thêm tại phụ lục [VII.11](#Đơn-vị-tiền-tệ))** \</CurrencyUnit \>

  \<Extra\>**Thông tin bổ sung (định dạng json có các thuộc tính theo quy ước riêng nếu có phát sinh)** \</Extra\>

  \<Products\>

  > > > \<Product\>

  > > > 	\<Code\>**Mã sản phẩm**\</Code\>

  > > > \<No\>**Số thứ tự\</**No\>

  > > > 	\<Feature\>**Loại sản phẩm(xem phụ lục [VII.10](#feature))\</**Feature\>

  \<ProdName\>**Tên sản phẩm**\</ProdName\>

  \<BusinessProdGroupCode \>**Mã nhóm ngành nghề (khuyễn khích thêm, không bắt buộc) (xem chi tiết ở [VII.14](#danh-mục-mã-nhóm-ngành-nghề))**\</BusinessProdGroupCode\>

  \<ProdUnit\>**Đơn vị tính**\</ProdUnit\>

  \<ProdQuantity\>**Số lượng**\</ProdQuantity\>

  \<ProdPrice\>**Đơn giá**\</ProdPrice\>

  \<Discount\>Tỉ lệ chiết khấu\</Discount\>

  \<DiscountAmount\>Tổng tiền chiết khấu\</DiscountAmount\>

  \<Total\>**Tổng tiền trước thuế**\</Total\>

  \<VATRate\>**Thuế suất (xem phụ lục [VII.3](#thuế-suất))** \</VATRate\>

  \<VATRateOther\>**Thuế suất trong trường hợp thuế khác (Khi VATRate \= \-3)**\</VATRateOther\>

  \<VATAmount\>**Tiền thuế**\</VATAmount\>

  \<Amount\>**Tổng tiền sau thuế**\</Amount\>

  \<Extra\>**Thông tin bổ sung (định dạng json có các thuộc tính theo quy ước riêng nếu có phát sinh)**\</Extra\>

  > > > \</Product\>

  \</Products\>

  \<Total\>**Tổng tiền trước thuế**\</Total\>

  \<VATRate\>**Thuế GTGT (xem phụ lục [VII.3](#thuế-suất))**\</VATRate\>

  \<VATRateOther\>**Thuế suất trong trường hợp thuế khác (Khi VATRate \= \-3)**\</VATRateOther\>

  \<DiscountAmount\>**Tổng tiền chiết khấu**\</DiscountAmount\>

  \<VATAmount\>**Tiền thuế GTGT**\</VATAmount\>

  \<Amount\>**Tổng tiền**\</Amount\>

  \<GrossValue\>Tổng tiền trước thuế thuế KCT\</GrossValue\>

  \<GrossValue0\>Tổng tiền trước thuế thuế 0%\</GrossValue0\>

  \<GrossValue5\>Tổng tiền trước thuế thuế 5%\</GrossValue5\>

  \<GrossValue10\>Tổng tiền trước thuế thuế 10%\</GrossValue10\>

  \<GrossValueNDeclared\>Tổng tiền trước thuế thuế KKKN\</GrossValueNDeclared\>

  \<GrossValueContractor\>Tổng tiền trước thuế thuế Khác\</GrossValueContractor\>

  \<VatAmount0\>Tổng tiền thuế thuế 0%\</VatAmount0\>

  \<VatAmount5\>Tổng tiền thuế thuế 5%\</VatAmount5\>

  \<VatAmount10\>Tổng tiền thuế thuế 10%\</VatAmount10\>

  \<VatAmountNDeclared\>Tổng tiền thuế thuế KKKN\</VatAmountNDeclared\>

  \<VatAmountContractor\>Tổng tiền thuế thuế Khác\</VatAmountContractor\>

  \<Amount0\>Tổng tiền sau thuế thuế 0%\</Amount0\>

  \<Amount5\>Tổng tiền sau thuế thuế 5%\</Amount5\>

  \<Amount10\>Tổng tiền sau thuế thuế 10%\</Amount10\>

  \<AmountNDeclared\>Tổng tiền sau thuế thuế KKKN\</AmountNDeclared\>

  \<AmountOther\>Tổng tiền sau thuế thuế Khác\</AmountOther\>

  \<GrossValue8\>Tổng tiền trước thuế thuế 8%\</GrossValue8\>

   \<VatAmount8\>Tổng tiền thuế thuế 8%\</VatAmount8\> 

  \<Amount8\>Tổng tiền sau thuế thuế 8%\</Amount8\>

  \<GrossCTTC\>Tổng tiền trước thuế thuế CTTC\</GrossCTTC\>

  \<VatAmountCTTC\>Tổng tiền thuế thuế CTTC\</VatAmountCTTC\>

  \<AmountCTTC\>Tổng tiền thuế thuế CTTC\</AmountCTTC\>

  \<AmountInWords\>**Số tiền viết bằng chữ**\</AmountInWords\>

  \</Invoice\>

  \</Inv\>

  \<Inv\>...\</Inv\>

\</Invoices\>

4. ## Điều chỉnh hóa đơn (ký server)

   Resource: “**api/business/adjustInvoice**”.  
   Data: {“XmlData”: “Chuỗi Xml”, “Ikey”: “ikey”, “Pattern”: “Ký hiệu hóa đơn”, “Serial”: “Ký hiệu mẫu số hóa đơn”, “RelatedInvoice”: “Thông tin hóa đơn liên quan”}

**Mô tả: Tạo một hoá đơn điều chỉnh cho một hoá đơn đã được phát hành hợp lệ**

* **XmlData\***: Chuỗi Xml dữ liệu hóa đơn (xem cấu trúc cuối mục)  
* **Ikey\*:** Khóa duy nhất xác định hóa đơn cần điều chỉnh.  
* **Pattern**: Ký hiệu hóa đơn của hóa đơn (khuyến cáo nên có).  
* **Serial**: Ký hiệu mẫu số hóa đơn (khuyến cáo nên có).  
* **RelatedInvoice:** Thông tin hóa đơn liên quan (sử dụng khi hóa đơn gốc không tồn tại trên hệ thống Easyinvoice). Hệ thống ưu tiên truy vấn hóa đơn gốc theo Ikey, nên nếu truyền thông tin này thì Ikey có thể truyền rỗng.  
  Cấu trúc request json**:**

| { 	"Ikey": "Ikey hóa đơn gốc", 	"Pattern": "Mẫu số hóa đơn thay thế/điều chỉnh", 	"Serial": "Ký hiệu hóa đơn thay thế/điều chỉnh", 	"XmlData": "Cấu trúc xmlData của hđ thay thế/điều chỉnh", 	"RelatedInvoice": { 		"Pattern": "Mẫu số hóa đơn gốc", 		"Serial": "Ký hiệu hóa đơn gốc", 		"No": "Số hóa đơn gốc", 		"ArisingDate": "Ngày phát hành hóa đơn gốc (dd/MM/yyyy)", 		"RelatedType": "Loại hóa đơn liên quan" 	} } |
| :---- |


* **Trả về**: Json

| Kết quả trả về | Mô tả | Ghi chú |
| :---- | :---- | :---- |
| { “**Status**”: “2”, “**Message**”: “Ok”, “**ErrorCode**”: “0”, “**Data**”: {    “**Pattern**”: “Ký hiệu hóa đơn”,    “**Serial**”: “Ký hiệu mẫu số hóa đơn”,    “**KeyInvoiceNo**”: {       “**ikey**”: “Số hóa đơn điều chỉnh”      },    “**Invoices**”: \[       **Json object hoá đơn điều chỉnh** (xem thuộc tính tại cột ghi chú)     \]   } } | Thành công | Status 2: Thành công. KeyInvoiceNo: Dictionary có Key là ikey hóa đơn (lấy từ đầu vào), Value là số hóa đơn tương ứng. Json object hoá đơn có cấu trúc như sau: { “**InvoiceStatus**”: Mã trạng thái của hóa đơn (xem phụ lục [VII.2](#trạng-thái-hoá-đơn)), “**Buyer**”: “Người mua”, “**TaxAmount**”: “Tiền thuế”, “**PublishedBy**”: “Tài khoản phát hành”, “**Type**”: “Loại hoá đơn”, “**Pattern**”: “Mẫu”, “**Serial**”: “Ký hiệu mẫu số hóa đơn”, “**No**”: “Số hoá đơn”, “**LookupCode**”: “Mã tra cứu”, “**Ikey**”: “khoá tích hợp ikey”, “**ArisingDate**”: “Ngày tạo lập”,   “**IssueDate**”: “Ngày phát hành”,   “**CustomerName**”: “Tên khách hàng”, “**CustomerCode**”: “Mã khách hàng”, “**CustomerAddress**”: “Địa chỉ khách hàng”, “**CustomerTaxCode**”: “Mã số thuế khách hàng”, “**Total**”: “Tổng tiền trước thuế”, “**Amount**”: “Giá trị hoá đơn”, “**LinkView**”: “Link tra cứu hoá đơn”, “**IsSentTCTSummary**”: “Hoá đơn gửi bảng tổng hợp”, “**TCTCheckStatus**”: “Trạng thái CQT trả về”, “**CusIdentification**”: “Số CCCD của khách hàng”, “**BudgetaryRelationshipCode**”: “Mã quan hệ ngân sách”, “**PassportNo**”: “Số hộ chiếu”  } |
| {   “**Status**”: “\<Mã trạng thái\>”,   “**Message**”: “\<Nội dung lỗi\>”,   “**ErrorCode**”: “\<Mã lỗi\>”,   “**Data**”: {    “**KeyInvoiceMsg**”: {       “**ikey1**”: “Chi tiết lỗi thay thế”      }   } } | Thất bại. | Status 4: Lỗi từ phía client. Status 5: Lỗi từ phía server. KeyInvoiceMsg (tuỳ chọn) kiểu dictionary có Key là ikey hóa đơn (lấy từ đầu vào), Value là chi tiết lỗi hóa đơn tương ứng |


**Note:** 

* Thông tin khách hàng trong hóa đơn sẽ được cập nhật nếu đã tồn tại trong hệ thống, khóa là trường CusCode (xem trong cấu trúc XmlData).

* Khuyến nghị nên gửi tối đa 50 hoá đơn trong 1 request để đảm bảo hiệu năng API

**Cấu trúc của XmlData của hoá đơn điều chỉnh (các trường \* là bắt buộc):**  
\<AdjustInv\>  
\<Ikey\>**Khoá ikey duy nhất của hoá đơn điều chỉnh**\</Ikey\>  
\<LocationCode\> **Mã địa điểm kinh doanh (bắt buộc với HKD/CNKD)** \</LocationCode\>  
\<LocationName\> **Tên địa điểm kinh doanh (bắt buộc với HKD/CNKD)**\</LocationName\>  
\<LocationAddress\>**Địa chỉ địa điểm kinh doanh (bắt buộc với HKD/CNKD)**\</LocationAddress\>  
\<StoreCode\>**Mã cửa hàng**\</StoreCode\>  
\<StoreName\>**Tên cửa hàng**\</StoreName\>  
\<CusCode\>**Mã khách hàng**\</CusCode\>  
\<Buyer\>**Tên người mua hàng (bắt buộc với hoá đơn là hàng hoá đặc trưng loại 1\)**\</Buyer\>  
\<CusName\>**Tên khách hàng**\</CusName\>  
\<CusEmails\>**Danh sách Email\[ưu tiên sử dụng khi gửi mail( xem luồng tại [VII.16](#luỒng-gỬi-mail-hÓa-ĐƠn))\]\</**CusEmails\>  
\<Email\>**Email của khách nhận thông báo phát hành hoá đơn ( sử dụng  khi không có CusEmails và hệ thống tìm thấy Email trong Customer )**\</Email\>  
\<EmailCC\>**Danh sách email CC (ngăn cách bởi dấu phẩy) nhận thông báo phát hành hoá đơn (sử dụng khi không có CusEmails và hệ thống tìm thấy EmailCC trong Customer)**\</EmailCC\>  
\<CusAddress\>**Địa chỉ khách hàng (bắt buộc với hoá đơn là hàng hoá đặc trưng loại 1\)**\</CusAddress\>  
\<CusBankName\>**Tên ngân hàng của khách hàng**\</CusBankName\>  
\<CusBankNo\>**Số tài khoản ngân hàng của khách hàng**\</CusBankNo\>  
\<CusPhone\>**Điện thoại khách hàng (bắt buộc với hoá đơn là hàng hoá đặc trưng loại 1\)**\</CusPhone\>  
\<CusTaxCode\>**Mã số thuế (Bắt buộc với KH Doanh nghiệp, bắt buộc với hoá đơn là hàng hoá đặc trưng loại 1)** \</CusTaxCode\>  
                        \<CusIdenification\> **Căn cước công dân người mua hàng ( bắt buộc với Hàng hoá đặc trưng loại 1\)**\</CusIdenification\>  
\<AdjustReplaceReasonCode\>**Mã lý do( xem phụ lục [VII.13](#danh-mục-mã-lý-do-điều-chỉnh/thay-thế-hoá-đơn))\</**AdjustReplaceReasonCode \>  
\<ProvinceCode\> **Mã tỉnh (Bắt buộc đối với hàng hóa đặc trưng loại 1\)** **( xem tại [VII.18](#quyết-định-19/2025/qĐ-ttg))**\</ProvinceCode\>  
\<ProvinceName\> Tên tỉnh/thành phố **(Bắt buộc đối với hàng hóa đặc trưng loại 1)( xem tại [VII.18](https://docs.google.com/document/d/1QN9NwhAYhBidQtGV_XZtXKtYefSJFLZR/edit#heading=h.b1lyy2kzbo8t))** \</ProvinceName \>  
\<CommuneCode\> **Mã xã** (**Bắt buộc đối với hàng hóa đặc trưng loại 1**) **( xem tại [VII.18](#quyết-định-19/2025/qĐ-ttg))**\</CommuneCode\>  
\<CommuneName \> Tên xã/phường  (**Bắt buộc đối với hàng hóa đặc trưng loại 1**) **( xem tại [VII.18](https://docs.google.com/document/d/1QN9NwhAYhBidQtGV_XZtXKtYefSJFLZR/edit#heading=h.b1lyy2kzbo8t))\</**CommuneName **\>**   
\<Type\>**Loại hóa đơn chỉnh sửa (int-mặc định lấy là 2\) 2 \- Điều chỉnh tăng, 3 \- Điều chỉnh giảm, 4 \- Hóa đơn điều chỉnh thông tin**\</Type\>  
\<PaymentMethod\>**Hình thức thanh toán bắt buộc (xem phụ lục [VII.1](#phương-thức-thanh-toán-\(trường-bắt-buộc\)))**\</PaymentMethod\>  
\<ArisingDate\>**Ngày phát sinh hóa đơn (mặc định là ngày hiện tại, chuỗi định dạng dd/MM/yyyy)** \</ArisingDate\>  
\<ExchangeRate\>**Tỷ giá chuyển đổi**\</ExchangeRate\>  
\<CurrencyUnit\>**Đơn vị tiền tệ (ví dụ VND, USD) (xem thêm tại phụ lục [VII.11](#Đơn-vị-tiền-tệ))**\</CurrencyUnit \>  
\<Extra\>**Thông tin bổ sung (định dạng json có các thuộc tính theo quy ước riêng nếu có phát sinh)** \</Extra\>  
\<Products\>  
\<Product\>  
	\<Code\>**Mã sản phẩm**\</Code\>  
\<No\>**Số thứ tự\</**No\>  
	\<Feature\>**Loại sản phẩm(xem phụ lục [VII.10](#feature))\</**Feature\>  
\<ProdName\>**Tên sản phẩm**\</ProdName\>  
\<ProdUnit\>**Đơn vị tính**\</ProdUnit\>  
\<ProdQuantity\>**Số lượng**\</ProdQuantity\>  
\<ProdPrice\>**Đơn giá**\</ProdPrice\>  
\<Discount\>Tỉ lệ chiết khấu\</Discount\>  
\<DiscountAmount\>Tổng tiền chiết khấu\</DiscountAmount\>  
\<Total\>**Tổng tiền trước thuế**\</Total\>  
\<VATRate\>**Thuế suất (xem phụ lục [VII.3](#thuế-suất))** \</VATRate\>  
\<VATRateOther\>**Thuế suất trong trường hợp thuế khác (Khi VATRate \= \-3)**\</VATRateOther\>  
\<VATAmount\>**Tiền thuế**\</VATAmount\>  
\<Amount\>**Tổng tiền sau thuế**\</Amount\>  
\<Extra\>**Thông tin bổ sung (định dạng json có các thuộc tính theo quy ước riêng nếu có phát sinh)**\</Extra\>  
\</Product\>  
\</Products\>  
\<Total\>**Tổng tiền trước thuế**\</Total\>  
\<VATRate\>**Thuế GTGT (xem phụ lục VII.3)**\</VATRate\>  
\<VATRateOther\>**Thuế suất trong trường hợp thuế khác (Khi VATRate \= \-3)**\</VATRateOther\>  
\<DiscountAmount\>**Tổng tiền chiết khấu**\</DiscountAmount\>  
\<VATAmount\>**Tiền thuế GTGT**\</VATAmount\>  
\<Amount\>**Tổng tiền**\</Amount\>  
\<GrossValue\>Tổng tiền trước thuế thuế KCT\</GrossValue\>  
\<GrossValue0\>Tổng tiền trước thuế thuế 0%\</GrossValue0\>  
\<GrossValue5\>Tổng tiền trước thuế thuế 5%\</GrossValue5\>  
\<GrossValue10\>Tổng tiền trước thuế thuế 10%\</GrossValue10\>  
\<GrossValueNDeclared\>Tổng tiền trước thuế thuế KKKN\</GrossValueNDeclared\>  
\<GrossValueContractor\>Tổng tiền trước thuế thuế Khác\</GrossValueContractor\>  
\<VatAmount0\>Tổng tiền thuế thuế 0%\</VatAmount0\>  
\<VatAmount5\>Tổng tiền thuế thuế 5%\</VatAmount5\>  
\<VatAmount10\>Tổng tiền thuế thuế 10%\</VatAmount10\>  
\<VatAmountNDeclared\>Tổng tiền thuế thuế KKKN\</VatAmountNDeclared\>  
\<VatAmountContractor\>Tổng tiền thuế thuế Khác\</VatAmountContractor\>  
\<Amount0\>Tổng tiền sau thuế thuế 0%\</Amount0\>  
\<Amount5\>Tổng tiền sau thuế thuế 5%\</Amount5\>  
\<Amount10\>Tổng tiền sau thuế thuế 10%\</Amount10\>  
\<GrossValue8\>Tổng tiền trước thuế thuế 8%\</GrossValue8\>  
 \<VatAmount8\>Tổng tiền thuế thuế 8%\</VatAmount8\>   
\<Amount8\>Tổng tiền sau thuế thuế 8%\</Amount8\>  
\<GrossCTTC\>Tổng tiền trước thuế thuế CTTC\</GrossCTTC\>  
\<VatAmountCTTC\>Tổng tiền thuế thuế CTTC\</VatAmountCTTC\>  
\<AmountCTTC\>Tổng tiền thuế thuế CTTC\</AmountCTTC\>  
\<AmountNDeclared\>Tổng tiền sau thuế thuế KKKN\</AmountNDeclared\>  
\<AmountOther\>Tổng tiền sau thuế thuế Khác\</AmountOther\>  
\<AmountInWords\>**Số tiền viết bằng chữ**\</AmountInWords\>  
\</AdjustInv\>

5. ## Thay thế hóa đơn (ký server)

   Resource: “**api/business/replaceInvoice**”.  
   Data: {“XmlData”: “Chuỗi Xml”, “Ikey”: “ikey”, “Pattern”: “Ký hiệu hóa đơn”, “Serial”: “Ký hiệu mẫu số hóa đơn”, “RelatedInvoice”: “Thông tin hóa đơn liên quan”}

**Mô tả: Tạo một hoá đơn thay thế cho một hoá đơn đã được phát hành**

* **XmlData\***: Chuỗi Xml dữ liệu hóa đơn (xem cấu trúc cuối mục)  
* **Ikey\*:** Khóa duy nhất xác định hóa đơn cần thay thế  
* **Pattern**: Ký hiệu hóa đơn của hóa đơn (khuyến cáo nên có).  
* **Serial**: Ký hiệu mẫu số hóa đơn (khuyến cáo nên có).  
*  **RelatedInvoice:** Thông tin hóa đơn liên quan (sử dụng khi hóa đơn gốc không tồn tại trên hệ thống Easyinvoice). Hệ thống ưu tiên truy vấn hóa đơn gốc theo Ikey, nên nếu truyền thông tin này thì Ikey truyền rỗng.  
  Cấu trúc request json**:**

| { 	"Ikey": "Ikey hóa đơn gốc", 	"Pattern": "Mẫu số hóa đơn thay thế/điều chỉnh", 	"Serial": "Ký hiệu hóa đơn thay thế/điều chỉnh", 	"XmlData": "Cấu trúc xmlData của hđ thay thế/điều chỉnh",     "RelatedInvoice":     {         "Pattern": "Mẫu số hóa đơn gốc",         "Serial": "Ký hiệu hóa đơn gốc",         "No": "Số hóa đơn gốc",         "ArisingDate": "Ngày phát hành hóa đơn gốc (định dạng dd/MM/yyyy)",         "RelatedType": "Loại hóa đơn liên quan,  		Khi điều chỉnh / thay thế cho hóa đơn thông tư 78 chọn giá trị: 1 		Khi điều chỉnh / thay thế cho hóa đơn thông tư 32 hoặc hóa đơn giấy chọn giá trị 3"     } } |
| :---- |


* **Trả về**: Json

| Kết quả trả về | Mô tả | Ghi chú |
| :---- | :---- | :---- |
| { “**Status**”: “2”, “**Message**”: “Ok”, “**ErrorCode**”: “0”, “**Data**”: {    “**Pattern**”: “Ký hiệu hóa đơn”,    “**Serial**”: “Ký hiệu mẫu số hóa đơn”,    “**KeyInvoiceNo**”: {       “**ikey**”: “số hóa thay thế”      },    “**Invoices**”: \[         **Json object hoá đơn thay thế** (xem thuộc tính tại cột ghi chú)     \]   } } | Thành công | Status 2: Thành công. KeyInvoiceNo: Dictionary có Key là ikey hóa đơn (lấy từ đầu vào), Value là số được cấp của hóa đơn tương ứng. Json object hoá đơn có cấu trúc như sau: { “**InvoiceStatus**”: Mã trạng thái của hóa đơn (xem phụ lục V.2), “**Buyer**”: “Tên người mua hàng”, “**PublishedBy**”: “Tài khoản phát hành”, “**Pattern**”: “Ký hiệu hóa đơn”, “**Type”**: “Loại hoá đơn” “**Serial**”: “Ký hiệu mẫu số hóa đơn”, “**No**”: “Số hoá đơn”, “**LookupCode**”: “Mã tra cứu”, “**Ikey**”: “khoá tích hợp ikey”, “**ArisingDate**”: “Ngày tạo lập”,   “**IssueDate**”: “Ngày phát hành”,   “**CustomerName**”: “Tên khách hàng”,   “**CustomerAddress**”: “Địa chỉ  khách hàng”, “**CustomerCode**”: “Mã khách hàng”,   “**Total**”: “Tổng tiền trước thuế”, “**Amount**”: “Giá trị hoá đơn”,   “**LinkView**”: “Link tra cứu hoá đơn”,   “**TCTCheckStatus**”: “Trạng thái hoá đơn của CQT”,   “**CusIdentification**”: “số CCCD của khách hàng”, “**BudgetaryRelationshipCode**”: “Mã quan hệ ngân sách của  khách hàng”,   “**PassportNo**”: “Số hộ chiếu khách hàng”,   “**IsSentTCTSummary**”: “hoá đơn gửi bảng tổng hợp”  } |
| {   “**Status**”: “\<Mã trạng thái\>”,   “**Message**”: “\<Nội dung lỗi\>”,   “**ErrorCode**”: “\<Mã lỗi\>”, “**Data**”: {    “**KeyInvoiceMsg**”: {       “**ikey1**”: “Chi tiết lỗi thay thế”      }   } } | Thất bại. | Status 4: Lỗi từ phía client. Status 5: Lỗi từ phía server. KeyInvoiceMsg (tuỳ chọn) kiểu dictionary  có Key là ikey hóa đơn (lấy từ đầu vào), Value là chi tiết lỗi hóa đơn tương ứng  |


**Note:** 

* Thông tin khách hàng trong hóa đơn sẽ được cập nhật nếu đã tồn tại trong hệ thống, khóa là trường CusCode (xem trong cấu trúc XmlData).

* Khuyến nghị nên gửi tối đa 50 hoá đơn trong 1 request để đảm bảo hiệu năng API

**Cấu trúc của xmlData của hoá đơn thay thế (các trường \* là bắt buộc):**  
\<ReplaceInv\>  
\<Ikey\>**Khoá ikey duy nhất của hoá đơn thay thế**\</Ikey\>  
\<LocationCode\> **Mã địa điểm kinh doanh (bắt buộc với HKD/CNKD)** \</LocationCode\>  
\<LocationName\> **Tên địa điểm kinh doanh (bắt buộc với HKD/CNKD)**\</LocationName\>  
\<LocationAddress\>**Địa chỉ địa điểm kinh doanh (bắt buộc với HKD/CNKD)**\</LocationAddress\>  
\<StoreCode\>**Mã cửa hàng**\</StoreCode\>  
\<StoreName\>**Tên cửa hàng**\</StoreName\>  
\<CusCode\>**Mã khách hàng**\</CusCode\>  
\<Buyer\>**Tên người mua hàng (bắt buộc với hoá đơn là hàng hoá đặc trưng loại 1\)**\</Buyer \>  
\<CusName\>**Tên khách hàng**\</CusName\>  
\<CusEmails\>**Danh sách Email \[ưu tiên sử dụng khi gửi mail ( xem luồng tại [VII.16](#luỒng-gỬi-mail-hÓa-ĐƠn)) \]\</**CusEmails\>  
\<Email\>**Email của khách nhận thông báo phát hành hoá đơn ( sử dụng  khi không có CusEmails và hệ thống tìm thấy Email trong Customer )**\</Email\>  
\<EmailCC\>**Danh sách email CC (ngăn cách bởi dấu phẩy) nhận thông báo phát hành hoá đơn ( sử dụng khi không có CusEmails và hệ thống tìm thấy EmailCC trong Customer )**\</EmailCC\>  
\<CusAddress\>**Địa chỉ khách hàng (bắt buộc với hoá đơn là hàng hoá đặc trưng loại 1\)**\</CusAddress\>  
\<CusBankName\>**Tên ngân hàng của khách hàng**\</CusBankName\>  
\<CusBankNo\>**Số tài khoản ngân hàng của khách hàng**\</CusBankNo\>  
\<CusPhone\>**Điện thoại khách hàng (bắt buộc với hoá đơn là hàng hoá đặc trưng loại 1\)**\</CusPhone\>  
\<CusTaxCode\>**Mã số thuế (Bắt buộc với KH Doanh nghiệp, bắt buộc với hoá đơn là hàng hoá đặc trưng loại 1)** \</CusTaxCode\>  
                       \<CusIdenification\> **Căn cước công dân người mua hàng ( bắt buộc với Hàng hoá đặc trưng loại 1\)**\</CusIdenification\>  
\<AdjustReplaceReasonCode\>**Mã lý do( xem phụ lục [VII.13](#danh-mục-mã-lý-do-điều-chỉnh/thay-thế-hoá-đơn))\</**AdjustReplaceReasonCode \>  
\<ProvinceCode\> **Mã tỉnh (Bắt buộc đối với hàng hóa đặc trưng loại 1\)** **( xem tại [VII.18](#quyết-định-19/2025/qĐ-ttg))**\</ProvinceCode\>  
\<ProvinceName\> Tên tỉnh/thành phố **(Bắt buộc đối với hàng hóa đặc trưng loại 1)( xem tại [VII.18](https://docs.google.com/document/d/1QN9NwhAYhBidQtGV_XZtXKtYefSJFLZR/edit#heading=h.b1lyy2kzbo8t))** \</ProvinceName \>  
\<CommuneCode\> **Mã xã** (**Bắt buộc đối với hàng hóa đặc trưng loại 1**) **( xem tại [VII.18](#quyết-định-19/2025/qĐ-ttg))**\</CommuneCode\>  
\<CommuneName \> Tên xã/phường  (**Bắt buộc đối với hàng hóa đặc trưng loại 1**) **( xem tại [VII.18](https://docs.google.com/document/d/1QN9NwhAYhBidQtGV_XZtXKtYefSJFLZR/edit#heading=h.b1lyy2kzbo8t))\</**CommuneName **\>**   
\<PaymentMethod\>**Hình thức thanh toán bắt buộc (xem phụ lục [VII.1](#phương-thức-thanh-toán-\(trường-bắt-buộc\)))**\</PaymentMethod\>  
\<ArisingDate\>**Ngày phát sinh hóa đơn (mặc định là ngày hiện tại, chuỗi định dạng dd/MM/yyyy)** \</ArisingDate\>  
\<ExchangeRate\>**Tỷ giá chuyển đổi**\</ExchangeRate\>  
\<CurrencyUnit\>**Đơn vị tiền tệ (ví dụ VND, USD) (xem thêm tại phụ lục [VII.11](#Đơn-vị-tiền-tệ))**\</CurrencyUnit \>  
\<Extra\>**Thông tin bổ sung (định dạng json có các thuộc tính theo quy ước riêng nếu có phát sinh)** \</Extra\>  
\<Products\>  
\<Product\>  
	\<Code\>**Mã sản phẩm**\</Code\>  
\<No\>**Số thứ tự\</**No\>  
	\<Feature\>**Loại sản phẩm(xem phụ lục [VII.10](#feature))\</**Feature\>  
\<ProdName\>**Tên sản phẩm** \</ProdName\>  
\<ProdUnit\>**Đơn vị tính**\</ProdUnit\>  
\<ProdQuantity\>**Số lượng**\</ProdQuantity\>  
\<ProdPrice\>**Đơn giá**\</ProdPrice\>  
\<Discount\>Tỉ lệ chiết khấu\</Discount\>  
\<DiscountAmount\>Tổng tiền chiết khấu\</DiscountAmount\>  
\<Total\>**Tổng tiền trước thuế**\</Total\>  
\<VATRate\>**Thuế suất (xem phụ lục [VII.3](#thuế-suất))** \</VATRate\>  
\<VATRateOther\>**Thuế suất trong trường hợp thuế khác (Khi VATRate \= \-3)**\</VATRateOther\>  
\<VATAmount\>**Tiền thuế**\</VATAmount\>  
\<Amount\>**Tổng tiền sau thuế**\</Amount\>  
\<Extra\>**Thông tin bổ sung (định dạng json có các thuộc tính theo quy ước riêng nếu có phát sinh)**\</Extra\>  
\</Product\>  
\</Products\>  
\<Total\>**Tổng tiền trước thuế**\</Total\>  
\<VATRate\>**Thuế GTGT (xem phụ lục [VII.3](#thuế-suất))**\</VATRate\>  
\<VATRateOther\>**Thuế suất trong trường hợp thuế khác (Khi VATRate \= \-3)**\</VATRateOther\>  
\<VATAmount\>**Tiền thuế GTGT**\</VATAmount\>  
\<Amount\>**Tổng tiền**\</Amount\>  
\<DiscountAmount\>**Tổng tiền chiết khấu**\</DiscountAmount\>  
\<GrossValue\>Tổng tiền trước thuế thuế KCT\</GrossValue\>  
\<GrossValue0\>Tổng tiền trước thuế thuế 0%\</GrossValue0\>  
\<GrossValue5\>Tổng tiền trước thuế thuế 5%\</GrossValue5\>  
\<GrossValue10\>Tổng tiền trước thuế thuế 10%\</GrossValue10\>  
\<GrossValueNDeclared\>Tổng tiền trước thuế thuế KKKN\</GrossValueNDeclared\>  
\<GrossValueContractor\>Tổng tiền trước thuế thuế Khác\</GrossValueContractor\>  
\<VatAmount0\>Tổng tiền thuế thuế 0%\</VatAmount0\>  
\<VatAmount5\>Tổng tiền thuế thuế 5%\</VatAmount5\>  
\<VatAmount10\>Tổng tiền thuế thuế 10%\</VatAmount10\>  
\<VatAmountNDeclared\>Tổng tiền thuế thuế KKKN\</VatAmountNDeclared\>  
\<VatAmountContractor\>Tổng tiền thuế thuế Khác\</VatAmountContractor\>  
\<Amount0\>Tổng tiền sau thuế thuế 0%\</Amount0\>  
\<Amount5\>Tổng tiền sau thuế thuế 5%\</Amount5\>  
\<Amount10\>Tổng tiền sau thuế thuế 10%\</Amount10\>  
\<AmountNDeclared\>Tổng tiền sau thuế thuế KKKN\</AmountNDeclared\>  
\<AmountOther\>Tổng tiền sau thuế thuế Khác\</AmountOther\>  
\<GrossValue8\>Tổng tiền trước thuế thuế 8%\</GrossValue8\>  
 \<VatAmount8\>Tổng tiền thuế thuế 8%\</VatAmount8\>   
\<Amount8\>Tổng tiền sau thuế thuế 8%\</Amount8\>  
\<GrossCTTC\>Tổng tiền trước thuế thuế CTTC\</GrossCTTC\>  
\<VatAmountCTTC\>Tổng tiền thuế thuế CTTC\</VatAmountCTTC\>  
\<AmountCTTC\>Tổng tiền thuế thuế CTTC\</AmountCTTC\>  
\<AmountInWords\>**Số tiền viết bằng chữ**\</AmountInWords\>  
\</ReplaceInv\>

6. ## Hủy bỏ hóa đơn đã phát hành (đã ký số)

   Resource: “**api/business/cancelInvoice**”  
   Data: {“Ikey”: “Khóa xác định hóa đơn cần hủy”, “Pattern”: “Ký hiệu hóa đơn”, “Serial”: “Ký hiệu mẫu số hóa đơn”}

**Mô tả: Huỷ bỏ một hoá đơn đã phát hành**

* **Ikey\*:** Khóa xác định hóa đơn cần hủy  
* **Pattern**: Ký hiệu hóa đơn của hóa đơn (khuyến cáo nên có).  
* **Serial**: Ký hiệu mẫu số hóa đơn của hóa đơn (khuyến cáo nên có).  
* **Trả về**: Json

| Kết quả trả về | Mô tả | Ghi chú |
| :---- | :---- | :---- |
| { “**Status**”: “2”, “**Message**”: “Ok”, “**ErrorCode**”: “0”, “**Data**”:{          “**Pattern**”: “Dải mẫu số hoá đơn”,          “**Serial**”: “Ký hiệu hoá đơn”,  “**KeyInvoiceNo**”: {       “**ikey**”: “số hóa thay thế”      },    “**Invoices**”: \[         **Json object hoá đơn thay thế** (xem thuộc tính tại cột ghi chú)     \]   } } } | Thành công. | Status 2: Thành công. KeyInvoiceNo: Dictionary có Key là ikey hóa đơn (lấy từ đầu vào), Value là số được cấp của hóa đơn tương ứng. Json object hoá đơn có cấu trúc như sau: { “**InvoiceStatus**”: Mã trạng thái của hóa đơn (xem phụ lục V.2), “**Buyer**”: “Tên người mua hàng”, “**PublishedBy**”: “Tài khoản phát hành”, “**Pattern**”: “Ký hiệu hóa đơn”, “**Type”**: “Loại hoá đơn” “**Serial**”: “Ký hiệu mẫu số hóa đơn”, “**No**”: “Số hoá đơn”, “**LookupCode**”: “Mã tra cứu”, “**Ikey**”: “khoá tích hợp ikey”, “**ArisingDate**”: “Ngày tạo lập”,   “**IssueDate**”: “Ngày phát hành”,   “**CustomerName**”: “Tên khách hàng”,   “**CustomerAddress**”: “Địa chỉ  khách hàng”, “**CustomerCode**”: “Mã khách hàng”,   “**Total**”: “Tổng tiền trước thuế”, “**Amount**”: “Giá trị hoá đơn”,   “**LinkView**”: “Link tra cứu hoá đơn”,   “**TCTCheckStatus**”: “Trạng thái hoá đơn của CQT”,   “**CusIdentification**”: “số CCCD của khách hàng”, “**BudgetaryRelationshipCode**”: “Mã quan hệ ngân sách của  khách hàng”,   “**PassportNo**”: “Số hộ chiếu khách hàng”,   “**IsSentTCTSummary**”: “hoá đơn gửi bảng tổng hợp”,  } |
| {   “**Status**”: “\<Mã trạng thái\>”,   “**Message**”: “\<Nội dung lỗi\>”,   “**ErrorCode**”: “\<Mã lỗi\>”,  “**Data**”: {     “**KeyInvoiceMsg**”: {        “**ikey1**”: “Chi tiết lỗi hđ1”,        “**ikey2**”: “Chi tiết lỗi hđ2”      }   } } | Thất bại. | Status 4: Lỗi từ phía client. Status 5: Lỗi từ phía server. KeyInvoiceMsg (tuỳ chọn) kiểu dictionary có Key là ikey hóa đơn (lấy từ đầu vào), Value là chi tiết lỗi hóa đơn tương ứng |


**Ghi chú:** 

* Theo NĐ70, hoá đơn đã có chữ ký số hợp lệ thì không được phép huỷ. EasyInvoice thực hiện thay thế hoá đơn về hoá đơn 0 đồng  
* 

7. ## Xóa bỏ hóa đơn chưa phát hành (chưa ký số)

   Resource: “**api/business/removeUnsignedInvoice**”  
   Data: {“Ikey”: “Khóa xác định hóa đơn cần xóa”, “Pattern”: “Ký hiệu hóa đơn”, “Serial”: “Ký hiệu mẫu số hóa đơn”}

**Mô tả**

* **Ikey\*:** Khóa xác định hóa đơn cần xóa  
* **Pattern**: Ký hiệu hóa đơn của hóa đơn (khuyến cáo nên có).  
* **Serial**: Ký hiệu mẫu số hóa đơn (khuyến cáo nên có).  
* **Trả về**: Json

| Kết quả trả về | Mô tả | Ghi chú |
| :---- | :---- | :---- |
| { “**Status**”: “2”, “**Message**”: “Ok”, “**ErrorCode**”: “0” } | Thành công. | Status 2: Thành công. |
| {   “**Status**”: “\<Mã trạng thái\>”,   “**Message**”: “\<Nội dung lỗi\>”,  “**ErrorCode**”: “\<Mã lỗi\>”,  “**Data**”: {     “**KeyInvoiceMsg**”: {        “**ikey1**”: “Chi tiết lỗi hđ1”,        “**ikey2**”: “Chi tiết lỗi hđ2”      }   } } | Thất bại. | Status 4: Lỗi từ phía client. Status 5: Lỗi từ phía server. KeyInvoiceMsg (tuỳ chọn) kiểu dictionary  có Key là ikey hóa đơn (lấy từ đầu vào), Value là chi tiết lỗi hóa đơn tương ứng |




8. ## Kiểm tra trạng thái hóa đơn

   Resource: “**api/publish/checkInvoiceState**”  
   Data: {“ikeys: \[ “ikey1”, “ikey2”, “ikey3”\]}

**Mô tả: Khuyến cáo dùng [V.26](#truy-vấn-thông-tin-hoá-đơn-theo-tập-khoá-ikeys) để lấy được nhiều thông tin hơn**

* **Ikeys\***: Mảng chứa danh sách các khóa Ikey  
* **Trả về**: Json

| Kết quả trả về | Mô tả | Ghi chú |
| :---- | :---- | :---- |
| { “**Status**”: “2”, “**Message**”: “Ok”,   “**ErrorCode**”: “0”, “**Data**”: {    “**KeyInvoiceMsg**”: {       “**ikey1**”: “status1”,       “**ikey2**”: “status2”      }   } } | Thành công | Status 2: Thành công. KeyInvoiceMsg: Dictionary có Key là ikey hóa đơn (lấy từ đầu vào), Value là trạng thái hóa đơn tương ứng (xem trạng thái hoá đơn tại [Trạng thái hoá đơn](#trạng-thái-hoá-đơn))  |
| {   “**Status**”: “\<Mã trạng thái\>”,   “**ErrorCode**”: “\<Mã lỗi\>”,   “**Message**”: “\<Nội dung lỗi\>”} | Thất bại. | Status 4: Lỗi từ phía client. Status 5: Lỗi từ phía server. |

9. ## Xem hóa đơn

   Resource: “**api/publish/viewInvoice**”  
   Data: {“Ikey”: “key của hóa đơn”, “Pattern”: “Ký hiệu hóa đơn”, “Option”: “Giá trị tuỳ chọn”, “Serial”: “Ký hiệu hoá đơn”}

**Mô tả: Khuyến cáo dùng hàm [V.24](#tải-hoá-đơn-định-dạng-pdf/xml) để tải file PDF/XML thay vì html**

* **Ikey\***: Khóa của hóa đơn cần xem  
* **Pattern**: Mẫu số  hóa đơn (khuyến cáo nên có)  
* **Serial**: Ký hiệu hóa đơn (khuyến cáo nên có)  
* **Option:** 0 – Nhận dữ liệu html của hoá đơn  
* **Trả về**: Json

| Kết quả trả về | Mô tả | Ghi chú |
| :---- | :---- | :---- |
| { “**Status**”: “2”, “**Message**”: “Ok”,   “**ErrorCode**”: “0”, “**Data**”: {    “**Html**”: “Dữ liệu html của hóa đơn”,    “**InvoiceStatus**”: Mã trạng tháicủa hóa đơn (xem phụ lục V.2),     “**Buyer**”: “Người mua”,     “**TaxAmount**”: “Tổng tiền thuế”,     “**PublishedBy**”: “Người phát hành”,     “**Type**”: “Loại hoá đơn”,     “**Pattern**”: “Mẫu số”,     “**Serial**”: “Ký hiệu mẫu số hóa đơn”,     “**No**”: “Số hoá đơn”,     “**Ikey**”: “khoá tích hợp ikey”,     “**ArisingDate**”: “Ngày tạo lập”,     “**IssueDate**”: “Ngày phát hành”,     “**CustomerName**”: “Tên khách hàng”,     “**CustomerAddress**”: “Địa chỉ khách hàng”,     “**CustomerCode**”: “Mã khách hàng”,     “**CustomerTaxCode**”: “Mã số thuế khách hàng”,     “**Total**”: “Tổng tiền trước thuế”,     “**Amount**”: “Thành tiền hoá đơn”,     “**LookupCode**”: “Mã tra cứu”,     “**LinkView**”: “Đường dẫn tra cứu hoá đơn”,     “**ModifiedDate**”: “Ngày sửa đổi”,     “**IsSentTCTSummary**”: “Gửi bảng tổng hợp”,     “**TCTCheckStatus**”: “Trạng thái hoá đơn từ CQT trả về”,     “**TCTErrorMessage**”: “Lỗi gửi từ CQT”,     “**TaxAuthorityCode**”: “Mã của CQT”,     “**CusIdentification**”: “Số CCCD của khách hàng”, “**BudgetaryRelationshipCode**”: “Mã quan hệ ngân sách”,     “**PassportNo**”: “Số hộ chiếu”,   } } | Lấy dữ liệu html của hóa đơn thành công, chi tiết trả về trong thuộc tính Data. | Status 2: Thành công. Html: Chuỗi html của hóa đơn. ArisingDate và IssueDate kiểu chuỗi theo format dd/MM/yyyy |
| {   “**Status**”: “\<Mã trạng thái\>”,   “**Message**”: “\<Nội dung lỗi\>”,   “**ErrorCode**”: “\<Mã lỗi\>”,  “**Data**”: {     “**KeyInvoiceMsg**”: {        “**ikey1**”: “Chi tiết lỗi hđ1”,        “**ikey2**”: “Chi tiết lỗi hđ2”      }   } } | Thất bại. | Status 4: Lỗi từ phía client. Status 5: Lỗi từ phía server. KeyInvoiceMsg (tuỳ chọn) kiểu dictionary  có Key là ikey hóa đơn (lấy từ đầu vào), Value là chi tiết lỗi hóa đơn tương ứng |

10. ## Phát hành hóa đơn

    *1: Trường hợp ký server*  
    Resource: “**api/publish/issueInvoices**”  
    Data: {“Ikeys”: \[ “ikey1”, “ikey2”, “ikey3”\], “Pattern”: “Ký hiệu hóa đơn”, “Serial”: “Ký hiệu mẫu số hóa đơn”}  
    *Note:* Khuyến nghị nên phát hành tối đa 50 hoá đơn trong 1 request để đảm bảo hiệu năng API

**Mô tả: Phát hành hoá đơn nháp hoặc hoá đơn chờ ký đã được tạo từ trước**

* **Ikeys\***: Mảng chứa danh sách các khóa Ikey có chung mẫu số và ký hiệu  
* **Pattern\***: Ký hiệu hóa đơn  
* **Serial**: Ký hiệu mẫu số hóa đơn (khuyến cáo nên có)  
* **Trả về**: Json

| Kết quả trả về | Mô tả | Ghi chú |
| :---- | :---- | :---- |
| { “**Status**”: “2”, “**Message**”: “Ok”,   “**ErrorCode**”: “0”, “**Data**”: {    “**Pattern**”: “Tên mẫu”,    “**Serial**”: “Ký hiệu mẫu số hóa đơn”,    “**KeyInvoiceNo**”: {       “**ikey1**”: “số hđ 1”,       “**ikey2**”: “số hđ 2”      },    “**Invoices**”: \[       **Json object hoá đơn1** (xem thuộc tính tại cột ghi chú),       **Json object hoá đơn2** (xem thuộc tính tại cột ghi chú),      …     \]   } } | Phát hành thành công gói hóa đơn. | Status 2: Thành công. KeyInvoiceNo: Dictionary có Key là ikey hóa đơn (lấy từ đầu vào), Value là số được cấp của hóa đơn tương ứng. Json object hoá đơn có cấu trúc như sau: { “**InvoiceStatus**”: Mã trạng thái của hóa đơn (xem phụ lục [VII.2](#trạng-thái-hoá-đơn)), “**Buyer**”: “Người mua”, “**TaxAmount**”: “Tiền thuế”, “**PublishedBy**”: “Tài khoản phát hành”, “**Type**”: “Loại hoá đơn”, “**Pattern**”: “Mẫu”, “**Serial**”: “Ký hiệu mẫu số hóa đơn”, “**No**”: “Số hoá đơn”, “**LookupCode**”: “Mã tra cứu”, “**Ikey**”: “khoá tích hợp ikey”, “**ArisingDate**”: “Ngày tạo lập”,   “**IssueDate**”: “Ngày phát hành”,   “**CustomerName**”: “Tên khách hàng”, “**CustomerCode**”: “Mã khách hàng”, “**CustomerAddress**”: “Địa chỉ khách hàng”, “**CustomerTaxCode**”: “Mã số thuế khách hàng”, “**Total**”: “Tổng tiền trước thuế”, “**Amount**”: “Giá trị hoá đơn”, “**LinkView**”: “Link tra cứu hoá đơn”, “**IsSentTCTSummary**”: “Hoá đơn gửi bảng tổng hợp”, “**TCTCheckStatus**”: “Trạng thái CQT trả về”, “**CusIdentification**”: “Số CCCD của khách hàng”, “**BudgetaryRelationshipCode**”: “Mã quan hệ ngân sách”, “**PassportNo**”: “Số hộ chiếu”  } |
| {   “**Status**”: “\<Mã trạng thái\>”,   “**Message**”: “\<Nội dung lỗi\>”,   “**ErrorCode**”: “\<Mã lỗi\>”,  “**Data**”: {     “**KeyInvoiceMsg**”: {        “**ikey1**”: “Chi tiết lỗi hđ1”,        “**ikey2**”: “Chi tiết lỗi hđ2”      }   } } | Thất bại. | Status 4: Lỗi từ phía client. Status 5: Lỗi từ phía server. KeyInvoiceMsg (tuỳ chọn) kiểu dictionary  có Key là ikey hóa đơn (lấy từ đầu vào), Value là chi tiết lỗi hóa đơn tương ứng |

  *2: Trường hợp ký client*

  Resource: “**api/publish/issueInvoices**”

  Data: {“Ikeys”: \[ “ikey1”, “ikey2”, “ikey3”\], “Pattern”: “Ký hiệu hóa đơn”, “Serial”: “Ký hiệu hóa đơn”, “CertString”: “Chuỗi base64 chứng thư” }

  **Mô tả: Phát hành hoá đơn nháp hoặc chờ ký đã được tạo từ trước. Đây là bước 1 lấy digest từ máy chủ (xem bước 2 tại V.11)**

* **Ikeys\***: Mảng chứa danh sách các khóa Ikey có chung mẫu số và ký hiệu  
* **CertString\*:** Chuỗi Base64 của chứng thư.  
* **Pattern**: Ký hiệu hóa đơn (khuyến cáo nên có)  
* **Serial**: Ký hiệu mẫu số hóa đơn (khuyến cáo nên có)  
* **Trả về**: Json

| Kết quả trả về | Mô tả | Ghi chú |
| :---- | :---- | :---- |
| {   “**Status**”: “2”,   “**Message**”: “Ok”,   “**Data**”: {     “**Pattern**”: “Tên mẫu”,     “**Serial**”: “Ký hiệu mẫu số hóa đơn”,     “**DigestData**”: {         “**key1**”: “digest value 1”,         “**key2**”: “digest value 2”      }   } } | Thành công | Status 2: Thành công. DigestData: Dictionary có Key là khoá digest (được sinh từ phía server), Value là digest value cần ký. |
| {   “**Status**”: “\<Mã trạng thái\>”,   “**Message**”: “\<Nội dung lỗi\>”, “**Data**”: {     “**KeyInvoiceMsg**”: {       “**ikey1**”: “Chi tiết lỗi”      }   } } | Thất bại. | Status 4: Lỗi từ phía client. Status 5: Lỗi từ phía server. KeyInvoiceMsg (tuỳ chọn) kiểu dictionary  có Key là ikey hóa đơn (lấy từ đầu vào), Value là chi tiết lỗi hóa đơn tương ứng |

11. ## Phát hành hóa đơn tạm (được tạo từ V.10.2, ký client)

    Resource: “**api/publish/externalWrapAndLaunchForIssuance**”  
    Data: {”Pattern”: “Ký hiệu hóa đơn”, “Serial”: “Ký hiệu mẫu số hóa đơn”, “Signature”: “Từ điển chứa chữ ký số cho gói hoá đơn” }

    **Mô tả: Đây là bước 2 (xem bước 1 ở mục V.10.2) gửi chữ ký số lên máy chủ và kết thúc**

* **Signature\***: Từ điển chứa chữ ký số cho gói hoá đơn với Key là khoá gửi từ Server (cũng là Key trong từ điển*Data.DigestData* được gửi từ API lấy digest ở bước 1), Value là chữ ký số cho hoá đơn.  
* **Pattern**: Ký hiệu hóa đơn (khuyến cáo nên có)  
* **Serial**: Ký hiệu mẫu số hóa đơn (khuyến cáo nên có)  
* **Trả về**: Json

| Kết quả trả về | Mô tả | Ghi chú |
| :---- | :---- | :---- |
| {   “**Status**”: “2”,   “**Message**”: “Ok”,   “**ErrorCode**”: “0”   “**Data**”: {     “**Pattern**”: “Ký hiệu hóa đơn”,     “**Serial**”: “Ký hiệu mẫu số hóa đơn”,     “**KeyInvoiceNo**”: {         “**ikey1**”: “số hđ 1”,         “**ikey2**”: “số hđ 2”      },    “**Invoices**”: \[       **Json object hoá đơn1** (xem thuộc tính tại cột ghi chú),       **Json object hoá đơn2** (xem thuộc tính tại cột ghi chú),      …     \]   } } | Phát hành thành công gói hóa đơn. | Status 2: Thành công. Pattern: Ký hiệu hóa đơn của các hóa đơn đã phát hành. Serial: Ký hiệu mẫu số hóa đơn của dãy các hóa đơn phát hành. KeyInvoiceNo: Từ điển có Key là ikey hóa đơn (lấy từ đầu vào), Value là số được cấp của hóa đơn tương ứng. Json object hoá đơn có cấu trúc như sau: { “**InvoiceStatus**”: Mã trạng thái của hóa đơn (xem phụ lục [VII.2](#trạng-thái-hoá-đơn)), “**Buyer**”: “Người mua”, “**TaxAmount**”: “Tiền thuế”, “**PublishedBy**”: “Tài khoản phát hành”, “**Type**”: “Loại hoá đơn”, “**Pattern**”: “Mẫu”, “**Serial**”: “Ký hiệu mẫu số hóa đơn”, “**No**”: “Số hoá đơn”, “**LookupCode**”: “Mã tra cứu”, “**Ikey**”: “khoá tích hợp ikey”, “**ArisingDate**”: “Ngày tạo lập”,   “**IssueDate**”: “Ngày phát hành”,   “**CustomerName**”: “Tên khách hàng”, “**CustomerCode**”: “Mã khách hàng”, “**CustomerAddress**”: “Địa chỉ khách hàng”, “**CustomerTaxCode**”: “Mã số thuế khách hàng”, “**Total**”: “Tổng tiền trước thuế”, “**Amount**”: “Giá trị hoá đơn”, “**LinkView**”: “Link tra cứu hoá đơn”, “**IsSentTCTSummary**”: “Hoá đơn gửi bảng tổng hợp”, “**TCTCheckStatus**”: “Trạng thái CQT trả về”, “**CusIdentification**”: “Số CCCD của khách hàng”, “**BudgetaryRelationshipCode**”: “Mã quan hệ ngân sách”, “**PassportNo**”: “Số hộ chiếu”  } |
| {   “**Status**”: “\<Mã trạng thái\>”,   “**Message**”: “\<Nội dung lỗi\>”,   “**ErrorCode**”: “\<Mã lỗi\>”,  “**Data**”: {     “**KeyInvoiceMsg**”: {        “**ikey1**”: “Chi tiết lỗi hđ1”,        “**ikey2**”: “Chi tiết lỗi hđ2”      }   } } | Thất bại. | Status 4: Lỗi từ phía client. Status 5: Lỗi từ phía server. KeyInvoiceMsg (tuỳ chọn) kiểu dictionary  có Key là ikey hóa đơn (lấy từ đầu vào), Value là chi tiết lỗi hóa đơn tương ứng |

12. ## Thêm/Sửa thông tin khách hàng

    Resource: “**api/publish/updateCustomer**”  
    Data: {“XmlData”: “Chuỗi Xml”}

**Mô tả:**

* **XmlData\***: Chuỗi Xml dữ liệu thông tin khách hàng (xem cấu trúc ở dưới)  
* **Trả về**: Json

| Kết quả trả về | Mô tả | Ghi chú |
| :---- | :---- | :---- |
| {   “**Status**”: “2”,   “**Message**”: “Ok”,   “**ErrorCode**”: “0” } | Thành công. | Status 2: Thành công. |
| {   “**Status**”: “\<Mã trạng thái\>”,   “**Message**”: “\<Nội dung lỗi\>”,   “**ErrorCode**”: “\<Mã lỗi\>” } | Thất bại. | Status 4: Lỗi từ phía client. Status 5: Lỗi từ phía server. |

**Note:**   
**Cấu trúc của XmlData (các trường \* là bắt buộc, các trường gạch chân không hỗ trợ cập nhật):**  
\<Customers\>  
\<Customer\>  
\<Code\>**\*Mã khách hàng**\</Code\>  
\<AccountName\>**\*Tài khoản tra cứu hóa đơn**\</AccountName\>  
\<Name\>**\*Tên khách hàng**\</Name\>  
\<Buyer\>**Tên người mua hàng(bắt buộc với hoá đơn là hàng hoá đặc trưng loại 1\)**\</Buyer\>  
\<Address\>**Địa chỉ khách hàng**\</Address\>  
\<TaxCode\>**Mã số thuế (Bắt buộc với KH Doanh nghiệp)**\</TaxCode\>  
\<BankName\>**Tên ngân hàng**\</BankName\>  
\<BankAccountName\>**Tên chủ tài khoản ngân hàng**\</BankAccountName\>  
\<BankNumber\>**Số tài khoản ngân hàng**\</BankNumber\>  
\<Email\>**Địa chỉ email**\</Email\>  
\<EmailCC\>**Danh sách email CC (ngăn cách bởi dấu phẩy)** \</EmailCC\>  
\<Fax\>**Số máy Fax**\</Fax\>  
\<Phone\>**Số điện thoại**\</Phone\>  
\<ContactPerson\>**Tên người liên hệ**\</ContactPerson\>  
\<RepresentPerson\>**Tên người đại diện pháp luật**\</RepresentPerson\>  
\<CusType\>**Kiểu khách hàng (1: KH là đơn vị kế toán, 0: KH không phải là đơn vị kế toán)**\</CusType\>  
\</Customer\>  
\</Customers\>

13. ## Thêm/Sửa thông tin sản phẩm, dịch vụ

    Resource: “**api/publish/updateProduct**”

    Data: {“XmlData: ”Chuỗi Xml”}

**Mô tả**

* **XmlData\***: Chuỗi Xml dữ liệu thông tin sản phẩm, dịch vụ (xem cấu trúc ở dưới)  
* **Trả về**: Json

| Kết quả trả về | Mô tả | Ghi chú |
| :---- | :---- | :---- |
| {   “**Status**”: “2”,   “**Message**”: “Ok”,   “**ErrorCode**”: “0”, } | Thành công. | Status 2: Thành công. |
| {   “**Status**”: “\<Mã trạng thái\>”,   “**Message**”: “\<Nội dung lỗi\>”,   “**ErrorCode**”: “\<Mã lỗi\>” } | Thất bại. | Status 4: Lỗi từ phía client. Status 5: Lỗi từ phía server. |

**Note:**   
**Cấu trúc của XmlData (các trường \* là bắt buộc):**  
\<Products\>  
\<Product\>  
\<Code\>**\*Mã sản phẩm**\</Code\>  
\<Name\>**\*Tên sản phẩm**\</Name\>  
\<Price\>**Đơn giá**\</Price\>  
\<Unit\>**Đơn vị tính**\</Unit\>  
\<Des\>**Mô tả**\</Des\>  
\<VATRate\>**\*Thuế GTGT (xem phụ lục [VII.3](#thuế-suất))**\</VATRate\>  
\</Product\>  
\</Products\>

14. ## Tạo dải hoá đơn chờ ký

    *Tuỳ chọn 1: Tạo dải hoá đơn chờ ký (hoá đơn để dành) từ tham số Quantity*  
    Resource: “**api/business/createInvoiceStrip**”  
    Data: {“Pattern”: “Ký hiệu hóa đơn”, “Serial”: “Ký hiệu mẫu số hóa đơn”, “Quantity”: “Số lượng” }

**Mô tả: Tạo hoá đơn trắng có số để sử dụng sau**

* **Pattern\***: Ký hiệu hóa đơn của hóa đơn (bắt buộc).  
* **Serial\***: Ký hiệu mẫu số hóa đơn (bắt buộc).  
* **Quantity\*:** Số lượng hoá đơn chờ ký, kiểu số nguyên dương.  
* **Trả về**: Json

| Kết quả trả về | Mô tả | Ghi chú |
| :---- | :---- | :---- |
| {   “**Status**”: “2”,   “**Message**”: “Ok”,   “**ErrorCode**”: “0”,   “**Data**”: {     “**Pattern**”: “Ký hiệu hóa đơn”,     “**Serial**”: “Ký hiệu mẫu số hóa đơn”,     “**InvoiceNo**”: \[      “số hoá đơn chờ ký 1”,      “số hoá đơn chờ ký 2”     \]   } } | Thành công | Status 2: Thành công. InvoiceNo: Mảng chứa danh sách các số hoá đơn chờ ký. |
| {   “**Status**”: “\<Mã trạng thái\>”,   “**Message**”: “\<Nội dung lỗi\>”,   “**ErrorCode**”: “\<Mã lỗi\>”,  “**Data**”: {     “**KeyInvoiceMsg**”: {        “**ikey1**”: “Chi tiết lỗi hđ1”,        “**ikey2**”: “Chi tiết lỗi hđ2”      }   } } | Thất bại. | Status 4: Lỗi từ phía client. Status 5: Lỗi từ phía server. KeyInvoiceMsg (tuỳ chọn) kiểu dictionary  có Key là ikey hóa đơn (lấy từ đầu vào), Value là chi tiết lỗi hóa đơn tương ứng |


  

  *Tuỳ chọn 2: Tạo dải hoá đơn chờ ký từ tham số IkeyDate*

  Resource: “**api/business/createInvoiceStrip**”

  Data: {“Pattern”: “Ký hiệu hóa đơn”, “Serial”: “Ký hiệu mẫu số hóa đơn”, “IkeyDate”: “Từ điển chứa ikey và ngày hoá đơn”}

**Mô tả**

* **Pattern\***: Ký hiệu hóa đơn của hóa đơn (bắt buộc).  
* **Serial\***: Ký hiệu mẫu số hóa đơn (bắt buộc).  
* **IkeyDate\*:** Từ điển với Key là khoá ikey của hoá đơn gửi từ client, Value là chuỗi ngày hoá đơn định dạng dd/MM/yyyy. Số lượng hoá đơn để dành được tạo và trả về bằng với số lượng phần tử của từ điển IkeyDate.  
* **Trả về**: Json

| Kết quả trả về | Mô tả | Ghi chú |
| :---- | :---- | :---- |
| { “**Status**”: “2”, “**Message**”: “Ok”, “**Data**”: { “**Pattern**”: “Ký hiệu hóa đơn”, “**Serial**”: “Ký hiệu mẫu số hóa đơn”, “**KeyInvoiceNo**”: {    “**ikey1**”: “số hóa đơn 1”,    “**ikey2**”: “số hóa đơn 2”      }   } } | Thành công | Status 2: Thành công. KeyInvoiceNo: Dictionary có Key là ikey hóa đơn (lấy từ mảng Ikeys client gửi lên), Value là số để dành được cấp của hóa đơn tương ứng. |
| {   “**Status**”: “5”,   “**Message**”: “Có lỗi xảy ra” } | Thất bại. | Status 5: Lỗi từ phía server. |

15. ## Tạo hoá đơn tạm (được lưu cache, ký client)

    Resource: “**api/publish/externalGetDigestForImportation**”  
    Data: {“XmlData”: “Chuỗi Xml”, “Pattern”: “Ký hiệu hóa đơn”, “Serial”: “Ký hiệu mẫu số hóa đơn”, “CertString”: “Chuỗi chứng thư” }

**Mô tả: Đây là bước 1 lấy digest từ máy chủ, hoá đơn chưa được lưu vào db**

* **Pattern**: Ký hiệu hóa đơn của hóa đơn (khuyến cáo nên có).  
* **Serial**: Ký hiệu mẫu số hóa đơn (khuyến cáo nên có).  
* **CertString\*:** Chuỗi Base64 của chứng thư.  
* **XmlData\***: Chuỗi Xml dữ liệu hóa đơn (xem cấu trúc ở cuối mục)  
* **Trả về**: Json

| Kết quả trả về | Mô tả | Ghi chú |
| :---- | :---- | :---- |
| {   “**Status**”: “2”,   “**Message**”: “Ok”,   “**ErrorCode**”: “0”,   “**Data**”: {     “**Pattern**”: “Ký hiệu hóa đơn”,     “**Serial**”: “Ký hiệu mẫu số hóa đơn”,     “**DigestData**”: {         “**key1**”: “digest value 1”,         “**key2**”: “digest value 2”      }   } } | Tạo gói hoá đơn chờ phát hành thành công. Digest được trả về | Status 2: Thành công. DigestData: Dictionary có Key là khoá digest (được sinh từ phía server), Value là digest value cần ký. |
| {   “**Status**”: “\<Mã trạng thái\>”,   “**Message**”: “\<Nội dung lỗi\>”,   “**ErrorCode**”: “\<Mã lỗi\>”,  “**Data**”: {     “**KeyInvoiceMsg**”: {        “**ikey1**”: “Chi tiết lỗi hđ1”,        “**ikey2**”: “Chi tiết lỗi hđ2”      }   } } | Thất bại. | Status 4: Lỗi từ phía client. Status 5: Lỗi từ phía server. KeyInvoiceMsg (tuỳ chọn) kiểu dictionary  có Key là ikey hóa đơn (lấy từ đầu vào), Value là chi tiết lỗi hóa đơn tương ứng |

**Note:**

* Chỉ chấp nhận phát hành gói tin chứa tối đa 20 hóa đơn.  
* Thời gian lưu cache của hoá đơn tạm là ***2 phút***.  
* Hóa đơn sẽ được cập nhật thông tin trước khi được phát hành nếu đã tồn tại hóa đơn có cùng ikey trong hệ thống và có trạng thái là mới tạo lập.  
* Thông tin khách hàng trong hóa đơn sẽ được thêm mới, đồng thời tạo mới tài khoản tra cứu nếu chưa tồn tại trong hệ thống (chi tiết tài khoản được gửi về địa chỉ email cũng như hướng dẫn tra cứu mỗi khi có hóa đơn mới thuộc khách hàng đó được phát hành), hoặc được cập nhật nếu đã tồn tại trong hệ thống, khóa là trường CusCode (xem trong cấu trúc XmlData).

  **Cấu trúc của XmlData: Tương tự XmlData của hàm V.3**

16. ## Phát hành hóa đơn tạm (được tạo từ V.15, ký client)

    Resource: “**api/publish/externalWrapAndLaunchImportation**”  
    Data: {”Pattern”: “Ký hiệu hóa đơn”, “Serial”: “Ký hiệu mẫu số hóa đơn”, “Signature”: “Từ điển chứa chữ ký số cho gói hoá đơn” }

**Mô tả: Đây là bước 2 gửi chữ ký số lên máy chủ và kết thúc, hoá đơn được lưu db**

* **Signature\***: Từ điển chứa chữ ký số cho gói hoá đơn với Key là khoá gửi từ Server (cũng là Key trong từ điển *Data.DigestData* được gửi từ API tạo hoá đơn tạm IV.15), Value là chữ ký số cho hoá đơn.  
* **Pattern**: Ký hiệu hóa đơn (khuyến cáo nên có)  
* **Serial**: Ký hiệu mẫu số hóa đơn (khuyến cáo nên có)  
* **Trả về**: Json

| Kết quả trả về | Mô tả | Ghi chú |
| :---- | :---- | :---- |
| {   “**Status**”: “2”,   “**Message**”: “Ok”,   “**ErrorCode**”: “0”,   “**Data**”: {     “**Pattern**”: “Tên mẫu”,     “**Serial**”: “Ký hiệu mẫu số hóa đơn”,     “**KeyInvoiceNo**”: {         “**ikey1**”: “số hóa đơn 1”,         “**ikey2**”: “số hóa đơn 2”      },     “**Invoices**”: \[        **Json object hoá đơn1** (xem thuộc tính tại cột ghi chú),        **Json object hoá đơn2** (xem thuộc tính tại cột ghi chú),      …     \]   } } | Phát hành thành công gói hóa đơn. | Status 2: Thành công. Pattern: Ký hiệu hóa đơn của các hóa đơn đã phát hành. Serial: Ký hiệu mẫu số hóa đơn của dãy các hóa đơn phát hành. KeyInvoiceNo: Từ điển có Key là ikey hóa đơn (lấy từ đầu vào), Value là số được cấp của hóa đơn tương ứng. Json object hoá đơn có cấu trúc như sau: { “**InvoiceStatus**”: Mã trạng thái của hóa đơn (xem phụ lục V.2), “**Pattern**”: “Ký hiệu hóa đơn”, “**Serial**”: “Ký hiệu mẫu số hóa đơn”, “**No**”: “Số hoá đơn”, “**LookupCode**”: “Mã tra cứu”, “**Ikey**”: “khoá tích hợp ikey”, “**ArisingDate**”: “Ngày tạo lập”,   “**IssueDate**”: “Ngày phát hành”,   “**CustomerName**”: “Tên khách hàng”, “**CustomerCode**”: “Mã khách hàng”, “**Buyer**”: “Người mua”, “**Amount**”: “Giá trị hoá đơn”  } |
| {   “**Status**”: “\<Mã trạng thái\>”,   “**Message**”: “\<Nội dung lỗi\>”,   “**ErrorCode**”: “\<Mã lỗi\>”,  “**Data**”: {     “**KeyInvoiceMsg**”: {        “**ikey1**”: “Chi tiết lỗi hđ1”,        “**ikey2**”: “Chi tiết lỗi hđ2”      }   } } | Thất bại. | Status 4: Lỗi từ phía client. Status 5: Lỗi từ phía server. KeyInvoiceMsg (tuỳ chọn) kiểu dictionary  có Key là ikey hóa đơn (lấy từ đầu vào), Value là chi tiết lỗi hóa đơn tương ứng |

17. ## Tạo hoá đơn thay thế tạm (được lưu cache, ký client)

    Resource: “**api/publish/externalGetDigestForReplacement**”  
    Data: {“XmlData”: “Chuỗi Xml”, “Pattern”: “Ký hiệu hóa đơn”, “Serial”: “Ký hiệu mẫu số hóa đơn”, “Ikey”: “ikey”, “CertString”: “Chuỗi chứng thư” }

**Mô tả: Đây là bước 1 lấy digest từ máy chủ, hoá đơn chưa được lưu db**

* **Pattern**: Ký hiệu hóa đơn của hóa đơn (khuyến cáo nên có).  
* **Serial**: Ký hiệu mẫu số hóa đơn (khuyến cáo nên có).  
* **CertString\*:** Chuỗi Base64 của chứng thư.  
* **XmlData\***: Chuỗi Xml dữ liệu hóa đơn (xem cấu trúc ở cuối mục)  
* **Ikey\*:** Khóa duy nhất xác định hóa đơn cần thay thế  
* **Trả về**: Json

| Kết quả trả về | Mô tả | Ghi chú |
| :---- | :---- | :---- |
| {   “**Status**”: “2”,   “**Message**”: “Ok”,   “**ErrorCode**”: “0”,   “**Data**”: {     “**Pattern**”: “Ký hiệu hóa đơn”,     “**Serial**”: “Ký hiệu mẫu số hóa đơn”,     “**DigestData**”: {         “key”: “digest value”      }   } } | Thành công. Digest được trả về | Status 2: Thành công. Pattern: Mẫu số của các hóa đơn đã phát hành. Serial: Ký hiệu mẫu số hóa đơn của dãy các hóa đơn phát hành. DigestData: Từ điển có Key là khoá digest (được sinh từ phía server), Value là digest value cần ký. |
| {   “**Status**”: “\<Mã trạng thái\>”,   “**Message**”: “\<Nội dung lỗi\>”,   “**ErrorCode**”: “\<Mã lỗi\>”,  “**Data**”: {     “**KeyInvoiceMsg**”: {        “**ikey1**”: “Chi tiết lỗi hđ1”,        “**ikey2**”: “Chi tiết lỗi hđ2”      }   } } | Thay thế hóa đơn thất bại | Status 4: Lỗi từ phía client. Status 5: Lỗi từ phía server. KeyInvoiceMsg (tuỳ chọn) kiểu dictionary  có Key là ikey hóa đơn (lấy từ đầu vào), Value là chi tiết lỗi hóa đơn tương ứng |


**Note:** 

* Thông tin khách hàng trong hóa đơn sẽ được cập nhật nếu đã tồn tại trong hệ thống, khóa là trường CusCode (xem trong cấu trúc XmlData).  
* Thời gian lưu cache của hoá đơn tạm là ***2 phút***.

  **Cấu trúc của XmlData: Tương tự XmlData của hàm V.5**

18. ## Phát hành hóa đơn thay thế tạm (được tạo từ V.17, ký client)

    Resource: “**api/publish/externalWrapAndLaunchReplacement**”  
    Data: {”Pattern”: “Ký hiệu hóa đơn”, “Serial”: “Ký hiệu mẫu số hóa đơn”, “Signature”: “Từ điển chứa chữ ký số cho hoá đơn thay thế”, “Ikey”: “ikey” }

**Mô tả: Đây là bước 2 gửi chữ ký số lên máy chủ và kết thúc, hoá đơn được lưu db**

* **Signature\***: Từ điển chứa chữ ký số cho hoá đơn thay thếvới Key là khoá gửi từ Server (cũng là Key trong từ điển *Data.DigestData* được gửi từ API tạo hoá đơn thay thế tạm V.17), Value là chữ ký số cho hoá đơn thay thế.  
* **Ikey\*:** Khóa duy nhất xác định hóa đơn cần thay thế  
* **Pattern**: Ký hiệu hóa đơn (khuyến cáo nên có)  
* **Serial**: Ký hiệu mẫu số hóa đơn (khuyến cáo nên có)  
* **Trả về**: Json

| Kết quả trả về | Mô tả | Ghi chú |
| :---- | :---- | :---- |
| {   “**Status**”: “2”,   “**Message**”: “Ok”,   “**ErrorCode**”: “0”,   “**Data**”: {     “**Pattern**”: “Ký hiệu hóa đơn”,     “**Serial**”: “Ký hiệu mẫu số hóa đơn”,     “**KeyInvoiceNo**”: {         “ikey”: “số hóa đơn thay thế”      }   },   “**Invoices**”: \[       **Json object hoá đơn1** (xem thuộc tính tại cột ghi chú),       **Json object hoá đơn2** (xem thuộc tính tại cột ghi chú),      …     \] } | Thành công. | Status 2: Thành công. KeyInvoiceNo: Dictionary có Key là ikey hóa đơn thay thế (lấy từ đầu vào), Value là số được cấp của hóa đơn tương ứng. Json object hoá đơn có cấu trúc như sau: { “**InvoiceStatus**”: Mã trạng thái của hóa đơn (xem phụ lục [VII.2](#trạng-thái-hoá-đơn)), “**Buyer**”: “Người mua”, “**TaxAmount**”: “Tiền thuế”, “**PublishedBy**”: “Tài khoản phát hành”, “**Type**”: “Loại hoá đơn”, “**Pattern**”: “Mẫu”, “**Serial**”: “Ký hiệu mẫu số hóa đơn”, “**No**”: “Số hoá đơn”, “**LookupCode**”: “Mã tra cứu”, “**Ikey**”: “khoá tích hợp ikey”, “**ArisingDate**”: “Ngày tạo lập”,   “**IssueDate**”: “Ngày phát hành”,   “**CustomerName**”: “Tên khách hàng”, “**CustomerCode**”: “Mã khách hàng”, “**CustomerAddress**”: “Địa chỉ khách hàng”, “**CustomerTaxCode**”: “Mã số thuế khách hàng”, “**Total**”: “Tổng tiền trước thuế”, “**Amount**”: “Giá trị hoá đơn”, “**LinkView**”: “Link tra cứu hoá đơn”, “**IsSentTCTSummary**”: “Hoá đơn gửi bảng tổng hợp”, “**TCTCheckStatus**”: “Trạng thái CQT trả về”, “**CusIdentification**”: “Số CCCD của khách hàng”, “**BudgetaryRelationshipCode**”: “Mã quan hệ ngân sách”, “**PassportNo**”: “Số hộ chiếu”  } |
| {   “**Status**”: “\<Mã trạng thái\>”,   “**Message**”: “\<Nội dung lỗi\>”,   “**ErrorCode**”: “\<Mã lỗi\>”,  “**Data**”: {     “**KeyInvoiceMsg**”: {        “**ikey1**”: “Chi tiết lỗi hđ1”,        “**ikey2**”: “Chi tiết lỗi hđ2”      }   } } | Thất bại. | Status 4: Lỗi từ phía client. Status 5: Lỗi từ phía server. KeyInvoiceMsg (tuỳ chọn) kiểu dictionary  có Key là ikey hóa đơn (lấy từ đầu vào), Value là chi tiết lỗi hóa đơn tương ứng |

19. ## Tạo hoá đơn điều chỉnh tạm (được lưu cache, ký client)

    Resource: “**api/publish/externalGetDigestForAdjustment**”  
    Data: {“XmlData”: ”Chuỗi Xml”, ”Pattern”: ”Ký hiệu hóa đơn”, ”Serial”: ”Ký hiệu mẫu số hóa đơn”, ”Ikey”: ”ikey”, “CertString”: “Chuỗi chứng thư” }

**Mô tả: Đây là bước 1 lấy digest từ máy chủ, hoá đơn chưa được lưu db**

* **Pattern**: Ký hiệu hóa đơn (khuyến cáo nên có).  
* **Serial**: Ký hiệu mẫu số hóa đơn (khuyến cáo nên có).  
* **CertString\*:** Chuỗi Base64 của chứng thư.  
* **XmlData\***: Chuỗi Xml dữ liệu hóa đơn điều chỉnh (xem cấu trúc ở cuối mục)  
* **Ikey\*:** Khóa duy nhất xác định hóa đơn cần điều chỉnh  
* **Trả về**: Json

| Kết quả trả về | Mô tả | Ghi chú |
| :---- | :---- | :---- |
| {   “**Status**”: “2”,   “**Message**”: “Ok”,   “**ErrorCode**”: “0”,   “**Data**”: {     “**Pattern**”: “Ký hiệu hóa đơn”,     “**Serial**”: “Ký hiệu mẫu số hóa đơn”,     “**DigestData**”: {         “key”: “digest value”      }   } } | Thành công. | Status 2: Thành công. DigestData: Từ điển có Key là khoá digest (được sinh từ phía server), Value là digest value cần ký. |
| {   “**Status**”: “\<Mã trạng thái\>”,   “**Message**”: “\<Nội dung lỗi\>”,   “**ErrorCode**”: “\<Mã lỗi\>”,  “**Data**”: {     “**KeyInvoiceMsg**”: {        “**ikey1**”: “Chi tiết lỗi hđ1”,        “**ikey2**”: “Chi tiết lỗi hđ2”      }   } } | Thất bại. | Status 4: Lỗi từ phía client. Status 5: Lỗi từ phía server. KeyInvoiceMsg (tuỳ chọn) kiểu dictionary  có Key là ikey hóa đơn (lấy từ đầu vào), Value là chi tiết lỗi hóa đơn tương ứng |


**Note:** 

* Thông tin khách hàng trong hóa đơn sẽ được cập nhật nếu đã tồn tại trong hệ thống, khóa là trường CusCode (xem trong cấu trúc XmlData).  
* Thời gian lưu cache của hoá đơn tạm là ***2 phút***.

  **Cấu trúc của XmlData: Tương tự XmlData của hàm V.4**


20. ## Phát hành hóa đơn điều chỉnh tạm (được tạo từ IV.19, ký client)

    Resource: “**api/publish/externalWrapAndLaunchAdjustment**”  
    Data: {”Pattern”: “Ký hiệu hóa đơn”, “Serial”: “Ký hiệu mẫu số hóa đơn”, “Signature”: “Từ điển chứa chữ ký số cho hoá đơnđiều chỉnh”, “Ikey”: “ikey” }

**Mô tả: Đây là bước 2 gửi chữ ký số lên máy chủ và kết thúc, hoá đơn được lưu db**

* **Signature\***: Từ điển chứa chữ ký số cho hoá đơnđiều chỉnhvới Key là khoá gửi từ Server (cũng là Key trong từ điển *Data.DigestData* được gửi từ API tạo hoá đơn thay thế tạm IV.19), Value là chữ ký số cho hoá đơn điều chỉnh.  
* **Ikey\*:** Khóa duy nhất xác định hóa đơn cần điều chỉnh  
* **Pattern**: Ký hiệu hóa đơn (khuyến cáo nên có)  
* **Serial**: Ký hiệu mẫu số hóa đơn (khuyến cáo nên có)  
* **Trả về**: Json

| Kết quả trả về | Mô tả | Ghi chú |
| :---- | :---- | :---- |
| {   “**Status**”: “2”,   “**Message**”: “Ok”,   “**Data**”: {     “**Pattern**”: “Ký hiệu hóa đơn”,     “**Serial**”: “Ký hiệu mẫu số hóa đơn”,     “**ErrorCode**”: “0”,     “**KeyInvoiceNo**”: {         “ikey”: “số hóa đơn điều chỉnh”      },     “**Invoices**”: \[        **Json object hoá đơn1** (xem thuộc tính tại cột ghi chú),        **Json object hoá đơn2** (xem thuộc tính tại cột ghi chú),      …     \]   } } | Thành công. | Status 2: Thành công. Pattern: Ký hiệu hóa đơn của các hóa đơn đã phát hành. Serial: Ký hiệu mẫu số hóa đơn của dãy các hóa đơn phát hành. KeyInvoiceNo: Từ điển có Key là ikey hóa đơnđiều chỉnh (lấy từ đầu vào), Value là số được cấp của hóa đơn tương ứng. Json object hoá đơn có cấu trúc như sau: { “**InvoiceStatus**”: Mã trạng thái của hóa đơn (xem phụ lục [VII.2](#trạng-thái-hoá-đơn)), “**Buyer**”: “Người mua”, “**TaxAmount**”: “Tiền thuế”, “**PublishedBy**”: “Tài khoản phát hành”, “**Type**”: “Loại hoá đơn”, “**Pattern**”: “Mẫu”, “**Serial**”: “Ký hiệu mẫu số hóa đơn”, “**No**”: “Số hoá đơn”, “**LookupCode**”: “Mã tra cứu”, “**Ikey**”: “khoá tích hợp ikey”, “**ArisingDate**”: “Ngày tạo lập”,   “**IssueDate**”: “Ngày phát hành”,   “**CustomerName**”: “Tên khách hàng”, “**CustomerCode**”: “Mã khách hàng”, “**CustomerAddress**”: “Địa chỉ khách hàng”, “**CustomerTaxCode**”: “Mã số thuế khách hàng”, “**Total**”: “Tổng tiền trước thuế”, “**Amount**”: “Giá trị hoá đơn”, “**LinkView**”: “Link tra cứu hoá đơn”, “**IsSentTCTSummary**”: “Hoá đơn gửi bảng tổng hợp”, “**TCTCheckStatus**”: “Trạng thái CQT trả về”, “**CusIdentification**”: “Số CCCD của khách hàng”, “**BudgetaryRelationshipCode**”: “Mã quan hệ ngân sách”, “**PassportNo**”: “Số hộ chiếu”  } |
| {   “**Status**”: “\<Mã trạng thái\>”,   “**Message**”: “\<Nội dung lỗi\>”,   “**ErrorCode**”: “\<Mã lỗi\>”,  “**Data**”: {     “**KeyInvoiceMsg**”: {        “**ikey1**”: “Chi tiết lỗi hđ1”,        “**ikey2**”: “Chi tiết lỗi hđ2”      }   } } | Thất bại. | Status 4: Lỗi từ phía client. Status 5: Lỗi từ phía server. KeyInvoiceMsg (tuỳ chọn) kiểu dictionary  có Key là ikey hóa đơn (lấy từ đầu vào), Value là chi tiết lỗi hóa đơn tương ứng |

21. ## Tải báo cáo tình hình sử dụng hoá đơn

    Resource: “**api/business/getInvoiceUsageReport**”

Data: {”FromDate”: “Từ ngày”, “ToDate”: “Đến ngày”, “Option”: “Mã loại báo cáo”}  
**Mô tả**

* **FromDate\***: Ngày bắt đầu lấy dữ liệu báo cáo, kiểu chuỗi định dạng dd/MM/yyyy  
* **ToDate\*:** Ngày kết thúc lấy dữ liệu báo cáo, kiểu chuỗi định dạng dd/MM/yyyy  
* **Option\*:** Mã loại báo cáo  
  - 0: File Excel dùng cho lưu trữ (mặc định)  
  - 1: File Excel dùng để nhập vào HTKK  
  - 2: File Xml theo định dạng HTKK  
* **Trả về**: File báo cáo

22. ## Tải bảng kê chứng từ hàng hóa, dịch vụ bán ra

    Resource: “**api/business/getInvoiceReport**”

Data: {”FromDate”: “Từ ngày”, “ToDate”: “Đến ngày”, “Option”: “Mã loại báo cáo”}  
**Mô tả**

* **FromDate\***: Ngày bắt đầu lấy dữ liệu báo cáo, kiểu chuỗi định dạng dd/MM/yyyy  
* **ToDate\*:** Ngày kết thúc lấy dữ liệu báo cáo, kiểu chuỗi định dạng dd/MM/yyyy  
* **Option\*:** Mã loại báo cáo  
  - 0: File HTML (mặc định)  
  - 1: File Excel   
* **Trả về**: File báo cáo

23. ## Danh sách số hoá đơn chờ ký

    Resource: “**api/business/getInvoiceStrip**”  
    Data: {“Pattern”: “Ký hiệu hóa đơn”, “Serial”: “Ký hiệu mẫu số hóa đơn” }

**Mô tả**

* **Pattern\***: Ký hiệu hóa đơn của hóa đơn.  
* **Serial\***: Ký hiệu mẫu số hóa đơn.  
* **Trả về**: Json

| Kết quả trả về | Mô tả | Ghi chú |
| :---- | :---- | :---- |
| {   “**Status**”: “2”,   “**Message**”: “Ok”,   “**ErrorCode**”: “0”,   “**Data**”: {     “**Pattern**”: “Ký hiệu hóa đơn”,     “**Serial**”: “Ký hiệu mẫu số hóa đơn”,     “**InvoiceNo**”: \[      số hoá đơn chờ ký 1,      số hoá đơn chờ ký 2,      …     \]   } } | Thành công | Status 2: Thành công. InvoiceNo: Mảng chứa danh sách các số hoá đơn chờ ký. |
| {   “**Status**”: “\<Mã trạng thái\>”,   “**ErrorCode**”: “\<Mã lỗi\>”,   “**Message**”: “\<Nội dung lỗi\>” } | Thất bại. | Status 4: Lỗi từ phía client. Status 5: Lỗi từ phía server.  |


24. ## Tải hoá đơn định dạng PDF/XML

    Resource: “**api/publish/getInvoicePdf**”  
    Data: {“Ikey: “key của hóa đơn”, “Pattern”: “Ký hiệu hóa đơn”, “Option”: “Giá trị tuỳ chọn”}

**Mô tả**

* **Ikey\***: Khóa tích hợp của hóa đơn cần tải.  
* **Pattern**: Ký hiệu hóa đơn (khuyến cáo nên có).  
* **Option**:  
  * \-1: Tệp xml  
  *  0: Tệp pdf thông thường  
  *  1: Tệp pdf chuyển đổi chứng minh nguồn gốc  
  *  2: Tệp pdf chuyển đổi lưu trữ  
* **Trả về**: File hoá đơn PDF hoặc XML

25. ##  Truy vấn thông tin hoá đơn theo tập khoá Ikeys

    Resource: “**api/publish/getInvoicesByIkeys**”

Data: { “Ikeys”: \[ “ikey1”, “ikey2”, “ikey3”\] }  
**Mô tả**

* **Ikeys\***: Mảng chứa danh sách các khóa Ikey của các hoá đơn cần truy vấn  
* **Trả về**: Json

| Kết quả trả về | Mô tả | Ghi chú |
| :---- | :---- | :---- |
| {   “**Status**”: “2”,   “**Message**”: “Ok”, “**ErrorCode**”: “0”,   “**Data**”: {   “**Invoices**”: \[      **Json object hoá đơn1** (xem thuộc tính tại cột ghi chú),      **Json object hoá đơn2** (xem thuộc tính tại cột ghi chú),      …     \]   } } | Thành công. | Status 2: Thành công. Json object hoá đơn có cấu trúc như sau: { “**InvoiceStatus**”: Mã trạng thái của hóa đơn (xem phụ lục V.2), “**Buyer**”: “Người mua hàng”, “**Pattern**”: “Ký hiệu hóa đơn”, “**Serial**”: “Ký hiệu mẫu số hóa đơn”, “**No**”: “Số hoá đơn”, “**LookupCode**”: “Mã tra cứu”, “**Ikey**”: “khoá tích hợp ikey”, “**ArisingDate**”: “Ngày tạo lập”,   “**IssueDate**”: “Ngày phát hành”,   “**CustomerName**”: “Tên khách hàng”, “**CustomerCode**”: “Mã khách hàng”, “**Buyer**”: “Người mua”, “**Amount**”: “Giá trị hoá đơn”, **“IsSentTCTSummary”** : “trang thái hóa đơn đã được gửi theo bảng tổng hợp hay chưa”, **“TCTCheckStatus”** : “Trạng thái thuế duyệt”, *\*Xem phụ lục V.13*   **“TCTErrorMessage”** : “Mô tả lỗi của cơ quan thuế”, **“TaxAuthorityCode”** : “Mã hóa đơn của cơ quan thuế cấp (trường hợp : hóa đơn có mã)”  } |
| {   “**Status**”: “\<Mã trạng thái\>”, “**ErrorCode**”: “\<Mã lỗi\>”,   “**Message**”: “\<Nội dung lỗi\>” } | Thất bại. | Status 4: Lỗi từ phía client. Status 5: Lỗi từ phía server.  |

26. ## Tải hoá đơn XML/PDF theo mã tra cứu

    Resource: “**api/publish/getInvoicePdfByFkey**”  
    Data: {“Fkey: “key của hóa đơn”, “Pattern”: “Ký hiệu hóa đơn”, “Option”: “Giá trị tuỳ chọn”}

**Mô tả**

* **Fkey\***: Mã tra cứu của hóa đơn.  
* **Pattern**: Ký hiệu hóa đơn (khuyến cáo nên có).  
* **Option**:  
  * \-1: Tệp xml  
  *  0: Tệp pdf thông thường  
  *  1: Tệp pdf chuyển đổi chứng minh nguồn gốc  
  *  2: Tệp pdf chuyển đổi lưu trữ  
* **Trả về**: File hoá đơn PDF hoặc XML

27. ##  Truy vấn thông tin hoá đơn theo ngày hóa đơn

    Resource: “**api/business/getInvoiceByArisingDateRange**”

Data: {“FromDate”: “Từ ngày”, “ToDate”: “Đến ngày”, “Page”: “Số thứ tự trang”, “PageSize”: “Kích thước trang”, “DownloadInvPDF”: “Đường dẫn tải về file PDF hoá đơn”, “OptionalField”: “Các trường hiển thị bổ sung”, “InvNo”: “Danh sách số hoá đơn truy vấn thông tin”, “Option”: “Tùy chọn loại hóa đơn”}  
**Mô tả**

* **FromDate**: Ngày bắt đầu (dd/MM/yyyy).  
* **ToDate**: Ngày kết thúc (dd/MM/yyyy).  
* **Pattern**: Ký hiệu hóa đơn.  
* **Page:** Số thứ tự trang  
* **PageSize**: Kích thước 1 trang (lớn nhất là 100\)  
* **DownloadInvPDF:** Đường dẫn tải về file PDF hoá đơn  
* **OptionalField:** Các trường hiển thị bổ sung  
* **InvNo:** Danh sách số hoá đơn truy vấn thông tin  
* **Option**:  
  *  0: Chỉ hóa đơn được tích hợp đẩy lên  
  *  1: Tất cả hóa đơn  
    

| Kết quả trả về | Mô tả | Ghi chú |
| :---- | :---- | :---- |
| {   “**Status**”: “2”,   “**Message**”: “Ok”,   “**ErrorCode**”: “0”,   “**Data**”: { “**Page**”: 1, “**PageSize**”: 100, “**TotalRecords**”: 20, “**TotalPages**”: 1,   “**Invoices**”: \[      **Json object hoá đơn1** (xem thuộc tính tại cột ghi chú),      **Json object hoá đơn2** (xem thuộc tính tại cột ghi chú),      …     \]   } } | Thành công. | Status 2: Thành công. Json object hoá đơn có cấu trúc như sau: { “**InvoiceStatus**”: Mã trạng thái của hóa đơn (xem phụ lục V.2), “**Pattern**”: “Mẫu”, “**Serial**”: “Ký hiệu mẫu số hóa đơn”, “**No**”: “Số hoá đơn”, “**LookupCode**”: “Mã tra cứu”, “**Ikey**”: “khoá tích hợp ikey”, “**ArisingDate**”: “Ngày tạo lập”,   “**IssueDate**”: “Ngày phát hành”,   “**CustomerName**”: “Tên khách hàng”, “**CustomerCode**”: “Mã khách hàng”, “**Buyer**”: “Người mua”, “**Amount**”: “Giá trị hoá đơn”, **“IsSentTCTSummary”** : “Bool \- Đã gửi báo cáo thuế chưa”, **“TCTCheckStatus”** : “Trạng thái thuế duyệt”, **“TCTErrorMessage”** : “Mã lỗi từ cơ quan thuế. Không có sẽ \= null”,  } |
| {   “**Status**”: “\<Mã trạng thái\>”,   “**ErrorCode**”: “\<Mã lỗi\>”,   “**Message**”: “\<Nội dung lỗi\>” } | Thất bại. | Status 4: Lỗi từ phía client. Status 5: Lỗi từ phía server.  |

Ghi chú:

* Để đảm bảo hiệu năng API, người dùng lưu ý:   
- Nếu trung bình số hóa đơn xuất trong 1 ngày nhỏ hơn 50 hoá đơn thì truy vấn trong khoảng 1 năm  
- Nếu từ 50 đến 300 hoá đơn trong ngày thì truy vấn trong vòng 6 tháng  
- Nếu từ 300 đến 500 hoá đơn trong ngày thì truy vấn trong vòng 3 tháng  
- Nếu lớn hơn 500 hoá đơn trong ngày thì truy vấn trong vòng 1 tháng đổ lại


28. ##  Gửi lại thông báo phát hành hoá đơn

    Resource: “**api/business/sendIssuanceNotice**”

Data: { “IkeyEmail”: {“ikey1”: ”email1”, ”ikey2”: ”email2”} }  
**Mô tả**

* **IkeyEmail\*:** Khóa ikey duy nhất của hoá đơn ghép cặp với email khách hàng \- định dạng json KeyValuePair (Ví dụ: “IkeyEmail”: {“ikey1”: ”email1”, ”ikey2”: ”email2”}) sử dụng để gửi lại thông báo phát hành cho hoá đơn.  
* **Trả về**: Json

| Kết quả trả về | Mô tả | Ghi chú |
| :---- | :---- | :---- |
| { “**Status**”: “2”, “**Message**”: “Ok”, “**ErrorCode**”: 0”, “**Data**”: {    “**KeyInvoiceMsg**”: {       “**ikey1**”: “Lỗi, hoá đơn không tồn tại trong hệ thống”,       “**ikey2**”: “Thành công, yêu cầu gửi lại thông báo phát hành đã được xử lý”,       “**ikey3**”: “Lỗi, hoá đơn ở trạng thái không được gửi thông báo phát hành”      }   } } |  Thành công  | Status 2: Thành công. KeyInvoiceMsg: Từ điển có Key là ikey hóa đơn (lấy từ đầu vào), Value là chi tiết trạng thái xử lý. **Lưu ý:** KeyInvoiceMsg chứa chi tiết trạng thái theo từng ikey bao gồm cả thành công và lỗi |
| {   “**Status**”: “\<Mã trạng thái\>”, “**ErrorCode**”: “\<Mã lỗi\>”,   “**Message**”: “\<Nội dung lỗi\>” } | Thất bại. | Status 4: Lỗi từ phía client. Status 5: Lỗi từ phía server.  |

29. ##  Điều chỉnh hóa đơn (bản nháp, chưa ký số, chưa có số hoá đơn)

    Resource: “**api/business/importUnsignedAdjustment**”.  
    Data: {“XmlData”: “Chuỗi Xml”, “Ikey”: “ikey”, “Pattern”: “Ký hiệu hóa đơn”, “Serial”: “Ký hiệu mẫu số hóa đơn”}

**Mô tả**

* **XmlData\***: Chuỗi Xml dữ liệu hóa đơn (xem cấu trúc ở cuối mục)  
* **Ikey\*:** Khóa duy nhất xác định hóa đơn cần điều chỉnh.  
* **Pattern**: Ký hiệu hóa đơn của hóa đơn (khuyến cáo nên có).  
* **Serial**: Ký hiệu mẫu số hóa đơn (khuyến cáo nên có).  
* **Trả về**: Json

| Kết quả trả về | Mô tả | Ghi chú |
| :---- | :---- | :---- |
| { “**Status**”: “2”, “**Message**”: “Ok”, “**ErrorCode**”: “0”, “**Data**”: {    “**Pattern**”: “Ký hiệu hóa đơn”,    “**Serial**”: “Ký hiệu mẫu số hóa đơn,    “**Invoices**”: \[       **Json object hoá đơn điều chỉnh** (xem thuộc tính tại cột ghi chú)     \]   } } | Thành công | Status 2: Thành công. Json object hoá đơn có cấu trúc như sau: { “**InvoiceStatus**”: Mã trạng thái của hóa đơn (xem phụ lục [VII.2](#trạng-thái-hoá-đơn)), “**Buyer**”: “Người mua”, “**TaxAmount**”: “Tiền thuế”, “**PublishedBy**”: “Tài khoản phát hành”, “**Type**”: “Loại hoá đơn”, “**Pattern**”: “Mẫu”, “**Serial**”: “Ký hiệu mẫu số hóa đơn”, “**No**”: “Số hoá đơn”, “**LookupCode**”: “Mã tra cứu”, “**Ikey**”: “khoá tích hợp ikey”, “**ArisingDate**”: “Ngày tạo lập”,   “**IssueDate**”: “Ngày phát hành”,   “**CustomerName**”: “Tên khách hàng”, “**CustomerCode**”: “Mã khách hàng”, “**CustomerAddress**”: “Địa chỉ khách hàng”, “**CustomerTaxCode**”: “Mã số thuế khách hàng”, “**Total**”: “Tổng tiền trước thuế”, “**Amount**”: “Giá trị hoá đơn”, “**LinkView**”: “Link tra cứu hoá đơn”, “**IsSentTCTSummary**”: “Hoá đơn gửi bảng tổng hợp”, “**TCTCheckStatus**”: “Trạng thái CQT trả về”, “**CusIdentification**”: “Số CCCD của khách hàng”, “**BudgetaryRelationshipCode**”: “Mã quan hệ ngân sách”, “**PassportNo**”: “Số hộ chiếu”  } |
| {   “**Status**”: “\<Mã trạng thái\>”,   “**Message**”: “\<Nội dung lỗi\>”, “**ErrorCode**”: “\<Mã lỗi\>”,  “**Data**”: {     “**KeyInvoiceMsg**”: {        “**ikey1**”: “Chi tiết lỗi hđ1”,        “**ikey2**”: “Chi tiết lỗi hđ2”      }   } } | Thất bại. | Status 4: Lỗi từ phía client. Status 5: Lỗi từ phía server. KeyInvoiceMsg (tuỳ chọn) kiểu dictionary  có Key là ikey hóa đơn (lấy từ đầu vào), Value là chi tiết lỗi hóa đơn tương ứng. |


**Note:** 

* Thông tin khách hàng trong hóa đơn sẽ được cập nhật nếu đã tồn tại trong hệ thống, khóa là trường CusCode (xem trong cấu trúc XmlData).

**Cấu trúc của XmlData (Xem API [V.4](#Điều-chỉnh-hóa-đơn-\(ký-server\)))**

30. ##  Thay thế hóa đơn (bản nháp, chưa ký số, chưa có số hoá đơn)

    Resource: “**api/business/importUnsignedReplacement**”.  
    Data: {“XmlData”: “Chuỗi Xml”, “Ikey”: “ikey”, “Pattern”: “Ký hiệu hóa đơn”, “Serial”: “Ký hiệu mẫu số hóa đơn”}

**Mô tả**

* **XmlData\***: Chuỗi Xml dữ liệu hóa đơn (xem cấu trúc ở cuối mục)  
* **Ikey\*:** Khóa duy nhất xác định hóa đơn cần thay thế  
* **Pattern**: Ký hiệu hóa đơn của hóa đơn (khuyến cáo nên có).  
* **Serial**: Ký hiệu mẫu số hóa đơn (khuyến cáo nên có).  
* **Trả về**: Json

| Kết quả trả về | Mô tả | Ghi chú |
| :---- | :---- | :---- |
| { “**Status**”: “2”, “**Message**”: “Ok”, “**ErrorCode**”: “0”, “**Data**”: {    “**Pattern**”: “Ký hiệu hóa đơn”,    “**Serial**”: “Ký hiệu mẫu số hóa đơn”,    “**Ikey**”:\[         “Khoá hoá đơn”     \],    “**Invoices**”: \[       **Json object hoá đơn thay thế** (xem thuộc tính tại cột ghi chú)     \]   } } | Thành công | Status 2: Thành công. Pattern: Ký hiệu hóa đơn của các hóa đơn điều chỉnh. Serial: Ký hiệu mẫu số hóa đơn của các hóa đơn điều chỉnh. Json object hoá đơn có cấu trúc như sau: { “**InvoiceStatus**”: Mã trạng thái của hóa đơn (xem phụ lục [VII.2](#trạng-thái-hoá-đơn)), “**Buyer**”: “Người mua”, “**TaxAmount**”: “Tiền thuế”, “**PublishedBy**”: “Tài khoản phát hành”, “**Type**”: “Loại hoá đơn”, “**Pattern**”: “Mẫu”, “**Serial**”: “Ký hiệu mẫu số hóa đơn”, “**No**”: “Số hoá đơn”, “**LookupCode**”: “Mã tra cứu”, “**Ikey**”: “khoá tích hợp ikey”, “**ArisingDate**”: “Ngày tạo lập”,   “**IssueDate**”: “Ngày phát hành”,   “**CustomerName**”: “Tên khách hàng”, “**CustomerCode**”: “Mã khách hàng”, “**CustomerAddress**”: “Địa chỉ khách hàng”, “**CustomerTaxCode**”: “Mã số thuế khách hàng”, “**Total**”: “Tổng tiền trước thuế”, “**Amount**”: “Giá trị hoá đơn”, “**LinkView**”: “Link tra cứu hoá đơn”, “**IsSentTCTSummary**”: “Hoá đơn gửi bảng tổng hợp”, “**TCTCheckStatus**”: “Trạng thái CQT trả về”, “**CusIdentification**”: “Số CCCD của khách hàng”, “**BudgetaryRelationshipCode**”: “Mã quan hệ ngân sách”, “**PassportNo**”: “Số hộ chiếu”  } |
| {   “**Status**”: “\<Mã trạng thái\>”,   “**Message**”: “\<Nội dung lỗi\>”,   “**ErrorCode**”: “\<Mã lỗi\>”,  “**Data**”: {     “**KeyInvoiceMsg**”: {        “**ikey1**”: “Chi tiết lỗi hđ1”,        “**ikey2**”: “Chi tiết lỗi hđ2”      }   } } | Thất bại | Status 4: Lỗi từ phía client. Status 5: Lỗi từ phía server. KeyInvoiceMsg (tuỳ chọn) kiểu dictionary có Key là ikey hóa đơn (lấy từ đầu vào), Value là chi tiết lỗi hóa đơn tương ứng |


**Note:** 

* Thông tin khách hàng trong hóa đơn sẽ được cập nhật nếu đã tồn tại trong hệ thống, khóa là trường CusCode (xem trong cấu trúc XmlData).

**Cấu trúc của xmlData của hoá đơn thay thế (Xem API [V.5](#thay-thế-hóa-đơn-\(ký-server\)))**

31. ##  Xem trước hóa đơn

    Resource: “**api/publish/previewInvoice**”  
    Data: {“XmlData: “Chuỗi XML”, “Pattern”: “Ký hiệu hóa đơn”, “Serial”: “Ký hiệu mẫu số hóa đơn”, “Option”: “Giá trị tuỳ chọn”, “InvoiceType”: Loại hóa đơn}

**Mô tả**

* **XmlData**: Chuỗi XML hóa đơn.  
* **Pattern**: Ký hiệu hóa đơn (khuyến cáo nên có).  
* **Serial :** Ký hiệu mẫu số hóa đơn (khuyến cáo nên có).  
* **Option**:  
  *  0: Tệp HTML  
  *  1: Tệp pdf (Mặc định)  
* **InvoiceType**:  
  *  0: Hóa đơn tạo mới thông thường(Mặc định)  
  *  1: Hóa đơn thay thế  
  *  2: Hóa đơn điều chỉnh tăng  
  *  3: Hóa đơn điều chỉnh giảm  
  *  4: Hóa đơn điều chỉnh thông tin  
* **Trả về**: File hoá đơn PDF hoặc HTML

32. ##  Thêm Ikey vào hoá đơn đã cấp số (hoá đơn được tạo trên web hoá đơn điện tử Easy Invoice)

    Resource: “**api/publish/insertIKey**”  
    Data: {“Ikey”: “Khoá định danh”, “No”: “Số hoá đơn”, “Pattern”: “Ký hiệu hóa đơn”, “Serial”: “Ký hiệu mẫu số hóa đơn”}  
* **Ikey\***: Khóa tích hợp của cần thêm vào hoá đơn.  
* **No\***: Số của hoá đơn cần thêm khoá.  
* **Pattern**: Ký hiệu hóa đơn (khuyến cáo nên có).  
* **Serial**: Ký hiệu mẫu số hóa đơn (khuyến cáo nên có)  
* **Trả về**: Json

| Kết quả trả về | Mô tả | Ghi chú |
| :---- | :---- | :---- |
| {   “**Status**”: “2”,   “**Message**”: “Ok”,   “**ErrorCode**”: “0” } | Thành công. | Status 2: Thành công.  |
| {   “**Status**”: “\<Mã trạng thái\>”,   “**Message**”: “\<Nội dung lỗi\>”,   “**ErrorCode**”: “\<Mã lỗi\>” } | Thất bại. | Status 4: Lỗi từ phía client. Status 5: Lỗi từ phía server. |

33. ##  Tải hoá đơn định dạng XML theo tập mã khách hàng BETA

    Resource: “**api/publish/getInvoiceByCusCodes**”  
    Data: {“CusCodes”: \[ “CusCode1”, “CusCode2”, “CodeCode3”\],   
    “Pattern”: “Ký hiệu hóa đơn”, “FromDate”: “Từ ngày”, “ToDate”: “Đến ngày”,   
    “No” : “Số hóa đơn”, “SignStatus”: “Trạng thái ký”  }

**Mô tả**

* **CusCodes\***: Tập mã khách hàng cần tra cứu.  
* **Pattern**: Ký hiệu hóa đơn (khuyến cáo nên có).  
* **Serial :** Ký hiệu mẫu số hóa đơn (khuyến cáo nên có).  
* **FromDate**: Ngày bắt đầu (dd/MM/yyyy).  
* **ToDate**: Ngày kết thúc (dd/MM/yyyy).  
* **No :** Số hóa đơn  
* **InvoiceStatus :** Trạng thái hóa đơn  
  - **\-1 :** Tất cả  
  -  **1 :** Đã phát hành  
  -  **2 :** Đã kê khai  
  -  **3 :** Đã thay thế  
  -  **4 :** Đã điều chỉnh  
* **SignStatus :** Trạng thái ký  
  - **\-1:** Tất cả  
  - **0 :** Chưa ký  
  - **1 :** Đã ký  
  - **2 :** Không phải ký  
* **Trả về**: File hoá đơn XML

34. ##  Thông báo sai sót

	Resource: “**/api/business/sendErrorNotice**”  
request : “{  
        "**TypeNoti**": 1,  
        "**TaxAuthNo**": null,  
        "**TaxAuthDate**":  null,  
        "**CreateDate**": "02/02/2022",  
        "**Province**": "Định danh"  
        "**ErrorList**": \[  
                {  
                        "**Pattern**": 1C22CCC,  
                        "**Serial**": "",  
                        "**TaxAuthorityCode**": "3NV6W75N44235VJA3N4HJN5",  
                        "**No**": 1,  
                        "**ArisingDate**": "01/02/2022",  
                        "**InvType**": 2,  
                        "**Note**": "Lý do"  
                }  
        \]  
}”

* "**TypeNoti**": "loại thông báo sai sót"  
  * **1** : Thông báo hủy/giải trình của NNT,  
  * **2** : Thông báo hủy/giải trình của NNT theo thông báo của CQT  
* "**TaxAuthNo**": "Số thông báo của cơ quan thuế, bắt buộc có dữ liệu khi chon type \= 2, nếu không để null",  
* "**TaxAuthDate**": "Ngày thông báo của cơ quan thuế, bắt buộc có dữ liệu khi chon type \= 2, nếu không để null",  
* "**CreateDate**": "Ngày tạo lập thông báo sai sót (Bắt buộc)",  
* "**Pattern**": "Mẫu số (Bắt buộc)",  
* "**Serial**": "Ký hiệu (Không có để trống "")",  
* "**TaxAuthorityCode**": "Mã CQT cấp bắt buộc (Trừ trường hợp là hđ không có mã của CQT)",  
* "**No**": số hóa đơn,  
* "**ArisingDate**": "Ngày hóa đơn",  
* "**InvType**":   
  * **1** : Hóa đơn điện tử theo Nghị định 123/2020/NĐ-CP \--\> Mặc định  
  * **2** : Hóa đơn điện tử có mã xác thực của CQT theo Quyết định số 1209/QĐ-BTC và số 2660/QĐ-BTC  
  * **3** :  Các loại hóa đơn theo Nghị định số 51/2010/NĐ-CP và số 04/2014/NĐ-CP  
  * **4** : Hóa đơn đặt in theo Nghị định 123/2020/NĐ-CP  
* "**Note**": "Lý do"

Response : 

| Kết quả trả về | Mô tả | Ghi chú |
| :---- | :---- | :---- |
| {   “**Status**”: “2”,   “**Message**”: “Ok”,   “**ErrorCode**”: “0” } | Thành công. | Status 2: Thành công.  |

# **VI. Mô tả chi tiết các trường xml hoá đơn**

1. ## Mô tả thông tin xml request hoá đơn

| Field | Type | Format | Required | Description | Note |
| ----- | ----- | ----- | ----- | ----- | ----- |
| Ikey | String | MinLength: 1MaxLength: 50 | True | Khoá tích hợp | Sử dụng làm khoá duy nhất tham chiếu giữa 2 hệ thống. Đảm bảo là giá trị duy nhất tương ứng với mỗi hoá đơn |
| LocationCode  | String | Maxlength: 5 | True (nếu là HKD/CNKD) | Mã địa điểm kinh doanh |  |
| LocationName | String | Maxlength: 400 | True (nếu là HKD/CNKD) | Tên địa điểm kinh doanh |  |
| LocationAddress  | String | Maxlength: 400 | True (nếu là HKD/CNKD) | Địa chỉ địa điểm kinh doanh |  |
| StoreCode | String | Maxlength: 50 | False | Mã cửa hàng |  |
| StoreName | String | Maxlength: 400 | False | Tên cửa hàng |  |
| CusCode | String | MaxLength: 50 |  | Mã khách hàng | Nếu trên hệ thống chưa tồn tại mã khách hàng, thì sẽ thêm mới khách hàng vào hệ thống |
| Buyer | String | MaxLength: 100 |   | Tên người mua hàng | Trường *Buyer* và *CusName* không được đồng thời bỏ trống **bắt buộc với hoá đơn là hàng hoá đặc trưng loại 1** |
| CusName | String | MaxLength: 400 |   | Tên khách hàng | Trường *Buyer* và *CusName* không được đồng thời bỏ trống. Khách hàng là doanh nghiệp bắt buộc phải nhập *CusName* |
| Email | String | MaxLength: 50 |  | Địa chỉ thư điện tử nhận thông báo phát hành hoá đơn | Chỉ chứa 1 địa chỉ thư điện tử duy nhất(sử dụng khi không có CusEmails và hệ thống tìm thấy Email trong Customer)  |
| EmailCC | String | MaxLength: 255 |  | Danh sách địa chỉ thư điện tử CC nhận thông báo phát hành hoá đơn  | Các địa chỉ email ngăn cách nhau bởi dấu phẩy “,”(sử dụng khi không có CusEmails và hệ thống tìm thấy EmailCC trong Customer)  |
| CusEmails | String | MaxLength: 255 |  | Danh sách các địa chỉ thư điện tử | Các địa chỉ email ngăn cách nhau bởi dấu phẩy “,”(Ưu tiên gửi mail theo thông tin CusEmails ) |
| CusAddress | String | MaxLength: 400 |   | Địa chỉ khách hàng | Bắt buộc với khách hàng là doanh nghiệp,**bắt buộc với hoá đơn là hàng hoá đặc trưng loại 1** |
| CusBankName | String | MaxLength: 400 |   | Tên ngân hàng khách hàng |  |
| CusBankNo | String | MaxLength: 30 |   | Số tài khoản ngân hàng khách hàng |  |
| CusPhone | String | MaxLength: 20 |   | Số điện thoại khách hàng | **bắt buộc với hoá đơn là hàng hoá đặc trưng loại 1** |
| CusTaxCode | String | MaxLength: 14 |   | Mã số thuế khách hàng |  Khi có thông tin mã số thuế thì bắt buộc nhập *CusName* và *CusAddress* **bắt buộc với hoá đơn là hàng hoá đặc trưng loại 1** |
| CusIdenification | String | MaxLength: 12 |  | Căn cước công dân người mua hàng | Bắt buộc khi là hàng hoá đặc trưng loại 1 |
| AdjustReplaceReasonCode   | String | MaxLength: 2 |  | Mã lý do | Xem chi tiết các mã tại [VII.13](#danh-mục-mã-lý-do-điều-chỉnh/thay-thế-hoá-đơn) ( trường Bắt buộc ) |
| ProvinceCode  | String | MaxLength: 3 |  | Mã tỉnh | Bắt buộc khi là hàng hoá đặc trưng loại 1**( xem tại [VII.18](#quyết-định-19/2025/qĐ-ttg))** |
| ProvinceName  | Nvarchar | MaxLength: 50 |  | Tên tỉnh/thành phố  | Bắt buộc khi là hàng hoá đặc trưng loại 1**( xem tại [VII.18](#quyết-định-19/2025/qĐ-ttg))** |
| CommuneCode  | String | MaxLength: 8  |  | Mã xã | Bắt buộc khi là hàng hoá đặc trưng loại 1**( xem tại [VII.18](#quyết-định-19/2025/qĐ-ttg))** |
| CommuneName  | Nvarchar | MaxLength: 50 |  | Tên xã/phường  | Bắt buộc khi là hàng hoá đặc trưng loại 1**( xem tại [VII.18](https://docs.google.com/document/d/1QN9NwhAYhBidQtGV_XZtXKtYefSJFLZR/edit#heading=h.b1lyy2kzbo8t))** |
| PaymentMethod | String | MaxLength: 50 | True | Hình thức thanh toán | Xem chi tiết tại [Phương thức thanh toán (trường bắt buộc)](#phương-thức-thanh-toán-\(trường-bắt-buộc\)) |
| ArisingDate | String | Format: dd/MM/yyyy | True | Ngày phát hành hoá đơn | Mặc định là ngày hiện tại |
| ExchangeRate | Decimal | Value: decimal(18,3) |   | Tỷ giá ngoại tệ | Bắt buộc. Trừ trường hợp Đơn vị tiền tệ (CurrencyUnit)  là VND |
| CurrencyUnit | String | MaxLength: 3 | True | Đơn vị tiền tệ |  |
| Extra | Object |   |   | Thông tin các trường bổ sung |  |
| InvNo | int | MaxLength: 18 |  | Số hoá đơn | Chỉ nhận số nguyên dương, bắt buộc đối với hoá đơn dải chờ ký |
| Note | String | MaxLength: 500 |   | Ghi chú hoá đơn |   |
| ListAttachNum | String | MaxLength: 50 |   | Số bảng kê | Bắt buộc đối với  các loại hàng hóa, dịch vụ đã bán kèm theo hóa đơn  ([Hóa đơn kèm chứng từ bảng kê](#hóa-đơn-kèm-chứng-từ-bảng-kê))  hoặc hóa đơn chiết khấu thương mại ([Hoá đơn chiết khấu](#hoá-đơn-chiết-khấu)) |
| ListAttachDate | String | MaxLength: 10Format: dd/MM/yyyy |   | Ngày bảng kê | Ngày của bảng kê các loại hàng hóa, dịch vụ đã bán kèm theo hóa đơn ([Hóa đơn kèm chứng từ bảng kê](#hóa-đơn-kèm-chứng-từ-bảng-kê))  hoặc hóa đơn chiết khấu thương mại ([Hoá đơn chiết khấu](#hoá-đơn-chiết-khấu)) |
| IdentityCardNumber | String |   |   | Số căn cước | Áp dụng cho loại hoá đơn bán hàng dự trữ quốc gia [Hóa đơn bán hàng dự trữ quốc gia](#hóa-đơn-bán-hàng-dự-trữ-quốc-gia) (Định dạng mẫu số đầu 4, vd: \*4\*K23TYY) |
| TaxAuthorityCode | String | MaxLength: 23 |  | Mã của cơ quan thuế | Bắt buộc đối với hoá đơn điện tử khởi tạo từ máy tính tiền |
| PassportNo | String | maxlength: 20 |  | Số hộ chiếu (Số hộ chiếu/Giấy tờ nhập xuất cảnh) |  |
| BudgetaryRelationshipCode | String | MaxLength: 7 |  | Mã đơn vị quan hệ ngân sách | Chuỗi 7 ký tự gồm cả chữ và số (số bắt đầu \> 0\) |
| CusIdentification | String | MaxLength: 12 |  | Căn cước công dân (Số CC/CCCD/số định danh) |  |
| Products | Array Object | MinValue: 1 MaxValue: 400 | True | Mảng thông tin sản phẩm | Mô tả cấu trúc ở [Mô tả thông tin request sản phẩm](#mô-tả-thông-tin-request-sản-phẩm) |
| InvoiceFees | Array Object |  |  | Thông tin phí | Mô tả cấu trúc ở **Mẫu hóa đơn có lệ phí [Nội dung XML Data](#nội-dung-xml-data)** |
| Total | Decimal | Value: decimal(21,6) | True | Tổng cộng thành tiền chưa có thuế GTGT |   |
| Discount | Decimal | Value: decimal(6,4) |   | Tỷ lệ chiết khấu của hoá đơn |   |
| DiscountAmount | Decimal | Value: decimal(21,6) |   | Số tiền chiết khấu của hoá đơn |   |
| VatRate | Integer |   | True | Thuế suất  của hoá đơn | Các giá trị xem ở [*Thuế suất*](#thuế-suất) |
| VatRateOther | Decimal | Value: decimal(4,2)  |   | Giá trị thuế suất khác của hoá đơn |  Bắt buộc nếu có thuế suất (VATRate) là \-3 |
| VatAmount | Decimal | Value: decimal(21,6) |  True | Tổng cộng tiền thuế GTGT của hoá đơn |   |
| Amount | Decimal | Value:decimal(21,6) |  True | Tổng tiền thanh toán |   |
| AmountInWords | String | MaxLength: 255 | True | Số tiền thanh toán bằng chữ |   |
| GrossValue | Decimal | Value: decimal(21,6) |   | Tổng tiền trước thuế của thuế suất KCT |  |
| GrossValue0 | Decimal | Value: decimal(21,6) |   | Tổng tiền trước thuế của thuế suất 0% |  |
| GrossValue5 | Decimal | Value: decimal(21,6) |   | Tổng tiền trước thuế của thuế suất 5% |  |
| GrossValue10 | Decimal | Value: decimal(21,6) |   | Tổng tiền trước thuế của thuế suất 10% |  |
| GrossValueNDeclared  | Decimal | Value: decimal(21,6) |   | Tổng tiền trước thuế của thuế suất KKKNT |  |
| GrossValueContractor  | Decimal | Value: decimal(21,6) |   | Tổng tiền trước thuế của thuế suất Khác |  |
| VatAmount0 | Decimal | Value: decimal(21,6) |   | Tổng tiền thuế của thuế suất 0% |  |
| VatAmount5 | Decimal | Value: decimal(21,6) |   | Tổng tiền thuế của thuế suất 5% |  |
| VatAmount10 | Decimal | Value: decimal(21,6) |   | Tổng tiền thuế của thuế suất 10% |  |
| VatAmountNDeclared  | Decimal | Value: decimal(21,6) |   | Tổng tiền thuế của thuế suất KKKNT |  |
| VatAmountContractor  | Decimal | Value: decimal(21,6) |   | Tổng tiền thuế của thuế suất Khác |  |
| Amount0 | Decimal | Value: decimal(21,6) |   | Tổng tiền sau thuế của thuế suất 0% |  |
| Amount5 | Decimal | Value: decimal(21,6) |   | Tổng tiền sau thuế của thuế suất 5% |  |
| Amount10 | Decimal | Value: decimal(21,6) |   | Tổng tiền sau thuế của thuế suất 10% |  |
| AmountNDeclared | Decimal | Value: decimal(21,6) |   | Tổng tiền sau thuế của thuế suất KKKNT |  |
| AmountOther | Decimal | Value: decimal(21,6) |   | Tổng tiền sau thuế của thuế suất Khác |  |
| GrossValue8 | Decimal | Value: decimal(21,6) |   | Tổng tiền trước thuế của thuế suất 8% |  |
| VatAmount8 | Decimal | Value: decimal(21,6) |   | Tổng tiền thuế của thuế suất 8% |  |
| Amount8 | Decimal | Value: decimal(21,6) |   | Tổng tiền sau thuế của thuế suất 8% |  |
| GrossCTTC | Decimal | Value: decimal(21,6) |   | Tổng tiền trước thuế của thuế suất CTTC |  |
| VatAmountCTTC | Decimal | Value: decimal(21,6) |   | Tổng tiền thuế của thuế suất CTTC |  |
| AmountCTTC | Decimal | Value: decimal(21,6) |   | Tổng tiền sau thuế của thuế suất CTTC |  |

2. ## Mô tả thông tin request sản phẩm

| Field | Type | Format | Required | Description | Note |
| :---- | :---- | :---- | :---- | :---- | :---- |
| No | Integer | MaxLength: 4 |  | Số thứ tự sản phẩm | Nếu không muốn hiển thị số thứ tự sản phẩm thì truyền giá trị No \= 0 |
| Feature | Int | MaxLength: 1 | True | Tính chất sản phẩm | Các giá trị xem ở [*Feature*](#feature) |
| Code | String | MaxLength: 50 |  | Mã sản phẩm |   |
| ProdName | String | MaxLength: 500 | True | Tên sản phẩm |   |
| BusinessSectorCode  | String | MaxLength: 4 |  | Mã nhóm ngành nghề | Khuyến khích thêm ( xem chi tiết tại [VII.14](#danh-mục-mã-nhóm-ngành-nghề)) |
| ProdUnit | String | MaxLength: 50 |  | Đơn vị tính |   |
| ProdQuantity | Decimal | Value: decimal(21,6) |  | Số lượng sản phẩm |   |
| ProdPrice | Decimal | Value: decimal(21,6)  |  | Đơn giá sản phẩm |   |
| Discount | Decimal | Value: decimal(6,4) |  | Tỷ lệ chiết khấu của sản phẩm |   |
| DiscountAmount | Decimal | Value: decimal(21,6) |  | Số tiền chiết khấu của sản phẩm |   |
| Total | Decimal | Value: decimal(18,3) | True | Thành tiền trước thuế của sản phẩm. |   |
| VATRate | Int |   |  | Thuế suất của sản phẩm | Các giá trị xem ở [*VasotRate*](https://docs.google.com/document/d/1gOmZq7lEabYAqYa9MBJCs9Z2TGv35fUKsgKJs2coOGI/edit?tab=t.0#heading=h.4d34og8) |
| VatRateOther | Decimal | Value: decimal(4,2) |  | Giá trị thuế suất khác của sản phẩm | Bắt buốc nếu thuế suất là loại thuế Khác (VatRate \= \-3) |
| VatAmount | Decimal | Value: decimal(21,6) | True | Tiền thuế của sản phẩm |   |
| Amount | Decimal | Value: decimal(21,6) | True | Tổng tiền sau thuế của sản phẩm |   |
| Extra | Object |   |  | Thông tin các trường bổ sung |   |
| Extra | Object | Json string |  | Thông tin các trường bổ sung   | Với hóa đơn mua bán xe (NĐ254), truyền các thuộc tính chi tiết ở [**Request Object**](https://docs.google.com/document/d/1QHNPColzb8-jV3xUHXo4CSo4zwBt9roRpUEKY6HKmcA/edit?tab=t.0#heading=h.dnyqzzk6pd9i)  |

# **VII. Phụ lục**

1. ## Phương thức thanh toán (trường bắt buộc)

* Tiền mặt  
* Chuyển khoản  
* Tiền mặt/Chuyển khoản  
* Đối trừ công nợ  
*  Không thu tiền

Ví dụ: \<PaymentMethod\>Tiền mặt\</PaymentMethod\> trong chức năng chỉnh sửa hoá đơn sẽ được hiển thị trong danh sách lựa chọn là “*Tiền mặt*”.

Phương thức thanh toán hoàn toàn có thể chứa giá trị khác mà không bắt buộc phải thuộc 1 trong 5 phương thức ở trên, khi đó thông tin giá trị khác này sẽ được hiển thị nguyên dạng trên hoá đơn.

2. ## Trạng thái hoá đơn

| STT | Giá trị | Mô tả |
| ----- | :---: | ----- |
|  | \-1 | Hoá đơn trong dải chờ ký |
|  | 0 | Hoá đơn chưa có chữ ký số |
|  | 1 | Hoá đơn đã có chữ ký số |
|  | 2 | Hóa đơn đã khai báo thuế |
|  | 3 | Hoá đơn bị thay thế |
|  | 4 | Hoá đơn bị điều chỉnh |
| 7 | 5 | Hoá đơn bị huỷ |
| 10 | 6 | Hoá đơn đã duyệt (dành cho khách hàng sử dụng quy trình duyệt hoá đơn trước ký) |

3. ## Thuế suất

| STT | Giá trị | Mô tả |
| ----- | :---: | ----- |
|  | 0 | Thuế suất 0% |
|  | 5 | Thuế suất 5% |
|  | 10 | Thuế suất 10% |
|  | \-1 | Không chịu thuế GTGT |
|  | \-2 | Không kê khai, tính nộp thuế GTGT |
|  | \-3 | Trường hợp thuế khác, cần đẩy thêm dữ liệu vào thẻ \<VATRateOther\> Giá trị thuế khác. Ví dụ: 15.26 (tối đa lẻ 2 chữ số) |
| 7 | \-5 | Thuế Cho thuê tài chính. Thuế suất chỉ áp dụng với hóa đơn cho thuê tài chính |
| 10 | 8 | Thuế suất 8 % |

   ## 

4. ## Hoá đơn chờ ký

* Để sử dụng chức năng chờ ký, đơn vị (công ty) cần được cấp quyền.  
* Tạo hoá đơn chờ ký thông qua API: *Tạo dải hoá đơn chờ ký* ([Tạo hóa đơn (bản nháp, chờ ký, có số hóa đơn gửi từ client)](#tạo-hóa-đơn-\(bản-nháp,-chờ-ký,-có-số-hóa-đơn-gửi-từ-client\)))  
* Gói hoá đơn chờ ký sẽ được tự động gộp nếu nối tiếp nhau.  
* Gói hoá đơn chờ ký được nhận diện với XmlData chứa thẻ \<InvNo\>\</InvNo\>.  
* Gói hoá đơn chờ ký hợp lệ khi:  
  - Tất cả các hoá đơn trong gói đều chứa thẻ \<InvNo\>\</InvNo\>  
  - Mỗi hoá đơn trong gói có số nhỏ hơn thì cũng có ngày tạo lập (Arising Date) *nhỏ hơn hoặc bằng* ngày tạo lập của hoá đơn có số đứng liền sau nó (hoá đơn có số lớn hơn).  
  - Hoá đơn có số nhỏ nhất của gói có ngày tạo lập lớn hơn hoặc bằng ngày tạo lập của hoá đơn đã phát hành trong hệ thống đứng liền sau nó (hoá đơn chặn dưới của dải chờ ký)  
  - Hoá đơn có số lớn nhất của gói có ngày tạo nhỏ lớn hơn hoặc bằng ngày tạo lập của hoá đơn đã phát hành trong hệ thống đứng liền trước nó (hoá đơn chặn trên của dải chờ ký)

5. ## Chiết khấu (quan trọng)

- Sản phẩm và chiết khấu của sản phẩm cần tách riêng  
- Chiết khấu được hiển thị như 1 sản phẩm riêng biệt kế tiếp sản phẩm tương ứng với nó, khi đó ProdName thể hiện là dòng chiết khấu. Các trường Total, VATAmount, Amount **mang giá trị âm.**


6. ## Product Extra (thông tin bổ sung cho sản phẩm)

- Product Extra có định dạng json, chứa các thông tin bổ sung cho sản phẩm theo quy ước nếu có phát sinh. Ví dụ: {"Pos":"1", "Lot":4255, "Date":"06/11/2018"}  
- Product Extra mặc định là {"Pos":"x"} với x là số thứ tự của sản phẩm được đánh số hiển thị trên hoá đơn, ví dụ: {"Pos":"2"} sẽ chỉ thị cho server hiển thị sản phẩm với STT là 2\. Ví dụ xml cho 1 sản phẩm:

  \<Product\>

  \<ProdName\>Kem que TT01\</ProdName\>

  	\<ProdUnit\>Que\</ProdUnit\>

  	\<ProdQuantity\>1\</ProdQuantity\>

  \<Feature\>1\</Feature\>

  	\<ProdPrice\>15000\</ProdPrice\>

  	\<Discount\>10\</Discount\>

  \<DiscountAmount\>1500\</DiscountAmount\>

  	\<Total\>13500\</Total\>

  	\<VATRate\>10\</VATRate\>

  	\<VATAmount\>1350\</VATAmount\>

  	\<Amount\>14850\</Amount\>

  	\<Extra\>{"Pos":""}\</Extra\>

  \</Product\>

7. ## Trường sản phẩm ghi chú

* Với những sản phẩm đặc biệt đóng vai trò là ghi chú, Pos mang giá trị trống (bắt buộc – không phải null) như sau: {"Pos":""}. Ví dụ xml cho 1 sản phẩm ghi chú:

\<Product\>  
\<ProdName\>Thanh toán theo HĐ số KL/3584\</ProdName\>  
	\<ProdUnit/\>  
	\<ProdQuantity/\>  
	\<Feature\>4\</Feature\>  
	\<ProdPrice/\>  
	\<Discount\>\</Discount\>  
\<DiscountAmount\>\</DiscountAmount\>  
	\<Total\>0\</Total\>  
	\<VATRate/\>  
	\<VATAmount/\>  
	\<Amount\>0\</Amount\>  
	\<Extra\>{"Pos":""}\</Extra\>  
\</Product\>

8. ## Mẫu XmlReport (Kết quả trả về của API IV.19)

\<?xml version="1.0"?\>  
\<HSoThueDTu\>  
	\<HSoKhaiThue\>  
		\<TTinChung\>  
			\<TTinDVu\>  
				\<maDVu\>HTKK\</maDVu\>  
				\<tenDVu\>HTKK\</tenDVu\>  
				\<pbanDVu\>3.4.5\</pbanDVu\>  
				\<ttinNhaCCapDVu/\>  
			\</TTinDVu\>  
			\<TTinTKhaiThue\>  
				\<TKhaiThue\>  
					\<maTKhai\>102\</maTKhai\>  
					\<tenTKhai\>Báo cáo tình hình sử dụng hóa đơn (BC26/AC)\</tenTKhai\>  
					\<moTaBMau\>(Ban hành kèm theo Thông tư số 39/2014/TT-BTC  ngày 31/3/2014 của Bộ Tài chính)\</moTaBMau\>  
					\<pbanTKhaiXML\>2.0.8\</pbanTKhaiXML\>  
					\<loaiTKhai\>C\</loaiTKhai\>  
					\<soLan\>0\</soLan\>  
					\<KyKKhaiThue\>  
						\<kieuKy\>Q\</kieuKy\>  
						\<kyKKhai\>3/2017\</kyKKhai\>  
						\<kyKKhaiTuNgay\>01/07/2017\</kyKKhaiTuNgay\>  
						\<kyKKhaiDenNgay\>30/09/2017\</kyKKhaiDenNgay\>  
						\<kyKKhaiTuThang/\>  
						\<kyKKhaiDenThang/\>  
					\</KyKKhaiThue\>  
					\<maCQTNoiNop\>10107\</maCQTNoiNop\>  
					\<tenCQTNoiNop\>Chi cục Thuế Quận Hai Bà Trưng\</tenCQTNoiNop\>  
					\<ngayLapTKhai\>2017-10-30\</ngayLapTKhai\>  
					\<GiaHan\>  
						\<maLyDoGiaHan/\>  
						\<lyDoGiaHan/\>  
					\</GiaHan\>  
					\<nguoiKy\>Nguyễn Văn A\</nguoiKy\>  
					\<ngayKy\>2017-10-26\</ngayKy\>  
					\<nganhNgheKD/\>  
				\</TKhaiThue\>  
				\<NNT\>  
					\<mst\>0109999999\</mst\>  
					\<tenNNT\>CÔNG TY CỔ PHẦN THƯƠNG MẠI ABCDEF\</tenNNT\>  
					\<dchiNNT\>số 1000 Lạc Trung, phường Vĩnh Tuy\</dchiNNT\>  
					\<phuongXa/\>  
					\<maHuyenNNT/\>  
					\<tenHuyenNNT\>Hai Bà Trưng\</tenHuyenNNT\>  
					\<maTinhNNT/\>  
					\<tenTinhNNT\>Hà Nội\</tenTinhNNT\>  
					\<dthoaiNNT\>02412345678\</dthoaiNNT\>  
					\<faxNNT/\>  
					\<emailNNT\>email@gmail.com\</emailNNT\>  
				\</NNT\>  
			\</TTinTKhaiThue\>  
		\</TTinChung\>  
		\<CTieuTKhaiChinh\>  
			\<kyBCaoCuoi\>0\</kyBCaoCuoi\>  
			\<chuyenDiaDiem\>0\</chuyenDiaDiem\>  
			\<ngayDauKyBC\>2017-07-01\</ngayDauKyBC\>  
			\<ngayCuoiKyBC\>2017-09-30\</ngayCuoiKyBC\>  
			\<HoaDon\>  
				\<ChiTiet \>  
					\<maHoaDon\>01GTKT\</maHoaDon\>  
					\<tenHDon\>Hóa đơn giá trị gia tăng\</tenHDon\>  
					\<kHieuMauHDon\>01GTKT3/002\</kHieuMauHDon\>  
					\<kHieuHDon\>NC/16P\</kHieuHDon\>  
					\<soTonMuaTrKy\_tongSo\>113\</soTonMuaTrKy\_tongSo\>  
					\<soTonDauKy\_tuSo\>0000388\</soTonDauKy\_tuSo\>  
					\<soTonDauKy\_denSo\>0000500\</soTonDauKy\_denSo\>  
					\<muaTrongKy\_tuSo/\>  
					\<muaTrongKy\_denSo/\>  
					\<tongSoSuDung\_tuSo\>0000388\</tongSoSuDung\_tuSo\>  
					\<tongSoSuDung\_denSo\>0000484\</tongSoSuDung\_denSo\>  
					\<tongSoSuDung\_cong\>97\</tongSoSuDung\_cong\>  
					\<soDaSDung\>91\</soDaSDung\>  
					\<xoaBo\_soLuong\>6\</xoaBo\_soLuong\>  
					\<xoaBo\_so\>0000405;0000412;0000427;0000438;0000440;0000456\</xoaBo\_so\>  
					\<mat\_soLuong\>0\</mat\_soLuong\>  
					\<mat\_so/\>  
					\<huy\_soLuong\>0\</huy\_soLuong\>  
					\<huy\_so/\>  
					\<tonCuoiKy\_tuSo\>0000485\</tonCuoiKy\_tuSo\>  
					\<tonCuoiKy\_denSo\>0000500\</tonCuoiKy\_denSo\>  
					\<tonCuoiKy\_soLuong\>16\</tonCuoiKy\_soLuong\>  
				\</ChiTiet\>  
				\<ChiTiet\>  
					\<maHoaDon\>01GTKT\</maHoaDon\>  
					\<tenHDon\>Hóa đơn giá trị gia tăng\</tenHDon\>  
					\<kHieuMauHDon\>01GTKT3/003\</kHieuMauHDon\>  
					\<kHieuHDon\>NC/17P\</kHieuHDon\>  
					\<soTonMuaTrKy\_tongSo\>500\</soTonMuaTrKy\_tongSo\>  
					\<soTonDauKy\_tuSo/\>  
					\<soTonDauKy\_denSo/\>  
					\<muaTrongKy\_tuSo\>0000001\</muaTrongKy\_tuSo\>  
					\<muaTrongKy\_denSo\>0000500\</muaTrongKy\_denSo\>  
					\<tongSoSuDung\_tuSo/\>  
					\<tongSoSuDung\_denSo/\>  
					\<tongSoSuDung\_cong\>0\</tongSoSuDung\_cong\>  
					\<soDaSDung\>0\</soDaSDung\>  
					\<xoaBo\_soLuong\>0\</xoaBo\_soLuong\>  
					\<xoaBo\_so/\>  
					\<mat\_soLuong\>0\</mat\_soLuong\>  
					\<mat\_so/\>  
					\<huy\_soLuong\>0\</huy\_soLuong\>  
					\<huy\_so/\>  
					\<tonCuoiKy\_tuSo\>0000001\</tonCuoiKy\_tuSo\>  
					\<tonCuoiKy\_denSo\>0000500\</tonCuoiKy\_denSo\>  
					\<tonCuoiKy\_soLuong\>500\</tonCuoiKy\_soLuong\>  
				\</ChiTiet\>  
			\</HoaDon\>  
			\<tongCongSoTonDKy\>613\</tongCongSoTonDKy\>  
			\<tongCongSDung\>97\</tongCongSDung\>  
			\<tongCongSoTonCKy\>516\</tongCongSoTonCKy\>  
			\<nguoiLapBieu/\>  
			\<nguoiDaiDien\>Nguyễn Văn A\</nguoiDaiDien\>  
			\<ngayBCao\>2017-10-26\</ngayBCao\>  
		\</CTieuTKhaiChinh\>  
	\</HSoKhaiThue\>  
\</HSoThueDTu\>

9. ## Mã lỗi tích hợp

Vui lòng truy cập vào đường link sau để tra cứu mã lỗi tích hợp. Các mã lỗi sẽ được cập nhật thường xuyên và liên tục :

[https://docs.google.com/spreadsheets/d/1paH5i6Fs5oo4d1DetWshXfeH15PXxtrM/edit?gid=271185517\#gid=271185517](https://docs.google.com/spreadsheets/d/1paH5i6Fs5oo4d1DetWshXfeH15PXxtrM/edit?gid=271185517#gid=271185517)

10. ## Feature

| STT | Giá trị | Mô tả |
| ----- | :---: | ----- |
|  | 1 | Hàng hóa, dịch vụ |
|  | 2 | Khuyến mại |
|  | 3 | Chiết khấu thương mại (trong trường hợp muốn thể hiện thông tin chiết khấu theo dòng) |
|  | 4 | Ghi chú, diễn giải |
| 5 | 5 | Hàng hoá đặc trưng |

11. ## Đơn vị tiền tệ

Đơn vị tiền tệ được truyền tại thẻ \<CurrencyUnit\>, thẻ này nhận giá trị theo chuẩn ISO 4217 của các quốc gia Đông Nam Á. Dưới đây là một số mã tiền tệ khả dụng trên hệ thống EasyInvoice :

| STT | Mã tiền tệ | Tên đơn vị tiền tệ | Tên thường dùng |
| :---: | ----- | ----- | ----- |
| 1 | VND v | Việt Nam Đồng | Đồng Việt Nam |
| 2 | USD v | US DOLLAR | Đô la Mỹ |
| 3 | AUD v | AUSTRALIAN DOLLAR | Đô la Úc |
| 4 | CAD v | CANADIAN DOLLAR | Đô la Canada |
| 5 | CHF v | SWISS FRANC | Franc Thụy Sĩ |
| 6 | CNY | CHINESE YUAN | Nhân dân tệ Trung Quốc |
| 7 | DKK | DANISH KRONE | Krone Đan Mạch |
| 8 | EUR v | EURO | Đồng Euro |
| 9 | GBP v | UK POUND STERLING | Bảng Anh |
| 10 | HKD | HONG KONG DOLLAR | Đô la Hồng Kông |
| 11 | INR | INDIAN RUPEE | Rupee Ấn Độ |
| 12 | JPY v | JAPANESE YEN | Yên Nhật |
| 13 | KRW | KOREAN WON | Won Hàn Quốc |
| 14 | KWD | KUWAITI DINAR | Dinar Kuwait |
| 15 | MYR | MALAYSIAN RINGGIT | Ringgit Malaysia |
| 16 | NOK | NORWEGIAN KRONE | Krone Na Uy |
| 17 | RUB | RUSSIAN RUBLE | Rúp Nga |
| 18 | SAR | SAUDI ARABIAN RIYAL  | Riyal Ả Rập Xê Út |
| 19 | SEK | SWEDISH KRONA | Krona Thụy Điển |
| 20 | SGD | SINGAPORE DOLLAR | Đô la Singapore |
| 21 | THB | THAI BAHT | Baht Thái |

12. ## Trạng thái tổng cục thuế trả về

| STT | Giá trị | Mô tả |
| :---: | :---: | ----- |
| 1 | \-2 | Không hợp lệ |
| 2 | \-1 | Đang kiểm tra |
| 3 | 0 | Chưa xử lý |
| 4 | 1 | Hợp lệ |
| 5 | Null | Chưa gửi lên thuế |

Nếu trả về giá trị \= \-2 – Không hợp lệ, vui lòng kiểm tra thông tin lỗi tại trường : TCTErrorMessage.  
**Note :** Khi phát hành hóa đơn, hệ thống EasyInvoice sẽ tự động gửi API lên cơ quan thuế để xác thực và cấp mã. Việc cấp mã sẽ tốn một khoảng thời gian để thuế xác thực và trả về mã, vậy nên các hóa đơn vừa ký sẽ tốn một vài phút để chờ thuế xác thực và trả về mã.

13. ## Danh mục mã lý do điều chỉnh/thay thế hoá đơn

| Mã | Tên lý do | Ghi chú |
| :---: | ----- | ----- |
| 1 | Điều chỉnh giá trị quyết toán dự án đầu tư khi có sự thay đổi về đơn giá, khối lượng; điều chỉnh giá bán theo quy định của pháp luật chuyên ngành | Điểm a.1 khoản 5 Điều 10 Thông tư 91 |
| 2 | Điều chỉnh giá trị, khối lượng trên cơ sở kết luận của cơ quan nhà nước có thẩm quyền theo quy định của pháp luật có liên quan | Điểm a.2 khoản 5 Điều 10 Thông tư 91 |
| 3 | Điều chỉnh giá bán buôn điện giữa Tập đoàn Điện lực Việt Nam với các Tổng công ty Điện lực và giữa các Tổng công ty Điện lực với các Công ty Điện lực | Điểm a.3 khoản 5 Điều 10 Thông tư 91 |
| 4 | Điều chỉnh do chiết khấu thương mại | Điểm b khoản 5 Điều 10 Thông tư 91 |
| 5 | Điều chỉnh do trả lại hàng hóa không phải là tài sản thuộc diện phải đăng ký quyền sử dụng, quyền sở hữu theo quy định của pháp luật và tài sản đã được đăng ký theo tên người mua | Điểm c.1 khoản 5 Điều 10 Thông tư 91 |
| 6 | Thay thế do trả lại hàng hóa là tài sản thuộc diện phải đăng ký quyền sử dụng, quyền sở hữu theo quy định của pháp luật và tài sản đã được đăng ký theo tên người mua | Điểm c.2 khoản 5 Điều 10 Thông tư 91 |
| 7 | Điều chỉnh do hoàn phí, giảm phí, giảm hoa hồng môi giới bảo hiểm và các khoản chi để giảm thu khác theo quy định của pháp luật kinh doanh bảo hiểm | Điểm c.3 khoản 5 Điều 10 Thông tư 91 |
| 8 | Điều chỉnh do huỷ hoặc chấm dứt giao dịch và hủy một phần việc cung cấp dịch vụ khi thu tiền trước cho nhiều kỳ | Điểm c.4 khoản 5 Điều 10 Thông tư 91 |
| 9 | Điều chỉnh do hoàn phí của tổ chức tín dụng, tổ chức cung ứng dịch vụ thanh toán không dùng tiền mặt khi thực hiện hoạt động ngân hàng, cung ứng dịch vụ thanh toán không dùng tiền mặt đã lập hóa đơn thu phí dịch vụ | Điểm d khoản 5 Điều 10 Thông tư 91 |
| 10 | Điều chỉnh đối với dịch vụ viễn thông mà khách hàng sử dụng thẻ trả trước dịch vụ viễn thông di động để thanh toán cho cước dịch vụ trả sau, nhắn tin ủng hộ từ thiện, các dịch vụ viễn thông khác được chấp nhận thanh toán bằng thẻ trả trước dịch vụ viễn thông di động theo quy định của pháp luật và khi bán thẻ cào, hoàn thành cung cấp dịch vụ doanh nghiệp viễn thông | Điểm đ khoản 5 Điều 10 Thông tư 91 |
| 11 | Điều chỉnh do có sự thay đổi về giá trị bán khí thiên nhiên thực tế do phải quy đổi ra Việt Nam đồng khi thanh toán thực tế | Điểm e khoản 5 Điều 10 Thông tư 91 |
| 12 | Điều chỉnh đối với hóa đơn đổi, hoàn chứng từ vận chuyển hàng không. | Điểm d khoản 1 Điều 10 Thông tư 91 |
| 13 | Điều chỉnh/thay thế cho hóa đơn đã lập sai | Điều 10 Thông tư 91 |
| 14 | Thay thế hóa đơn điện tử đã lập sai là hóa đơn điện tử từ máy tính tiền | Điểm c khoản 1 Điều 10 Thông tư 91 |

14. ## Danh mục mã nhóm ngành nghề

    

| Mã nhóm ngành nghề | Tên nhóm ngành nghề | Ghi chú |
| :---: | ----- | ----- |
| 01\_0 | Phân phối, cung cấp hàng hoá (không chịu thuế) |   |
| 01\_1 | Phân phối, cung cấp hàng hoá (0%) |   |
| 01\_2 | Phân phối, cung cấp hàng hóa |   |
| 02\_0 | Dịch vụ, xây dựng không bao thầu nguyên vật liệu (không chịu thuế) |   |
| 02\_1 | Dịch vụ, xây dựng không bao thầu nguyên vật liệu (0%) |   |
| 02\_2 | Dịch vụ, xây dựng không bao thầu nguyên vật liệu |   |
| 03\_0 | Riêng hoạt động cho thuê tài sản, đại lý bảo hiểm, đại lý xổ số, đại lý bán hàng đa cấp (không chịu thuế) |   |
| 03\_1   | Riêng hoạt động cho thuê tài sản, đại lý bảo hiểm, đại lý xổ số, đại lý bán hàng đa cấp (0%) |   |
| 03\_2   | Riêng hoạt động cho thuê tài sản, đại lý bảo hiểm, đại lý xổ số, đại lý bán hàng đa cấp |   |
| 04\_0 | Sản xuất, vận tải, dịch vụ có gắn với hàng hoá, xây dựng có bao thầu nguyên vật liệu (không chịu thuế) |   |
| 04\_1 | Sản xuất, vận tải, dịch vụ có gắn với hàng hoá, xây dựng có bao thầu nguyên vật liệu (0%) |   |
| 04\_2 | Sản xuất, vận tải, dịch vụ có gắn với hàng hoá, xây dựng có bao thầu nguyên vật liệu |   |
| 05\_0 | Hoạt động cung cấp sản phẩm và dịch vụ nội dung thông tin số về giải trí, trò chơi điện tử, phim số, ảnh số, nhạc số, quảng cáo số (không chịu thuế) |   |
| 05\_1 | Hoạt động cung cấp sản phẩm và dịch vụ nội dung thông tin số về giải trí, trò chơi điện tử, phim số, ảnh số, nhạc số, quảng cáo số (0%) |   |
| 05\_2 | Hoạt động cung cấp sản phẩm và dịch vụ nội dung thông tin số về giải trí, trò chơi điện tử, phim số, ảnh số, nhạc số, quảng cáo số |   |
| 06\_0 | Hoạt động kinh doanh khác (không chịu thuế) |   |
| 06\_1 | Hoạt động kinh doanh khác (0%) |   |
| 06\_2 | Hoạt động kinh doanh khác |   |
| 07\_0 | Không thuộc phạm vi điều chỉnh |  |

    

    

    

    

    

    

    

    

    

    

    

    

    

15. ## Danh mục loại hàng hoá đắc trưng ( theo **Phụ lục XV của thuế cung cấp)**

| STT | Giá trị | Loại hàng hóa đặc trưng | Giá trị bắt buộc |  |  |  |  |
| ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- |
|  |  |  | **Tên thẻ** | **Mô tả tên trường** | **Độ dài tối đa** | **Kiểu dữ liệu** | **Ghi chú** |
| **1** | **1** | **Hàng hóa là xe ô tô, xe mô tô** | SKhung | Số khung | 50 | Chuỗi ký tự | Bắt buộc nhập |
|  |  |  | SMay | Số máy | 50 | Chuỗi ký tự | Bắt buộc nhập |
|  |  |  | LTSan | Loại tài sản | 1 | Số | 1: Ô tô, |
|  |  |  |  |  |  |  | 2: Mô tô xe máy |
|  |  |  | TTTSan | Tình trạng tài sản | 1 | Số | 0: Chưa qua sử dụng, |
|  |  |  |  |  |  |  | 1: Đã qua sử dụng |
|  |  |  | XXu | Xuất xứ | 1 | Số | 0: Lắp ráp, |
|  |  |  |  |  |  |  | 1: Nhập khẩu |
|  |  |  | SGCNATKThuat | Số Giấy chứng nhận chất lượng an toàn kỹ thuật và bảo vệ môi trường (đối với xe nhập khẩu) | 200 | Chuỗi ký tự | Bắt buộc nhập đối với xe nhập khẩu |
|  |  |  | SSPKTCLXXuong | Số seri Phiếu kiểm tra chất lượng xuất xưởng (xe sản xuất, lắp ráp trong nước) | 200 | Chuỗi ký tự | Bắt buộc nhập với xe sản xuất, lắp ráp trong nước |
|  |  |  | MNSXuat | Mã Nước sản xuất | 2 | Chuỗi ký tự (Phụ lục **XIX**) (xem chi tiết ở [VII.16](#danh-mục-mã-quốc-tịch-\(-theo-phụ-lục-xix-thuế-cung-cấp\))) | Bắt buộc (đối với xe đã qua sử dụng) |
|  |  |  | TLTSDKy | Tên loại tài sản đăng ký | 200 | Chuỗi ký tự | Bắt buộc (đối với xe đã qua sử dụng) |
|  |  |  | NSXuat | Năm sản xuất | 4 | Số | Bắt buộc (đối với xe đã qua sử dụng) |
|  |  |  | TTMai | Tên thương mại | 300 | Chuỗi ký tự | Bắt buộc (đối với xe đã qua sử dụng) |
|  |  |  | TNHieu | Tên nhãn hiệu | 200 | Chuỗi ký tự | Bắt buộc (đối với xe đã qua sử dụng) |
|  |  |  | KLXe | Kiểu loại xe | 50 | Chuỗi ký tự | Bắt buộc (đối với xe đã qua sử dụng) |
|  |  |  | TTLVHCSuat | Thể tích làm việc hoặc Công suất | 10 | Chuỗi ký tự | Bắt buộc (đối với xe đã qua sử dụng) |
|  |  |  | TTai | Trọng tải | 9,2 | Số | Bắt buộc (đối với xe đã qua sử dụng) |
|  |  |  | SCNgoi | Số người cho phép chở | 4 | Số | Bắt buộc (đối với xe đã qua sử dụng) |
|  |  |  | SBKSoat | Số biển kiểm soát | 20 | Chuỗi ký tự | Bắt buộc đối với phương tiện đã qua sử dụng |
| 2 | 2 | Dịch vụ vận chuyển | BKSPTVChuyen | Biển kiểm soát phương tiện vận chuyển | 50 | Chuỗi ký tự |   |
|  |  |  | DDi | Điểm đi | 255 | Chuỗi ký tự |  Bắt buộc đối với trường hợp không theo tuyến cố định |
|  |  |  | DDen | Điểm đến | 255 | Chuỗi ký tự |  Bắt buộc đối với trường hợp không theo tuyến cố định |
| 3 | 3 | Dịch vụ vận chuyển trên nền tảng số, TMĐT | THHVChuyen | Tên hàng hóa vận chuyển | 255 | Chuỗi ký tự | Khoản 5 Phụ lục Nghị định 254 |
|  |  |  | TNGHang | Tên người gửi hàng | 255 | Chuỗi ký tự |  Bắt buộc |
|  |  |  | DCNGHang | Địa chỉ người gửi hàng | 255 | Chuỗi ký tự |  Bắt buộc |
|  |  |  | MSTNGHang | MST người gửi hàng | 14 | Chuỗi ký tự |  Bắt buộc |
|  |  |  | MDDNGHang) | Số định danh người gửi hàng | 12 | Số |  Bắt buộc |
| 4 | 4 | Hàng hóa phải đăng ký quyền sử dụng, quyền sở hữu | TTTDat | Thông tin thửa đất: Số thửa, số tờ bản đồ, diện tích, loại đất, thời hạn sử dụng đất, nguồn gốc sử dụng đất, hình thức sử dụng đất, địa chỉ | 255 | Chuỗi ký tự | Khoản 5 Phụ lục Nghị định 254 |
|  |  |  | TTTSGLTDat |  Thông tin tài sản gắn liền với đất: Tên tài sản/Hạng mục công trình, Diện tích xây dựng, Diện tích sàn hoặc công suất, Kết cấu chủ yếu, Cấp công trình, Số tầng, Năm HT xây dựng, Thời hạn sở hữu | 255 | Chuỗi ký tự |  |

    

16. ## Danh mục mã quốc tịch ( theo **Phụ lục XIX thuế cung cấp)**

      
      
    

| STT | Mã | Tên | STT | Mã | Tên |
| :---: | ----- | ----- | :---: | ----- | ----- |
| 1 | AD | Andorran | 138 | KT | Christmas Islan |
| 2 | AE | Utd.Arab Emir. | 139 | KW | Kuwait |
| 3 | AF | Afghanistan | 140 | KY | Cayman Islands |
| 4 | AG | Antigua/Barbuda | 141 | KZ | Kazakhstan |
| 5 | AI | Anguilla | 142 | LA | Lào |
| 6 | AL | An Ba Ni | 143 | LB | Lebanon |
| 7 | AM | Armenia | 144 | LC | St. Lucia |
| 8 | AN | Dutch Antilles | 145 | LI | Liechtenstein |
| 9 | AO | Angola | 146 | LK | Sri Lanka |
| 10 | AQ | Antarctica | 147 | LQ | Palmyra Atoll |
| 11 | AR | Argentina | 148 | LR | Liberia |
| 12 | AS | Samoa, America | 149 | LS | Lesotho |
| 13 | AT | Áo | 150 | LT | Lithuania |
| 14 | AU | Úc | 151 | LU | Luxembourg |
| 15 | AW | Aruba | 152 | LV | Latvia |
| 16 | AZ | Azerbaijan | 153 | LY | LiBi |
| 17 | BA | Bosnia-Herz. | 154 | MA | Morocco |
| 18 | BB | Barbados | 155 | MC | Monaco |
| 19 | BD | Bangladesh | 156 | MD | Moldova |
| 20 | BE | Bỉ | 157 | ME | Montenegro |
| 21 | BF | Burkina Faso | 158 | MG | Madagascar |
| 22 | BG | Bun Ga Ri | 159 | MH | Marshall Islnds |
| 23 | BH | Bahrain | 160 | MK | Macedonia |
| 24 | BI | Burundi | 161 | ML | Mali |
| 25 | BJ | Benin | 162 | MM | Myanmar |
| 26 | BL | SaintBarthélemy | 163 | MN | Mông Cổ |
| 27 | BM | Bermuda | 164 | MO | Macau |
| 28 | BN | Brunei Daruss. | 165 | MP | N.Mariana Islnd |
| 29 | BO | Bolivia | 166 | MQ | Martinique |
| 30 | BQ | Navassa Island | 167 | MR | Mauretania |
| 31 | BR | Brazil | 168 | MS | Montserrat |
| 32 | BS | Bahamas | 169 | MT | Malta |
| 33 | BT | Bhutan | 170 | MU | Mauritius |
| 34 | BV | Bouvet Islands | 171 | MV | Maldives |
| 35 | BW | Botswana | 172 | MW | Malawi |
| 36 | BY | Belarus | 173 | MX | Mexico |
| 37 | BZ | Belize | 174 | MY | Malaysia |
| 38 | CA | Ca na da | 175 | MZ | Mozambique |
| 39 | CC | Coconut Islands | 176 | NA | Namibia |
| 40 | CD | Dem. Rep. Congo | 177 | NC | New Caledonia |
| 41 | CF | CAR | 178 | NE | Niger |
| 42 | CG | Rep.of Congo | 179 | NF | Norfolk Islands |
| 43 | CH | Switzerland | 180 | NG | Nigeria |
| 44 | CI | Cote d'Ivoire | 181 | NI | Nicaragua |
| 45 | CK | Cook Islands | 182 | NL | Hà Lan |
| 46 | CL | Chile | 183 | NO | Norway |
| 47 | CM | Cameroon | 184 | NP | Nepal |
| 48 | CN | Trung Quốc | 185 | NR | Nauru |
| 49 | CO | Columbia | 186 | NT | NATO |
| 50 | CP | Channel Islands | 187 | NU | Niue |
| 51 | CR | Costa Rica | 188 | NZ | New Zealand |
| 52 | CS | Serbia/Monten. | 189 | OC | Other Country |
| 53 | CU | Cuba | 190 | OM | Oman |
| 54 | CV | Cape Verde | 191 | OR | Orange |
| 55 | CX | Christmas Islnd | 192 | PA | Panama |
| 56 | CY | Cyprus | 193 | PE | Peru |
| 57 | CZ | Cộng Hòa Séc | 194 | PF | Frenc.Polynesia |
| 58 | DE | Đức | 195 | PG | Pap. New Guinea |
| 59 | DJ | Djibouti | 196 | PH | Philippin |
| 60 | DK | Đan Mạch | 197 | PK | Pakistan |
| 61 | DM | Dominica | 198 | PL | Ba Lan |
| 62 | DO | Dominican Rep. | 199 | PM | St.Pier, Miquel. |
| 63 | DQ | Jarvis Island | 200 | PN | Pitcairn Islnds |
| 64 | DZ | Algeria | 201 | PR | Puerto Rico |
| 65 | EC | Ecuador | 202 | PS | Palestine |
| 66 | EE | Estonia | 203 | PT | Bồ Đào Nha |
| 67 | EG | Egypt | 204 | PW | Palau |
| 68 | EH | West Sahara | 205 | PY | Paraguay |
| 69 | ER | Eritrea | 206 | QA | Qatar |
| 70 | ES | Tây Ban Nha | 207 | RE | Reunion |
| 71 | ET | Ethiopia | 208 | RO | Ru Ma Ni |
| 72 | EU | European Union | 209 | RS | Serbia |
| 73 | FI | Finland | 210 | RU | Nga |
| 74 | FJ | Fiji | 211 | RW | Rwanda |
| 75 | FK | Falkland Islnds | 212 | SA | Saudi Arabia |
| 76 | FM | Micronesia | 213 | SB | Solomon Islands |
| 77 | FO | Faroe Islands | 214 | SC | Seychelles |
| 78 | FQ | Baker Island | 215 | SD | Sudan |
| 79 | FR | Pháp | 216 | SE | Thụy Điển |
| 80 | FS | French Southern | 217 | SG | Singapore |
| 81 | FX | France, Metropo | 218 | SH | Saint Helena |
| 82 | GA | Gabon | 219 | SI | Slovenia |
| 83 | GB | Anh | 220 | SJ | Svalbard |
| 84 | GD | Grenada | 221 | SK | Slovakia |
| 85 | GE | Georgia | 222 | SL | Sierra Leone |
| 86 | GF | French Guayana | 223 | SM | San Marino |
| 87 | GH | Ghana | 224 | SN | Senegal |
| 88 | GI | Gibraltar | 225 | SO | Somalia |
| 89 | GK | Guernsey | 226 | SR | Suriname |
| 90 | GL | Greenland | 227 | ST | S.Tome,Principe |
| 91 | GM | Gambia | 228 | SV | El Salvador |
| 92 | GN | Guinea | 229 | SY | Syria |
| 93 | GO | Glorioso Island | 230 | SZ | Swaziland |
| 94 | GP | Guadeloupe | 231 | TC | Turksh Caicosin |
| 95 | GQ | Equatorial Guin | 232 | TD | Chad |
| 96 | GR | Greece | 233 | TE | Tromelin Island |
| 97 | GS | S. Sandwich Ins | 234 | TF | French S.Territ |
| 98 | GT | Guatemala | 235 | TG | Togo |
| 99 | GU | Guam | 236 | TH | Thái Lan |
| 100 | GW | Guinea-Bissau | 237 | TJ | Tajikistan |
| 101 | GY | Guyana | 238 | TK | Tokelau Islands |
| 102 | GZ | Gaza Strip | 239 | TL | East Timor |
| 103 | HK | Hong Kong | 240 | TM | Turkmenistan |
| 104 | HM | Heard/McDon.Isl | 241 | TN | Tunisia |
| 105 | HN | Honduras | 242 | TO | Tonga |
| 106 | HQ | Howland Island | 243 | TP | East Timor |
| 107 | HR | Nam Tư | 244 | TR | Turkey |
| 108 | HT | Haiti | 245 | TT | Trinidad,Tobago |
| 109 | HU | Hung ga ri | 246 | TV | Tuvalu |
| 110 | ID | Indonesia | 247 | TW | Đài Loan |
| 111 | IE | Ailen (Ireland) | 248 | TZ | Tanzania |
| 112 | IL | Israel | 249 | UA | Ukraine |
| 113 | IM | Isle of Man | 250 | UC | Unknown Country |
| 114 | IN | Ấn Độ | 251 | UE | United Arab Emi |
| 115 | IO | Brit.Ind.Oc.Ter | 252 | UG | Uganda |
| 116 | IP | Clipperton Isla | 253 | UM | Minor Outl.Isl. |
| 117 | IQ | Iraq | 254 | UN | United Nations |
| 118 | IR | Iran | 255 | US | Hoa kỳ |
| 119 | IS | Iceland | 256 | UY | Uruguay |
| 120 | IT | I ta li a | 257 | UZ | Uzbekistan |
| 121 | JA | Japan   Ryukyu | 258 | VA | Vatican City |
| 122 | JE | Jersey | 259 | VC | St. Vincent |
| 123 | JM | Jamaica | 260 | VE | Venezuela |
| 124 | JN | Jan Mayen | 261 | VG | Brit.Virgin Is. |
| 125 | JO | Jordan | 262 | VI | Amer.Virgin Is. |
| 126 | JP | Nhật | 263 | VN | Việt Nam |
| 127 | JQ | Johnston Atoll | 264 | VP | Corsica |
| 128 | JU | Juan de Nova Is | 265 | VU | Vanuatu |
| 129 | KE | Kenya | 266 | WF | Wallis,Futuna |
| 130 | KG | Kyrgyzstan | 267 | WS | Samoa |
| 131 | KH | Cămpuchia | 268 | YE | Yemen |
| 132 | KI | Kiribati | 269 | YT | Mayotte |
| 133 | KM | Comoros | 270 | YU | Serbia \&Mtnegro |
| 134 | KN | St Kitts\&Nevis | 271 | ZA | South Africa |
| 135 | KP | Bắc Triều Tiên | 272 | ZM | Zambia |
| 136 | KQ | Kingman Reef | 273 | ZW | Zimbabwe |
| 137 | KR | Hàn Quốc | 274 | ZZ | Khác |

    

    

17. ##  **LUỒNG GỬI MAIL HÓA ĐƠN** 

      
- Thứ tự ưu tiên xử lý:  
  CusEmails → CusCode → TaxCode   
- **TH01: Có CusEmails**   
  • Ưu tiên gửi mail theo thông tin CusEmails.   
  • Không quan tâm CusCode hoặc TaxCode có tồn tại trong bảng Customer hay không. • Hệ thống gửi theo danh sách email được truyền tại CusEmails.   
    
- TH02: **Không có CusEmails, có CusCode**   
  • CusCode phải tồn tại trong Customer.   
  • Hệ thống tìm thông tin email theo CusCode trong Customer.   
  • Gửi mail theo:   
     **Email:** Email tìm thấy trong Customer.   
     **Mail CC:** Mail CC tìm thấy trong Customer .  
    
- **TH03: Không có CusEmails, không có CusCode, có TaxCode**   
  • TaxCode phải tồn tại trong Customer.   
  • Hệ thống tìm thông tin email theo TaxCode trong Customer.   
  • Gửi mail theo:   
     **Email:** Email tìm thấy trong Customer.   
     **Mail CC:** Mail CC tìm thấy trong Customer .  
  


18. ## Quyết định 19/2025/QĐ-TTg 

      
    [https://thuvienphapluat.vn/van-ban/Bo-may-hanh-chinh/Quyet-dinh-19-2025-QD-TTg-Bang-danh-muc-va-ma-so-cac-don-vi-hanh-chinh-Viet-Nam-663707.aspx](https://thuvienphapluat.vn/van-ban/Bo-may-hanh-chinh/Quyet-dinh-19-2025-QD-TTg-Bang-danh-muc-va-ma-so-cac-don-vi-hanh-chinh-Viet-Nam-663707.aspx)  
  


6. **Các loại hóa đơn đặc biệt**

1. ## Hóa đơn kèm chứng từ bảng kê

- Đối với hóa đơn đính kèm bảng kê, phải thêm trường thông tin về bảng kê :  
  * **ListAttachDate**: Ngày bảng kê \- Bắt buộc đối với các dịch vụ xuất theo kỳ phát sinh sử dụng bảng kê để liệt kê các loại hàng hóa, dịch vụ đã bán kèm theo hóa đơn  
  * **ListAttachNum**: Số bảng kê \- Bắt buộc đối với các dịch vụ xuất theo kỳ phát sinh sử dụng bảng kê để liệt kê các loại hàng hóa, dịch vụ đã bán kèm theo hóa đơn

Ví dụ XML:  
\<Invoices\>  
\<Inv\>  
\<Invoice\>  
\<Ikey\>**Giá trị khóa duy nhất của hóa đơn**\</Ikey\>  
\<CusCode\>**Mã khách hàng**\</CusCode\>  
\<Buyer\>**Tên người mua hàng(bắt buộc với hoá đơn là hàng hoá đặc trưng loại 1\)**\</Buyer\>  
\<CusName\>**Tên khách hàng**\</CusName\>  
\<Email\>**Email của khách nhận thông báo phát hành hoá đơn**\</Email\>  
\<EmailCC\>**Danh sách email CC (ngăn cách bởi dấu phẩy) nhận thông báo phát hành hoá đơn**\</EmailCC\>  
\<CusAddress\>**Địa chỉ khách hàng(bắt buộc với hoá đơn là hàng hoá đặc trưng loại 1\)**\</CusAddress\>  
\<CusBankName\>**Tên ngân hàng của khách hàng**\</CusBankName\>  
\<CusBankNo\>**Số tài khoản ngân hàng của khách hàng**\</CusBankNo\>  
\<CusPhone\>**Điện thoại khách hàng(bắt buộc với hoá đơn là hàng hoá đặc trưng loại 1\)**\</CusPhone\>  
\<CusTaxCode\>**Mã số thuế (Bắt buộc với KHDoanh nghiệp, bắt buộc với hoá đơn là hàng hoá đặc trưng loại 1)**\</CusTaxCode\>  
\<CusIdenification\> **Căn cước công dân người mua hàng ( bắt buộc với Hàng hoá đặc trưng loại 1\)**\</CusIdenification\>  
\<ProvinceCode\> **Mã tỉnh (Bắt buộc đối với hàng hóa đặc trưng loại 1)( xem tại [VII.18](#quyết-định-19/2025/qĐ-ttg))** \</ProvinceCode\>  
\<ProvinceName\> Tên tỉnh/thành phố **(Bắt buộc đối với hàng hóa đặc trưng loại 1)( xem tại [VII.18](https://docs.google.com/document/d/1QN9NwhAYhBidQtGV_XZtXKtYefSJFLZR/edit#heading=h.b1lyy2kzbo8t))** \</ProvinceName \>  
\<CommuneCode\> **Mã xã** (**Bắt buộc đối với hàng hóa đặc trưng loại 1**) **( xem tại [VII.18](#quyết-định-19/2025/qĐ-ttg))**\</CommuneCode\>  
\<CommuneName \> Tên xã/phường  (**Bắt buộc đối với hàng hóa đặc trưng loại 1**) **( xem tại [VII.18](https://docs.google.com/document/d/1QN9NwhAYhBidQtGV_XZtXKtYefSJFLZR/edit#heading=h.b1lyy2kzbo8t))\</**CommuneName **\>**   
\<PaymentMethod\>**Hình thức thanh toán (xem phụ lục V.1)**\</PaymentMethod\>  
\<ArisingDate\>**Ngày bảng kê (mặc định là ngày hiện tại, chuỗiđịnh dạng dd/MM/yyyy)** \</ArisingDate\>  
\<ListAttachDate\>**Ngày phát sinh hóa đơn (chuỗi định dạng dd/MM/yyyy)** \</ListAttachDate\>  
\<ListAttachNum\>**Số bảng kê**\</ListAttachNum\>  
\<ExchangeRate\>**Tỷ giá chuyển đổi**\</ExchangeRate\>  
\<CurrencyUnit\>**Đơn vị tiền tệ (ví dụ VND, USD)** \</CurrencyUnit\>  
\<Extra\>**Thông tin bổ sung (định dạng json có các thuộc tính theo quy ước riêng nếu có phát sinh)** \</Extra\>  
\<Products\>  
\<Product\>  
	\<Code\>**Mã sản phẩm\</**Code\>  
   \<No\>**Số thứ tự\</**No\>  
	\<Feature\>**Loại sản phẩm(xem phụ lục V.11)\</**Feature\>  
\<ProdName\>**Tên sản phẩm (xem thêm tại phụ lục V.5)** \</ProdName\>  
\<ProdUnit\>**Đơn vị tính**\</ProdUnit\>  
\<ProdQuantity\>**Số lượng**\</ProdQuantity\>  
\<ProdPrice\>**Đơn giá**\</ProdPrice\>  
\<Discount\>Tỉ lệ chiết khấu\</Discount\>  
\<DiscountAmount\>Tổng tiền chiết khấu\</DiscountAmount\>  
\<Total\>**Tổng tiền trước thuế**\</Total\>  
\<VATRate\>**Thuế suất (xem phụ lục V.3)** \</VATRate\>  
\<VATRateOther\>**Thuế suất trong trường hợp thuế khác (Khi VATRate \= \-3)**\</VATRateOther\>  
\<VATAmount\>**Tiền thuế**\</VATAmount\>  
\<Amount\>**Tổng tiền sau thuế**\</Amount\>  
\<Extra\>**Thông tin bổ sung (định dạng json có các thuộc tính theo quy ước riêng nếu có phát sinh)**\</Extra\>  
\</Product\>  
\</Products\>  
\<Total\>**Tổng tiền trước thuế**\</Total\>  
\<VATRate\>**Thuế GTGT (xem phụ lục V.3)**\</VATRate\>  
\<VATRateOther\>**Thuế suất trong trường hợp thuế khác (Khi VATRate \= \-3)**\</VATRateOther\>  
\<DiscountAmount\>**Tổng tiền chiết khấu**\</DiscountAmount\>  
\<VATAmount\>**Tiền thuế GTGT**\</VATAmount\>  
\<Amount\>**Tổng tiền**\</Amount\>  
\<GrossValue\>Tổng tiền trước thuế thuế KCT\</GrossValue\>  
\<GrossValue0\>Tổng tiền trước thuế thuế 0%\</GrossValue0\>  
\<GrossValue5\>Tổng tiền trước thuế thuế 5%\</GrossValue5\>  
\<GrossValue10\>Tổng tiền trước thuế thuế 10%\</GrossValue10\>  
\<GrossValueNDeclared\>Tổng tiền trước thuế thuế KKKN\</GrossValueNDeclared\>  
\<GrossValueContractor\>Tổng tiền trước thuế thuế Khác\</GrossValueContractor\>  
\<VatAmount0\>Tổng tiền thuế thuế 0%\</VatAmount0\>  
\<VatAmount5\>Tổng tiền thuế thuế 5%\</VatAmount5\>  
\<VatAmount10\>Tổng tiền thuế thuế 10%\</VatAmount10\>  
\<VatAmountNDeclared\>Tổng tiền thuế thuế KKKN\</VatAmountNDeclared\>  
\<VatAmountContractor\>Tổng tiền thuế thuế Khác\</VatAmountContractor\>  
\<Amount0\>Tổng tiền sau thuế thuế 0%\</Amount0\>  
\<Amount5\>Tổng tiền sau thuế thuế 5%\</Amount5\>  
\<Amount10\>Tổng tiền sau thuế thuế 10%\</Amount10\>  
\<AmountNDeclared\>Tổng tiền sau thuế thuế KKKN\</AmountNDeclared\>  
\<AmountOther\>Tổng tiền sau thuế thuế Khác\</AmountOther\>  
\<GrossValue8\>Tổng tiền trước thuế thuế 8%\</GrossValue8\>  
 \<VatAmount8\>Tổng tiền thuế thuế 8%\</VatAmount8\>   
\<Amount8\>Tổng tiền sau thuế thuế 8%\</Amount8\>

\<AmountInWords\>**Số tiền viết bằng chữ**\</AmountInWords\>  
\</Invoice\>  
\</Inv\>  
\<Inv\>...*thông tin xml hoá đơn khác*...\</Inv\>  
\</Invoices\>

2. ## Hóa đơn bán tài sản công

- Dấu hiệu nhận biết : Pattern bắt đầu bằng số 3 (VD : **3**K23TYY)  
- Đối với loại hóa đơn này, phải thêm những thẻ khai báo thêm một số thẻ thông tin sau:  
* **ComRelateCode** : Mã đơn vị quan hệ ngân sách bên bán \-Bắt buộc khi bên bán không có MST  
* **CusRelateCode** : Mã đơn vị quan hệ ngân sách bên bán \-Bắt buộc khi bên mua không có MST  
* **DecisionCode** : Số quyết định  
* **DecisionDate** : Ngày quyết định  
* **DecisionAgent** : Cơ quan ban hành quyết định  
* **SellMethod** : Hình thức bán  
* **TransportAddress** : Địa điểm vận chuyển đến \- Bắt buộc đối với trường hợp  tài sản là hàng hóa nhập khẩu bị tịch thu  
* **TransportDateFrom** : Thời gian vận chuyển từ \- Bắt buộc đối với trường hợp  tài sản là hàng hóa nhập khẩu bị tịch thu  
* **TransportDateTo** : Thời gian vận chuyển đến \- Bắt buộc đối với trường hợp  tài sản là hàng hóa nhập khẩu bị tịch thu


Ví dụ XML:  
\<Invoices\>  
\<Inv\>  
\<Invoice\>  
\<Ikey\>**Giá trị khóa duy nhất của hóa đơn**\</Ikey\>  
\<CusCode\>**Mã khách hàng**\</CusCode\>  
\<Buyer\>**Tên người mua hàng(bắt buộc với hoá đơn là hàng hoá đặc trưng loại 1\)**\</Buyer\>  
\<CusName\>**Tên khách hàng**\</CusName\>  
\<Email\>**Email của khách nhận thông báo phát hành hoá đơn**\</Email\>  
\<EmailCC\>**Danh sách email CC (ngăn cách bởi dấu phẩy) nhận thông báo phát hành hoá đơn**\</EmailCC\>  
\<CusAddress\>**Địa chỉ khách hàng(bắt buộc với hoá đơn là hàng hoá đặc trưng loại 1\)**\</CusAddress\>  
\<CusBankName\>**Tên ngân hàng của khách hàng**\</CusBankName\>  
\<CusBankNo\>**Số tài khoản ngân hàng của khách hàng**\</CusBankNo\>  
\<CusPhone\>**Điện thoại khách hàng (bắt buộc với hoá đơn là hàng hoá đặc trưng loại 1\)**\</CusPhone\>  
\<CusTaxCode\>**Mã số thuế (Bắt buộc với KHDoanh nghiệp, bắt buộc với hoá đơn là hàng hoá đặc trưng loại 1)**\</CusTaxCode\>  
\<CusIdenification\> **Căn cước công dân người mua hàng ( bắt buộc với Hàng hoá đặc trưng loại 1\)**\</CusIdenification\>  
\<ProvinceCode\> **Mã tỉnh (Bắt buộc đối với hàng hóa đặc trưng loại 1\)** **( xem tại [VII.18](#quyết-định-19/2025/qĐ-ttg))**\</ProvinceCode\>  
\<ProvinceName\> Tên tỉnh/thành phố **(Bắt buộc đối với hàng hóa đặc trưng loại 1)( xem tại [VII.18](https://docs.google.com/document/d/1QN9NwhAYhBidQtGV_XZtXKtYefSJFLZR/edit#heading=h.b1lyy2kzbo8t))** \</ProvinceName \>  
\<CommuneCode\> **Mã xã** (**Bắt buộc đối với hàng hóa đặc trưng loại 1**) **( xem tại [VII.18](#quyết-định-19/2025/qĐ-ttg))**\</CommuneCode\>  
\<CommuneName \> Tên xã/phường  (**Bắt buộc đối với hàng hóa đặc trưng loại 1**) **( xem tại [VII.18](https://docs.google.com/document/d/1QN9NwhAYhBidQtGV_XZtXKtYefSJFLZR/edit#heading=h.b1lyy2kzbo8t))\</**CommuneName **\>**   
\<PaymentMethod\>**Hình thức thanh toán (xem phụ lục V.1)**\</PaymentMethod\>  
\<ArisingDate\>**Ngày bảng kê (mặc định là ngày hiện tại, chuỗiđịnh dạng dd/MM/yyyy)** \</ArisingDate\>  
\<ComRelateCode\>**Mã đơn vị bên bán**\</ComRelateCode\>  
\<CusRelateCode\>**Mã đơn vị bên mua**\</CusRelateCode\>  
\<DecisionCode\>**Số quyết định**\</DecisionCode\>  
\<DecisionDate\>**Ngày quyết định(chuỗi định dạng dd/MM/yyyy)**\</DecisionDate\>  
\<DecisionAgent\>**Cơ quan quyết định**\</DecisionAgent\>  
\<SellMethod\>**Hình thức bán**\</SellMethod\>  
\<TransportAddress\>**Địa điểm vận chuyển tới**\</TransportAddress\>  
\<TransportDateFrom\>**Ngày vận chuyển từ(chuỗi định dạng dd/MM/yyyy)**\</TransportDateFrom\>  
\<TransportDateTo\>**Ngày vận chuyển đến(chuỗi định dạng dd/MM/yyyy)**\</TransportDateTo\>  
\<ExchangeRate\>**Tỷ giá chuyển đổi**\</ExchangeRate\>  
\<CurrencyUnit\>**Đơn vị tiền tệ (ví dụ VND, USD)** \</CurrencyUnit\>  
\<Extra\>**Thông tin bổ sung (định dạng json có các thuộc tính theo quy ước riêng nếu có phát sinh)** \</Extra\>  
\<Products\>  
\<Product\>  
	\<Code\>**Mã sản phẩm\</**Code\>  
   \<No\>**Số thứ tự\</**No\>  
	\<Feature\>**Loại sản phẩm(xem phụ lục V.11)\</**Feature\>  
\<ProdName\>**Tên sản phẩm (xem thêm tại phụ lục V.5)** \</ProdName\>  
\<ProdUnit\>**Đơn vị tính**\</ProdUnit\>  
\<ProdQuantity\>**Số lượng**\</ProdQuantity\>  
\<ProdPrice\>**Đơn giá**\</ProdPrice\>  
\<Discount\>Tỉ lệ chiết khấu\</Discount\>  
\<DiscountAmount\>Tổng tiền chiết khấu\</DiscountAmount\>  
\<Total\>**Tổng tiền trước thuế**\</Total\>  
\<VATRate\>**Thuế suất (xem phụ lục V.3)** \</VATRate\>  
\<VATRateOther\>**Thuế suất trong trường hợp thuế khác (Khi VATRate \= \-3)**\</VATRateOther\>  
\<VATAmount\>**Tiền thuế**\</VATAmount\>  
\<Amount\>**Tổng tiền sau thuế**\</Amount\>  
\<Extra\>**Thông tin bổ sung (định dạng json có các thuộc tính theo quy ước riêng nếu có phát sinh)**\</Extra\>  
\</Product\>  
\</Products\>  
\<Total\>**Tổng tiền trước thuế**\</Total\>  
\<VATRate\>**Thuế GTGT (xem phụ lục V.3)**\</VATRate\>  
\<VATRateOther\>**Thuế suất trong trường hợp thuế khác (Khi VATRate \= \-3)**\</VATRateOther\>  
\<DiscountAmount\>**Tổng tiền chiết khấu**\</DiscountAmount\>  
\<VATAmount\>**Tiền thuế GTGT**\</VATAmount\>  
\<Amount\>**Tổng tiền**\</Amount\>  
\<GrossValue\>Tổng tiền trước thuế thuế KCT\</GrossValue\>  
\<GrossValue0\>Tổng tiền trước thuế thuế 0%\</GrossValue0\>  
\<GrossValue5\>Tổng tiền trước thuế thuế 5%\</GrossValue5\>  
\<GrossValue10\>Tổng tiền trước thuế thuế 10%\</GrossValue10\>  
\<GrossValueNDeclared\>Tổng tiền trước thuế thuế KKKN\</GrossValueNDeclared\>  
\<GrossValueContractor\>Tổng tiền trước thuế thuế Khác\</GrossValueContractor\>  
\<VatAmount0\>Tổng tiền thuế thuế 0%\</VatAmount0\>  
\<VatAmount5\>Tổng tiền thuế thuế 5%\</VatAmount5\>  
\<VatAmount10\>Tổng tiền thuế thuế 10%\</VatAmount10\>  
\<VatAmountNDeclared\>Tổng tiền thuế thuế KKKN\</VatAmountNDeclared\>  
\<VatAmountContractor\>Tổng tiền thuế thuế Khác\</VatAmountContractor\>  
\<Amount0\>Tổng tiền sau thuế thuế 0%\</Amount0\>  
\<Amount5\>Tổng tiền sau thuế thuế 5%\</Amount5\>  
\<Amount10\>Tổng tiền sau thuế thuế 10%\</Amount10\>  
\<AmountNDeclared\>Tổng tiền sau thuế thuế KKKN\</AmountNDeclared\>  
\<AmountOther\>Tổng tiền sau thuế thuế Khác\</AmountOther\>  
\<GrossValue8\>Tổng tiền trước thuế thuế 8%\</GrossValue8\>  
 \<VatAmount8\>Tổng tiền thuế thuế 8%\</VatAmount8\>   
\<Amount8\>Tổng tiền sau thuế thuế 8%\</Amount8\>  
\<AmountInWords\>**Số tiền viết bằng chữ**\</AmountInWords\>  
\</Invoice\>  
\</Inv\>  
\<Inv\>...*thông tin xml hoá đơn khác*...\</Inv\>  
\</Invoices\>

3. ## Hóa đơn bán hàng dự trữ quốc gia

- Dấu hiệu nhận biết : Pattern bắt đầu bằng số 4 (VD : **4**K23TYY)  
- Hóa đơn bán hàng dự trữ quốc gia cần thêm thông tin sau:  
  **IdentityCardNumber**: Số căn cước, chứng minh nhân dân, hộ chiếu của người mua \- Bắt buộc đối với bên mua không có mã số thuế

Ví dụ XML:  
\<Invoices\>  
\<Inv\>  
\<Invoice\>  
\<Ikey\>**Giá trị khóa duy nhất của hóa đơn**\</Ikey\>  
\<CusCode\>**Mã khách hàng**\</CusCode\>  
\<Buyer\>**Tên người mua hàng(bắt buộc với hoá đơn là hàng hoá đặc trưng loại 1\)**\</Buyer\>  
\<CusName\>**Tên khách hàng**\</CusName\>  
\<Email\>**Email của khách nhận thông báo phát hành hoá đơn**\</Email\>  
\<EmailCC\>**Danh sách email CC (ngăn cách bởi dấu phẩy) nhận thông báo phát hành hoá đơn**\</EmailCC\>  
\<CusAddress\>**Địa chỉ khách hàng(bắt buộc với hoá đơn là hàng hoá đặc trưng loại 1\)**\</CusAddress\>  
\<CusBankName\>**Tên ngân hàng của khách hàng**\</CusBankName\>  
\<CusBankNo\>**Số tài khoản ngân hàng của khách hàng**\</CusBankNo\>  
\<CusPhone\>**Điện thoại khách hàng(bắt buộc với hoá đơn là hàng hoá đặc trưng loại 1\)**\</CusPhone\>  
\<CusTaxCode\>**Mã số thuế (Bắt buộc với KHDoanh nghiệp, bắt buộc với hoá đơn là hàng hoá đặc trưng loại 1)**\</CusTaxCode\>  
\<CusIdenification\> **Căn cước công dân người mua hàng ( bắt buộc với Hàng hoá đặc trưng loại 1\)**\</CusIdenification\>  
\<ProvinceCode\> **Mã tỉnh (Bắt buộc đối với hàng hóa đặc trưng loại 1\)** **( xem tại [VII.18](#quyết-định-19/2025/qĐ-ttg))**\</ProvinceCode\>  
\<ProvinceName\> Tên tỉnh/thành phố **(Bắt buộc đối với hàng hóa đặc trưng loại 1)( xem tại [VII.18](https://docs.google.com/document/d/1QN9NwhAYhBidQtGV_XZtXKtYefSJFLZR/edit#heading=h.b1lyy2kzbo8t))** \</ProvinceName \>  
\<CommuneCode\> **Mã xã** (**Bắt buộc đối với hàng hóa đặc trưng loại 1**) **( xem tại [VII.18](#quyết-định-19/2025/qĐ-ttg))**\</CommuneCode\>  
\<CommuneName \> Tên xã/phường  (**Bắt buộc đối với hàng hóa đặc trưng loại 1**) **( xem tại [VII.18](https://docs.google.com/document/d/1QN9NwhAYhBidQtGV_XZtXKtYefSJFLZR/edit#heading=h.b1lyy2kzbo8t))\</**CommuneName **\>**   
\<PaymentMethod\>**Hình thức thanh toán (xem phụ lục V.1)**\</PaymentMethod\>  
\<ArisingDate\>**Ngày bảng kê (mặc định là ngày hiện tại, chuỗiđịnh dạng dd/MM/yyyy)** \</ArisingDate\>  
\<**IdentityCardNumber**\>**Số căn cước**\</**IdentityCardNumber**\>  
\<ExchangeRate\>**Tỷ giá chuyển đổi**\</ExchangeRate\>  
\<CurrencyUnit\>**Đơn vị tiền tệ (ví dụ VND, USD)** \</CurrencyUnit\>  
\<Extra\>**Thông tin bổ sung (định dạng json có các thuộc tính theo quy ước riêng nếu có phát sinh)** \</Extra\>  
\<Products\>  
\<Product\>  
	\<Code\>**Mã sản phẩm\</**Code\>  
   \<No\>**Số thứ tự\</**No\>  
	\<Feature\>**Loại sản phẩm(xem phụ lục V.11)\</**Feature\>  
\<ProdName\>**Tên sản phẩm (xem thêm tại phụ lục V.5)** \</ProdName\>  
\<ProdUnit\>**Đơn vị tính**\</ProdUnit\>  
\<ProdQuantity\>**Số lượng**\</ProdQuantity\>  
\<ProdPrice\>**Đơn giá**\</ProdPrice\>  
\<Discount\>Tỉ lệ chiết khấu\</Discount\>  
\<DiscountAmount\>Tổng tiền chiết khấu\</DiscountAmount\>  
\<Total\>**Tổng tiền trước thuế**\</Total\>  
\<VATRate\>**Thuế suất (xem phụ lục V.3)** \</VATRate\>  
\<VATRateOther\>**Thuế suất trong trường hợp thuế khác (Khi VATRate \= \-3)**\</VATRateOther\>  
\<VATAmount\>**Tiền thuế**\</VATAmount\>  
\<Amount\>**Tổng tiền sau thuế**\</Amount\>  
\<Extra\>**Thông tin bổ sung (định dạng json có các thuộc tính theo quy ước riêng nếu có phát sinh)**\</Extra\>  
\</Product\>  
\</Products\>  
\<Total\>**Tổng tiền trước thuế**\</Total\>  
\<VATRate\>**Thuế GTGT (xem phụ lục V.3)**\</VATRate\>  
\<VATRateOther\>**Thuế suất trong trường hợp thuế khác (Khi VATRate \= \-3)**\</VATRateOther\>  
\<VATAmount\>**Tiền thuế GTGT**\</VATAmount\>  
\<Amount\>**Tổng tiền**\</Amount\>  
\<GrossValue\>Tổng tiền trước thuế thuế KCT\</GrossValue\>  
\<GrossValue0\>Tổng tiền trước thuế thuế 0%\</GrossValue0\>  
\<GrossValue5\>Tổng tiền trước thuế thuế 5%\</GrossValue5\>  
\<GrossValue10\>Tổng tiền trước thuế thuế 10%\</GrossValue10\>  
\<GrossValueNDeclared\>Tổng tiền trước thuế thuế KKKN\</GrossValueNDeclared\>  
\<GrossValueContractor\>Tổng tiền trước thuế thuế Khác\</GrossValueContractor\>  
\<VatAmount0\>Tổng tiền thuế thuế 0%\</VatAmount0\>  
\<VatAmount5\>Tổng tiền thuế thuế 5%\</VatAmount5\>  
\<VatAmount10\>Tổng tiền thuế thuế 10%\</VatAmount10\>  
\<VatAmountNDeclared\>Tổng tiền thuế thuế KKKN\</VatAmountNDeclared\>  
\<VatAmountContractor\>Tổng tiền thuế thuế Khác\</VatAmountContractor\>  
\<Amount0\>Tổng tiền sau thuế thuế 0%\</Amount0\>  
\<Amount5\>Tổng tiền sau thuế thuế 5%\</Amount5\>  
\<Amount10\>Tổng tiền sau thuế thuế 10%\</Amount10\>  
\<AmountNDeclared\>Tổng tiền sau thuế thuế KKKN\</AmountNDeclared\>  
\<AmountOther\>Tổng tiền sau thuế thuế Khác\</AmountOther\>  
\<GrossValue8\>Tổng tiền trước thuế thuế 8%\</GrossValue8\>  
 \<VatAmount8\>Tổng tiền thuế thuế 8%\</VatAmount8\>   
\<Amount8\>Tổng tiền sau thuế thuế 8%\</Amount8\>

\<AmountInWords\>**Số tiền viết bằng chữ**\</AmountInWords\>  
\</Invoice\>  
\</Inv\>  
\<Inv\>...*thông tin xml hoá đơn khác*...\</Inv\>  
\</Invoices\>

7. **Những thay đổi đối với chuẩn Thông tư 32**

  Đối với các bên đã tích hợp với hệ thống EasyInvoice trước đây, Easyinvoice sẽ vẫn nhận các API theo chuẩn cũ và tự động convert sang xml theo chuẩn 78 của cơ quan thuế mà không phải thay đổi nhiều. Dưới đây là các lưu ý và thay đổi khi triển khai trên hệ thống 78 mới :

1. ## Nội dung request

 \-Thông tư 78 chuyển đổi mẫu số, ký hiệu thành một trường Ký hiệu hóa đơn duy nhất, Softdream quy định trường đó là Pattern(Mẫu số). Ký hiệu hóa đơn theo format của TT78 sẽ được truyền vào Pattern trong request, Serial sẽ để giá trị trống : “”.  
Ví Dụ :  
\- Request data hệ thống cũ :  
Data: {“XmlData”: “Chuỗi XML”, “Pattern”: “01GTKT0/001”, “Serial”: “AA/21E” }  
\- Request data hệ thống TT78 mới :  
Data: {“XmlData”: “Chuỗi XML”, “Pattern”: “2C21TTT”, “Serial”: “” }

**Lưu ý : Thay đổi này áp dụng cho tất cả API có yêu cầu truyền tham số Pattern và Serial. Hệ thống nào sử dụng cả hai loại dải hóa đơn theo thông tư 32 và 78 nên truyền thêm tham số Pattern để tránh hệ thống chọn nhầm dải hóa đơn sẽ phát sinh lỗi 5 : “Có lỗi xảy ra” hoặc lỗi 4 : “Ký hiệu mẫu số không khả dụng”.**

2. ## Nội dung XML Data

XML Data của hóa đơn sẽ có thay đổi trong các trường hợp sau :

- **Loại hóa đơn đặc biệt** : Loại hóa đơn khách hàng chọn thuộc loại hóa đơn đặc biệt được liệt kê tại mục VI. Chi tiết thay đổi xin vui lòng xem mục VI.

- **Hóa đơn có thuế Khác** : Loại thuế suất khách hàng sử dụng là loại Thuế Khác( hay còn gọi là Thuế Nhà Thầu, Giá trị thẻ VatRate \= \-3). Đối với trường hợp này, ta cần sinh thêm một thẻ để truyền chính xác % thuế này lên thuế tại thẻ \<VATRateOther\>, tối đa lẻ 2 chữ số sau dấu phẩy. 

Ví Dụ :   
\<VATRate\>**\-3**\</VATRate\>  
\<VATRateOther\>**12.34**\</VATRateOther\>

- **Mẫu hóa đơn một thuế** **(Một thuế cho toàn sản phẩm trên hóa đơn) :** Với mẫu chung thuế, trước đây không đẩy giá trị Tiền thuế và Tổng tiền sau thuế từng sản phẩm vì trên mẫu không hiển thị, tuy nhiên cục thuế bắt buộc xml hóa đơn phải có dữ liệu này. Phía Softdreams nhận thấy do có rất nhiều doanh nghiệp có nghiệp vụ đặc thù nên việc tính lại phần tiền này rất dễ gây sai sót. Vậy nên với khách hàng đang gửi XML Format của mẫu chung thuế xin hãy gửi thêm đầy đủ và chính xác thêm các thẻ sau vào từng XML sản phẩm :

| STT | XML Tag | Diễn Giải | Chuẩn Cũ | Chuẩn Mới |
| :---: | ----- | ----- | ----- | ----- |
| **1** | VatAmount  | Tổng tiền thuế sản phẩm | Không cần gửi lên | Bắt buộc gửi lên |
| **2** | Total | Tổng tiền sản phẩm trước thuế | Có thể gửi \=0 hoặc \= Amount | Gửi lại chính xác tiền trước thuế |
| **3** | Amount | Tổng tiền sản phẩm sau thuế | có thể gửi \=0 hoặc \= Total | Gửi lại chính xác tiền sau thuế |

**\*Note:** Giá trị của thẻ thuế suất từng sản phẩm **\<VATRate\>** có thể chỉnh sửa và gửi lên thêm, nếu không Softdream sẽ tự lấy **\<VATRate\>** của hóa đơn gán cho toàn bộ sản phẩm. Thẻ **\<VATRateOther\>** của hóa đơn cũng sẽ lấy tương tự khi Thuế suất hóa đơn có giá trị “-3”.

- **Mẫu hóa đơn có lệ phí :** Hóa đơn có lệ phí phải khai báo từng loại lệ phí trên hóa đơn. Khi có lệ phí, XML của hóa đơn sẽ phải thêm các thẻ sau :

  \<InvoiceFees\>

  	\<InvoiceFee\>

  		\<**Name**\>**Tên loại lệ phí**\</**Name**\>

  		\<**Amount**\>**Tổng tiền lệ phí**\</**Amount**\>

  		\<FeeRate\>Tỉ lệ lệ phí (Để \= 0 nếu không có)\</FeeRate\>

  		\<VATRate\>Thuế suất của lệ phí\</VATRate\>

  		\<VATAmount\>Tiền thuế của lệ phí\</VATAmount\>

  		\<TotalCharge\>Tiền sau thuế của lệ phí\</TotalCharge\>

  	\</InvoiceFee\>

  	\<InvoiceFee\>

  		*.….Các loại lệ phí khác nếu có…..*

  	\</InvoiceFee\>

  \</InvoiceFees\>


  *Mô tả chi tiết reuqest phần lệ phí:*

| Field | Type | Format | Required | Description | Note |
| :---- | :---- | :---- | :---- | :---- | :---- |
| Name | String | MinLength: 1MaxLength: 100 | True | Tên lệ phí |   |
| Amount | Decimal | Value: decimal(18,3) | True | Thành tiền trước thuế của lệ phí |   |
| FeeRate | Decimal | Value: decimal(4,2) |  | Tỉ lệ của lệ phí |   |
| VatRate | Decimal | Value: decimal(4,2) |  | Thuế suất của lệ phí |  Các giá trị xem ở [*Thuế suất*](#thuế-suất) |
| VatRateOther | Decimal | Value: decimal(4,2) |  | Giá trị thuế suất khác của lệ phí | Bắt buốc nếu thuế suất là loại thuế Khác (VatRate \= \-3) |
| VatAmount | Decimal | Value: decimal(18,3) |  | Tiền thuế của lệ phí |   |
| TotalCharge | Decimal | Value: decimal(18,3) |  | Tiền sau thuế của lệ phí |   |

	**XML Format:**   
\<Product\>  
	\<Code\>**Mã sản phẩm\</**Code\>  
   \<No\>**Số thứ tự\</**No\>  
\<ProdName\>**Tên sản phẩm (xem thêm tại phụ lục V.5)** \</ProdName\>  
\<ProdUnit\>**Đơn vị tính**\</ProdUnit\>  
\<ProdQuantity\>**Số lượng**\</ProdQuantity\>  
\<ProdPrice\>**Đơn giá**\</ProdPrice\>  
\<Discount\>Tỉ lệ chiết khấu\</Discount\>  
\<DiscountAmount\>Tổng tiền chiết khấu\</DiscountAmount\>  
\<Total\>**Tổng tiền trước thuế**\</Total\>  
\<VATAmount\>**Tiền thuế**\</VATAmount\>  
\<Amount\>**Tổng tiền sau thuế**\</Amount\>  
\<Extra\>**Thông tin bổ sung (định dạng json có các thuộc tính theo quy ước riêng nếu có phát sinh)**\</Extra\>  
\</Product\>

3. ## 	Các thẻ khuyến nghị thêm để đảm bảo đủ thông tin chính xác nhất theo chuẩn dữ liệu thông tư 78\.

   1. ### Thẻ trong sản phẩm \<Products\>

         \<No\>**Số thứ tự\</**No\>

      	\<Feature\>**Loại sản phẩm(xem phụ lục V.11)\</**Feature\>

      \<Total\>**Tổng tiền trước thuế**\</Total\>

      \<VATRate\>**Thuế suất (xem phụ lục V.3)** \</VATRate\>

      \<VATRateOther\>**Thuế suất trong trường hợp thuế khác (Khi VATRate \= \-3)**\</VATRateOther\>

      \<VATAmount\>**Tiền thuế**\</VATAmount\>

      \<Amount\>**Tổng tiền sau thuế**\</Amount\>

   2. ### Thẻ trong hóa đơn

      \<GrossValue\>Tổng tiền trước thuế thuế KCT\</GrossValue\>  
      \<GrossValue0\>Tổng tiền trước thuế thuế 0%\</GrossValue0\>  
      \<GrossValue5\>Tổng tiền trước thuế thuế 5%\</GrossValue5\>  
      \<GrossValue10\>Tổng tiền trước thuế thuế 10%\</GrossValue10\>  
      \<GrossValueNDeclared\>Tổng tiền trước thuế thuế KKKN\</GrossValueNDeclared\>  
      \<GrossValueContractor\>Tổng tiền trước thuế thuế Khác\</GrossValueContractor\>  
      \<VatAmount0\>Tổng tiền thuế thuế 0%\</VatAmount0\>  
      \<VatAmount5\>Tổng tiền thuế thuế 5%\</VatAmount5\>  
      \<VatAmount10\>Tổng tiền thuế thuế 10%\</VatAmount10\>  
      \<VatAmountNDeclared\>Tổng tiền thuế thuế KKKN\</VatAmountNDeclared\>  
      \<VatAmountContractor\>Tổng tiền thuế thuế Khác\</VatAmountContractor\>  
      \<Amount0\>Tổng tiền sau thuế thuế 0%\</Amount0\>  
      \<Amount5\>Tổng tiền sau thuế thuế 5%\</Amount5\>  
      \<Amount10\>Tổng tiền sau thuế thuế 10%\</Amount10\>  
      \<AmountNDeclared\>Tổng tiền sau thuế thuế KKKN\</AmountNDeclared\>  
      \<AmountOther\>Tổng tiền sau thuế thuế Khác\</AmountOther\>  
      \<GrossValue8\>Tổng tiền trước thuế thuế 8%\</GrossValue8\>  
       \<VatAmount8\>Tổng tiền thuế thuế 8%\</VatAmount8\>   
      \<Amount8\>Tổng tiền sau thuế thuế 8%\</Amount8\>  
      \<GrossCTTC\>Tổng tiền trước thuế thuế CTTC\</GrossCTTC\>  
      \<VatAmountCTTC\>Tổng tiền thuế thuế CTTC\</VatAmountCTTC\>  
      \<AmountCTTC\>Tổng tiền thuế thuế CTTC\</AmountCTTC\>

   

Modified date : 11/03/2021

# **Thay đổi theo NĐ70**

1. ## Bổ sung thêm thông tin bên mua vào thông tin Invoice

* *Theo Khoản 7, Điều 1, Nghị định 70*, trường hợp hoá đơn có yêu cầu thêm thông tin bên mua Mã đơn vị quan hệ ngân sách, Số hộ chiếu, Số CCCD thì  request bổ sung như sau:   
    
  \<CusIdentification\>**Số CCCD \- nhập 9 hoặc 12 ký tự**\</CusIdentification\>  
  \<BudgetaryRelationshipCode\>**Mã quan hệ ngân sách có 7 ký tự, số bắt đầu phải \> 0**\</BudgetaryRelationshipCode\>  
  \<PassportNo\>**Số hộ chiếu tối đa 20 ký tự**\</PassportNo\>  
    
* *Request:*  
    
  \<Invoices\>  
  	\<Inv\>  
  		\<Invoice\>  
  			\<Ikey\>Giá trị khóa duy nhất của hóa đơn\</Ikey\>  
  			\<CusCode\>Mã khách hàng\</CusCode\>  
  			\<Buyer\>Tên người mua hàng(**bắt buộc với hoá đơn là hàng hoá đặc trưng loại 1\)**\</Buyer\>  
  			\<CusName\>Tên khách hàng\</CusName\>  
  			\<Email\>Email của khách nhận thông báo phát hành hoá đơn\</Email\>  
  			\<EmailCC\>Danh sách email CC (ngăn cách bởi dấu phẩy) nhận thông báo phát hành hoá đơn\</EmailCC\>  
  			\<CusEmails/\>  
  			\<CusAddress\>Địa chỉ khách hàng(**bắt buộc với hoá đơn là hàng hoá đặc trưng loại 1\)**\</CusAddress\>  
  			\<CusIdentification\>số CCCD yêu cầu chỉ cho phép nhập 9 hoặc 12 ký tự\</CusIdentification\>  
  			\<BudgetaryRelationshipCode\>Mã quan hệ ngân sách\</BudgetaryRelationshipCode\>  
  			\<PassportNo\>Số hộ chiếu\</PassportNo\>  
  			\<CusBankName\>Tên ngân hàng của khách hàng\</CusBankName\>  
  			\<CusBankNo\>Số tài khoản ngân hàng của khách hàng\</CusBankNo\>  
  			\<CusPhone\>Điện thoại khách hàng(**bắt buộc với hoá đơn là hàng hoá đặc trưng loại 1\)**\</CusPhone\>  
  			\<CusTaxCode\>Mã số thuế (Bắt buộc với KHDoanh nghiệp, **bắt buộc với hoá đơn là hàng hoá đặc trưng loại 1**)\</CusTaxCode\>  
  			\<PaymentMethod\>Hình thức thanh toán bắt buộc\</PaymentMethod\>  
  			\<ArisingDate\>Ngày phát sinh hóa đơn (mặc định là ngày hiện tại, chuỗiđịnh dạng dd/MM/yyyy)\</ArisingDate\>  
  			\<ExchangeRate\>Tỷ giá chuyển đổi\</ExchangeRate\>  
  			\<CurrencyUnit/\>  
  			\<Products\>  
  				\<Product\>  
  					\<Code/\>  
  					\<ProdName\>sp1\</ProdName\>  
  					\<ProdUnit\>Vé\</ProdUnit\>  
  					\<Feature\>1\</Feature\>  
  					\<ProdQuantity\>1.0\</ProdQuantity\>  
  					\<ProdPrice\>15\</ProdPrice\>  
  					\<Total\>15\</Total\>  
  					\<VATRate\>0\</VATRate\>  
  					\<VATRateOther\>0\</VATRateOther\>  
  					\<VATAmount\>0\</VATAmount\>  
  					\<Amount\>15\</Amount\>  
  					\<Extra/\>  
  				\</Product\>  
  			\</Products\>  
  			\<Total\>17\</Total\>  
  			\<VATRate\>0\</VATRate\>  
  			\<VATRateOther\>Thuế suất trong trường hợp thuế khác (Khi VATRate \= \-3)\</VATRateOther\>  
  			\<VATAmount\>0\</VATAmount\>  
  			\<Amount\>17\</Amount\>  
  			\<GrossValue\>Tổng tiền trước thuế thuế KCT\</GrossValue\>  
  			\<GrossValue0\>Tổng tiền trước thuế thuế 0%\</GrossValue0\>  
  			\<GrossValue5\>Tổng tiền trước thuế thuế 5%\</GrossValue5\>  
  			\<GrossValue10\>Tổng tiền trước thuế thuế 10%\</GrossValue10\>  
  			\<GrossValueNDeclared\>Tổng tiền trước thuế thuế KKKN\</GrossValueNDeclared\>  
  			\<GrossValueContractor\>Tổng tiền trước thuế thuế Khác\</GrossValueContractor\>  
  			\<VatAmount0\>Tổng tiền thuế thuế 0%\</VatAmount0\>  
  			\<VatAmount5\>Tổng tiền thuế thuế 5%\</VatAmount5\>  
  			\<VatAmount10\>Tổng tiền thuế thuế 10%\</VatAmount10\>  
  			\<VatAmountNDeclared\>Tổng tiền thuế thuế KKKN\</VatAmountNDeclared\>  
  			\<VatAmountContractor\>Tổng tiền thuế thuế Khác\</VatAmountContractor\>  
  			\<Amount0\>Tổng tiền sau thuế thuế 0%\</Amount0\>  
  			\<Amount5\>Tổng tiền sau thuế thuế 5%\</Amount5\>  
  			\<Amount10\>Tổng tiền sau thuế thuế 10%\</Amount10\>  
  			\<AmountNDeclared\>Tổng tiền sau thuế thuế KKKN\</AmountNDeclared\>  
  			\<AmountOther\>Tổng tiền sau thuế thuế Khác\</AmountOther\>  
  			\<GrossValue8\>Tổng tiền trước thuế thuế 8%\</GrossValue8\>  
  			\<VatAmount8\>Tổng tiền thuế thuế 8%\</VatAmount8\>  
  			\<Amount8\>Tổng tiền sau thuế thuế 8%\</Amount8\>  
  			\<AmountInWords\>Mười bảy đồng\</AmountInWords\>  
  			\<Extra/\>  
  		\</Invoice\>  
  	\</Inv\>  
  \</Invoices\>  
  


2. ## Hoá đơn đặc trưng bổ sung thông tin vào Extra Product

* *Theo Điểm b khoản 7 điều 1 Nghị định 70* & NĐ254, hoá đơn đặc trưng bắt buộc bổ sung các thông tin hàng hoá dịch vụ liên quan, cụ thể như sau:  
- Tính chất hàng hoá dịch vụ bổ sung thêm **tính chất 5 \- hàng hoá đặc trưng ( xem phụ lục [VII.15](#danh-mục-loại-hàng-hoá-đắc-trưng-\(-theo-phụ-lục-xv-của-thuế-cung-cấp\)))**


- Hoá đơn mua bán xe: bổ sung các thông tin  **Số khung (SKhung)**, **Số máy (SMay), Loại tài sản (LTSan): ô tô, xe máy, Tình trạng tài sản (TTTSan): chưa qua sử dụng, đã qua sử dụng, Xuất xứ (XXu): lắp ráp, nhập khẩu, Số Giấy chứng nhận chất lượng an toàn kỹ thuật và bảo vệ môi trường (SGCNATKThuat) (đối với xe nhập khẩu), Số seri Phiếu kiểm tra chất lượng xuất xưởng (xe sản xuất, lắp ráp trong nước) (SSPKTCLXXuong), Mã nước sản xuất(MNSXuat), Tên loại tài sản đăng ký(TLTSDKy), Năm sản xuất(NSXuat), Tên thương mại(TTMai), Tên nhãn hiệu(TNHieu), Kiểu loại xe(KLXe), Thể tích làm việc hoặc Công suất(TTLVHCSuat), Trọng tải(TTai), Số người cho phép chở(SCNgoi),Số biển kiểm soát(SBKSoat)**


- Hoá đơn dịch vụ vận chuyển: bổ sung thông tin **Biển kiểm soát phương tiện vận chuyển (BKSPTVChuyen), Điểm đi (DDi), Điểm đến (DDen)**


- Hoá đơn dịch vụ vận chuyển trên nền tảng số TMĐT: bổ sung các thông tin **Tên hàng hóa vận chuyển(THHVChuyen)**, **Tên người gửi hàng (TNGHang), Địa chỉ người gửi hàng (DCNGHang), MST người gửi hàng (MSTNGHang), Số định danh người gửi hàng (MDDNGHang)**

- Hoá đơn Hàng hóa phải đăng ký quyền sử dụng, quyền sở hữu thì trên hóa đơn phải thể hiện các số hiệu, ký hiệu đặc trưng của hàng hóa mà khi đăng ký pháp luật có yêu cầu: bổ sung các thông tin : **Thông tin thửa đất: Số thửa, số tờ bản đồ, diện tích, loại đất, thời hạn sử dụng đất, nguồn gốc sử dụng đất, hình thức sử dụng đất, địa chỉ ( TTTDat),  Thông tin tài sản gắn liền với đất: Tên tài sản/Hạng mục công trình, Diện tích xây dựng, Diện tích sàn hoặc công suất, Kết cấu chủ yếu, Cấp công trình, Số tầng, Năm HT xây dựng, Thời hạn sở hữu( TTTSGLTDat)**  
* API bổ sung vào Product Extra, cụ thể như sau:  
- Tính chất hàng hoá đặc trưng: **\<Feature\>5\</Feature\>**  
- Hoá đơn là loại Hoá đơn mua bán xe: **\<Extra\>{\\"SKhung\\":\\"VN1234567890\\",\\"SMay\\":\\"ENGINE98765\\",\\"LTSan\\":1,\\"TTTSan\\":1,\\"XXu\\":1,\\"SGCNATKThuat\\":\\"GCN-2026-001234\\",\\"SSPKTCLXXuong\\":null,\\"MNSXuat\\":\\"JP\\",\\"TLTSDKy\\":\\"Ô tô con\\",\\"NSXuat\\":2023,\\"TTMai\\":\\"Toyota Vios 1.5E\\",\\"TNHieu\\":\\"TOYOTA\\",\\"KLXe\\":\\"Sedan\\",\\"TTLVHCSuat\\":\\"1498\\",\\"TTai\\":0,\\"SCNgoi\\":5,\\"SBKSoat\\":\\"51A-12345\\ "}\</Extra\>**  
- Hoá đơn là loại Hoá đơn dịch vụ vận chuyển: **\<Extra\>{\\"BKSPTVChuyen\\":\\"1234567\\",\\"DDi\\":\\"Hà Nội\\",\\"DDen\\":\\"Nghệ An\\" }\</Extra\>**  
- Hoá đơn là loại Hoá đơn dịch vụ vận chuyển trên nền tảng số TMĐT: **\<Extra\>{\\"THHVChuyen\\":\\"Thực phẩm đông lạnh\\" ,\\"TNGHang\\":\\"Nguyễn Văn A\\",\\"DCNGHang\\":\\"Hà Nội\\",\\"MSTNGHang\\":\\"0105789541\\",\\"MDDNGHang\\":\\"039848473\\"}\</Extra\>**  
- Hoá đơn là Hàng hóa phải đăng ký quyền sử dụng, quyền sở hữu:

  **\<Extra\>{\\"TTTDat\\":\\"Số thửa: 123; Số tờ bản đồ: 45; Diện tích: 120.5m2; Loại đất: Đất ở; Thời hạn sử dụng đất: Lâu dài; Nguồn gốc sử dụng đất: Nhà nước công nhận; Hình thức sử dụng đất: Sử dụng riêng; Địa chỉ: Hà Nội\\",\\"TTTSGLTDat\\":\\"Tên tài sản/Hạng mục công trình: Nhà ở; Diện tích xây dựng: 80m2; Diện tích sàn hoặc công suất: 240m2; Kết cấu chủ yếu: Bê tông cốt thép; Cấp công trình: Cấp III; Số tầng: 3; Năm HT xây dựng: 2020; Thời hạn sở hữu: Lâu dài\\"}\</Extra\>**

* *Request example:*  
  \<Invoices\>  
  	\<Inv\>  
  		\<Invoice\>  
  			\<Ikey\>Giá trị khóa duy nhất của hóa đơn\</Ikey\>  
  			\<CusCode\>Mã khách hàng\</CusCode\>  
  			\<Buyer\>Tên người mua hàng(**bắt buộc với hoá đơn là hàng hoá đặc trưng loại 1\)**\</Buyer\>  
  			\<CusName\>Tên khách hàng\</CusName\>  
  			\<Email\>Email của khách nhận thông báo phát hành hoá đơn\</Email\>    
  			\<EmailCC\>Danh sách email CC (ngăn cách bởi dấu phẩy) nhận thông báo phát hành hoá đơn\</EmailCC\>  
             			 \<CusEmails\>\</CusEmails\>  
              		\<CusAddress\>Địa chỉ khách hàng(**bắt buộc với hoá đơn là hàng hoá đặc trưng loại 1\)**\</CusAddress\>           
  			\<CusBankName\>Tên ngân hàng của khách hàng\</CusBankName\>

  \<CusBankNo\>Số tài khoản ngân hàng của khách hàng\</CusBankNo\>

  			\<CusPhone\>Điện thoại khách hàng(**bắt buộc với hoá đơn là hàng hoá đặc trưng loại 1\)**\</CusPhone\>

  \<CusTaxCode\>Mã số thuế (Bắt buộc với KHDoanh nghiệp, **bắt buộc với hoá đơn là hàng hoá đặc trưng loại 1**)\</CusTaxCode\>  
  \<CusIdenification\> **Căn cước công dân người mua hàng ( bắt buộc với Hàng hoá đặc trưng loại 1\)**\</CusIdenification\>  
  \<ProvinceCode\> **Mã tỉnh (Bắt buộc đối với hàng hóa đặc trưng loại 1\)** **( xem tại [VII.18](#quyết-định-19/2025/qĐ-ttg))**\</ProvinceCode\>  
  \<ProvinceName\> Tên tỉnh/thành phố **(Bắt buộc đối với hàng hóa đặc trưng loại 1)( xem tại [VII.18](https://docs.google.com/document/d/1QN9NwhAYhBidQtGV_XZtXKtYefSJFLZR/edit#heading=h.b1lyy2kzbo8t))** \</ProvinceName \>  
  \<CommuneCode\> **Mã xã** (**Bắt buộc đối với hàng hóa đặc trưng loại 1**) **( xem tại [VII.18](#quyết-định-19/2025/qĐ-ttg))**\</CommuneCode\>  
  \<CommuneName \> Tên xã/phường  (**Bắt buộc đối với hàng hóa đặc trưng loại 1**) **( xem tại [VII.18](https://docs.google.com/document/d/1QN9NwhAYhBidQtGV_XZtXKtYefSJFLZR/edit#heading=h.b1lyy2kzbo8t))\</**CommuneName **\>** 

  			\<PaymentMethod\>Hình thức thanh toán\</PaymentMethod\>  
  			\<ArisingDate\>Ngày phát sinh hóa đơn (mặc định là ngày hiện tại, chuỗiđịnh dạng dd/MM/yyyy)\</ArisingDate\>  
  			\<ExchangeRate\>Tỷ giá chuyển đổi\</ExchangeRate\>  
  			\<CurrencyUnit\>\</CurrencyUnit\>  
  			\<Products\>  
  				\<Product\>  
  					\<Code\>\</Code\>  
  					\<ProdName\>sp1\</ProdName\>  
  					\<ProdUnit\>Vé\</ProdUnit\>  
                      				\<Feature\>5\</Feature\>  
  					\<ProdQuantity\>1.0\</ProdQuantity\>  
  					\<ProdPrice\>15\</ProdPrice\>  
  					\<Total\>15\</Total\>  
  					\<VATRate\>0\</VATRate\>  
  					\<VATRateOther\>0\</VATRateOther\>  
  					\<VATAmount\>0\</VATAmount\>

						\<Amount\>15\</Amount\>	  
> > > > > > **\<Extra\>{\\"SKhung\\":\\"1234567\\",\\"SMay\\":\\"039848473\\"}\</Extra\>**  
				\</Product\>    
			\</Products\>  
			\<Total\>17\</Total\>  
			\<VATRate\>0\</VATRate\>  
\<VATRateOther\>**Thuế suất trong trường hợp thuế khác (Khi VATRate \= \-3)**\</VATRateOther\>  
			\<VATAmount\>0\</VATAmount\>  
			\<Amount\>17\</Amount\>  
\<GrossValue\>Tổng tiền trước thuế thuế KCT\</GrossValue\>  
\<GrossValue0\>Tổng tiền trước thuế thuế 0%\</GrossValue0\>  
\<GrossValue5\>Tổng tiền trước thuế thuế 5%\</GrossValue5\>  
\<GrossValue10\>Tổng tiền trước thuế thuế 10%\</GrossValue10\>  
\<GrossValueNDeclared\>Tổng tiền trước thuế thuế KKKN\</GrossValueNDeclared\>  
\<GrossValueContractor\>Tổng tiền trước thuế thuế Khác\</GrossValueContractor\>  
\<VatAmount0\>Tổng tiền thuế thuế 0%\</VatAmount0\>  
\<VatAmount5\>Tổng tiền thuế thuế 5%\</VatAmount5\>  
\<VatAmount10\>Tổng tiền thuế thuế 10%\</VatAmount10\>  
\<VatAmountNDeclared\>Tổng tiền thuế thuế KKKN\</VatAmountNDeclared\>  
\<VatAmountContractor\>Tổng tiền thuế thuế Khác\</VatAmountContractor\>  
\<Amount0\>Tổng tiền sau thuế thuế 0%\</Amount0\>  
\<Amount5\>Tổng tiền sau thuế thuế 5%\</Amount5\>  
\<Amount10\>Tổng tiền sau thuế thuế 10%\</Amount10\>  
\<AmountNDeclared\>Tổng tiền sau thuế thuế KKKN\</AmountNDeclared\>  
\<AmountOther\>Tổng tiền sau thuế thuế Khác\</AmountOther\>  
\<GrossValue8\>Tổng tiền trước thuế thuế 8%\</GrossValue8\>  
 	\<VatAmount8\>Tổng tiền thuế thuế 8%\</VatAmount8\>   
\<Amount8\>Tổng tiền sau thuế thuế 8%\</Amount8\>  
			\<AmountInWords\>Mười bảy đồng\</AmountInWords\>  
		\</Invoice\>  
	\</Inv\>  
\</Invoices\>

## 

3. ## Huỷ hoá đơn

   *Theo nghị định 70/2025/NĐ-CP:*  
- *Bãi bỏ khoản 10 điều 3 của ND123 về việc cho phép Huỷ hoá đơn điện tử đã lập có sai sót đã lưu trên hệ thống thuế theo mẫu 04/SS-HĐĐT*  
- *Sửa đổi, bổ sung Điều 19 về việc các hoá đơn điện tử đã lập có sai sót thực hiện Thay thế/điều chỉnh hoá đơn*  
* Nghiệp vụ EI thay đổi như sau:  
- Hoá đơn phát hành hợp lệ TCTCheckStatus \= 1:  
+ HSM: Huỷ thành công. EI thực hiện chuyển hướng sang api thay thế kèm phát hành luôn, đồng thời tạo luôn biên bản thay thế (biên bản này bên bán ký số luôn) (type  \= 1\) và hoá đơn gốc chuyển sang trạng thái Bị thay thế (status \= 3\)  
+ Token: Huỷ không thành công. Chặn huỷ hoá đơn  
- Hoá đơn điều chỉnh hợp lệ, hoá đơn thay thế hợp lệ: Huỷ không thành công, chặn huỷ hoá đơn  
- Hoá đơn phát hành đang kiểm tra TCTCheckStatus \= \-1: Huỷ không thành công do chưa có kết quả cơ quan thuế (luồng cũ)  
- Hoá đơn phát hành không hợp lệ TCTCheckStatus \= \-2: Huỷ thành công (luồng cũ)  
* API giữ nguyên cấu trúc hiện tại, *request example:*  
  {  
      "Ikey": "ei\_e860c264-6b31-424f-8b71-a039e4330c74",  
      "Pattern": "1C25MTT",  
      "Serial": ""  
  }


4. ## **Hoá đơn chiết khấu**

*Theo Nghị định 70, điều 19: “Trường hợp việc chiết khấu thương mại căn cứ vào số lượng, doanh số hàng hóa, dịch vụ thì số tiền chiết khấu của hàng hóa, dịch vụ đã bán được tính điều chỉnh trên hóa đơn bán hàng hóa, cung cấp dịch vụ của lần mua cuối cùng hoặc kỳ tiếp sau đảm bảo số tiền chiết khấu không vượt quá giá trị hàng hóa, dịch vụ ghi trên hóa đơn của lần mua cuối cùng hoặc kỳ tiếp sau hoặc được lập hóa đơn điều chỉnh kèm theo bảng kê các số hóa đơn cần điều chỉnh, số tiền, tiền thuế điều chỉnh. Bảng kê được lưu tại đơn vị và xuất trình khi cơ quan thuế hoặc cơ quan nhà nước có thẩm quyền yêu cầu. Căn cứ vào hóa đơn điều chỉnh, bên bán và bên mua kê khai điều chỉnh doanh thu mua, bán, thuế đầu ra, đầu vào tại kỳ lập hóa đơn điều chỉnh.”*

* Nghiệp vụ EI bổ sung như sau:  
- Trường hợp hoá đơn chỉ có hàng hoá tính chất chiết khấu (Product Feature \= 3\) hoặc số tiền chiết khấu vượt quá số tiền HHDV dẫn đến tổng tiền âm (Invoice Amount \< 0\) thì chặn không cho phép tạo hoá đơn thành công.   
- Trường hợp chiết khấu thương mại căn cứ vào số lượng, doanh thu HHDV thì số tiền chiết khấu của HHDV đã bán sẽ được lập theo 2 giải pháp:  
+ Lập hoá đơn mới cho phép nhập âm dòng hàng hoá dịch vụ, tổng tiền âm. Gửi lên CQT với tính chất hoá đơn là chiết khấu thương mại kèm theo bảng kê các số hoá đơn cần điều chỉnh, số tiền, tiền thuế điều chỉnh  
+ Lập hoá đơn mới và có dòng hàng hoá tính chất là chiết khấu (Feature \= 3\) (ghi số tiền dương) nhưng tổng tiền thành toán \= (tổng \- số tiền chiết khấu) không được âm   
* Bên tích hợp API cập nhật bổ sung như sau  
- Hoá đơn thông thường có Product Feature \= 3 hoặc Product có Feature \= 3 có giá trị lớn hơn Product có Feature \= 1 dẫn đến Invocie Amount âm thì sẽ chặn tạo hoá đơn  
- Tạo hoá đơn chiết khấu có Product **Feature \= 1** và Inovice **Amount \< 0** thì **bắt buộc nhập thông tin bảng kê** bao gồm Ngày bảng kê \- ListAttachDate và Số bảng kê \- ListAttachNum  
  \<ListAttachDate\>01/06/2025\</ListAttachDate\>  
              \<ListAttachNum\>1520254\</ListAttachNum\>  
- *Request example:*  
  {  
      "XmlData": "\<Invoices\>  
  	\<Inv\>  
  		\<Invoice\>  
  			\<Ikey\>123abd35bdso2e395\</Ikey\>  
  			\<CusCode\>\</CusCode\>  
  			\<Buyer\>\</Buyer\>   
  			\<CusName\>Nguyễn Văn A\</CusName\>  
  			\<Email\>\</Email\>    
  			\<EmailCC\>\</EmailCC\>  
              		\<CusEmails\>\</CusEmails\>  
              		\<CusAddress\>Hà Nội\</CusAddress\>         
  			\<CusBankName/\>  
  			\<CusBankNo/\>  
  			\<CusPhone/\>  
  			\<CusTaxCode\>\</CusTaxCode\>  
  			\<PaymentMethod\>TM\</PaymentMethod\>  
  			\<ArisingDate\>27/06/2025\</ArisingDate\>  
  			\<ExchangeRate\>1\</ExchangeRate\>  
  			\<CurrencyUnit\>\</CurrencyUnit\>  
              		\<ListAttachDate\>01/06/2025\</ListAttachDate\>  
              		\<ListAttachNum\>1520254\</ListAttachNum\>  
  			\<Products\>  
  				\<Product\>  
  					\<Code\>\</Code\>  
  					\<ProdName\>sp1\</ProdName\>  
  					\<ProdUnit\>Sản phẩm 1\</ProdUnit\>  
                      				\<Feature\>1\</Feature\>  
  					\<ProdQuantity\>1.0\</ProdQuantity\>  
  					\<ProdPrice\>1000\</ProdPrice\>  
  					\<Total\>1000\</Total\>  
  					\<VATRate\>-1\</VATRate\>  
  					\<VATRateOther\>0\</VATRateOther\>  
  					\<VATAmount\>0\</VATAmount\>  
  					\<Amount\>1000\</Amount\>  
  					\<Extra\>\</Extra\>  
  				\</Product\>     
  			\</Products\>  
  			\<Total\>1000\</Total\>  
  			\<VATRate\>0\</VATRate\>  
  			\<VATRateOther\>0\</VATRateOther\>  
  			\<VATAmount\>0\</VATAmount\>  
  			\<Amount\>-1000\</Amount\>  
  			\<GrossValue\>0\</GrossValue\>  
  			\<GrossValue0\>0\</GrossValue0\>  
  			\<GrossValue5\>0\</GrossValue5\>  
  			\<GrossValue10\>0\</GrossValue10\>  
  			\<GrossValueNDeclared\>0\</GrossValueNDeclared\>  
  			\<GrossValueContractor\>0\</GrossValueContractor\>  
  			\<VatAmount0\>0\</VatAmount0\>  
  			\<VatAmount5\>0\</VatAmount5\>  
  			\<VatAmount10\>0\</VatAmount10\>  
  			\<VatAmountNDeclared\>0\</VatAmountNDeclared\>  
  			\<VatAmountContractor\>0\</VatAmountContractor\>  
  			\<Amount0\>0\</Amount0\>  
  			\<Amount5\>0\</Amount5\>  
  			\<Amount10\>0\</Amount10\>  
  			\<AmountNDeclared\>0\</AmountNDeclared\>  
  			\<AmountOther\>0\</AmountOther\>  
  			\<GrossValue8\>0\</GrossValue8\>  
  			\<VatAmount8\>0\</VatAmount8\>  
  			\<Amount8\>0\</Amount8\>  
  			\<AmountInWords\>Một nghìn đồng\</AmountInWords\>  
              \<Extra\>\</Extra\>  
  		\</Invoice\>  
  	\</Inv\>  
  \</Invoices\>",  
    "Pattern": "1C25TMN",  
      "Serial": ""  
  }

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAATUAAABJCAYAAABciLEKAAAV2klEQVR4Xu2df6xkZ1nH1+7dudstobamlmK798ztCrrBENPEPyzaCtZoDGA0jUoQRKFK2zlztzXUKHgLKBLLzsytpVK0lBpCSNVIClZj/YFKkGhJAC3S2hpQtCmt292Zu4tt6V7fZ+a8M+983h/nnDln5t7ufT/JN+2+7/d93nfOe85z3/NjzuzZE3HST5P1Qbu5RfXbzdODVtKiPxKJ7FK2rrnoAJLELaeuTVbo2y5OtJOXMpG5JMmt3zp0AdtHIpFdRL+dPMDk4FbydaXfYvt5M+qXYwlLrei+yDiRSGSXwIQwi9QK6W8eu/HCcxi7KuynlNLmlxgvEonsAqxkUIPUSumj7KcsaoX2IcYtrTRpM24kEjmDUQf+MSsRzEkq0T2r9DaOwQfbzyrGjUQiZzBMAItUP20+p/77Lo5JGKQrP0P/rOq3Dh5m/EgkcgaiTs3+nQlgrDR5j9ITVvk8lTbfPR4b6wpKc/I9V02Vm587EomcoTAhaKlTxGvoFeRRiX67+ev01yXdz+nWoWXW5ekbv/+WcUITTm1c7YwdiUTOYJgYyiaAwY2r3678T7L9rBrHTZtXsS5PhPUyVnPskUjkDKOfNr9mHfiZ6C3LsZtWz1Vx/o1x86Tbu66njfnms1Y7k2c+/RGrXtRvr3y3OcZIJHKGwYN+cvAnf0VvVU60m78waCcPsy9K+/trq5ezzkRONcflKsmZsJ3WPJ6hi0QiOwge9Fr0zZN+uvLL/TR5Wvd9Mr30Ml3HcQ3WVqeSF5OZb4W2HZ8rEoksmIHnOthmK/kVercLlez+k+MTuchLaGr1+WeMH4k8X+i3m39o7s8nr7vkxfTsenjQa9G3nRxvHbqU4xuKK7Yt/ymn1tYbV/Yzvoul5eXjVcWYuxnOgxZ9ET+DNPkkt99wn16/YoneXYvaSA9xA+3UnY3jG0slttNPn9x6+r6OXecQ4/pQSWmrqhhzN8N5KDsfEf82lLfR0Ltr4caZbKTkn+jt9Trv6PW6W6KNjY0Xsn7e9NPVV3CcZXWydehixvXBBDWLGHM3w7nQoi/ih9subkcH3DC+DaSTmSnFt9i+3oUq4S2zvC4G7eSPOdaiYqw8mKBmEWPuZjgfs87LbobbTqufJkfp3ZX4Lr4PHN+/ZEIbqTN+lc8999yz166f8r7DjFcVx5iDYvsiMEHNIsbczXBOqszNbsb6OuPa6ivp2bVw5wrtZHaSGiaqL+v6brdzwq736jnl/wcz/iyosX6cY7eUNj/AdkVhghqr0Xj73kbjJ4qIMXcz1twE9rdImONHLj5/cKT5PSzf1YTebkuv4EhMW+vr6+M7LqybUU90u92fNPstyub1ycvV2G8YtFfW5FXfrJ8FK5ll2ru8fCW9kXy4n4X2t0ikNNyxxkqb49WXSafTeaWZgNRKa2DWOxJUZc3z2lwRmMxiUquGta/FpBapE+5YVXewXq/3MialenT0RvYl6PH20+bdrKsLJrM6k9ry8vIq4/qk+vtttg9y4MCLVLtNxqHU6fEHzWasN2X6CL3j+MvLN5s+7muhfY4eegft1Z9lnamtq/fsNeNpQm+VoddEfuOC/iLtnrr+YJN+l2RcbOuC7YqOQ6OOl19jO6fS5Ha2NVFx7rPaQP215g+w3dyQd/VzAMNBtJs9esuiEtG9dmKqJvYhcOxa9FWBB6lxsF5JbxkYr6j2nH127uMoKlE9wnYhmW1Z5/OZqP7+gF5fG85VaM7oMb0s8+nkkYu/g3EF+rROH7n4bHo19Gr5ng/bXDt4Eb1F1G8nv8FYJvSbotdEHfOfpT8kFcx6skEYtJNP0BuS+jzPMMZcYMda9FVFnT5eoJLSHzFJlRXjbrZWfpRjn8dn4EGqtV1JTaSaNxjPYB/9IamEdKfZWJW16NHyJVT6ptoAzlVozujRUgfJf7EsJMYV6DH0e/RqHN6R0ubr6BUsXwltrR/2zjG9pujVyHVmevPEGMKJ6178bfQV0UISGzvVom9edDqd67rdziNMXi4p76vZnuPWOpWuHqS3CjxIy0olv88zpqDKe/SWEeNp6MsT2wv0GHqaXsHh07qHXs5XaL+jZ1a5VlLq1KlLnxa9wvG3HjyPPp9fVjj0zCTPYxqWzxC9giQU+oqIcQR6TKnt/HmWTdevzO9JANXBzexw2Gna/Bq9i0IlrstVknuQCa3b7Vq/KRp6Cy69VXEcqKXkS2qK5czzzL7l5bewUgidRtIrnLV//+vp8/mXGo0bXOXCUmi15oAew2vd5OF8heaNnipibIEeLUlgljdN7qRPJNenHN7j9I397eZJfUq8dc1l++SmHD2mGFugp4pfpMb0mFw/U6eV7++nyf2+WPwSvaEbTB9/BN2U6asVdhTqUCWWT2bJpdyF6jmiNv4Jjj30GarAA7WsAkmtECqx3cWYIpXA3kCvKj9GXzaG99GbB2No0SenpPQM1Wg4/0ByvkLzRo8p1x9geirEf7Kolz6BnrHSpE+voBLbZyxvpsevPfwCy+/waZXxqhXcF+j3cXzt4CrbD2Okzb+gV/B9nVElzVofwB8Sulho+u644459XDWJTM92wXGP1Upa9FbFOlhLqmxSU/5XqXYfU//9wtLoLR9WzCzug2yrygf0aUk1/SFUm1OMMVSjMfUqKt9q0vSYWHPm2Pc09OT5Bfq0nmqvfCu9auXxYfpc8TfbKz/GepdPkNUOPT6vCb1aKvH8X1Ev+9hsJT/H+rE8p7Y+rPaO/gi9RdrMBDuYKHnY9KkE9jkmtJF6r5r2de4blXfuvvXW932XWTcv7LHPaWPtWUxSazQaL2G7ArKub6kE836HbyxV/7ts42Np//7vZ/tMz0357PqhTI8J5yw0d/Tk+QX6tDZbK99L79b6nrPoc8X3nSKqhPN20yfI9Tv6Rt5mcD+Qpw7YxjUWgfU+b+iX30xfEdheJL/ZS58J/bP2nQs78HVkJ7PxNa7x3SHWOXSv8tf6OwBqov6EYxepDfzX9NYBD1atqnc/BRXjXYxbRown0OOTSnB/z7aEbYx+x9fKWJfJu7Nz3nz7n0BPnl+gb6KVK+kV1H7zz7a3KXc0r9Ieqy6TGUdDz1itlR+i12R4fY1tPP2w3udlnc9XBLavIsauxGD4FSK7EzWB/0tvL7uWRpmrMdaF1O12vqlWeT9l9jEL1ti15vTLUI4DdpQUKiY11f4hxiwrxsx4IX1eNRrWtSMTy59JVoQhz1n79jkfcRCsectEn0BPnl+gbyJPUmsdusD2iiZnLnadfwz0jFVg/7TaePphvc/LOp+vCGxfRYxdCQbP60SdUv7ddGLqvmZS1/tOJq7y6nz26NGj55t95sGx532GqvCAHR/YFZKa3O1kPGggp4rDL8Srfhz1QzGuQYPegKZOJ4E3QUqlSl4/zXJd54PzFpo/evL8An0TuZOaYHsnfci3Elgu8j0gS5+W7yFgE7bRKuqjl3U+XxHYvooYe2bUJPwlg1ftxE5SlfWv7MOknzZ/kWMX5Z3bV4EHrFaVpMZYYzUaX6dXsHyZ6HNwlvKdZjtLnn4FuSZo+bO+fbEZw4RzF9oH6cnzC/RNFExq/2H7RUk6SJN77fLy/avj75foNZEXMLCNry/W+7ys8/mKwPZVxNgzw8BaKlH8D71FUSutzzgSUyWp01Trbo+GY9eSuzz01gUPWK15JDX6NPTl+V0sBe6k5sRyrtakgmUitV2s5wpNOHda9An05PkF+ibyJ7XjRy49ZPtFvp9wTD7EGBrbO27zCL0mg7T5QbvNSJbX4XF5WefzFYHtZ41TKxxMnYNaX18/SyW4jzJBzSrGF0JfCqa3TnjQGgfvlfQWhbG06Bty4MBF9AX9AZb2738FYxSJRe9QjcZXrLKcOALnLjSH9OT5Bfom8ic1wfxZxjyxrYn8xCP9Wk+2Dnlff0+vlutL7vSYMn1yd5b1k7j2oyIh2H4Sp/p3xWeiv9Z8MweTDegkvXWgEtzvqBXXaSaromI8Qe10j3P8WvTWCQ9arUUlNVXepy/kz4MxisRS9Sfp9+jjbEs4d6E5pCfPL9A3UU5SayWvtdu4xbaEfi11VuS8fqkSzFfpDfVFT8jPelNqPKfo96G8H2N7X58LgYPQ2vJ8C38eyHNsTF4+sa3AsY+VJk/QWyeOA7e81KqmaEzDdi7rKMM7YvS6IV1/PatV2TOM4Y0F6HeJbVxY85eJPoGePL9A30ThpCbYbWzJA7tsR9jG0lrzh8U3/MnHtLlp1RtibIGekF/Ffz09biUPZ9/dPOaNZbWZllp43PZUeyWR5//kx43UH4orzK+XMV4l2Hmok6NHj35ft9v9QZbXzW233fYClejeaSYzvnTShGMPfYY64YE7k0oktTIyYwpq9fhleopItfsRxiLy3jW2o9jGBecvNI/05PkF+ibKT2q+B2eL9Etm/RK5VmgVRa8pegV6iopxBHrKiLFmRt4PxeBDOb6HJhfpzSRz113rhX7wd96cSFffZI2/7g3lgQfuTEJS832fs6zMmALrC6nReJxxfFhtDanPdCv9Ljh/oXmkJ88v0DdRflI70V75ebvdlD7FNiEc7QuLsUzozWu3NeNbQxhHCHypPVf99upMr+l3wuAietSq6U6eBvpOBRcNxz7ZSCu1flvBBQ/emYSklsU9Yfkc2rdv38tZpuWIaXlCUis063ddQ7C9KXp9cA59+6NAT55foG+i/KQm2O3y+wyhTsk+wjghFXk8iW1M0WuiVn9/S39I/bXVyxlDOHFD8yX0FpHzSYthhVoi+15T7EO1+9RU8HbyL/QwmbmSGutE8gtSGxudqS8510k/Xf1VbhwteufB0uhRiEpSyeOLjKtZcie30/IaIcPjvFlgxjE4O+80VK2qrPfTFYFxjHEcoNcH5zA0l/Tk+QX6JtqepKaRh3UZT0vuRKoD/lq28cH2ZcfYbx08XOBUO/emjyBv3XC0nVba/IDShWw7ZNqcfKJMclOdX6MC/+mpGy69hHUCTz2Z1Lrdbo91bnWsFwNWwdpAhuiNzBcmMyOpRUoi7xxj2XaxtcAbhhY8qLXk9cb0zgITlEpk4zcLsK6EnpVXepv9lIGfVWszTd5Ib2RO7N9/CROZ1l78sEokUgoe2JRaja2zTRk6nc6PT5JRZ+qNno5kVVpqNfiA3PU044aQF+TxM2rRG5kbe5nI4iotUhs8sHNU6Jy4KLfccss5TFI1KPhdT8dnGqnCL65HirHUaKwzgVHm2zoikZmwDu6CqvMVuuqU9FZHcppZrt8gEOR9VvwcWvRG6ocJzKHa3zIc2YXw4C4r149EVEElpA8zSc0ixhXkjhDHr0VvpH4cSWxK9EciM8GDu4o2W0nuU+RlkZ+ym+U7n4wjcLxaKtl16I3Uz5L7URO5MfBueiORmeEBXlXyoN88kpvQ6x19k0pYTzOBUWq1l7Kt/EgGx6pFb2Q+yA+sMKEtOX7HMxKphDp9vI8Hea0q8MrhKvR6naPTSa1zNz2CNS5D9Ebmh05mjUbjMOsikdrgQT4PyZdxt/OBPI5nPK5W8lp6I5HI8xwe6PPUdiQ3eaiW49CiNxKJnAFsrV+xxIN9IUqThziWeWD1O+5/9WX0RiKRMwTrgF+k5pjczBfKUfQuml6vd3Wv170/u7lxE+tnQcdj+e23336eq3yRbHf/RLaJfCOF5UWo0nYnoq9Js7wutmX/e+zGC8/hQb9IyZfjOaY6YD/j/trN/6Z3UWxsbFw2fbe284D+/42NTqXt4EtqquxRKe90OqusWxTb3T+psk2qtN2J6P2P5WXI9uv7WS5s2/Ya+H6YeDG6g+Opiop5s6OfoehdJL4dSCW3Y1JeZdUmO5UrdiQSwrdPlmHH7nuDtHkjE8AipFZq3veDzQr7MHQzvYtCr9IkgbFO8O1c2V+54Xvo5a+erO5kSe/wOXcsX7mgY4uysQVPqyTpZuN0/lX2UbD/4WejR69mzZWssS0tvz49HNW7/0iEtokglwf0HxquoH1ts+0yLFf93iH/75onjXzmbJz3yyrG93l86DkbjXHjMtYLxrZ4NLAtfPud9TldXmOfGMusd8Uxke1bZozik/8Pbdsp5HXdBV74Vrs4jiqE3udO7yLRB5pvGe7aIXS5PsB8O07mc+48vnKhaGxhUj854IvuWKGYRfpnOf9tlGfXKTsPmAcbx6l9ZplGt5HENIrReS/qnW11O4esPwB6Xxip896Q14UxxptcY5z2yLaY9OfYFsFtiTLLq/8gmeMx611xNL4x+nwOFdpeQ/pp83NMCPMU+68CY2upZP0YvYvEN2EaX70u1zujTKT8u+jO4ysX2Kcvtl55mGUjn3vVSdhWU7R/hy+4rfS/fatj3Y9ZlpXr6z/DlbGLQNupeTLLTJ+vPCsrdJC62hN6AtvCGUvGwvIyXk1O3dQqU4/Rl3iLbNtcttYPN5gc5qK0+Tr2PQsqcX3Dip2J3kWjJ1dWOqwTfJPkKs/Kpg4A387jKxdKxB76XDJ9Pnw+VwxX//qveMgj/2asrNzVR2EvKdPWXda5h2Wjcvsz+eDqlvVVx5iVWzHKeDW+ukC5tR1c/brKSjNIk99koqhT7K8sz4fXC/kmwjhVepR1rjaeifftJM5yoURsy1cGX1tXXFf/unyU3Eana3b9qJyrLE8fzm3i8pIybV1letXrGaf1uUOYp9hmecltYZVl5cPPWWR1pL0sF3x1/nnMX6n7ymZGJbdPM2nUIfZThn7r0AWMV1fsOtETYV5X0xeJfRPkqsvKmHg8O4+7XCgRu9zFWcA+NEX7F7A6sZK/fh7KPL0KnHI5t4mOz4PKJK9tXplxU4Bjcn7uPHRiM8tKbgtrjIKRMIdj0jFdXr36dN2wkPauNjqe6/TT9Amufl1llTn+1oPnMXlUUT9N3sY+itBPm13GMkX/dsNTh7zJcdVnZUw8zp3HVy4UjS2YF3K1fDc9CPvQlOlfcPlNzAPPFH0S31Uu9LIEruVIAs62rr5cZYLc8eMYMzk/N2E7mRt6XPPl8vnGKNjt7QSqMX0od24vocoYXWW1Ia8bYiKZVYydhzrl3GQMU/JySLbZCYzuEg3v+BzzXWPTuCYvK1toUhOynVoevTgWWs0Q9qEp27/LTyTR6j8cvjGGtomgD17X/PjausbmKtNMVkKjX0zLxlvomc1s/8n+ONp3PjXGtij0uATJVpWS5IcrY/0YCX2CccZRaL/UGJ+l1BhdZbUjP2zSbze/wsRSRmrVdYpxXfTXmm9mW0oltK+yXSSyE9ErzFlP7yML4EQ7eSmTTBmp5Pjnx49cfL4ZU63K3klfSGbbSGQnka1+hisNLZ7mRnYo8oV1JptFiOOIRHYa+rRM/us77YrsYJ5qryR5179q0j+y70gkEpkbm+3kDY5EVIu28+0bkUgkknvnsrDS5AnGjkQikW1j89qVF6kE9yUrWeXoRDt5DWNFIpHIjkKtuu5l8oIePHbT6rlsF4lEIv8PxkrGZONuTqMAAAAASUVORK5CYII=>