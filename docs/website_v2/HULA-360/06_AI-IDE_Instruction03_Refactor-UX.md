# HULA 360 — Instruction 03 cho AI IDE

**Mục tiêu:** sửa flow hiện có cho đúng, đẹp, dễ hiểu và mượt; chuẩn hóa nền CMS/API/viewer; giữ đích nhập vai ngôi thứ nhất đã duyệt.

Ngày: 08/09/2026 · Phiên bản 1.0. ChatGPT chỉ giao instruction; mọi code, chạy thử và tích hợp do AI IDE thực hiện.

## 0. Thứ tự ưu tiên và phạm vi

Đọc `00_Input-Code-Review.md` và `05_Flow-Audit_UX-Blueprint.md` trong gói. Instruction này cập nhật cách sửa kiến trúc hiện tại; ưu tiên nó khi instruction 01/02 trước đây gợi ý tạo demo mới hoặc cấu trúc không khớp repo. Giữ ba nhân vật, storyboard và mục tiêu POV từ gói trước.

Sửa trên hệ thống Hula hiện có; không tạo app showroom riêng chỉ để tránh xử lý CMS/API. Không viết lại cả website. Báo cáo đính kèm là đầu mối, không phải source of truth cho số dòng, lỗi hoặc framework version. Đọc code, chỉ dẫn repo và dữ liệu thật trước khi sửa.

Phạm vi lần triển khai này gồm đợt A và B trong blueprint: sửa flow, UI, config, loading, renderer theo loại asset, schema và CMS tối thiểu. Nếu đã có scene3d thì giữ và sửa qua cùng shell/controller; nếu chưa có thì chỉ ghi gate C còn lại và bàn giao nền sẵn sàng nối instruction 01/02. Không coi tour panorama là hoàn thành ngôi thứ nhất có tay.

Thực hiện công việc, chạy kiểm thử và bàn giao; không dừng ở một kế hoạch mới khi repo và quyền hiện có đủ dùng. Không tự phát hành public, mua dịch vụ hoặc gửi form thật trong nhiệm vụ review/refactor này.

## 1. Audit có giới hạn trước khi sửa

Tìm bằng tên file và symbol, không tin số dòng trong báo cáo. Map cần kiểm:

| File báo cáo | Phần cần xác minh |
|---|---|
| `hula-web/website/src/components/Classroom360Modal.tsx` | Props settings, data constants, renderer, controls, state, audio, sub-modals |
| `hula-web/website/src/components/FloatingActionWidgets.tsx` | Import/load modal, eligibility, z-index và va chạm widget khác |
| `hula-web/website/src/contexts/SettingsContext.tsx` | Fetch/parse/cache/defaults, dùng hidden_pages và enabled |
| `hula-web/cms/src/app/appearance/page.tsx` | Form, save/read config, preview, lỗi lưu, client directive |
| `src/public/public.controller.ts` | Các field settings được trả công khai, kiểu dữ liệu và cache |
| `src/system/system.service.ts` | Đọc/ghi config, route ghi thực tế, transaction/version nếu có |

Tìm thêm DTO, API client, guard, validator và consumers liên quan nếu có. Báo cáo nói 7 file nhưng bảng có 6; ghi map thật thay vì đoán một file thứ bảy.

Kiểm ba asset đang dùng: `classroom_wide.jpg`, `cubby_nap.jpg`, `mattress_macro.jpg` trong thư mục assets thực tế. Ghi kích thước, dung lượng, loại ảnh, đường nối, nguồn và vai trò. Ảnh 2:1 không tự được công nhận là panorama; ảnh cận không phải không gian 360.

Tái hiện tối thiểu: bật/tắt CMS; mở tour; đổi vai/bước; kéo khi auto-pan; mở/đóng cả ba inspector; lỗi một ảnh; đóng/mở lại tour. Ghi lỗi tái hiện được, không được hoặc chưa kiểm. Kiểm bundle/network thật thay vì chép số 98 KB source.

## 2. Config chuẩn: một nguồn quyết định, các điều kiện độc lập

### 2.1. Nguyên tắc

- Server là nguồn bật/tắt. Parse boolean string rõ ràng; chuỗi `false` không được coi là truthy.
- Client nhận cấu hình đã chuẩn hóa; widget không tự lặp lại phép parse hoặc đọc localStorage riêng.
- Một policy dùng chung tính eligibility từ enabled và điều kiện route. Bật toàn cục và ẩn theo route là hai điều kiện khác nhau, không phải tự động dư thừa.
- `hidden_pages` phải được kiểm semantics: route exclusions, feature IDs hay trộn legacy. Không đổi nghĩa/xóa mảng toàn hệ thống.
- localStorage chỉ có thể lưu sở thích như mute/tiến độ, không được bật lại feature bị server tắt.
- Trạng thái pending/invalid lần đầu: widget ẩn ổn định cho tới cấu hình hợp lệ; không bật thoáng qua rồi biến mất. Có thể dùng initial settings phía server nếu repo đã có, để tránh trễ UI.

### 2.2. Quy tắc đầu ra sau chuẩn hóa

| Server enabled | Route được phép | Cấu hình hợp lệ | Kết quả |
|---|---|---|---|
| false | Bất kỳ | Có | Ẩn, cache true không thay đổi kết quả |
| true | Không | Có | Ẩn trên route hiện tại |
| true | Có | Có | Hiện widget |
| Chưa có | Chưa biết | Đang tải | Chưa hiện, không mount renderer |
| Sai kiểu/schema | Bất kỳ | Không | Không kích hoạt cấu hình lỗi; hiển thị lỗi trong CMS/log phù hợp |

Revalidate cấu hình khi mở trải nghiệm hoặc theo cơ chế hiện có đã xác minh. Nếu nhận cấu hình server tắt khi tour đang mở, tạm dừng và thông báo trải nghiệm hiện không khả dụng, có nút đóng; không để timer/audio tiếp tục. Khi request thất bại, không tự suy ra enabled=true từ localStorage.

### 2.3. Chuyển đổi legacy an toàn

Trước sửa, lưu snapshot các key liên quan và xác định logic hiện tại. Nếu có legacy feature-hidden trùng với enabled, tạo adapter duy nhất trong giai đoạn chuyển tiếp. Khi hai giá trị mâu thuẫn, giữ hành vi ẩn theo điều kiện hạn chế hơn, ghi xung đột để CMS thể hiện; không tự bật tính năng đang ẩn.

Sau khi chuẩn hóa, CMS lưu một nguồn bật/tắt. Nếu vẫn phải ghi hai key để tương thích consumer cũ, thao tác ghi cần atomic/transaction hoặc cùng revision; chỉ cập nhật phần thuộc widget 360 và giữ nguyên các mục hidden khác. Không dùng hai request rời có thể để nửa trạng thái mới, nửa cũ. Dọn adapter sau khi xác nhận không còn consumer cũ; không xóa dữ liệu legacy tùy tiện.

Giữ route đọc public chỉ trả dữ liệu public cần thiết. Dùng đường ghi CMS đã xác thực hiện có; không chuyển thao tác ghi sang endpoint public để tiện nối form.

## 3. Chuẩn hóa data và đường từ CMS đến renderer

Tách nội dung constants thành seed data có schema/ID ổn định trước khi xây editor. Seed là fallback phiên bản rõ ràng, không fallback khác nhau ở ba component. Khi public API đã cung cấp tour, frontend dùng snapshot đã validate; không trộn phần seed cũ với nửa nội dung mới ngoài quy tắc được định nghĩa.

Các nhóm dữ liệu tối thiểu, tên cụ thể có thể theo convention repo:

| Nhóm | Nội dung cần có |
|---|---|
| Tour | ID, schemaVersion, contentVersion/revision, status, rendererMode, title, poster |
| Character | ID hiện có và map CHAR-AN/CHAR-LINH/CHAR-MAY, tên hiển thị, ảnh, intro, camera profile |
| Scene | ID, thời điểm, vị trí, loại renderer, asset refs, poster và fallback |
| Step | Stable ID, role, chapter/event, scene, lời dẫn, action, completionRule, next/skip, camera target |
| Hotspot | ID, scene, vị trí theo renderer, nội dung ref, roles, thứ tự keyboard |
| Asset | ID, type/projection, URL, size/dimensions nếu biết, revision, trạng thái kiểm tra |
| Product content | SKU nếu có nguồn, ảnh, specs, hướng dẫn, variant, link đã xác minh |
| Evidence | Nguồn quote/certification/claim, phạm vi sản phẩm, trạng thái duyệt |

Không tạo tất cả thành bảng DB mới chỉ để đạt một sơ đồ. Có thể dùng JSON document đã validate trong hạ tầng SystemConfig hiện có nếu phù hợp kích thước/cách dùng; public trả một published snapshot và CMS giữ draft. Tách endpoint tour nặng khỏi `/public/settings` nhẹ nếu cần để trang chủ không tải toàn bộ câu chuyện.

`widget_360_panorama_url` phải có mapping xác định. Nếu giữ trường legacy, ghi rõ nó là ảnh của scene classroom mặc định và chỉ áp dụng cho asset panorama hợp lệ. Không thay nó cho cubby và macro cùng lúc. Nếu chọn guided2d, cung cấp trường ảnh phù hợp loại đó; không âm thầm đổi loại field. Giá trị bị lỗi thì báo lỗi preview và giữ bản đã publish trước.

`macro` đang là StandpointId: migration đưa nội dung cận vào inspector, map các step cũ tham chiếu macro về scene vật lý trước đó cùng action mở cận. Không xóa ID trước khi remap và validate mọi reference.

## 4. Renderer theo khả năng thật

Hỗ trợ ranh giới ba mode: `guided2d`, `panorama360`, `scene3d`. Không bắt buộc viết cả ba từ đầu trong một lượt. Hoàn thiện mode tương ứng asset thật; thiết kế adapter để nối scene3d sau.

- Ảnh thường: guided2d, zoom/cận hợp lý, không tile ngang để giả đủ 360. Dùng nhãn “Xem ảnh lớp học” khi cần.
- Panorama chuẩn: renderer cầu/cubemap, camera/FOV phù hợp, hotspot theo phép chiếu camera. Dùng thư viện renderer có sẵn phù hợp dependency, tránh thêm hai engine cạnh tranh.
- Scene 3D đã có: dùng camera tại mắt và state vật thể; không hạ cấp thành ảnh khi refactor. Tính năng tay/hành động nếu chưa có phải ghi chưa triển khai.

Image ratio không chứng minh projection. CMS preview cần kiểm bằng viewer và hướng dẫn loại ảnh. Hotspot yaw/pitch từ flat panning cũ có thể không đúng sau đổi renderer; remap có kiểm hình, không mặc định giữ tọa độ là chính xác.

Với panorama, hotspot phía sau camera bị ẩn; xử lý wrap ±180°, resize, zoom và near-plane. Với 3D, dùng world anchor/raycast phù hợp; không giả dùng yaw/pitch cho vật thể di chuyển. Luôn có danh sách điểm khám phá bằng nút để dùng keyboard và thay thế khi marker ngoài tầm nhìn.

Cùng một panorama chụp từ cao độ người lớn không thành tầm mắt trẻ bằng cách crop/đổi pitch. Nếu chưa có panorama camera thấp, mô tả đó là hành trình nội dung của trẻ; chỉ bật trải nghiệm tầm mắt trẻ khi có scene3d hoặc panorama đúng điểm nhìn.

## 5. Tách component theo trách nhiệm

Giữ entry component tương thích nếu nhiều nơi import; chuyển nó thành shell điều phối. Các tên dưới đây là đề xuất trách nhiệm, không yêu cầu tạo đúng số file:

| Trách nhiệm | Ví dụ tên | Không nên chứa |
|---|---|---|
| Normalize config và policy route | tourConfig/eligibility | UI canvas, localStorage override |
| Fetch/validate content | tourRepository/contentSchema | Modal state |
| State nghiệp vụ | tourController/reducer | JSX dài, pixel camera per-frame |
| Renderer adapter | TourViewport | Nội dung marketing, API CMS |
| Chọn vai | CharacterSelection | Vòng lặp render |
| Nhiệm vụ/timeline | JourneyCard/Timeline | Quyền sở hữu ảnh/assets |
| Inspector hợp nhất | TourInspector | Backdrop thứ hai/thứ ba |
| Điều khiển | TourControls | Parse enabled |
| Media lifecycle | tourAudio/assetLoader | Tự tạo loop mỗi render |

Chọn reducer/state machine nhẹ phù hợp repo, không thêm thư viện state lớn nếu không cần. Mục tiêu là trạng thái hợp lệ và testable, không số LOC tối đa tùy ý.

## 6. Hợp nhất state và ưu tiên điều khiển

State tối thiểu phải phân biệt lifecycle (closed/loading/ready/error), role, step, exploration mode, current scene, inspector payload hoặc null, camera owner, transition, audio preference và checkpoint. Dùng một inspector payload thay vì nhiều boolean có thể mở đồng thời ba modal.

Quyền camera có chủ thể rõ: người dùng, chuyển bước, animation, hoặc khóa đọc inspector. Quy tắc:

| Tác động | Hành vi |
|---|---|
| Mở tour | Không auto-rotate, không âm thanh; load một cảnh cần dùng |
| Chọn vai | Nạp scene đầu, chỉ commit khi sẵn sàng; init camera một lần |
| Bấm Tiếp tục | Tới bước tiếp theo, camera chuyển có kiểm soát khi cần |
| Bắt đầu kéo | Hủy auto-pan ngay, quyền camera về người dùng |
| Thả kéo | Không tự resume auto-pan; giữ bước, hiện Về điểm hướng dẫn |
| Bấm Về điểm hướng dẫn | Quay hướng ngắn nhất hoặc fade khi góc lớn |
| Mở inspector | Dừng camera/action/audio lời dẫn đang cần pause; lưu focus và trạng thái |
| Đóng inspector | Về đúng bước/scene/hướng nhìn, không chạy lại toàn bộ animation |
| Bấm liên tiếp đổi cảnh | Hủy request cũ hoặc dùng generation token; request trả muộn không ghi đè cảnh mới |
| Đổi vai | Giữ cùng thời điểm chỉ khi có mapping/state thật; nếu không, replay có nhãn |
| Đóng tour/ẩn tab | Dừng frame/timer cần thiết; đóng phải cleanup instance hoàn toàn |

Không tăng step chỉ vì người dùng mở hotspot hoặc đọc bullet. Completion rule phân biệt action completed, content viewed và skipped. Progress hiển thị theo chương/ngữ cảnh, không cho người dùng hiểu đã thực hành gấp khi mới xem ảnh.

## 7. Flow UI bắt buộc

### 7.1. Widget và màn mở

Widget được bật theo policy duy nhất, tooltip là phụ, tên truy cập rõ. Mở shell tức thì và tải động module nặng khi cần. Dùng cơ chế lazy loading tương thích phiên bản Next đang cài; `ssr: false` không được áp dụng tùy tiện ở Server Component [R1]. Kiểm network cho thấy chỉ gọi dynamic import mà vẫn mount component ngay chưa đủ trì hoãn tải.

Màn mở gồm tên, mô tả một câu, ba thẻ vai. Bấm thẻ bắt đầu guided journey, không thêm nhiều màn onboarding. Nếu đang tải, nút/đóng vẫn phản hồi; hiển thị poster và thông báo thật, không phần trăm giả.

### 7.2. Trong lớp

Thanh trên ít nút: vai hiện tại, âm thanh nếu có, trợ giúp, đóng. Card nhiệm vụ chứa tiêu đề, lời dẫn ngắn và một hành động chính. Tránh để speech bubble che toàn bộ sản phẩm ở giữa màn hình. Timeline gọn; thông tin dài chỉ mở theo nhu cầu.

Free look giữ bước hiện tại và có nút trở lại. Không auto advance theo timer đọc. Cho skip khi hợp lý, nhưng state phải về mốc cuối hợp lệ. Không hiện CTA nhập vai hành động nếu mode hiện tại chỉ xem ảnh.

### 7.3. Inspector duy nhất

Hợp nhất hotspot detail, scenario action detail và material inspector vào một vùng nội dung trong tour shell. Desktop: panel phải 360–400 px; mobile: bottom sheet tối đa khoảng 60% chiều cao khả dụng, nội dung cuộn bên trong. Cảnh vẫn có ngữ cảnh và không nhận click xuyên qua vùng panel.

Một root dialog/focus manager. Inspector là subview bên trong, không tạo nhiều backdrop/focus trap cạnh tranh. Khi inspector mở, đưa focus vào tiêu đề/nút quay lại và giới hạn tương tác phù hợp; đóng trả về nút đã mở. Escape đóng panel trước nếu panel đang mở; khi ở scene Escape đóng tour, trả focus cho widget. Nút X toàn tour có nhãn riêng, không nhập nhằng với đóng panel.

Modal nền cần inert, scroll lock được khôi phục đúng, Tab không lọt ra trang sau [R2]. Fullscreen API nếu có là nút tùy chọn, theo dõi sự kiện thoát; không dùng `isFullscreen` để nhầm giữa phủ toàn viewport và fullscreen trình duyệt.

### 7.4. Visual và responsive

Áp dụng blueprint màu, spacing, kích thước đã đề xuất; ưu tiên reuse design tokens hiện có. Một primary color, panel sáng, chữ đậm đủ tương phản, vùng chạm 48 px; chế độ bé 56–64 px. Tối đa 3–4 hotspot nổi bật, còn lại trong danh sách. Tránh glow/shadow/vignette quá mạnh và icon không có nhãn.

Responsive tại 360×800, 390×844, 768×1024, 1024×768, 1440×900, portrait/landscape. Dùng dynamic viewport/safe area nếu phù hợp; không footer đè card, không nội dung tràn ngang hoặc bắt xoay máy. Tablet không phải desktop thu nhỏ. Zoom chữ hoặc nội dung dài vẫn có nút đóng/tiếp tục dùng được.

Trong canvas dùng hướng dẫn thao tác và nội dung semantic tương đương (danh sách hotspot, nhiệm vụ, hành động), không chỉ thêm aria-label rồi coi accessibility xong. Arrow/button camera chỉ hoạt động khi vùng scene nhận focus; không chặn phím điều hướng đang dùng để đọc panel.

## 8. Nội dung sản phẩm và màu

- Giữ thông tin thật có nguồn. Quote cần nguồn gốc và trường/người đúng; link được kiểm. Nhân vật AI không trở thành người chứng thực thật.
- Certifications/health claims thiếu bằng chứng: ẩn khỏi public cho đến khi xác nhận, không tự tạo số chứng nhận.
- “Elasticity simulator” nếu chỉ là hiệu ứng CSS phải bỏ tên/tác dụng mang tính đo lường. Có thể thay bằng ảnh cận hoặc animation “Minh họa cấu tạo” khi mô hình được duyệt; không suy ra độ đàn hồi, an toàn hoặc lợi ích sức khỏe.
- Colorway tint toàn scene phải bỏ. Nếu có mesh/material, đổi vật liệu đúng nhóm sản phẩm. Với panorama cần biến thể ảnh tương ứng; khi chưa có chỉ xem swatch/thẻ mẫu với nhãn rõ, không giả đổi nệm bằng phủ màu phòng.
- Số điện thoại lấy từ nguồn settings chuẩn. Nếu chuỗi chứa nhiều số, không biến cả chuỗi thành một tel URI; dùng số chính hợp lệ hoặc lựa chọn từng số theo cấu hình.
- Chế độ bé không có giá, quote thương mại, certifications, form mua hoặc CTA tư vấn; không tracking quảng cáo/session replay. Người lớn xem POV trẻ vẫn có thể mở lớp thông tin riêng khi chủ động rời chế độ bé.

## 9. Loading, rendering và âm thanh

Một asset loader có loading/ready/error cho mỗi tài nguyên, cache trong phiên, hủy hoặc bỏ qua request stale. Kiểm onload/decode/error; giữ scene cũ tới khi scene mới sẵn sàng. Retry rõ, không lặp vô hạn. Nếu scene lỗi, cho xem ảnh/tuyến nội dung đơn giản cùng vai và bước khi có dữ liệu phù hợp.

Chỉ preload cảnh tiếp theo sau cảnh đầu; không tải cả ba vai, mọi ảnh và toàn bộ engine trước khi mở. Cap độ phân giải/DPR theo chất lượng thiết bị đã đo; nếu asset lớn dùng variant/tile hợp lý. Không nâng mọi ảnh thành 4K theo mặc định.

Renderer loop không khởi động lại vì UI mở tab hoặc đổi subtitle. Dùng timestamp/delta time; rAF không đảm bảo 60 fps [R3]. Khi ảnh/camera bất động có thể render theo nhu cầu; scene3d chỉ chạy loop cần thiết. Đóng tour phải cancel rAF, cleanup listener, pointer capture, observer, texture/canvas/audio thuộc instance.

Âm thanh mặc định off. Nhạc chime hiện tại là background, không phải voice; đặt nhãn đúng. Không tạo AudioContext/timer mới sau mỗi render. Mute/close phải dừng tiếng ngay; reopen không chồng hai melody. Nếu context bị trình duyệt suspend, UI không báo đang phát sai. Chưa có voice thì dùng phụ đề, không gọi dịch vụ trả phí hoặc tự nhận đã có giọng nhân vật.

Người dùng chọn giảm chuyển động hoặc hệ điều hành prefers-reduced-motion: tắt auto-pan/rotate, giảm parallax và dùng chuyển trạng thái trực tiếp/fade nhẹ. Không reset lựa chọn này giữa các bước.

## 10. CMS tối thiểu và publish

Tách phần tour trong appearance thành component/editor phù hợp mà giữ entry hiện có nếu cần. Dọn duplicate use-client nếu source thật có, nhưng không dùng thay đổi này để báo hoàn thành UX.

Editor tối thiểu có: bật/tắt; thông tin widget; chọn renderer/asset đúng loại; nội dung vai và bước; scene/hotspot refs; preview và trạng thái save/publish. Tooltip/badge có giới hạn độ dài để không phá widget. Mỗi field có ví dụ/giải thích dễ hiểu cho người biên tập.

Kiểm schema phía server và client: ID duy nhất, step/scene/hotspot reference tồn tại, URL/asset hợp lệ, yaw/pitch hoặc anchor đúng renderer, không empty journey. Không lưu thành công giả khi API lỗi; không mất draft khi lỗi.

Preview dùng cùng renderer, schema và revision với website, có viewport mobile. Publish thay một snapshot hợp lệ có contentVersion; không để client nhận step version mới với asset version cũ. API công khai chỉ lấy bản published; key secrets và nội dung draft không đi kèm public settings.

Giai đoạn chuyển tiếp nếu chưa có editor tất cả field: giữ seed có version, làm editor tối thiểu cho các field đang công khai và báo phần quản trị chưa làm. Không chặn đợt A để xây CMS tổng quát. Không gọi việc chỉ đổi local constants là đã hoàn thành CMS-driven.

## 11. Lộ trình thực hiện có gate

### Đợt A — Sửa flow hiện tại

1. Audit source/settings/assets và baseline ngắn.
2. Chuẩn hóa config/eligibility và nối field được xác nhận; sửa nguồn liên hệ và claim chưa đủ cơ sở.
3. Tách shell/data/controller; lazy loading và loading/error/cleanup.
4. Camera ownership, free look, một inspector, responsive và accessibility.
5. Test A đạt rồi giữ mốc thay đổi có thể review/khôi phục.

### Đợt B — Nội dung và renderer

1. Schema/seed và mapping legacy, giữ tương thích.
2. Kiểm ảnh; dùng guided2d hoặc panorama360 đúng loại; remap hotspot.
3. CMS editor tối thiểu, preview/save/publish snapshot.
4. Test B và report asset nào còn thiếu để lên scene3d.

### Đợt C — Gate sản phẩm POV đã duyệt

Nếu đã có 3D, chạy regression khi A/B thay đổi. Nếu chưa có, chuẩn bị adapter/content contract và bàn giao cho instruction 01/02: model/rig/tay, state đồ, camera từng vai và replay sự kiện. Không viết lại logic config/inspector trong renderer mới. Duy trì nhãn khả năng thật của từng mode.

## 12. Ma trận nghiệm thu

| ID | Trường hợp | Bằng chứng pass |
|---|---|---|
| A01 | CMS tắt, localStorage cũ true, reload/mở lại | Widget không xuất hiện và engine không tải |
| A02 | Enabled true nhưng route bị ẩn | Route đó ẩn, route hợp lệ hiện; tính năng hidden khác không đổi |
| A03 | Setting false string, missing, invalid, request lỗi | Parse đúng, không bật nhầm hoặc crash |
| A04 | Cập nhật panorama URL hợp lệ/lỗi | Đúng scene thay sau save/publish; lỗi không thay snapshot tốt bằng canvas trắng |
| A05 | Mở tour rồi đóng ngay lúc ảnh đang tải | Request stale không mount lại; không render/audio chạy ngầm |
| A06 | Kéo lúc auto-pan, sau đó thả | Dừng auto-pan ngay, không tự giành lại camera |
| A07 | Đổi bước/cảnh liên tiếp khi mạng chậm | Cảnh cuối đúng lựa chọn mới nhất; không flash scene trả muộn |
| A08 | Mở lần lượt ba loại chi tiết, Escape/back/close | Chỉ một panel; focus và step/camera được giữ; đóng tour trả focus widget |
| A09 | Touch drag, wheel/zoom, keyboard, chữ dài | Không click nhầm/hotspot che nhau; UI dùng được ở các viewport |
| A10 | Nhạc on/off, ẩn tab, mở đóng 10 lần | Không tăng loop/listener/timer; không tiếng chồng |
| A11 | Lỗi ảnh/WebGL/context loss nếu dùng WebGL | Retry/fallback có nhãn và lối thoát, không spinner vô hạn |
| A12 | Reduced motion, không voice, keyboard-only | Hoàn thành được hành trình nội dung, không auto-rotate |
| B01 | Ảnh thường, macro, panorama chuẩn | Mỗi loại vào đúng mode; không wrap ảnh thường/macro thành 360 |
| B02 | Hotspot ở seam/phía sau, zoom và resize | Marker đúng vật thể, phía sau ẩn, danh sách vẫn truy cập được |
| B03 | CMS draft invalid/reference thiếu/save fail | Không publish lỗi, giữ draft và thông báo rõ |
| B04 | Publish mới khi client đang có bản cũ | Không trộn revision; session đang chạy pin revision hoặc chuyển bản ở mốc rõ |
| B05 | Đổi colorway và mở specs/quote/certification | Không tint phòng; chỉ nội dung/biến thể đúng nguồn |
| B06 | Chế độ cùng bé | Không UI thương mại, dữ liệu cá nhân hay session replay |
| C01 | POV cô/mẹ/bé trong scene3d | Camera/tay đúng vai, không phải crop cùng panorama |
| C02 | Nhận–trải–gấp–cất và đổi vai | Một state đồ vật, không nhân đôi, gián đoạn/replay hợp lệ |

A/B là nghiệm thu đợt nâng cấp hiện tại. C là gate riêng, đánh dấu chưa làm nếu thiếu triển khai; không cho pass C từ ảnh concept.

### Hiệu năng và thị giác

Ghi baseline và sau sửa trên cùng build production, cache/network/viewport. Đo bundle tải thực, thời gian tới shell/scene dùng được, frame time/fps lúc kéo và tài nguyên sau chuỗi mở đóng. Mục tiêu ban đầu: shell phản hồi rõ trong khoảng 150 ms khi main thread rảnh; chuyển động scene hướng tới 30 fps trên máy mục tiêu và 60 fps desktop phù hợp. Đây là budget thử nghiệm, không cam kết đã đạt.

Chụp màn chọn vai, nhiệm vụ, inspector, lỗi tải và chế độ bé ở desktop/mobile. Xem lại clipping, contrast, vùng chạm, backdrop và safe area. Giới hạn test mở rộng ở các rủi ro còn lại hoặc gate repo yêu cầu, không chạy kiểm thử vô hạn.

## 13. Rollout và báo cáo

Giữ snapshot config/content trước migration và khả năng khôi phục revision. Rollback config không được xóa hidden entries của tính năng khác; rollback code phải tương thích schema/version hoặc có adapter. Không để frontend mới phụ thuộc field backend chưa triển khai. Thứ tự an toàn: backend đọc tương thích → CMS publish đúng schema → client dùng schema; kiểm rollout thực tế của repo.

Báo cáo bàn giao phải gồm:

1. Lỗi nào trong báo cáo đã xác minh, bác bỏ hoặc chưa kiểm, kèm file/symbol thật.
2. File thay đổi và hành vi trước/sau, không chỉ số dòng tách ra.
3. Flow mới, mode hiện tại guided2d/panorama360/scene3d và các khả năng chưa có.
4. Ảnh từ bản chạy, cách mở, test A/B/C pass/fail/chưa làm, môi trường và số đo.
5. CMS field nào đã nối, migration/compatibility, cách khôi phục.
6. Asset/SKU/voice còn thiếu và bước tiếp theo để hoàn thành POV 3D.

Không ghi “mượt”, “60 fps”, “true 360”, “CMS-driven” hoặc “đã nhập vai” nếu chưa có bằng chứng tương ứng. Không cần hỏi lại các lựa chọn UI thông thường đã được đặc tả; hoàn thành phần khả thi và chỉ nêu blocker thực sự.

## 14. Nguồn kỹ thuật

- [R1 — Next.js Lazy Loading](https://nextjs.org/docs/app/guides/lazy-loading)
- [R2 — WAI-ARIA Dialog Modal Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [R3 — MDN requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame)
- [R4 — Three.js Panorama Example](https://threejs.org/examples/webgl_panorama_equirectangular.html)

Kiểm phiên bản thư viện của repo và tài liệu phù hợp trước khi triển khai. Các path trong báo cáo có thể khác môi trường AI IDE; dùng path repo thực tế trong báo cáo kết quả.
