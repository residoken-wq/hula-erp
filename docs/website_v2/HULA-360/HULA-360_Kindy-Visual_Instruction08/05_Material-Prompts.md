# Prompt vật liệu

Tạo bằng công cụ tạo ảnh tích hợp, không dùng CLI. Kích thước nhận thực tế 1254×1254 cho mỗi ảnh, dù prompt yêu cầu 2048. Không upscale rồi nhận là chi tiết2K thật. Hai ảnh là base-color candidates; cần kiểm lặp, tỷ lệ và vật liệu trong engine.

## Sàn gỗ sáng

Use case: product-mockup. Asset type: a square 2048x2048 color texture candidate for a real-time 3D preschool classroom floor. Generate a new clean texture inspired by the light blond wood flooring visible in the reference photo, NOT a photograph of the room. Strict orthographic top-down surface scan aesthetic, frame filled edge to edge with pale natural honey-blond oak laminate planks, subtle realistic fine wood grain with very few small knots, staggered plank end joints, narrow subtle seams. Approximately eight plank rows across the square, consistent row widths; plank lengths varied with staggered ends. Grain follows plank length horizontally. Flat diffuse evenly lit BASE COLOR / ALBEDO appearance, restrained natural tonal variation, no directional illumination, no cast shadows, no specular highlights, no perspective, no objects, no walls, no bedding, no text, no logos, no watermark. Seamless repeating texture intent: matching left/right and top/bottom boundaries; avoid a dark border or vignetting. The reference image is only to match the light wood tone and grain character. Do not reproduce its logos or room objects. Output one texture image only.

Input: references/kindy/kindy-02.jpg, chỉ tham khảo tông/vân. Output: assets/materials/wood-light-basecolor-candidate.png.

## Vải trung tính

Use case: product-mockup. Asset type: a square 2048x2048 neutral cotton fabric base-color texture candidate for recolorable 3D HULA bedding. Generate a subtle clean natural off-white / very light neutral gray tightly woven plain cotton textile surface viewed precisely orthographic perpendicular from above at uniform macro scale. Tiny believable warp and weft thread irregularity, restrained fine detail, soft dry cotton, no satin gloss, no coarse burlap, no large weave grid. The whole image is one uniform seamless repeating surface with matching opposing edges. Uniform diffuse illumination, flat ALBEDO only, no gradients, no directional shadows, no specular reflections, no folds, no wrinkles, no quilt stitching, no seams, no borders, no logos, no text, no colored pattern, no objects. Keep low contrast so changing the 3D fabric material color remains reliable. Do not create a normal map or height map. Output one texture image only.

Không có ảnh đầu vào. Output: assets/materials/cotton-neutral-basecolor-candidate.png. Không phải scan Cotton Cara/Satin chính thức, không chứa họa tiết chần sản phẩm.
