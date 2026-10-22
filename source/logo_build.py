"""Build the Mama Mia sign/logo as SVG path data.

Script "Mama Mia" comes from Norican (closest match to the neon sign), PIZZA from
Montserrat ExtraBold. Slice, steam, speed line, banner and wheat are drawn here.
Outputs build/logo.json with every part, plus preview SVGs for checking.
"""
import json, math, os
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

FONTS = '/home/claude/fonts/ttf'
OUT = os.path.dirname(os.path.abspath(__file__))


def shape(fontfile, text, size, tracking=0):
    blob = hb.Blob.from_file_path(fontfile)
    face = hb.Face(blob)
    font = hb.Font(face)
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(font, buf, {"kern": True, "liga": True, "calt": True})
    tt = TTFont(fontfile)
    gs = tt.getGlyphSet()
    order = tt.getGlyphOrder()
    s = size / face.upem
    x = 0
    glyphs = []
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        name = order[info.codepoint]
        glyphs.append((name, (x + pos.x_offset) * s, pos.y_offset * s))
        x += pos.x_advance + tracking
    return glyphs, x * s, gs, s


def glyph_path(gs, name, s, tx, ty, rot=0.0, cx=0.0, cy=0.0):
    """Path for one glyph scaled by s, y flipped, rotated by rot (deg) around (cx, cy) then moved."""
    pen = SVGPathPen(gs, ntos=lambda v: ('%.1f' % v).rstrip('0').rstrip('.'))
    c, sn = math.cos(math.radians(rot)), math.sin(math.radians(rot))
    # glyph space -> scale/flip -> rotate around (cx,cy) in local -> translate
    a, b, cc, d = s * c, s * sn, -(-s * sn), -s * c
    # matrix for (x,y) -> (s*x, -s*y) then rotate
    m = (s * c, s * sn, s * sn, -s * c, tx, ty)
    tp = TransformPen(pen, m)
    gs[name].draw(tp)
    return pen.getCommands()


def bounds(gs, name):
    bp = BoundsPen(gs)
    gs[name].draw(bp)
    return bp.bounds


def f(v):
    return ('%.1f' % v).rstrip('0').rstrip('.')


def union_svg(gs, items):
    """items: list of (glyphname, matrix). Returns one SVG path string of their union."""
    import pathops
    paths = []
    for name, m in items:
        pp = pathops.Path()
        gs[name].draw(TransformPen(pp.getPen(glyphSet=gs), m))
        paths.append(pp)
    out = pathops.Path()
    pathops.union(paths, out.getPen())
    pen = SVGPathPen(None, ntos=lambda v: ('%.1f' % v).rstrip('0').rstrip('.'))
    out.draw(pen)
    return pen.getCommands()


# ---------------------------------------------------------------- script
def build_script():
    glyphs, adv, gs, s = shape(f'{FONTS}/norican.ttf', 'Mama Mia', 300)
    # overall bounds in output space
    xs, ys = [], []
    for name, gx, gy in glyphs:
        bb = bounds(gs, name)
        if not bb:
            continue
        xs += [gx + bb[0] * s, gx + bb[2] * s]
        ys += [-bb[1] * s, -bb[3] * s]
    w = max(xs) - min(xs)
    target_w = 800.0
    k = target_w / w
    ox = 100 - min(xs) * k
    baseline = 300.0
    parts = []
    words, cur = [], []
    for i, (name, gx, gy) in enumerate(glyphs):
        if name in ('space',):
            if cur: words.append(cur); cur = []
            continue
        sk = s * k
        cur.append((name, (sk, 0, 0, -sk, ox + gx * k, baseline - gy * k)))
    if cur: words.append(cur)
    for wi, w in enumerate(words):
        parts.append({'id': f'w{wi}', 'd': union_svg(gs, w)})
    top = baseline + min(ys) * k
    bot = baseline + max(ys) * k
    return parts, (100, top, 900, bot), baseline


# ---------------------------------------------------------------- PIZZA on an arc
def build_pizza(cx=500, cy=392, radius=1500, size=82, tracking=60):
    glyphs, adv, gs, s = shape(f'{FONTS}/montserrat-900.ttf', 'PIZZA', size, tracking=tracking * 1000 / size / 10)
    total = adv
    parts = []
    # arc center below so text arches up slightly (smile = center lower; we want a gentle frown)
    acx, acy = cx, cy + radius
    for i, (name, gx, gy) in enumerate(glyphs):
        bb = bounds(gs, name)
        gw = (bb[2] - bb[0]) * s if bb else 0
        mid = gx + (bb[0] * s if bb else 0) + gw / 2 - total / 2  # glyph centre relative to text centre
        ang = mid / radius  # radians along the arc
        px = acx + radius * math.sin(ang)
        py = acy - radius * math.cos(ang)
        # place glyph so its centre-bottom sits on (px, py+cap/2)
        cap = 0.70 * size
        rot = math.degrees(ang)
        # local origin: glyph centre x, baseline
        lx = -(gx + (bb[0] * s if bb else 0) + gw / 2)
        c, sn = math.cos(ang), math.sin(ang)
        # transform: translate glyph so centre-x at 0 and baseline at +cap/2, then rotate, then move to (px,py)
        pen = SVGPathPen(gs, ntos=lambda v: ('%.1f' % v).rstrip('0').rstrip('.'))
        # point p_local = (s*x + gx + lx, -s*y + cap/2); rotated: (c*X - sn*Y, sn*X + c*Y) + (px,py)
        m = (s * c, s * sn, s * sn, -s * c,
             px + c * (gx + lx) - sn * (cap / 2),
             py + sn * (gx + lx) + c * (cap / 2))
        parts.append({'id': f'p{i}', 'glyph': name, 'd': union_svg(gs, [(name, m)])})
    return parts


# ---------------------------------------------------------------- banner
def banner_path(cx=500, cy=392, w=470, h=96, radius=1500, notch=26):
    """Ribbon: arched band with folded tails. Returns outline path."""
    acx, acy = cx, cy + radius
    rt, rb = radius + h / 2, radius - h / 2
    half = (w / 2) / radius
    def pt(r, a):
        return acx + r * math.sin(a), acy - r * math.cos(a)
    tl, tr = pt(rt, -half), pt(rt, half)
    bl, br = pt(rb, -half), pt(rb, half)
    d = (f'M{f(tl[0])} {f(tl[1])}A{f(rt)} {f(rt)} 0 0 1 {f(tr[0])} {f(tr[1])}'
         f'L{f(br[0])} {f(br[1])}A{f(rb)} {f(rb)} 0 0 0 {f(bl[0])} {f(bl[1])}Z')
    # tails: behind the band, each a parallelogram with a V notch
    tails = []
    for side in (-1, 1):
        a0 = side * half
        a1 = side * (half + 70 / radius)
        p_top_in = pt(rt - 22, a0 - side * 0.0)
        p_bot_in = pt(rb - 22, a0)
        p_top_out = pt(rt - 22, a1)
        p_bot_out = pt(rb - 22, a1)
        mid_out = pt(radius - 22, a1 - side * (notch / radius))
        tails.append(
            f'M{f(p_top_in[0])} {f(p_top_in[1])}L{f(p_top_out[0])} {f(p_top_out[1])}'
            f'L{f(mid_out[0])} {f(mid_out[1])}L{f(p_bot_out[0])} {f(p_bot_out[1])}'
            f'L{f(p_bot_in[0])} {f(p_bot_in[1])}Z')
    # fold shading triangles (where tail meets band)
    folds = []
    for side in (-1, 1):
        a0 = side * half
        p1 = pt(rb, a0)
        p2 = pt(rb - 22, a0)
        p3 = pt(rb - 22, a0 + side * (22 / radius))
        folds.append(f'M{f(p1[0])} {f(p1[1])}L{f(p2[0])} {f(p2[1])}L{f(p3[0])} {f(p3[1])}Z')
    return d, tails, folds


# ---------------------------------------------------------------- slice
def rot(p, ang, c=(0, 0)):
    a = math.radians(ang)
    x, y = p[0] - c[0], p[1] - c[1]
    return (c[0] + x * math.cos(a) - y * math.sin(a), c[1] + x * math.sin(a) + y * math.cos(a))


def build_slice(tip=(768, 160), R=146, theta=27, angle=52):
    """Slice with tip at `tip`, pointing down-left. angle rotates the up-pointing slice clockwise."""
    th = math.radians(theta)
    def T(p):
        q = rot(p, angle)
        return (tip[0] + q[0], tip[1] + q[1])
    L = (-R * math.sin(th), -R * math.cos(th))
    Rr = (R * math.sin(th), -R * math.cos(th))
    Ri = R - 30
    Li = (-Ri * math.sin(th), -Ri * math.cos(th))
    Rii = (Ri * math.sin(th), -Ri * math.cos(th))
    t0, l0, r0, li, ri = T((0, 0)), T(L), T(Rr), T(Li), T(Rii)
    # outer outline: tip -> L -> arc -> R -> tip
    outline = (f'M{f(t0[0])} {f(t0[1])}L{f(l0[0])} {f(l0[1])}'
               f'A{R} {R} 0 0 1 {f(r0[0])} {f(r0[1])}Z')
    crust_line = f'M{f(li[0])} {f(li[1])}A{Ri} {Ri} 0 0 1 {f(ri[0])} {f(ri[1])}'
    # crust band (filled, for solid version)
    crust_band = (f'M{f(l0[0])} {f(l0[1])}A{R} {R} 0 0 1 {f(r0[0])} {f(r0[1])}'
                  f'L{f(ri[0])} {f(ri[1])}A{Ri} {Ri} 0 0 0 {f(li[0])} {f(li[1])}Z')
    pep = []
    for (x, y, r) in [(-24, -88, 15), (22, -96, 13), (-2, -52, 12), (8, -134, 0)]:
        if r == 0:
            continue
        c = T((x, y))
        pep.append((round(c[0], 1), round(c[1], 1), r))
    # cheese drips along the right (lower after rotation) edge
    pts = []
    n = 5
    for i in range(n + 1):
        t = 0.18 + 0.62 * i / n
        pts.append((Rr[0] * t, Rr[1] * t))
    # drip path: a wavy line just inside the edge, with two hanging drips
    def lerp(a, b, t):
        return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)
    e0 = lerp((0, 0), Rr, 0.20)
    e1 = lerp((0, 0), Rr, 0.80)
    # normal pointing outward (to the right of the edge, away from slice centre)
    ex, ey = Rr[0], Rr[1]
    ln = math.hypot(ex, ey)
    nx, ny = -ey / ln, ex / ln  # rotate edge vector +90deg
    if nx < 0:
        nx, ny = -nx, -ny
    def P(t, off):
        b = lerp((0, 0), Rr, t)
        return T((b[0] - nx * 8 + nx * off, b[1] - ny * 8 + ny * off))
    a = P(0.22, 0); b1 = P(0.34, 22); b2 = P(0.40, 0); c1 = P(0.52, 34); c2 = P(0.60, 0); d1 = P(0.70, 18); d2 = P(0.80, 0)
    drip = (f'M{f(a[0])} {f(a[1])}'
            f'C{f(P(0.27,0)[0])} {f(P(0.27,0)[1])} {f(P(0.30,26)[0])} {f(P(0.30,26)[1])} {f(b1[0])} {f(b1[1])}'
            f'C{f(P(0.38,26)[0])} {f(P(0.38,26)[1])} {f(P(0.39,0)[0])} {f(P(0.39,0)[1])} {f(b2[0])} {f(b2[1])}'
            f'C{f(P(0.45,0)[0])} {f(P(0.45,0)[1])} {f(P(0.47,40)[0])} {f(P(0.47,40)[1])} {f(c1[0])} {f(c1[1])}'
            f'C{f(P(0.57,40)[0])} {f(P(0.57,40)[1])} {f(P(0.59,0)[0])} {f(P(0.59,0)[1])} {f(c2[0])} {f(c2[1])}'
            f'C{f(P(0.64,0)[0])} {f(P(0.64,0)[1])} {f(P(0.66,22)[0])} {f(P(0.66,22)[1])} {f(d1[0])} {f(d1[1])}'
            f'C{f(P(0.74,22)[0])} {f(P(0.74,22)[1])} {f(P(0.76,0)[0])} {f(P(0.76,0)[1])} {f(d2[0])} {f(d2[1])}')
    # solid cheese (filled) for the print logo: area between edge and drip line
    return {'outline': outline, 'crust': crust_line, 'crustBand': crust_band, 'pep': pep, 'drip': drip,
            'tip': t0, 'crustTop': T((0, -R))}


def steam(x0=752, y0=74, gap=21, h=70):
    out = []
    for i in range(3):
        x = x0 + i * gap
        y = y0 - (8 if i == 1 else 0)
        out.append(f'M{f(x)} {f(y)}c-10 -11 -10 -21 0 -{h/3:.0f}s10 -22 0 -{h/3:.0f}s-10 -21 0 -{h/3:.0f}'.replace('--', '-'))
    return out


def speed_line(x0=300, y0=112, x1=752, y1=100):
    return f'M{f(x0)} {f(y0)}Q{f((x0 + x1) / 2)} {f(min(y0, y1) - 10)} {f(x1)} {f(y1)}'


def wheat(side=-1, base=(262, 430), length=200, leaves=5):
    """A wheat sprig curving outward. Returns stem path and list of leaf ellipses (cx, cy, rx, ry, rot)."""
    bx, by = base
    # stem: quadratic curve outward and slightly up
    ex, ey = bx + side * length, by - 62
    qx, qy = bx + side * length * 0.45, by + 18
    stem = f'M{f(bx)} {f(by)}Q{f(qx)} {f(qy)} {f(ex)} {f(ey)}'
    def qpt(t):
        x = (1 - t) ** 2 * bx + 2 * (1 - t) * t * qx + t * t * ex
        y = (1 - t) ** 2 * by + 2 * (1 - t) * t * qy + t * t * ey
        dx = 2 * (1 - t) * (qx - bx) + 2 * t * (ex - qx)
        dy = 2 * (1 - t) * (qy - by) + 2 * t * (ey - qy)
        return x, y, math.degrees(math.atan2(dy, dx))
    out = []
    for i in range(leaves):
        t = 0.30 + 0.66 * i / (leaves - 1)
        x, y, a = qpt(t)
        for s in (-1, 1):
            la = a + s * 34
            off = 22
            cx = x + off * math.cos(math.radians(la))
            cy = y + off * math.sin(math.radians(la))
            out.append((round(cx, 1), round(cy, 1), 21, 9.5, round(la, 1)))
    # tip leaf
    x, y, a = qpt(1.0)
    out.append((round(x + 18 * math.cos(math.radians(a)), 1), round(y + 18 * math.sin(math.radians(a)), 1), 20, 9, round(a, 1)))
    return stem, out


def main():
    script, sbox, baseline = build_script()
    pizza = build_pizza()
    band, tails, folds = banner_path()
    sl = build_slice()
    st = steam()
    line = speed_line()
    wl = wheat(-1, (262, 432))
    wr = wheat(1, (738, 432))
    data = {
        'viewBox': [0, -10, 1000, 520],
        'scriptBox': sbox, 'baseline': baseline,
        'script': script, 'pizza': pizza,
        'banner': band, 'tails': tails, 'folds': folds,
        'slice': sl, 'steam': st, 'line': line,
        'wheat': [{'stem': wl[0], 'leaves': wl[1]}, {'stem': wr[0], 'leaves': wr[1]}],
    }
    json.dump(data, open(os.path.join(OUT, 'logo.json'), 'w'))
    print('script box', [round(v) for v in sbox], 'glyphs', len(script), 'pizza', len(pizza))


if __name__ == '__main__':
    main()
