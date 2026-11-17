
/* ======================= Gasse · Roboter · Vokal-Stimmen ======================= */
const alley = {on:false, t:0, step:0, wait:2.5, reacted:false, hold:0, said:0};
const alleyG = new THREE.Group(); alleyG.visible = false; scene.add(alleyG);
const AW = 12, AD = 2.6, AH = 14, BAR = {x0:.6, x1:6.4, d:4.6, h:3.2};
const NEON = [], steamS = [], robots = [];
let neonLights = [], sodium = null, barLight = null;

/* ---------- Stimmen: nur die Vokale echter Wörter, mit Formantfiltern erzeugt (Web Audio) ---------- */
const VW = {a:[800,1250,2600], e:[460,2000,2700], i:[310,2300,3000], o:[470,820,2600], u:[330,720,2500], "ä":[640,1800,2600], "ö":[420,1500,2500], "ü":[310,1750,2300]};
function vowelEvents(text) {
  const ev = [], words = text.replace(/…/g, "...").split(/\s+/).filter(Boolean);
  words.forEach((raw, wi) => {
    const pm = raw.match(/[.,!?]+$/), punct = pm ? pm[0] : "", core = raw.replace(/[.,!?]+$/, "").replace(/[^A-Za-zÄÖÜäöüß]/g, ""), caps = core.length > 1 && core === core.toUpperCase(), lc = core.toLowerCase();
    let cons = 0, first = true, n0 = ev.length;
    for (let i = 0; i < lc.length; i++) {
      const c = lc[i], n = lc[i + 1]; let v1 = null, v2 = null, long = false;
      if ((c === "e" || c === "a") && n === "i") { v1 = "a"; v2 = "i"; i++; } else if ((c === "e" || c === "ä") && n === "u") { v1 = "o"; v2 = "i"; i++; } else if (c === "a" && n === "u") { v1 = "a"; v2 = "u"; i++; }
      else if (c === "i" && n === "e") { v1 = "i"; long = true; i++; } else if (VW[c] && n === c) { v1 = c; long = true; i++; } else if (VW[c]) v1 = c; else if (c === "y") v1 = "i";
      if (!v1) { cons++; continue; }
      ev.push({word:wi, v1, v2, long, gap:Math.min(.07, .02*cons), stress:caps ? 1.5 : (first && lc.length > 2 ? 1 : .15), end:false, punct:""}); cons = 0; first = false;
    }
    if (ev.length > n0) { const e = ev[ev.length - 1]; e.end = true; e.punct = punct; } else if (ev.length) ev[ev.length - 1].gap += .08;
    if (!ev.length) return;
  });
  return {ev, nW:words.length, q:/\?\s*$/.test(text), ex:/!\s*$/.test(text), dots:/(\.\.\.|…)\s*$/.test(text)};
}
function speakVowels(text, v) {      // v: f0 (Hz), fs (Formant-Skala), vol, robot (0..1), speed
  const P = vowelEvents(text), ev = P.ev, N = ev.length, lastW = ev.length ? ev[N - 1].word : 0; let t = .05, lastStart = N - 1; for (let k = N - 1; k >= 0; k--) { if (ev[k].word !== lastW) break; lastStart = k; }
  const outEv = []; let amp = null, outG = null, lfo = null, t0 = ac ? ac.currentTime + .03 : 0;
  if (ac) { outG = ac.createGain(); outG.gain.value = v.vol; amp = ac.createGain(); amp.gain.value = 1 - .35*v.robot; lfo = ac.createOscillator(); lfo.type = "square"; lfo.frequency.value = 38 + v.f0*.18; const lg = ac.createGain(); lg.gain.value = .3*v.robot; lfo.connect(lg); lg.connect(amp.gain); amp.connect(outG); (v.lp ? (() => { const f = ac.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = v.lp; f.Q.value = .7; outG.connect(f); return f; })() : outG).connect(fxIn); lfo.start(t0); }
  ev.forEach((e, k) => {
    const prog = k/Math.max(1, N - 1); let semi = -2.4*prog + e.stress*3.4 + (Math.random() - .5)*.9; if (e.punct.includes("!")) semi += 2.2; if (P.q && k >= lastStart) semi += 3 + (k - lastStart)*2.2; if (e.punct === ",") semi += 1.8; if (e.punct === ".") semi -= 3; if (P.dots && e.end && k === N - 1) semi -= 4;
    const dur = (e.long ? .15 : .088)*(1 + .3*Math.max(0, e.stress - .5))*v.speed*(P.dots && k > N - 3 ? 1.5 : 1), f = v.f0*Math.pow(2, semi/12), vol = (.5 + .5*Math.min(1, e.stress))*(P.dots && k > N - 3 ? .6 : 1) * (e.punct.includes("!") ? 1.25 : 1);
    t += e.gap*v.speed;
    if (ac) {
      const ts = t0 + t, f1 = VW[e.v1], f2 = VW[e.v2 || e.v1], o = ac.createOscillator(), eg = ac.createGain(); o.type = "sawtooth"; o.frequency.setValueAtTime(f, ts); o.frequency.linearRampToValueAtTime(f*(P.q && k >= lastStart ? 1.12 : .97), ts + dur);
      eg.gain.setValueAtTime(0, ts); eg.gain.linearRampToValueAtTime(vol, ts + .018); eg.gain.setValueAtTime(vol, ts + Math.max(.02, dur - .03)); eg.gain.linearRampToValueAtTime(0, ts + dur + .012);
      [[0, 1, 9], [1, .75, 11], [2, .4, 13]].forEach(([fi, gn, q]) => { const bp = ac.createBiquadFilter(), bg = ac.createGain(); bp.type = "bandpass"; bp.Q.value = q; bp.frequency.setValueAtTime(f1[fi]*v.fs, ts); bp.frequency.linearRampToValueAtTime(f2[fi]*v.fs, ts + dur); bg.gain.value = gn; o.connect(bp); bp.connect(bg); bg.connect(eg); });
      eg.connect(amp); o.start(ts); o.stop(ts + dur + .03);
    }
    outEv.push({t0:t, t1:t + dur, s:e.stress}); t += dur + (e.end ? (e.punct === "," ? .13 : e.punct ? .26 : .055)*v.speed : .004);
  });
  if (ac && lfo) lfo.stop(t0 + t + .1);
  return {dur:Math.max(.5, t), ev:outEv};
}

/* ---------- Roboter (Stil: Monitor-Köpfe wie in Stray) ---------- */
const _npw = new THREE.Vector3();
function npcPush(p) { const L = [...robots, ...(typeof barBots !== "undefined" ? barBots : []), ...(typeof exAct !== "undefined" ? exAct : [])]; for (const R of L) { if (!R.g.visible) continue; R.g.getWorldPosition(_npw); if (p.y < _npw.y + 1.85 && p.y > _npw.y - .5) { const dx = p.x - _npw.x, dz = p.z - _npw.z, d = Math.hypot(dx, dz); if (d < .36) { const k = d > 1e-3 ? .36/d : 0; p.x = _npw.x + (d > 1e-3 ? dx*k : .36); p.z = _npw.z + dz*k; } } } }
function makeRobot(o) {
  const g = new THREE.Group(), body = mStd(o.body, .55, .6), acc = mStd(o.acc, .5, .65), dk = mStd(0x16181c, .6, .5), R = {g, o, talkT:0, ev:[], drinkT:-1, lookT:0, blink:2 + Math.random()*3, face:0, gx:0, ph:Math.random()*6, cur:0};
  const add = (geo, mat, x, y, z, p) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); (p || g).add(m); return m; };
  for (const s of [-1, 1]) { const leg = new THREE.Group(); leg.position.set(s*.09, .78, 0); g.add(leg); add(new THREE.CylinderGeometry(.045, .04, .42, 8), body, 0, -.22, 0, leg); add(new THREE.SphereGeometry(.052, 8, 6), dk, 0, -.44, 0, leg);
    const sh = new THREE.Group(); sh.position.set(0, -.46, 0); leg.add(sh); add(new THREE.CylinderGeometry(.04, .034, .3, 8), acc, 0, -.15, 0, sh); add(new THREE.BoxGeometry(.1, .05, .18), dk, 0, -.31, .03, sh); }
  add(new THREE.BoxGeometry(.28, .1, .16), dk, 0, .82, 0); add(new THREE.CylinderGeometry(.14, .12, .5, 10), body, 0, 1.08, 0); add(new THREE.BoxGeometry(.2, .2, .02), acc, 0, 1.1, .12);
  const chest = add(new THREE.SphereGeometry(.013, 6, 6), new THREE.MeshBasicMaterial({color:o.glow}), .06, 1.16, .135); R.chest = chest;
  add(new THREE.CylinderGeometry(.045, .05, .1, 8), dk, 0, 1.37, 0); add(new THREE.BoxGeometry(.34, .06, .16), body, 0, 1.31, 0); add(new THREE.BoxGeometry(.04, .03, .12), acc, .15, 1.31, 0);
  const head = new THREE.Group(); head.position.set(0, 1.38, 0); g.add(head); R.head = head;
  add(new THREE.BoxGeometry(.36, .28, .2), dk, 0, .16, 0, head); add(new THREE.BoxGeometry(.3, .22, .06), acc, 0, .16, -.1, head); add(new THREE.CylinderGeometry(.008, .008, .2, 5), dk, .12, .38, -.03, head); add(new THREE.SphereGeometry(.018, 6, 6), new THREE.MeshBasicMaterial({color:o.glow}), .12, .49, -.03, head);
  const cv = document.createElement("canvas"); cv.width = 160; cv.height = 120; R.cx = cv.getContext("2d"); R.tex = new THREE.CanvasTexture(cv);
  add(new THREE.PlaneGeometry(.3, .225), new THREE.MeshBasicMaterial({map:R.tex}), 0, .16, .1055, head);
  const arm = s => { const A = new THREE.Group(); A.position.set(s*.2, 1.27, 0); g.add(A); add(new THREE.SphereGeometry(.05, 8, 6), dk, 0, 0, 0, A); add(new THREE.CylinderGeometry(.034, .03, .3, 8), body, 0, -.15, 0, A);
    const F = new THREE.Group(); F.position.set(0, -.3, 0); A.add(F); add(new THREE.SphereGeometry(.04, 8, 6), acc, 0, 0, 0, F); add(new THREE.CylinderGeometry(.03, .026, .28, 8), acc, 0, -.14, 0, F); add(new THREE.BoxGeometry(.07, .09, .05), dk, 0, -.31, 0, F); return {A, F}; };
  const L = arm(-1), Rr = arm(1); R.aL = L.A; R.fL = L.F; R.aR = Rr.A; R.fR = Rr.F;
  for (const s of [-1, 1]) { add(new THREE.BoxGeometry(.13, .035, .172), acc, s*.2, 1.34, 0); add(new THREE.CylinderGeometry(.052, .052, .03, 8), acc, s*.09, .64, 0); add(new THREE.BoxGeometry(.012, .02, .3), new THREE.MeshBasicMaterial({color:o.glow}), s*.153, 1.05, .0); add(new THREE.BoxGeometry(.03, .1, .02), dk, s*.19, .34, -.1, head); }
  add(new THREE.BoxGeometry(.22, .3, .06), dk, 0, 1.12, -.14); for (let k = 0; k < 3; k++) add(new THREE.BoxGeometry(.16, .012, .02), new THREE.MeshBasicMaterial({color:o.glow}), 0, 1.04 + k*.07, -.175); add(new THREE.BoxGeometry(.3, .02, .22), acc, 0, .3, 0, head); add(new THREE.BoxGeometry(.2, .018, .02), acc, 0, 1.16, .125);
  if (o.cool) { const jm = mStd(0x23252b, .3, .55), ora = new THREE.MeshBasicMaterial({color:0x3c8680});
    add(new THREE.BoxGeometry(.4, .46, .3), jm, 0, 1.1, -.0); add(new THREE.BoxGeometry(.4, .3, .03), jm, 0, .78, -.14); add(new THREE.BoxGeometry(.06, .22, .2), jm, -.15, 1.38, 0); add(new THREE.BoxGeometry(.06, .22, .2), jm, .15, 1.38, 0);
    add(new THREE.BoxGeometry(.012, .46, .005), ora, -.07, 1.1, .153); add(new THREE.BoxGeometry(.012, .46, .005), ora, .07, 1.1, .153);
    for (const s of [-1, 1]) { add(new THREE.ConeGeometry(.03, .1, 6), dk, s*.25, 1.37, 0).rotation.z = -s*1.2; add(new THREE.CylinderGeometry(.075, .075, .05, 12), jm, s*.215, .16, 0, head).rotation.z = Math.PI/2; add(new THREE.BoxGeometry(.04, .1, .02), ora, s*.22, 1.2, .0); }
    for (let k = 0; k < 4; k++) { const f = add(new THREE.BoxGeometry(.022, .16, .06), k % 2 ? acc : dk, 0, .36 + k*.0, -.07 + k*.06, head); f.rotation.x = -.35 - k*.08; f.position.y = .33 + (k === 1 || k === 2 ? .03 : 0); }
    add(new THREE.BoxGeometry(.28, .03, .05), ora, 0, .27, .1, head); }
  const glass = new THREE.Group(); glass.position.set(0, -.33, .02); R.fR.add(glass); R.glass = glass;
  add(new THREE.CylinderGeometry(.036, .03, .1, 10), new THREE.MeshStandardMaterial({color:0xcad4de, transparent:true, opacity:.35, roughness:.1}), 0, 0, 0, glass);
  R.liq = add(new THREE.CylinderGeometry(.031, .027, .066, 10), new THREE.MeshStandardMaterial({color:0x8a2018, emissive:0x50140e, roughness:.3}), 0, -.012, 0, glass); R.level = .85; setLevel(R, .85);
  robotDetails(R, g, add, body, acc, dk, o);
  g.traverse(m => { if (m.isMesh) m.castShadow = true; }); return R;
}
function setLevel(R, v) { R.level = v; const h = .066*Math.max(.02, v); R.liq.scale.y = Math.max(.02, v); R.liq.position.y = -.045 + h/2; R.liq.visible = v > .03; }
function drawFace(R, t) {
  const x = R.cx, o = R.o, w = 160, h = 120, col = "#" + o.glow.toString(16).padStart(6, "0"); x.fillStyle = "#05080b"; x.fillRect(0, 0, w, h);
  const look = R.lookT > 0, bl = R.blink < .12 ? .12 : 1, ey = look ? 30 : 24, ew = look ? 22 : 18; x.fillStyle = col; x.globalAlpha = .92;
  for (const s of [-1, 1]) { const cx = w/2 + s*34 + R.gx*8, cy = 48; x.beginPath(); x.roundRect ? x.roundRect(cx - ew/2, cy - ey*bl/2, ew, ey*bl, 5) : x.rect(cx - ew/2, cy - ey*bl/2, ew, ey*bl); x.fill(); }
  if (R.talkT > 0) { const k = R.ev.find(e => R.tAt >= e.t0 && R.tAt <= e.t1); for (let i = 0; i < 5; i++) { const hh = k ? 6 + (.5 + .5*Math.sin(t*38 + i*1.7))*18*(.5 + .5*Math.min(1, k.s)) : 3; x.fillRect(w/2 - 30 + i*13, 96 - hh/2, 8, hh); } }
  else if (R.drinkT >= 0) { x.fillRect(w/2 - 12, 96, 24, 4); } else if (R.smile) { x.strokeStyle = col; x.lineWidth = 5; x.lineCap = "round"; x.beginPath(); x.arc(w/2, 72, 30, .22*Math.PI, .78*Math.PI); x.stroke(); } else { x.fillRect(w/2 - 16, 95, 32, 4); }
  if (look) { x.font = "bold 26px monospace"; x.fillText("?", w - 30, 30); }
  x.globalAlpha = .13; x.fillStyle = "#000"; for (let y = 0; y < h; y += 4) x.fillRect(0, y, w, 2); x.globalAlpha = 1; if (Math.random() < .03) { x.fillStyle = "rgba(255,255,255,.07)"; x.fillRect(0, Math.random()*h, w, 4); }
  R.tex.needsUpdate = true;
}
const VOICES = [{f0:96, fs:.92, vol:.55, robot:.85, speed:1.08}, {f0:158, fs:1.08, vol:.5, robot:.7, speed:.95}];
const ROBN = ["ROBOTER · BRUMM", "ROBOTER · FIEP"];
function alleyTexts() {
  const brick = canvasTex(256, 256, (x, w, h) => { x.fillStyle = "#14100e"; x.fillRect(0, 0, w, h); const pal = ["#3a2a24", "#2e2420", "#42302a", "#33241f", "#27201d", "#463228"];
    for (let r = 0; r < 16; r++) for (let c = -1; c < 5; c++) { x.fillStyle = pal[(Math.random()*pal.length)|0]; x.fillRect(c*64 + (r%2 ? 32 : 0) + 1, r*16 + 1, 62, 14); }
    for (let i = 0; i < 26; i++) { const px = Math.random()*w, g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "rgba(0,0,0,.35)"); g.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = g; x.fillRect(px, 0, 2 + Math.random()*6, h*(.3 + Math.random()*.7)); } speckle(x, w, h, 2500, .12); }, 1, 1);
  const road = canvasTex(256, 256, (x, w, h) => { x.fillStyle = "#1a1b1f"; x.fillRect(0, 0, w, h); speckle(x, w, h, 7000, .2); x.strokeStyle = "rgba(0,0,0,.6)"; x.lineWidth = 2; for (let i = 0; i < 6; i++) { x.beginPath(); let px = Math.random()*w, py = Math.random()*h; x.moveTo(px, py); for (let k = 0; k < 6; k++) { px += (Math.random() - .5)*60; py += (Math.random() - .3)*40; x.lineTo(px, py); } x.stroke(); }
    x.fillStyle = "rgba(60,62,70,.35)"; x.fillRect(30, 40, 90, 60); x.fillRect(150, 150, 70, 80); x.strokeStyle = "rgba(0,0,0,.5)"; x.strokeRect(1, 1, w - 2, h - 2); }, 2*AW/3, 2*AD/3);
  return {brick, road};
}
function neonTex(text, col, sw, sh, vert, dead) {
  return canvasTex(vert ? 128 : 512, vert ? 512 : Math.round(512*sh/sw), (x, w, h) => { x.clearRect(0, 0, w, h); x.fillStyle = "rgba(6,8,10,.8)"; x.fillRect(4, 4, w - 8, h - 8); x.strokeStyle = col; x.lineWidth = 4; x.shadowColor = col; x.shadowBlur = 14; x.strokeRect(10, 10, w - 20, h - 20); x.fillStyle = col; x.textAlign = "center"; x.textBaseline = "middle";
    if (vert) { const L = text.split(""), step = (h - 40)/L.length; x.font = "bold " + Math.round(step*.8) + "px monospace"; L.forEach((c, i) => { x.globalAlpha = (dead === i) ? .18 : 1; x.fillText(c, w/2, 28 + step*(i + .5)); }); }
    else { x.font = "bold " + Math.round(h*.52) + "px monospace"; x.fillText(text, w/2, h/2 + 3, w - 40); } x.globalAlpha = 1; }, 1, 1);
}
function neonSign(text, col, sw, sh, pos3, rotY, vert, dead, lightCol, li) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), new THREE.MeshBasicMaterial({map:neonTex(text, col, sw, sh, vert, dead), transparent:true, depthWrite:false})); m.position.copy(pos3); m.rotation.y = rotY; alleyG.add(m);
  const l = new THREE.PointLight(lightCol, li, 7, 1.6); l.position.copy(pos3).add(V3(Math.sin(rotY)*.5, -.2, Math.cos(rotY)*.5)); alleyG.add(l); NEON.push({m, l, base:li, fl:Math.random()*5}); return m;
}
function buildAlley() {
  while (alleyG.children.length) { const o = alleyG.children.pop(); o.traverse(c => { if (c.geometry) c.geometry.dispose(); }); } NEON.length = 0; steamS.length = 0; sodium = null; barLight = null;
  const T = alleyTexts();
  setBox(2*AW, AH, 2*AD); TAU = .14; DN = 7.6; PLANES[4].c = -DN;
  for (const m of roomMeshes) if (m) { scene.remove(m); m.geometry.dispose(); }
  const bt = (rx, ry) => { const t = T.brick.clone(); t.needsUpdate = true; t.repeat.set(rx, ry); return t; };
  const blk = canvasTex(8, 8, (x, w, h) => { x.fillStyle = "#000"; x.fillRect(0, 0, w, h); }, 1, 1);
  roomPlane(0, 2*AW, 2*AD, T.road, V3(0, 0, 0)); applyAsphalt(roomMeshes[0], 2*AW, 2*AD, 0xb4b4bc); roomPlane(1, 2*AW, 2*AD, blk, V3(0, AH, 0));
  roomPlane(2, 2*AD, AH, bt(2*AD/2.4, AH/2.4), V3(-AW, AH/2, 0)); roomPlane(3, 2*AD, AH, bt(2*AD/2.4, AH/2.4), V3(AW, AH/2, 0));
  roomPlane(4, 2*AW, AH, bt(2*AW/2.4, AH/2.4), V3(0, AH/2, -AD)); roomPlane(5, 2*AW, AH, bt(2*AW/2.4, AH/2.4), V3(0, AH/2, AD));
  roomMeshes[1].material.color.setHex(0x000000); roomMeshes[1].material.roughness = 1;
  // Nordwand mit Loch für Schaufenster und Tür
  const sh = new THREE.Shape(); sh.moveTo(-AW, -AH/2); sh.lineTo(AW, -AH/2); sh.lineTo(AW, AH/2); sh.lineTo(-AW, AH/2); sh.lineTo(-AW, -AH/2);
  for (const [x0, x1, y0, y1] of [[1.4, 4.1, .85, 2.55], [4.6, 5.6, .01, 2.2]]) { const hp = new THREE.Path(); hp.moveTo(x0, y0 - AH/2); hp.lineTo(x0, y1 - AH/2); hp.lineTo(x1, y1 - AH/2); hp.lineTo(x1, y0 - AH/2); hp.lineTo(x0, y0 - AH/2); sh.holes.push(hp); }
  const gg = new THREE.ShapeGeometry(sh), p = gg.attributes.position, uv = gg.attributes.uv, rx = 2*AW/2.4, ry = AH/2.4; for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + AW)/(2*AW), (p.getY(i) + AH/2)/AH); roomMeshes[4].geometry = gg;
  roomMeshes[4].material.map.repeat.set(1, 1); // UV ist bereits auf die Wandgröße normiert → Wiederholung über die Textur
  roomMeshes[4].material.map = bt(rx, ry); roomMeshes[4].material.needsUpdate = true;
  applyBrick(roomMeshes[4], 2*AW, AH, 0x8a7c7c); for (const i of [2, 3, 5]) applyBrick(roomMeshes[i], i < 4 ? 2*AD : 2*AW, AH, 0x8a7c7c); skyLim = AH - 1.3;
  blocks.length = 0; const bk = () => 0;
  { const ms = (x0, x1, y0, y1, z0, z1) => pushBox(blocks, x0, x1, y0, y1, z0, z1), fz0 = -AD - .3, fz1 = -AD;   // Gebäudemasse hinter der Nordwand + Fassade der Bar (Fenster, Tür)
    ms(-AW, .6, 0, AH, -7.6, -AD); ms(6.4, AW, 0, AH, -7.6, -AD); ms(.6, 6.4, 3.2, AH, -7.6, -AD);
    ms(.6, 1.4, 0, 3.2, fz0, fz1); ms(1.4, 4.1, 0, .85, fz0, fz1); ms(1.4, 4.1, .85, 2.55, fz0 - .02, fz1); ms(1.4, 4.1, 2.55, 3.2, fz0, fz1); ms(4.1, 4.6, 0, 3.2, fz0, fz1); ms(4.6, 5.6, 2.2, 3.2, fz0, fz1); ms(5.6, 6.4, 0, 3.2, fz0, fz1); }
  const wm = (c, m = .3, r2 = .8) => mStd(c, m, r2), add = (b) => { alleyG.add(b); return b; };
  const bx = (w, h, d, mat, x, y, z) => { const o = box(w, h, d, mat, x, y, z, alleyG); o.castShadow = false; return o; }, bxs = (...a) => { const o = bx(...a); solidOf(o, blocks); return o; };
  // Fenster (Fassade), wenige beleuchtet
  const frameM = wm(0x15110f), darkG = new THREE.MeshStandardMaterial({color:0x080a0e, roughness:.05, metalness:.85, envMapIntensity:1.2}), litG = [0x6a5632, 0x4a5a5e, 0x5a4a36].map(c => new THREE.MeshBasicMaterial({color:c}));
  for (const side of [-1, 1]) for (let x = -AW + 1.4; x < AW - 1; x += 2.6) for (let y = 3.6; y < AH - 1; y += 2.3) {
    if (side < 0 && x > .2 && x < 7 && y < 4.2) continue; const zz = side*(AD - .02);
    bx(1.0, 1.3, .08, frameM, x, y, zz); const gm = Math.random() < .13 ? litG[(Math.random()*3)|0] : darkG; const gl = new THREE.Mesh(new THREE.PlaneGeometry(.8, 1.1), gm); gl.position.set(x, y, zz - side*.045); gl.rotation.y = side < 0 ? 0 : Math.PI; alleyG.add(gl);
    if (Math.random() < .3) bx(1.1, .06, .35, frameM, x, y - .68, zz - side*.15); }
  // Lichtverschmutzung: schwacher warmer Dunst an den Oberkanten
  const hazeT = canvasTex(8, 128, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "rgba(170,110,70,.55)"); g.addColorStop(1, "rgba(170,110,70,0)"); x.fillStyle = g; x.fillRect(0, 0, w, h); }, 1, 1);
  for (const side of [-1, 1]) { const hz = new THREE.Mesh(new THREE.PlaneGeometry(2*AW, 5), new THREE.MeshBasicMaterial({map:hazeT, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, opacity:.5})); hz.position.set(0, AH - 2.5, side*(AD - .03)); hz.rotation.y = side < 0 ? 0 : Math.PI; alleyG.add(hz); }
  // Rohre, Kabel, Klimageräte
  const pipeM = pipeMat(AH);
  for (const [x, side] of [[-8.6, 1], [-3.4, 1], [9.6, -1], [8.2, 1], [-10.4, -1], [-5.2, -1]]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, AH, 8), pipeM); c.position.set(x, AH/2, side*(AD - .08)); alleyG.add(c); solidOf(c, blocks); for (let y = 1.5; y < AH; y += 3.1) bx(.2, .08, .2, pipeM, x, y, side*(AD - .08)); }
  for (const [x, y, side] of [[-1.2, 5.4, 1], [5.8, 7.6, 1], [-6, 8.8, -1], [10, 6.4, -1]]) { bxs(1.0, .65, .5, wm(0x3a3f44, .5, .6), x, y, side*(AD - .25)); const fan = new THREE.Mesh(new THREE.CircleGeometry(.24, 14), new THREE.MeshBasicMaterial({color:0x07080a})); fan.position.set(x, y, side*(AD - .51)); fan.rotation.y = side < 0 ? 0 : Math.PI; alleyG.add(fan); }
  for (let k = 0; k < 7; k++) { const y = 5.4 + Math.random()*5, x0 = -AW + 2 + Math.random()*20, pts = [V3(x0, y, -AD + .1), V3(x0 + Math.random()*3 - 1.5, y - 1 - Math.random()*.8, 0), V3(x0 + Math.random()*4 - 2, y + .3, AD - .1)], cv = new THREE.CatmullRomCurve3(pts), ln = new THREE.Line(new THREE.BufferGeometry().setFromPoints(cv.getPoints(24)), new THREE.LineBasicMaterial({color:0x050505})); alleyG.add(ln); }
  // Boden: Pfützen, Müll, Container, Kisten, Automat, Fässer
  const pud = canvasTex(64, 64, (x, w, h) => { const g = x.createRadialGradient(w/2, h/2, 2, w/2, h/2, w/2); g.addColorStop(0, "rgba(120,130,150,.8)"); g.addColorStop(.7, "rgba(80,90,110,.5)"); g.addColorStop(1, "rgba(60,70,90,0)"); x.fillStyle = g; x.fillRect(0, 0, w, h); }, 1, 1);
  for (const [x, z, s] of [[-6, .2, 1.6], [.8, -.4, 1.2], [6.6, .8, 2.0], [-1.6, 1.4, .9], [9.6, -.6, 1.3], [3.2, 1.5, 1.1]]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(s*1.4, s), new THREE.MeshStandardMaterial({map:pud, transparent:true, roughness:.05, metalness:.5, depthWrite:false})); m.rotation.x = -Math.PI/2; m.position.set(x, .006, z); alleyG.add(m); }
  bxs(1.9, 1.05, .95, wm(0x2c3832, .4, .7), -6.6, .52, AD - .55); bxs(1.98, .08, 1.02, wm(0x232c28), -6.6, 1.08, AD - .55); bk(-7.6, -5.6, AD - 1.05, AD);
  bxs(.85, .75, .85, wm(0x4a3a2a, .1, .9), 8.3, .38, AD - .5); bxs(.8, .6, .8, wm(0x413226, .1, .9), 8.4, 1.05, AD - .55); bxs(.9, .7, .8, wm(0x4a3a2a, .1, .9), 9.3, .35, AD - .5); bk(7.8, 9.8, AD - 1, AD);
  for (const [x, z] of [[-3.4, -AD + .5], [-2.7, -AD + .45]]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(.33, .33, .9, 12), wm(0x5a3a28, .5, .6)); c.position.set(x, .45, z); alleyG.add(c); solidOf(c, blocks); } bk(-3.8, -2.3, -AD, -AD + .95);
  for (const [x, z, s] of [[-1.9, AD - .4, .3], [-1.45, AD - .5, .25], [-2.3, AD - .55, .28]]) { const b = new THREE.Mesh(new THREE.SphereGeometry(s, 8, 6), wm(0x0a0a0c, .1, .3)); b.scale.y = .72; b.position.set(x, s*.6, z); alleyG.add(b); solidOf(b, blocks); } bk(-2.8, -1.2, AD - .95, AD);
  { const vm = bxs(.95, 1.85, .7, wm(0x262c33, .5, .5), 1.2, .92, AD - .42); const sc = new THREE.Mesh(new THREE.PlaneGeometry(.7, 1.1), new THREE.MeshBasicMaterial({map:canvasTex(128, 192, (x, w, h) => { x.fillStyle = "#3a2c18"; x.fillRect(0, 0, w, h); x.fillStyle = "#7a5a2a"; for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) x.fillRect(10 + c*38, 14 + r*34, 28, 26); x.fillStyle = "#d8a24a"; x.font = "bold 16px monospace"; x.fillText("AUTOMAT", 22, h - 12); }, 1, 1)})); sc.position.set(1.2, 1.05, AD - .775); sc.rotation.y = Math.PI; alleyG.add(sc); bk(.6, 1.8, AD - .8, AD); const vl = new THREE.PointLight(0xd8a24a, .5, 3.5, 2); vl.position.set(1.2, 1.2, AD - 1.2); alleyG.add(vl); }
  // Abfluss / Ausstieg der Spinne (Westwand)
  const outl = new THREE.Mesh(new THREE.PlaneGeometry(1.0, .7), new THREE.MeshBasicMaterial({color:0x060708})); outl.position.set(-AW + .02, .35, 0); outl.rotation.y = Math.PI/2; alleyG.add(outl); const grate = bx(.8, .55, .03, wm(0x4a4a4e, .7, .5), -AW + .9, .3, .5); grate.rotation.set(-.35, .5, 0); bx(.04, .75, 1.1, wm(0x2a2a2c), -AW + .03, .4, 0);
  // Poster an der Ostwand
  const post = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 3.2), new THREE.MeshBasicMaterial({map:canvasTex(220, 320, (x, w, h) => { x.fillStyle = "#2a2e34"; x.fillRect(0, 0, w, h); x.fillStyle = "#6a6a66"; x.fillRect(14, 14, w - 28, h*.5); x.fillStyle = "#14161a"; x.font = "bold 30px monospace"; x.fillText("KRONOS", 28, h*.7); x.font = "16px monospace"; x.fillText("ROBOTICS · SEKTOR 7", 22, h*.77); x.font = "13px monospace"; x.fillText("Wir bauen morgen.", 28, h*.84);
      x.globalAlpha = .55; for (let i = 0; i < 30; i++) { x.fillStyle = "#08090b"; x.fillRect(Math.random()*w, Math.random()*h, 4 + Math.random()*40, 2 + Math.random()*10); } }, 1, 1), transparent:false})); post.position.set(AW - .02, 2.4, .5); post.rotation.y = -Math.PI/2; alleyG.add(post);
  // Neonschilder (gedämpft, nur zwei Farben + blasses Weiß)
  neonSign("BAR", "#3fb8a8", 1.3, .5, V3(5.1, 2.85, -AD + .03), 0, false, null, 0x3fb8a8, .9);
  neonSign("HOTEL", "#d8562f", .55, 2.6, V3(-3.0, 5.6, AD - .03), Math.PI, true, 3, 0xd8562f, 1.0);
  neonSign("ÖL+TEILE", "#cfd6e0", 1.3, .36, V3(7.2, 2.7, AD - .03), Math.PI, false, null, 0xcfd6e0, .4);
  neonSign("OPEN", "#d8562f", .6, .22, V3(2.75, 2.2, -AD + .03), 0, false, null, 0xd8562f, .25);
  // Natriumlampe am Ostende
  bx(.1, .1, .6, pipeM, 9.8, 4.6, AD - .3); const lampM = new THREE.Mesh(new THREE.SphereGeometry(.13, 8, 6), new THREE.MeshBasicMaterial({color:0xe8b060})); lampM.position.set(9.8, 4.5, AD - .6); alleyG.add(lampM);
  sodium = new THREE.PointLight(0xd89a4a, 1.3, 11, 1.4); sodium.position.set(9.8, 4.3, AD - .9); alleyG.add(sodium);
  buildBar();
  const spill = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.4), new THREE.MeshBasicMaterial({map:hazeT, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, opacity:.45, color:0xffa860})); spill.rotation.x = -Math.PI/2; spill.rotation.z = Math.PI/2; spill.position.set(2.75, .012, -AD + 1.3); alleyG.add(spill);
  // Stehtisch
  const tbl = new THREE.Group(); tbl.position.set(3.2, 0, -1.4); alleyG.add(tbl); const tm = wm(0x3a3d42, .6, .5);
  const c1 = new THREE.Mesh(new THREE.CylinderGeometry(.25, .27, .03, 14), tm); c1.position.y = .015; tbl.add(c1); const c2 = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, 1.0, 8), tm); c2.position.y = .5; tbl.add(c2); const c3 = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, .04, 16), wm(0x5a4a3a, .2, .6)); c3.position.y = 1.02; tbl.add(c3); tbl.updateMatrixWorld(true); for (const m of [c1, c2, c3]) solidOf(m, blocks);
  for (const [gx, gz] of [[0, .12], [-.1, -.1]]) { const g2 = new THREE.Mesh(new THREE.CylinderGeometry(.03, .026, .08, 8), new THREE.MeshStandardMaterial({color:0xcad4de, transparent:true, opacity:.35})); g2.position.set(gx, 1.08, gz); tbl.add(g2); } bk(2.4, 4.0, -2.2, -.6);
  // zwei Roboter
  const A = makeRobot({body:0x6a6f64, acc:0x8a4a2a, glow:0xe6a45a}), B = makeRobot({body:0x586070, acc:0xa08a58, glow:0x9fd4cc});
  A.g.position.set(2.56, 0, -1.4); A.g.rotation.y = Math.PI/2; B.g.position.set(3.84, 0, -1.4); B.g.rotation.y = -Math.PI/2; alleyG.add(A.g, B.g); robots.length = 0; robots.push(A, B); 
  // Dampf
  const stT = canvasTex(64, 64, (x, w, h) => { const g = x.createRadialGradient(w/2, h/2, 2, w/2, h/2, w/2); g.addColorStop(0, "rgba(150,150,160,.55)"); g.addColorStop(1, "rgba(150,150,160,0)"); x.fillStyle = g; x.fillRect(0, 0, w, h); }, 1, 1);
  for (let i = 0; i < 7; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({map:stT, transparent:true, depthWrite:false, opacity:0})); s.userData = {u:i/7}; alleyG.add(s); steamS.push(s); }
  bx(.5, .12, .5, pipeM, -9.0, .06, AD - .5); bx(.1, .5, .1, pipeM, -9.0, .35, AD - .5);
  scene.fog = new THREE.FogExp2(0x0a0b0f, .036); scene.background = new THREE.Color(0x000000);
}
function enterAlley() {
  cpSet("alley"); shaft.on = false; shaft.cur = null; while (shaftG.children.length) { const o = shaftG.children.pop(); o.traverse(c => { if (c.geometry) c.geometry.dispose(); }); } fanG = null; sealL = null;
  document.body.classList.remove("shaft"); story.ph = "alley"; story.lvl = 4; sirenOn(false); story.night = 1; story.lampT = 2.2; story.emerT = 0; story.flick = 0; story.dustA = 0; alarmL.intensity = 0; fill.intensity = 0; sirenOn(false);
  testG.visible = winG.visible = labG.visible = false; for (const o of doorParts) o.visible = false; ventG.visible = ventF.visible = hole.visible = false; terms.forEach(T => { T.active = false; T.g.visible = false; }); mann.visible = false; dust.visible = false; for (const s of shards) s.m.visible = false;
  for (const o of ceilLights) o.visible = false;
  buildAlley(); alleyG.visible = true; alley.on = true; alley.t = 0; alley.step = 0; alley.wait = 3; alley.reacted = false; alley.q = []; spider.visible = true;
  lamp.distance = 7; lamp.decay = 1.3; lamp.color.setHex(0xffe6cc);
  placeAt(-AW + 1.6, HIP_H*S, 0, 0,1,0, 1,0,0);
  for (const R of robots) drawFace(R, 0);
  setObj("Du bist draußen. Die Bar hat noch offen – geh einfach hinein."); toast("Kapitel 1 · Epilog");
  setTimeout(() => { $("fade").classList.remove("on"); setTimeout(() => { $("fade").style.background = ""; }, 900); }, 350);
}
const _rt = V3();
function alleyTick(dt) {
  if (!alley.on) return; alley.t += dt; const t = alley.t;
  alley.inBar = pos.x > .7 && pos.x < 6.3 && pos.z < -AD - .05 && pos.y < 3.2;
  lamp.position.set(clamp(pos.x + nS.x*.8, -AW + .3, AW - .3), clamp(pos.y + nS.y*.8 + .15, .2, alley.inBar ? 3.0 : AH - .3), clamp(pos.z + nS.z*.8, alley.inBar ? -7.4 : -AD + .2, AD - .2));
  for (const n of NEON) { n.fl -= dt; let f = 1; if (n.fl < 0) { if (Math.random() < .03) n.fl = .05 + Math.random()*.12; else n.fl = 0; } if (n.fl > 0) f = .15 + Math.random()*.5; n.l.intensity = n.base*f; n.m.material.opacity = .55 + .45*f; }
  if (sodium) sodium.intensity = 1.2 + .15*Math.sin(t*3.1) + (Math.random() < .01 ? -.6 : 0); if (barLight) barLight.intensity = 1.2 + .08*Math.sin(t*1.3);
  for (const s of steamS) { s.userData.u = (s.userData.u + dt*.18)%1; const u = s.userData.u; s.position.set(-9.0 + Math.sin(u*6 + s.id)*.25, .5 + u*3.4, AD - .5 - u*.3); s.scale.setScalar(.5 + u*1.6); s.material.opacity = Math.sin(Math.PI*u)*.5; }
  streetRobots(dt, t); barTick(dt, t);
}
