#!/usr/bin/env python3
"""
extract_real_photos.py
Extracts the 6 real Cotton Cara colorway photos from catalogue NEM_MN_-_03.jpg
strictly according to catalogue-photo-regions.json coordinates.
Also copies catalogue pages and project reference photos (Sright & KIS)
into the public directory: website/public/images/tour360/real-photos/
"""

import os
import sys
import json
import shutil
from PIL import Image

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
INSTRUCTION09_DIR = os.path.join(PROJECT_ROOT, "docs", "website_v2", "HULA-360", "HULA_Product-Photos_Instruction09")
PUBLIC_TARGET_DIR = os.path.join(PROJECT_ROOT, "hula-web", "website", "public", "images", "tour360", "real-photos")

def main():
    print(f"Project root: {PROJECT_ROOT}")
    print(f"Source dir: {INSTRUCTION09_DIR}")
    print(f"Target dir: {PUBLIC_TARGET_DIR}")

    if not os.path.exists(INSTRUCTION09_DIR):
        print(f"Error: Source directory {INSTRUCTION09_DIR} does not exist!")
        sys.exit(1)

    # Create target directories
    catalogue_target = os.path.join(PUBLIC_TARGET_DIR, "catalogue")
    sright_target = os.path.join(PUBLIC_TARGET_DIR, "projects", "sright")
    kis_target = os.path.join(PUBLIC_TARGET_DIR, "projects", "kis")

    os.makedirs(catalogue_target, exist_ok=True)
    os.makedirs(sright_target, exist_ok=True)
    os.makedirs(kis_target, exist_ok=True)

    # 1. Read catalogue-photo-regions.json
    regions_file = os.path.join(INSTRUCTION09_DIR, "catalogue-photo-regions.json")
    with open(regions_file, "r", encoding="utf-8") as f:
        regions_data = json.load(f)

    # Save a copy of the regions JSON in public
    with open(os.path.join(PUBLIC_TARGET_DIR, "catalogue-photo-regions.json"), "w", encoding="utf-8") as f:
        json.dump(regions_data, f, ensure_ascii=False, indent=2)

    source_rel_path = regions_data.get("source", "photos/catalogue/NEM_MN_-_03.jpg")
    source_img_path = os.path.join(INSTRUCTION09_DIR, source_rel_path)

    print(f"Loading source catalogue image: {source_img_path}")
    source_img = Image.open(source_img_path)
    w, h = source_img.size
    print(f"Image dimensions: {w}x{h}")

    # 2. Extract crops for the 6 colors
    extracted_manifest = {}
    for region in regions_data.get("regions", []):
        cid = region["colorId"]
        label = region["label"]
        box = region["box"]  # [left, top, right, bottom]
        left, top, right, bottom = box

        print(f"Cropping color '{cid}' ({label}): box=({left}, {top}, {right}, {bottom})...")
        cropped = source_img.crop((left, top, right, bottom))
        out_filename = f"cara_{cid}.jpg"
        out_path = os.path.join(catalogue_target, out_filename)
        cropped.save(out_path, "JPEG", quality=95)
        extracted_manifest[cid] = {
            "colorId": cid,
            "label": label,
            "filename": out_filename,
            "url": f"/images/tour360/real-photos/catalogue/{out_filename}",
            "width": cropped.width,
            "height": cropped.height,
            "box": box,
        }
        print(f"Saved {out_path} ({cropped.width}x{cropped.height})")

    # 3. Copy full catalogue sheets
    full_catalogue_source = os.path.join(INSTRUCTION09_DIR, "photos", "catalogue", "NEM_MN_-_03.jpg")
    if os.path.exists(full_catalogue_source):
        shutil.copy2(full_catalogue_source, os.path.join(catalogue_target, "NEM_MN_-_03.jpg"))
        print("Copied full NEM_MN_-_03.jpg")

    spec_sheet_source = os.path.join(INSTRUCTION09_DIR, "photos", "catalogue", "NEM_MN_-_01.jpg")
    if os.path.exists(spec_sheet_source):
        shutil.copy2(spec_sheet_source, os.path.join(catalogue_target, "NEM_MN_-_01.jpg"))
        print("Copied spec sheet NEM_MN_-_01.jpg")

    # 4. Copy project photos: Sright
    sright_source_dir = os.path.join(INSTRUCTION09_DIR, "photos", "sright")
    if os.path.exists(sright_source_dir):
        count_sright = 0
        for fname in os.listdir(sright_source_dir):
            if fname.lower().endswith(('.jpg', '.jpeg', '.png')):
                shutil.copy2(os.path.join(sright_source_dir, fname), os.path.join(sright_target, fname))
                count_sright += 1
        print(f"Copied {count_sright} photos from Sright project")

    # 5. Copy project photos: KIS
    kis_source_dir = os.path.join(INSTRUCTION09_DIR, "photos", "kis")
    if os.path.exists(kis_source_dir):
        count_kis = 0
        for fname in os.listdir(kis_source_dir):
            if fname.lower().endswith(('.jpg', '.jpeg', '.png')):
                shutil.copy2(os.path.join(kis_source_dir, fname), os.path.join(kis_target, fname))
                count_kis += 1
        print(f"Copied {count_kis} photos from KIS project")

    # Write manifest json
    manifest_path = os.path.join(PUBLIC_TARGET_DIR, "real_photos_manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump({
            "sourceCatalogue": "/images/tour360/real-photos/catalogue/NEM_MN_-_03.jpg",
            "specSheet": "/images/tour360/real-photos/catalogue/NEM_MN_-_01.jpg",
            "cottonCara6Colors": extracted_manifest,
            "srightProjectPhotosCount": count_sright,
            "kisProjectPhotosCount": count_kis,
            "disclaimer": "Chữ YOUR LOGO HERE trong ảnh là minh họa khả năng thêu/in logo tùy biến của xưởng HULA theo yêu cầu từng trường, không phải logo mặc định của sản phẩm."
        }, f, ensure_ascii=False, indent=2)
    print(f"Wrote manifest: {manifest_path}")
    print("Asset preparation completed successfully!")

if __name__ == "__main__":
    main()
