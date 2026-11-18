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
/* ---- Bausteine: statische Teile werden pro Gelenk-Gruppe und Material zu EINEM Mesh verschmolzen (wenig Draw-Calls) ---- */
let _robArmor = null;
function robArmorTex() {      // Panel-Fugen, Kratzer, Verschleiß – dient als Farbtextur (weiß × Materialfarbe) und als Bump-Map für die Fugen
  if (_robArmor) return _robArmor;
  const cv = document.createElement("canvas"); cv.width = cv.height = 256; const x = cv.getContext("2d"); x.fillStyle = "#f4f4f2"; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 26; i++) { const px = Math.random()*256, py = Math.random()*256, r = 12 + Math.random()*40, g = x.createRadialGradient(px, py, 1, px, py, r); g.addColorStop(0, "rgba(90,84,76," + (.05 + Math.random()*.07) + ")"); g.addColorStop(1, "rgba(90,84,76,0)"); x.fillStyle = g; x.fillRect(0, 0, 256, 256); }
  x.strokeStyle = "#b4b4b2"; x.lineWidth = 2; for (let i = 0; i < 5; i++) { const p = 30 + Math.random()*196; x.beginPath(); x.moveTo(p, 0); x.lineTo(p + (Math.random() - .5)*30, 256); x.stroke(); x.beginPath(); x.moveTo(0, p); x.lineTo(256, p + (Math.random() - .5)*30); x.stroke(); }
  x.strokeStyle = "rgba(60,60,60,.3)"; x.lineWidth = 1; for (let i = 0; i < 10; i++) { const px = Math.random()*256, py = Math.random()*256; x.beginPath(); x.moveTo(px, py); x.lineTo(px + (Math.random() - .5)*26, py + (Math.random() - .5)*26); x.stroke(); }
  x.fillStyle = "rgba(255,255,255,.35)"; for (let i = 0; i < 80; i++) x.fillRect(Math.random()*256, Math.random()*256, 1 + Math.random()*2, 1 + Math.random()*2);
  _robArmor = new THREE.CanvasTexture(cv); _robArmor.wrapS = _robArmor.wrapT = THREE.RepeatWrapping; _robArmor.anisotropy = 4; return _robArmor;
}
function mergeGeos(list) {
  let n = 0; for (const g of list) n += g.attributes.position.count;
  const pa = new Float32Array(n*3), na = new Float32Array(n*3), ua = new Float32Array(n*2); let o = 0;
  for (const g of list) { pa.set(g.attributes.position.array, o*3); na.set(g.attributes.normal.array, o*3); ua.set(g.attributes.uv.array, o*2); o += g.attributes.position.count; }
  const r = new THREE.BufferGeometry(); r.setAttribute("position", new THREE.BufferAttribute(pa, 3)); r.setAttribute("normal", new THREE.BufferAttribute(na, 3)); r.setAttribute("uv", new THREE.BufferAttribute(ua, 2)); return r;
}
function makeRobot(o) {
  const g = new THREE.Group(),
    shell = new THREE.MeshStandardMaterial({color:o.body, metalness:.2, roughness:.22, side:THREE.DoubleSide, map:robArmorTex()}),
    trim = new THREE.MeshStandardMaterial({color:o.acc, metalness:.4, roughness:.26, side:THREE.DoubleSide, map:robArmorTex()}),
    inner = mStd(0x0b0d10, .85, .28), steel = mStd(0x9aa2ac, .9, .28), gold = mStd(0xb8893a, .9, .3), rub = mStd(0x0e1013, .1, .8), glowM = new THREE.MeshBasicMaterial({color:o.glow}),
    dk = inner, body = shell, acc = trim,
    R = {g, o, talkT:0, ev:[], drinkT:-1, lookT:0, blink:2 + Math.random()*3, face:0, gx:0, ph:Math.random()*6, cur:0};
  const add = (geo, mat, x, y, z, p) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); (p || g).add(m); return m; };
  const rot = (m, x, y, z) => { m.rotation.set(x || 0, y || 0, z || 0); return m; };
  const PI = Math.PI, store = new Map();
  /* P: Teil vormerken (wird am Ende pro Gruppe+Material verschmolzen). opt: {r:[x,y,z] Rotation, s:[x,y,z] Skalierung} */
  const P = (geo, mat, x, y, z, parent, opt) => { const t = new THREE.Object3D(); t.position.set(x, y, z); if (opt && opt.r) t.rotation.set(opt.r[0], opt.r[1], opt.r[2]); if (opt && opt.s) t.scale.set(opt.s[0], opt.s[1], opt.s[2]); t.updateMatrix();
    const gg = geo.index ? geo.toNonIndexed() : geo; gg.applyMatrix4(t.matrix); parent = parent || g; if (!store.has(parent)) store.set(parent, new Map()); const mm = store.get(parent); if (!mm.has(mat)) mm.set(mat, []); mm.get(mat).push(gg); };
  const cyl = (rt, rb, h, seg = 12, open = false, ts = 0, tl = PI*2) => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open, ts, tl), bxg = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const sph = (ws = 14, hs = 10, ps = 0, pl = PI*2, ts = 0, tl = PI) => new THREE.SphereGeometry(1, ws, hs, ps, pl, ts, tl), tor = (r, t, seg = 18, a = PI*2) => new THREE.TorusGeometry(r, t, 6, seg, a);
  const ball = (r, mat, x, y, z, p) => P(sph(10, 8), mat, x, y, z, p, {s:[r, r, r]});
  const ell = (rx, ry, rz, mat, x, y, z, p, r) => P(sph(14, 10), mat, x, y, z, p, {s:[rx, ry, rz], r});
  const cable = (pts, r, mat, p) => { const c = new THREE.CatmullRomCurve3(pts.map(q => new THREE.Vector3(q[0], q[1], q[2]))); P(new THREE.TubeGeometry(c, 14, r, 5, false), mat, 0, 0, 0, p); };
  const joint = (s, x, y, z, p, big) => { const k = big ? 1.2 : 1;      // rundes Seitengelenk: Scheibe, Ring, Linse (Achse = x)
    P(cyl(.05*k, .05*k, .026, 16), inner, x, y, z, p, {r:[0, 0, PI/2]}); P(tor(.038*k, .006*k, 20), steel, x + s*.016*k, y, z, p, {r:[0, PI/2, 0]}); P(tor(.024*k, .005*k, 16), steel, x + s*.016*k, y, z, p, {r:[0, PI/2, 0]}); ball(.016*k, glowM, x + s*.014*k, y, z, p); };

  /* ---- Beine ---- */
  R.legs = []; R.shins = [];
  for (const s of [-1, 1]) {
    const leg = new THREE.Group(); leg.position.set(s*.09, .78, 0); g.add(leg); R.legs.push(leg);
    const sh = new THREE.Group(); sh.position.set(0, -.46, 0); leg.add(sh); R.shins.push(sh);                // erstes Group-Kind = Unterschenkel
    ball(.052, inner, 0, 0, 0, leg); joint(s, s*.05, 0, 0, leg, true);                                         // Hüftgelenk mit Linse
    P(cyl(.036, .03, .42, 12), inner, 0, -.23, 0, leg);                                                        // innerer Oberschenkel
    ell(.072, .06, .08, shell, 0, .03, 0, leg);                                                                // Hüftschale
    P(cyl(.058, .05, .3, 14, true, -1.15, 2.3), shell, 0, -.19, .0, leg); P(cyl(.06, .052, .26, 14, true, s*PI/2 - .7, 1.4), trim, 0, -.2, 0, leg);   // Front- und Außenplatte
    P(cyl(.055, .047, .05, 14, true), trim, 0, -.37, 0, leg);                                                  // Manschette überm Knie
    P(cyl(.01, .01, .22, 8), steel, -s*.03, -.2, -.052, leg); P(cyl(.018, .018, .11, 8), inner, -s*.03, -.12, -.052, leg);   // Hydraulik
    cable([[s*.03, -.04, -.04], [s*.045, -.16, -.05], [s*.03, -.3, -.04], [s*.01, -.44, -.03]], .006, gold, leg);               // Goldkabel
    cable([[-s*.02, -.05, .045], [-s*.04, -.2, .05], [-s*.02, -.42, .04]], .005, rub, leg);
    ball(.05, inner, 0, -.46, 0, leg); joint(s, s*.045, -.46, 0, leg, false); ell(.052, .056, .04, trim, 0, -.46, .04, leg);   // Knie + Kniekappe
    P(cyl(.028, .024, .3, 12), inner, 0, -.15, 0, sh);                                                         // innerer Unterschenkel
    P(cyl(.047, .037, .26, 14, true, -1.05, 2.1), shell, 0, -.13, 0, sh); ell(.043, .1, .05, shell, 0, -.1, -.034, sh); P(cyl(.04, .04, .03, 12, true), trim, 0, -.03, 0, sh);   // Schienbeinplatte, Wade, Manschette
    cable([[0, -.02, -.03], [s*.02, -.14, -.06], [0, -.28, -.03]], .005, gold, sh);
    ball(.036, inner, 0, -.3, 0, sh); P(tor(.04, .006, 16), steel, 0, -.3, 0, sh, {r:[PI/2, 0, 0]});            // Knöchel
    P(bxg(.07, .035, .15), inner, 0, -.31, .03, sh); ell(.055, .032, .105, shell, 0, -.305, .035, sh); ell(.05, .022, .045, trim, 0, -.3, .11, sh);   // Fuß, Schuhschale, Kappe
    P(bxg(.095, .012, .18), rub, 0, -.342, .03, sh); P(bxg(.07, .035, .04), rub, 0, -.32, -.055, sh);          // Sohle, Ferse
  }

  /* ---- Becken, Bauch, Rumpf ---- */
  P(bxg(.2, .1, .12), inner, 0, .82, 0); P(cyl(.13, .12, .07, 16, true, -1.2, 2.4), shell, 0, .85, .0); P(cyl(.135, .135, .018, 18, true), trim, 0, .9, 0);
  for (const s of [-1, 1]) P(cyl(.052, .052, .03, 10), trim, s*.09, .64, 0);
  P(cyl(.072, .08, .24, 14), inner, 0, 1.0, 0);                                                                // Bauchsäule (dunkel)
  for (let i = 0; i < 4; i++) P(tor(.082 - i*.002, .009, 18), steel, 0, .92 + i*.045, 0, null, {r:[PI/2, 0, 0]});   // Rippen-Ringe
  for (const k of [-1, 0, 1]) cable([[k*.03, .9, .08], [k*.035, 1.0, .09], [k*.025, 1.1, .085]], .006, k ? gold : rub);
  P(cyl(.11, .098, .5, 16), inner, 0, 1.09, 0);                                                                // Brustkorb innen
  P(cyl(.12, .112, .27, 20, true, -1.2, 2.4), shell, 0, 1.15, 0); P(cyl(.124, .118, .08, 20, true, -1.45, 2.9), trim, 0, 1.29, 0); P(cyl(.118, .108, .3, 20, true, PI - 1.15, 2.3), shell, 0, 1.15, 0);   // Brustpanzer vorn/oben/hinten (Seiten bleiben offen)
  for (const s of [-1, 1]) { ell(.03, .075, .065, trim, s*.108, .98, 0); ell(.07, .035, .085, shell, s*.09, 1.335, -.01); P(bxg(.012, .2, .02), inner, s*.032, 1.15, .118); }   // Brust-/Schulterblattschalen, Flanken, Trapez
  ell(.1, .012, .035, trim, 0, 1.285, .098); ell(.05, .04, .04, shell, 0, .97, .07);                           // Schlüsselbein-Spange, Bauchplatte
  P(tor(.03, .008, 16), steel, 0, 1.15, .104);                                                                 // Ring um den Kern
  const chest = add(new THREE.SphereGeometry(.017, 10, 8), new THREE.MeshBasicMaterial({color:o.glow}), 0, 1.15, .1); R.chest = chest;   // Leuchtkern
  P(cyl(.1, .12, .035, 16), inner, 0, 1.34, 0); P(cyl(.043, .05, .12, 10), inner, 0, 1.375, 0);               // Kragen, Hals
  for (let k = 0; k < 6; k++) { const a = k/6*PI*2; cable([[Math.cos(a)*.036, 1.31, Math.sin(a)*.036], [Math.cos(a + .5)*.042, 1.37, Math.sin(a + .5)*.042], [Math.cos(a + 1)*.04, 1.42, Math.sin(a + 1)*.04]], .005, k % 3 ? rub : gold); }   // Halskabel
  // Rücken: Wirbelsäule, Akku, Kabel
  for (let i = 0; i < 7; i++) P(bxg(.04 - i*.002, .028, .03), steel, 0, 1.0 + i*.05, -.1);
  P(bxg(.19, .26, .05), inner, 0, 1.1, -.15); P(bxg(.15, .22, .03), shell, 0, 1.1, -.185); for (let i = 0; i < 4; i++) P(bxg(.13, .01, .02), steel, 0, 1.0 + i*.06, -.205);
  for (let k = 0; k < 3; k++) P(bxg(.14, .01, .008), glowM, 0, 1.04 + k*.07, -.205);
  for (const s of [-1, 1]) cable([[s*.07, 1.0, -.12], [s*.11, 1.12, -.14], [s*.09, 1.3, -.1]], .007, rub);

  /* ---- Kopf: Helm + ovales, gewölbtes Display ---- */
  const head = new THREE.Group(); head.position.set(0, 1.38, 0); g.add(head); R.head = head;
  const HY = .17, HX = .158, HYS = .19, HZ = .142, GP = 1.12;
  P(sph(18, 14), inner, 0, HY, 0, head, {s:[HX, HYS, HZ]});                                                    // Innenschädel
  const hs = [HX*1.12, HYS*1.08, HZ*1.15];
  P(sph(28, 18, PI/2 + GP, PI*2 - 2*GP, 0, PI*.86), shell, 0, HY + .012, 0, head, {s:hs});                    // Helmschale (hinten/seitlich/oben)
  P(sph(20, 8, PI/2 - GP, 2*GP, 0, .62), shell, 0, HY + .016, .0, head, {s:[hs[0]*1.01, hs[1]*1.01, hs[2]*1.02]});    // Stirnwulst
  P(sph(18, 6, PI/2 - GP, 2*GP, PI/2 + .98, .38), trim, 0, HY + .012, 0, head, {s:[hs[0]*.99, hs[1], hs[2]]});       // Kinnschale
  for (const s of [-1, 1]) {                                                                                  // Kamera-Linsen-Module an den Seiten
    const x = s*(hs[0] + .004), y = HY + .0;
    P(cyl(.058, .058, .03, 20), inner, x, y, 0, head, {r:[0, 0, PI/2]}); P(tor(.052, .008, 22), steel, x + s*.016, y, 0, head, {r:[0, PI/2, 0]}); P(tor(.036, .006, 20), trim, x + s*.017, y, 0, head, {r:[0, PI/2, 0]}); P(tor(.022, .005, 16), steel, x + s*.018, y, 0, head, {r:[0, PI/2, 0]}); ball(.018, glowM, x + s*.016, y, 0, head);
    P(cyl(.007, .007, .12, 6), steel, x, y - .08, -.05, head); cable([[s*.15, HY - .05, -.05], [s*.17, HY - .14, -.02], [s*.07, .02, .02]], .004, rub, head);
  }
  cable([[0, HY + .1, -.14], [.04, HY + .22, -.1], [.1, HY + .3, -.05], [.1, .46, -.03]], .004, rub, head); P(cyl(.016, .016, .03, 8), steel, .1, .375, -.03, head); ball(.016, glowM, .1, .47, -.03, head);   // Antennenkabel
  P(cyl(.07, .07, .045, 16), inner, 0, .015, 0, head); P(tor(.07, .008, 18), steel, 0, .035, 0, head, {r:[PI/2, 0, 0]});   // Nackenring
  const cv = document.createElement("canvas"); cv.width = 160; cv.height = 200; R.cx = cv.getContext("2d"); R.tex = new THREE.CanvasTexture(cv); R.tex.anisotropy = 4;
  const patch = (a, b, mat, k) => { const m = add(new THREE.SphereGeometry(1, 28, 20, PI/2 - a, 2*a, PI/2 - b, 2*b), mat, 0, HY, 0, head); m.scale.set(HX*k, HYS*k, HZ*k); return m; };
  patch(1.06, .93, new THREE.MeshStandardMaterial({color:o.acc, metalness:.6, roughness:.4, alphaMap:robRingTex(), alphaTest:.5, side:THREE.DoubleSide}), 1.012);   // ovale Einfassung
  patch(.97, .83, new THREE.MeshBasicMaterial({map:R.tex, transparent:true}), 1.02);                                                                                 // Display (gewölbt)
  patch(1.0, .86, new THREE.MeshStandardMaterial({color:0x9fb2c6, metalness:.7, roughness:.05, transparent:true, opacity:.12, depthWrite:false}), 1.034);               // Glasscheibe

  /* ---- Arme ---- */
  const arm = s => { const A = new THREE.Group(); A.position.set(s*.2, 1.27, 0); g.add(A);
    ball(.048, inner, 0, 0, 0, A); joint(s, s*.048, -.005, 0, A, true);                                          // Schultergelenk mit Linse
    P(sph(16, 10, 0, PI*2, 0, PI*.58), shell, s*.016, .03, 0, A, {s:[.075, .062, .085]}); ell(.05, .028, .065, trim, s*.032, .045, 0, A);   // Schulterpanzer
    P(cyl(.027, .023, .3, 12), inner, 0, -.15, 0, A);                                                          // Oberarm innen
    P(cyl(.043, .035, .2, 14, true, s*PI/2 - 1.1, 2.2), shell, 0, -.11, 0, A); ell(.03, .065, .036, trim, 0, -.11, .028, A);   // Oberarmplatte, Bizeps
    cable([[-s*.015, -.03, -.03], [-s*.03, -.14, -.035], [-s*.012, -.28, -.02]], .005, gold, A); cable([[s*.02, -.03, .02], [s*.032, -.15, .025], [s*.015, -.28, .02]], .004, rub, A);
    for (const y of [-.04, -.22]) P(cyl(.036, .036, .014, 12), steel, 0, y, 0, A);
    const F = new THREE.Group(); F.position.set(0, -.3, 0); A.add(F);
    ball(.038, inner, 0, 0, 0, F); joint(s, s*.038, 0, 0, F, false);                                             // Ellbogen
    P(cyl(.026, .02, .28, 12), inner, 0, -.14, 0, F); P(cyl(.04, .027, .22, 14, true, -1.3, 2.6), shell, 0, -.1, -.005, F); P(cyl(.042, .042, .03, 14, true), trim, 0, -.03, 0, F);   // Unterarm
    P(cyl(.01, .01, .2, 8), steel, 0, -.14, -.038, F); cable([[s*.02, -.04, .03], [s*.03, -.15, .034], [s*.012, -.27, .022]], .005, gold, F);
    P(cyl(.03, .03, .03, 12), steel, 0, -.285, 0, F);                                                            // Handgelenk
    P(bxg(.062, .05, .036), inner, 0, -.325, 0, F); ell(.032, .038, .012, shell, 0, -.325, -.02, F);             // Handfläche + Handrücken
    for (const fx of [-.024, -.008, .008, .024]) { P(bxg(.012, .04, .013), rub, fx, -.37, .008, F); P(bxg(.011, .03, .012), rub, fx, -.403, .014, F, {r:[-.4, 0, 0]}); }   // Finger
    P(bxg(.014, .045, .014), rub, -s*.04, -.335, .012, F, {r:[0, 0, s*.5]}); P(bxg(.012, .03, .012), rub, -s*.058, -.365, .018, F, {r:[0, 0, s*.8]});   // Daumen
    return {A, F}; };
  const L = arm(-1), Rr = arm(1); R.aL = L.A; R.fL = L.F; R.aR = Rr.A; R.fR = Rr.F;
  const glass = new THREE.Group(); glass.position.set(0, -.33, .02); R.fR.add(glass); R.glass = glass;
  add(new THREE.CylinderGeometry(.036, .03, .1, 10), new THREE.MeshStandardMaterial({color:0xcad4de, transparent:true, opacity:.35, roughness:.1}), 0, 0, 0, glass);
  R.liq = add(new THREE.CylinderGeometry(.031, .027, .066, 10), new THREE.MeshStandardMaterial({color:0x8a2018, emissive:0x50140e, roughness:.3}), 0, -.012, 0, glass); R.level = .85; setLevel(R, .85);

  /* ---- Varianten ---- */
  if (o.cool) { const jm = mStd(0x23252b, .45, .4), ora = new THREE.MeshBasicMaterial({color:0x3c8680});            // Türsteher: schwere Panzerung
    P(cyl(.136, .13, .3, 20, true, -1.3, 2.6), jm, 0, 1.12, 0); P(cyl(.14, .136, .06, 20, true, -1.5, 3), jm, 0, 1.3, 0); P(bxg(.012, .3, .01), ora, -.05, 1.12, .136); P(bxg(.012, .3, .01), ora, .05, 1.12, .136);
    P(bxg(.2, .09, .12), jm, 0, .76, -.02);                                                                      // Hüftschurz
    for (const s of [-1, 1]) { ell(.1, .075, .11, jm, s*.225, 1.34, 0, null, [0, 0, -s*.2]); P(tor(.08, .008, 20), ora, s*.225, 1.34, 0, null, {r:[PI/2, 0, 0]}); P(new THREE.ConeGeometry(.026, .1, 6), jm, s*.27, 1.4, 0, null, {r:[0, 0, -s*1.1]}); }
    for (let k = 0; k < 4; k++) P(bxg(.022, .16, .06), k % 2 ? trim : inner, 0, .33 + (k === 1 || k === 2 ? .03 : 0), -.07 + k*.06, head, {r:[-.35 - k*.08, 0, 0]});
    P(bxg(.28, .02, .04), ora, 0, HY + .12, .12, head); }
  if (o.pouch) { add(bxg(.1, .09, .06), mStd(0x4a3a2a, .1, .9), .15, .86, .08); add(bxg(.1, .02, .065), mStd(0x32261c, .1, .9), .15, .91, .08); }
  if (o.scarf) { add(cyl(.088, .094, .06, 12), mStd(o.scarf, 0, .95), 0, 1.33, 0); const tl = add(bxg(.06, .3, .015), mStd(o.scarf, 0, .95), .05, 1.18, .13); tl.rotation.z = .05; R.tail = tl; }
  if (o.tape) add(cyl(.037, .037, .06, 8), mStd(0xd8d2c0, 0, .9), 0, -.1, 0, R.aL);
  if (o.apron) { add(bxg(.24, .34, .02), mStd(o.apron, 0, .95), 0, .98, .148); add(bxg(.03, .03, .02), dk, .09, 1.15, .162); }
  if (o.cracks) R.crack = true;

  /* ---- Verschmelzen ---- */
  for (const [parent, mm] of store) for (const [mat, list] of mm) { const m = new THREE.Mesh(mergeGeos(list), mat); parent.add(m); list.forEach(q => q.dispose()); }
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
