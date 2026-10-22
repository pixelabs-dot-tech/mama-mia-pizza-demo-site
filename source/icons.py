"""Favicons and the link-preview image, rendered with headless Chromium."""
import asyncio, json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import logo_svg as L
from playwright.async_api import async_playwright

SITE = '/home/claude/mamamia/site'
D = L.D
sl = D['slice']
pep = ''.join(f'<circle cx="{c[0]}" cy="{c[1]}" r="{c[2]}"/>' for c in sl['pep'])
slice_svg = (f'<g><path d="{sl["outline"]}" fill="#d7262e"/><path d="{sl["crustBand"]}" fill="#a8161d"/>'
             f'<g fill="#fff4e2">{pep}</g><path d="{sl["drip"]}" fill="none" stroke="#fff4e2" stroke-width="9" stroke-linecap="round"/></g>')
# favicon.svg: cream disc, red slice
fav = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="736 2 208 208"><circle cx="840" cy="106" r="102" fill="#fff4e2"/>'
       f'<g transform="translate(840 172) scale(.86) rotate(-52) translate(-768 -160)">{slice_svg}</g></svg>')
open(os.path.join(SITE, 'assets/img/favicon.svg'), 'w').write(fav)

OG = f"""<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="file://{SITE}/assets/css/site.css"></head>
<body style="margin:0;width:1200px;height:630px;overflow:hidden;background:#120b0a">
<div style="position:absolute;inset:0;background:url(file://{SITE}/assets/img/wall-night.webp) center 40%/cover;opacity:.95"></div>
<div style="position:absolute;inset:0;background:radial-gradient(70% 70% at 50% 34%,rgba(255,36,56,.32),rgba(255,36,56,.08) 50%,rgba(14,8,7,.82) 95%)"></div>
<div class="hero is-lit is-steady" style="position:absolute;inset:0;display:block;min-height:0;height:auto;background:none">
  <div style="position:absolute;left:50%;top:34px;width:640px;transform:translateX(-50%)">{L.neon_svg()}</div>
  <p class="hero__script" style="position:absolute;left:0;right:0;top:372px;text-align:center;font-size:104px;clip-path:none">Welcome home.</p>
  <p style="position:absolute;left:0;right:0;top:536px;text-align:center;font:600 21px/1 Oswald,sans-serif;letter-spacing:.24em;text-transform:uppercase;color:rgba(255,244,226,.78)">Ras El Maten · Since 1995 · Order on jeetak</p>
</div>
</body></html>"""

ICON = f"""<!doctype html><html><body style="margin:0;background:transparent">
<svg xmlns="http://www.w3.org/2000/svg" width="{{S}}" height="{{S}}" viewBox="736 2 208 208"><rect x="736" y="2" width="208" height="208" rx="{{R}}" fill="#d7262e"/>
<g transform="translate(840 170) scale(.84) rotate(-52) translate(-768 -160)"><path d="{sl['outline']}" fill="#fff4e2"/><path d="{sl['crustBand']}" fill="#f2c9a8"/>
<g fill="#d7262e">{pep}</g><path d="{sl['drip']}" fill="none" stroke="#d7262e" stroke-width="9" stroke-linecap="round"/></g></svg></body></html>"""


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': 1200, 'height': 630})
        open('/tmp/claude-0/-home-claude/1f0c5d83-33a7-5fbc-8ee0-f313c7a4cf29/scratchpad/og.html', 'w').write(OG)
        await pg.goto('file:///tmp/claude-0/-home-claude/1f0c5d83-33a7-5fbc-8ee0-f313c7a4cf29/scratchpad/og.html')
        await pg.wait_for_timeout(900)
        await pg.screenshot(path=os.path.join(SITE, 'assets/img/og.jpg'), type='jpeg', quality=86)
        for size, name, r in [(32, 'favicon-32.png', 40), (180, 'apple-touch-icon.png', 0), (192, 'icon-192.png', 40), (512, 'icon-512.png', 40)]:
            pg2 = await b.new_page(viewport={'width': size, 'height': size})
            await pg2.set_content(ICON.replace('{S}', str(size)).replace('{R}', str(r)))
            await pg2.screenshot(path=os.path.join(SITE, 'assets/img', name), omit_background=True, clip={'x': 0, 'y': 0, 'width': size, 'height': size})
            await pg2.close()
        await b.close()
    print('icons + og done')

asyncio.run(main())
