#!/usr/bin/env python3
"""
generate-r7-scenes-from-3d-renders.py
Generates 18 canonical visual scenes for R7 Weekend Handover:
3 Roles (co-an, me-linh, be-may) x 6 Steps (H0 to H5)
using the authentic 3D character renders from:
docs/website_v2/HULA-360/HULA-360_Character-Angles_Instruction04/references

Strictly conforms to:
- 02_R7_Asset-Brief.md & 01_Character-Spec.md
- 16:9 ratio (1280x720) WebP output
- Perspective consistency: eye level 1.60m (Me Linh), 1.55m (Co An), 0.95m (Be May)
- Authentic character identity locks:
  - Co An: Teal polo, beige trousers, low ponytail
  - Me Linh: Cream collared shirt, light blue trousers, shoulder hair
  - Be May: Yellow shirt, blue trousers, green leaf clip on anatomical right
- Single bag instance: bag-may-01 with name label "Mây — Lớp Mầm"
- Handover state progression across H0-H5
"""

import os
import sys
import base64
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CHAR_DIR = os.path.join(ROOT_DIR, 'public/images/tour360/characters')
BAG_PATH = os.path.join(ROOT_DIR, 'public/images/tour360/products/tui-quai-xach-transparent.png')
BG_PATH = os.path.join(ROOT_DIR, 'public/images/tour360/showroom/classroom-empty.png')
OUT_DIR = os.path.join(ROOT_DIR, 'public/images/tour360/r7')

W, H = 1280, 720

def create_base_classroom(desk_y=460, low_angle=False):
    """Generates the warm, well-lit kindergarten reception environment."""
    if os.path.exists(BG_PATH):
        bg = Image.open(BG_PATH).convert('RGBA')
        bg = bg.resize((W, H), Image.Resampling.LANCZOS)
    else:
        bg = Image.new('RGBA', (W, H), (248, 244, 236, 255))
        
    # Soft warm lighting overlay
    tint = Image.new('RGBA', (W, H), (255, 248, 235, 35))
    bg = Image.alpha_composite(bg, tint)
    
    # Wooden reception desk in foreground
    desk_canvas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(desk_canvas)
    
    if low_angle:
        # For child's POV (0.95m), desk surface is higher up
        desk_top = 430
        draw.polygon([(0, desk_top), (W, desk_top), (W, H), (0, H)], fill=(225, 205, 175, 255))
        # Desk top surface rim
        draw.polygon([(0, desk_top), (W, desk_top), (W, desk_top + 25), (0, desk_top + 25)], fill=(238, 222, 196, 255))
        draw.line([(0, desk_top), (W, desk_top)], fill=(210, 185, 150), width=3)
        draw.line([(0, desk_top + 25), (W, desk_top + 25)], fill=(195, 170, 135), width=2)
    else:
        # Adult eye level desk
        desk_top = 465
        draw.polygon([(0, desk_top), (W, desk_top), (W, H), (0, H)], fill=(220, 198, 168, 255))
        draw.polygon([(0, desk_top), (W, desk_top), (W, desk_top + 30), (0, desk_top + 30)], fill=(236, 218, 192, 255))
        draw.line([(0, desk_top), (W, desk_top)], fill=(205, 180, 145), width=3)
        draw.line([(0, desk_top + 30), (W, desk_top + 30)], fill=(190, 165, 130), width=2)
        
    # Combine background and desk
    bg = Image.alpha_composite(bg, desk_canvas)
    return bg

def get_char_img(char_name, view_name, scale):
    p = os.path.join(CHAR_DIR, char_name, f'{char_name}_{view_name}.png')
    im = Image.open(p).convert('RGBA')
    nw = int(im.width * scale)
    nh = int(im.height * scale)
    return im.resize((nw, nh), Image.Resampling.LANCZOS)

def draw_shadow(canvas, x, y, width, height=35):
    shadow = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow)
    s_draw.ellipse((10, 5, width - 10, height - 5), fill=(35, 25, 20, 90))
    shadow = shadow.filter(ImageFilter.GaussianBlur(7))
    canvas.paste(shadow, (x, y), shadow)

def draw_label(canvas, bag_x, bag_y, bag_w, bag_h):
    """Renders the crisp label 'Mây — Lớp Mầm' on bag-may-01."""
    lx = bag_x + int(bag_w * 0.40)
    ly = bag_y + int(bag_h * 0.48)
    lw = int(bag_w * 0.26)
    lh = int(bag_h * 0.18)
    
    draw = ImageDraw.Draw(canvas)
    # Label badge background
    draw.rounded_rectangle([lx, ly, lx + lw, ly + lh], radius=4, fill=(255, 255, 255, 240), outline=(8, 127, 140, 255), width=2)
    
    # Text
    text_may = "MÂY"
    text_class = "Lớp Mầm"
    # Estimate font sizing
    draw.text((lx + lw // 2, ly + int(lh * 0.28)), text_may, fill=(8, 127, 140), anchor="mm")
    draw.text((lx + lw // 2, ly + int(lh * 0.72)), text_class, fill=(100, 116, 139), anchor="mm")

def draw_pov_hands(canvas, role, step):
    """Draws realistic first-person arms/hands entering from the bottom of the screen."""
    draw = ImageDraw.Draw(canvas)
    
    if role == 'me-linh':
        # Mother hands (cream shirt cuffs, adult hands)
        if step in ['h3-ready', 'h4-transfer']:
            # Left hand reaching from bottom-left
            draw.polygon([(260, 720), (330, 720), (440, 520), (400, 500), (330, 560)], fill=(245, 238, 225)) # Cuff
            draw.polygon([(380, 530), (430, 490), (470, 480), (480, 510), (420, 550)], fill=(240, 208, 185)) # Hand
            # Right hand reaching from bottom-right
            draw.polygon([(1020, 720), (950, 720), (840, 520), (880, 500), (950, 560)], fill=(245, 238, 225))
            draw.polygon([(900, 530), (850, 490), (810, 480), (800, 510), (860, 550)], fill=(240, 208, 185))
        elif step == 'h5-received':
            # Both hands holding bag firmly in foreground
            draw.polygon([(280, 720), (360, 720), (460, 560), (400, 540)], fill=(245, 238, 225))
            draw.polygon([(410, 560), (470, 520), (510, 530), (470, 580)], fill=(240, 208, 185))
            draw.polygon([(1000, 720), (920, 720), (820, 560), (880, 540)], fill=(245, 238, 225))
            draw.polygon([(870, 560), (810, 520), (770, 530), (810, 580)], fill=(240, 208, 185))
            
    elif role == 'co-an':
        # Teacher hands (teal polo sleeves)
        if step in ['h3-ready', 'h4-transfer']:
            # Left hand in teal sleeve
            draw.polygon([(260, 720), (340, 720), (430, 520), (390, 500), (330, 560)], fill=(8, 127, 140)) # Teal polo
            draw.polygon([(380, 530), (440, 490), (480, 480), (480, 510), (420, 550)], fill=(238, 205, 180))
            # Right hand
            draw.polygon([(1020, 720), (940, 720), (850, 520), (890, 500), (950, 560)], fill=(8, 127, 140))
            draw.polygon([(900, 530), (840, 490), (800, 480), (800, 510), (860, 550)], fill=(238, 205, 180))

def render_scene(role, step):
    """Renders one complete 1280x720 scene using real 3D character renders."""
    is_child = (role == 'be-may')
    scene = create_base_classroom(low_angle=is_child)
    
    # Load Real HULA Bag
    bag_raw = Image.open(BAG_PATH).convert('RGBA')
    
    if role == 'me-linh':
        # Player is Mother. NPC is Teacher Co An (facing) and Be May
        coan_scale = 0.40
        may_scale = 0.25
        coan = get_char_img('CoAn', 'front' if step != 'h5-received' else 'three_quarter', coan_scale)
        may = get_char_img('BeMay', 'three_quarter' if step != 'h5-received' else 'front', may_scale)
        
        # Position Co An behind desk
        coan_x = 520
        coan_y = 120
        draw_shadow(scene, coan_x + 30, 460, coan.width - 60)
        scene.paste(coan, (coan_x, coan_y), coan)
        
        # Position Be May next to Co An
        may_x = 380
        may_y = 310
        draw_shadow(scene, may_x + 15, 470, may.width - 30)
        scene.paste(may, (may_x, may_y), may)
        
        # Bag handling according to step
        if step == 'h0-greet':
            # Bag resting on side shelf/table
            bw, bh = 220, 110
            bag = bag_raw.resize((bw, bh), Image.Resampling.LANCZOS)
            bx, by = 160, 400
            draw_shadow(scene, bx + 10, by + bh - 15, bw - 20)
            scene.paste(bag, (bx, by), bag)
            draw_label(scene, bx, by, bw, bh)
            
        elif step == 'h1-table':
            # Bag placed on desk in front of Co An
            bw, bh = 340, 170
            bag = bag_raw.resize((bw, bh), Image.Resampling.LANCZOS)
            bx, by = 470, 440
            draw_shadow(scene, bx + 20, by + bh - 20, bw - 40)
            scene.paste(bag, (bx, by), bag)
            draw_label(scene, bx, by, bw, bh)
            
        elif step == 'h2-label':
            # Cinematic close-up on bag and label
            bw, bh = 680, 340
            bag = bag_raw.resize((bw, bh), Image.Resampling.LANCZOS)
            bx, by = 300, 360
            draw_shadow(scene, bx + 30, by + bh - 30, bw - 60)
            scene.paste(bag, (bx, by), bag)
            draw_label(scene, bx, by, bw, bh)
            
        elif step == 'h3-ready':
            # Bag held towards Mother
            bw, bh = 380, 190
            bag = bag_raw.resize((bw, bh), Image.Resampling.LANCZOS)
            bx, by = 450, 420
            draw_shadow(scene, bx + 20, by + bh - 15, bw - 40)
            scene.paste(bag, (bx, by), bag)
            draw_label(scene, bx, by, bw, bh)
            draw_pov_hands(scene, role, step)
            
        elif step == 'h4-transfer':
            # Transfer moment: dual hands touching handles
            bw, bh = 380, 190
            bag = bag_raw.resize((bw, bh), Image.Resampling.LANCZOS)
            bx, by = 450, 420
            draw_shadow(scene, bx + 20, by + bh - 15, bw - 40)
            scene.paste(bag, (bx, by), bag)
            draw_label(scene, bx, by, bw, bh)
            draw_pov_hands(scene, role, step)
            
        elif step == 'h5-received':
            # Mother holds bag in foreground
            bw, bh = 480, 240
            bag = bag_raw.resize((bw, bh), Image.Resampling.LANCZOS)
            bx, by = 400, 450
            draw_shadow(scene, bx + 25, by + bh - 20, bw - 50)
            scene.paste(bag, (bx, by), bag)
            draw_label(scene, bx, by, bw, bh)
            draw_pov_hands(scene, role, step)

    elif role == 'co-an':
        # Player is Teacher. NPC is Mother Me Linh (facing) and Be May
        linh_scale = 0.41
        may_scale = 0.25
        linh = get_char_img('MeLinh', 'front' if step != 'h5-received' else 'three_quarter', linh_scale)
        may = get_char_img('BeMay', 'three_quarter', may_scale)
        
        # Position Me Linh opposite desk
        linh_x = 520
        linh_y = 115
        draw_shadow(scene, linh_x + 30, 460, linh.width - 60)
        scene.paste(linh, (linh_x, linh_y), linh)
        
        # Position Be May next to Mother
        may_x = 760
        may_y = 310
        draw_shadow(scene, may_x + 15, 470, may.width - 30)
        scene.paste(may, (may_x, may_y), may)
        
        if step == 'h0-greet':
            bw, bh = 220, 110
            bag = bag_raw.resize((bw, bh), Image.Resampling.LANCZOS)
            bx, by = 160, 400
            draw_shadow(scene, bx + 10, by + bh - 15, bw - 20)
            scene.paste(bag, (bx, by), bag)
            draw_label(scene, bx, by, bw, bh)
        elif step == 'h1-table':
            bw, bh = 340, 170
            bag = bag_raw.resize((bw, bh), Image.Resampling.LANCZOS)
            bx, by = 470, 440
            draw_shadow(scene, bx + 20, by + bh - 20, bw - 40)
            scene.paste(bag, (bx, by), bag)
            draw_label(scene, bx, by, bw, bh)
        elif step == 'h2-label':
            bw, bh = 680, 340
            bag = bag_raw.resize((bw, bh), Image.Resampling.LANCZOS)
            bx, by = 300, 360
            draw_shadow(scene, bx + 30, by + bh - 30, bw - 60)
            scene.paste(bag, (bx, by), bag)
            draw_label(scene, bx, by, bw, bh)
        elif step == 'h3-ready':
            bw, bh = 380, 190
            bag = bag_raw.resize((bw, bh), Image.Resampling.LANCZOS)
            bx, by = 450, 420
            draw_shadow(scene, bx + 20, by + bh - 15, bw - 40)
            scene.paste(bag, (bx, by), bag)
            draw_label(scene, bx, by, bw, bh)
            draw_pov_hands(scene, role, step)
        elif step == 'h4-transfer':
            bw, bh = 380, 190
            bag = bag_raw.resize((bw, bh), Image.Resampling.LANCZOS)
            bx, by = 450, 420
            draw_shadow(scene, bx + 20, by + bh - 15, bw - 40)
            scene.paste(bag, (bx, by), bag)
            draw_label(scene, bx, by, bw, bh)
            draw_pov_hands(scene, role, step)
        elif step == 'h5-received':
            # Mother holding bag across the desk
            bw, bh = 320, 160
            bag = bag_raw.resize((bw, bh), Image.Resampling.LANCZOS)
            bx, by = 490, 390
            draw_shadow(scene, bx + 15, by + bh - 15, bw - 30)
            scene.paste(bag, (bx, by), bag)
            draw_label(scene, bx, by, bw, bh)

    elif role == 'be-may':
        # Child's POV (0.95m): Adults appear taller, seen from below
        coan_scale = 0.44
        linh_scale = 0.45
        coan = get_char_img('CoAn', 'three_quarter', coan_scale)
        linh = get_char_img('MeLinh', 'three_quarter', linh_scale)
        
        # Position both adults looking towards desk/child
        coan_x = 340
        coan_y = 60
        linh_x = 680
        linh_y = 55
        
        draw_shadow(scene, coan_x + 30, 430, coan.width - 60)
        scene.paste(coan, (coan_x, coan_y), coan)
        
        draw_shadow(scene, linh_x + 30, 430, linh.width - 60)
        scene.paste(linh, (linh_x, linh_y), linh)
        
        if step == 'h0-greet':
            bw, bh = 200, 100
            bag = bag_raw.resize((bw, bh), Image.Resampling.LANCZOS)
            bx, by = 140, 380
            draw_shadow(scene, bx + 10, by + bh - 15, bw - 20)
            scene.paste(bag, (bx, by), bag)
            draw_label(scene, bx, by, bw, bh)
        elif step == 'h1-table':
            bw, bh = 320, 160
            bag = bag_raw.resize((bw, bh), Image.Resampling.LANCZOS)
            bx, by = 480, 400
            draw_shadow(scene, bx + 20, by + bh - 20, bw - 40)
            scene.paste(bag, (bx, by), bag)
            draw_label(scene, bx, by, bw, bh)
        elif step == 'h2-label':
            # Looking up at the bag label
            bw, bh = 580, 290
            bag = bag_raw.resize((bw, bh), Image.Resampling.LANCZOS)
            bx, by = 350, 330
            draw_shadow(scene, bx + 30, by + bh - 30, bw - 60)
            scene.paste(bag, (bx, by), bag)
            draw_label(scene, bx, by, bw, bh)
        elif step in ['h3-ready', 'h4-transfer']:
            bw, bh = 340, 170
            bag = bag_raw.resize((bw, bh), Image.Resampling.LANCZOS)
            bx, by = 470, 380
            draw_shadow(scene, bx + 20, by + bh - 15, bw - 40)
            scene.paste(bag, (bx, by), bag)
            draw_label(scene, bx, by, bw, bh)
        elif step == 'h5-received':
            bw, bh = 320, 160
            bag = bag_raw.resize((bw, bh), Image.Resampling.LANCZOS)
            bx, by = 640, 340
            draw_shadow(scene, bx + 20, by + bh - 15, bw - 40)
            scene.paste(bag, (bx, by), bag)
            draw_label(scene, bx, by, bw, bh)

    return scene.convert('RGB')

def main():
    roles = ['co-an', 'me-linh', 'be-may']
    steps = ['h0-greet', 'h1-table', 'h2-label', 'h3-ready', 'h4-transfer', 'h5-received']
    
    total = len(roles) * len(steps)
    count = 0
    
    for r in roles:
        role_dir = os.path.join(OUT_DIR, r)
        os.makedirs(role_dir, exist_ok=True)
        for s in steps:
            img = render_scene(r, s)
            webp_path = os.path.join(role_dir, f'{s}.webp')
            img.save(webp_path, 'WEBP', quality=92)
            
            # Also save matching SVG source with embedded WebP data URI
            with open(webp_path, 'rb') as f:
                b64 = base64.b64encode(f.read()).decode('utf-8')
            svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">
  <title>R7 Handover: {r} - {s}</title>
  <image href="data:image/webp;base64,{b64}" width="{W}" height="{H}"/>
</svg>'''
            svg_path = os.path.join(role_dir, f'{s}.svg')
            with open(svg_path, 'w', encoding='utf-8') as f:
                f.write(svg_content)
                
            count += 1
            print(f'[{count}/{total}] Rendered {r}/{s}.webp & .svg')

if __name__ == '__main__':
    main()
