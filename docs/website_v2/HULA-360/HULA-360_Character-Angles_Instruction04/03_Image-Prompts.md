# HULA 360 — Prompt tạo 12 ảnh tham chiếu

Các prompt dưới đây đã dùng để tạo bộ ảnh trong gói. Chúng là chỉ dẫn tạo ảnh, không phải code cho AI IDE. Kết quả tạo lại có thể khác; dùng PNG được bàn giao làm bản tham chiếu hiện tại. Một model 3D cuối cần được dựng thống nhất và kiểm lại bằng các góc render từ chính model.

Chuỗi tham chiếu: ảnh chính diện dùng `references/Identity-Original.png`; từng góc phụ dùng ảnh chính diện của chính nhân vật. Mỗi lần yêu cầu đúng một ảnh, một nhân vật, một góc; không ghép thành một sheet.

## CHAR-AN — CoAn

### Chính diện

Ảnh tham chiếu: `references/Identity-Original.png`.

```text
Use case: stylized-concept. Asset type: isolated single-character orthographic modeling reference for HULA 360, intended as visual reference for constructing one consistent 3D model, NOT itself a 3D asset.
The reference image is the identity/style authority. Recreate exactly the specified character, not the whole sheet. Gentle polished stylized 3D, soft fabric, clear recognizable facial features, correct anatomy. Portrait 2:3 high-resolution image. ONE figure, FULL BODY from top of head through shoes, centered with 10% clean margin, feet fully visible, character takes approximately 80% image height. Seamless pure white studio background, even neutral lighting, minimal subtle ground contact shadow only. No classroom, no props, no text, no labels, no watermark, no other people, no split panels.
Neutral symmetrical A-pose: standing straight, both arms 15 degrees away from torso, hands relaxed with anatomically correct five fingers, palms facing thighs, legs slightly apart, feet pointing straight ahead. No wave, no hands clasped, no bent knees. All views must depict this SAME pose and SAME identity/clothes. Orthographic camera with zero wide-angle distortion.
CHARACTER: ONLY Co An, the adult Vietnamese teacher from LEFT column of reference. Black hair in a low ponytail, same gentle oval face, turquoise SHORT-SLEEVE polo shirt with collar and three small buttons, beige straight trousers, white low indoor shoes. No jewelry, no bag, no extra accessory.
VIEW: EXACT FRONT / 0 degrees. Camera faces front squarely at chest height, centered, no three-quarter rotation, no head tilt. Both shoulders and ears symmetrical where hairstyle allows.
```

### Góc 3/4

Ảnh tham chiếu: `references/CoAn/CoAn_front.png`.

```text
Use case: identity-preserve. Generate a SEPARATE full-body modeling reference of the exact single character in the attached FRONT reference. Change ONLY viewing angle to a THREE-QUARTER view from the character's anatomical RIGHT, camera 45 degrees around from the front. The character's nose and feet point toward IMAGE LEFT; camera sees the character's RIGHT cheek and right side. Same neutral A-pose as reference, torso/head rotate together relative to camera, no separate head tilt or gaze toward camera. Preserve exact facial identity, age, hair shape, proportions, fabric colors, collar, sleeve length, pants, shoes and all accessories. For May preserve her green leaf hair clip on HER RIGHT side, visible on the near side; do not mirror to the opposite side. For An keep the black LOW ponytail visible behind neck. No new details or accessories.
ONE character only, complete head and shoes inside frame. Orthographic portrait 2:3, same scale and margins as reference, white studio background, soft even lighting, very light ground shadow. No perspective distortion, no pose change, no hands clasped, no props, no text, no labels, no watermark, no panels. This is a new angle of the SAME 3D-like character, not a redesign.
```

### Góc nghiêng

Ảnh tham chiếu: `references/CoAn/CoAn_front.png`.

```text
Use case: identity-preserve. Create one SEPARATE full-body STRICT SIDE PROFILE modeling reference of the SAME individual in the attached front image. Camera exactly side-on, approximately 90 degrees from front, nose points to IMAGE LEFT. Profile must show a single eye silhouette, no three-quarter view, do not turn head toward camera. Keep the same relaxed neutral A-pose: arms slightly away from sides, feet parallel, no motion. Torso/head face same direction.
Preserve the exact character identity, age, proportions, hair, palette, garment cut, short sleeve length, trousers and shoes from the reference. An has black low ponytail, turquoise short sleeve polo, beige trousers, white shoes. Linh has black shoulder-length hair, cream short sleeve collared blouse, light blue trousers, beige flat shoes. May has child proportions, small hands, bob hair and one fixed green leaf clip, yellow short sleeve tee, blue trousers with elastic hem and small white velcro shoes; do not change clip placement on her head. Only depict the ONE character actually supplied in the reference, not the other listed characters.
Full body and shoes uncropped, portrait 2:3, neutral orthographic projection, same generous margins and scale as front reference. Pure white seamless background, even neutral studio light, faint ground contact shadow. No labels/text/props/multiview panels/watermarks. No added pockets or changed shoes. For overlapping arms in true profile, keep anatomically natural occlusion rather than inventing extra limbs.
```

### Phía sau

Ảnh tham chiếu: `references/CoAn/CoAn_front.png`.

```text
Use case: identity-preserve. Create a SEPARATE EXACT REAR / BACK full-body modeling view of the SINGLE character in the provided FRONT reference image. Camera is directly behind, 180 degrees from frontal view. Do not show face, nose or eyes, no head turn. Full rear of head, clothing and shoes visible. Preserve exact same body proportions, age, neutral A-pose with both arms slightly away from torso, feet parallel and slight gap, outfit color/material/cut, short sleeves, hair and shoes.
Teacher An has low ponytail resting behind neck/upper back, turquoise short sleeve polo tucked into beige straight trousers, white shoes. Mother Linh has dark shoulder-length bob ending at shoulders, cream short sleeve blouse tucked into light blue trousers, beige flats. May is the child with chin-length dark bob and ONE small green leaf clip on HER RIGHT side; in exact rear view that means IMAGE RIGHT, only a small edge may be visible if naturally occluded by hair. May wears yellow short sleeve tee, elastic waist/hem blue trousers, small white velcro sneakers. Do not relocate the clip to center or add a second clip. Render ONLY the character actually in the input image; these descriptions clarify invariants, not additional people.
Portrait 2:3 orthographic, feet and head uncropped, same subject scale and generous white margins as input. White seamless studio background, neutral soft lighting, faint ground contact shadow, same polished stylized 3D materials. No text, labels, logos, watermarks, props or panels. Do not invent decorative prints or extra accessories. Preserve A-pose rather than holding hands behind back.
```

## CHAR-LINH — MeLinh

### Chính diện

Ảnh tham chiếu: `references/Identity-Original.png`.

```text
Use case: stylized-concept. Asset type: isolated single-character orthographic modeling reference for HULA 360, intended as visual reference for constructing one consistent 3D model, NOT itself a 3D asset.
The reference image is the identity/style authority. Recreate exactly the specified character, not the whole sheet. Gentle polished stylized 3D, soft fabric, clear recognizable facial features, correct anatomy. Portrait 2:3 high-resolution image. ONE figure, FULL BODY from top of head through shoes, centered with 10% clean margin, feet fully visible, character takes approximately 80% image height. Seamless pure white studio background, even neutral lighting, minimal subtle ground contact shadow only. No classroom, no props, no text, no labels, no watermark, no other people, no split panels.
Neutral symmetrical A-pose: standing straight, both arms 15 degrees away from torso, hands relaxed with anatomically correct five fingers, palms facing thighs, legs slightly apart, feet pointing straight ahead. No wave, no hands clasped, no bent knees. All views must depict this SAME pose and SAME identity/clothes. Orthographic camera with zero wide-angle distortion.
CHARACTER: ONLY Me Linh, the adult Vietnamese mother from MIDDLE column of reference. Same warm oval face, straight black shoulder-length bob with side part, CREAM SHORT-SLEEVE blouse with collar and small buttons, light powder-blue straight trousers, light beige closed flat shoes. No jewelry, no bag, no extra accessory.
VIEW: EXACT FRONT / 0 degrees. Camera faces front squarely at chest height, centered, no three-quarter rotation, no head tilt. Both shoulders and ears symmetrical where hairstyle allows.
```

### Góc 3/4

Ảnh tham chiếu: `references/MeLinh/MeLinh_front.png`.

```text
Use case: identity-preserve. Generate a SEPARATE full-body modeling reference of the exact single character in the attached FRONT reference. Change ONLY viewing angle to a THREE-QUARTER view from the character's anatomical RIGHT, camera 45 degrees around from the front. The character's nose and feet point toward IMAGE LEFT; camera sees the character's RIGHT cheek and right side. Same neutral A-pose as reference, torso/head rotate together relative to camera, no separate head tilt or gaze toward camera. Preserve exact facial identity, age, hair shape, proportions, fabric colors, collar, sleeve length, pants, shoes and all accessories. For May preserve her green leaf hair clip on HER RIGHT side, visible on the near side; do not mirror to the opposite side. For An keep the black LOW ponytail visible behind neck. No new details or accessories.
ONE character only, complete head and shoes inside frame. Orthographic portrait 2:3, same scale and margins as reference, white studio background, soft even lighting, very light ground shadow. No perspective distortion, no pose change, no hands clasped, no props, no text, no labels, no watermark, no panels. This is a new angle of the SAME 3D-like character, not a redesign.
```

### Góc nghiêng

Ảnh tham chiếu: `references/MeLinh/MeLinh_front.png`.

```text
Use case: identity-preserve. Create one SEPARATE full-body STRICT SIDE PROFILE modeling reference of the SAME individual in the attached front image. Camera exactly side-on, approximately 90 degrees from front, nose points to IMAGE LEFT. Profile must show a single eye silhouette, no three-quarter view, do not turn head toward camera. Keep the same relaxed neutral A-pose: arms slightly away from sides, feet parallel, no motion. Torso/head face same direction.
Preserve the exact character identity, age, proportions, hair, palette, garment cut, short sleeve length, trousers and shoes from the reference. An has black low ponytail, turquoise short sleeve polo, beige trousers, white shoes. Linh has black shoulder-length hair, cream short sleeve collared blouse, light blue trousers, beige flat shoes. May has child proportions, small hands, bob hair and one fixed green leaf clip, yellow short sleeve tee, blue trousers with elastic hem and small white velcro shoes; do not change clip placement on her head. Only depict the ONE character actually supplied in the reference, not the other listed characters.
Full body and shoes uncropped, portrait 2:3, neutral orthographic projection, same generous margins and scale as front reference. Pure white seamless background, even neutral studio light, faint ground contact shadow. No labels/text/props/multiview panels/watermarks. No added pockets or changed shoes. For overlapping arms in true profile, keep anatomically natural occlusion rather than inventing extra limbs.
```

### Phía sau

Ảnh tham chiếu: `references/MeLinh/MeLinh_front.png`.

```text
Use case: identity-preserve. Create a SEPARATE EXACT REAR / BACK full-body modeling view of the SINGLE character in the provided FRONT reference image. Camera is directly behind, 180 degrees from frontal view. Do not show face, nose or eyes, no head turn. Full rear of head, clothing and shoes visible. Preserve exact same body proportions, age, neutral A-pose with both arms slightly away from torso, feet parallel and slight gap, outfit color/material/cut, short sleeves, hair and shoes.
Teacher An has low ponytail resting behind neck/upper back, turquoise short sleeve polo tucked into beige straight trousers, white shoes. Mother Linh has dark shoulder-length bob ending at shoulders, cream short sleeve blouse tucked into light blue trousers, beige flats. May is the child with chin-length dark bob and ONE small green leaf clip on HER RIGHT side; in exact rear view that means IMAGE RIGHT, only a small edge may be visible if naturally occluded by hair. May wears yellow short sleeve tee, elastic waist/hem blue trousers, small white velcro sneakers. Do not relocate the clip to center or add a second clip. Render ONLY the character actually in the input image; these descriptions clarify invariants, not additional people.
Portrait 2:3 orthographic, feet and head uncropped, same subject scale and generous white margins as input. White seamless studio background, neutral soft lighting, faint ground contact shadow, same polished stylized 3D materials. No text, labels, logos, watermarks, props or panels. Do not invent decorative prints or extra accessories. Preserve A-pose rather than holding hands behind back.
```

## CHAR-MAY — BeMay

### Chính diện

Ảnh tham chiếu: `references/Identity-Original.png`.

```text
Use case: stylized-concept. Asset type: isolated single-character orthographic modeling reference for HULA 360, intended as visual reference for constructing one consistent 3D model, NOT itself a 3D asset.
The reference image is the identity/style authority. Recreate exactly the specified character, not the whole sheet. Gentle polished stylized 3D, soft fabric, clear recognizable facial features, correct anatomy. Portrait 2:3 high-resolution image. ONE figure, FULL BODY from top of head through shoes, centered with 10% clean margin, feet fully visible, character takes approximately 80% image height. Seamless pure white studio background, even neutral lighting, minimal subtle ground contact shadow only. No classroom, no props, no text, no labels, no watermark, no other people, no split panels.
Neutral symmetrical A-pose: standing straight, both arms 15 degrees away from torso, hands relaxed with anatomically correct five fingers, palms facing thighs, legs slightly apart, feet pointing straight ahead. No wave, no hands clasped, no bent knees. All views must depict this SAME pose and SAME identity/clothes. Orthographic camera with zero wide-angle distortion.
CHARACTER: ONLY May, the fictional FIVE-YEAR-OLD Vietnamese girl from RIGHT column of reference. Same youthful round face, black chin-length bob, small green LEAF hair clip FIXED on HER RIGHT side (appears viewer LEFT in frontal view), pale yellow SHORT-SLEEVE crew-neck t-shirt, muted powder-blue trousers, small white indoor sneakers. Fully clothed child with natural preschool body proportions, short limbs, small hands. Not a miniature adult. No bag.
VIEW: EXACT FRONT / 0 degrees. Camera faces front squarely at chest height, centered, no three-quarter rotation, no head tilt. Both shoulders and ears symmetrical where hairstyle allows.
```

### Góc 3/4

Ảnh tham chiếu: `references/BeMay/BeMay_front.png`.

```text
Use case: identity-preserve. Generate a SEPARATE full-body modeling reference of the exact single character in the attached FRONT reference. Change ONLY viewing angle to a THREE-QUARTER view from the character's anatomical RIGHT, camera 45 degrees around from the front. The character's nose and feet point toward IMAGE LEFT; camera sees the character's RIGHT cheek and right side. Same neutral A-pose as reference, torso/head rotate together relative to camera, no separate head tilt or gaze toward camera. Preserve exact facial identity, age, hair shape, proportions, fabric colors, collar, sleeve length, pants, shoes and all accessories. For May preserve her green leaf hair clip on HER RIGHT side, visible on the near side; do not mirror to the opposite side. For An keep the black LOW ponytail visible behind neck. No new details or accessories.
ONE character only, complete head and shoes inside frame. Orthographic portrait 2:3, same scale and margins as reference, white studio background, soft even lighting, very light ground shadow. No perspective distortion, no pose change, no hands clasped, no props, no text, no labels, no watermark, no panels. This is a new angle of the SAME 3D-like character, not a redesign.
```

### Góc nghiêng

Ảnh tham chiếu: `references/BeMay/BeMay_front.png`.

```text
Use case: identity-preserve. Create one SEPARATE full-body STRICT SIDE PROFILE modeling reference of the SAME individual in the attached front image. Camera exactly side-on, approximately 90 degrees from front, nose points to IMAGE LEFT. Profile must show a single eye silhouette, no three-quarter view, do not turn head toward camera. Keep the same relaxed neutral A-pose: arms slightly away from sides, feet parallel, no motion. Torso/head face same direction.
Preserve the exact character identity, age, proportions, hair, palette, garment cut, short sleeve length, trousers and shoes from the reference. An has black low ponytail, turquoise short sleeve polo, beige trousers, white shoes. Linh has black shoulder-length hair, cream short sleeve collared blouse, light blue trousers, beige flat shoes. May has child proportions, small hands, bob hair and one fixed green leaf clip, yellow short sleeve tee, blue trousers with elastic hem and small white velcro shoes; do not change clip placement on her head. Only depict the ONE character actually supplied in the reference, not the other listed characters.
Full body and shoes uncropped, portrait 2:3, neutral orthographic projection, same generous margins and scale as front reference. Pure white seamless background, even neutral studio light, faint ground contact shadow. No labels/text/props/multiview panels/watermarks. No added pockets or changed shoes. For overlapping arms in true profile, keep anatomically natural occlusion rather than inventing extra limbs.
```

### Phía sau

Ảnh tham chiếu: `references/BeMay/BeMay_front.png`.

```text
Use case: identity-preserve. Create a SEPARATE EXACT REAR / BACK full-body modeling view of the SINGLE character in the provided FRONT reference image. Camera is directly behind, 180 degrees from frontal view. Do not show face, nose or eyes, no head turn. Full rear of head, clothing and shoes visible. Preserve exact same body proportions, age, neutral A-pose with both arms slightly away from torso, feet parallel and slight gap, outfit color/material/cut, short sleeves, hair and shoes.
Teacher An has low ponytail resting behind neck/upper back, turquoise short sleeve polo tucked into beige straight trousers, white shoes. Mother Linh has dark shoulder-length bob ending at shoulders, cream short sleeve blouse tucked into light blue trousers, beige flats. May is the child with chin-length dark bob and ONE small green leaf clip on HER RIGHT side; in exact rear view that means IMAGE RIGHT, only a small edge may be visible if naturally occluded by hair. May wears yellow short sleeve tee, elastic waist/hem blue trousers, small white velcro sneakers. Do not relocate the clip to center or add a second clip. Render ONLY the character actually in the input image; these descriptions clarify invariants, not additional people.
Portrait 2:3 orthographic, feet and head uncropped, same subject scale and generous white margins as input. White seamless studio background, neutral soft lighting, faint ground contact shadow, same polished stylized 3D materials. No text, labels, logos, watermarks, props or panels. Do not invent decorative prints or extra accessories. Preserve A-pose rather than holding hands behind back.
```


