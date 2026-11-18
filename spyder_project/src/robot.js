/* ======================= Roboter-Modell (NPCs) – Version 2, komplett neu =======================
   Android-Look nach Referenzbildern: glänzende, verwitterte Panzerplatten (elfenbein/gold) über dunkler, sichtbarer Mechanik,
   Helm mit Kamera-Linse statt Bildschirm, Kabelstränge, echte Hände mit Gliedern, Krallenfüße.
   Das Skelett (Gelenkpunkte, Maße) bleibt gleich, damit Animationen in bar.js / ch2.js / job.js weiter passen:
     g (Wurzel, Füße bei y=0)
       ├─ legs[0/1]  Hüfte bei (±.09, .78, 0); erstes Group-Kind = shins[i] (Knie bei y=-.46)
       ├─ head       Hals bei (0, 1.38, 0)
       ├─ aL / aR    Schulter bei (±.2, 1.27, 0); fL / fR = Ellbogen bei y=-.3; Hand bei y≈-.3 … -.42 (Glas: R.glass)
       └─ chest      Leuchtkern (eigenes Basic-Material, Farbe wird vom Job geändert)
   Ausdruck: statt Display leuchtet die Kamera-Linse (R.eyeM) – drawFace() steuert nur noch deren Helligkeit.
*/
let _robArmor = null;
function robArmorTex() {      // verwitterter Lack: Fugen, Rost-/Schmutzflecken (Aquarell-artig), Kratzer – weiß × Materialfarbe
  if (_robArmor) return _robArmor;
  const cv = document.createElement("canvas"); cv.width = cv.height = 256; const x = cv.getContext("2d"); x.fillStyle = "#f2f1ee"; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 34; i++) { const px = Math.random()*256, py = Math.random()*256, r = 14 + Math.random()*46, g = x.createRadialGradient(px, py, 1, px, py, r), br = Math.random() < .45; g.addColorStop(0, br ? "rgba(120,86,52," + (.1 + Math.random()*.14) + ")" : "rgba(70,70,72," + (.08 + Math.random()*.12) + ")"); g.addColorStop(1, "rgba(80,70,60,0)"); x.fillStyle = g; x.fillRect(0, 0, 256, 256); }
  x.strokeStyle = "rgba(30,30,32,.55)"; x.lineWidth = 1.5; for (let i = 0; i < 4; i++) { const p = 30 + Math.random()*196; x.beginPath(); x.moveTo(p, 0); x.lineTo(p + (Math.random() - .5)*34, 256); x.stroke(); x.beginPath(); x.moveTo(0, p); x.lineTo(256, p + (Math.random() - .5)*34); x.stroke(); }
  x.strokeStyle = "rgba(40,40,40,.28)"; x.lineWidth = 1; for (let i = 0; i < 16; i++) { const px = Math.random()*256, py = Math.random()*256; x.beginPath(); x.moveTo(px, py); x.lineTo(px + (Math.random() - .5)*30, py + (Math.random() - .5)*30); x.stroke(); }
  x.fillStyle = "rgba(255,255,255,.5)"; for (let i = 0; i < 50; i++) x.fillRect(Math.random()*256, Math.random()*256, 1 + Math.random()*2, 1 + Math.random()*2);
  _robArmor = new THREE.CanvasTexture(cv); _robArmor.wrapS = _robArmor.wrapT = THREE.RepeatWrapping; _robArmor.anisotropy = 4; return _robArmor;
}
function mergeGeos(list) {
  let n = 0; for (const g of list) n += g.attributes.position.count;
  const pa = new Float32Array(n*3), na = new Float32Array(n*3), ua = new Float32Array(n*2); let o = 0;
  for (const g of list) { pa.set(g.attributes.position.array, o*3); na.set(g.attributes.normal.array, o*3); ua.set(g.attributes.uv.array, o*2); o += g.attributes.position.count; }
  const r = new THREE.BufferGeometry(); r.setAttribute("position", new THREE.BufferAttribute(pa, 3)); r.setAttribute("normal", new THREE.BufferAttribute(na, 3)); r.setAttribute("uv", new THREE.BufferAttribute(ua, 2)); return r;
}
/* Loft: gleitender elliptischer Querschnitt entlang y. prof: [[y, rx, rz, cx, cz], …]; a0..a1: Winkel (0 = vorn +z, π/2 = +x, π = hinten) */
function loft(prof, a0, a1, seg = 16, sub = 3) {
  const cA = new THREE.CatmullRomCurve3(prof.map(p => new THREE.Vector3(p[1], p[2], p[0]))), cB = new THREE.CatmullRomCurve3(prof.map(p => new THREE.Vector3(p[3] || 0, p[4] || 0, 0)));
  const n = Math.max(2, (prof.length - 1)*sub), pa = [], ua = [], ia = [];
  for (let i = 0; i <= n; i++) { const t = i/n, a = cA.getPoint(t), b = cB.getPoint(t);
    for (let j = 0; j <= seg; j++) { const an = a0 + (a1 - a0)*j/seg; pa.push(b.x + a.x*Math.sin(an), a.z, b.y + a.y*Math.cos(an)); ua.push(j/seg, i/n); } }
  for (let i = 0; i < n; i++) for (let j = 0; j < seg; j++) { const a = i*(seg + 1) + j, b = a + 1, c = a + seg + 1, d = c + 1; ia.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pa, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(ua, 2)); g.setIndex(ia); g.computeVertexNormals();
  const mid = Math.floor(n/2)*(seg + 1) + Math.floor(seg/2), P0 = g.attributes.position, N0 = g.attributes.normal, b0 = cB.getPoint(Math.floor(n/2)/n);
  if (N0.getX(mid)*(P0.getX(mid) - b0.x) + N0.getZ(mid)*(P0.getZ(mid) - b0.y) < 0) { const ix = g.index.array; for (let k = 0; k < ix.length; k += 3) { const t = ix[k + 1]; ix[k + 1] = ix[k + 2]; ix[k + 2] = t; } g.computeVertexNormals(); }
  return g;
}
const _rbY = new THREE.Vector3(0, 1, 0);
function makeRobot(o) {
  const cShell = new THREE.Color(o.body).lerp(new THREE.Color(0xe9e6df), .55), cTrim = new THREE.Color(o.acc).lerp(new THREE.Color(0xc9a24e), .4);
  const g = new THREE.Group(),
    shell = new THREE.MeshStandardMaterial({color:cShell, metalness:.25, roughness:.2, side:THREE.DoubleSide, map:robArmorTex()}),
    gold = new THREE.MeshStandardMaterial({color:cTrim, metalness:.7, roughness:.28, side:THREE.DoubleSide, map:robArmorTex()}),
    inner = mStd(0x090a0c, .8, .3), steel = mStd(0xa4acb6, .9, .26), copper = mStd(0xb07a3a, .9, .3), rub = mStd(0x0d0f12, .1, .75),
    eyeM = new THREE.MeshBasicMaterial({color:o.glow}), glowM = new THREE.MeshBasicMaterial({color:o.glow}),
    R = {g, o, talkT:0, ev:[], drinkT:-1, lookT:0, blink:2 + Math.random()*3, face:0, gx:0, ph:Math.random()*6, cur:0, eyeM};
  R.cx = null; R.tex = {needsUpdate:false};                                                                       // kein Display mehr
  const add = (geo, mat, x, y, z, p) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); (p || g).add(m); return m; };
  const PI = Math.PI, store = new Map();
  const P = (geo, mat, x, y, z, parent, opt) => { const t = new THREE.Object3D(); t.position.set(x, y, z); if (opt && opt.r) t.rotation.set(opt.r[0], opt.r[1], opt.r[2]); if (opt && opt.q) t.quaternion.copy(opt.q); if (opt && opt.s) t.scale.set(opt.s[0], opt.s[1], opt.s[2]); t.updateMatrix();
    const gg = geo.index ? geo.toNonIndexed() : geo; gg.applyMatrix4(t.matrix); parent = parent || g; if (!store.has(parent)) store.set(parent, new Map()); const mm = store.get(parent); if (!mm.has(mat)) mm.set(mat, []); mm.get(mat).push(gg); };
  const cyl = (rt, rb, h, seg = 12, open = false, ts = 0, tl = PI*2) => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open, ts, tl), bxg = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const sph = (ws = 14, hs = 10) => new THREE.SphereGeometry(1, ws, hs), tor = (r, t, seg = 18, a = PI*2) => new THREE.TorusGeometry(r, t, 6, seg, a);
  const ball = (r, mat, x, y, z, p) => P(sph(10, 8), mat, x, y, z, p, {s:[r, r, r]});
  const ell = (rx, ry, rz, mat, x, y, z, p, r) => P(sph(14, 10), mat, x, y, z, p, {s:[rx, ry, rz], r});
  const L = (prof, a0, a1, mat, p, seg, sub, x = 0, y = 0, z = 0) => P(loft(prof, a0, a1, seg || 18, sub || 3), mat, x, y, z, p);
  const V = (q) => new THREE.Vector3(q[0], q[1], q[2]);
  const bone = (a, b, r1, r2, mat, p) => { const A = V(a), B = V(b), d = B.clone().sub(A), len = d.length(); if (len < 1e-5) return; P(cyl(r2, r1, len, 8), mat, (A.x + B.x)/2, (A.y + B.y)/2, (A.z + B.z)/2, p, {q:new THREE.Quaternion().setFromUnitVectors(_rbY, d.normalize())}); };   // Stab von a (Radius r1) nach b (r2)
  const cable = (pts, r, mat, p) => { const c = new THREE.CatmullRomCurve3(pts.map(V)); P(new THREE.TubeGeometry(c, 16, r, 5, false), mat, 0, 0, 0, p); };
  const FULL = PI*2;
  const lens = (s, x, y, z, p, k, live) => { P(cyl(.05*k, .05*k, .024, 22), inner, x, y, z, p, {r:[0, 0, PI/2]}); P(tor(.042*k, .006*k, 24), steel, x + s*.014*k, y, z, p, {r:[0, PI/2, 0]}); P(tor(.03*k, .005*k, 22), gold, x + s*.015*k, y, z, p, {r:[0, PI/2, 0]}); P(tor(.018*k, .004*k, 18), steel, x + s*.016*k, y, z, p, {r:[0, PI/2, 0]});
    if (live) add(new THREE.SphereGeometry(.015*k, 12, 8), eyeM, x + s*.015*k, y, z, p); else ball(.014*k, glowM, x + s*.014*k, y, z, p); };   // Linsen-Gelenk: Scheibe, drei Ringe, Glaslinse

  /* ================= BEINE: lang, schlank, Krallenfüße ================= */
  R.legs = []; R.shins = [];
  for (const s of [-1, 1]) {
    const leg = new THREE.Group(); leg.position.set(s*.09, .78, 0); g.add(leg); R.legs.push(leg);
    const sh = new THREE.Group(); sh.position.set(0, -.46, 0); leg.add(sh); R.shins.push(sh);                // erstes Group-Kind = Unterschenkel
    ball(.05, inner, 0, 0, 0, leg); lens(s, s*.05, 0, 0, leg, 1.1);                                              // Hüftlinse
    L([[0, .046, .05], [-.14, .05, .056], [-.3, .04, .04], [-.46, .03, .03]], 0, FULL, inner, leg, 16);          // Oberschenkel-Kern
    L([[-.02, .052, .056], [-.13, .06, .066, 0, .004], [-.26, .052, .056], [-.37, .042, .046]], -.95, .95, shell, leg);                         // Front (Quadrizeps)
    L([[-.05, .05, .054], [-.17, .058, .06], [-.33, .044, .046]], s*PI/2 - .55, s*PI/2 + .55, gold, leg);                                          // Seitenplatte
    L([[-.02, .05, .054, 0, -.004], [-.14, .058, .066, 0, -.01], [-.3, .042, .048]], PI - .8, PI + .8, shell, leg);                                // Beuger hinten
    bone([-s*.03, -.04, .04], [-s*.036, -.36, .036], .008, .006, steel, leg); bone([s*.032, -.06, -.045], [s*.026, -.4, -.04], .012, .01, inner, leg); bone([s*.032, -.06, -.045], [s*.03, -.26, -.043], .006, .006, steel, leg);   // Kolben
    ball(.046, inner, 0, -.46, 0, leg); lens(s, s*.044, -.46, 0, leg, .9);                                       // Kniegelenk
    L([[-.4, .034, .044, 0, .01], [-.46, .048, .058, 0, .014], [-.52, .036, .044, 0, .008]], -.8, .8, gold, leg, 12);                              // Knieschale
    L([[0, .032, .034], [-.1, .034, .04, 0, -.006], [-.2, .026, .028], [-.3, .02, .02]], 0, FULL, inner, sh, 14);   // Unterschenkel-Kern
    L([[-.01, .038, .04], [-.08, .042, .048], [-.18, .032, .036], [-.27, .024, .026]], -.9, .9, shell, sh);        // Schienbeinschiene
    L([[-.02, .04, .044, 0, -.01], [-.09, .05, .056, 0, -.014], [-.18, .04, .046, 0, -.01], [-.26, .024, .026]], PI - 1.2, PI + 1.2, gold, sh);     // Wade
    cable([[s*.01, -.02, -.04], [s*.03, -.12, -.06], [s*.01, -.26, -.034]], .004, copper, sh);
    ball(.03, inner, 0, -.3, 0, sh); P(tor(.034, .005, 16), steel, 0, -.3, 0, sh, {r:[PI/2, 0, 0]});            // Knöchel
    bone([0, -.3, -.02], [0, -.33, -.09], .014, .01, inner, sh); ell(.04, .026, .075, shell, 0, -.315, .03, sh);       // Ferse + Fußrücken
    for (const tx of [-.028, 0, .028]) { bone([tx, -.325, .08], [tx*1.2, -.345, .15], .013, .006, inner, sh); bone([tx*1.2, -.345, .15], [tx*1.3, -.352, .19], .006, .002, steel, sh); }   // Zehen mit Krallen
    ell(.034, .018, .05, gold, 0, -.305, .075, sh); P(bxg(.07, .008, .12), rub, 0, -.345, .02, sh);
  }

  /* ================= RUMPF: schmale Taille, V-Brustpanzer ================= */
  L([[.68, .095, .075], [.74, .125, .085], [.82, .118, .082], [.88, .085, .066]], 0, FULL, inner, null, 18);        // Becken-Kern
  L([[.7, .11, .09], [.76, .135, .1], [.84, .125, .092], [.89, .092, .075]], -.7, .7, shell, null, 14);              // Schambeinschale vorn
  for (const s of [-1, 1]) { L([[.7, .125, .09], [.78, .15, .104], [.87, .12, .085]], s*PI/2 - .5, s*PI/2 + .5, gold, null, 12); P(cyl(.052, .052, .03, 14), gold, s*.09, .64, 0); }   // Hüftflügel
  L([[.86, .062, .05], [.94, .056, .046], [1.02, .064, .052], [1.1, .095, .07], [1.2, .118, .084], [1.28, .104, .07], [1.345, .05, .045]], 0, FULL, inner, null, 20);   // Rumpf-Kern (taillenschmal)
  for (let i = 0; i < 5; i++) P(tor(.07 + i*.004, .006, 20), steel, 0, .87 + i*.04, 0, null, {r:[PI/2, 0, 0], s:[1, .85, 1]});           // freiliegende Rippen
  for (const k of [-1, 0, 1]) cable([[k*.025, .84, .06], [k*.032, .94, .066], [k*.024, 1.06, .074]], .005, k ? copper : rub);
  bone([-.05, .86, .052], [-.05, 1.0, .056], .009, .009, steel); bone([.05, .86, .052], [.05, 1.0, .056], .009, .009, steel);
  for (let i = 0; i < 8; i++) P(bxg(.034 - i*.0015, .024, .03), steel, 0, .88 + i*.047, -.062);                         // Wirbelsäule
  for (const s of [-1, 1]) cable([[s*.04, .86, -.05], [s*.065, 1.0, -.07], [s*.07, 1.2, -.07]], .006, rub);
  // V-förmiger Brustpanzer (gold) + weiße Seitenplatten
  L([[1.04, .062, .06], [1.12, .11, .086], [1.2, .134, .096], [1.29, .118, .084], [1.33, .08, .066]], -1.15, 1.15, gold, null, 20, 3);
  for (const s of [-1, 1]) { L([[1.1, .112, .082], [1.2, .14, .098], [1.28, .124, .088]], s*PI/2 - .35, s*PI/2 + .45, shell, null, 10); L([[1.1, .116, .084], [1.2, .126, .092], [1.3, .11, .08]], s > 0 ? PI - .95 : PI + .05, s > 0 ? PI - .05 : PI + .95, shell, null, 10); }
  L([[.9, .072, .06], [.96, .078, .066], [1.02, .085, .07]], -.9, .9, shell, null, 12, 2);                              // Bauchplatte
  P(tor(.03, .007, 18), steel, 0, 1.19, .098); const chest = add(new THREE.SphereGeometry(.016, 10, 8), new THREE.MeshBasicMaterial({color:o.glow}), 0, 1.19, .097); R.chest = chest;   // Leuchtkern
  P(cyl(.1, .13, .03, 18), inner, 0, 1.345, 0);
  for (let k = 0; k < 9; k++) { const a = k/9*FULL; cable([[Math.cos(a)*.034, 1.3, Math.sin(a)*.034], [Math.cos(a + .6)*.04, 1.37, Math.sin(a + .6)*.04], [Math.cos(a + 1.2)*.036, 1.43, Math.sin(a + 1.2)*.036]], .0045, k % 3 ? rub : copper); }   // Halskabel
  for (let i = 0; i < 3; i++) P(tor(.046, .007, 14), steel, 0, 1.33 + i*.035, 0, null, {r:[PI/2, 0, 0]});

  /* ================= KOPF: Helm mit Kamera-Linse (kein Display) ================= */
  const head = new THREE.Group(); head.position.set(0, 1.38, 0); g.add(head); R.head = head;
  const HY = .2, dkm = mStd(0x050608, .6, .35);
  // Schädel/Mechanik (dunkel, sichtbar in den Spalten) + Hals
  P(sph(18, 14), dkm, 0, HY - .01, -.02, head, {s:[.085, .15, .085]});
  P(cyl(.06, .07, .09, 14), dkm, 0, .02, -.01, head);
  // Helm: EIN schlanker, nach hinten gestreckter Eierkopf, Scheitel nach hinten verschoben (cz), leicht nach vorn geneigt
  const H = (a, b, mat, seg) => L([[.02, .03, .042, 0, .032], [.05, .056, .07, 0, .018], [.075, .075, .085, 0, .004], [.1, .092, .09, 0, -.006], [.15, .112, .118, 0, -.02], [.22, .128, .152, 0, -.045], [.3, .122, .162, 0, -.07], [.37, .092, .13, 0, -.085], [.415, .03, .05, 0, -.09]], a, b, mat, head, seg || 30, 3);
  H(0, FULL, shell);
  // Zierlinien: dunkle Nähte (Torus-Bögen) über den Helm, wie die Fugen auf dem Referenzbild
  for (const y of [.262, .335]) L([[y - .004, .1285 - (y - .262)*.4, .1595 - (y - .262)*.3, 0, -.058 - (y - .262)*.35], [y, .1285 - (y - .262)*.4, .1595 - (y - .262)*.3, 0, -.058 - (y - .262)*.35], [y + .004, .1285 - (y - .262)*.4, .1595 - (y - .262)*.3, 0, -.058 - (y - .262)*.35]], 0, FULL, dkm, head, 30, 1);   // Fugenbänder
  L([[.16, .1225, .1285, 0, -.0215], [.2, .1355, .16, 0, -.044], [.25, .1345, .167, 0, -.056], [.28, .126, .164, 0, -.064]], -.95, .0, mStd(0x07090c, .9, .1), head, 16, 3);   // dunkles Visier-Feld (Frontpartie, links der Mitte)
  // Kamera-Linse: tief in einer Aussparung an der rechten Kopfseite, Tubus ragt heraus (wie Referenzbild 3)
  { const ex = .122, ey = HY + .005, ez = .03;
    P(cyl(.07, .07, .05, 30), dkm, ex, ey, ez, head, {r:[0, 0, PI/2]});                                             // Aussparung
    P(tor(.074, .01, 30), shell, ex + .02, ey, ez, head, {r:[0, PI/2, 0]});                                          // Wulst am Rand
    P(cyl(.056, .056, .05, 28), dkm, ex + .03, ey, ez, head, {r:[0, 0, PI/2]});                                      // Tubus
    for (let k = 0; k < 4; k++) P(tor(.056 - k*.007, .0045, 26), k % 2 ? gold : steel, ex + .056 + k*.002, ey, ez, head, {r:[0, PI/2, 0]});   // Ringe
    P(cyl(.024, .024, .014, 22), mStd(0x0a1118, .9, .08), ex + .062, ey, ez, head, {r:[0, 0, PI/2]});                // Glas
    add(new THREE.SphereGeometry(.014, 14, 10), eyeM, ex + .072, ey, ez, head).scale.x = .4;                          // leuchtender Kern
    P(sph(8, 6), steel, ex + .03, ey + .075, ez - .02, head, {s:[.012, .012, .012]});                               // Mini-Sensor
    ball(.008, glowM, ex + .02, ey - .08, ez + .02, head); }
  // linke Seite: kleiner Sensorknopf
  P(tor(.016, .004, 14), steel, -.124, HY + .04, .0, head, {r:[0, PI/2, 0]}); ball(.008, glowM, -.126, HY + .04, 0, head);
  // Antenne + Kabel am Hinterkopf, die in den Hals laufen
  P(cyl(.004, .004, .09, 6), steel, -.04, .43, -.09, head, {r:[.2, 0, .1]}); ball(.008, glowM, -.05, .475, -.095, head);
  for (let k = 0; k < 7; k++) { const x = -.06 + k*.02; cable([[x, HY + .02, -.2], [x*1.3, HY - .1, -.2], [x*1.4, .08, -.13], [x*.7, .0, -.05]], .0045, k % 2 ? rub : copper, head); }
  P(cyl(.07, .075, .04, 16), inner, 0, .0, 0, head);

  /* ================= ARME: schlank, Schulterpanzer, echte Hände ================= */
  const arm = s => { const A = new THREE.Group(); A.position.set(s*.2, 1.27, 0); g.add(A);
    ball(.046, inner, 0, 0, 0, A); lens(s, s*.052, -.01, 0, A, 1.1);                                              // Schulterlinse
    L([[.08, .05, .06], [.05, .08, .09], [0, .088, .094], [-.05, .074, .078], [-.11, .05, .055]], s*PI/2 - 2.1, s*PI/2 + 2.1, shell, A, 20, 3, s*.014, .02, 0);   // oberer Schulterpanzer
    L([[.02, .074, .08], [-.06, .086, .09], [-.14, .06, .066]], s*PI/2 - 1.4, s*PI/2 + 1.4, gold, A, 14, 2, s*.02, .0, 0);                              // zweite Lamelle
    L([[0, .03, .03], [-.15, .026, .027], [-.3, .024, .024]], 0, FULL, inner, A, 12);
    L([[-.11, .034, .036], [-.17, .04, .044, 0, .004], [-.25, .032, .034]], -1.0, 1.0, shell, A);                      // Bizeps
    cable([[-s*.012, -.03, -.026], [-s*.028, -.14, -.03], [-s*.01, -.29, -.02]], .005, copper, A); cable([[s*.016, -.03, .022], [s*.03, -.15, .026], [s*.012, -.29, .02]], .004, rub, A);
    const F = new THREE.Group(); F.position.set(0, -.3, 0); A.add(F);
    ball(.034, inner, 0, 0, 0, F); lens(s, s*.036, 0, 0, F, .8);                                                     // Ellbogen
    bone([0, -.02, -.034], [0, -.2, -.04], .008, .007, steel, F); bone([-s*.02, -.02, .03], [-s*.014, -.12, .036], .01, .01, inner, F);   // Hydraulik
    L([[0, .028, .028], [-.14, .024, .024], [-.28, .018, .018]], 0, FULL, inner, F, 12);
    L([[-.03, .042, .044], [-.1, .042, .044], [-.18, .032, .034], [-.25, .024, .026]], s*PI/2 - 1.45, s*PI/2 + 1.45, gold, F);   // Unterarm-Panzer
    P(cyl(.03, .03, .02, 14, true), shell, 0, -.255, 0, F);
    // --- echte Hand: Handwurzel, Handteller, 4 Finger à 3 Glieder, Daumen, Sehnen ---
    P(cyl(.026, .026, .022, 14), steel, 0, -.285, 0, F);
    ell(.034, .036, .016, inner, 0, -.33, 0, F); ell(.036, .03, .01, shell, 0, -.328, -.014, F);                      // Handteller + Handrücken-Platte
    for (const k of [[-.026, .034, .03, .026], [-.009, .04, .034, .028], [.009, .038, .032, .026], [.026, .03, .026, .02]]) {          // [x, Länge1, Länge2, Länge3]
      let cur = [k[0], -.352, .006], ang = .15;
      for (let j = 1; j <= 3; j++) { const len = k[j], nx = [cur[0], cur[1] - Math.cos(ang)*len, cur[2] + Math.sin(ang)*len]; bone(cur, nx, .0072 - j*.0008, .0062 - j*.0008, rub, F); ball(.0072 - j*.0006, steel, nx[0], nx[1], nx[2], F); cur = nx; ang += .42; }
      cable([[k[0], -.3, -.012], [k[0], -.345, -.012], [k[0], -.36, -.008]], .0025, copper, F);
    }
    { let cur = [-s*.03, -.322, .008], ang = .5; for (let j = 1; j <= 2; j++) { const len = j === 1 ? .03 : .026, nx = [cur[0] - s*Math.sin(.6)*len*.8, cur[1] - Math.cos(ang)*len, cur[2] + Math.sin(ang)*len]; bone(cur, nx, .0085 - j*.001, .0075 - j*.001, rub, F); ball(.0078 - j*.0008, steel, nx[0], nx[1], nx[2], F); cur = nx; ang += .35; } }   // Daumen
    return {A, F}; };
  const La = arm(-1), Rr = arm(1); R.aL = La.A; R.fL = La.F; R.aR = Rr.A; R.fR = Rr.F;
  const glass = new THREE.Group(); glass.position.set(0, -.36, .03); R.fR.add(glass); R.glass = glass;             // Glas liegt in der Hand
  add(new THREE.CylinderGeometry(.036, .03, .1, 10), new THREE.MeshStandardMaterial({color:0xcad4de, transparent:true, opacity:.35, roughness:.1}), 0, 0, 0, glass);
  R.liq = add(new THREE.CylinderGeometry(.031, .027, .066, 10), new THREE.MeshStandardMaterial({color:0x8a2018, emissive:0x50140e, roughness:.3}), 0, -.012, 0, glass); R.level = .85; setLevel(R, .85);

  /* ================= Varianten ================= */
  const dk = inner;
  if (o.cool) { const jm = mStd(0x1c1e22, .5, .35), ora = new THREE.MeshBasicMaterial({color:0x3c8680});            // Türsteher: schwarze Schwerpanzerung, Hörner
    L([[1.06, .14, .106], [1.18, .15, .112], [1.3, .13, .098]], -1.3, 1.3, jm, null, 20); P(bxg(.012, .24, .01), ora, -.05, 1.17, .14); P(bxg(.012, .24, .01), ora, .05, 1.17, .14);
    for (const s of [-1, 1]) { ell(.1, .07, .11, jm, s*.225, 1.35, 0, null, [0, 0, -s*.2]); P(new THREE.ConeGeometry(.026, .12, 6), jm, s*.272, 1.42, 0, null, {r:[0, 0, -s*1.1]}); P(new THREE.ConeGeometry(.022, .16, 6), jm, s*.07, .44, -.02, head, {r:[0, 0, -s*.5]}); }
    P(bxg(.2, .02, .05), ora, 0, HY + .2, .08, head); }
  if (o.pouch) { add(bxg(.1, .09, .06), mStd(0x4a3a2a, .1, .9), .15, .86, .08); add(bxg(.1, .02, .065), mStd(0x32261c, .1, .9), .15, .91, .08); }
  if (o.scarf) { add(cyl(.07, .076, .06, 12), mStd(o.scarf, 0, .95), 0, 1.335, 0); const tl = add(bxg(.06, .3, .015), mStd(o.scarf, 0, .95), .05, 1.18, .11); tl.rotation.z = .05; R.tail = tl; }
  if (o.tape) add(cyl(.032, .032, .06, 8), mStd(0xd8d2c0, 0, .9), 0, -.1, 0, R.aL);
  if (o.apron) { add(bxg(.24, .34, .02), mStd(o.apron, 0, .95), 0, .96, .13); add(bxg(.03, .03, .02), dk, .09, 1.12, .144); }
  if (o.cracks) R.crack = true;

  /* ================= Verschmelzen ================= */
  for (const [parent, mm] of store) for (const [mat, list] of mm) { const m = new THREE.Mesh(mergeGeos(list), mat); parent.add(m); list.forEach(q => q.dispose()); }
  R.g.userData.d = 1;
  g.traverse(m => { if (m.isMesh) m.castShadow = true; }); return R;
}
function setLevel(R, v) { R.level = v; const h = .066*Math.max(.02, v); R.liq.scale.y = Math.max(.02, v); R.liq.position.y = -.045 + h/2; R.liq.visible = v > .03; }
function drawFace(R, t) {     // kein Bildschirm: Ausdruck über die Helligkeit der Kamera-Linse
  const col = R.o.glow, r = (col >> 16 & 255)/255, g2 = (col >> 8 & 255)/255, b = (col & 255)/255;
  let k = .55 + .1*Math.sin(t*1.7 + R.ph);                                                   // ruhiges Pulsieren
  if (R.lookT > 0) k = 1.15; if (R.blink < .12) k = .12;                                     // aufmerksam / Blinzeln
  if (R.talkT > 0) { const e = R.ev.find(q => R.tAt >= q.t0 && R.tAt <= q.t1); k = e ? .85 + .5*(.5 + .5*Math.sin(t*38))*Math.min(1, e.s) : .5; }
  else if (R.drinkT >= 0) k = .35; else if (R.smile) k = 1.05;
  R.eyeM.color.setRGB(Math.min(1, r*k + .08*k), Math.min(1, g2*k + .08*k), Math.min(1, b*k + .08*k));
}
