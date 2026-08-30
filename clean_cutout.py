import numpy as np
from PIL import Image, ImageFilter

def studio_clean_cutout():
    # 1. Process Front Orca
    img = Image.open('public/images/orca-front.jpg').convert('RGB')
    arr = np.array(img, dtype=np.float32)
    h, w, _ = arr.shape
    
    # Calculate per-pixel brightness and cyan-boost
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    brightness = np.maximum(np.maximum(r, g), b)
    
    # Whale mask: where brightness > 22 (the solid whale has highlights/white belly/ambient gloss >= 24 everywhere)
    # Background in the generated 3D render is pitch black (brightness < 16)
    is_whale = brightness > 22
    
    # Fill small internal holes in whale mask
    mask_img = Image.fromarray((is_whale * 255).astype(np.uint8))
    # Close morphological filter to connect fin details and fill interior
    closed_mask = mask_img.filter(ImageFilter.MaxFilter(size=5)).filter(ImageFilter.MinFilter(size=5))
    # Soft edge feathering
    feathered_mask = closed_mask.filter(ImageFilter.GaussianBlur(radius=1.0))
    alpha = np.array(feathered_mask, dtype=np.float32)
    
    # Zero out far background
    alpha[brightness < 12] = 0
    
    out_arr = np.dstack((arr, alpha)).astype(np.uint8)
    Image.fromarray(out_arr).save('public/images/orca-front.png')
    print("Saved clean orca-front.png")
    
    # 2. Process Reveal Wireframe
    img_rev = Image.open('public/images/orca-reveal.jpg').convert('RGB')
    arr_rev = np.array(img_rev, dtype=np.float32)
    r2, g2, b2 = arr_rev[:, :, 0], arr_rev[:, :, 1], arr_rev[:, :, 2]
    bright_rev = np.maximum(np.maximum(r2, g2), b2)
    
    # Smooth luminance alpha
    alpha_rev = np.clip((bright_rev - 10.0) / 45.0, 0.0, 1.0) * 255.0
    out_rev = np.dstack((arr_rev, alpha_rev.astype(np.uint8))).astype(np.uint8)
    Image.fromarray(out_rev).save('public/images/orca-reveal.png')
    print("Saved clean orca-reveal.png")

if __name__ == '__main__':
    studio_clean_cutout()
