/* Mici Színező – előre elkészített vonalrajzok.
 * Minden rajz 800×600-as SVG. A fehér kitöltésű alakzatok eltakarják a mögöttük lévő
 * vonalakat; az app a képet fehér alapra rajzolja, és csak a sötét vonalakat tartja meg.
 */
(function () {
  const r1 = (n) => Math.round(n * 10) / 10;

  const wrap = (inner, defs = '') =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="1600" height="1200">` +
    `<defs>${defs}</defs><rect width="800" height="600" fill="#fff"/>` +
    `<g fill="#fff" stroke="#000" stroke-width="6" stroke-linejoin="round" stroke-linecap="round">${inner}</g></svg>`;

  const open = (d, extra = '') => `<path d="${d}" fill="none" ${extra}/>`;
  const dot = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#000"/>`;
  const shine = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" stroke="none"/>`;

  function star(cx, cy, R, rot = -90) {
    const r = R * 0.46;
    let d = '';
    for (let i = 0; i < 10; i++) {
      const a = ((rot + i * 36) * Math.PI) / 180;
      const rr = i % 2 ? r : R;
      d += (i ? 'L' : 'M') + r1(cx + rr * Math.cos(a)) + ' ' + r1(cy + rr * Math.sin(a)) + ' ';
    }
    return `<path d="${d}Z"/>`;
  }

  function heart(cx, cy, s) {
    const p = (x, y) => `${r1(cx + x * s)} ${r1(cy + y * s)}`;
    return `<path d="M${p(0, 0.9)} C${p(-1.4, 0.1)} ${p(-0.95, -0.95)} ${p(0, -0.4)} C${p(0.95, -0.95)} ${p(1.4, 0.1)} ${p(0, 0.9)} Z"/>`;
  }

  function cloud(cx, cy, s) {
    const p = (x, y) => `${r1(cx + x * s)} ${r1(cy + y * s)}`;
    return `<path d="M${p(-90, 30)} C${p(-125, 30)} ${p(-125, -18)} ${p(-85, -18)} C${p(-85, -58)} ${p(-30, -68)} ${p(-10, -38)} C${p(10, -75)} ${p(78, -62)} ${p(70, -15)} C${p(112, -15)} ${p(118, 30)} ${p(85, 30)} Z"/>`;
  }

  function sun(cx, cy, r) {
    let s = '';
    for (let i = 0; i < 8; i++) {
      const a = (i * 45 * Math.PI) / 180;
      s += open(`M${r1(cx + (r + 12) * Math.cos(a))} ${r1(cy + (r + 12) * Math.sin(a))} L${r1(cx + (r + 32) * Math.cos(a))} ${r1(cy + (r + 32) * Math.sin(a))}`);
    }
    return s + `<circle cx="${cx}" cy="${cy}" r="${r}"/>`;
  }

  function tinyFlower(cx, cy, r) {
    let s = '';
    for (let i = 0; i < 5; i++) {
      const a = ((i * 72 - 90) * Math.PI) / 180;
      s += `<circle cx="${r1(cx + r * Math.cos(a))}" cy="${r1(cy + r * Math.sin(a))}" r="${r1(r * 0.75)}"/>`;
    }
    return s + `<circle cx="${cx}" cy="${cy}" r="${r1(r * 0.6)}"/>`;
  }

  const hills = (y = 545) =>
    `<path d="M-10 ${y} C 180 ${y - 35} 300 ${y + 25} 420 ${y} C 560 ${y - 28} 680 ${y + 20} 810 ${y - 10} L810 610 L-10 610 Z"/>`;

  // ---------------------------------------------------------------- Cica
  const cat = wrap(
    // gombolyag
    `<circle cx="150" cy="500" r="58"/>` +
      open('M105 470 C 130 500 140 530 130 552') +
      open('M125 448 C 165 480 185 515 180 548') +
      open('M160 444 C 190 470 205 495 205 520') +
      open('M207 505 C 250 520 260 560 300 565') +
      // farok
      `<path d="M505 485 C 625 495 690 405 640 330 C 622 305 590 318 603 345 C 632 400 595 452 505 448 Z"/>` +
      // test
      `<ellipse cx="400" cy="425" rx="140" ry="118"/>` +
      `<ellipse cx="400" cy="450" rx="72" ry="78"/>` +
      `<ellipse cx="345" cy="538" rx="44" ry="24"/><ellipse cx="455" cy="538" rx="44" ry="24"/>` +
      open('M335 528 L335 548 M355 528 L355 548 M445 528 L445 548 M465 528 L465 548') +
      // fülek
      `<path d="M300 175 L288 58 L375 120 Z"/><path d="M500 175 L512 58 L425 120 Z"/>` +
      `<path d="M312 152 L305 92 L352 125 Z"/><path d="M488 152 L495 92 L448 125 Z"/>` +
      // fej
      `<ellipse cx="400" cy="232" rx="128" ry="106"/>` +
      `<ellipse cx="355" cy="215" rx="20" ry="26"/>${dot(359, 221, 11)}${shine(363, 214, 4)}` +
      `<ellipse cx="445" cy="215" rx="20" ry="26"/>${dot(449, 221, 11)}${shine(453, 214, 4)}` +
      `<path d="M386 256 L414 256 L400 270 Z"/>` +
      open('M400 270 C 396 288 374 292 366 280 M400 270 C 404 288 426 292 434 280') +
      open('M325 262 L245 248 M325 276 L245 290 M475 262 L555 248 M475 276 L555 290') +
      heart(400, 440, 26)
  );

  // ---------------------------------------------------------------- Egyszarvú
  const hornClip = `<clipPath id="horn"><path d="M372 128 L400 8 L428 128 Z"/></clipPath>`;
  let maneL = '';
  [[282, 178, 52], [256, 258, 52], [262, 340, 50], [288, 418, 46], [300, 490, 42]].forEach(([x, y, r]) => {
    maneL += `<circle cx="${x}" cy="${y}" r="${r}"/><circle cx="${800 - x}" cy="${y}" r="${r}"/>`;
  });
  const unicorn = wrap(
    star(110, 110, 34) + star(690, 95, 28) + star(95, 470, 24) + star(705, 455, 30) +
      heart(150, 300, 24) + heart(655, 290, 20) +
      // nyak
      `<path d="M330 330 L318 575 L482 575 L470 330 Z"/>` +
      maneL +
      `<circle cx="335" cy="122" r="44"/><circle cx="465" cy="122" r="44"/>` +
      // fülek
      `<path d="M330 150 L310 52 L382 112 Z"/><path d="M470 150 L490 52 L418 112 Z"/>` +
      `<path d="M336 132 L325 78 L366 113 Z"/><path d="M464 132 L475 78 L434 113 Z"/>` +
      // szarv
      `<path d="M372 128 L400 8 L428 128 Z"/>` +
      `<g clip-path="url(#horn)">${open('M360 105 L440 80 M360 75 L440 50 M360 45 L440 20')}</g>` +
      // fej
      `<ellipse cx="400" cy="232" rx="116" ry="122"/>` +
      `<path d="M348 150 C 360 108 440 108 452 150 C 432 140 422 178 400 168 C 378 178 368 140 348 150 Z"/>` +
      `<ellipse cx="400" cy="372" rx="86" ry="66"/>` +
      // szemek
      open('M333 248 C 343 266 365 266 375 248 M425 248 C 435 266 457 266 467 248') +
      open('M336 254 L326 244 M346 261 L340 250 M358 262 L357 251 M464 254 L474 244 M454 261 L460 250 M442 262 L443 251') +
      `<circle cx="330" cy="300" r="16"/><circle cx="470" cy="300" r="16"/>` +
      `<ellipse cx="373" cy="368" rx="9" ry="13"/><ellipse cx="427" cy="368" rx="9" ry="13"/>` +
      open('M368 405 C 384 422 416 422 432 405'),
    hornClip
  );

  // ---------------------------------------------------------------- Pillangó
  const butterfly = wrap(
    cloud(130, 90, 0.7) + cloud(670, 520, 0.6) +
      tinyFlower(110, 520, 22) + tinyFlower(700, 120, 18) +
      `<path d="M400 300 C 280 300 185 360 215 452 C 245 525 352 465 400 335 Z"/>` +
      `<path d="M400 300 C 520 300 615 360 585 452 C 555 525 448 465 400 335 Z"/>` +
      `<path d="M400 262 C 330 118 168 78 148 170 C 132 252 250 302 400 302 Z"/>` +
      `<path d="M400 262 C 470 118 632 78 652 170 C 668 252 550 302 400 302 Z"/>` +
      `<circle cx="238" cy="182" r="36"/><circle cx="315" cy="245" r="18"/><circle cx="190" cy="245" r="14"/>` +
      `<circle cx="562" cy="182" r="36"/><circle cx="485" cy="245" r="18"/><circle cx="610" cy="245" r="14"/>` +
      `<circle cx="285" cy="412" r="28"/><circle cx="515" cy="412" r="28"/>` +
      heart(340, 375, 13) + heart(460, 375, 13) +
      `<ellipse cx="400" cy="322" rx="19" ry="100"/>` +
      open('M383 280 L417 280 M382 320 L418 320 M384 360 L416 360') +
      open('M392 190 C 382 145 352 112 330 100 M408 190 C 418 145 448 112 470 100') +
      `<circle cx="326" cy="97" r="11"/><circle cx="474" cy="97" r="11"/>` +
      `<circle cx="400" cy="205" r="28"/>` + dot(390, 200, 4) + dot(410, 200, 4) +
      open('M390 213 C 395 220 405 220 410 213')
  );

  // ---------------------------------------------------------------- Virág
  let petals = '';
  for (let i = 0; i < 8; i++) {
    const a = (i * 45 * Math.PI) / 180;
    petals += `<ellipse cx="${r1(400 + 78 * Math.cos(a))}" cy="${r1(205 + 78 * Math.sin(a))}" rx="50" ry="36" transform="rotate(${i * 45} ${r1(400 + 78 * Math.cos(a))} ${r1(205 + 78 * Math.sin(a))})"/>`;
  }
  const flower = wrap(
    sun(90, 85, 40) + cloud(680, 90, 0.6) +
      `<path d="M392 445 C 389 380 396 330 392 290 L408 290 C 404 330 411 380 408 445 Z"/>` +
      `<path d="M395 402 C 340 360 288 370 266 396 C 308 424 360 424 395 402 Z"/>` + open('M393 402 L285 395') +
      `<path d="M405 372 C 460 330 512 340 534 366 C 492 394 440 394 405 372 Z"/>` + open('M407 372 L515 365') +
      petals +
      `<circle cx="400" cy="205" r="48"/>` + dot(383, 195, 6) + dot(417, 195, 6) +
      open('M380 218 C 390 232 410 232 420 218') +
      `<path d="M302 470 L498 470 L474 582 L326 582 Z"/>` +
      `<rect x="284" y="436" width="232" height="42" rx="10"/>` +
      heart(400, 528, 20) +
      tinyFlower(150, 540, 20) + open('M150 560 L150 600') + tinyFlower(660, 545, 18) + open('M660 563 L660 600')
  );

  // ---------------------------------------------------------------- Szivárvány
  let arcs = '';
  [330, 282, 234, 186, 138].forEach((r) => {
    arcs += open(`M${400 - r} 470 A${r} ${r} 0 0 1 ${400 + r} 470`);
  });
  const rainbow = wrap(
    sun(92, 92, 42) + star(690, 80, 26) + star(610, 150, 16) + star(740, 190, 14) +
      hills(560) + arcs +
      cloud(165, 468, 1.45) + cloud(635, 468, 1.45) +
      heart(400, 410, 34) +
      tinyFlower(400, 555, 16)
  );

  // ---------------------------------------------------------------- Kastély
  function crenel(x1, x2, y, w = 30, h = 26) {
    let d = `M${x1} ${y}`;
    let x = x1, up = true;
    while (x < x2 - 1) {
      const nx = Math.min(x + w, x2);
      d += up ? ` L${x} ${y - h} L${nx} ${y - h} L${nx} ${y}` : ` L${nx} ${y}`;
      x = nx;
      up = !up;
    }
    return d;
  }
  const castle = wrap(
    star(80, 80, 26) + star(720, 70, 30) + star(640, 170, 16) + cloud(140, 200, 0.55) +
      hills(548) +
      `<rect x="350" y="150" width="100" height="160"/>` +
      `<path d="M334 155 L400 34 L466 155 Z"/>` + open('M400 34 L400 4') + `<path d="M400 4 L436 15 L400 27 Z"/>` +
      heart(400, 215, 20) +
      `<path d="${crenel(250, 550, 290)} L550 548 L250 548 Z"/>` +
      `<path d="M358 548 L358 460 A42 42 0 0 1 442 460 L442 548 Z"/>` +
      open('M379 425 L379 548 M400 418 L400 548 M421 425 L421 548 M358 480 L442 480 M358 515 L442 515') +
      `<path d="M300 380 L300 355 A18 18 0 0 1 336 355 L336 380 Z"/><path d="M464 380 L464 355 A18 18 0 0 1 500 355 L500 380 Z"/>` +
      `<rect x="168" y="225" width="102" height="323"/>` +
      `<path d="M154 230 L219 92 L284 230 Z"/>` + open('M219 92 L219 56') + `<path d="M219 56 L255 68 L219 80 Z"/>` +
      `<path d="M203 320 L203 296 A16 16 0 0 1 235 296 L235 320 Z"/>` + star(219, 420, 22) +
      `<rect x="530" y="225" width="102" height="323"/>` +
      `<path d="M516 230 L581 92 L646 230 Z"/>` + open('M581 92 L581 56') + `<path d="M581 56 L617 68 L581 80 Z"/>` +
      `<path d="M565 320 L565 296 A16 16 0 0 1 597 296 L597 320 Z"/>` + star(581, 420, 22) +
      open('M380 548 C 370 570 350 585 335 600 M420 548 C 430 570 450 585 465 600')
  );

  // ---------------------------------------------------------------- Torta
  function drips(x1, x2, y) {
    let d = `M${x1} ${y}`;
    const n = 8, w = (x2 - x1) / n;
    for (let i = 0; i < n; i++) {
      const a = x1 + i * w, b = a + w;
      d += ` C ${r1(a + w * 0.15)} ${y + 34} ${r1(a + w * 0.55)} ${y + 34} ${r1(a + w * 0.6)} ${y + 6} C ${r1(a + w * 0.7)} ${y + 18} ${r1(b - w * 0.1)} ${y + 16} ${r1(b)} ${y}`;
    }
    return d;
  }
  function candle(x, top) {
    return `<rect x="${x - 11}" y="${top}" width="22" height="${300 - top}" rx="4"/>` +
      `<g clip-path="url(#c${x})">${open(`M${x - 14} ${top + 20} L${x + 14} ${top + 4} M${x - 14} ${top + 44} L${x + 14} ${top + 28} M${x - 14} ${top + 68} L${x + 14} ${top + 52}`)}</g>` +
      `<path d="M${x} ${top - 8} C ${x - 16} ${top - 26} ${x - 6} ${top - 44} ${x} ${top - 58} C ${x + 6} ${top - 44} ${x + 16} ${top - 26} ${x} ${top - 8} Z"/>`;
  }
  const cakeDefs = [[350, 222], [400, 205], [450, 222]].map(([x, t]) => `<clipPath id="c${x}"><rect x="${x - 11}" y="${t}" width="22" height="${300 - t}"/></clipPath>`).join('');
  const cake = wrap(
    open('M120 252 C 130 300 105 340 125 400') + `<ellipse cx="120" cy="180" rx="56" ry="72"/>` + `<path d="M112 250 L128 250 L120 262 Z"/>` +
      open('M690 232 C 680 290 705 330 690 390') + `<ellipse cx="690" cy="160" rx="56" ry="72"/>` + `<path d="M682 230 L698 230 L690 242 Z"/>` +
      shine(100, 155, 10) + shine(670, 135, 10) +
      star(250, 80, 18) + star(560, 70, 22) +
      `<ellipse cx="400" cy="535" rx="240" ry="34"/>` +
      `<path d="M220 412 L220 515 A180 22 0 0 0 580 515 L580 412 Z"/>` +
      `<ellipse cx="400" cy="412" rx="180" ry="24"/>` +
      open(drips(220, 580, 432)) +
      `<circle cx="270" cy="490" r="12"/><circle cx="335" cy="500" r="12"/><circle cx="400" cy="503" r="12"/><circle cx="465" cy="500" r="12"/><circle cx="530" cy="490" r="12"/>` +
      `<path d="M280 302 L280 397 A120 16 0 0 0 520 397 L520 302 Z"/>` +
      `<ellipse cx="400" cy="302" rx="120" ry="17"/>` +
      open(drips(280, 520, 320)) +
      heart(400, 368, 16) +
      candle(350, 222) + candle(400, 205) + candle(450, 222),
    cakeDefs
  );

  // ---------------------------------------------------------------- Maci
  const bear = wrap(
    heart(110, 110, 28) + heart(690, 120, 22) + star(100, 470, 24) + star(705, 480, 28) +
      `<circle cx="292" cy="148" r="52"/><circle cx="508" cy="148" r="52"/>` +
      `<circle cx="292" cy="148" r="26"/><circle cx="508" cy="148" r="26"/>` +
      `<ellipse cx="400" cy="452" rx="142" ry="122"/>` +
      `<ellipse cx="400" cy="470" rx="78" ry="72"/>` +
      heart(400, 470, 24) +
      `<ellipse cx="282" cy="425" rx="44" ry="72" transform="rotate(32 282 425)"/>` +
      `<ellipse cx="518" cy="425" rx="44" ry="72" transform="rotate(-32 518 425)"/>` +
      `<ellipse cx="328" cy="560" rx="58" ry="36"/><ellipse cx="472" cy="560" rx="58" ry="36"/>` +
      `<ellipse cx="328" cy="562" rx="28" ry="18"/><ellipse cx="472" cy="562" rx="28" ry="18"/>` +
      `<circle cx="400" cy="250" r="132"/>` +
      `<ellipse cx="400" cy="300" rx="58" ry="44"/>` +
      `<ellipse cx="400" cy="280" rx="20" ry="13" fill="#000"/>` +
      open('M400 292 L400 308 M400 308 C 390 322 374 318 371 307 M400 308 C 410 322 426 318 429 307') +
      dot(348, 226, 13) + shine(352, 221, 4) + dot(452, 226, 13) + shine(456, 221, 4) +
      `<circle cx="318" cy="285" r="18"/><circle cx="482" cy="285" r="18"/>` +
      `<path d="M400 382 L352 360 L352 404 Z"/><path d="M400 382 L448 360 L448 404 Z"/><circle cx="400" cy="382" r="12"/>`
  );

  // ---------------------------------------------------------------- Fagyi
  const coneClip = `<clipPath id="cone"><path d="M308 300 L400 572 L492 300 Z"/></clipPath>`;
  let waffle = '';
  for (let i = -6; i <= 6; i++) {
    waffle += `M${300 + i * 34} 300 L${420 + i * 34} 600 M${500 + i * 34} 300 L${380 + i * 34} 600 `;
  }
  const icecream = wrap(
    star(130, 110, 28) + star(670, 140, 22) + heart(150, 430, 30) + heart(650, 440, 26) + star(700, 330, 16) + star(110, 280, 14) +
      `<path d="M308 300 L400 572 L492 300 Z"/>` +
      `<g clip-path="url(#cone)">${open(waffle)}</g>` +
      `<circle cx="400" cy="150" r="74"/>` +
      open('M360 120 L372 112 M410 100 L424 106 M440 140 L448 152 M372 160 L384 166 M420 175 L432 168 M392 132 L398 144') +
      `<path d="M294 305 C 280 228 340 188 400 188 C 460 188 520 228 506 305 C 491 322 481 300 470 316 C 460 342 444 342 439 316 C 425 300 410 326 400 316 C 386 300 370 332 355 316 C 341 300 330 326 316 313 C 306 306 300 313 294 305 Z"/>` +
      dot(370, 250, 6) + dot(430, 250, 6) + open('M384 266 C 393 276 407 276 416 266') +
      open('M400 54 C 404 34 420 22 438 18') + `<circle cx="400" cy="72" r="22"/>` + shine(393, 65, 5),
    coneClip
  );

  // ---------------------------------------------------------------- Katica
  const ladybug = wrap(
    sun(705, 85, 36) + cloud(140, 90, 0.6) + tinyFlower(110, 540, 22) + tinyFlower(700, 545, 20) +
      `<path d="M90 460 C 190 255 545 200 725 230 C 655 425 355 530 90 460 Z"/>` +
      open('M100 458 C 300 405 500 325 718 234') +
      open('M292 300 L248 278 M286 350 L238 360 M302 402 L262 435 M548 300 L592 278 M554 350 L602 360 M538 402 L578 435') +
      open('M392 162 C 380 120 360 100 340 92 M448 162 C 460 120 480 100 500 92') +
      `<circle cx="337" cy="90" r="10"/><circle cx="503" cy="90" r="10"/>` +
      `<ellipse cx="420" cy="200" rx="76" ry="56"/>` +
      `<ellipse cx="420" cy="335" rx="138" ry="126"/>` +
      open('M420 210 L420 461') +
      `<circle cx="360" cy="292" r="26"/><circle cx="480" cy="292" r="26"/>` +
      `<circle cx="342" cy="372" r="22"/><circle cx="498" cy="372" r="22"/>` +
      `<circle cx="388" cy="425" r="15"/><circle cx="452" cy="425" r="15"/>` +
      `<circle cx="393" cy="188" r="15"/>${dot(396, 190, 7)}<circle cx="447" cy="188" r="15"/>${dot(450, 190, 7)}`
  );

  // ---------------------------------------------------------------- Hal
  const fish = wrap(
    `<circle cx="620" cy="150" r="16"/><circle cx="652" cy="98" r="11"/><circle cx="604" cy="64" r="8"/>` +
      `<circle cx="180" cy="140" r="12"/><circle cx="205" cy="95" r="8"/>` +
      `<path d="M-10 562 C 150 540 300 578 450 556 C 600 538 700 568 810 550 L810 610 L-10 610 Z"/>` +
      `<path d="M115 600 C 82 520 148 480 108 398 C 140 450 162 500 152 600 Z"/>` +
      `<path d="M688 600 C 658 530 722 500 700 428 C 732 480 742 540 724 600 Z"/>` +
      star(560, 575, 18) + `<ellipse cx="260" cy="580" rx="26" ry="14"/>` +
      `<path d="M520 300 L652 208 C 630 268 630 332 652 392 Z"/>` +
      `<path d="M328 218 C 358 140 450 150 482 218 Z"/>` +
      `<path d="M380 380 C 400 432 450 432 462 376 Z"/>` +
      `<ellipse cx="400" cy="300" rx="152" ry="96"/>` +
      open('M302 238 C 328 270 328 330 302 362') +
      `<circle cx="292" cy="282" r="21"/>` + dot(287, 285, 10) + shine(290, 280, 3) +
      open('M254 316 C 264 328 280 328 286 320') +
      open('M380 250 Q 400 270 380 290 M380 310 Q 400 330 380 350 M430 228 Q 450 248 430 268 M430 280 Q 450 300 430 320 M430 332 Q 450 352 430 372 M480 258 Q 500 278 480 298 M480 310 Q 500 330 480 350')
  );

  // ---------------------------------------------------------------- Ház
  const house = wrap(
    sun(690, 95, 44) + cloud(170, 110, 0.75) + cloud(470, 70, 0.45) +
      hills(520) +
      `<rect x="470" y="150" width="46" height="100"/>` +
      `<rect x="250" y="282" width="300" height="240"/>` +
      `<path d="M218 292 L400 150 L582 292 Z"/>` +
      heart(400, 238, 22) +
      `<path d="M365 522 L365 448 A35 35 0 0 1 435 448 L435 522 Z"/>` + dot(422, 478, 6) +
      `<rect x="278" y="322" width="64" height="64"/>` + open('M310 322 L310 386 M278 354 L342 354') +
      `<rect x="458" y="322" width="64" height="64"/>` + open('M490 322 L490 386 M458 354 L522 354') +
      `<rect x="272" y="386" width="76" height="16"/><rect x="452" y="386" width="76" height="16"/>` +
      open('M372 522 C 362 552 342 576 322 600 M428 522 C 438 552 468 576 488 600') +
      open('M140 560 L140 505') + `<path d="M118 482 L128 506 L152 506 L162 482 L151 492 L140 474 L129 492 Z"/>` +
      `<path d="M140 540 C 120 530 110 535 102 548 C 118 552 130 550 140 540 Z"/>` +
      open('M660 568 L660 512') + `<path d="M638 489 L648 513 L672 513 L682 489 L671 499 L660 481 L649 499 Z"/>` +
      `<path d="M660 548 C 680 538 690 543 698 556 C 682 560 670 558 660 548 Z"/>`
  );

  window.DRAWINGS = [
    { id: 'cica', name: 'Cica', svg: cat },
    { id: 'egyszarvu', name: 'Egyszarvú', svg: unicorn },
    { id: 'pillango', name: 'Pillangó', svg: butterfly },
    { id: 'virag', name: 'Virág', svg: flower },
    { id: 'szivarvany', name: 'Szivárvány', svg: rainbow },
    { id: 'kastely', name: 'Kastély', svg: castle },
    { id: 'torta', name: 'Torta', svg: cake },
    { id: 'maci', name: 'Maci', svg: bear },
    { id: 'fagyi', name: 'Fagyi', svg: icecream },
    { id: 'katica', name: 'Katica', svg: ladybug },
    { id: 'hal', name: 'Halacska', svg: fish },
    { id: 'haz', name: 'Házikó', svg: house },
  ];
})();
