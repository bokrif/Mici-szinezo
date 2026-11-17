/* Mici Színező – színező és rajzoló app iPadre (PWA). */
(function () {
  'use strict';

  const W = 1600, H = 1200;           // a rajzlap belső felbontása
  const SIZES = [6, 13, 24, 42];      // ecsetméret sugara rajzlap-pixelben
  const MAX_UNDO = 10;
  const MAX_TWINKLES = 450;
  const LINE_RGB = [34, 26, 54];
  const reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ------------------------------------------------------------------ színek
  const SOLID = [
    ['#E5383B', 'piros'], ['#FF8A1F', 'narancs'], ['#FFD43B', 'sárga'], ['#9BE15D', 'világoszöld'],
    ['#2FAE5B', 'zöld'], ['#20C5B5', 'türkiz'], ['#5BC0FF', 'égkék'], ['#2F5BEA', 'kék'],
    ['#8A4FFF', 'lila'], ['#D18CFF', 'levendula'], ['#FF6FB5', 'rózsaszín'], ['#FFB8D9', 'halvány rózsaszín'],
    ['#FFC9A3', 'barack'], ['#9A5B34', 'barna'], ['#8C8C9A', 'szürke'], ['#22202E', 'fekete'], ['#FFFFFF', 'fehér'],
  ];
  const GLITTER = [
    ['#E9B53A', 'arany csillám'], ['#C3CBD6', 'ezüst csillám'], ['#FF6FB5', 'rózsaszín csillám'],
    ['#A46BFF', 'lila csillám'], ['#3E9BFF', 'kék csillám'], ['#25CDB0', 'türkiz csillám'],
  ];

  const COLORS = [];
  SOLID.forEach(([c, n]) => COLORS.push({ type: 'solid', color: c, name: n }));
  COLORS.push({ type: 'rainbow', color: '#FF6FB5', name: 'szivárvány' });
  GLITTER.forEach(([c, n]) => COLORS.push({ type: 'glitter', color: c, name: n }));
  COLORS.push({ type: 'rainbowGlitter', color: '#A46BFF', name: 'szivárvány csillám' });

  const TOOLS = [
    { id: 'marker', name: 'Filc' },
    { id: 'crayon', name: 'Zsírkréta' },
    { id: 'brush', name: 'Ecset' },
    { id: 'spray', name: 'Spray' },
    { id: 'stamp', name: 'Matrica' },
    { id: 'fill', name: 'Festékes vödör' },
    { id: 'eraser', name: 'Radír' },
  ];

  // ------------------------------------------------------------------ segédek
  const $ = (s) => document.querySelector(s);
  const rand = (a, b) => a + Math.random() * (b - a);

  function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgbToHsl([r, g, b]) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0; const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h *= 60;
    }
    return [h, s * 100, l * 100];
  }
  const hsl = (h, s, l, a = 1) => `hsla(${h},${s}%,${l}%,${a})`;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }

  function sparklePath(ctx, x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y - s);
    ctx.quadraticCurveTo(x, y, x + s, y);
    ctx.quadraticCurveTo(x, y, x, y + s);
    ctx.quadraticCurveTo(x, y, x - s, y);
    ctx.quadraticCurveTo(x, y, x, y - s);
    ctx.closePath();
  }

  // Csillámos minta: az alapszín világosabb/sötétebb pöttyei és fehér csillanások.
  const patternCache = new Map(), patternUrls = new Map();
  function glitterUrl(hex) {
    if (!patternUrls.has(hex)) patternUrls.set(hex, glitterTile(hex).toDataURL());
    return patternUrls.get(hex);
  }
  function glitterTile(hex) {
    if (patternCache.has(hex)) return patternCache.get(hex);
    const S = 128, c = makeCanvas(S, S), x = c.getContext('2d');
    const [h, s, l] = rgbToHsl(hexToRgb(hex));
    x.fillStyle = hex; x.fillRect(0, 0, S, S);
    for (let i = 0; i < 1100; i++) {
      const dl = rand(-22, 26);
      x.fillStyle = hsl(h + rand(-8, 8), clamp(s + rand(-10, 10), 0, 100), clamp(l + dl, 5, 97));
      const z = rand(1.2, 3);
      x.fillRect(Math.random() * S, Math.random() * S, z, z);
    }
    for (let i = 0; i < 70; i++) {
      x.fillStyle = `rgba(255,255,255,${rand(0.55, 1)})`;
      const z = rand(1, 2.4);
      x.fillRect(Math.random() * S, Math.random() * S, z, z);
    }
    x.fillStyle = '#fff';
    for (let i = 0; i < 5; i++) { sparklePath(x, rand(8, S - 8), rand(8, S - 8), rand(3, 5)); x.fill(); }
    patternCache.set(hex, c);
    return c;
  }

  // ------------------------------------------------------------------ állapot
  const state = {
    tool: 'marker',
    colorIndex: 0,
    sizeIndex: 2,
    drawing: null,       // aktuális rajz {id, name, svg} vagy üres lap
    boundary: null,      // Uint8Array – a vonalrajz falai a kitöltéshez
    twinkles: [],        // [x, y, méret, fázis]
    undo: [],
    hue: 0,
  };

  let paint, paintCtx, glitterCv, glitterCtx, lines, linesCtx, paper;

  const color = () => COLORS[state.colorIndex];
  const isRainbow = (c) => c.type === 'rainbow' || c.type === 'rainbowGlitter';
  const isGlitter = (c) => c.type === 'glitter' || c.type === 'rainbowGlitter';

  // Beállítja az ecset színét. A szivárványnál a színárnyalat a megtett úttal változik.
  function styleFor(c, ctx, hueShift = 0) {
    if (isRainbow(c)) return hsl((state.hue + hueShift) % 360, 92, 60);
    if (c.type === 'glitter') return ctx.createPattern(glitterTile(c.color), 'repeat');
    return c.color;
  }
  const softRgb = (c) => hexToRgb(c.color);

  // ------------------------------------------------------------------ csillogás réteg
  function addTwinkle(x, y, big) {
    if (state.twinkles.length >= MAX_TWINKLES) state.twinkles.splice((Math.random() * state.twinkles.length) | 0, 1);
    state.twinkles.push([Math.round(x), Math.round(y), big ? rand(9, 15) : rand(6, 11), Math.random() * 6.28]);
  }
  function eraseTwinkles(x, y, r) {
    const r2 = r * r;
    state.twinkles = state.twinkles.filter(([tx, ty]) => (tx - x) ** 2 + (ty - y) ** 2 > r2);
  }

  let lastTw = 0;
  function twinkleLoop(t) {
    requestAnimationFrame(twinkleLoop);
    if (!glitterCtx || $('#editor').hidden) return;
    if (t - lastTw < 40) return;
    lastTw = t;
    const ctx = glitterCtx;
    ctx.clearRect(0, 0, W, H);
    const k = t / 1000;
    for (const [x, y, s, ph] of state.twinkles) {
      const v = reduceMotion ? 0.6 : Math.pow(Math.max(0, Math.sin(k * 1.7 + ph)), 3);
      if (v < 0.05) continue;
      ctx.globalAlpha = v;
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath(); ctx.arc(x, y, s * 0.55, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#fff';
      sparklePath(ctx, x, y, s * (0.7 + v * 0.5));
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // ------------------------------------------------------------------ visszavonás
  function pushUndo() {
    try {
      state.undo.push({ img: paintCtx.getImageData(0, 0, W, H), tw: state.twinkles.slice() });
      if (state.undo.length > MAX_UNDO) state.undo.shift();
    } catch (e) { /* kevés memória – kihagyjuk */ }
    updateUndoBtn();
    return state.undo[state.undo.length - 1];
  }
  function doUndo() {
    finishFillAnim();
    const s = state.undo.pop();
    if (!s) return;
    paintCtx.putImageData(s.img, 0, 0);
    state.twinkles = s.tw;
    updateUndoBtn();
    scheduleSave();
  }
  function updateUndoBtn() { $('#btn-undo').disabled = state.undo.length === 0; }

  // ------------------------------------------------------------------ ecsetek
  let stroke = null;

  function radiusFor(e) {
    let r = SIZES[state.sizeIndex];
    if (e.pointerType === 'pen' && e.pressure > 0 && ['marker', 'crayon', 'brush'].includes(state.tool)) {
      r *= 0.45 + e.pressure * 0.9;
    }
    return r;
  }

  function sprinkle(ctx, x, y, r, n) {
    ctx.fillStyle = '#fff';
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.283, d = Math.sqrt(Math.random()) * r;
      ctx.globalAlpha = rand(0.6, 1);
      const z = rand(1.5, 3.2);
      ctx.fillRect(x + Math.cos(a) * d, y + Math.sin(a) * d, z, z);
    }
    ctx.globalAlpha = 1;
  }

  function glitterExtras(x, y, r, dist) {
    const c = color();
    if (!isGlitter(c)) return;
    if (c.type === 'rainbowGlitter') sprinkle(paintCtx, x, y, r, Math.max(2, r * 0.25));
    stroke.twAcc += dist;
    const every = 70 + r * 1.5;
    while (stroke.twAcc > every) {
      stroke.twAcc -= every;
      const a = Math.random() * 6.283, d = Math.random() * r * 0.8;
      addTwinkle(x + Math.cos(a) * d, y + Math.sin(a) * d, r > 20);
    }
  }

  function markerSeg(p0, p1, r) {
    const ctx = paintCtx, c = color();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.lineWidth = r * 2;
    ctx.strokeStyle = styleFor(c, ctx);
    ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();
  }

  // Zsírkréta: papírszemcsés textúra, ami a rajzlaphoz rögzül, mint az igazi krétánál.
  let grainTile = null, scratch = null;
  function grain() {
    if (grainTile) return grainTile;
    const S = 160, c = makeCanvas(S, S), x = c.getContext('2d');
    x.fillStyle = '#000'; x.fillRect(0, 0, S, S);
    x.globalCompositeOperation = 'destination-out';
    x.lineCap = 'round';
    for (let i = 0; i < 420; i++) {
      const px = Math.random() * S, py = Math.random() * S, len = rand(3, 11), a = rand(-0.75, -0.45);
      x.lineWidth = rand(0.8, 2);
      x.globalAlpha = rand(0.6, 1);
      for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {
        x.beginPath(); x.moveTo(px + ox, py + oy); x.lineTo(px + ox + Math.cos(a) * len, py + oy + Math.sin(a) * len); x.stroke();
      }
    }
    x.globalAlpha = 1;
    for (let i = 0; i < 900; i++) x.fillRect(Math.random() * S, Math.random() * S, 1.3, 1.3);
    grainTile = c;
    return c;
  }
  function crayonSeg(p0, p1, r) {
    const c = color();
    const pad = Math.ceil(r + 3);
    const bx = Math.floor(Math.min(p0.x, p1.x)) - pad, by = Math.floor(Math.min(p0.y, p1.y)) - pad;
    const w = Math.ceil(Math.abs(p1.x - p0.x)) + pad * 2 + 1, h = Math.ceil(Math.abs(p1.y - p0.y)) + pad * 2 + 1;
    if (!scratch || scratch.width < w || scratch.height < h) scratch = makeCanvas(Math.max(w, 256), Math.max(h, 256));
    const t = scratch.getContext('2d');
    t.setTransform(1, 0, 0, 1, 0, 0);
    t.globalCompositeOperation = 'source-over';
    t.clearRect(0, 0, w, h);
    t.translate(-bx, -by);
    t.lineCap = 'round'; t.lineJoin = 'round'; t.lineWidth = r * 2;
    t.strokeStyle = styleFor(c, t);
    t.beginPath(); t.moveTo(p0.x, p0.y); t.lineTo(p1.x, p1.y); t.stroke();
    t.globalCompositeOperation = 'destination-in';
    t.fillStyle = t.createPattern(grain(), 'repeat');
    t.fillRect(bx, by, w, h);
    paintCtx.drawImage(scratch, 0, 0, w, h, bx, by, w, h);
  }

  function brushStamp(x, y, r) {
    const ctx = paintCtx, c = color();
    const R = r * 1.25;
    let inner, outer;
    if (isRainbow(c)) {
      inner = hsl(state.hue % 360, 92, 60, 0.32); outer = hsl(state.hue % 360, 92, 60, 0);
    } else {
      const [cr, cg, cb] = softRgb(c);
      inner = `rgba(${cr},${cg},${cb},0.32)`; outer = `rgba(${cr},${cg},${cb},0)`;
    }
    const g = ctx.createRadialGradient(x, y, 0, x, y, R);
    g.addColorStop(0, inner); g.addColorStop(0.55, inner); g.addColorStop(1, outer);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, R, 0, 6.283); ctx.fill();
    if (c.type === 'glitter' && Math.random() < 0.35) sprinkle(ctx, x, y, r * 0.8, 3);
  }

  function sprayPuff(x, y, r) {
    const ctx = paintCtx, c = color();
    const R = r * 1.8 + 6, n = Math.round(22 + r * 1.8);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.283, d = Math.pow(Math.random(), 0.9) * R;
      ctx.fillStyle = styleFor(c, ctx, d * 0.6);
      const z = rand(2, 3.4);
      ctx.fillRect(x + Math.cos(a) * d, y + Math.sin(a) * d, z, z);
    }
    if (isRainbow(c)) state.hue += 1.5;
    if (isGlitter(c) && Math.random() < 0.05) addTwinkle(x + rand(-R, R) * 0.6, y + rand(-R, R) * 0.6);
  }

  function stampShape(x, y, r) {
    const ctx = paintCtx, c = color();
    const s = (r * 1.25 + 14) * rand(0.8, 1.2);
    const kind = stroke.stampKind++ % 3;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rand(-0.5, 0.5));
    ctx.beginPath();
    if (kind === 0) {          // csillag
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? s * 0.45 : s;
        ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
    } else if (kind === 1) {   // szív
      ctx.moveTo(0, s * 0.85);
      ctx.bezierCurveTo(-s * 1.35, s * 0.05, -s * 0.9, -s * 0.95, 0, -s * 0.35);
      ctx.bezierCurveTo(s * 0.9, -s * 0.95, s * 1.35, s * 0.05, 0, s * 0.85);
    } else {                   // virág
      for (let i = 0; i < 5; i++) {
        const a = (i * 2 * Math.PI) / 5;
        ctx.moveTo(Math.cos(a) * s * 0.5 + s * 0.42, Math.sin(a) * s * 0.5);
        ctx.arc(Math.cos(a) * s * 0.5, Math.sin(a) * s * 0.5, s * 0.42, 0, 6.283);
      }
    }
    ctx.closePath();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = styleFor(c, ctx);
    ctx.fill();
    if (kind === 2) {
      ctx.fillStyle = '#FFE066';
      ctx.beginPath(); ctx.arc(x, y, s * 0.3, 0, 6.283); ctx.fill();
    }
    ctx.restore();
    if (isRainbow(c)) state.hue += 40;
    if (isGlitter(c)) { addTwinkle(x, y, true); if (c.type === 'rainbowGlitter') sprinkle(paintCtx, x, y, s * 0.6, 8); }
  }

  function eraseSeg(p0, p1, r) {
    const ctx = paintCtx;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineCap = 'round'; ctx.lineWidth = r * 2.2;
    ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();
    ctx.restore();
    eraseTwinkles(p1.x, p1.y, r * 1.2);
  }

  // A pontok közötti utat egyenletes lépésekre bontja (bélyegző típusú ecsetekhez).
  // stroke.carry: az utolsó bélyeg óta megtett út.
  function walk(p0, p1, spacing, fn) {
    const dx = p1.x - p0.x, dy = p1.y - p0.y, d = Math.hypot(dx, dy);
    let pos = spacing - stroke.carry;
    while (pos <= d) {
      const f = d ? pos / d : 1;
      fn(p0.x + dx * f, p0.y + dy * f);
      pos += spacing;
    }
    stroke.carry = d - (pos - spacing);
  }

  function strokeTo(p, r) {
    const prev = stroke.last;
    const dist = Math.hypot(p.x - prev.x, p.y - prev.y);
    if (dist < 0.5) return;
    const c = color();
    switch (state.tool) {
      case 'marker':
        markerSeg(prev, p, r);
        if (isRainbow(c)) state.hue += dist * 0.35;
        glitterExtras(p.x, p.y, r, dist);
        break;
      case 'crayon':
        crayonSeg(prev, p, r);
        if (isRainbow(c)) state.hue += dist * 0.35;
        glitterExtras(p.x, p.y, r, dist);
        break;
      case 'brush':
        walk(prev, p, Math.max(2, r * 0.22), (x, y) => { brushStamp(x, y, r); if (isRainbow(c)) state.hue += 1.2; });
        glitterExtras(p.x, p.y, r, dist);
        break;
      case 'stamp':
        walk(prev, p, r * 2.4 + 34, (x, y) => stampShape(x, y, r));
        break;
      case 'eraser':
        eraseSeg(prev, p, r);
        break;
    }
    stroke.last = p;
  }

  // ------------------------------------------------------------------ kitöltés
  let fillAnim = null;

  function wallsFromPaint(img, sx, sy) {
    const d = img.data, n = W * H, walls = new Uint8Array(n);
    const over = (i) => {
      const a = d[i + 3] / 255;
      return [d[i] * a + 255 * (1 - a), d[i + 1] * a + 255 * (1 - a), d[i + 2] * a + 255 * (1 - a)];
    };
    const [r0, g0, b0] = over((sy * W + sx) * 4);
    for (let p = 0, i = 0; p < n; p++, i += 4) {
      const a = d[i + 3] / 255;
      const dr = d[i] * a + 255 * (1 - a) - r0, dg = d[i + 1] * a + 255 * (1 - a) - g0, db = d[i + 2] * a + 255 * (1 - a) - b0;
      if (dr * dr + dg * dg + db * db > 4200) walls[p] = 1;
    }
    return walls;
  }

  function floodRegion(walls, sx, sy) {
    let start = sy * W + sx;
    if (walls[start]) {  // vonalra bökött: keresünk egy közeli üres pontot
      let found = -1;
      for (let rr = 1; rr <= 10 && found < 0; rr++) {
        for (let dy = -rr; dy <= rr && found < 0; dy++) for (let dx = -rr; dx <= rr; dx++) {
          const x = sx + dx, y = sy + dy;
          if (x >= 0 && y >= 0 && x < W && y < H && !walls[y * W + x]) { found = y * W + x; break; }
        }
      }
      if (found < 0) return null;
      start = found; sx = start % W; sy = (start / W) | 0;
    }
    const region = new Uint8Array(W * H);
    let minX = sx, maxX = sx, minY = sy, maxY = sy, area = 0;
    const stack = [sx, sy];
    while (stack.length) {
      const y = stack.pop(), x = stack.pop();
      const row = y * W;
      if (region[row + x] || walls[row + x]) continue;
      let lx = x, rx = x;
      while (lx > 0 && !walls[row + lx - 1] && !region[row + lx - 1]) lx--;
      while (rx < W - 1 && !walls[row + rx + 1] && !region[row + rx + 1]) rx++;
      for (let i = lx; i <= rx; i++) region[row + i] = 1;
      area += rx - lx + 1;
      if (lx < minX) minX = lx; if (rx > maxX) maxX = rx;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
      for (const ny of [y - 1, y + 1]) {
        if (ny < 0 || ny >= H) continue;
        const nrow = ny * W;
        let inSpan = false;
        for (let i = lx; i <= rx; i++) {
          const free = !walls[nrow + i] && !region[nrow + i];
          if (free && !inSpan) { stack.push(i, ny); inSpan = true; }
          else if (!free) inSpan = false;
        }
      }
    }
    return { region, minX, maxX, minY, maxY, area, sx, sy };
  }

  // A kitöltött területet pár pixellel a vonalak alá is kiterjeszti, hogy ne maradjon fehér perem.
  function dilate(res, walls, passes) {
    const { region } = res;
    for (let p = 0; p < passes; p++) {
      const x0 = Math.max(0, res.minX - 1), x1 = Math.min(W - 1, res.maxX + 1);
      const y0 = Math.max(0, res.minY - 1), y1 = Math.min(H - 1, res.maxY + 1);
      const add = [];
      for (let y = y0; y <= y1; y++) {
        const row = y * W;
        for (let x = x0; x <= x1; x++) {
          const i = row + x;
          if (region[i] || !walls[i]) continue;
          if ((x > 0 && region[i - 1]) || (x < W - 1 && region[i + 1]) || (y > 0 && region[i - W]) || (y < H - 1 && region[i + W])) add.push(i);
        }
      }
      for (const i of add) region[i] = 1;
      res.minX = x0; res.maxX = x1; res.minY = y0; res.maxY = y1;
    }
  }

  function doFill(sx, sy, undoSnap) {
    const walls = state.boundary || wallsFromPaint(undoSnap ? undoSnap.img : paintCtx.getImageData(0, 0, W, H), sx, sy);
    const res = floodRegion(walls, sx, sy);
    if (!res) return;
    dilate(res, walls, state.boundary ? 4 : 1);
    const bw = res.maxX - res.minX + 1, bh = res.maxY - res.minY + 1;
    const tmp = makeCanvas(bw, bh), t = tmp.getContext('2d');
    const mask = t.createImageData(bw, bh);
    const md = mask.data;
    for (let y = 0; y < bh; y++) {
      const srow = (y + res.minY) * W + res.minX, drow = y * bw;
      for (let x = 0; x < bw; x++) if (res.region[srow + x]) md[(drow + x) * 4 + 3] = 255;
    }
    t.putImageData(mask, 0, 0);
    t.globalCompositeOperation = 'source-in';
    const c = color();
    if (isRainbow(c)) {
      const g = t.createLinearGradient(0, 0, bw * 0.35, bh);
      const h0 = state.hue % 360;
      for (let i = 0; i <= 6; i++) g.addColorStop(i / 6, hsl(h0 + i * 50, 92, 62));
      t.fillStyle = g;
      t.fillRect(0, 0, bw, bh);
      state.hue += 60;
    } else {
      t.translate(-res.minX, -res.minY);
      t.fillStyle = styleFor(c, t);
      t.fillRect(res.minX, res.minY, bw, bh);
      t.setTransform(1, 0, 0, 1, 0, 0);
    }
    if (c.type === 'rainbowGlitter') {
      t.globalCompositeOperation = 'source-atop';
      t.fillStyle = '#fff';
      const n = Math.min(6000, res.area / 120);
      for (let i = 0; i < n; i++) {
        t.globalAlpha = rand(0.5, 1);
        const z = rand(1.4, 3);
        t.fillRect(Math.random() * bw, Math.random() * bh, z, z);
      }
      t.globalAlpha = 1;
    }
    if (isGlitter(c)) {
      const want = clamp(Math.round(res.area / 9000), 2, 60);
      let tries = 0, got = 0;
      while (got < want && tries++ < want * 40) {
        const x = res.minX + ((Math.random() * bw) | 0), y = res.minY + ((Math.random() * bh) | 0);
        if (res.region[y * W + x] && (!state.boundary || !state.boundary[y * W + x])) { addTwinkle(x, y, Math.random() < 0.4); got++; }
      }
    }
    // kis "kiömlő festék" animáció a koppintás helyéről
    const corners = [[res.minX, res.minY], [res.maxX, res.minY], [res.minX, res.maxY], [res.maxX, res.maxY]];
    const maxR = Math.max(...corners.map(([x, y]) => Math.hypot(x - sx, y - sy))) + 4;
    fillAnim = { tmp, x: res.minX, y: res.minY, sx, sy, maxR, t0: performance.now() };
    if (reduceMotion) finishFillAnim(); else requestAnimationFrame(stepFill);
  }

  function stepFill(now) {
    if (!fillAnim) return;
    const f = fillAnim, p = clamp((now - f.t0) / 320, 0, 1);
    if (p >= 1) { finishFillAnim(); return; }
    const e = 1 - Math.pow(1 - p, 3);
    paintCtx.save();
    paintCtx.beginPath(); paintCtx.arc(f.sx, f.sy, Math.max(4, f.maxR * e), 0, 6.283); paintCtx.clip();
    paintCtx.drawImage(f.tmp, f.x, f.y);
    paintCtx.restore();
    requestAnimationFrame(stepFill);
  }
  function finishFillAnim() {
    if (!fillAnim) return;
    paintCtx.drawImage(fillAnim.tmp, fillAnim.x, fillAnim.y);
    fillAnim = null;
    scheduleSave();
  }

  // ------------------------------------------------------------------ érintés / ceruza
  let activePointer = null, sprayTimer = null;

  function toCanvas(e) {
    const r = paper.getBoundingClientRect();
    return { x: ((e.clientX - r.left) * W) / r.width, y: ((e.clientY - r.top) * H) / r.height };
  }

  function onDown(e) {
    if (activePointer !== null) return;           // csak egy ujj / ceruza egyszerre
    if (e.button && e.button !== 0) return;
    e.preventDefault();
    finishFillAnim();
    const p = toCanvas(e);
    if (state.tool === 'fill') {
      const snap = pushUndo();
      doFill(clamp(Math.round(p.x), 0, W - 1), clamp(Math.round(p.y), 0, H - 1), snap);
      return;
    }
    activePointer = e.pointerId;
    try { paper.setPointerCapture(e.pointerId); } catch (_) {}
    pushUndo();
    const r = radiusFor(e);
    stroke = { last: p, carry: 0, twAcc: 60, stampKind: (Math.random() * 3) | 0, r, moved: false };
    switch (state.tool) {
      case 'marker': markerSeg(p, { x: p.x + 0.1, y: p.y }, r); glitterExtras(p.x, p.y, r, 0); break;
      case 'crayon': crayonSeg(p, { x: p.x + 0.1, y: p.y }, r); break;
      case 'brush': brushStamp(p.x, p.y, r); break;
      case 'stamp': stampShape(p.x, p.y, r); stroke.carry = 0; break;
      case 'eraser': eraseSeg(p, { x: p.x + 0.1, y: p.y }, r); break;
      case 'spray':
        sprayPuff(p.x, p.y, r);
        sprayTimer = setInterval(() => stroke && sprayPuff(stroke.last.x, stroke.last.y, stroke.r), 30);
        break;
    }
  }

  function onMove(e) {
    if (e.pointerId !== activePointer || !stroke) return;
    e.preventDefault();
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    for (const ev of evs.length ? evs : [e]) {
      const p = toCanvas(ev);
      const r = radiusFor(ev);
      stroke.r = r;
      if (state.tool === 'spray') {
        walk(stroke.last, p, r * 0.9 + 4, (x, y) => sprayPuff(x, y, r));
        stroke.last = p;
        continue;
      }
      strokeTo(p, r);
    }
  }

  function onUp(e) {
    if (e.pointerId !== activePointer) return;
    activePointer = null;
    clearInterval(sprayTimer); sprayTimer = null;
    stroke = null;
    scheduleSave();
  }

  // ------------------------------------------------------------------ tárolás (IndexedDB)
  const DB_NAME = 'mici-szinezo', STORE = 'lapok';
  let dbp = null;
  function db() {
    if (dbp) return dbp;
    dbp = new Promise((res, rej) => {
      try {
        const rq = indexedDB.open(DB_NAME, 1);
        rq.onupgradeneeded = () => rq.result.createObjectStore(STORE);
        rq.onsuccess = () => res(rq.result);
        rq.onerror = () => rej(rq.error);
      } catch (e) { rej(e); }
    });
    return dbp;
  }
  async function dbGet(key) {
    try {
      const d = await db();
      return await new Promise((res, rej) => {
        const rq = d.transaction(STORE).objectStore(STORE).get(key);
        rq.onsuccess = () => res(rq.result); rq.onerror = () => rej(rq.error);
      });
    } catch (e) { return null; }
  }
  async function dbPut(key, val) {
    try {
      const d = await db();
      await new Promise((res, rej) => {
        const tx = d.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put(val, key);
        tx.oncomplete = res; tx.onerror = () => rej(tx.error);
      });
    } catch (e) { /* nem baj, ha nem sikerül */ }
  }
  async function dbDelete(key) {
    try {
      const d = await db();
      await new Promise((res) => { const tx = d.transaction(STORE, 'readwrite'); tx.objectStore(STORE).delete(key); tx.oncomplete = res; tx.onerror = res; });
    } catch (e) {}
  }

  const toBlob = (cv, type = 'image/png', q) => new Promise((res) => cv.toBlob(res, type, q));

  let saveTimer = null, savingFor = null;
  function scheduleSave() {
    clearTimeout(saveTimer);
    savingFor = state.drawing && state.drawing.id;
    saveTimer = setTimeout(saveNow, 700);
  }
  async function saveNow() {
    clearTimeout(saveTimer); saveTimer = null;
    if (!state.drawing || savingFor !== state.drawing.id) return;
    const id = state.drawing.id;
    const thumb = makeCanvas(400, 300);
    thumb.getContext('2d').drawImage(paint, 0, 0, 400, 300);
    const [pb, tb] = await Promise.all([toBlob(paint), toBlob(thumb)]);
    await dbPut(id, { paint: pb, thumb: tb, twinkles: state.twinkles.slice(), t: Date.now() });
    thumbs.set(id, tb);
  }

  // ------------------------------------------------------------------ vonalrajz betöltése
  const svgUrl = (svg) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

  function loadImage(src) {
    return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  }

  async function prepareLines(drawing) {
    linesCtx.clearRect(0, 0, W, H);
    if (!drawing.svg) { state.boundary = null; return; }
    const img = await loadImage(svgUrl(drawing.svg));
    const tmp = makeCanvas(W, H), t = tmp.getContext('2d');
    t.fillStyle = '#fff'; t.fillRect(0, 0, W, H);
    t.drawImage(img, 0, 0, W, H);
    const src = t.getImageData(0, 0, W, H), d = src.data;
    const out = linesCtx.createImageData(W, H), o = out.data;
    const walls = new Uint8Array(W * H);
    for (let p = 0, i = 0; p < W * H; p++, i += 4) {
      const lum = (d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11);
      const a = 255 - lum;
      if (a > 8) {
        o[i] = LINE_RGB[0]; o[i + 1] = LINE_RGB[1]; o[i + 2] = LINE_RGB[2];
        o[i + 3] = Math.min(255, a * 1.15);
        if (a > 100) walls[p] = 1;
      }
    }
    linesCtx.putImageData(out, 0, 0);
    state.boundary = walls;
  }

  async function openDrawing(drawing) {
    state.drawing = drawing;
    state.undo = [];
    state.twinkles = [];
    updateUndoBtn();
    show('editor');
    fitPaper();
    paintCtx.clearRect(0, 0, W, H);
    paper.classList.add('loading');
    try {
      await prepareLines(drawing);
      const saved = await dbGet(drawing.id);
      if (saved && saved.paint && state.drawing === drawing) {
        const url = URL.createObjectURL(saved.paint);
        try { paintCtx.drawImage(await loadImage(url), 0, 0, W, H); } finally { URL.revokeObjectURL(url); }
        state.twinkles = saved.twinkles || [];
      }
    } catch (e) { console.warn(e); }
    paper.classList.remove('loading');
  }

  // ------------------------------------------------------------------ képernyők
  function show(which) {
    $('#home').hidden = which !== 'home';
    $('#editor').hidden = which !== 'editor';
    document.body.dataset.screen = which;
  }

  const thumbs = new Map();
  const BLANK = { id: 'ures-lap', name: 'Üres lap', svg: null };

  async function renderGallery() {
    const g = $('#gallery');
    const all = [BLANK, ...window.DRAWINGS];
    g.innerHTML = '';
    all.forEach((d, i) => {
      const b = document.createElement('button');
      b.className = 'card' + (d.svg ? '' : ' card-blank');
      b.style.setProperty('--tilt', `${((i * 37) % 7) - 3}deg`);
      b.setAttribute('aria-label', d.name);
      b.innerHTML =
        `<span class="thumb"><img class="t-paint" alt="" hidden>` +
        (d.svg ? `<img class="t-lines" alt="" src="${svgUrl(d.svg)}">` : `<span class="blank-mark" aria-hidden="true">${ICONS.pencilBig}</span>`) +
        `</span><span class="card-name">${d.name}</span>`;
      b.addEventListener('click', () => openDrawing(d));
      g.appendChild(b);
      d._card = b;
    });
    for (const d of all) {
      let tb = thumbs.get(d.id);
      if (!tb) { const s = await dbGet(d.id); tb = s && s.thumb; if (tb) thumbs.set(d.id, tb); }
      setCardThumb(d, tb);
    }
  }
  function setCardThumb(d, blob) {
    const img = d._card && d._card.querySelector('.t-paint');
    if (!img) return;
    if (img.src && img.src.startsWith('blob:')) URL.revokeObjectURL(img.src);
    if (blob) { img.src = URL.createObjectURL(blob); img.hidden = false; }
    else { img.removeAttribute('src'); img.hidden = true; }
    const mark = d._card.querySelector('.blank-mark');
    if (mark) mark.hidden = !!blob;
  }

  async function goHome() {
    finishFillAnim();
    if (saveTimer) await saveNow();
    show('home');
    const d = state.drawing;
    if (d) setCardThumb(d, thumbs.get(d.id));
  }

  // ------------------------------------------------------------------ eszköztárak
  const tip = 'class="tip"';
  const ICONS = {
    marker: `<svg viewBox="0 0 48 48"><path d="M30 6 L42 18 L22 38 L10 26 Z" fill="#fff" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M30 6 L42 18 L37 23 L25 11 Z" ${tip} stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M10 26 L22 38 L14 42 L6 34 Z" fill="#fff" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M6 34 L14 42 L5 44 Z" ${tip} stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/></svg>`,
    crayon: `<svg viewBox="0 0 48 48"><path d="M34 4 L44 14 L18 40 L8 30 Z" ${tip} stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M27 11 L37 21 M21 17 L31 27" stroke="#fff" stroke-width="3"/><path d="M8 30 L18 40 L5 44 L4 43 Z" ${tip} stroke="currentColor" stroke-width="3" stroke-linejoin="round"/></svg>`,
    brush: `<svg viewBox="0 0 48 48"><path d="M44 4 C 40 10 30 20 25 25 L22 22 C 27 17 37 7 44 4 Z" fill="#fff" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M25 25 L22 22 L19 25 L22 28 Z" fill="currentColor"/><path d="M19 25 C 12 24 8 30 8 35 C 8 39 6 42 3 44 C 12 45 23 41 22 28 Z" ${tip} stroke="currentColor" stroke-width="3" stroke-linejoin="round"/></svg>`,
    spray: `<svg viewBox="0 0 48 48"><rect x="18" y="18" width="20" height="26" rx="5" fill="#fff" stroke="currentColor" stroke-width="3"/><rect x="18" y="26" width="20" height="9" ${tip} stroke="currentColor" stroke-width="3"/><rect x="23" y="10" width="10" height="8" rx="2" fill="#fff" stroke="currentColor" stroke-width="3"/><g ${tip}><circle cx="13" cy="8" r="2.5"/><circle cx="8" cy="14" r="2.5"/><circle cx="14" cy="16" r="2"/><circle cx="6" cy="6" r="2"/><circle cx="4" cy="20" r="2"/></g></svg>`,
    stamp: `<svg viewBox="0 0 48 48"><path d="M20 4 L24.5 15 L36 15.6 L27 23 L30 34 L20 27.8 L10 34 L13 23 L4 15.6 L15.5 15 Z" ${tip} stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M36 44 C 26 38 28 30 33 31 C 35 31.5 36 33 36 34 C 36 33 37 31.5 39 31 C 44 30 46 38 36 44 Z" ${tip} stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/></svg>`,
    fill: `<svg viewBox="0 0 48 48"><path d="M8 20 L24 6 L40 22 L26 38 Z" fill="#fff" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M8 20 L40 22 L26 38 Z" ${tip} stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M41 28 C 38 33 37 36 37 38 A4 4 0 0 0 45 38 C 45 36 44 33 41 28 Z" ${tip} stroke="currentColor" stroke-width="2.5"/><path d="M24 6 L24 20" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`,
    eraser: `<svg viewBox="0 0 48 48"><path d="M28 6 L44 22 L26 40 L10 24 Z" fill="#FF9EC6" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M10 24 L26 40 L20 44 L12 44 L4 36 Z" fill="#fff" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M24 46 L44 46" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`,
    home: `<svg viewBox="0 0 48 48"><path d="M6 23 L24 7 L42 23" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M11 20 L11 41 L37 41 L37 20" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><path d="M20 41 L20 29 L28 29 L28 41" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/></svg>`,
    undo: `<svg viewBox="0 0 48 48"><path d="M17 10 L7 20 L17 30" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 20 L28 20 C 36 20 41 26 41 32 C 41 38 36 42 30 42 L22 42" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round"/></svg>`,
    trash: `<svg viewBox="0 0 48 48"><path d="M8 13 L40 13 M19 13 L19 7 L29 7 L29 13" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 13 L14 42 L34 42 L36 13" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><path d="M20 20 L21 35 M28 20 L27 35" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/></svg>`,
    save: `<svg viewBox="0 0 48 48"><rect x="5" y="9" width="38" height="30" rx="5" fill="none" stroke="currentColor" stroke-width="4"/><circle cx="17" cy="20" r="4" fill="currentColor"/><path d="M5 34 L16 26 L24 32 L32 23 L43 32" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/></svg>`,
    check: `<svg viewBox="0 0 48 48"><path d="M9 25 L20 36 L40 13" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    cross: `<svg viewBox="0 0 48 48"><path d="M12 12 L36 36 M36 12 L12 36" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"/></svg>`,
    share: `<svg viewBox="0 0 48 48"><path d="M24 30 L24 5 M15 13 L24 5 L33 13" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 20 L10 20 L10 43 L38 43 L38 20 L32 20" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/></svg>`,
    pencilBig: `<svg viewBox="0 0 48 48"><path d="M34 6 L42 14 L18 38 L8 40 L10 30 Z" fill="#fff" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/><path d="M30 10 L38 18" stroke="currentColor" stroke-width="2.5"/></svg>`,
  };

  function buildToolbars() {
    const tools = $('#tools');
    TOOLS.forEach((t) => {
      const b = document.createElement('button');
      b.className = 'tool';
      b.dataset.tool = t.id;
      b.setAttribute('aria-label', t.name);
      b.title = t.name;
      b.innerHTML = ICONS[t.id];
      b.addEventListener('click', () => selectTool(t.id));
      tools.appendChild(b);
    });

    const sizes = $('#sizes');
    SIZES.forEach((s, i) => {
      const b = document.createElement('button');
      b.className = 'size';
      b.dataset.size = i;
      b.setAttribute('aria-label', ['Vékony', 'Közepes', 'Vastag', 'Nagyon vastag'][i]);
      b.innerHTML = `<i style="--d:${[8, 14, 22, 32][i]}px"></i>`;
      b.addEventListener('click', () => { state.sizeIndex = i; syncUI(); });
      sizes.appendChild(b);
    });

    const pal = $('#palette');
    COLORS.forEach((c, i) => {
      const b = document.createElement('button');
      b.className = 'swatch swatch-' + c.type;
      b.dataset.index = i;
      b.setAttribute('aria-label', c.name);
      b.title = c.name;
      if (c.type === 'solid') b.style.setProperty('--c', c.color);
      if (c.type === 'glitter') b.style.backgroundImage = `url(${glitterUrl(c.color)})`;
      if (c.type !== 'solid') b.innerHTML = `<span class="sparkle s1"></span><span class="sparkle s2"></span>`;
      b.addEventListener('click', () => {
        state.colorIndex = i;
        if (state.tool === 'eraser') state.tool = 'marker';
        syncUI();
      });
      pal.appendChild(b);
    });

    $('#btn-home').innerHTML = ICONS.home;
    $('#btn-undo').innerHTML = ICONS.undo;
    $('#btn-clear').innerHTML = ICONS.trash;
    $('#btn-save').innerHTML = ICONS.save;
    $('#clear-yes').innerHTML = ICONS.check;
    $('#clear-no').innerHTML = ICONS.cross;
    $('#save-close').innerHTML = ICONS.cross;
    $('#save-share').insertAdjacentHTML('afterbegin', ICONS.share);
  }

  function selectTool(id) {
    state.tool = id;
    syncUI();
  }

  function syncUI() {
    document.querySelectorAll('.tool').forEach((b) => b.classList.toggle('on', b.dataset.tool === state.tool));
    document.querySelectorAll('.size').forEach((b) => b.classList.toggle('on', +b.dataset.size === state.sizeIndex));
    document.querySelectorAll('.swatch').forEach((b) => b.classList.toggle('on', +b.dataset.index === state.colorIndex));
    const c = color();
    const root = document.documentElement.style;
    root.setProperty('--tip', isRainbow(c) ? 'url(#tip-rainbow)' : c.color);
    $('#sizes').classList.toggle('dim', state.tool === 'fill');
  }

  function fitPaper() {
    const stage = $('#stage');
    const sw = stage.clientWidth, sh = stage.clientHeight;
    if (!sw || !sh) return;
    let w = sw, h = (sw * 3) / 4;
    if (h > sh) { h = sh; w = (sh * 4) / 3; }
    paper.style.width = Math.floor(w) + 'px';
    paper.style.height = Math.floor(h) + 'px';
  }

  // ------------------------------------------------------------------ törlés, mentés
  function askClear() { $('#confirm').hidden = false; }
  function doClear() {
    $('#confirm').hidden = true;
    finishFillAnim();
    pushUndo();
    paintCtx.clearRect(0, 0, W, H);
    state.twinkles = [];
    scheduleSave();
  }

  let shareFile = null, previewUrl = null;
  async function openSave() {
    finishFillAnim();
    const out = makeCanvas(W, H), o = out.getContext('2d');
    o.fillStyle = '#fff'; o.fillRect(0, 0, W, H);
    o.drawImage(paint, 0, 0);
    if (state.twinkles.length) {      // a csillogás is kerüljön rá a képre
      o.fillStyle = '#fff';
      for (const [x, y, s] of state.twinkles) { o.globalAlpha = 0.9; sparklePath(o, x, y, s); o.fill(); }
      o.globalAlpha = 1;
    }
    o.drawImage(lines, 0, 0);
    const blob = await toBlob(out);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(blob);
    $('#save-img').src = previewUrl;
    const name = (state.drawing ? state.drawing.name : 'rajz').toLowerCase().replace(/\s+/g, '-');
    shareFile = new File([blob], `mici-${name}.png`, { type: 'image/png' });
    let canShare = false;
    try { canShare = !!(navigator.canShare && navigator.canShare({ files: [shareFile] })); } catch (_) {}
    $('#save-share').hidden = !canShare;
    $('#save-dialog').hidden = false;
  }
  async function doShare() {
    try { await navigator.share({ files: [shareFile], title: 'Mici rajza' }); }
    catch (e) { if (e && e.name !== 'AbortError') $('#save-share').hidden = true; }
  }

  // ------------------------------------------------------------------ indulás
  function init() {
    paper = $('#paper');
    paint = $('#cv-paint'); paintCtx = paint.getContext('2d', { willReadFrequently: true });
    glitterCv = $('#cv-glitter'); glitterCtx = glitterCv.getContext('2d');
    lines = $('#cv-lines'); linesCtx = lines.getContext('2d');
    [paint, glitterCv, lines].forEach((c) => { c.width = W; c.height = H; });

    buildToolbars();
    syncUI();
    renderGallery();

    paper.addEventListener('pointerdown', onDown);
    paper.addEventListener('pointermove', onMove);
    paper.addEventListener('pointerup', onUp);
    paper.addEventListener('pointercancel', onUp);
    paper.addEventListener('lostpointercapture', onUp);

    $('#btn-home').addEventListener('click', goHome);
    $('#btn-undo').addEventListener('click', doUndo);
    $('#btn-clear').addEventListener('click', askClear);
    $('#btn-save').addEventListener('click', openSave);
    $('#clear-yes').addEventListener('click', doClear);
    $('#clear-no').addEventListener('click', () => { $('#confirm').hidden = true; });
    $('#save-close').addEventListener('click', () => { $('#save-dialog').hidden = true; });
    $('#save-share').addEventListener('click', doShare);

    // iPad: ne nagyítson, ne görgessen, ne jelöljön ki szöveget rajzolás közben
    ['gesturestart', 'gesturechange'].forEach((ev) => document.addEventListener(ev, (e) => e.preventDefault(), { passive: false }));
    document.addEventListener('touchmove', (e) => { if (document.body.dataset.screen === 'editor') e.preventDefault(); }, { passive: false });
    document.addEventListener('contextmenu', (e) => { if (!e.target.closest('#save-img')) e.preventDefault(); });

    window.addEventListener('resize', fitPaper);
    window.addEventListener('orientationchange', () => setTimeout(fitPaper, 250));
    document.addEventListener('visibilitychange', () => { if (document.hidden && saveTimer) saveNow(); });
    window.addEventListener('pagehide', () => { if (saveTimer) saveNow(); });

    requestAnimationFrame(twinkleLoop);
    show('home');

    if ('serviceWorker' in navigator && location.protocol === 'https:' && !window.MICI_NO_SW) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
