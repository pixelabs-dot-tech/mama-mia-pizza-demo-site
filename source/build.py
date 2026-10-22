"""Assemble site/index.html from build/template.html.

Fills in the SVG sprite (logo, slice, jeetak marks, icons), the neon sign, the jeetak
scene with the Mama Mia badge, the food cards, the Instagram wall and the schema data,
then stamps every CSS/JS URL with a content hash so browsers never mix old and new files.
"""
import hashlib, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.join(os.path.dirname(HERE), 'site')
sys.path.insert(0, HERE)
import logo_svg as L  # noqa: E402

tpl = open(os.path.join(HERE, 'template.html'), encoding='utf-8').read()
# where the site is served from (share previews need absolute URLs); override with SITE_URL=...
SITE_URL = os.environ.get('SITE_URL', 'https://lightslategrey-cobra-938373.hostingersite.com/')
jk = json.load(open(os.path.join(HERE, 'jeetak_parts.json'), encoding='utf-8'))

ICONS = {
    'i-down': '<path d="M12 5v14M5 12l7 7 7-7"/>',
    'i-arrow': '<path d="M5 12h14M13 6l6 6-6 6"/>',
    'i-heart': '<path d="M12 20s-7.5-4.6-7.5-10.2A4.1 4.1 0 0 1 12 7.3a4.1 4.1 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z"/>',
    'i-flame': '<path d="M12 3c.5 3 4.8 5.4 4.8 10a4.8 4.8 0 0 1-9.6 0c0-2.4 1.2-3.9 2.3-5 .1 1.8.9 3 2 3.2C11 8.5 11.4 5.6 12 3z"/>',
    'i-bag': '<path d="M5.5 8h13l-1 12h-11l-1-12zM9 8V6.5a3 3 0 0 1 6 0V8"/>',
    'i-pin': '<path d="M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11z"/><circle cx="12" cy="10" r="2.6"/>',
    'i-phone': '<path d="M6.2 3.5h3l1.8 4.6-2.2 1.4a11.3 11.3 0 0 0 5.7 5.7l1.4-2.2 4.6 1.8v3a2 2 0 0 1-2.2 2A16.6 16.6 0 0 1 4.2 5.7a2 2 0 0 1 2-2.2z"/>',
    'i-pizza': '<path d="M3.6 6.3c5.3-3.1 11.5-3.1 16.8 0L12 21.3z"/><path d="M5.3 9.3c4.4-2.2 9-2.2 13.4 0"/><circle cx="10.2" cy="11.6" r="1.1"/><circle cx="13.6" cy="14.1" r="1.1"/><circle cx="12.4" cy="10.6" r=".4"/>',
    'i-salad': '<path d="M3.3 11.6h17.4a8.7 8.7 0 0 1-17.4 0z"/><path d="M8.2 11.4c-1-3 .7-5.8 3.5-6.4.3 2.7-1.2 4.9-3.5 6.4zM12.6 11.4c.5-2.6 2.7-4.3 5.3-4.1-.6 2.5-2.7 3.9-5.3 4.1z"/><path d="M7 20.3h10"/>',
    'i-burger': '<path d="M4.2 10.6c0-3.6 3.5-6.1 7.8-6.1s7.8 2.5 7.8 6.1z"/><path d="M3.5 13.6c1.4 1 2.8 1 4.2 0s2.8-1 4.3 0 2.8 1 4.3 0 2.8-1 4.2 0"/><path d="M4.6 16.6h14.8a2.9 2.9 0 0 1-2.9 2.9H7.5a2.9 2.9 0 0 1-2.9-2.9z"/>',
    'i-sub': '<path d="M2.8 12.3c0-2.6 3.6-4.5 9.2-4.5s9.2 1.9 9.2 4.5"/><path d="M2.8 12.3c1.5 1.3 3.1 1.3 4.6 0s3.1-1.3 4.6 0 3.1 1.3 4.6 0 3.1-1.3 4.6 0"/><path d="M3.4 15.2c0 1.9 3.5 3.1 8.6 3.1s8.6-1.2 8.6-3.1"/>',
    'i-bread': '<path d="M5 19.2c-2.2-2.2-.4-6.3 3.8-10.5S17.1 2.8 19.3 5s.4 6.3-3.8 10.5S7.2 21.4 5 19.2z"/><path d="M9.2 11.3l1.9 1.9M12.4 8.3l1.9 1.9M6.7 14.6l1.7 1.7"/>',
    'i-drum': '<path d="M15.6 13.1c2.6-.5 4.6-2.8 4.6-5.5a5.6 5.6 0 0 0-11.1-1.1c-.5 2.6.3 4.7 1.9 6l-4.3 4.3a2 2 0 1 0-1.7 3 2 2 0 1 0 3-1.7l4.3-4.3c1 .6 2.1.8 3.3.5z"/>',
    'i-cake': '<path d="M4.5 20.2h15v-6.6a2 2 0 0 0-2-2h-11a2 2 0 0 0-2 2z"/><path d="M4.5 15.4c1.3.9 2.5.9 3.8 0s2.5-.9 3.7 0 2.5.9 3.8 0 2.4-.9 3.7 0"/><path d="M12 11.6V8.4"/><path d="M12 6c.8 0 1.3-.6 1.3-1.3S12 2.3 12 2.3s-1.3 1.6-1.3 2.4S11.2 6 12 6z"/>',
    'i-pasta': '<path d="M3.3 12h17.4a8.7 8.7 0 0 1-17.4 0z"/><path d="M8 12c0-2 1.2-3.4 2.8-3.4S13 10 13 12M10.6 12c0-1.6 1-2.6 2.2-2.6s2.4 1 2.4 2.6"/><path d="M17.2 3.2l-4 7.6"/>',
    'i-cup': '<path d="M6 7.5h12l-1.4 12.4a1.5 1.5 0 0 1-1.5 1.3H8.9a1.5 1.5 0 0 1-1.5-1.3z"/><path d="M5 7.5h14M12.5 7.5l2-5"/>',
    'i-ig': '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".6" fill="currentColor"/>',
}


def sprite():
    icons = ''.join(f'<symbol id="{k}" viewBox="0 0 24 24">{v}</symbol>' for k, v in ICONS.items())
    return ('<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>'
            + L.solid_symbol('mm-logo') + L.slice_symbol('mm-slice') + jk['sym_jk'] + jk['sym_pin'] + icons +
            '</defs></svg>')


JKMARK = '<svg class="jkmark" viewBox="12 12 1900 690" aria-hidden="true" focusable="false"><use href="#i-jk"/></svg>'


def jk_scene():
    s = jk['scene']
    old = re.search(r'<g transform="translate\(-250 -175\)">.*?</g>\s*</g>', s, re.S).group(0)
    badge = ('<g transform="translate(-250 -175)"><g class="jk__store">'
             '<circle r="119" class="jk__storering"/><circle r="103" class="jk__storebg"/>'
             '<svg x="-90" y="-62" width="180" height="96" style="--lg-script:#d7262e;--lg-banner:#d7262e;--lg-ink:#fff4e2;'
             '--lg-accent:#d7262e;--lg-crust:#a8161d;--lg-dots:#fff4e2"><use href="#mm-logo"/></svg>'
             '<text y="62" text-anchor="middle" style="font:700 16px Oswald, sans-serif;letter-spacing:.2em;fill:#231816">RAS EL MATEN</text>'
             '</g></g>')
    s = s.replace(old, badge)
    return s


FOOD = [
    # kind, src, caption, tag, rotate, offset
    ('intro', '', '', '', '-2deg', '0px'),
    ('video', 'lasagna', 'Get in my belly', 'Lasagna', '2deg', '22px'),
    ('img', 'melt.webp', 'My heart is melting', 'Fresh from the oven', '-1.5deg', '-14px'),
    ('video', 'joy', 'Joy in every bite', 'Lunch outside', '1.5deg', '16px'),
    ('img', 'meatballs.webp', 'Warning: may cause cravings', 'Spaghetti & meatballs', '-2deg', '-8px'),
    ('video', 'magic', 'Where the magic happens', 'Topping a pie', '2.2deg', '20px'),
    ('img', 'house-pizza.webp', 'This is our Mama Mia pizza', 'The house pizza', '-1deg', '-16px'),
    ('video', 'parm', 'Get in my belly', 'Fried mozzarella', '1.6deg', '12px'),
    ('img', 'dessert-4.webp', 'Always room for dessert', 'Dessert pizza', '-2.4deg', '-6px'),
    ('video', 'pepperoni', 'One more slice', 'Pepperoni, fries on the side', '1.2deg', '18px'),
    ('img', 'love-fries.webp', 'Not ready for this', 'Cheese fries', '-1.6deg', '-12px'),
]


def food_cards():
    out = []
    for kind, src, cap, tag, r, y in FOOD:
        style = f' style="--r:{r};--y:{y}"'
        if kind == 'intro':
            out.append(f'<div class="fcard fcard--intro"{style}><p class="big" aria-hidden="true">Sahtein!</p>'
                       '<p>Real plates from our own stories: lasagna, pizza, meatballs, cheese fries and dessert pizza. Keep going →</p></div>')
            continue
        figcap = f'<figcaption><span class="fcard__cap">{cap}</span><span class="fcard__tag">{tag}</span></figcaption>'
        if kind == 'video':
            media = (f'<video data-src="assets/video/{src}.mp4" poster="assets/video/{src}.jpg" muted loop playsinline preload="none" '
                     f'aria-label="{tag}"></video>')
        else:
            media = f'<img src="assets/img/{src}" alt="{tag}" loading="lazy" decoding="async">'
        out.append(f'<figure class="fcard"{style}>{media}{figcap}</figure>')
    return '\n      '.join(out)


FEED = [
    ['after-dark', 'giardino', 'cinnamon-buns', 'dessert-pizza', 'sunday-cup', 'pepperoni-day', 'blueberry-loaf', 'ladies-night'],
    ['eid-light', 'labor-day', 'easter', 'mothers-day', 'womens-day', 'eid-dark', 'lebanon'],
]
ALT = {
    'after-dark': 'Poster for the After Dark pizza', 'giardino': 'Poster for the Mama Mia Giardino pizza',
    'cinnamon-buns': 'Poster for fresh homemade cinnamon buns', 'dessert-pizza': 'Poster for the dessert pizza',
    'sunday-cup': 'Poster for the Sunday Ice Cream Cup', 'pepperoni-day': 'Happy Pepperoni Pizza Day poster',
    'blueberry-loaf': 'Sugar-free blueberry almond loaf', 'ladies-night': 'Ladies Night at After Dark poster',
    'eid-light': 'Eid Mubarak greeting', 'labor-day': 'Happy Labor Day greeting', 'easter': 'Happy Easter greeting',
    'mothers-day': "Happy Mother's Day greeting", 'womens-day': "International Women's Day greeting",
    'eid-dark': 'Eid Mubarak greeting with pizza', 'lebanon': 'Message of support for Lebanese families',
}


def feed_rows():
    rows = []
    for i, row in enumerate(FEED):
        items = ''.join(
            f'<a data-link="instagram" href="https://www.instagram.com/mamamia.pizza961/" target="_blank" rel="noopener">'
            f'<img src="assets/img/ig/{n}.webp" alt="{ALT[n]}" width="360" height="481" loading="lazy" decoding="async"></a>'
            for n in row)
        rows.append(f'<div class="wall__row{" wall__row--rev" if i else ""}">{items}</div>')
    return '\n    '.join(rows)


LD = {
    '@context': 'https://schema.org', '@type': 'Restaurant', 'name': 'Mama Mia Pizza',
    'url': SITE_URL, 'image': SITE_URL + 'assets/img/og.jpg',
    'telephone': '+961 3 750 969', 'servesCuisine': ['Pizza', 'American-Italian', 'Pasta'],
    'foundingDate': '1995', 'acceptsReservations': True, 'hasMenu': SITE_URL + '#menu',
    'address': {'@type': 'PostalAddress', 'streetAddress': 'Main Road', 'addressLocality': 'Ras El Maten',
                'addressRegion': 'Mount Lebanon', 'addressCountry': 'LB'},
    'sameAs': ['https://www.instagram.com/mamamia.pizza961/'],
}


def version(m):
    path = m.group(1)
    data = open(os.path.join(SITE, path), 'rb').read()
    return f'{path}?v={hashlib.sha1(data).hexdigest()[:10]}'


html = tpl
html = html.replace('{{SPRITE}}', sprite())
html = html.replace('{{NEON}}', L.neon_svg())
html = html.replace('{{JK_SCENE}}', jk_scene())
html = html.replace('{{FOOD_CARDS}}', food_cards())
html = html.replace('{{FEED_ROWS}}', feed_rows())
html = html.replace('{{LDJSON}}', json.dumps(LD, ensure_ascii=False))
html = html.replace('{{JKMARK}}', JKMARK)
html = html.replace('{{SITE_URL}}', SITE_URL)
html = re.sub(r'\{\{V:([^}]+)\}\}', version, html)
left = re.findall(r'\{\{[^}]+\}\}', html)
assert not left, left
open(os.path.join(SITE, 'index.html'), 'w', encoding='utf-8').write(html)
print('index.html', len(html) // 1024, 'KB')

# ---- artifact variant: same page, without the document shell (the viewer adds it),
#      without cache-busting queries, and named for the gallery.
art = html
art = re.sub(r'^<!doctype html>\s*<html[^>]*>\s*<head>\s*', '', art)
art = art.replace('<meta charset="utf-8">\n', '').replace('<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n', '')
art = re.sub(r'<title>[^<]*</title>', '<title>Mama Mia Pizza</title>', art, count=1)
art = re.sub(r'\?v=[0-9a-f]{10}', '', art)
art = art.replace('<link rel="manifest" href="site.webmanifest">\n', '')
art = art.replace('</head>\n<body>\n', '').replace('\n</body>\n</html>', '')
assert not re.search(r'<(body|html|head)[\s>]|<!doctype', art, re.I), 'shell left in artifact'
open(os.path.join(SITE, 'mama-mia.html'), 'w', encoding='utf-8').write(art)
print('mama-mia.html', len(art) // 1024, 'KB')
