"""Menu photos from Mama_Mia_Menu_Photos.pdf (one dish per page, pages 2-39).

For each dish: NAME.webp (large, for the photo viewer and hover peek) and NAME-t.webp
(a square crop around the dish itself, for the round plate in the menu list).
usage: menu_photos.py PDF_IMAGE_DIR OUT_DIR
"""
import os, sys
import numpy as np
from PIL import Image

SRC, OUT = sys.argv[1], sys.argv[2]
PAGES = ['fried-mozzarella', 'cheese-fries', 'french-fries', 'garlic-bread', 'chicken-strips',
         'spaghetti-meatballs', 'chicken-alfredo', 'mushroom-pasta', 'veg-lasagne',
         'mama-mia-special', 'after-dark', 'original', 'vegetarian', 'cheese', 'pepperoni', 'chicken', 'hawaiian',
         'greek-salad', 'chicken-caesar', 'green-salad', 'coleslaw',
         'philly-steak', 'chicken-fajita', 'classic-burger', 'chicken-sub', 'roast-beef',
         'dubai-chocolate', 'pb-melt', 'brownies', 'cookies', 'lazy-cake', 'cinnamon-roll',
         'almaza', 'imported-beer', 'soft-drinks', 'argili', 'red-wine', 'whiskey']
os.makedirs(OUT, exist_ok=True)
files = sorted(f for f in os.listdir(SRC) if f.endswith('.jpg'))
assert len(files) == 39, len(files)


def subject_box(im):
    """Bounding box of everything that isn't the near-white studio background."""
    a = np.asarray(im.convert('RGB')).astype(np.int16)
    bg = np.median(np.concatenate([a[:8].reshape(-1, 3), a[-8:].reshape(-1, 3), a[:, :8].reshape(-1, 3), a[:, -8:].reshape(-1, 3)]), axis=0)
    diff = np.abs(a - bg).max(axis=2)
    sat = a.max(axis=2) - a.min(axis=2)
    mask = (diff > 34) | (sat > 40)
    # ignore faint shadows: require the row/column to be meaningfully covered
    rows = np.where(mask.mean(axis=1) > 0.012)[0]
    cols = np.where(mask.mean(axis=0) > 0.012)[0]
    return cols[0], rows[0], cols[-1], rows[-1]


for name, f in zip(PAGES, files[1:]):
    im = Image.open(os.path.join(SRC, f)).convert('RGB')
    W, H = im.size
    big = im.copy()
    big.thumbnail((960, 960), Image.LANCZOS)
    big.save(os.path.join(OUT, name + '.webp'), 'WEBP', quality=80, method=6)
    x0, y0, x1, y1 = subject_box(im)
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    side = max(x1 - x0, y1 - y0) * 1.04
    side = min(side, W, H)
    l = int(round(min(max(cx - side / 2, 0), W - side)))
    t = int(round(min(max(cy - side / 2, 0), H - side)))
    th = im.crop((l, t, l + int(side), t + int(side))).resize((240, 240), Image.LANCZOS)
    th.save(os.path.join(OUT, name + '-t.webp'), 'WEBP', quality=80, method=6)
    print(f'{name:22s} {f}  subject {x1-x0}x{y1-y0}  crop {int(side)}')
