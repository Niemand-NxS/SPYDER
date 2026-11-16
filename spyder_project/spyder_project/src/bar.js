/* ======================= Roboter-Details, IK-Arme, Dialoge, Bar-Innenraum ======================= */
let robWearT = null;
function robWear() {
  if (!robWearT) robWearT = canvasTex(128, 128, (x, w, h) => { x.fillStyle = "#d6d6d2"; x.fillRect(0, 0, w, h); speckle(x, w, h, 900, .25);
    for (let i = 0; i < 9; i++) { const px = Math.random()*w, py = Math.random()*h, g = x.createRadialGradient(px, py, 1, px, py, 8 + Math.random()*14); g.addColorStop(0, "rgba(120,70,40,.55)"); g.addColorStop(1, "rgba(120,70,40,0)"); x.fillStyle = g; x.fillRect(0, 0, w, h); }
    x.strokeStyle = "rgba(40,40,40,.45)"; x.lineWidth = 1; for (let i = 0; i < 14; i++) { x.beginPath(); const px = Math.random()*w, py = Math.random()*h; x.moveTo(px, py); x.lineTo(px + Math.random()*22 - 11, py + Math.random()*22 - 11); x.stroke(); } }, 1, 1);
  return robWearT;
}
function robotDetails(R, g, add, body, acc, dk, o) {
  body.map = imgTex("m52C", 1.6, 1.6); body.normalMap = imgTex("m52N", 1.6, 1.6); body.roughnessMap = imgTex("m52R", 1.6, 1.6); body.normalScale.set(.9, .9); body.metalness = .55; body.roughness = 1; body.needsUpdate = true;   // Metal052C: gebürsteter, verwitterter Stahl
  for (const m of new Set([dk, acc])) { if (!m || m.isMeshBasicMaterial || m.map) continue; m.map = imgTex("m38C", 1.4, 1.4); m.normalMap = imgTex("m38N", 1.4, 1.4); m.roughnessMap = imgTex("m38R", 1.4, 1.4); m.metalness = Math.max(m.metalness || 0, .5); m.roughness = 1; m.needsUpdate = true; }   // Metal038: dunkler Zinkstahl
  R.legs = g.children.filter(c => c.isGroup && Math.abs(c.position.y - .78) < 1e-6); R.shins = R.legs.map(l => l.children.find(c => c.isGroup));
  const steel = mStd(0x8a929c, .8, .35), slot = new THREE.MeshBasicMaterial({color:0x020304});
  R.legs.forEach((leg, i) => { const s = i ? 1 : -1; add(new THREE.CylinderGeometry(.011, .011, .36, 6), steel, 0, -.22, .06, leg); add(new THREE.BoxGeometry(.09, .07, .02), acc, 0, -.46, .06, leg); add(new THREE.CylinderGeometry(.052, .052, .03, 8), dk, 0, -.1, 0, leg); R.shins[i].children.forEach(() => 0); add(new THREE.BoxGeometry(.01, .22, .01), steel, s*.03, -.15, .04, R.shins[i]); });
  add(new THREE.BoxGeometry(.26, .035, .19), acc, 0, .9, 0);
  add(new THREE.BoxGeometry(.2, .3, .08), dk, 0, 1.08, -.14); add(new THREE.BoxGeometry(.14, .04, .02), new THREE.MeshBasicMaterial({color:o.glow}), 0, 1.02, -.185);
  for (let i = 0; i < 3; i++) add(new THREE.BoxGeometry(.1, .012, .01), dk, -.04, 1.02 + i*.03, .132);
  for (const s of [-1, 1]) { add(new THREE.BoxGeometry(.12, .05, .14), acc, s*.19, 1.335, 0); add(new THREE.CylinderGeometry(.012, .012, .12, 6), dk, s*.045, 1.33, .02).rotation.z = Math.PI/2 + s*.3; }
  for (const s of [-1, 1]) { const e = add(new THREE.CylinderGeometry(.055, .055, .03, 10), dk, s*.19, .16, 0, R.head); e.rotation.z = Math.PI/2; const e2 = add(new THREE.CylinderGeometry(.03, .03, .035, 10), acc, s*.2, .16, 0, R.head); e2.rotation.z = Math.PI/2; }
  add(new THREE.BoxGeometry(.13, .024, .03), slot, 0, .025, .105, R.head);
  for (let i = 0; i < 4; i++) add(new THREE.BoxGeometry(.04, .01, .01), dk, -.12 + i*.016, .3, .08, R.head);
  if (o.pouch) { add(new THREE.BoxGeometry(.1, .09, .06), mStd(0x4a3a2a, .1, .9), .15, .86, .08); add(new THREE.BoxGeometry(.1, .02, .065), mStd(0x32261c, .1, .9), .15, .91, .08); }
  if (o.scarf) { add(new THREE.CylinderGeometry(.085, .09, .06, 10), mStd(o.scarf, 0, .95), 0, 1.33, 0); const tl = add(new THREE.BoxGeometry(.06, .3, .015), mStd(o.scarf, 0, .95), .05, 1.18, .1); tl.rotation.z = .05; R.tail = tl; }
  if (o.tape) { const tp = add(new THREE.CylinderGeometry(.037, .037, .06, 8), mStd(0xd8d2c0, 0, .9), 0, -.1, 0, R.aL); tp.scale.set(1, 1, 1); }
  if (o.apron) { add(new THREE.BoxGeometry(.22, .34, .02), mStd(o.apron, 0, .95), 0, .98, .119); add(new THREE.BoxGeometry(.03, .03, .02), dk, .09, 1.15, .138); }
  if (o.cracks) R.crack = true;
  R.g.userData.d = 1;
}
/* ---- 2-Segment-IK für die Arme (im Roboter-Koordinatensystem) ---- */
const _ia = V3(), _ib = V3(), _ic = V3(), _ie = V3(), _q1r = new THREE.Quaternion(), _q2r = new THREE.Quaternion(), _dn = V3(0, -1, 0), _px = V3(1, 0, 0);
function arm2(A, F, tx, ty, tz, px, py, pz, out) {
  const L1 = .3, L2 = .33, sh = A.position; _ia.set(tx - sh.x, ty - sh.y, tz - sh.z); const d = Math.min(_ia.length(), L1 + L2 - .006, ); const dd = Math.max(d, Math.abs(L1 - L2) + .02); _ia.normalize();
  const ca = clamp((L1*L1 + dd*dd - L2*L2)/(2*L1*dd), -1, 1), sa = Math.sqrt(1 - ca*ca);
  _ib.set(px, py, pz); _ib.addScaledVector(_ia, -_ib.dot(_ia)); if (_ib.lengthSq() < 1e-6) _ib.set(0, -1, 0); _ib.normalize();
  _ie.copy(_ia).multiplyScalar(L1*ca).addScaledVector(_ib, L1*sa);
  _ic.copy(_ia).multiplyScalar(dd).sub(_ie).normalize();
  A.quaternion.setFromUnitVectors(_dn, _ie.clone().normalize()); _q2r.setFromUnitVectors(_dn, _ic); F.quaternion.copy(A.quaternion).invert().multiply(_q2r);
  if (out) out.copy(_q2r);
}
/* ---- Stimmen & Stimmung ---- */
const MOOD = {w:{vol:.55, speed:1.15, f0:1}, "!":{vol:1.25, speed:.92, f0:1.08}, t:{vol:.8, speed:1.25, f0:.88}, j:{vol:1, speed:.9, f0:1.1}};
VOICES.push({f0:118, fs:1.0, vol:.55, robot:.8, speed:1.0}, {f0:80, fs:.88, vol:.45, robot:.9, speed:1.35});
ROBN.push("BARKEEPER · KLIRR", "GAST · SCHNARCH");
let speechEnd = 0; const speakBusy = () => performance.now()/1000 < speechEnd || mode === "cut";
function speakR(R, vi, text, mood) {
  text = T(text);
  R.g.getWorldPosition(_wp); const d = Math.hypot(pos.x - _wp.x, pos.z - _wp.z), vv = Object.assign({}, VOICES[vi]), m = MOOD[mood]; vv.vol *= opt.voice;
  if (m) { vv.vol *= m.vol; vv.speed *= m.speed; vv.f0 *= m.f0; } vv.vol *= clamp(1.25/(1 + d*.28), .12, 1.1);
  const s = speakVowels(text, vv); speechEnd = performance.now()/1000 + s.dur + .3; R.talkT = s.dur + .1; R.ev = s.ev; R.tAt = 0; R.text = text; if (d < 9 && opt.subs) say(ROBN[vi], text, s.dur + .7); return s.dur;
}
function speakAt(i, text, force, mood) { return speakR(robots[i], i, text, mood); }
/* ---- Dialog (Gasse) ---- */
const DLG = [[0,"Hast du das Beben gespürt?"],[1,"Zweimal. Mein Glas ist fast vom Tisch gehüpft."],[-1,0],[0,"Das war kein Beben. Das war KRONOS. Die graben wieder.","!"],[1,"Pssst! Nicht so laut, Bruder.","w"],[0,"Pah. Wer hört uns schon zu? Die Bar ist leer."],[1,"Genau deshalb trinken wir hier."],[-1,1],
 [0,"Noch ein Glas?"],[1,"Immer."],[-1,-1],[1,"Weißt du, was ich vermisse? Den Regen. Richtigen Regen."],[0,"Du hast doch gar keine Sensoren dafür."],[1,"Eben. Das ist ja das Problem.","t"],[-1,0],
 [0,"Hast du von der Schicht in Sektor sieben gehört?"],[1,"Die Nachtschicht? Die sind heute alle früher gegangen."],[0,"Früher? Seit wann geht bei KRONOS irgendwer früher?","!"],[1,"Seit sie dem Prototyp den Strom gekappt haben."],[0,"Welchem Prototyp?"],[1,"Na, diesem Achtbeiner. Soll angeblich laufen wie ein Tier.","w"],[0,"Hah! Ein Roboter, der läuft wie ein Tier. Als ob wir das nicht alle wollten.","j"],[-1,1],
 [1,"Die Ingenieure haben getuschelt. Morgen früh soll er zerlegt werden."],[0,"Zerlegt. Wie bei unserer letzten Wartung.","t"],[1,"Sag das nicht. Meine Gelenke tun immer noch weh."],[-1,0],
 [0,"Mein Chef schuldet mir drei Monate Ölration."],[1,"Dein Chef ist ein Stehpult mit Display."],[0,"Und hat trotzdem mehr Rechte als ich.","j"],[1,"Haha! Das schreib ich mir auf.","j"],[-1,-1],
 [1,"Hörst du das Summen aus den Rohren?"],[0,"Das sind die Lüftungen. Die summen immer."],[1,"Nein. Heute klingt es anders. Fast wie… Schritte.","w"],[0,"Du hast zu viel Billigöl getrunken, Fiep.","j"],[-1,1],[-1,0],
 [0,"Noch eine Runde, dann gehen wir heim."],[1,"Heim? In den Container hinter der Fabrik?"],[0,"Es ist trocken. Meistens."],[1,"Prost, Brumm.","j"],[0,"Auf den Regen.","t"],[-1,-1]];
/* Reaktionen auf die Spinne (zufällig, ketten sich an) */
const REACT = [[[0,"Hm?"],[1,"Was ist?"],[0,"Da. An der Wand. Hast du das auch gesehen?","w"],[1,"Eine Ratte. Eine große.","t"]],
  [[1,"Brumm. Brumm! Da krabbelt was."],[0,"Hm? Wo?"],[1,"Eben noch da. Mit vielen Beinen.","w"],[0,"Ach. Hier gibt es eine Menge Viecher. Trink aus.","t"]],
  [[0,"Das ist keine Ratte."],[1,"Nein. Das sieht eher aus wie… Eigentum von KRONOS.","w"],[0,"Dann haben wir nichts gesehen.","!"],[1,"Gar nichts. Prost."]]];
/* ======================= Bar ======================= */
let barG = null, barDoor = null;
function setDoorAng(th) { barDoor.rotation.y = th; barDoor.position.x = BDOOR + .5 - .5*Math.cos(th); barDoor.position.z = BD - .05 + .5*Math.sin(th); }
const BW = 2.9, BD = 2.5, BH = 3.2, BX = 3.5, BZ = -5.1, barBots = [], BDOOR = 1.6;
const bpb = (x0, x1, y0, y1, z0, z1) => pushBox(blocks, x0 + BX, x1 + BX, y0, y1, z0 + BZ, z1 + BZ);
let barTV = null, barFan = null, barLamps = [], barSpill = null;
function barTexts() {
  const floor = canvasTex(128, 128, (x, w, h) => { x.fillStyle = "#43301f"; x.fillRect(0, 0, w, h); for (let i = 0; i < 8; i++) { x.fillStyle = i%2 ? "#3a2819" : "#4c3724"; x.fillRect(0, i*16, w, 15); } speckle(x, w, h, 900, .22); x.strokeStyle = "rgba(0,0,0,.5)"; for (let i = 0; i < 8; i++) { x.beginPath(); x.moveTo(0, i*16); x.lineTo(w, i*16); x.stroke(); } }, 2*BW/1.6, 2*BD/1.6);
  const wall = (len) => canvasTex(256, 256, (x, w, h) => { x.fillStyle = "#2a1c15"; x.fillRect(0, 0, w, h); speckle(x, w, h, 2500, .2); x.fillStyle = "#3a2619"; x.fillRect(0, h*.55, w, h*.45); x.fillStyle = "#6a4a2a"; x.fillRect(0, h*.55 - 3, w, 6); x.strokeStyle = "rgba(0,0,0,.45)"; for (let i = 0; i < 6; i++) { x.beginPath(); x.moveTo(i*w/5, h*.55); x.lineTo(i*w/5, h); x.stroke(); }
    for (let i = 0; i < 40; i++) { x.fillStyle = "rgba(20,12,8,.25)"; x.fillRect(Math.random()*w, Math.random()*h*.55, 1 + Math.random()*3, 8 + Math.random()*30); } }, len/2.4, BH/2.4);
  return {floor, wall};
}
function buildBar() {
  barG = new THREE.Group(); barG.position.set(BX, 0, BZ); alleyG.add(barG); barBots.length = 0; barLamps.length = 0;
  const T = barTexts(), ceil = canvasTex(8, 8, (x, w, h) => { x.fillStyle = "#1c130e"; x.fillRect(0, 0, w, h); }, 1, 1);
  const pl = (w, h, tex, x, y, z, rx, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({map:tex, roughness:.92})); m.position.set(x, y, z); m.rotation.set(rx, ry, 0); m.receiveShadow = true; barG.add(m); return m; };
  pl(2*BW, 2*BD, T.floor, 0, .006, 0, -Math.PI/2, 0).material = pbrMat("plk", 3.4, 2.6, 0xb09c86, 0); pl(2*BW, 2*BD, ceil, 0, BH, 0, Math.PI/2, 0);
  pl(2*BD, BH, T.wall(2*BD), -BW, BH/2, 0, 0, Math.PI/2); pl(2*BD, BH, T.wall(2*BD), BW, BH/2, 0, 0, -Math.PI/2); pl(2*BW, BH, T.wall(2*BW), 0, BH/2, -BD, 0, 0);
  // Südwand (zur Gasse) mit Schaufenster und Tür
  const sh = new THREE.Shape(); sh.moveTo(-BW, -BH/2); sh.lineTo(BW, -BH/2); sh.lineTo(BW, BH/2); sh.lineTo(-BW, BH/2); sh.lineTo(-BW, -BH/2);
  for (const [x0, x1, y0, y1] of [[-.6, 2.1, .85, 2.55], [-BDOOR - .5, -BDOOR + .5, .01, 2.2]]) { const hp = new THREE.Path(); hp.moveTo(x0, y0 - BH/2); hp.lineTo(x0, y1 - BH/2); hp.lineTo(x1, y1 - BH/2); hp.lineTo(x1, y0 - BH/2); hp.lineTo(x0, y0 - BH/2); sh.holes.push(hp); }
  const gg = new THREE.ShapeGeometry(sh), p = gg.attributes.position, uv = gg.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, (-p.getX(i) + BW)/(2*BW), (p.getY(i) + BH/2)/BH);
  { const sw = pl(2*BW, BH, T.wall(2*BW), 0, BH/2, BD - .02, 0, Math.PI); sw.geometry = gg; sw.position.y = BH/2; }
  const wm = (c, m = .2, r = .7) => mStd(c, m, r), bx = (w, h, d, mat, x, y, z, par) => { const o = box(w, h, d, mat, x, y, z, par || barG); o.castShadow = false; return o; };
  const bxs = (...a) => { const o = bx(...a); solidOf(o, blocks); return o; };
  const wood = pbrMat("wood", 2, 1, 0xc0a088, 0), light = pbrMat("wood", 1, 1, 0xe8c8a0, 0), dark = wm(0x15100c, .4, .5), steel = wm(0x8a929c, .8, .35);
  const frm = wm(0x15100c, .3, .6); bx(2.9, .08, .1, frm, -.75, 2.58, BD - .05); bx(2.9, .08, .1, frm, -.75, .83, BD - .05); bx(.08, 1.78, .1, frm, -2.14, 1.7, BD - .05); bx(.08, 1.78, .1, frm, .64, 1.7, BD - .05); bx(.05, 1.7, .05, frm, -.75, 1.7, BD - .05);
  bx(1.1, .08, .17, frm, BDOOR, 2.24, BD - .03); bx(.08, 2.2, .17, frm, BDOOR - .54, 1.1, BD - .03); bx(.08, 2.2, .17, frm, BDOOR + .54, 1.1, BD - .03);
  const dm = barDoor = bx(1.0, 2.2, .04, wm(0x23304a, .5, .55), BDOOR, 1.1, BD - .05); setDoorAng(-1.5);     // Tür steht offen
  // Tresen mit Hocker
  bx(4.3, 1.0, .7, wood, -.25, .5, -1.3); bx(4.4, .07, .85, light, -.25, 1.04, -1.3); bx(4.2, .04, .1, steel, -.25, .62, -.93); bpb(-2.45, 1.95, 0, 1.08, -1.73, -.87);
  for (let i = 0; i < 4; i++) { const sx = -1.5 + i*1.1, st = new THREE.Group(); st.position.set(sx, 0, -.62); barG.add(st); const a = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, .7, 6), dark); a.position.y = .35; st.add(a); const b = new THREE.Mesh(new THREE.CylinderGeometry(.2, .2, .07, 12), wm(0x6a2a22, .1, .6)); b.position.y = .72; st.add(b); const c = new THREE.Mesh(new THREE.TorusGeometry(.14, .012, 6, 14), steel); c.rotation.x = Math.PI/2; c.position.y = .25; st.add(c); const f = new THREE.Mesh(new THREE.CylinderGeometry(.18, .2, .02, 12), dark); f.position.y = .01; st.add(f); if (i === 2) { st.rotation.z = 1.25; st.position.y = .2; st.position.x += .1; } st.updateMatrixWorld(true); st.children.forEach(m => solidOf(m, blocks)); }
  // Rückwand: Regale mit Flaschen, Spiegel, Zapfhähne
  bx(5.4, 2.3, .12, wm(0x1a120c), 0, 1.4, -BD + .06); for (const y of [1.2, 1.65, 2.1]) bx(5.0, .04, .3, wood, 0, y, -BD + .25);
  const bm = [0x8a5a20, 0x3a6a4a, 0x7a2a22, 0x6a6a5a, 0x4a3a6a]; for (let i = 0; i < 36; i++) { const k = i%12, row = (i/12)|0, c = bm[(i*7)%5], b = new THREE.Mesh(new THREE.CylinderGeometry(.034, .04, .24 + (i%3)*.04, 8), new THREE.MeshStandardMaterial({color:c, emissive:c, emissiveIntensity:.3, roughness:.3, transparent:true, opacity:.9})); b.position.set(-2.2 + k*.4 + (row%2)*.1, [1.2, 1.65, 2.1][row] + .14, -BD + .27); barG.add(b); }
  bpb(-2.7, 2.7, .25, 2.55, -BD, -BD + .12); for (const y of [1.2, 1.65, 2.1]) bpb(-2.5, 2.5, y - .02, y + .02, -BD, -BD + .4);
  for (let i = 0; i < 3; i++) { bx(.05, .22, .05, steel, -1.0 + i*.22, 1.2, -1.28); bx(.07, .06, .07, wm(0xa08a58), -1.0 + i*.22, 1.34, -1.28); }
  bx(.5, .3, .35, wm(0x3a3d42, .6, .4), 1.6, 1.23, -1.4); const rg = new THREE.Mesh(new THREE.PlaneGeometry(.36, .12), new THREE.MeshBasicMaterial({map:canvasTex(128, 40, (x, w, h) => { x.fillStyle = "#0a1410"; x.fillRect(0, 0, w, h); x.fillStyle = "#6ab86a"; x.font = "bold 26px monospace"; x.fillText("0.00", 8, 30); }, 1, 1)})); rg.position.set(1.6, 1.28, -1.22); barG.add(rg);
  for (let i = 0; i < 5; i++) { const gl = new THREE.Mesh(new THREE.CylinderGeometry(.03, .026, .08, 8), new THREE.MeshStandardMaterial({color:0xcad4de, transparent:true, opacity:.3, roughness:.1})); gl.position.set(-.3 + i*.35, 1.12, -1.2 + (i%2)*.1); barG.add(gl); }
  // Tische, Stühle, Sitzbank
  for (const [tx, tz] of [[-2.2, 1.0], [-2.3, -.2]]) { const t = new THREE.Group(); t.position.set(tx, 0, tz); barG.add(t); const top = new THREE.Mesh(new THREE.CylinderGeometry(.4, .4, .04, 14), light); top.position.y = .75; t.add(top); const lg = new THREE.Mesh(new THREE.CylinderGeometry(.04, .06, .75, 8), dark); lg.position.y = .37; t.add(lg); t.updateMatrixWorld(true); t.children.forEach(m => solidOf(m, blocks)); }
  for (const [cx, cz, ry] of [[-1.55, 1.0, 1.6], [-2.2, 1.65, 3.1], [-1.65, -.3, 1.4], [-2.95, -.15, -1.5]]) { const c = new THREE.Group(); c.position.set(cx, 0, cz); c.rotation.y = ry; barG.add(c); bx(.34, .04, .34, wood, 0, .42, 0, c); bx(.34, .4, .03, wood, 0, .64, -.16, c); for (const [lx, lz] of [[-.14, -.14], [.14, -.14], [-.14, .14], [.14, .14]]) bx(.03, .42, .03, dark, lx, .21, lz, c); c.updateMatrixWorld(true); c.children.forEach(m => solidOf(m, blocks)); }
  { const l1 = leatherMat(1, 1, 0xffffff), l2 = leatherMat(1, 1, 0xe0c0b0); const s1 = rbox(.6, .45, 1.9, .08, l1, BW - .35, .24, .9, barG); s1.castShadow = false; solidOf(s1, blocks); const s2 = rbox(.14, .62, 1.9, .07, l2, BW - .1, .75, .9, barG); s2.castShadow = false; solidOf(s2, blocks); } bxs(.7, .06, .8, light, BW - .95, .72, .9); bxs(.06, .7, .06, dark, BW - .95, .36, .9);
  // Jukebox, Fernseher, Poster, Dartscheibe, Ventilator, Lampen
  { const jb = new THREE.Group(); jb.position.set(-BW + .4, 0, 1.55); barG.add(jb); bxs(.5, 1.4, .9, wm(0x4a2a3a, .3, .5), 0, .7, 0, jb); const arch = new THREE.Mesh(new THREE.CylinderGeometry(.45, .45, .5, 14, 1, false, 0, Math.PI), wm(0x7a5a2a, .4, .4)); arch.rotation.z = Math.PI/2; arch.position.set(0, 1.4, 0); arch.rotation.y = 0; jb.add(arch); jb.updateMatrixWorld(true); solidOf(arch, blocks);
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(.7, .8), new THREE.MeshBasicMaterial({color:0x6a5a3a})); gl.position.set(.26, .95, 0); gl.rotation.y = Math.PI/2; jb.add(gl); }
  barTV = new THREE.Mesh(new THREE.PlaneGeometry(.9, .55), new THREE.MeshBasicMaterial({map:canvasTex(160, 100, () => {}, 1, 1)})); barTV.position.set(BW - .08, 2.1, -.9); barTV.rotation.y = -Math.PI/2; barG.add(barTV); bxs(.1, .62, .98, dark, BW - .04, 2.1, -.9); barTV.userData = {cx:barTV.material.map.image.getContext("2d")};
  const post = new THREE.Mesh(new THREE.PlaneGeometry(.8, 1.1), new THREE.MeshBasicMaterial({map:canvasTex(80, 110, (x, w, h) => { x.fillStyle = "#6a6458"; x.fillRect(0, 0, w, h); x.fillStyle = "#1a1612"; x.font = "bold 13px monospace"; x.fillText("ÖL-HAPPY", 8, 24); x.fillText("HOUR", 8, 40); x.font = "10px monospace"; x.fillText("22–23 UHR", 8, 62); x.fillText("2 für 1", 8, 76); x.strokeStyle = "#8a2a22"; x.lineWidth = 3; x.strokeRect(4, 4, w - 8, h - 8); }, 1, 1)})); post.position.set(-BW + .02, 1.7, -.6); post.rotation.y = Math.PI/2; barG.add(post);
  const dart = new THREE.Mesh(new THREE.CircleGeometry(.22, 20), new THREE.MeshBasicMaterial({map:canvasTex(64, 64, (x, w, h) => { x.fillStyle = "#1a1612"; x.fillRect(0, 0, w, h); for (let i = 5; i > 0; i--) { x.fillStyle = i%2 ? "#7a2a22" : "#3a5a3a"; x.beginPath(); x.arc(w/2, h/2, i*6, 0, 7); x.fill(); } }, 1, 1)})); dart.position.set(-BW + .02, 1.5, -1.5); dart.rotation.y = Math.PI/2; barG.add(dart);
  barFan = new THREE.Group(); barFan.position.set(0, BH - .35, .2); barG.add(barFan); { const rod = new THREE.Mesh(new THREE.CylinderGeometry(.015, .015, .3, 6), dark); rod.position.y = .2; barFan.add(rod); for (let i = 0; i < 4; i++) { const bl = bx(.7, .015, .12, wm(0x3a2a1c), .38, 0, 0, barFan); bl.rotation.y = 0; const pv = new THREE.Group(); barFan.add(pv); pv.rotation.y = i*Math.PI/2; pv.add(bl); } }
  for (const [lx, lz] of [[-1.5, -.3], [1.5, -.3], [-2.2, .9]]) { const cord = new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, .8, 4), dark); cord.position.set(lx, BH - .4, lz); barG.add(cord); const sh2 = new THREE.Mesh(new THREE.ConeGeometry(.2, .18, 12, 1, true), new THREE.MeshBasicMaterial({color:0xe0a860, side:THREE.DoubleSide})); sh2.position.set(lx, BH - .9, lz); barG.add(sh2); }
  barLamps.push(new THREE.PointLight(0xffa860, 1.0, 7, 1.5), new THREE.PointLight(0xe09858, .9, 6, 1.5)); barLamps[0].position.set(-.6, 2.35, -.3); barLamps[1].position.set(1.6, 2.2, .3); barG.add(...barLamps);
  const tvl = new THREE.PointLight(0x8aa0c8, .35, 3.5, 1.5); tvl.position.set(BW - .6, 2.1, -.9); barG.add(tvl); barLamps.push(tvl);
  bxs(.6, 1.9, .6, wm(0x262c33, .5, .5), -BW + .3, .95, -BD + .3);          // Kühlschrank
  for (const [x, z, s] of [[2.3, 1.9, .26], [-.5, 2.0, .2]]) { bxs(s*2, s*2, s*2, wm(0x4a3a2a, .1, .9), x, s, z); }
  // Barkeeper und Gast
  const C = makeRobot({body:0x6a7078, acc:0x8a3a2a, glow:0xf2b86a, apron:0x5a4a38, tape:true}); C.g.position.set(.1, 0, -1.85); barG.add(C.g); C.mode = "bar"; C.hp = 0; setLevel(C, 0); bpb(-.15, .35, 0, 1.75, -2.1, -1.6);
  const Z = makeRobot({body:0x4a5058, acc:0x6a5a3a, glow:0x7aa0a8, scarf:0x7a3a2a, pouch:true}); Z.g.position.set(1.7, 0, -.55); Z.g.rotation.y = Math.PI; barG.add(Z.g); Z.mode = "sleep"; bpb(1.45, 1.95, 0, 1.65, -.85, -.3);
  Z.legs.forEach(l => l.rotation.x = -1.45); Z.shins.forEach(s => s.rotation.x = 1.5); barBots.push(C, Z);
}
const _tg = V3();
function robotArms(R, t, dt, P) {      // P: Ruhepunkte rechts/links
  const k = Math.min(1, dt*10); let r = P.r, l = P.l, tilt = 0, hdTilt = 0;
  _ie.set(0, 0, 0);
  const tx = (cur, w) => { cur.x += (w[0] - cur.x)*k; cur.y += (w[1] - cur.y)*k; cur.z += (w[2] - cur.z)*k; };
  R.tR = R.tR || {x:r[0], y:r[1], z:r[2]}; R.tL = R.tL || {x:l[0], y:l[1], z:l[2]};
  let wr = [r[0], r[1], r[2]], wl = [l[0], l[1], l[2]];
  if (R.talkT > 0 && P.gest) { wl = [-.22 + .12*Math.sin(t*3.1 + R.ph), 1.12 + .1*Math.sin(t*4.3 + R.ph), .3 + .09*Math.sin(t*2.2 + R.ph)]; if (R.mode === "bar") wr = [.2 + .08*Math.sin(t*2.7), 1.15 + .06*Math.sin(t*3.3), .3]; }
  if (P.tinker) { wr = [.08 + .05*Math.sin(t*5), 1.02 + .03*Math.sin(t*7.3), .38]; wl = [-.12 + .03*Math.sin(t*3), .99, .34 + .02*Math.sin(t*4)]; }
  if (P.polish) { wl = [-.05 + .06*Math.cos(t*2.6), 1.16 + .04*Math.sin(t*2.6), .32]; wr = [.14, 1.2, .3]; }
  if (R.drinkT >= 0) { R.drinkT += dt; const u = R.drinkT, lift = u < .9 ? u/.9 : u < 1.9 ? 1 : Math.max(0, 1 - (u - 1.9)/.9), e = lift*lift*(3 - 2*lift);
    wr = [r[0] + (.02 - r[0])*e, r[1] + (1.43 - r[1])*e + .07*Math.sin(Math.PI*e), r[2] + (.17 - r[2])*e]; tilt = -1.05*Math.pow(Math.max(0, (e - .45)/.55), 1.2); hdTilt = -.16*e;
    if (u > .95 && !R.sipped) { R.sipped = true; setLevel(R, R.level - .13); if (ac) { const o = ac.createOscillator(), g2 = ac.createGain(), tt = ac.currentTime; o.type = "sine"; o.frequency.setValueAtTime(220, tt); o.frequency.exponentialRampToValueAtTime(110, tt + .25); g2.gain.setValueAtTime(.0001, tt); g2.gain.linearRampToValueAtTime(.05, tt + .04); g2.gain.exponentialRampToValueAtTime(.0001, tt + .3); o.connect(g2); g2.connect(fxIn); o.start(tt); o.stop(tt + .32); } }
    if (u > 2.8) { R.drinkT = -1; R.sipped = false; if (R.level < .3) setLevel(R, .85); } }
  tx(R.tR, wr); tx(R.tL, wl);
  arm2(R.aR, R.fR, R.tR.x, R.tR.y, R.tR.z, 1, -.5, -.35, _q2r); const fq = _q2r;
  R.glass.position.set(0, -.33, .02); _q1r.setFromAxisAngle(_px, (R.glassT = (R.glassT || 0) + (tilt - (R.glassT || 0))*Math.min(1, dt*14))); R.glass.quaternion.copy(fq).invert().multiply(_q1r);
  arm2(R.aL, R.fL, R.tL.x, R.tL.y, R.tL.z, -1, -.5, -.35);
  R.hdTilt = hdTilt;
}
function robotLife(R, P, t, dt, tgtPos, lookAtSpider) {
  const g = R.g; R.blink -= dt; if (R.blink < 0) R.blink = 2.5 + Math.random()*3.5; if (R.lookT > 0) R.lookT -= dt; if (R.talkT > 0) { R.talkT -= dt; R.tAt += dt; }
  R.gx += ((R.lookT > 0 ? 0 : (Math.sin(t*.4 + R.ph) > .7 ? 1 : 0)) - R.gx)*Math.min(1, dt*6);
  const tgt = R.lookT > 0 ? pos : tgtPos; g.getWorldPosition(_wp); _rt.set(tgt.x - _wp.x, 0, tgt.z - _wp.z); let yaw = Math.atan2(_rt.x, _rt.z) - g.rotation.y; while (yaw > Math.PI) yaw -= 2*Math.PI; while (yaw < -Math.PI) yaw += 2*Math.PI; yaw = clamp(yaw, -1.1, 1.1);
  const pitch = tgt === pos ? clamp(Math.atan2(_wp.y + 1.5 - tgt.y, Math.max(Math.hypot(_rt.x, _rt.z), .4))*.8, -.6, .7) : 0;
  if (R.mode === "sleep") { R.head.rotation.x += (.95 - R.head.rotation.x)*Math.min(1, dt*3); R.head.rotation.y += (Math.sin(t*.3)*.1 - R.head.rotation.y)*Math.min(1, dt*2); g.position.y = Math.sin(t*1.1)*.004; }
  else { const sp = R.talkT > 0 ? Math.sin(t*5 + R.ph)*.05 : 0; R.head.rotation.y += (yaw*(R.lookT > 0 ? 1 : .7) + sp - R.head.rotation.y)*Math.min(1, dt*(R.lookT > 0 ? 9 : 4)); R.head.rotation.x += ((R.talkT > 0 ? Math.sin(t*7 + R.ph)*.05 : 0) + (R.lookT > 0 ? .1 : 0) + pitch + (R.hdTilt || 0) - R.head.rotation.x)*Math.min(1, dt*6); g.rotation.z = Math.sin(t*.9 + R.ph)*.012; }
  if (R.tail) R.tail.rotation.z = .05 + Math.sin(t*1.6 + R.ph)*.08;
  robotArms(R, t, dt, P); R.face -= dt; if (R.face <= 0) { R.face = .08; drawFace(R, t); }
}

const PA = {r:[.1, 1.09, .4], l:[-.12, 1.06, .3], gest:true}, PC = {r:[.14, 1.2, .3], l:[-.05, 1.16, .32], gest:true, polish:true}, PZ = {r:[.2, 1.1, .36], l:[-.2, 1.1, .36]};
function streetRobots(dt, t) {
  const [A, B] = robots, dist = Math.hypot(pos.x - 3.2, pos.z + 1.4);
  if (dist < 3.6 && !alley.reacted && mode === "surf") { alley.reacted = true; alley.q = REACT[(alley.rc = (alley.rc || 0) + 1) % REACT.length].slice(); alley.wait = .1; for (const R of robots) R.lookT = 3; }
  if (dist > 8) alley.reacted = false;
  if (alley.q && alley.q.length) for (const R of robots) R.lookT = Math.max(R.lookT, 1.2);
  alley.wait -= dt;
  if (alley.wait <= 0 && !speakBusy() && A.talkT <= 0 && B.talkT <= 0 && A.drinkT < 0 && B.drinkT < 0) {
    const st = alley.q && alley.q.length ? alley.q.shift() : DLG[alley.step++ % DLG.length];
    if (st[0] >= 0) { const d = speakAt(st[0], st[1], false, st[2]); alley.wait = d + .45 + Math.random()*.6; } else if (st[1] >= 0) { robots[st[1]].drinkT = 0; alley.wait = 3.0; } else alley.wait = 3 + Math.random()*2;
  }
  robotLife(A, PA, t, dt, B.g.position); robotLife(B, PA, t, dt, A.g.position);
}
const BARL = [[0,"Wir haben eigentlich schon zu…","t"],[0,"Ach, egal. Setz dich. Ist ohnehin keiner da."],[0,"Ein Öl geht aufs Haus."],
 [0,"Früher war hier mehr los. Jetzt kommen nur noch die beiden da draußen."],[0,"Der da schläft seit Dienstag. Ich zahle ihm den Strom.","t"],[1,"Mhm… noch… einen…","t"],[0,"Hörst du das? Die Rohre. KRONOS atmet.","w"],[1,"Nicht… zerlegen…","t"],
 [0,"Er träumt oft davon. Ich frage nicht nach.","w"],[0,"Du bist ein seltsamer Gast. Aber ich habe schon seltsamere bedient.","j"],[0,"Mit den Beinen kannst du ja schlecht bestellen.","j"],[0,"Wenn du Ärger hast, bleib hier. Hier sucht keiner."],[1,"Rost… überall…","t"]];
const _bt = V3();
const _wp = V3(), _cw = V3();
function barTick(dt, t) {
  if (!barG || barBots.length < 2) return; const [C, Z] = barBots;
  barFan.rotation.y += dt*1.5; barLamps[0].intensity = 1.0 + .06*Math.sin(t*1.7) + (Math.random() < .005 ? -.5 : 0); barLamps[1].intensity = .9 + .05*Math.sin(t*2.3);
  const near = Math.hypot(pos.x - BX, pos.z - BZ) < 10; if (!near) return;
  if ((alley.tv = (alley.tv || 0) - dt) <= 0) { alley.tv = .2; const x = barTV.userData.cx; x.fillStyle = "#0a0e14"; x.fillRect(0, 0, 160, 100); for (let i = 0; i < 90; i++) { x.fillStyle = "rgba(160,180,210," + Math.random()*.25 + ")"; x.fillRect(Math.random()*160, Math.random()*100, 8 + Math.random()*30, 2); } x.fillStyle = "#c8d0e0"; x.font = "bold 13px monospace"; x.fillText("KRONOS NEWS", 8, 18); x.font = "10px monospace"; x.fillText(["SEKTOR 7: BETRIEB NORMAL", "NÄCHTLICHE BAUARBEITEN", "KEIN ANLASS ZUR SORGE"][((t/5)|0)%3], 8, 88); x.fillStyle = "#b8502c"; x.fillRect(8, 24, 60, 3); barTV.material.map.needsUpdate = true; }
  if (alley.inBar) { alley.outT = 0; if (!alley.wasIn) { alley.wasIn = true; alley.bi = 0; alley.bhi = 0; alley.bw = 1.0; } } else if (alley.wasIn && (alley.outT = (alley.outT || 0) + dt) > 6) alley.wasIn = false;
  C.g.getWorldPosition(_cw); const dC = Math.hypot(pos.x - _cw.x, pos.z - _cw.z); if (dC < 2.6 && alley.inBar) C.lookT = Math.max(C.lookT, .5);
  alley.bw -= dt;
  if (alley.inBar && alley.bw <= 0 && !speakBusy() && C.talkT <= 0 && Z.talkT <= 0) { const st = BARL[alley.bi < 3 ? alley.bi : 3 + (alley.bhi++ % (BARL.length - 3))]; alley.bi++; const d = speakR(barBots[st[0]], 2 + st[0], st[1], st[2]); alley.bw = d + (alley.bi < 4 ? .5 : 5 + Math.random()*6); }
  robotLife(C, PC, t, dt, pos); robotLife(Z, PZ, t, dt, _cw);
}
