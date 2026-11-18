/* ======================= Roboter-Modell (NPCs) =======================
   Eigene Datei, damit das Modell einzeln überarbeitet werden kann.
   Skelett (wird von der Animation in bar.js / ch2.js / job.js benutzt – Maße nicht ändern):
     g (Wurzel, Füße bei y=0)
       ├─ legs[0/1]  Hüftgelenk bei (±.09, .78, 0); erstes Group-Kind = shins[i] (Knie bei y=-.46)
       ├─ head       Hals bei (0, 1.38, 0); Gesicht = oval gewölbtes Display (R.tex / drawFace)
       ├─ aL / aR    Schulter bei (±.2, 1.27, 0), Ellbogen fL / fR bei y=-.3, Hand bei y=-.31 (Glas: R.glass)
       └─ chest      Leuchtkern (eigenes Basic-Material, Farbe wird vom Job geändert)
*/
let _robRing = null;
function robRingTex() {       // Oval-Maske für die Display-Einfassung (weiß = Rahmen)
  if (_robRing) return _robRing;
  const cv = document.createElement("canvas"); cv.width = 160; cv.height = 200; const x = cv.getContext("2d");
  x.fillStyle = "#000"; x.fillRect(0, 0, 160, 200); x.fillStyle = "#fff"; x.beginPath(); x.ellipse(80, 100, 79, 99, 0, 0, 7); x.fill();
  x.fillStyle = "#000"; x.beginPath(); x.ellipse(80, 100, 66, 85, 0, 0, 7); x.fill();
  _robRing = new THREE.CanvasTexture(cv); return _robRing;
}
function makeRobot(o) {
  const g = new THREE.Group(), body = mStd(o.body, .55, .6), acc = mStd(o.acc, .5, .65), dk = mStd(0x16181c, .6, .5),
    rub = mStd(0x0e1013, .15, .85), steel = mStd(0x8a929c, .85, .32), glowM = new THREE.MeshBasicMaterial({color:o.glow}),
    R = {g, o, talkT:0, ev:[], drinkT:-1, lookT:0, blink:2 + Math.random()*3, face:0, gx:0, ph:Math.random()*6, cur:0};
  const add = (geo, mat, x, y, z, p) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); (p || g).add(m); return m; };
  const rot = (m, x, y, z) => { m.rotation.set(x || 0, y || 0, z || 0); return m; };
  const cyl = (rt, rb, h, seg = 10) => new THREE.CylinderGeometry(rt, rb, h, seg), bxg = (w, h, d) => new THREE.BoxGeometry(w, h, d), sph = (r, ws = 12, hs = 8) => new THREE.SphereGeometry(r, ws, hs);
  const ell = (rx, ry, rz, mat, x, y, z, p) => { const m = add(sph(1, 14, 10), mat, x, y, z, p); m.scale.set(rx, ry, rz); return m; };

  /* ---- Beine ---- */
  R.legs = []; R.shins = [];
  for (const s of [-1, 1]) {
    const leg = new THREE.Group(); leg.position.set(s*.09, .78, 0); g.add(leg); R.legs.push(leg);
    const sh = new THREE.Group(); sh.position.set(0, -.46, 0); leg.add(sh); R.shins.push(sh);                 // erstes Group-Kind = Unterschenkel
    add(sph(.06, 12, 8), dk, 0, 0, 0, leg); add(cyl(.062, .062, .03, 12), dk, s*.04, 0, 0, leg).rotation.z = Math.PI/2;
    add(cyl(.054, .042, .4, 12), body, 0, -.22, 0, leg);                                                        // Oberschenkel
    add(bxg(.085, .2, .022), acc, 0, -.2, .05, leg); add(bxg(.07, .03, .026), dk, 0, -.1, .05, leg); add(bxg(.07, .03, .026), dk, 0, -.3, .05, leg);   // Frontplatte + Spangen
    add(cyl(.02, .02, .2, 8), dk, 0, -.18, -.055, leg); add(cyl(.011, .011, .3, 6), steel, 0, -.22, -.055, leg);                              // Hydraulikzylinder
    add(sph(.055, 12, 8), dk, 0, -.46, 0, leg); add(cyl(.05, .05, .09, 12), acc, 0, -.46, 0, leg).rotation.z = Math.PI/2; add(bxg(.07, .05, .05), acc, 0, -.455, .05, leg);   // Knie
    add(cyl(.042, .032, .3, 12), body, 0, -.15, 0, sh);                                                         // Unterschenkel
    add(bxg(.07, .17, .02), acc, 0, -.15, .04, sh); add(cyl(.012, .012, .24, 6), steel, 0, -.14, -.05, sh); add(cyl(.02, .02, .12, 8), dk, 0, -.1, -.05, sh);
    add(sph(.04, 10, 8), dk, 0, -.3, 0, sh);                                                                    // Knöchel
    add(bxg(.1, .05, .18), dk, 0, -.315, .03, sh); add(bxg(.1, .035, .055), acc, 0, -.3, .11, sh); add(bxg(.09, .04, .05), rub, 0, -.325, -.05, sh); add(bxg(.104, .012, .185), rub, 0, -.342, .03, sh);   // Fuß + Kappe + Ferse + Sohle
  }

  /* ---- Becken & Rumpf ---- */
  add(bxg(.3, .1, .17), dk, 0, .82, 0); add(bxg(.26, .035, .19), acc, 0, .9, 0); add(bxg(.1, .06, .04), rub, 0, .86, .09);
  for (const s of [-1, 1]) add(cyl(.052, .052, .03, 10), acc, s*.09, .64, 0);
  const prof = [[.07, 0], [.095, .05], [.125, .15], [.145, .27], [.15, .36], [.13, .45], [.1, .5]].map(p => new THREE.Vector2(p[0], p[1]));
  const torso = add(new THREE.LatheGeometry(prof, 20), body, 0, .83, 0); R.torso = torso;                       // gedrehter Rumpf (Taille → Schultern)
  ell(.1, .1, .028, acc, 0, 1.13, .142);                                                                       // gewölbte Brustplatte
  for (let i = 0; i < 3; i++) add(bxg(.09, .012, .01), dk, -.035, 1.02 + i*.03, .136);                           // Lüftungsschlitze
  add(bxg(.2, .014, .02), acc, 0, 1.28, .13); add(cyl(.032, .032, .02, 10), dk, .06, 1.16, .142).rotation.x = Math.PI/2;
  const chest = add(sph(.015, 8, 6), new THREE.MeshBasicMaterial({color:o.glow}), .06, 1.16, .15); R.chest = chest;   // Leuchtkern
  add(cyl(.12, .14, .04, 16), dk, 0, 1.335, 0); add(bxg(.34, .05, .16), body, 0, 1.31, 0); add(bxg(.04, .03, .12), acc, .15, 1.31, 0);   // Kragen / Schulterbrücke
  add(cyl(.046, .052, .1, 10), dk, 0, 1.37, 0); for (const y of [1.355, 1.385]) add(cyl(.054, .054, .012, 10), steel, 0, y, 0);                          // Hals
  // Rücken: Akku, Kühlrippen, Kabel
  add(bxg(.22, .3, .06), dk, 0, 1.1, -.145); add(bxg(.17, .26, .03), body, 0, 1.1, -.185);
  for (let i = 0; i < 4; i++) add(bxg(.15, .012, .02), steel, 0, 1.0 + i*.065, -.205); for (let k = 0; k < 3; k++) add(bxg(.16, .012, .01), new THREE.MeshBasicMaterial({color:o.glow}), 0, 1.04 + k*.07, -.222);
  for (const s of [-1, 1]) { rot(add(cyl(.012, .012, .26, 6), rub, s*.07, 1.3, -.12), .45, 0, s*.1); add(cyl(.02, .02, .06, 8), dk, s*.07, 1.24, -.185); }

  /* ---- Kopf: ovales, gewölbtes Display ---- */
  const head = new THREE.Group(); head.position.set(0, 1.38, 0); g.add(head); R.head = head;
  const HY = .17, HX = .165, HYS = .2, HZ = .15;
  ell(HX, HYS, HZ, dk, 0, HY, 0, head);                                                                                  // Schädel
  ell(HX*.78, .03, HZ*.78, acc, 0, HY + .19, 0, head);                                    // Kappe oben
  const cv = document.createElement("canvas"); cv.width = 160; cv.height = 200; R.cx = cv.getContext("2d"); R.tex = new THREE.CanvasTexture(cv); R.tex.anisotropy = 4;
  const patch = (a, b, mat, k) => { const m = add(new THREE.SphereGeometry(1, 28, 20, Math.PI/2 - a, 2*a, Math.PI/2 - b, 2*b), mat, 0, HY, 0, head); m.scale.set(HX*k, HYS*k, HZ*k); return m; };
  patch(1.08, .94, new THREE.MeshStandardMaterial({color:o.acc, metalness:.5, roughness:.55, alphaMap:robRingTex(), alphaTest:.5, side:THREE.DoubleSide}), 1.012);   // ovale Einfassung
  patch(.98, .84, new THREE.MeshBasicMaterial({map:R.tex, transparent:true}), 1.02);                                                             // Display (gewölbt)
  patch(1.0, .86, new THREE.MeshStandardMaterial({color:0x9fb2c6, metalness:.7, roughness:.05, transparent:true, opacity:.12, depthWrite:false}), 1.032);   // Glasscheibe
  for (const s of [-1, 1]) { rot(add(cyl(.055, .055, .035, 12), dk, s*(HX + .008), HY, 0, head), 0, 0, Math.PI/2); rot(add(cyl(.032, .032, .04, 12), acc, s*(HX + .02), HY, 0, head), 0, 0, Math.PI/2); add(bxg(.02, .1, .03), steel, s*(HX + .01), HY - .07, -.06, head); }   // Ohr-Module
  add(bxg(.2, .1, .035), body, 0, HY + .02, -HZ + .01, head); for (let i = 0; i < 5; i++) add(bxg(.15, .008, .01), dk, 0, HY - .02 + i*.022, -HZ - .008, head);   // Hinterkopf mit Schlitzen
  add(cyl(.008, .008, .2, 5), dk, .1, .37, -.03, head); add(sph(.018, 8, 6), glowM, .1, .475, -.03, head); add(cyl(.016, .016, .03, 8), steel, .1, .375, -.03, head);   // Antenne
  add(cyl(.07, .075, .035, 14), dk, 0, .015, 0, head); add(bxg(.1, .02, .03), slotM(), 0, .012, .08, head);                                           // Kinn/Nacken

  /* ---- Arme ---- */
  const arm = s => { const A = new THREE.Group(); A.position.set(s*.2, 1.27, 0); g.add(A);
    add(sph(.054, 12, 8), dk, 0, 0, 0, A); ell(.062, .05, .07, acc, s*.012, .035, 0, A);                                    // Schulterkappe
    add(cyl(.038, .031, .3, 12), body, 0, -.15, 0, A); add(cyl(.012, .012, .22, 6), steel, 0, -.15, -.04, A); ell(.034, .07, .02, acc, 0, -.1, .034, A);
    for (const y of [-.04, -.2]) add(cyl(.04, .04, .016, 12), dk, 0, y, 0, A);
    const F = new THREE.Group(); F.position.set(0, -.3, 0); A.add(F);
    add(sph(.043, 12, 8), acc, 0, 0, 0, F); add(cyl(.032, .026, .28, 12), acc, 0, -.14, 0, F); add(bxg(.045, .13, .018), dk, 0, -.12, .03, F); add(cyl(.011, .011, .2, 6), steel, 0, -.14, -.035, F);
    add(cyl(.034, .034, .03, 12), dk, 0, -.285, 0, F);                                                                                  // Handgelenk
    add(bxg(.072, .06, .042), dk, 0, -.33, 0, F);                                                                                       // Handfläche
    for (const fx of [-.022, 0, .022]) { add(bxg(.014, .05, .016), rub, fx, -.375, .008, F); add(bxg(.012, .03, .014), rub, fx, -.405, .014, F).rotation.x = -.35; }   // Finger
    add(bxg(.016, .05, .016), rub, s*-.045, -.335, .012, F).rotation.z = s*.5;                                                           // Daumen
    return {A, F}; };
  const L = arm(-1), Rr = arm(1); R.aL = L.A; R.fL = L.F; R.aR = Rr.A; R.fR = Rr.F;
  const glass = new THREE.Group(); glass.position.set(0, -.33, .02); R.fR.add(glass); R.glass = glass;
  add(cyl(.036, .03, .1, 10), new THREE.MeshStandardMaterial({color:0xcad4de, transparent:true, opacity:.35, roughness:.1}), 0, 0, 0, glass);
  R.liq = add(cyl(.031, .027, .066, 10), new THREE.MeshStandardMaterial({color:0x8a2018, emissive:0x50140e, roughness:.3}), 0, -.012, 0, glass); R.level = .85; setLevel(R, .85);

  /* ---- Varianten ---- */
  if (o.cool) { const jm = mStd(0x23252b, .3, .55), ora = new THREE.MeshBasicMaterial({color:0x3c8680});            // Türsteher-Jacke
    add(bxg(.34, .42, .28), jm, 0, 1.1, 0); add(bxg(.4, .3, .03), jm, 0, .78, -.14); add(bxg(.06, .22, .2), jm, -.15, 1.38, 0); add(bxg(.06, .22, .2), jm, .15, 1.38, 0);
    add(bxg(.012, .46, .005), ora, -.07, 1.1, .153); add(bxg(.012, .46, .005), ora, .07, 1.1, .153);
    for (const s of [-1, 1]) { rot(add(new THREE.ConeGeometry(.03, .1, 6), dk, s*.25, 1.37, 0), 0, 0, -s*1.2); add(bxg(.04, .1, .02), ora, s*.22, 1.2, 0); }
    for (let k = 0; k < 4; k++) { const f = add(bxg(.022, .16, .06), k % 2 ? acc : dk, 0, .33 + (k === 1 || k === 2 ? .03 : 0), -.07 + k*.06, head); f.rotation.x = -.35 - k*.08; }   // Stacheln am Kopf
    add(bxg(.28, .03, .05), ora, 0, HY + .1, .11, head); }
  if (o.pouch) { add(bxg(.1, .09, .06), mStd(0x4a3a2a, .1, .9), .15, .86, .08); add(bxg(.1, .02, .065), mStd(0x32261c, .1, .9), .15, .91, .08); }
  if (o.scarf) { add(cyl(.088, .094, .06, 12), mStd(o.scarf, 0, .95), 0, 1.33, 0); const tl = add(bxg(.06, .3, .015), mStd(o.scarf, 0, .95), .05, 1.18, .13); tl.rotation.z = .05; R.tail = tl; }
  if (o.tape) add(cyl(.037, .037, .06, 8), mStd(0xd8d2c0, 0, .9), 0, -.1, 0, R.aL);
  if (o.apron) { add(bxg(.24, .34, .02), mStd(o.apron, 0, .95), 0, .98, .147); add(bxg(.03, .03, .02), dk, .09, 1.15, .162); }
  if (o.cracks) R.crack = true;

  /* ---- Oberflächen: gebürsteter Stahl (Rumpf) / dunkler Zinkstahl (dk, acc) ---- */
  body.map = imgTex("m52C", 1.6, 1.6); body.normalMap = imgTex("m52N", 1.6, 1.6); body.roughnessMap = imgTex("m52R", 1.6, 1.6); body.normalScale.set(.9, .9); body.metalness = .55; body.roughness = 1; body.needsUpdate = true;
  for (const m of new Set([dk, acc])) { m.map = imgTex("m38C", 1.4, 1.4); m.normalMap = imgTex("m38N", 1.4, 1.4); m.roughnessMap = imgTex("m38R", 1.4, 1.4); m.metalness = Math.max(m.metalness || 0, .5); m.roughness = 1; m.needsUpdate = true; }
  R.g.userData.d = 1;
  g.traverse(m => { if (m.isMesh) m.castShadow = true; }); return R;
}
const slotM = () => new THREE.MeshBasicMaterial({color:0x020304});
function setLevel(R, v) { R.level = v; const h = .066*Math.max(.02, v); R.liq.scale.y = Math.max(.02, v); R.liq.position.y = -.045 + h/2; R.liq.visible = v > .03; }
function drawFace(R, t) {     // Display (160×200, wird auf die ovale Wölbung gelegt)
  const x = R.cx, o = R.o, w = 160, h = 200, col = "#" + o.glow.toString(16).padStart(6, "0");
  x.clearRect(0, 0, w, h); x.save(); x.beginPath(); x.ellipse(w/2, h/2, w/2 - 1, h/2 - 1, 0, 0, 7); x.clip();
  const bg = x.createRadialGradient(w/2, h*.42, 10, w/2, h/2, h*.62); bg.addColorStop(0, "#0a1016"); bg.addColorStop(1, "#020406"); x.fillStyle = bg; x.fillRect(0, 0, w, h);
  const look = R.lookT > 0, bl = R.blink < .12 ? .12 : 1, ey = look ? 40 : 32, ew = look ? 28 : 24, cy = 82; x.fillStyle = col; x.globalAlpha = .92; x.shadowColor = col; x.shadowBlur = 8;
  for (const s of [-1, 1]) { const cx = w/2 + s*32 + R.gx*8; x.beginPath(); x.roundRect ? x.roundRect(cx - ew/2, cy - ey*bl/2, ew, ey*bl, 8) : x.rect(cx - ew/2, cy - ey*bl/2, ew, ey*bl); x.fill(); }
  const my = 142;
  if (R.talkT > 0) { const k = R.ev.find(e => R.tAt >= e.t0 && R.tAt <= e.t1); for (let i = 0; i < 5; i++) { const hh = k ? 6 + (.5 + .5*Math.sin(t*38 + i*1.7))*20*(.5 + .5*Math.min(1, k.s)) : 3; x.fillRect(w/2 - 30 + i*13, my - hh/2, 8, hh); } }
  else if (R.drinkT >= 0) { x.fillRect(w/2 - 12, my, 24, 4); } else if (R.smile) { x.strokeStyle = col; x.lineWidth = 5; x.lineCap = "round"; x.beginPath(); x.arc(w/2, my - 24, 32, .22*Math.PI, .78*Math.PI); x.stroke(); } else { x.fillRect(w/2 - 16, my, 32, 4); }
  x.shadowBlur = 0; if (look) { x.font = "bold 28px monospace"; x.fillText("?", w - 38, 40); }
  x.globalAlpha = .13; x.fillStyle = "#000"; for (let y = 0; y < h; y += 4) x.fillRect(0, y, w, 2); x.globalAlpha = 1;
  if (Math.random() < .03) { x.fillStyle = "rgba(255,255,255,.07)"; x.fillRect(0, Math.random()*h, w, 4); }
  const gl = x.createLinearGradient(0, 0, w*.7, h*.5); gl.addColorStop(0, "rgba(255,255,255,.1)"); gl.addColorStop(.5, "rgba(255,255,255,0)"); x.fillStyle = gl; x.fillRect(0, 0, w, h);   // Glanz der Wölbung
  x.restore(); R.tex.needsUpdate = true;
}
