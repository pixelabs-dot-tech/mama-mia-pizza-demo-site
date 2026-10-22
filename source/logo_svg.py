"""Compose the Mama Mia logo SVGs from build/logo.json.

neon_svg()  -> the hero sign: every part as tubes (glow layer + core layer), grouped so
               each part can flicker on separately.
solid_svg() -> the flat logo for nav, footer and badges, coloured through CSS variables
               --lg-script, --lg-banner, --lg-ink (banner lettering) and --lg-accent.
"""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
D = json.load(open(os.path.join(HERE, 'logo.json')))


def _vb(pad=0):
    x, y, w, h = D['viewBox']
    return f'{x - pad} {y - pad} {w + 2 * pad} {h + 2 * pad}'


def _ellipse(e, extra=''):
    cx, cy, rx, ry, r = e
    return f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" transform="rotate({r} {cx} {cy})"{extra}/>'


def part_paths():
    """Plain path markup per neon part (no styling)."""
    sl = D['slice']
    parts = {}
    parts['wheatL'] = f'<path d="{D["wheat"][0]["stem"]}"/>' + ''.join(_ellipse(e) for e in D['wheat'][0]['leaves'])
    parts['wheatR'] = f'<path d="{D["wheat"][1]["stem"]}"/>' + ''.join(_ellipse(e) for e in D['wheat'][1]['leaves'])
    parts['banner'] = f'<path d="{D["banner"]}"/>' + ''.join(f'<path d="{t}"/>' for t in D['tails'])
    parts['pizza'] = ''.join(f'<path d="{p["d"]}"/>' for p in D['pizza'])
    parts['script'] = ''.join(f'<path d="{p["d"]}"/>' for p in D['script'])
    parts['slice'] = (f'<path d="{sl["outline"]}"/><path d="{sl["crust"]}"/>' +
                      ''.join(f'<circle cx="{c[0]}" cy="{c[1]}" r="{c[2]}"/>' for c in sl['pep']))
    parts['cheese'] = f'<path d="{sl["drip"]}"/>'
    parts['steam'] = ''.join(f'<path d="{s}"/>' for s in D['steam'])
    parts['line'] = f'<path d="{D["line"]}"/>'
    return parts


NEON_ORDER = [  # (part, colour class, flicker order)
    ('wheatL', 'w'), ('wheatR', 'w'), ('banner', 'w'), ('pizza', 'r'),
    ('script', 'r'), ('line', 'w'), ('slice', 'r'), ('cheese', 'w'), ('steam', 'w'),
]


def neon_svg(cls='neon', ids='nn'):
    """Hero sign. Each part = unlit glass + lit group (glow, tube, hot core)."""
    p = part_paths()
    defs = ''.join(f'<g id="{ids}-{k}">{v}</g>' for k, v in p.items())
    layers = []
    for i, (k, c) in enumerate(NEON_ORDER):
        layers.append(
            f'<g class="nt nt--{c} nt-{k}" style="--n:{i}" data-part="{k}">'
            f'<use class="nt__off" href="#{ids}-{k}"/>'
            f'<g class="nt__lit">'
            f'<use class="nt__glow" href="#{ids}-{k}"/>'
            f'<use class="nt__tube" href="#{ids}-{k}"/>'
            f'<use class="nt__core" href="#{ids}-{k}"/>'
            f'</g></g>')
    return (f'<svg class="{cls}" viewBox="{_vb(30)}" aria-hidden="true" focusable="false">'
            f'<defs>{defs}'
            f'<filter id="{ids}-blur" filterUnits="userSpaceOnUse" x="-80" y="-120" width="1160" height="760"><feGaussianBlur stdDeviation="9"/></filter>'
            f'</defs>' + ''.join(layers) + '</svg>')


def solid_svg(cls='logo', ids='lg', title='Mama Mia Pizza'):
    sl = D['slice']
    wheat = ''
    for w in D['wheat']:
        wheat += f'<path class="lg-stem" d="{w["stem"]}"/>' + ''.join(_ellipse(e) for e in w['leaves'])
    pep = ''.join(f'<circle cx="{c[0]}" cy="{c[1]}" r="{c[2]}"/>' for c in sl['pep'])
    steam = ''.join(f'<path d="{s}"/>' for s in D['steam'])
    script = ''.join(f'<path d="{p["d"]}"/>' for p in D['script'])
    pizza = ''.join(f'<path d="{p["d"]}"/>' for p in D['pizza'])
    tails = ''.join(f'<path d="{t}"/>' for t in D['tails'])
    folds = ''.join(f'<path d="{t}"/>' for t in D['folds'])
    return (
        f'<svg class="{cls}" viewBox="{_vb(8)}" role="img" aria-label="{title}">'
        f'<g class="lg-wheat">{wheat}</g>'
        f'<g class="lg-tails">{tails}</g><g class="lg-folds">{folds}</g>'
        f'<path class="lg-band" d="{D["banner"]}"/>'
        f'<g class="lg-pizza">{pizza}</g>'
        f'<path class="lg-line" d="{D["line"]}"/>'
        f'<g class="lg-steam">{steam}</g>'
        f'<g class="lg-slice"><path class="lg-slice__body" d="{sl["outline"]}"/>'
        f'<path class="lg-slice__crust" d="{sl["crustBand"]}"/>'
        f'<g class="lg-slice__pep">{pep}</g>'
        f'<path class="lg-slice__cheese" d="{sl["drip"]}"/></g>'
        f'<g class="lg-script">{script}</g>'
        f'</svg>')


NEON_CSS = """
.neon{display:block;width:100%;height:auto;overflow:visible}
.nt use{fill:none;stroke-linecap:round;stroke-linejoin:round}
.nt__glow{stroke-width:15;opacity:.55;filter:url(#nn-blur)}
.nt__tube{stroke-width:6.5}
.nt__core{stroke-width:2.4}
.nt--r .nt__glow,.nt--r .nt__tube{stroke:#ff2438}
.nt--r .nt__core{stroke:#ffd0d6}
.nt--w .nt__glow{stroke:#fff3ea}
.nt--w .nt__tube{stroke:#fff7f0}
.nt--w .nt__core{stroke:#ffffff}
"""

SOLID_CSS = """
.logo{display:block;width:100%;height:auto;overflow:visible}
.logo .lg-script,.logo .lg-slice__body,.logo .lg-tails{fill:var(--lg-script,#d8232a)}
.logo .lg-band{fill:var(--lg-banner,#d8232a)}
.logo .lg-folds{fill:rgba(0,0,0,.35)}
.logo .lg-pizza{fill:var(--lg-ink,#fff6ea)}
.logo .lg-wheat{fill:var(--lg-accent,#d8232a)}
.logo .lg-stem{fill:none;stroke:var(--lg-accent,#d8232a);stroke-width:5;stroke-linecap:round}
.logo .lg-line,.logo .lg-steam{fill:none;stroke:var(--lg-script,#d8232a);stroke-width:7;stroke-linecap:round}
.logo .lg-slice__crust{fill:var(--lg-crust,#9e1218)}
.logo .lg-slice__pep{fill:var(--lg-ink,#fff6ea)}
.logo .lg-slice__cheese{fill:none;stroke:var(--lg-ink,#fff6ea);stroke-width:7;stroke-linecap:round}
"""

if __name__ == '__main__':
    html = f"""<!doctype html><meta charset=utf-8><style>
body{{margin:0;background:#1a1110;display:grid;gap:30px;padding:30px}}
.box{{width:900px}} .light{{background:#fff3e0;padding:20px}}
{NEON_CSS}{SOLID_CSS}</style>
<div class=box>{neon_svg()}</div>
<div class="box light">{solid_svg()}</div>
<div class="box" style="--lg-script:#fff3e0;--lg-banner:#d8232a;--lg-ink:#fff3e0;--lg-accent:#fff3e0">{solid_svg(ids='lg2')}</div>
"""
    open(os.path.join(HERE, 'logo_preview.html'), 'w').write(html)
    print('ok')


def solid_symbol(sid='mm-logo'):
    """<symbol> version of the flat logo. Colours come from CSS variables on the <use> element."""
    sl = D['slice']
    S = lambda v: f' style="{v}"'
    wheat = ''
    for w in D['wheat']:
        wheat += (f'<path d="{w["stem"]}"{S("fill:none;stroke:var(--lg-accent,#d8232a);stroke-width:5;stroke-linecap:round")}/>' +
                  ''.join(_ellipse(e) for e in w['leaves']))
    pep = ''.join(f'<circle cx="{c[0]}" cy="{c[1]}" r="{c[2]}"/>' for c in sl['pep'])
    steam = ''.join(f'<path d="{s}"/>' for s in D['steam'])
    script = ''.join(f'<path d="{p["d"]}"/>' for p in D['script'])
    pizza = ''.join(f'<path d="{p["d"]}"/>' for p in D['pizza'])
    tails = ''.join(f'<path d="{t}"/>' for t in D['tails'])
    folds = ''.join(f'<path d="{t}"/>' for t in D['folds'])
    return (
        f'<symbol id="{sid}" viewBox="{_vb(8)}">'
        f'<g{S("fill:var(--lg-accent,#d8232a)")}>{wheat}</g>'
        f'<g{S("fill:var(--lg-tail,var(--lg-banner,#d8232a))")}>{tails}</g>'
        f'<g{S("fill:rgba(0,0,0,.3)")}>{folds}</g>'
        f'<path d="{D["banner"]}"{S("fill:var(--lg-banner,#d8232a)")}/>'
        f'<g{S("fill:var(--lg-ink,#fff6ea)")}>{pizza}</g>'
        f'<path d="{D["line"]}"{S("fill:none;stroke:var(--lg-script,#d8232a);stroke-width:7;stroke-linecap:round")}/>'
        f'<g{S("fill:none;stroke:var(--lg-script,#d8232a);stroke-width:7;stroke-linecap:round")}>{steam}</g>'
        f'<path d="{sl["outline"]}"{S("fill:var(--lg-script,#d8232a)")}/>'
        f'<path d="{sl["crustBand"]}"{S("fill:var(--lg-crust,#9e1218)")}/>'
        f'<g{S("fill:var(--lg-dots,var(--lg-ink,#fff6ea))")}>{pep}</g>'
        f'<path d="{sl["drip"]}"{S("fill:none;stroke:var(--lg-dots,var(--lg-ink,#fff6ea));stroke-width:7;stroke-linecap:round")}/>'
        f'<g{S("fill:var(--lg-script,#d8232a)")}>{script}</g>'
        f'</symbol>')


def slice_symbol(sid='mm-slice'):
    """Just the slice (with steam) for favicons, badges and the scroll pizza."""
    sl = D['slice']
    pep = ''.join(f'<circle cx="{c[0]}" cy="{c[1]}" r="{c[2]}"/>' for c in sl['pep'])
    return (f'<symbol id="{sid}" viewBox="750 10 176 176">'
            f'<path d="{sl["outline"]}" style="fill:var(--sl-body,#d8232a)"/>'
            f'<path d="{sl["crustBand"]}" style="fill:var(--sl-crust,#9e1218)"/>'
            f'<g style="fill:var(--sl-dots,#fff6ea)">{pep}</g>'
            f'<path d="{sl["drip"]}" style="fill:none;stroke:var(--sl-dots,#fff6ea);stroke-width:8;stroke-linecap:round"/>'
            f'</symbol>')


def slice_bbox():
    return D['slice']
