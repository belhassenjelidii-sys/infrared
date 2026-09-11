from pathlib import Path
import re, shutil
import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
base = ROOT / 'public/images/catalogue-real'
data = (ROOT / 'src/lib/data.ts').read_text()
entries = re.findall(r'"([^"]+)": \[(.*?)\],', data, re.S)
stage = ROOT / '.transparent-stage'
if stage.exists(): shutil.rmtree(stage)
stage.mkdir()

def remove_bg(src: Path, dst: Path):
    im = Image.open(src).convert('RGBA')
    a = np.asarray(im).copy()
    rgb = a[:, :, :3].astype(np.int16)
    h, w = rgb.shape[:2]
    n = max(2, min(h, w)//18)
    corners = np.concatenate([rgb[:n,:n].reshape(-1,3), rgb[:n,-n:].reshape(-1,3), rgb[-n:,:n].reshape(-1,3), rgb[-n:,-n:].reshape(-1,3)])
    bg = np.median(corners, axis=0)
    dist = np.linalg.norm(rgb - bg, axis=2)
    neutral = rgb.max(axis=2) - rgb.min(axis=2)
    white = np.minimum(1, np.maximum(0, (rgb.mean(axis=2)-208)/35)) * np.minimum(1, np.maximum(0, (18-neutral)/18))
    similar = np.maximum(0, 1 - dist/42)
    alpha = (1 - np.maximum(similar, white)) * (a[:,:,3]/255)
    alpha = np.asarray(Image.fromarray(np.uint8(np.clip(alpha*255,0,255)), 'L').filter(ImageFilter.GaussianBlur(.55)), dtype=np.float32)
    alpha[alpha < 10] = 0; alpha[alpha > 247] = 255
    a[:,:,3] = np.uint8(alpha)
    dst.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(a, 'RGBA').save(dst, 'PNG', optimize=True, compress_level=6)

count = 0
for slug, body in entries:
    files = re.findall(r'"([^"]+\.(?:jpg|jpeg|png|webp|avif))"', body, re.I)
    if not files: continue
    outdir = stage / slug
    for i, name in enumerate(files[:3], 1):
        src = base / slug / name
        if not src.exists(): raise FileNotFoundError(src)
        remove_bg(src, outdir / f'{i}.png'); count += 1

# Replace each gallery atomically after every PNG has been written.
for slug, body in entries:
    if (stage/slug).exists():
        target = base / slug
        for p in target.iterdir():
            if p.is_file(): p.unlink()
        for p in (stage/slug).glob('*.png'): shutil.move(str(p), target/p.name)
        data = re.sub(rf'("{re.escape(slug)}": \[)(.*?)(\],)', rf'\1"1.png", "2.png", "3.png"\3', data, count=1, flags=re.S)

(ROOT/'src/lib/data.ts').write_text(data)
shutil.rmtree(stage)
print(f'converted {count} catalogue images to RGBA PNG')
