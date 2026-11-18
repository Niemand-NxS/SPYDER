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
/* ---- Loft: gleitender elliptischer Querschnitt entlang y – Grundlage für alle geschwungenen Körper- und Panzerteile ----
   prof: [[y, rx, rz, cx, cz], …]   a0..a1: Winkelbereich (0 = vorn +z, π/2 = +x, π = hinten); voller Kreis = geschlossener Körper */
function loft(prof, a0, a1, seg = 16, sub = 3) {
  const cA = new THREE.CatmullRomCurve3(prof.map(p => new THREE.Vector3(p[1], p[2], p[0]))), cB = new THREE.CatmullRomCurve3(prof.map(p => new THREE.Vector3(p[3] || 0, p[4] || 0, 0)));
  const n = Math.max(2, (prof.length - 1)*sub), pa = [], ua = [], ia = [];
  for (let i = 0; i <= n; i++) { const t = i/n, a = cA.getPoint(t), b = cB.getPoint(t);
    for (let j = 0; j <= seg; j++) { const an = a0 + (a1 - a0)*j/seg; pa.push(b.x + a.x*Math.sin(an), a.z, b.y + a.y*Math.cos(an)); ua.push(j/seg, i/n); } }
  for (let i = 0; i < n; i++) for (let j = 0; j < seg; j++) { const a = i*(seg + 1) + j, b = a + 1, c = a + seg + 1, d = c + 1; ia.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pa, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(ua, 2)); g.setIndex(ia); g.computeVertexNormals();
  // Normalen müssen nach außen zeigen (Windung abhängig von Profilrichtung und Winkelrichtung)
  const mid = Math.floor(n/2)*(seg + 1) + Math.floor(seg/2), P0 = g.attributes.position, N0 = g.attributes.normal, b0 = cB.getPoint(Math.floor(n/2)/n);
  const rx = P0.getX(mid) - b0.x, rz = P0.getZ(mid) - b0.y;
  if (N0.getX(mid)*rx + N0.getZ(mid)*rz < 0) { const ix = g.index.array; for (let k = 0; k < ix.length; k += 3) { const t = ix[k + 1]; ix[k + 1] = ix[k + 2]; ix[k + 2] = t; } g.computeVertexNormals(); }
  return g;
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
  const P = (geo, mat, x, y, z, parent, opt) => { const t = new THREE.Object3D(); t.position.set(x, y, z); if (opt && opt.r) t.rotation.set(opt.r[0], opt.r[1], opt.r[2]); if (opt && opt.s) t.scale.set(opt.s[0], opt.s[1], opt.s[2]); t.updateMatrix();
    const gg = geo.index ? geo.toNonIndexed() : geo; gg.applyMatrix4(t.matrix); parent = parent || g; if (!store.has(parent)) store.set(parent, new Map()); const mm = store.get(parent); if (!mm.has(mat)) mm.set(mat, []); mm.get(mat).push(gg); };
  const cyl = (rt, rb, h, seg = 12, open = false, ts = 0, tl = PI*2) => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open, ts, tl), bxg = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const sph = (ws = 14, hs = 10, ps = 0, pl = PI*2, ts = 0, tl = PI) => new THREE.SphereGeometry(1, ws, hs, ps, pl, ts, tl), tor = (r, t, seg = 18, a = PI*2) => new THREE.TorusGeometry(r, t, 6, seg, a);
  const ball = (r, mat, x, y, z, p) => P(sph(10, 8), mat, x, y, z, p, {s:[r, r, r]});
  const ell = (rx, ry, rz, mat, x, y, z, p, r) => P(sph(14, 10), mat, x, y, z, p, {s:[rx, ry, rz], r});
  const L = (prof, a0, a1, mat, p, seg, sub, x = 0, y = 0, z = 0) => P(loft(prof, a0, a1, seg || 18, sub || 3), mat, x, y, z, p);     // Loft-Teil
  const cable = (pts, r, mat, p) => { const c = new THREE.CatmullRomCurve3(pts.map(q => new THREE.Vector3(q[0], q[1], q[2]))); P(new THREE.TubeGeometry(c, 14, r, 5, false), mat, 0, 0, 0, p); };
  const joint = (s, x, y, z, p, big) => { const k = big ? 1.2 : 1;      // rundes Seitengelenk: Scheibe, Ring, Linse (Achse = x)
    P(cyl(.05*k, .05*k, .026, 18), inner, x, y, z, p, {r:[0, 0, PI/2]}); P(tor(.038*k, .006*k, 22), steel, x + s*.016*k, y, z, p, {r:[0, PI/2, 0]}); P(tor(.024*k, .005*k, 18), steel, x + s*.016*k, y, z, p, {r:[0, PI/2, 0]}); ball(.016*k, glowM, x + s*.014*k, y, z, p); };
  const FULL = PI*2, FR = a => [-a, a], BK = a => [PI - a, PI + a];

  /* ---- Beine ---- */
  R.legs = []; R.shins = [];
  for (const s of [-1, 1]) {
    const leg = new THREE.Group(); leg.position.set(s*.09, .78, 0); g.add(leg); R.legs.push(leg);
    const sh = new THREE.Group(); sh.position.set(0, -.46, 0); leg.add(sh); R.shins.push(sh);                // erstes Group-Kind = Unterschenkel
    ball(.054, inner, 0, 0, 0, leg); joint(s, s*.052, 0, 0, leg, true);                                          // Hüftgelenk mit Linse
    L([[0, .05, .05], [-.12, .054, .054], [-.28, .043, .042], [-.44, .034, .034], [-.47, .032, .032]], 0, FULL, inner, leg, 18);       // Oberschenkel innen
    L([[-.02, .06, .06], [-.1, .071, .069], [-.2, .066, .063], [-.3, .054, .051], [-.37, .046, .044]], -1.15, 1.15, shell, leg);           // Oberschenkel-Frontplatte
    L([[-.03, .062, .06], [-.14, .074, .066], [-.28, .058, .052], [-.36, .05, .046]], s*PI/2 - .75, s*PI/2 + .75, trim, leg);              // Außenplatte
    L([[-.04, .056, .058], [-.15, .064, .068, 0, -.006], [-.3, .05, .052]], PI - 1.0, PI + 1.0, shell, leg);                              // Hinterplatte
    P(cyl(.056, .052, .035, 16, true), trim, 0, -.4, 0, leg);                                                                            // Manschette überm Knie
    P(cyl(.01, .01, .24, 8), steel, -s*.032, -.2, -.056, leg); P(cyl(.018, .018, .12, 8), inner, -s*.032, -.12, -.056, leg);         // Hydraulik
    cable([[s*.03, -.04, -.044], [s*.05, -.16, -.052], [s*.034, -.3, -.044], [s*.012, -.44, -.032]], .006, gold, leg);
    cable([[-s*.02, -.05, .05], [-s*.044, -.2, .056], [-s*.022, -.42, .044]], .005, rub, leg);
    ball(.05, inner, 0, -.46, 0, leg); joint(s, s*.046, -.46, 0, leg, false);                                                       // Knie
    L([[-.42, .036, .046, 0, .01], [-.46, .05, .062, 0, .014], [-.5, .038, .048, 0, .008]], -.85, .85, trim, leg, 14);                // Kniescheibe
    L([[0, .034, .034], [-.1, .036, .04, 0, -.008], [-.2, .029, .03], [-.3, .022, .022]], 0, FULL, inner, sh, 16);                    // Unterschenkel innen
    L([[-.01, .046, .048], [-.1, .046, .05], [-.2, .036, .04], [-.27, .029, .031]], -.95, .95, shell, sh);                           // Schienbeinplatte
    L([[-.02, .046, .05, 0, -.012], [-.09, .056, .06, 0, -.016], [-.18, .046, .05, 0, -.01], [-.26, .03, .032]], PI - 1.35, PI + 1.35, shell, sh);   // Wade
    P(cyl(.04, .04, .03, 14, true), trim, 0, -.03, 0, sh);
    cable([[0, -.02, -.04], [s*.02, -.14, -.065], [0, -.28, -.035]], .005, gold, sh);
    ball(.036, inner, 0, -.3, 0, sh); P(tor(.04, .006, 16), steel, 0, -.3, 0, sh, {r:[PI/2, 0, 0]});                                // Knöchel
    P(bxg(.07, .035, .15), inner, 0, -.31, .03, sh); ell(.055, .032, .105, shell, 0, -.305, .035, sh); ell(.05, .022, .045, trim, 0, -.3, .11, sh);   // Fuß
    P(bxg(.095, .012, .18), rub, 0, -.342, .03, sh); P(bxg(.07, .035, .04), rub, 0, -.32, -.055, sh);
  }

  /* ---- Becken, Bauch, Rumpf ---- */
  L([[.69, .11, .085], [.75, .132, .095], [.83, .13, .092], [.89, .1, .076]], 0, FULL, inner, null, 20);       // Becken innen
  L([[.7, .125, .097], [.77, .148, .108], [.85, .14, .1], [.9, .112, .085]], -.8, .8, shell, null);              // Beckenplatte vorn
  for (const s of [-1, 1]) L([[.72, .13, .1], [.8, .15, .11], [.88, .125, .09]], s*PI/2 - .55, s*PI/2 + .55, trim, null, 14);   // Hüftschalen
  L([[.88, .106, .08], [.905, .108, .082], [.925, .1, .076]], 0, FULL, trim);                                       // Gürtel
  L([[.86, .08, .066], [.95, .082, .068], [1.03, .095, .076], [1.12, .118, .09], [1.22, .126, .094, 0, .004], [1.3, .108, .082], [1.345, .052, .05]], 0, FULL, inner, null, 22);   // Rumpf innen
  for (let i = 0; i < 4; i++) { const y = .92 + i*.047; P(tor(.088 + i*.004, .008, 22), steel, 0, y, 0, null, {r:[PI/2, 0, 0], s:[1, .86, 1]}); }       // Rippen
  for (const k of [-1, 0, 1]) cable([[k*.03, .88, .075], [k*.036, .98, .084], [k*.026, 1.09, .09]], .006, k ? gold : rub);
  for (const [y0, y1, k] of [[.925, .955, 1.1], [.972, 1.004, 1.12], [1.02, 1.056, 1.13]]) L([[y0, .086*k, .07*k], [y1, .092*k, .074*k]], -1.05, 1.05, shell, null, 14, 1);    // Bauchlamellen
  for (const s of [-1, 1]) {
    const a0 = s > 0 ? .1 : -1.55, a1 = s > 0 ? 1.55 : -.1;
    L([[1.09, .124, .096], [1.15, .14, .108], [1.22, .141, .106], [1.29, .12, .09]], a0, a1, shell, null, 14);                      // Brustplatten (Mitte bleibt offen)
    L([[1.1, .122, .094], [1.2, .13, .098], [1.3, .11, .084]], s > 0 ? PI - 1.45 : PI + .35, s > 0 ? PI - .35 : PI + 1.45, shell, null, 12);   // Schulterblattplatten
    L([[1.26, .13, .098], [1.3, .122, .09], [1.335, .085, .072]], s*(PI/2) - .6, s*(PI/2) + .6, trim, null, 10);                      // Schulterkappen-Sockel
    P(bxg(.012, .16, .02), inner, s*.02, 1.15, .112);
  }
  L([[1.285, .126, .096], [1.31, .12, .09], [1.34, .09, .074]], -1.3, 1.3, trim, null, 16, 2);                                   // Schlüsselbeinspange
  L([[.86, .13, .1], [.95, .122, .092], [1.04, .13, .098]], PI - 1.1, PI + 1.1, shell, null, 14, 2);                              // unterer Rückenpanzer
  P(tor(.03, .008, 18), steel, 0, 1.17, .102); const chest = add(new THREE.SphereGeometry(.017, 10, 8), new THREE.MeshBasicMaterial({color:o.glow}), 0, 1.17, .098); R.chest = chest;   // Leuchtkern
  P(cyl(.1, .12, .03, 18), inner, 0, 1.34, 0); P(cyl(.043, .05, .12, 12), inner, 0, 1.375, 0);                                  // Kragen, Hals
  for (let k = 0; k < 6; k++) { const a = k/6*PI*2; cable([[Math.cos(a)*.038, 1.31, Math.sin(a)*.038], [Math.cos(a + .5)*.044, 1.37, Math.sin(a + .5)*.044], [Math.cos(a + 1)*.042, 1.42, Math.sin(a + 1)*.042]], .005, k % 3 ? rub : gold); }
  for (let i = 0; i < 7; i++) P(bxg(.038 - i*.002, .026, .03), steel, 0, 1.0 + i*.05, -.1);                                      // Wirbelsäule
  P(bxg(.17, .24, .045), inner, 0, 1.1, -.14); P(bxg(.14, .2, .03), shell, 0, 1.1, -.17); for (let k = 0; k < 3; k++) P(bxg(.12, .01, .008), glowM, 0, 1.05 + k*.06, -.188);   // Akku
  for (const s of [-1, 1]) cable([[s*.06, 1.0, -.11], [s*.1, 1.12, -.13], [s*.085, 1.3, -.1]], .007, rub);

  /* ---- Kopf: Helm + ovales, gewölbtes Display ---- */
  const head = new THREE.Group(); head.position.set(0, 1.38, 0); g.add(head); R.head = head;
  const HY = .17, HX = .158, HYS = .19, HZ = .142, GP = 1.1;
  P(sph(18, 14), inner, 0, HY, 0, head, {s:[HX, HYS, HZ]});                                                     // Innenschädel
  L([[.06, .1, .098, 0, -.012], [.15, .172, .16, 0, -.024], [.26, .18, .172, 0, -.038], [.34, .152, .152, 0, -.044], [.395, .085, .095, 0, -.048], [.425, .02, .03, 0, -.048]], GP, PI*2 - GP, shell, head, 28, 3);   // Helmschale (zieht sich nach hinten)
  L([[.29, .158, .146, 0, -.01], [.34, .15, .144, 0, -.02], [.385, .1, .1, 0, -.034], [.415, .03, .04, 0, -.04]], -GP - .05, GP + .05, shell, head, 24, 2);                            // Stirnschild
  L([[.015, .09, .086], [.06, .118, .108], [.105, .104, .098]], -1.0, 1.0, trim, head, 16, 2);                    // Kinnschale
  for (const s of [-1, 1]) {                                                                                  // Kamera-Linsen-Module an den Seiten
    const x = s*(.176), y = HY;
    P(cyl(.058, .058, .03, 22), inner, x, y, -.01, head, {r:[0, 0, PI/2]}); P(tor(.052, .008, 24), steel, x + s*.016, y, -.01, head, {r:[0, PI/2, 0]}); P(tor(.036, .006, 22), trim, x + s*.017, y, -.01, head, {r:[0, PI/2, 0]}); P(tor(.022, .005, 18), steel, x + s*.018, y, -.01, head, {r:[0, PI/2, 0]}); ball(.018, glowM, x + s*.016, y, -.01, head);
    cable([[s*.15, HY - .06, -.06], [s*.17, HY - .15, -.03], [s*.07, .03, .02]], .004, rub, head);
  }
  cable([[0, HY + .1, -.17], [.04, HY + .22, -.13], [.1, HY + .3, -.06], [.1, .46, -.03]], .004, rub, head); P(cyl(.016, .016, .03, 8), steel, .1, .375, -.03, head); ball(.016, glowM, .1, .47, -.03, head);   // Antennenkabel
  P(cyl(.07, .07, .045, 16), inner, 0, .015, 0, head); P(tor(.07, .008, 18), steel, 0, .035, 0, head, {r:[PI/2, 0, 0]});
  const cv = document.createElement("canvas"); cv.width = 160; cv.height = 200; R.cx = cv.getContext("2d"); R.tex = new THREE.CanvasTexture(cv); R.tex.anisotropy = 4;
  const patch = (a, b, mat, k) => { const m = add(new THREE.SphereGeometry(1, 28, 20, PI/2 - a, 2*a, PI/2 - b, 2*b), mat, 0, HY, 0, head); m.scale.set(HX*k, HYS*k, HZ*k); return m; };
  patch(1.06, .93, new THREE.MeshStandardMaterial({color:o.acc, metalness:.6, roughness:.4, alphaMap:robRingTex(), alphaTest:.5, side:THREE.DoubleSide}), 1.012);   // ovale Einfassung
  patch(.97, .83, new THREE.MeshBasicMaterial({map:R.tex, transparent:true}), 1.02);                                                                                 // Display (gewölbt)
  patch(1.0, .86, new THREE.MeshStandardMaterial({color:0x9fb2c6, metalness:.7, roughness:.05, transparent:true, opacity:.12, depthWrite:false}), 1.034);               // Glasscheibe

  /* ---- Arme ---- */
  const arm = s => { const A = new THREE.Group(); A.position.set(s*.2, 1.27, 0); g.add(A);
    ball(.048, inner, 0, 0, 0, A); joint(s, s*.05, -.005, 0, A, true);                                           // Schultergelenk mit Linse
    L([[.07, .05, .056], [.045, .074, .08], [0, .084, .088], [-.05, .074, .076], [-.1, .05, .052]], s*PI/2 - 2.3, s*PI/2 + 2.3, shell, A, 22, 3, s*.012, .02, 0);   // Schulterpanzer
    L([[.03, .06, .06], [-.01, .078, .084], [-.06, .056, .06]], s*PI/2 - .8, s*PI/2 + .8, trim, A, 12, 2, s*.03, .035, 0);
    L([[0, .034, .034], [-.15, .03, .03], [-.3, .027, .027]], 0, FULL, inner, A, 14);                           // Oberarm innen
    L([[-.07, .042, .044], [-.13, .05, .054, 0, .004], [-.21, .038, .04], [-.25, .034, .035]], -1.15, 1.15, shell, A);   // Bizepsplatte
    L([[-.07, .04, .042], [-.14, .045, .048, 0, -.004], [-.22, .035, .036]], PI - .9, PI + .9, shell, A);        // Trizepsplatte
    cable([[-s*.015, -.03, -.03], [-s*.03, -.14, -.036], [-s*.012, -.28, -.02]], .005, gold, A); cable([[s*.02, -.03, .02], [s*.034, -.15, .026], [s*.015, -.28, .02]], .004, rub, A);
    for (const y of [-.04, -.24]) P(cyl(.037, .037, .014, 14), steel, 0, y, 0, A);
    const F = new THREE.Group(); F.position.set(0, -.3, 0); A.add(F);
    ball(.038, inner, 0, 0, 0, F); joint(s, s*.04, 0, 0, F, false);                                              // Ellbogen
    L([[0, .03, .03], [-.14, .026, .026], [-.28, .02, .02]], 0, FULL, inner, F, 14);                             // Unterarm innen
    L([[-.04, .046, .05], [-.1, .048, .05], [-.19, .036, .037], [-.25, .028, .029]], s*PI/2 - 1.5, s*PI/2 + 1.5, shell, F);   // Unterarmpanzer (Außenseite)
    P(cyl(.036, .036, .03, 14, true), trim, 0, -.035, 0, F); P(cyl(.03, .03, .022, 14, true), trim, 0, -.26, 0, F);
    P(cyl(.01, .01, .2, 8), steel, 0, -.14, -.036, F); cable([[s*.02, -.04, .03], [s*.032, -.15, .034], [s*.012, -.27, .022]], .005, gold, F);
    P(cyl(.028, .028, .026, 14), steel, 0, -.285, 0, F);                                                         // Handgelenk
    P(bxg(.062, .05, .036), inner, 0, -.325, 0, F); ell(.032, .038, .012, shell, 0, -.325, -.02, F);             // Handfläche + Handrücken
    for (const fx of [-.024, -.008, .008, .024]) { P(bxg(.012, .04, .013), rub, fx, -.37, .008, F); P(bxg(.011, .03, .012), rub, fx, -.403, .014, F, {r:[-.4, 0, 0]}); }
    P(bxg(.014, .045, .014), rub, -s*.04, -.335, .012, F, {r:[0, 0, s*.5]}); P(bxg(.012, .03, .012), rub, -s*.058, -.365, .018, F, {r:[0, 0, s*.8]});
    return {A, F}; };
  const La = arm(-1), Rr = arm(1); R.aL = La.A; R.fL = La.F; R.aR = Rr.A; R.fR = Rr.F;
  const glass = new THREE.Group(); glass.position.set(0, -.33, .02); R.fR.add(glass); R.glass = glass;
  add(new THREE.CylinderGeometry(.036, .03, .1, 10), new THREE.MeshStandardMaterial({color:0xcad4de, transparent:true, opacity:.35, roughness:.1}), 0, 0, 0, glass);
  R.liq = add(new THREE.CylinderGeometry(.031, .027, .066, 10), new THREE.MeshStandardMaterial({color:0x8a2018, emissive:0x50140e, roughness:.3}), 0, -.012, 0, glass); R.level = .85; setLevel(R, .85);

  /* ---- Varianten ---- */
  if (o.cool) { const jm = mStd(0x23252b, .45, .4), ora = new THREE.MeshBasicMaterial({color:0x3c8680});            // Türsteher: schwere Panzerung
    L([[1.07, .14, .108], [1.18, .15, .114], [1.3, .13, .1]], -1.35, 1.35, jm, null, 20); P(bxg(.012, .24, .01), ora, -.05, 1.17, .14); P(bxg(.012, .24, .01), ora, .05, 1.17, .14);
    L([[.7, .15, .11], [.78, .16, .115], [.84, .14, .1]], -1.4, 1.4, jm, null, 14);
    for (const s of [-1, 1]) { ell(.1, .075, .11, jm, s*.225, 1.35, 0, null, [0, 0, -s*.2]); P(tor(.082, .008, 20), ora, s*.225, 1.35, 0, null, {r:[PI/2, 0, 0]}); P(new THREE.ConeGeometry(.026, .1, 6), jm, s*.27, 1.41, 0, null, {r:[0, 0, -s*1.1]}); }
    for (let k = 0; k < 4; k++) P(bxg(.022, .16, .06), k % 2 ? trim : inner, 0, .33 + (k === 1 || k === 2 ? .03 : 0), -.07 + k*.06, head, {r:[-.35 - k*.08, 0, 0]});
    P(bxg(.28, .02, .04), ora, 0, HY + .13, .12, head); }
  if (o.pouch) { add(bxg(.1, .09, .06), mStd(0x4a3a2a, .1, .9), .15, .86, .08); add(bxg(.1, .02, .065), mStd(0x32261c, .1, .9), .15, .91, .08); }
  if (o.scarf) { add(cyl(.088, .094, .06, 12), mStd(o.scarf, 0, .95), 0, 1.33, 0); const tl = add(bxg(.06, .3, .015), mStd(o.scarf, 0, .95), .05, 1.18, .13); tl.rotation.z = .05; R.tail = tl; }
  if (o.tape) add(cyl(.037, .037, .06, 8), mStd(0xd8d2c0, 0, .9), 0, -.1, 0, R.aL);
  if (o.apron) { add(bxg(.26, .34, .02), mStd(o.apron, 0, .95), 0, .98, .152); add(bxg(.03, .03, .02), dk, .09, 1.15, .166); }
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
