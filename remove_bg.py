import numpy as np
from PIL import Image
from collections import deque

def remove_outer_black_bg(input_path, output_path, tolerance=24, feather_dist=2):
    img = Image.open(input_path).convert("RGBA")
    arr = np.array(img)
    h, w, _ = arr.shape

    # Max RGB value per pixel
    rgb_max = np.max(arr[:, :, :3], axis=2)

    # Boolean mask: True = background (outside), False = foreground (whale)
    is_bg = np.zeros((h, w), dtype=bool)
    visited = np.zeros((h, w), dtype=bool)

    queue = deque()

    # Add all border pixels that are dark to the queue
    for x in range(w):
        for y in [0, h - 1]:
            if rgb_max[y, x] <= tolerance and not visited[y, x]:
                visited[y, x] = True
                queue.append((y, x))
    for y in range(h):
        for x in [0, w - 1]:
            if rgb_max[y, x] <= tolerance and not visited[y, x]:
                visited[y, x] = True
                queue.append((y, x))

    # 4-connected Flood Fill
    while queue:
        cy, cx = queue.popleft()
        is_bg[cy, cx] = True

        for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx]:
                visited[ny, nx] = True
                if rgb_max[ny, nx] <= tolerance:
                    queue.append((ny, nx))

    # Alpha channel: 0 for outer background, 255 for whale body
    alpha = np.where(is_bg, 0, 255).astype(np.uint8)

    # Feather the transition edge
    # Smooth alpha near boundary
    for y in range(1, h - 1):
        for x in range(1, w - 1):
            if not is_bg[y, x]:
                # If adjacent to background, softly ramp alpha based on brightness
                if is_bg[y-1, x] or is_bg[y+1, x] or is_bg[y, x-1] or is_bg[y, x+1]:
                    alpha[y, x] = int(min(255, max(0, rgb_max[y, x] * 4)))

    arr[:, :, 3] = alpha
    result = Image.fromarray(arr, mode="RGBA")
    result.save(output_path, "PNG")
    print(f"Saved solid-body transparent PNG to {output_path}")

def make_glowing_wireframe_transparent(input_path, output_path, black_thresh=10):
    # For the reveal holographic wireframe: it's glowing neon lines on black
    # Black should become transparent, while glowing cyan lines and digital data remain bright
    img = Image.open(input_path).convert("RGBA")
    arr = np.array(img, dtype=np.float32)

    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    max_c = np.maximum(np.maximum(r, g), b)

    # Alpha scales with brightness
    alpha = np.clip((max_c - black_thresh) / 45.0, 0.0, 1.0) * 255.0
    arr[:, :, 3] = alpha

    result = Image.fromarray(arr.astype(np.uint8), mode="RGBA")
    result.save(output_path, "PNG")
    print(f"Saved glowing wireframe transparent PNG to {output_path}")

if __name__ == "__main__":
    remove_outer_black_bg("public/images/orca-front.jpg", "public/images/orca-front.png", tolerance=26)
    make_glowing_wireframe_transparent("public/images/orca-reveal.jpg", "public/images/orca-reveal.png", black_thresh=12)
