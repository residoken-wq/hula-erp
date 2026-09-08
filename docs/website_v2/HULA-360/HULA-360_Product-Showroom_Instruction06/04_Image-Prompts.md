# Prompt tạo ảnh tham khảo

Hai ảnh được tạo bằng AI, dùng để thống nhất hướng không gian và tạo handoff cho IDE. Chưa phải asset 360/GLB hoặc bản sao sản phẩm được đo đạc. Không thay ảnh catalogue gốc bằng ảnh dựng để chứng minh quy cách hàng thật.

## 1. Cảnh có sản phẩm

Create a premium photorealistic architectural product visualization for HULA preschool bedding, landscape 1536x1024. The two provided catalogue pages are PRODUCT SHAPE AND COLOR REFERENCES ONLY. A bright, inviting, entirely unoccupied Vietnamese contemporary preschool nap classroom, pale warm ivory walls, light oak floor and low cubby shelving on right, broad tall windows along left admitting soft diffuse daylight, green garden outside, restrained child-scale wooden chairs and table in far rear. Architectural perspective from entrance at adult eye height with slight downward view, looking diagonally into classroom, generous uncluttered negative space. Arrange exactly six separate HULA Cotton Cara standard nap bedding sets neatly in two columns and three rows on the floor with generous aisles. Match the reference product faithfully: each a very THIN flat rectangular quilted soft fabric mat 120x63cm proportions, distinct small rectangular matching pillow at head, a matching thin coverlet neatly lying flat over lower mat with straight folded horizontal top edge. Soft light cyan blue fabric matching the blue reference, narrow GRAY piping, gently irregular rounded geometric stitched quilting, subtle wrinkles, realistic cotton, not thick foam not fluffy duvets, no bed frames. Foreground mat fully visible, avoid cropping hero product. All six sets same light blue color, with some neatly folded matching light-blue gray-trimmed bedding in cubbies. No logos or placeholder text, no embroidery brands or flowers, no rug. Absolutely no people, children, adults, dolls, portraits, faces, limbs, hands or human pictures anywhere, no UI, no buttons, no website screenshot, no text. Restrained refined editorial product photography, believable scale, softly lit neutral white balance, no orange color cast, high material fidelity. This is a reference reconstruction, not a catalogue page. Output one image only.

Inputs: references/NEM_MN_-_01.jpg và references/NEM_MN_-_03.jpg. Output: assets/classroom-products-concept.png.

## 2. Phòng trống

Edit this exact classroom image into an EMPTY ROOM BACKGROUND PLATE for a bedding configurator. Keep the exact camera position, framing, perspective, image dimensions, architectural geometry, window frames, garden, warm ivory walls, oak flooring, door, cubbies, furniture, plants, children's sun/rainbow/tree drawings and sunlight pattern. REMOVE all six blue bedding sets entirely from the floor, including every mat, pillow, blanket, gray edging and their contact shadows, and seamlessly reconstruct the continuous clean oak plank floor at those locations. Also REMOVE all blue folded bedding from shelves, leaving those shelf compartments empty. Keep books and storage baskets. Do not add any new objects. Absolutely no people, children, adults, dolls, portraits, faces, hands or silhouettes, and no bedding anywhere. No UI, text or watermark. This is the clean room only, same architectural scene.

Input: ảnh cảnh có sản phẩm ở trên. Output: assets/classroom-empty.png.

## 3. Cách sử dụng tiếp

Không yêu cầu AI tạo lại cả phòng mỗi lần chọn màu. Dùng ảnh có nệm làm mẫu nhìn; phòng trống làm tham chiếu dựng kiến trúc. Cần geometry/material hoặc layer/mask riêng cho sản phẩm để triển khai đổi màu đúng. Camera của hai ảnh gần tương ứng nhưng không bảo đảm đăng ký khớp từng pixel.
