/* ======================= CJ-City: Querstraße am Westende der Straße ======================= */
// Wo vorher eine Mauer war, öffnet sich jetzt der Blick auf eine tiefe Häuserschlucht: eng gebaut, nach oben gestapelt,
// kaum Tageslicht am Boden, dafür Neon. Ein Maschendraht-Netz sperrt den Zugang (man kann nicht hinaus).
const CTY = {cars:[], t:0, nextCar:2.2};
function ctyWin(seed, w, h) {
  const pal = ["#d88a3a", "#f0b060", "#5aa0d0", "#c8d0e0", "#4fa9a3", "#8ab8e8"];
  let s = seed*9301 + 49297; const rnd = () => (s = (s*9301 + 49297)%233280)/233280;
  return canvasTex(w, h, (x, cw, ch) => {
    x.fillStyle = ["#0b0d14", "#0e1018", "#0a0c12"][seed%3]; x.fillRect(0, 0, cw, ch);
    for (let y = 6; y < ch - 10; y += 22) for (let xx = 6; xx < cw - 10; xx += 17) { const lit = rnd(); x.fillStyle = lit < .2 ? pal[(rnd()*pal.length)|0] : lit < .55 ? "#141822" : "#10131a"; x.globalAlpha = lit < .2 ? .85 : 1; x.fillRect(xx, y, 11, 14); }
    x.globalAlpha = 1; x.fillStyle = "rgba(30,34,46,.9)"; for (let y = 0; y < ch; y += 66) x.fillRect(0, y, cw, 3);
  }, 1, 1);
}
function buildCityMouth() {
  const X0 = -SW/2, hd = SD/2, DK = 30; CTY.cars.length = 0; CTY.t = 0; CTY.nextCar = 2.2;
  const bas = (c, o) => new THREE.MeshBasicMaterial(Object.assign({color:c, fog:false}, o || {}));
  const add = (m) => { exG.add(m); return m; };
  roomMeshes[2].visible = false;
  // Absperrnetz (Maschendraht, volle Höhe) – hier kommt man nicht hinaus
  const OPEN = cityOpen(), gzN = -1.2, netPiece = (z0, z1, y0, y1) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(z1 - z0, y1 - y0), fenceMat((z1 - z0)/2.4, (y1 - y0)/2.4)); m.position.set(X0 + .1, (y0 + y1)/2, (z0 + z1)/2); m.rotation.y = Math.PI/2; add(m); };
  if (OPEN) { netPiece(-hd, gzN - .6, 0, SH); netPiece(gzN + .6, hd, 0, SH); netPiece(gzN - .6, gzN + .6, 2.4, SH); } else netPiece(-hd, hd, 0, SH);
  for (let i = 0; i <= 4; i++) { const p = new THREE.Mesh(new THREE.BoxGeometry(.09, SH, .09), mStd(0x2a2e38, .6, .5)); p.position.set(X0 + .08, SH/2, -hd + .08 + i*(SD - .16)/4); add(p); }
  for (const y of [1.2, 4.5, 8.5]) { const r = new THREE.Mesh(new THREE.BoxGeometry(.06, .06, SD), mStd(0x2a2e38, .6, .5)); r.position.set(X0 + .08, y, 0); add(r); }
  // Tor im Zaun (verschlossen): Rahmen, Flügel, Griff, Scharnier
  { const gz = -1.2, gx = X0 + .16, gm = mStd(0x3a4050, .6, .5); const fr = (w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), gm); m.position.set(x, y, z); add(m); };
    fr(.12, 2.4, .12, gx, 1.2, gz - .6); fr(.12, 2.4, .12, gx, 1.2, gz + .6); fr(.12, .12, 1.32, gx, 2.4, gz);
    const n0 = exG.children.length; const leaf = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.3), fenceMat(1.1/2.4, 2.3/2.4)); leaf.position.set(gx + .02, 1.15, gz); leaf.rotation.y = Math.PI/2; add(leaf);
    fr(.06, .06, 1.1, gx + .03, 1.15, gz); fr(.06, 2.3, .06, gx + .03, 1.15, gz + .52); fr(.06, 2.3, .06, gx + .03, 1.15, gz - .52); fr(.06, .06, 1.1, gx + .03, .1, gz); fr(.06, .06, 1.1, gx + .03, 2.25, gz);
    const hn = new THREE.Mesh(new THREE.BoxGeometry(.08, .22, .05), mStd(0xc0c4cc, .8, .3)); hn.position.set(gx + .1, 1.1, gz + .42); add(hn); const lk = new THREE.Mesh(new THREE.BoxGeometry(.1, .12, .08), mStd(0x3c8680, .4, .5)); lk.position.set(gx + .1, .95, gz + .42); add(lk);
    if (OPEN) { const lg = new THREE.Group(); lg.position.set(gx, 0, gz + .55); lg.rotation.y = 1.4; for (const p of exG.children.slice(n0)) { exG.remove(p); p.position.x -= gx; p.position.z -= gz + .55; lg.add(p); } exG.add(lg); } }
  // Gehweg, Fahrbahn, Gegenseite
  const walk = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 220), mStd(0x2c2e36, .1, .85)); walk.rotation.x = -Math.PI/2; walk.position.set(X0 - 1.2, .02, 0); add(walk);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(14, 220), new THREE.MeshStandardMaterial({map:canvasTex(128, 256, (x, w, h) => { x.fillStyle = "#14161c"; x.fillRect(0, 0, w, h); speckle(x, w, h, 900, .12); x.fillStyle = "#c8b890"; for (let y = 0; y < h; y += 64) x.fillRect(w/2 - 2, y, 4, 34); x.fillStyle = "#4fa9a3"; x.fillRect(5, 0, 3, h); x.fillRect(w - 8, 0, 3, h); }, 1, 220/16), roughness:.32, metalness:.35}));
  road.rotation.x = -Math.PI/2; road.position.set(X0 - 2.4 - 7, 0, 0); add(road);
  const walk2 = walk.clone(); walk2.position.x = X0 - 2.4 - 14 - 1.2; add(walk2);
  const FXo = X0 - 2.4 - 14 - 2.4;                 // Fassadenlinie der Gegenseite
  // Fassaden-Türme (Gegenseite) mit angebauten Containern/Hütten
  const mods = [0x5a3022, 0x2e3a40, 0x1e2a44, 0x6a4a22, 0x3a3030, 0x24303a];
  const facade = (fx, dirX, z, w, h, seed) => {
    const t = ctyWin(seed, 128, 256); t.repeat.set(Math.max(1, Math.round(w/3)), Math.max(1, Math.round(h/6)));
    const f = new THREE.Mesh(new THREE.PlaneGeometry(w, h), bas(0xb0b4c0, {map:t})); f.material.color.setScalar(Math.max(.35, .95 - Math.abs(z)*.01)); f.material.polygonOffset = true; f.material.polygonOffsetFactor = 2; f.material.polygonOffsetUnits = 4; f.position.set(fx, h/2, z); f.rotation.y = dirX*Math.PI/2; add(f);
    const n = 5 + Math.floor(h/5); for (let i = 0; i < n; i++) { const mw = 2 + Math.random()*2.4, mh = 2.2 + Math.random()*.4, md = 1.2 + Math.random()*1.6, my = 2 + Math.floor(Math.random()*(h/2.6 - 1))*2.6 + mh/2, mz = z + (Math.random() - .5)*(w - mw);
      const c = mods[(Math.random()*mods.length)|0], m = new THREE.Mesh(new THREE.BoxGeometry(md, mh, mw), bas(c)); m.material.color.multiplyScalar(.8 + Math.random()*.3); m.position.set(fx - dirX*(md/2), my, mz); add(m);
      if (Math.random() < .7) { const wc = [0x3c8680, 0xf0b060, 0x6ab0e8, 0xcfd6e0][(Math.random()*4)|0], wp = new THREE.Mesh(new THREE.PlaneGeometry(mw*.55, mh*.4), bas(wc)); wp.material.color.multiplyScalar(.75); wp.material.polygonOffset = true; wp.material.polygonOffsetFactor = -2; wp.material.polygonOffsetUnits = -4; wp.position.set(fx - dirX*(md + .06), my, mz); wp.rotation.y = dirX*Math.PI/2; add(wp); } }
    for (let i = 0; i < 2; i++) { const p = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, h, 6), bas(0x1a1c22)); p.position.set(fx - dirX*.2, h/2, z + (Math.random() - .5)*w*.8); add(p); }
    return f;
  };
  let zz = -70, seed = 1; while (zz < 70) { const w = 7 + Math.random()*5, h = 24 + Math.random()*5; facade(FXo, 1, zz + w/2, w, h, seed++); zz += w + .3; }
  zz = -70; while (zz < 70) { const w = 7 + Math.random()*5, h = 24 + Math.random()*5; if (zz + w < -hd - .3 || zz > hd + .3) facade(X0 - .03, -1, zz + w/2, w, h, seed++); zz += w + .3; }
  // Decke aus Zwischenebenen/Hochstraßen: kaum Himmel
  const deck = new THREE.Mesh(new THREE.PlaneGeometry(90, 220), bas(0x06070b)); deck.rotation.x = Math.PI/2; deck.position.set(X0 - 40, DK, 0); add(deck);
  for (let z = -50; z <= 50; z += 12) { const c = z%24 ? 0x3c8680 : 0x9ab8e8, s = new THREE.Mesh(new THREE.BoxGeometry(.2, .12, 4.5), bas(c)); s.position.set(X0 - 9 - (Math.abs(z)%5), DK - .3, z); add(s); }
  for (const [z, y] of [[-14, 19], [9, 23], [28, 17]]) { const b = new THREE.Mesh(new THREE.BoxGeometry(14 + 2.4 + 2.4 + 6, 1.4, 4.2), bas(0x0c0e14)); b.position.set(X0 - 9 - 4.4, y, z); add(b);
    const win = new THREE.Mesh(new THREE.PlaneGeometry(14, .7), bas(0x3c8680)); win.material.color.multiplyScalar(.55); win.position.set(X0 - 13.4, y - .2, z + 2.12); add(win); const win2 = win.clone(); win2.position.z = z - 2.12; win2.rotation.y = Math.PI; add(win2);
    const str = new THREE.Mesh(new THREE.BoxGeometry(22, .08, .08), bas(0x9ab8e8)); str.position.set(X0 - 13.4, y - .75, z); add(str); }
  // Neonschilder
  const neon = (txt, col, w, h, x, y, z, ry, vert, br) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({map:neonTex(txt, col, w, h, vert, null), transparent:true, depthWrite:false, fog:false})); m.position.set(x, y, z); m.rotation.y = ry; add(m);
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(w*2.2, h*2.2), new THREE.MeshBasicMaterial({map:canvasTex(64, 64, (c, cw, ch) => { const g = c.createRadialGradient(cw/2, ch/2, 2, cw/2, ch/2, cw/2); g.addColorStop(0, col); g.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = g; c.globalAlpha = .35; c.fillRect(0, 0, cw, ch); }, 1, 1), transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, fog:false})); gl.position.set(x - Math.sin(ry)*.05, y, z - Math.cos(ry)*.05 + 0); gl.rotation.y = ry; add(gl); return m; };
  const FA = FXo + .12;
  neon("CJ-CITY", "#4fa9a3", 9, 2.4, FA, 20, -4, Math.PI/2, false);
  neon("KRONOS", "#cfd6e0", 6, 1.4, FA, 14.5, -14, Math.PI/2, false);
  neon("HOTEL", "#4aa0e8", 1.4, 7, FA, 9, 7, Math.PI/2, true);
  neon("NOODLES", "#4fa9a3", 4.4, 1.1, FA, 4.4, 2, Math.PI/2, false);
  neon("ÖL+TEILE 24H", "#3fb8a8", 5, 1.0, FA, 6.5, -9, Math.PI/2, false);
  neon("BAR", "#4aa0e8", 2.6, 1.0, FA, 3.4, 15, Math.PI/2, false);
  neon("ROBO-MED", "#4fa9a3", 1.2, 6, FA, 12, 24, Math.PI/2, true);
  neon("PAWN", "#cfd6e0", 3.0, .9, X0 - .16, 5.5, 8, -Math.PI/2, false);
  neon("OPEN", "#4fa9a3", 1.4, .5, X0 - .16, 3.2, -9, -Math.PI/2, false);
  // Spiegelungen auf der nassen Fahrbahn
  const refl = (col, z) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(9, 5), new THREE.MeshBasicMaterial({map:canvasTex(64, 64, (c, cw, ch) => { const g = c.createRadialGradient(cw/2, ch/2, 1, cw/2, ch/2, cw/2); g.addColorStop(0, col); g.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = g; c.fillRect(0, 0, cw, ch); }, 1, 1), transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, opacity:.45, fog:false})); m.rotation.x = -Math.PI/2; m.position.set(X0 - 9, .03, z); add(m); };
  refl("#4fa9a3", -4); refl("#4aa0e8", 7); refl("#3fb8a8", -9); refl("#4fa9a3", 2);
  // Kabel quer über die Schlucht + Lichterketten
  for (let k = 0; k < 8; k++) { const y = 9 + Math.random()*14, z0 = -16 + Math.random()*32, pts = [V3(X0 - .3, y, z0), V3(X0 - 9, y - 1.4 - Math.random()*1.2, z0 + Math.random()*5 - 2.5), V3(FXo + .3, y + Math.random()*2, z0 + Math.random()*6 - 3)], cv = new THREE.CatmullRomCurve3(pts), cp = cv.getPoints(30);
    add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(cp), new THREE.LineBasicMaterial({color:0x14161c, fog:false})));
    if (k%2 === 0) { const col = [0x3c8680, 0xf0c080, 0x6ab0e8][k%3], ps = cp.filter((_, i) => i%3 === 1), ge = new THREE.BufferGeometry().setFromPoints(ps); add(new THREE.Points(ge, new THREE.PointsMaterial({color:col, size:5, sizeAttenuation:false, fog:false}))); } }
  // Marktstände an der Gegenseite
  for (const [z, c] of [[-12, 0x3c8680], [-5.5, 0x2a4a7a], [1.5, 0xcfd6e0], [9, 0x3c8680], [16, 0x2a4a7a]]) { const cw = new THREE.Mesh(new THREE.BoxGeometry(2.4, .12, 2.8), bas(c)); cw.material.color.multiplyScalar(.6); cw.position.set(FXo + 1.5, 2.3, z); cw.rotation.z = .12; add(cw); const tb = new THREE.Mesh(new THREE.BoxGeometry(1.2, .9, 2.4), bas(0x1c1e26)); tb.position.set(FXo + 1.0, .45, z); add(tb); const lg = new THREE.Mesh(new THREE.SphereGeometry(.1, 6, 5), bas(0xffd8a0)); lg.position.set(FXo + 1.8, 2.1, z); add(lg); }
  // Dampfschwaden (additiv) in der Schlucht
  for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(new THREE.PlaneGeometry(7, 5), new THREE.MeshBasicMaterial({map:canvasTex(64, 64, (c, cw, ch) => { const g = c.createRadialGradient(cw/2, ch/2, 2, cw/2, ch/2, cw/2); g.addColorStop(0, "rgba(120,140,180,.35)"); g.addColorStop(1, "rgba(120,140,180,0)"); c.fillStyle = g; c.fillRect(0, 0, cw, ch); }, 1, 1), transparent:true, depthWrite:false, fog:false})); s.position.set(X0 - 5 - i*3, 1.5 + (i%3)*3, -20 + i*8); s.rotation.y = Math.PI/2; add(s); }
  // Neonlicht fällt in die Straße hinein
  const l1 = exPt(0x3c8680, 1.5, 11, X0 - 1.2, 4.0, -2.2), l2 = exPt(0x4aa0e8, 1.3, 11, X0 - 1.2, 6.0, 2.4); l1.userData.aim = l2.userData.aim = [3, -.6, 0];
  // Autos (nur wenige): zwei Fahrspuren in Gegenrichtung
  const cols = [0x1e2a44, 0x6a2a1e, 0xcfd6e0, 0x2c303a, 0x9a5a22];
  for (let i = 0; i < 2; i++) { const g = carLit(makeCar(i ? "hatch" : "sedan", cols[(Math.random()*cols.length)|0])); g.visible = false; g.userData = Object.assign(g.userData, {lane:i, dir:i ? 1 : -1, x:X0 - 5.2 - i*4.2, v:8, z:0, on:false}); add(g); CTY.cars.push(g); }
}
function carPass(vol) {
  if (!ac || vol < .01) return; const len = 2.4, buf = ac.createBuffer(1, ac.sampleRate*len, ac.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random()*2 - 1;
  const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(), t = ac.currentTime; src.buffer = buf; f.type = "bandpass"; f.Q.value = 1.1; f.frequency.setValueAtTime(260, t); f.frequency.linearRampToValueAtTime(520, t + len*.5); f.frequency.linearRampToValueAtTime(220, t + len);
  g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.09*vol, t + len*.5); g.gain.linearRampToValueAtTime(.0001, t + len); src.connect(f); f.connect(g); g.connect(fxIn); src.start(t); src.stop(t + len);
}
function cityTick(dt) {
  if (!CTY.cars.length) return; CTY.nextCar -= dt;
  const act = CTY.cars.filter(c => c.userData.on).length;
  if (CTY.nextCar <= 0 && act < 1) { const c = CTY.cars.filter(c => !c.userData.on)[(Math.random()*2)|0] || CTY.cars[0], u = c.userData; if (!u.on) { u.on = true; u.v = 7 + Math.random()*4; u.z = -u.dir*60; c.rotation.y = u.dir > 0 ? 0 : Math.PI; c.visible = true; const dx = Math.abs(u.x - pos.x); carPass(clamp(1.1 - dx/40, .2, 1)); } CTY.nextCar = 9 + Math.random()*8; }
  for (const c of CTY.cars) { const u = c.userData; if (!u.on) continue; u.z += u.dir*u.v*dt; c.position.set(u.x, 0, u.z); if (Math.abs(u.z) > 62) { u.on = false; c.visible = false; } }
}

/* ======================= Straße: Wände, Fenster, Türen ======================= */
function buildStreetWalls() {
  const hd = SD/2, hw = SW/2, conc = mStd(0x3a3c44, .1, .9), dark = mStd(0x15171c, .5, .6), metal = mStd(0x1a1c22, .6, .5);
  const nos = (m) => { m.userData.noSh = 1; return m; };
  // Sockel, Dachkante, Schmutzverläufe
  const gaps = {"-1":[[-6.8 - .85, -6.8 + .85], [DOORX - 1.1, DOORX + 1.1]], "1":[[-4.4 - .85, -4.4 + .85], [GARX - 2.5, GARX + 2.5]]};
  for (const s of [-1, 1]) { let x0 = -hw; for (const [a, b] of gaps[s].slice().sort((p, q) => p[0] - q[0]).concat([[hw, hw]])) { if (a > x0 + .05) exBox(a - x0, .5, .14, conc, (a + x0)/2, .25, s*(hd - .07)); x0 = b; } exBox(SW, .3, .3, conc, 0, SH - .15, s*(hd - .15)); }
  exBox(.14, .5, SD, conc, hw - .07, .25, 0); exBox(.14, .5, SD, conc, -hw + .07, .25, 0);
  const grime = (rot, a) => canvasTex(8, 128, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "rgba(10,8,8," + a + ")"); g.addColorStop(1, "rgba(10,8,8,0)"); x.fillStyle = g; x.fillRect(0, 0, w, h); }, 1, 1);
  for (const s of [-1, 1]) { const gt = new THREE.MeshBasicMaterial({map:grime(0, .55), transparent:true, depthWrite:false}); const m = new THREE.Mesh(new THREE.PlaneGeometry(SW, 4.5), gt); m.position.set(0, SH - 2.3, s*(hd - .02)); m.rotation.y = s < 0 ? 0 : Math.PI; exG.add(m);
    }
  // Fenster in Reihen (mit Rahmen, Sims, Fensterkreuz, vereinzelt Klimagerät / Licht)
  const glassD = new THREE.MeshStandardMaterial({color:0x0a0e18, roughness:.05, metalness:.85, envMapIntensity:1.2}), glassL = [0x7a5a30, 0x4a5a64].map(c => new THREE.MeshBasicMaterial({color:c}));
  for (const s of [-1, 1]) for (const x of [-9.6, -7.2, -4.8, -2.4, 0, 2.4, 4.8, 7.2, 9.6]) for (const y of [5.0, 7.5, 10.0]) {
    if (s < 0 && Math.abs(x) < 1.9 && y < 8.4) continue; const z0 = s*hd, inn = -s;
    nos(exBox(1.15, 1.55, .1, dark, x, y, z0 + inn*.05)); const g = new THREE.Mesh(new THREE.PlaneGeometry(.92, 1.3), Math.random() < .2 ? glassL[(Math.random()*2)|0] : glassD); g.position.set(x, y, z0 + inn*.105); g.rotation.y = s < 0 ? 0 : Math.PI; exG.add(g);
    nos(exBox(.05, 1.3, .04, dark, x, y, z0 + inn*.12)); nos(exBox(.92, .05, .04, dark, x, y, z0 + inn*.12)); nos(exBox(1.35, .09, .34, conc, x, y - .82, z0 + inn*.17));
    if (Math.random() < .25) { nos(exBox(.75, .5, .5, mStd(0x3a3f46, .5, .6), x + .1, y - 1.2, z0 + inn*.3)); const fan = new THREE.Mesh(new THREE.CircleGeometry(.2, 12), new THREE.MeshBasicMaterial({color:0x07080a})); fan.position.set(x + .1, y - 1.2, z0 + inn*.555); fan.rotation.y = s < 0 ? 0 : Math.PI; exG.add(fan); }
    else if (Math.random() < .3) nos(exBox(1.2, .05, .45, mStd(0x5a2a1e, .1, .9), x, y - 1.12, z0 + inn*.22)); }
  // Feuertreppe (Nordwand)
  { const fe = mStd(0x1c1e24, .6, .5), z0 = -hd, FX = -.1;
    for (const y of [4.6, 7.1]) { nos(exBox(2.6, .07, 1.0, fe, FX, y, z0 + .5)); nos(exBox(2.6, .05, .05, fe, FX, y + 1.0, z0 + 1.0)); for (let k = 0; k <= 5; k++) nos(exBox(.04, 1.0, .04, fe, FX - 1.3 + k*.52, y + .5, z0 + 1.0)); nos(exBox(.05, 1.0, .05, fe, FX - 1.3, y + .5, z0 + .2)); nos(exBox(.05, 1.0, .05, fe, FX + 1.3, y + .5, z0 + .2)); }
    for (const lx of [FX + .85, FX + 1.15]) nos(exBox(.04, 2.5, .04, fe, lx, 5.85, z0 + .9)); for (let y = 4.8; y < 7.1; y += .3) nos(exBox(.3, .03, .03, fe, FX + 1.0, y, z0 + .9));
    for (const lx of [FX + 1.0]) for (let y = 2.4; y < 4.6; y += .3) nos(exBox(.3, .03, .03, fe, lx + 1.2, y, z0 + .08)); }
  // Türen: zwei neue (Nord Nr. 12 Stahltür, Süd Nr. 11 Holztür) – je mit Lampe
  const door = (x, s, col, num, wood) => { const z0 = s*hd, inn = -s, ry = s < 0 ? 0 : Math.PI;
    nos(exBox(1.4, .14, .24, conc, x, 2.33, z0 + inn*.12)); nos(exBox(.14, 2.3, .24, conc, x - .66, 1.15, z0 + inn*.12)); nos(exBox(.14, 2.3, .24, conc, x + .66, 1.15, z0 + inn*.12));
    exBox(1.1, 2.2, .07, mStd(col, wood ? .1 : .6, wood ? .8 : .5), x, 1.1, z0 + inn*.06);
    if (wood) { const gl = new THREE.Mesh(new THREE.PlaneGeometry(.5, .45), new THREE.MeshBasicMaterial({color:0x7a5a30})); gl.position.set(x, 1.7, z0 + inn*.1); gl.rotation.y = ry; exG.add(gl); for (let k = 0; k < 4; k++) nos(exBox(.9, .03, .02, mStd(0x35241a, .1, .9), x, .4 + k*.35, z0 + inn*.105)); }
    else for (let k = 0; k < 4; k++) nos(exBox(1.0, .06, .03, mStd(0x15202f, .6, .5), x, .45 + k*.5, z0 + inn*.105));
    nos(exBox(.1, .05, .08, mStd(0xc0c4cc, .8, .3), x + .4, 1.05, z0 + inn*.13)); nos(exBox(1.5, .12, .55, conc, x, .06, z0 + inn*.35));
    exPl(.4, .22, sign(num, "#4fa9a3", .4, .22), x, 2.62, z0 + inn*.02, ry);
    nos(exBox(.08, .08, .3, metal, x, 2.95, z0 + inn*.15)); const b = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), new THREE.MeshBasicMaterial({color:0xffe0b0})); b.position.set(x, 2.88, z0 + inn*.3); exG.add(b); nos(exBox(.2, .04, .2, metal, x, 2.98, z0 + inn*.3));
    const l = exPt(0xffb878, 1.0, 7, x, 2.85, z0 + inn*.4); l.userData.aim = [0, -1, inn*1.5]; };
  door(-6.8, -1, 0x23304a, "Nr. 12", false); door(-4.4, 1, 0x4a3224, "Nr. 11", true);
  // Poster / Graffiti
  const poster = (w, h, x, y, z, ry, draw) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({map:canvasTex(160, Math.round(160*h/w), draw, 1, 1)})); m.position.set(x, y, z); m.rotation.y = ry; exG.add(m); m.userData.noSh = 1; return m; };
  poster(1.6, 2.2, 10.9, 3.2, -.4, -Math.PI/2, (x, w, h) => { x.fillStyle = "#16203a"; x.fillRect(0, 0, w, h); x.fillStyle = "#4fa9a3"; x.beginPath(); x.arc(w/2, h*.38, w*.26, 0, 7); x.fill(); x.fillStyle = "#e8ecf4"; x.font = "bold " + Math.round(w*.2) + "px sans-serif"; x.textAlign = "center"; x.fillText("ÖL", w/2, h*.82); x.globalAlpha = .4; speckle(x, w, h, 500, .3); });
  poster(1.2, 1.7, 10.9, 2.4, 1.6, -Math.PI/2, (x, w, h) => { x.fillStyle = "#c8ccd6"; x.fillRect(0, 0, w, h); x.fillStyle = "#16203a"; x.fillRect(10, 10, w - 20, h*.5); x.fillStyle = "#4fa9a3"; x.fillRect(10, h*.62, w - 20, 10); x.fillStyle = "#16203a"; x.font = "bold " + Math.round(w*.14) + "px monospace"; x.textAlign = "center"; x.fillText("KRONOS", w/2, h*.87); speckle(x, w, h, 400, .35); });
  poster(1.3, 1.9, -1.0, 2.4, hd - .02, Math.PI, (x, w, h) => { x.fillStyle = "#1c2a44"; x.fillRect(0, 0, w, h); x.fillStyle = "#e8ecf4"; for (let i = 0; i < 5; i++) x.fillRect(14, 18 + i*32, w - 28 - i*14, 12); x.fillStyle = "#4fa9a3"; x.fillRect(14, h - 40, 50, 24); speckle(x, w, h, 450, .35); });
  poster(2.2, 1.2, -9.2, 3.0, -hd + .02, 0, (x, w, h) => { x.fillStyle = "#101828"; x.fillRect(0, 0, w, h); x.strokeStyle = "#4fa9a3"; x.lineWidth = 6; x.beginPath(); x.moveTo(10, h*.7); x.bezierCurveTo(w*.3, h*.1, w*.6, h*.9, w - 10, h*.3); x.stroke(); x.strokeStyle = "#e8ecf4"; x.lineWidth = 3; x.beginPath(); x.moveTo(10, h*.85); x.bezierCurveTo(w*.3, h*.3, w*.6, h*1.0, w - 10, h*.5); x.stroke(); speckle(x, w, h, 400, .3); });
  // Wandlampe + Rohr + Kasten an der Ostwand, Kabel
  nos(exBox(.2, .5, .4, mStd(0x3a3f46, .5, .6), hw - .12, 1.6, -2.2)); nos(exBox(.3, .5, .02, metal, hw - .04, 1.6, -2.2));
  const lcv = new THREE.CatmullRomCurve3([V3(-hw + .3, 6.3, -hd + .1), V3(-3, 5.5, 0), V3(hw - .3, 6.6, hd - .1)]); exG.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(lcv.getPoints(24)), new THREE.LineBasicMaterial({color:0x15161a})));
}

/* ======================= Auto-Modelle (Limousine, Kompakt, Transporter, Taxi) ======================= */
// Seitenprofil (z = Länge, y = Höhe) wird zur Karosserie extrudiert (abgerundete Kanten), dazu Glaskabine, Dach, Säulen,
// Räder mit Felgen und Radkästen, Scheinwerfer, Rücklichter, Stoßfänger, Spiegel, Türfugen, Kennzeichen.
const CAR_K = {
  sedan:{L:4.5, W:1.8, wb:2.7, body:[[-2.25,.4],[-2.25,.84],[-1.75,.93],[-1.0,.96],[1.05,.96],[1.55,.92],[2.05,.84],[2.25,.66],[2.25,.4]], cab:[[-1.12,.96],[-.74,1.42],[.58,1.42],[1.12,.96]]},
  hatch:{L:3.9, W:1.74, wb:2.38, body:[[-1.95,.4],[-1.95,.88],[-1.2,.96],[.95,.96],[1.45,.9],[1.8,.8],[1.95,.62],[1.95,.4]], cab:[[-1.38,.96],[-1.14,1.46],[.5,1.46],[1.04,.96]]},
  van:{L:5.0, W:1.9, wb:3.1, body:[[-2.5,.42],[-2.5,1.18],[-2.4,1.3],[1.5,1.3],[2.1,1.06],[2.45,.9],[2.5,.68],[2.5,.42]], cab:[[-2.38,1.3],[-2.32,2.02],[1.05,2.02],[1.62,1.3]]},
};
function carPlateTex(txt) { return canvasTex(128, 32, (x, w, h) => { x.fillStyle = "#d8d4c4"; x.fillRect(0, 0, w, h); x.strokeStyle = "#2a2a2c"; x.lineWidth = 2; x.strokeRect(1, 1, w - 2, h - 2); x.fillStyle = "#1c1c20"; x.font = "bold 22px monospace"; x.textAlign = "center"; x.fillText(txt, w/2, 24); }, 1, 1); }
function carLoft(keys, p, mat, M) {
  // Rumpf aus Querschnitten (z, halbe Breite, unten, oben) mit Superellipsen-Profil, kubisch geglättet
  M = M || 22; const cr = (v, u) => { const n = v.length - 1, i = Math.min(n - 1, Math.floor(u)), f = u - i, g = k => v[Math.max(0, Math.min(n, k))]; return .5*((2*g(i + 1)) + (-g(i) + g(i + 2))*f + (2*g(i) - 5*g(i + 1) + 4*g(i + 2) - g(i + 3))*f*f + (-g(i) + 3*g(i + 1) - 3*g(i + 2) + g(i + 3))*f*f*f); };
  const col = (k) => keys.map(r => r[k]), Z = col(0), A = col(1), Y0 = col(2), Y1 = col(3), N = 30, pos = [], idx = [], e = 2/p;
  for (let i = 0; i < N; i++) { const u = i/(N - 1)*(keys.length - 1), z = cr(Z, u), a = Math.max(.001, cr(A, u)), y0 = cr(Y0, u), y1 = Math.max(y0 + .002, cr(Y1, u)), yc = (y0 + y1)/2, hh = (y1 - y0)/2;
    for (let j = 0; j < M; j++) { const th = j/M*Math.PI*2, c = Math.cos(th), s = Math.sin(th); pos.push(a*Math.sign(c)*Math.pow(Math.abs(c), e), yc + hh*Math.sign(s)*Math.pow(Math.abs(s), e), z); } }
  for (let i = 0; i < N - 1; i++) for (let j = 0; j < M; j++) { const q = i*M + j, r = i*M + (j + 1)%M, q2 = (i + 1)*M + j, r2 = (i + 1)*M + (j + 1)%M; idx.push(q, q2, r, r, q2, r2); }
  for (const [ring, flip] of [[0, 1], [N - 1, 0]]) { const ci = pos.length/3; let sy = 0, z = pos[(ring*M)*3 + 2]; for (let j = 0; j < M; j++) sy += pos[(ring*M + j)*3 + 1]; pos.push(0, sy/M, z); for (let j = 0; j < M; j++) { const q = ring*M + j, r = ring*M + (j + 1)%M; idx.push(...(flip ? [ci, r, q] : [ci, q, r])); } }
  const ge = new THREE.BufferGeometry(); ge.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); ge.setIndex(idx); ge.computeVertexNormals(); const m = new THREE.Mesh(ge, mat); m.material.side = THREE.DoubleSide; return m;
}
function makeCar(kind, col, o) {
  // Schwebe-Gleiter ohne Räder: geloftete Karosserie, Glaskuppel, vier Schwebemodule, Lichter
  o = o || {}; const g = new THREE.Group();
  const SED = {hull:[[-2.3, .42, .56, .78], [-2.15, .78, .47, .9], [-1.6, .92, .44, .98], [0, .95, .42, 1.0], [1.4, .92, .42, .98], [2.0, .78, .46, .9], [2.3, .38, .56, .76]], cab:[[-1.4, .3, .97, 1.0], [-1.0, .68, .97, 1.4], [-.1, .74, .97, 1.5], [.75, .68, .97, 1.42], [1.3, .36, .97, 1.02]]};
  const HAT = {hull:SED.hull.map(r => [r[0]*.83, r[1]*.95, r[2], r[3] + .02]), cab:[[-1.2, .3, .99, 1.02], [-.95, .66, .99, 1.5], [-.1, .72, .99, 1.58], [.7, .66, .99, 1.46], [1.15, .34, .99, 1.04]]};
  const VAN = {hull:[[-2.6, .68, .56, 1.2], [-2.45, .96, .47, 1.5], [-1.8, 1.0, .44, 1.66], [1.2, 1.0, .44, 1.66], [1.9, .92, .46, 1.42], [2.6, .46, .56, .96]], cab:[[.55, .6, 1.5, 1.7], [1.4, .62, 1.42, 1.72], [2.1, .42, 1.3, 1.5]]};
  const K = kind === "van" ? VAN : kind === "hatch" ? HAT : SED, L = kind === "van" ? 5.2 : kind === "hatch" ? 3.8 : 4.6, W = kind === "van" ? 2.0 : kind === "hatch" ? 1.8 : 1.9;
  const bodyM = new THREE.MeshStandardMaterial({color:col, metalness:.5, roughness:.32}), glassM = new THREE.MeshStandardMaterial({color:0x10171e, metalness:.9, roughness:.08}),
    dark = mStd(0x14161a, .5, .5), trim = new THREE.MeshStandardMaterial({color:new THREE.Color(col).lerp(new THREE.Color(0xe6e2d8), .55), metalness:.6, roughness:.3}),
    lamp = new THREE.MeshBasicMaterial({color:0xefe4c8}), tail = new THREE.MeshBasicMaterial({color:0x9a443a}), ringM = new THREE.MeshBasicMaterial({color:0x9ab0b0});
  const bx = (w, h, d, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); g.add(m); return m; };
  g.add(carLoft(K.hull, 3.4, bodyM)); g.add(carLoft(K.cab, 2.6, glassM, 18));
  const top = kind === "van" ? 1.66 : kind === "hatch" ? 1.58 : 1.5, hz = L/2, hx = K.hull[3][1];
  for (const s of [-1, 1]) {
    bx(.03, .045, L*.52, trim, s*(hx + .005), .74, -.05);                                    // Zierlinie
    for (const sz of [-1, 1]) { const px = s*hx*.72, pz = sz*L*.3; const pod = new THREE.Mesh(new THREE.CylinderGeometry(.2, .24, .16, 16), dark); pod.position.set(px, .4, pz); g.add(pod); const rg = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, .012, 16), ringM); rg.position.set(px, .31, pz); g.add(rg); }
    bx(.05, .24, .6, bodyM, s*W*.38, kind === "van" ? 1.8 : 1.1, -hz + .8);                  // Heckflossen (aufrecht)
    if (kind === "van") bx(.03, .5, 2.0, glassM, s*(hx - .0), 1.32, 0);
  }
  bx(W*.84, .035, .5, bodyM, 0, kind === "van" ? 1.74 : 1.0, -hz + .8);                    // Heckleiste
  for (const s of [-1, 1]) bx(.34, .075, .07, lamp, s*.46, kind === "van" ? .92 : .74, hz - .13);    // Scheinwerfer
  bx(W*.55, .05, .06, tail, 0, kind === "van" ? .95 : .76, -hz + .09);                       // Rücklichtband
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(.5, .13), new THREE.MeshBasicMaterial({map:carPlateTex(o.plate || ("CJ " + (100 + Math.floor(Math.random()*899))))})); pl.position.set(0, kind === "van" ? .7 : .62, -hz + .02); pl.rotation.y = Math.PI; g.add(pl);
  if (o.taxi) { const gold = new THREE.MeshBasicMaterial({color:0xd8b060}); bx(.5, .12, .24, gold, 0, top + .08, -.1); for (const s of [-1, 1]) for (let k = 0; k < 8; k += 2) bx(.035, .09, .24, gold, s*(hx + .01), .66, -1.0 + k*.27); }
  g.userData.dims = {L, W, H:top + .15};
  return g;
}

/* ======================= CJ-City: begehbare Stadt hinter dem Tor ======================= */
// Straße läuft entlang z; Westwand (x = -CW/2) ist das Ende der Hauptstraße mit dem Tor, Ostseite = Ladenzeile.
// Unsichtbare Wände: zLim = CZL (nur für den Spieler); Fußgänger und Autos laufen bis in den Dunst (z = ±CD/2) und passieren sie.
const CW = 19, CD = 76, CH = 18, CZL = 26, CGZ = 1.2, CWK = 2.6;
const CITY = {walk:[], cars:[], steam:[], t:0, nextCar:2};
function cityOpen() { return !!((typeof dev !== "undefined" && dev.cityOpen) || (gear.obs && gear.obs.st === 3)); }
function cityGateInt() {
  if (mode !== "surf" || !cityOpen()) return null;
  if (xs.scene === "street" && pos.x < -SW/2 + 2.2 && Math.abs(pos.z + 1.2) < 1.3 && pos.y < 3) return {label:"Durchs Tor nach CJ-City", act:() => { $("fade").classList.add("on"); setTimeout(enterCity, 650); }};
  if (xs.scene === "city" && pos.x < -CW/2 + 2.2 && Math.abs(pos.z - CGZ) < 1.3 && pos.y < 3) return {label:"Zurück in die Straße", act:() => { $("fade").classList.add("on"); setTimeout(() => enterStreet("city"), 650); }};
  return null;
}
function cityFacTex(seed) {
  let s = seed*7919 + 13; const rnd = () => (s = (s*9301 + 49297)%233280)/233280;
  return canvasTex(256, 256, (x, w, h) => {
    x.fillStyle = ["#2a2420", "#262a2e", "#2c2622"][seed%3]; x.fillRect(0, 0, w, h); speckle(x, w, h, 500, .1);
    for (let fy = 0; fy < 2; fy++) for (let fx = 0; fx < 2; fx++) {
      const wx = fx*128 + 30, wy = fy*128 + 22, ww = 68, wh = 76, lit = rnd();
      x.fillStyle = "#14110f"; x.fillRect(wx - 5, wy - 5, ww + 10, wh + 10);
      const g = x.createLinearGradient(0, wy, 0, wy + wh);
      if (lit < .3) { g.addColorStop(0, ["#e0b46a", "#d9a35a", "#e6c88a"][(rnd()*3)|0]); g.addColorStop(1, "#8a5a2c"); } else if (lit < .36) { g.addColorStop(0, "#7ab4ae"); g.addColorStop(1, "#2c5a58"); } else { g.addColorStop(0, "#3c424c"); g.addColorStop(.6, "#171b22"); g.addColorStop(1, "#0d1016"); }
      x.fillStyle = g; x.fillRect(wx, wy, ww, wh); x.fillStyle = "#17130f"; x.fillRect(wx + ww/2 - 2, wy, 4, wh); x.fillRect(wx, wy + wh*.45, ww, 4);
      if (lit < .3 && rnd() < .5) { x.fillStyle = "rgba(40,24,16,.6)"; x.beginPath(); x.arc(wx + 24 + rnd()*20, wy + wh - 14, 9, 0, 7); x.fill(); x.fillRect(wx + 15, wy + wh - 6, 30, 6); }
      x.fillStyle = "#4a443c"; x.fillRect(wx - 9, wy + wh + 5, ww + 18, 7);
      if (rnd() < .22) { x.fillStyle = "#3a3e46"; x.fillRect(wx + 8, wy + wh + 12, 52, 20); x.fillStyle = "#101216"; x.beginPath(); x.arc(wx + 34, wy + wh + 22, 7, 0, 7); x.fill(); }
      else if (rnd() < .2) { x.strokeStyle = "#202428"; x.lineWidth = 2; x.strokeRect(wx - 4, wy + wh - 6, ww + 8, 24); } }
    x.fillStyle = "rgba(0,0,0,.35)"; for (let i = 0; i < 6; i++) x.fillRect(rnd()*w, 0, 2 + rnd()*5, h*(.3 + rnd()*.6));
  }, 1, 1);
}
function shopTex(kind) {
  let s = kind.length*131 + 7; const rnd = () => (s = (s*9301 + 49297)%233280)/233280;
  return canvasTex(256, 144, (x, w, h) => {
    const bg = {noodle:["#e0b070", "#7a4a26"], parts:["#c8c0a4", "#5a5648"], hotel:["#e8c88a", "#7a5430"], med:["#cfe0dc", "#5a7c78"], pawn:["#d8b06a", "#5a3e22"], bar:["#c88a4a", "#3a2214"], kiosk:["#d8d0b0", "#6a6248"], tech:["#8a9aa4", "#262e36"]}[kind];
    const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, bg[0]); gr.addColorStop(1, bg[1]); x.fillStyle = gr; x.fillRect(0, 0, w, h);
    if (kind === "noodle") { x.fillStyle = "rgba(60,30,14,.8)"; x.fillRect(0, 96, w, 48); x.fillStyle = "#3a2214"; x.fillRect(0, 92, w, 6); for (let i = 0; i < 5; i++) { x.fillStyle = "#c04a2a"; x.beginPath(); x.arc(28 + i*50, 16 + (i%2)*6, 11, 0, 7); x.fill(); x.fillStyle = "#e8d8b0"; x.fillRect(22 + i*50, 4, 12, 4); } x.fillStyle = "rgba(30,18,10,.85)"; for (let i = 0; i < 4; i++) { x.beginPath(); x.arc(40 + i*60, 80, 9, 0, 7); x.fill(); x.fillRect(34 + i*60, 88, 12, 28); } x.fillStyle = "rgba(255,240,200,.35)"; for (let i = 0; i < 3; i++) { x.beginPath(); x.ellipse(60 + i*70, 120, 24, 6, 0, 0, 7); x.fill(); } }
    else if (kind === "parts") { for (const y of [38, 82, 126]) { x.fillStyle = "#2c2a24"; x.fillRect(0, y, w, 5); for (let i = 0; i < 9; i++) { const px = 8 + i*28; x.fillStyle = ["#1a1a1c", "#a8742a", "#4a5a62", "#6a2a22"][(rnd()*4)|0]; if (rnd() < .5) { x.beginPath(); x.arc(px + 10, y - 13, 12, 0, 7); x.fill(); } else x.fillRect(px, y - 22, 20, 22); } } }
    else if (kind === "hotel") { x.fillStyle = "rgba(60,36,18,.7)"; x.fillRect(40, 84, 176, 12); x.fillRect(40, 96, 10, 40); x.fillRect(206, 96, 10, 40); x.fillStyle = "rgba(40,60,40,.7)"; for (const px of [20, 232]) { x.beginPath(); x.ellipse(px, 100, 12, 24, 0, 0, 7); x.fill(); } x.fillStyle = "rgba(255,244,210,.55)"; for (const px of [64, 128, 192]) { x.beginPath(); x.arc(px, 14, 14, 0, 7); x.fill(); } }
    else if (kind === "med") { x.fillStyle = "#4a7a74"; x.fillRect(100, 22, 56, 14); x.fillRect(121, 8, 14, 42); x.fillStyle = "rgba(40,60,64,.7)"; for (let i = 0; i < 3; i++) x.fillRect(20 + i*70, 96, 50, 10), x.fillRect(26 + i*70, 106, 6, 30); }
    else if (kind === "pawn") { for (const y of [50, 100]) { x.fillStyle = "#2a1c10"; x.fillRect(0, y, w, 5); for (let i = 0; i < 8; i++) { const px = 12 + i*30; x.fillStyle = ["#c0a040", "#3a3a40", "#8a3a2a", "#6a8a8a"][(rnd()*4)|0]; x.fillRect(px, y - 18, 16 + rnd()*8, 18); } } x.strokeStyle = "rgba(10,10,12,.85)"; x.lineWidth = 3; for (let i = 0; i < 9; i++) { x.beginPath(); x.moveTo(i*30 + 6, 0); x.lineTo(i*30 + 6, h); x.stroke(); } }
    else if (kind === "bar") { for (const y of [44, 84]) { x.fillStyle = "#1c0e06"; x.fillRect(0, y, w, 4); for (let i = 0; i < 14; i++) { x.fillStyle = ["#6a8a4a", "#a86a22", "#7a2a22", "#cfd6e0"][(rnd()*4)|0]; x.fillRect(8 + i*17, y - 24, 8, 24); x.fillRect(10 + i*17, y - 30, 4, 7); } } x.fillStyle = "rgba(20,10,4,.8)"; x.fillRect(0, 108, w, 36); }
    else if (kind === "kiosk") { for (let r = 0; r < 3; r++) for (let i = 0; i < 9; i++) { x.fillStyle = ["#a84a3a", "#3a6a8a", "#d8c070", "#4a8a6a", "#c8c8c0"][(rnd()*5)|0]; x.fillRect(8 + i*27, 12 + r*40, 22, 30); } }
    else if (kind === "tech") { for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) { x.fillStyle = "#10161c"; x.fillRect(10 + i*40, 12 + r*42, 34, 28); x.fillStyle = ["#4a6a78", "#6a8a7a", "#8a7a5a", "#3a4a58"][(rnd()*4)|0]; x.fillRect(13 + i*40, 15 + r*42, 28, 22); } }
    speckle(x, w, h, 260, .1); x.fillStyle = "rgba(255,255,255,.07)"; x.beginPath(); x.moveTo(0, 0); x.lineTo(110, 0); x.lineTo(0, 90); x.fill();
  }, 1, 1);
}

const carLit = (g, k) => { g.traverse(m => { const a = m.material; if (a && a.isMeshStandardMaterial && !a.userData.lit) { a.userData.lit = 1; a.emissive = a.color.clone().multiplyScalar(k || .35); } }); return g; };

/* ---------- Fassaden: einzelne Häuser mit Versätzen, vertieften Fenstern, Balkonen, Feuertreppen (Instanzen) ---------- */
function cityFacades() {
  const HW = CW/2; let sd = 17; const rnd = () => (sd = (sd*9301 + 49297)%233280)/233280, pick = (a) => a[(rnd()*a.length)|0];
  const pla = canvasTex(128, 128, (x, w, h) => { x.fillStyle = "#b8b2a6"; x.fillRect(0, 0, w, h); speckle(x, w, h, 700, .16); for (let i = 0; i < 9; i++) { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "rgba(40,34,30," + (.1 + Math.random()*.15) + ")"); g.addColorStop(1, "rgba(40,34,30,0)"); x.fillStyle = g; x.fillRect(Math.random()*w, 0, 2 + Math.random()*6, h*(.4 + Math.random()*.6)); } }, 1, 1);
  const S = [], G = [], push = (L, x, y, z, sx, sy, sz, c) => L.push([x, y, z, sx, sy, sz, c]);
  const lit = [0xd2a25c, 0xdcb272, 0xc4965a, 0xb4c4bc, 0xe0cc9c], dkG = [0x1a222c, 0x202a36, 0x283240, 0x141a24], fr = 0x14161a;
  for (const s of [-1, 1]) { const n = -s; let z = -CD/2;
    while (z < CD/2 - 1) {
      const w = Math.min(7 + rnd()*5, CD/2 - z), zc = z + w/2; z += w; const setb = pick([0, .25, .5, .8]), dep = .2 + setb, face = s*(HW - dep), bh = CH - 3.9;
      const tint = pick([0x8a6a58, 0x7a6a62, 0x6a6e74, 0x8a8068, 0x74665c, 0x607070, 0x8a7a5c]), brick = rnd() < .55;
      const mat = brick ? pbrMat("brk", w/2.6, bh/2.6, tint, 0) : new THREE.MeshStandardMaterial({map:pla.clone(), color:tint, roughness:.95});
      if (!brick) { mat.map.needsUpdate = true; mat.map.wrapS = mat.map.wrapT = THREE.RepeatWrapping; mat.map.repeat.set(w/4, bh/4); }
      const blk = new THREE.Mesh(new THREE.BoxGeometry(dep, bh, w - .04), mat); blk.position.set(s*(HW - dep/2), 3.9 + bh/2, zc); exG.add(blk);
      const tc = new THREE.Color(tint).lerp(new THREE.Color(0xd8d0c0), .4).getHex();
      push(S, face + n*.12, 4.0, zc, .25, .2, w - .05, tc); push(S, face + n*.27, 17.45, zc, .55, .42, w, tc); push(S, face + n*.14, 17.12, zc, .3, .1, w - .1, tc);
      for (const e of [-1, 1]) push(S, face + n*.1, 3.9 + bh/2, zc + e*(w/2 - .35), .13, bh, .13, 0x3a3c40);
      const cols = Math.max(2, Math.floor(w/2.5)), ww = .85 + rnd()*.3, wh = 1.3 + rnd()*.35, bal = rnd() < .4, esc = rnd() < .16, ys = [5.3, 8.05, 10.8, 13.55, 16.3];
      ys.forEach((y, k) => {
        if (esc) { const zz = zc + w/2 - 1.6; push(S, face + n*.6, y - wh/2 - .08, zz, 1.0, .06, 2.4, 0x23272c); push(S, face + n*1.08, y - wh/2 + .4, zz, .04, .06, 2.4, 0x23272c); for (const e of [-1.15, 1.15]) push(S, face + n*1.08, y - wh/2 + .0, zz + e, .04, .9, .04, 0x23272c);
          if (k) for (let q = 0; q < 8; q++) push(S, face + n*.6, y - 2.75 - wh/2 - .08 + (q + 1)*2.75/9, zz - .9 + q*.25 - 1.0 + 1.0, .5, .04, .26, 0x23272c); }
        for (let i = 0; i < cols; i++) { const zw = zc - w/2 + (i + .5)*w/cols; if (rnd() < .05) continue;
          push(S, face + n*.03, y, zw, .06, wh + .28, ww + .28, fr);
          const isL = rnd() < .3, gc = isL ? pick(lit) : pick(dkG); push(G, face + n*.075, y, zw, .02, wh, ww, new THREE.Color(gc).multiplyScalar(isL ? .85 : 1).getHex());
          if (isL && rnd() < .55) push(G, face + n*.085, y + wh*.12, zw + (rnd() < .5 ? -1 : 1)*ww*.25, .02, wh*.72, ww*.5, pick([0x6a4a34, 0x7a5a44, 0x5a4a40]));
          else if (!isL && rnd() < .15) push(G, face + n*.085, y + wh*.2, zw, .02, wh*.6, ww, 0x56524a);
          push(S, face + n*.1, y, zw, .06, wh, .05, fr); push(S, face + n*.1, y + wh*.12, zw, .06, .05, ww, fr);
          push(S, face + n*.16, y - wh/2 - .09, zw, .32, .1, ww + .42, tc); push(S, face + n*.1, y + wh/2 + .13, zw, .16, .1, ww + .32, tc);
          if (rnd() < .12) push(S, face + n*.42, y - wh/2 - .5, zw, .55, .42, .6, pick([0x6a6e72, 0x5a5e62, 0x7a7a74]));
          if (bal && k && k%2) { push(S, face + n*.5, y - wh/2 - .16, zw, .85, .1, ww + .6, 0x4a4a4e); push(S, face + n*.92, y - wh/2 + .5, zw, .04, .05, ww + .6, 0x2a2c30);
            for (const e of [-1, 0, 1]) push(S, face + n*.92, y - wh/2 + .2, zw + e*(ww/2 + .28), .04, .7, .04, 0x2a2c30);
            if (rnd() < .5) push(S, face + n*.55, y - wh/2 + .1, zw + (rnd() - .5)*.4, .3, .2, .3, pick([0x4a6a44, 0x6a4a34, 0x8a8a7a])); } } }); } }
  const mk = (L, mat) => { const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat, L.length), d = new THREE.Object3D(), c = new THREE.Color(); L.forEach(([x, y, zz, sx, sy, sz, col], i) => { d.position.set(x, y, zz); d.scale.set(sx, sy, sz); d.updateMatrix(); im.setMatrixAt(i, d.matrix); im.setColorAt(i, c.setHex(col)); }); im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; im.frustumCulled = false; exG.add(im); };
  mk(S, new THREE.MeshStandardMaterial({roughness:.85, metalness:.05})); mk(G, new THREE.MeshBasicMaterial({}));
}
/* ---------- Szene aufbauen ---------- */
function buildCity() {
  xs.cast = false; xs.og = 0; CITY.walk.length = 0; CITY.cars.length = 0; CITY.steam.length = 0; CITY.t = 0; CITY.nextCar = 2;
  const T = alleyTexts(), roadT = T.road.clone(); roadT.needsUpdate = true; const FOGC = 0x1a2030;
  exRoom(CW, CH, CD, {floor:roadT, ceil:gradTex([[0, "#0e1220"], [1, "#2c303c"]]), ceilBasic:true, wW:gradTex([[0, "#222"], [1, "#222"]]), wE:gradTex([[0, "#222"], [1, "#222"]]), wN:gradTex([[0, "#222"], [1, "#222"]]), wS:gradTex([[0, "#222"], [1, "#222"]])});
  skySet([[0, "#1e2434"], [.5, "#12182a"], [1, "#070a15"]]); zLim = CZL; skyLim = CH - 1.3; applyAsphalt(roomMeshes[0], CW, CD, 0x8a8c94);
  const rep = (t, rx, ry) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return t; };
  applyBrick(roomMeshes[2], CD, CH, 0x5a504a); applyBrick(roomMeshes[3], CD, CH, 0x5a504a); cityFacades();
  for (const i of [4, 5]) { roomMeshes[i].material.dispose(); roomMeshes[i].material = new THREE.MeshBasicMaterial({color:FOGC}); }
  scene.fog = new THREE.FogExp2(FOGC, .03); scene.background = new THREE.Color(FOGC);
  const conc = mStd(0x6a6a70, .1, .9), dk = mStd(0x16181d, .5, .6), metal = mStd(0x2a2c32, .6, .5), wood = mStd(0x5a3e2a, .1, .8), HW = CW/2, hw0 = hwS();
  const flat = (w, d, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat); m.rotation.x = -Math.PI/2; m.position.set(x, y, z); exG.add(m); return m; };
  const noSh = (m) => { m.userData.noSh = 1; return m; };
  const solidBox = (w, h, d, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), dk); b.visible = false; b.position.set(x, y, z); exG.add(b); solidOf(b, blocks); return b; };
  // Gehwege, Bordstein, Fahrbahnmarkierungen
  const pav = canvasTex(128, 128, (x, w, h) => { x.fillStyle = "#585a60"; x.fillRect(0, 0, w, h); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { { const v = 76 + ((i*7 + j*13)%5)*5; x.fillStyle = "rgb(" + v + "," + (v + 2) + "," + (v + 6) + ")"; } x.fillRect(i*32 + 1, j*32 + 1, 30, 30); } speckle(x, w, h, 500, .12); }, 1, 1);
  rep(pav, 1.3, CD/2); const pm = new THREE.MeshStandardMaterial({map:pav, roughness:.9, metalness:0});
  for (const s of [-1, 1]) { const sw = flat(2.6, CD, pm, s*(HW - 1.3), .03, 0); sw.material.polygonOffset = true; sw.material.polygonOffsetFactor = -2; noSh(exBox(.2, .14, CD, conc, s*6.9, .07, 0)); }
  const line = new THREE.MeshBasicMaterial({color:0x8e8a7c}); line.polygonOffset = true; line.polygonOffsetFactor = -3;
  for (let z = -CD/2 + 2; z < CD/2; z += 4.5) flat(.14, 2, line, 0, .01, z);
  for (const s of [-1, 1]) flat(.1, CD, line, s*6.45, .01, 0);
  for (let x = -6; x <= 6; x += .95) flat(.5, 3.2, line, x, .011, -8);
  const mh = (x, z) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, .02, 18), mStd(0x24262c, .6, .6)); m.position.set(x, .012, z); exG.add(m); for (let i = -2; i <= 2; i++) flat(.6, .03, dk, x, .024, z + i*.12); };
  const stT = canvasTex(64, 64, (x, w, h) => { const g = x.createRadialGradient(32, 32, 2, 32, 32, 32); g.addColorStop(0, "rgba(190,200,215,.55)"); g.addColorStop(1, "rgba(190,200,215,0)"); x.fillStyle = g; x.fillRect(0, 0, 64, 64); }, 1, 1);
  for (const [x, z] of [[1.6, -14], [-2.0, 12], [2.4, 22]]) { mh(x, z); for (let k = 0; k < 3; k++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({map:stT, transparent:true, depthWrite:false, opacity:.2})); sp.position.set(x, 1, z); exG.add(sp); CITY.steam.push({s:sp, x, z, ph:k/3}); } }
  for (const [x, z, sx, sz] of [[-3.5, -3, 1.4, .8], [3.5, 9, 1.1, .6], [-1, 18, 1.2, .7], [4.2, -22, 1.5, .8]]) { const pd = new THREE.Mesh(new THREE.CircleGeometry(1, 20), new THREE.MeshBasicMaterial({color:0x5a6a84, transparent:true, opacity:.4, depthWrite:false})); pd.rotation.x = -Math.PI/2; pd.scale.set(sx, sz, 1); pd.position.set(x, .014, z); exG.add(pd); }
  // Laden-Helfer
  const stripes = (c1, c2) => canvasTex(8, 32, (x, w, h) => { x.fillStyle = c1; x.fillRect(0, 0, w, h); x.fillStyle = c2; for (let y = 0; y < h; y += 16) x.fillRect(0, y, w, 8); }, 1, 9);
  const lampHead = (x, y, z, c) => { const b = new THREE.Mesh(new THREE.SphereGeometry(.09, 8, 6), new THREE.MeshBasicMaterial({color:c || 0xffe0b0})); b.position.set(x, y, z); exG.add(b); };
  const barrel = (x, z, c) => { const b = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, .9, 12), mStd(c, .4, .6)); b.position.set(x, .45, z); exG.add(b); solidOf(b, blocks); };
  const shop = (z, kind, txt, scol, awn, plain, wn) => {
    const X = HW; const win = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 2.1), new THREE.MeshBasicMaterial({map:shopTex(kind), color:0xe0e0e0})); win.position.set(X - .06, 1.55, z - .8); win.rotation.y = -Math.PI/2; exG.add(win);
    noSh(exBox(.12, .5, 6.2, conc, X - .06, .25, z)); noSh(exBox(.3, .4, 6.2, dk, X - .15, 2.85, z));
    for (const dz of [-2.8, -.8, 1.2]) noSh(exBox(.1, 2.2, .1, dk, X - .1, 1.6, z + dz)); noSh(exBox(.1, .08, 4.1, dk, X - .1, 2.6, z - .8)); noSh(exBox(.1, .08, 4.1, dk, X - .1, .5, z - .8));
    const dr = exBox(.08, 2.2, 1.0, mStd(0x23262c, .5, .5), X - .08, 1.1, z + 2.2); const gl = new THREE.Mesh(new THREE.PlaneGeometry(.6, 1.2), new THREE.MeshBasicMaterial({map:shopTex(kind), color:0xb0a890})); gl.position.set(X - .13, 1.35, z + 2.2); gl.rotation.y = -Math.PI/2; exG.add(gl); noSh(exBox(.06, .05, .2, mStd(0xc0c4cc, .8, .3), X - .14, 1.1, z + 2.5));
    exPl(4.2, .7, sign(txt, scol, 4.2, .7, "#1c1612"), X - .31, 3.4, z - .8, -Math.PI/2);
    const aw = new THREE.Mesh(new THREE.BoxGeometry(1.2, .08, 4.8), plain ? mStd(awn, .05, .9) : new THREE.MeshStandardMaterial({map:stripes("#" + awn.toString(16).padStart(6, "0"), "#d8d0bc"), roughness:.9})); aw.position.set(X - .75, 3.05, z - .5); aw.rotation.z = .2; exG.add(aw); noSh(aw);
    for (const dz of [-2.8, 1.8]) noSh(exBox(.04, 3.0, .04, metal, X - 1.3, 1.5, z + dz));
    lampHead(X - .5, 2.75, z - .8); return z; };
  const SZ = c => -25.6 + 3.2 + 6.4*c;
  const zN = SZ(0), zP = SZ(1), zH = SZ(2), zM = SZ(3), zW = SZ(4), zB = SZ(5), zK = SZ(6), zT = SZ(7);
  // 1 Nudelbude
  shop(zN, "noodle", "NUDELN · DAMPF", "#e8d4a0", 0x8a3a2e); box(.7, 1.0, 2.6, wood, 8.5, .5, zN - .8, exG); solidOf(exG.children[exG.children.length - 1], blocks);
  for (let i = 0; i < 3; i++) { const st = new THREE.Mesh(new THREE.CylinderGeometry(.19, .19, .5, 10), mStd(0x3a2a20, .1, .8)); st.position.set(7.7, .25, zN - 1.6 + i*.8); exG.add(st); }
  for (let i = 0; i < 3; i++) { const lt = new THREE.Mesh(new THREE.SphereGeometry(.22, 10, 8), new THREE.MeshBasicMaterial({color:0xc2593a})); lt.scale.y = 1.2; lt.position.set(8.4, 2.4, zN - 1.9 + i*1.1); exG.add(lt); }
  exPt(0xffb070, 1.4, 9, 8.2, 2.6, zN - .8);
  // 2 Öl + Teile
  shop(zP, "parts", "ÖL + TEILE 24H", "#b8d4c8", 0x3a5a58); for (const [dz, h] of [[-2, 3], [-1.3, 2]]) for (let k = 0; k < h; k++) { const t = new THREE.Mesh(new THREE.CylinderGeometry(.36, .36, .22, 16), mStd(0x15161a, .1, .85)); t.position.set(8.6, .11 + k*.22, zP + dz); exG.add(t); if (!k) solidOf(t, blocks); }
  barrel(8.8, zP + 1.0, 0x3a4a5a); barrel(8.8, zP + 1.75, 0x6a3a22); barrel(8.2, zP + 1.4, 0x4a4e58);
  // 3 Hotel
  shop(zH, "hotel", "HOTEL KRONENHOF", "#e8d0a0", 0x6a2a34, true); flat(1.4, 2.4, new THREE.MeshStandardMaterial({color:0x5a2630, roughness:.9}), 8.6, .04, zH + 2.2);
  for (const dz of [1.4, 3.0]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, 2.9, 8), mStd(0xc8a050, .8, .3)); p.position.set(7.9, 1.45, zH + dz); exG.add(p); }
  { const hs = new THREE.MeshBasicMaterial({map:canvasTex(64, 256, (x, w, h) => { x.fillStyle = "#2a1c18"; x.fillRect(0, 0, w, h); x.strokeStyle = "#e8d0a0"; x.lineWidth = 3; x.strokeRect(3, 3, w - 6, h - 6); x.fillStyle = "#e8d0a0"; x.font = "bold 36px monospace"; x.textAlign = "center"; x.textBaseline = "middle"; "HOTEL".split("").forEach((c, i) => x.fillText(c, w/2, 30 + i*40)); }, 1, 1), side:THREE.DoubleSide}); const m = new THREE.Mesh(new THREE.PlaneGeometry(.5, 2.0), hs); m.position.set(7.8, 4.6, zH + 2.4); exG.add(m); noSh(exBox(1.5, .05, .05, metal, 8.6, 5.55, zH + 2.4)); }
  exPt(0xffd8a0, 1.2, 9, 8.0, 3.0, zH + 1);
  // 4 Robo-Med
  shop(zM, "med", "ROBO-MED · KLINIK", "#a8d4cc", 0x2a5a54, true); exBox(.5, .08, 1.8, wood, 8.5, .45, zM + .6); for (const dz of [-.3, 1.5]) exBox(.5, .45, .06, mStd(0x2a2c32, .5, .5), 8.5, .22, zM + .6 + dz*.7);
  { const ms = sign("+", "#8fc4be", 1.0, 1.0, "#16201e"); ms.side = THREE.DoubleSide; const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), ms); m.position.set(7.9, 4.5, zM - 2.2); exG.add(m); noSh(exBox(1.5, .05, .05, metal, 8.7, 5.05, zM - 2.2)); }
  exPt(0xcfe8e4, 1.1, 9, 8.2, 2.6, zM - .8);
  // 5 Pfandhaus
  shop(zW, "pawn", "PFANDHAUS", "#e0c890", 0x4a3a22, true); for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(.17, 10, 8), mStd(0xc8a050, .8, .3)); b.position.set(8.0, 4.7 - (i === 0 ? 0 : .25), zW - 2.3 + i*.4 - (i === 2 ? .4 : 0)); exG.add(b); }
  noSh(exBox(1.5, .05, .05, metal, 8.8, 5.0, zW - 2.0)); exBox(.7, .9, .7, mStd(0x2c3038, .7, .4), 8.7, .45, zW + 1.0, true);
  // 6 Bar
  shop(zB, "bar", "BAR · ZUM ROSTIGEN", "#d8b080", 0x5a3a24); barrel(8.7, zB - .8, 0x5a3e2a); barrel(8.7, zB + .0, 0x5a3e2a); exBox(.5, .06, 1.6, wood, 8.4, .5, zB + 1.1); exPl(.8, .6, sign("HEUTE: ÖL", "#e0d8c0", .8, .6, "#1a1c18"), 9.0, 1.2, zB + 1.9, -Math.PI/2);
  exPt(0xffa060, 1.4, 9, 8.2, 2.6, zB);
  // 7 Kiosk
  shop(zK, "kiosk", "KIOSK · ZEITUNGEN", "#d8d8c0", 0x3a5a7a); exBox(.5, 1.5, 1.4, mStd(0x2a2e36, .4, .6), 8.5, .75, zK - 2.4, true); for (let i = 0; i < 6; i++) exBox(.04, .2, .22, mStd([0xa84a3a, 0xd8c070, 0x3a6a8a][i%3], .05, .9), 8.2, .55 + (i>>1)*.4, zK - 2.9 + (i%2)*.5 + .1);
  // 8 Elektro
  shop(zT, "tech", "KRONOS ELEKTRO", "#cfd6e0", 0x3a4048, true); for (let i = 0; i < 3; i++) exBox(.8, .5, .8, mStd(0x6a5a40, .05, .9), 8.7, .25 + i*.5, zT + 1 + (i == 2 ? .2 : 0), i === 0);
  { const tvt = canvasTex(32, 24, (x, w, h) => { x.fillStyle = "#3a4a52"; x.fillRect(0, 0, w, h); speckle(x, w, h, 120, .4); }, 1, 1); for (let i = 0; i < 2; i++) { const tv = new THREE.Mesh(new THREE.PlaneGeometry(.55, .4), new THREE.MeshBasicMaterial({map:tvt, color:0x9aa8b0})); tv.position.set(8.2, 1.6 + i*.5, zT + 1.2); tv.rotation.y = -Math.PI/2; exG.add(tv); } }
  exPt(0xc8d4e0, 1.1, 9, 8.2, 2.6, zT - .8);
  // Westseite: Rolltore, Türen, Plakate, Tor
  const shT = (c) => canvasTex(64, 64, (x, w, h) => { x.fillStyle = c; x.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 4) { x.fillStyle = "rgba(0,0,0,.28)"; x.fillRect(0, y, w, 1); x.fillStyle = "rgba(255,255,255,.05)"; x.fillRect(0, y + 1, w, 1); } speckle(x, w, h, 140, .15); if (Math.random() < .6) { x.fillStyle = "rgba(0,0,0,.4)"; x.fillRect(Math.random()*40, h*.3, 14 + Math.random()*20, 4); } }, 1, 1);
  [[-23.6, "#3a4a42", "LAGER 7"], [-17, "#4a3a34", "WÄSCHEREI"], [-11, "#3a4252", ""], [-5, "#46463e", "KRONOS SERVICE"], [8.4, "#3a4a42", ""], [14, "#4a3a34", "ALTMETALL"], [20, "#3a4252", ""], [25.6, "#46463e", "AN & VERKAUF"]].forEach(([z, c, txt]) => {
    const r = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.6), new THREE.MeshBasicMaterial({map:shT(c), color:0xb8b8b8})); r.position.set(-HW + .06, 1.5, z); r.rotation.y = Math.PI/2; exG.add(r);
    noSh(exBox(.3, .4, 4.6, dk, -HW + .15, 2.95, z)); noSh(exBox(.16, 2.8, .14, conc, -HW + .08, 1.4, z - 2.2)); noSh(exBox(.16, 2.8, .14, conc, -HW + .08, 1.4, z + 2.2));
    if (txt) exPl(2.8, .5, sign(txt, "#c8c0a8", 2.8, .5, "#1c1c1a"), -HW + .31, 3.5, z, Math.PI/2); lampHead(-HW + .5, 3.2, z - 1.5, 0xd8c8a0); });
  const poster = (z, y, c1, c2) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.6), new THREE.MeshBasicMaterial({map:canvasTex(64, 96, (x, w, h) => { x.fillStyle = c1; x.fillRect(0, 0, w, h); x.fillStyle = c2; x.fillRect(6, 8, w - 12, 30); x.fillRect(6, 50, w - 20, 5); x.fillRect(6, 60, w - 30, 5); x.fillRect(6, 70, w - 24, 5); speckle(x, w, h, 100, .15); }, 1, 1), color:0xc0c0c0})); m.position.set(-HW + .02, y, z); m.rotation.y = Math.PI/2; exG.add(m); };
  poster(-14, 2.2, "#2a3a50", "#c8c0a8"); poster(-13.7, 2.0, "#4a3a2a", "#d8c080"); poster(3.9, 2.0, "#34424a", "#a8c0b8"); poster(-8, 2.2, "#4a2e34", "#d0b8a0"); poster(18, 2.2, "#2c3c34", "#c8c8a8");
  { const gx = -HW + .1, gm = mStd(0x3a4050, .6, .5), net = (z0, z1, y0, y1) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(z1 - z0, y1 - y0), fenceMat((z1 - z0)/2.4, (y1 - y0)/2.4)); m.position.set(gx + .02, (y0 + y1)/2, (z0 + z1)/2); m.rotation.y = Math.PI/2; exG.add(m); };
    net(CGZ - 3, CGZ - .6, 0, 4.2); net(CGZ + .6, CGZ + 3, 0, 4.2); net(CGZ - .6, CGZ + .6, 2.4, 4.2);
    const nich = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.4), new THREE.MeshBasicMaterial({map:canvasTex(32, 64, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#1a1c24"); g.addColorStop(1, "#2c2822"); x.fillStyle = g; x.fillRect(0, 0, w, h); x.fillStyle = "rgba(220,170,100,.5)"; x.beginPath(); x.arc(22, 20, 6, 0, 7); x.fill(); }, 1, 1)})); nich.position.set(gx - .04, 1.2, CGZ); nich.rotation.y = Math.PI/2; exG.add(nich);
    for (const dz of [-.6, .6]) noSh(exBox(.12, 2.4, .12, gm, gx, 1.2, CGZ + dz)); noSh(exBox(.12, .12, 1.32, gm, gx, 2.4, CGZ));
    const lg = new THREE.Group(); lg.position.set(gx + .02, 0, CGZ - .55); lg.rotation.y = 1.3; exG.add(lg);
    const leaf = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.3), fenceMat(1.1/2.4, 2.3/2.4)); leaf.position.set(0, 1.15, 0.55); leaf.rotation.y = Math.PI/2; lg.add(leaf);
    for (const [w, h, d, x, y, z] of [[.06, .06, 1.1, .03, .1, .55], [.06, .06, 1.1, .03, 2.25, .55], [.06, 2.3, .06, .03, 1.15, 0], [.06, 2.3, .06, .03, 1.15, 1.1]]) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), gm); m.position.set(x, y, z); lg.add(m); }
    exPl(1.0, .3, sign("← STRASSE", "#9ab8b0", 1.0, .3, "#1c1c1a"), -HW + .04, 2.9, CGZ, Math.PI/2); const gl = exPt(0xffc890, 1.0, 7, -HW + 1.2, 3.2, CGZ); gl.userData.aim = [0, -1, 0]; }
  // Straßenmöbel
  const lampPost = (x, z, arm, light) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(.06, .09, 5.2, 8), mStd(0x1c2228, .6, .4)); p.position.set(x, 2.6, z); exG.add(p); solidOf(p, blocks); noSh(exBox(1.0, .08, .08, metal, x - arm*.5, 5.2, z)); const h = new THREE.Mesh(new THREE.BoxGeometry(.5, .1, .24), new THREE.MeshBasicMaterial({color:0xffe4b8})); h.position.set(x - arm*1.0, 5.15, z); exG.add(h);
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), new THREE.MeshBasicMaterial({map:stT, color:0xffd090, transparent:true, opacity:.7, depthWrite:false, blending:THREE.AdditiveBlending})); gl.position.set(x - arm, 4.9, z); gl.rotation.y = Math.PI/2; exG.add(gl); if (light) exPt(0xffd8a0, 1.5, 12, x - arm, 4.8, z); };
  lampPost(6.7, -19, 1, 1); lampPost(6.7, 3, 1); lampPost(6.7, 21, 1); lampPost(-6.7, -9, -1); lampPost(-6.7, 11, -1, 1); lampPost(-6.7, 28, -1);
  // Bushaltestelle (West), Telefonzelle, Automat, Hydrant, Mülleimer, Poller
  { const x = -8.3, z = -26.5; exBox(.12, 2.6, .12, metal, x, 1.3, z - 1.3, true); exBox(.12, 2.6, .12, metal, x, 1.3, z + 1.3, true); exBox(1.2, .08, 3.0, mStd(0x2a3038, .5, .5), x, 2.65, z); for (const dz of [-.7, .7]) { const g = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.4), new THREE.MeshBasicMaterial({color:0x6a7a88, transparent:true, opacity:.22, depthWrite:false, side:THREE.DoubleSide})); g.rotation.y = Math.PI/2; g.position.set(x - 1.1 + .05, 1.5, z + dz*1.0); exG.add(g); } exBox(.5, .06, 1.8, wood, x + .3, .5, z); exPl(.5, .6, sign("BUS 7", "#c8d0d8", .5, .6, "#24303a"), x + 1.0, 3.3, z, -Math.PI/2); }
  { const x = -8.4, z = 14.5; exBox(.9, .1, .9, metal, x, .05, z); exBox(.06, 2.3, .06, mStd(0x3a5a58, .4, .5), x - .43, 1.2, z - .43); exBox(.06, 2.3, .06, mStd(0x3a5a58, .4, .5), x + .43, 1.2, z + .43); exBox(.06, 2.3, .06, mStd(0x3a5a58, .4, .5), x - .43, 1.2, z + .43); exBox(.06, 2.3, .06, mStd(0x3a5a58, .4, .5), x + .43, 1.2, z - .43); exBox(.96, .1, .96, mStd(0x3a5a58, .4, .5), x, 2.35, z); solidBox(.9, 2.3, .9, x, 1.2, z); const l = new THREE.Mesh(new THREE.PlaneGeometry(.7, 1.6), new THREE.MeshBasicMaterial({color:0xc8d0b8, transparent:true, opacity:.45, depthWrite:false, side:THREE.DoubleSide})); l.position.set(x, 1.25, z); l.rotation.y = Math.PI/2; exG.add(l); }
  { const x = -8.8, z = -21; exBox(1.0, 1.9, .8, mStd(0x6a3a30, .3, .6), x, .95, z, true); const f = new THREE.Mesh(new THREE.PlaneGeometry(.7, 1.3), new THREE.MeshBasicMaterial({map:canvasTex(32, 48, (c, w, h) => { c.fillStyle = "#cfd0c4"; c.fillRect(0, 0, w, h); for (let r = 0; r < 4; r++) for (let q = 0; q < 3; q++) { c.fillStyle = ["#a84a3a", "#3a6a8a", "#d8c070", "#4a8a6a"][(r + q)%4]; c.fillRect(2 + q*10, 3 + r*10, 8, 8); } }, 1, 1), color:0xa8a8a8})); f.position.set(x + .52, 1.1, z); f.rotation.y = Math.PI/2; exG.add(f); }
  { const h = new THREE.Mesh(new THREE.CylinderGeometry(.1, .12, .6, 8), mStd(0x8a3a30, .3, .6)); h.position.set(-8.9, .3, -2.6); exG.add(h); solidOf(h, blocks); const h2 = new THREE.Mesh(new THREE.SphereGeometry(.12, 8, 6), mStd(0x8a3a30, .3, .6)); h2.position.set(-8.9, .64, -2.6); exG.add(h2); }
  for (const [x, z] of [[-8.9, -9.6], [-8.9, 5], [8.0, -9.4], [7.9, 12]]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(.26, .22, .8, 10), mStd(0x2c3a34, .4, .6)); b.position.set(x, .4, z); exG.add(b); solidOf(b, blocks); }
  for (const s of [-1, 1]) for (const z of [-9.6, -6.4]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, .7, 8), mStd(0x9a9078, .3, .6)); p.position.set(s*6.7, .35, z); exG.add(p); }
  // Kabel, Lichterketten, Wäscheleinen quer über die Straße
  for (let k = 0; k < 7; k++) { const y = 8 + Math.random()*6, z0 = -22 + k*7 + Math.random()*3, cv = new THREE.CatmullRomCurve3([V3(-HW + .2, y, z0), V3(0, y - 1.1 - Math.random(), z0 + Math.random()*3 - 1.5), V3(HW - .2, y + Math.random(), z0 + Math.random()*4 - 2)]), cp = cv.getPoints(30);
    exG.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(cp), new THREE.LineBasicMaterial({color:0x14161a})));
    if (k%3 === 0) { const ps = cp.filter((_, i) => i%3 === 1), ge = new THREE.BufferGeometry().setFromPoints(ps); exG.add(new THREE.Points(ge, new THREE.PointsMaterial({color:[0xe0b070, 0xd8d0b8, 0xc08850][k%3], size:4, sizeAttenuation:false}))); } }
  // Ferne Lichter an den Endwänden (aus dem Dunst)
  for (const s of [-1, 1]) { const pts = [], cols = []; for (let i = 0; i < 90; i++) { pts.push(V3(-HW + 1 + Math.random()*(CW - 2), 1 + Math.random()*12, s*(CD/2 - .3))); const c = Math.random() < .6 ? [.8, .6, .35] : [.5, .65, .7]; cols.push(...c); } const ge = new THREE.BufferGeometry().setFromPoints(pts); ge.setAttribute("color", new THREE.BufferAttribute(new Float32Array(cols), 3)); exG.add(new THREE.Points(ge, new THREE.PointsMaterial({size:3, sizeAttenuation:false, vertexColors:true}))); }
  // Geparkte Autos (unsichtbare Klötze als Kollision)
  const park = (kind, col, x, z, ry, o) => { const c = carLit(makeCar(kind, col, o)); c.position.set(x, 0, z); c.rotation.y = ry; exG.add(c); const d = c.userData.dims; solidBox(d.W, d.H, d.L, x, d.H/2, z); };
  park("sedan", 0x5a7a8a, 5.8, -16, 0, {}); park("van", 0x9a8a68, -5.8, -13, Math.PI, {}); park("hatch", 0x9a4a42, 5.8, 17, Math.PI, {}); park("sedan", 0xc8a850, -5.8, 20, 0, {taxi:true}); park("hatch", 0x6a8a66, -5.8, -29, Math.PI, {});
  // Fahrende Autos
  [["sedan", 0x4a6a9a], ["hatch", 0x9a7a3e], ["van", 0x8a8e96]].forEach(([k, c], i) => { const g = carLit(makeCar(k, c, {})); g.visible = false; const dir = i%2 ? -1 : 1; g.userData = Object.assign(g.userData, {dir, x:dir*3.3, z:0, v:0, vmax:7 + Math.random()*3, on:false, wait:1 + i*2.5}); exG.add(g); CITY.cars.push(g); });
  // Fußgänger auf den Gehwegen – laufen auch durch die unsichtbaren Wände
  const pal = [[0x4a5a6a, 0x8a6a3a], [0x6a4a3a, 0x4f9a94], [0x5a5a52, 0xb89a58], [0x3a4a40, 0x8a8a9a], [0x6a5a6a, 0x9a7a5a], [0x4a5060, 0x7a9a8a], [0x6a6a5a, 0x9a5a4a], [0x3a3a46, 0xa8a070]];
  for (let i = 0; i < 8; i++) { const [b, a] = pal[i], R = makeRobot({body:b, acc:a, glow:i%2 ? 0x8ac0b0 : 0xd8b878}); R.glass.visible = false; exG.add(R.g); exAct.push(R); R.look = {x:0, y:1.5, z:0};
    const east = i%2 === 0, dir = (i%4 < 2) ? 1 : -1; const W = {R, dir, x:(east ? 1 : -1)*(7.3 + (i%3)*.3), z:-34 + i*9 + Math.random()*3, v:.9 + Math.random()*.5, ph:Math.random()*6, pause:0, nextP:4 + Math.random()*8, face:0}; R.g.position.set(W.x, 0, W.z); CITY.walk.push(W); }
}
function cityLife(dt) {
  if (!exG.visible) return; CITY.t += dt;
  for (const W of CITY.walk) { const R = W.R; let mv = 1;
    if (W.pause > 0) { W.pause -= dt; mv = 0; const wy = W.x > 0 ? Math.PI/2 : -Math.PI/2; let d = wy - R.g.rotation.y; while (d > Math.PI) d -= 2*Math.PI; while (d < -Math.PI) d += 2*Math.PI; R.g.rotation.y += d*Math.min(1, dt*3); R.look.x = W.x*2; R.look.z = W.z; }
    else { W.nextP -= dt; if (W.nextP <= 0 && Math.abs(W.z) < 24) { W.pause = 2 + Math.random()*3; W.nextP = 8 + Math.random()*10; } let d = (W.dir > 0 ? 0 : Math.PI) - R.g.rotation.y; while (d > Math.PI) d -= 2*Math.PI; while (d < -Math.PI) d += 2*Math.PI; R.g.rotation.y += d*Math.min(1, dt*6); W.z += W.dir*W.v*dt; R.look.x = W.x; R.look.z = W.z + W.dir*3; if (Math.abs(W.z) > CD/2 + 4) W.z = -W.dir*(CD/2 + 3); }
    R.g.position.set(W.x, 0, W.z); W.ph += mv*W.v*dt*4.6; const s = Math.sin(W.ph)*mv;
    R.legs[0].rotation.x = s*.5; R.legs[1].rotation.x = -s*.5; R.shins[0].rotation.x = Math.max(0, Math.sin(W.ph + 1.2))*.6*mv; R.shins[1].rotation.x = Math.max(0, -Math.sin(W.ph + 1.2))*.6*mv; R.g.position.y = Math.abs(Math.cos(W.ph))*.025*mv; }
  for (const c of CITY.cars) { const u = c.userData;
    if (!u.on) { u.wait -= dt; if (u.wait <= 0) { u.on = true; u.z = -u.dir*(CD/2 + 5); u.v = u.vmax; c.visible = true; c.rotation.y = u.dir > 0 ? 0 : Math.PI; if (xs.scene === "city") carPass(.5); } continue; }
    let tg = u.vmax; if (mode === "surf" && pos.y < 2.6 && Math.abs(pos.x - u.x) < 1.6) { const gap = (pos.z - u.z)*u.dir; if (gap > 0 && gap < 11) tg = 0; }
    u.v += (tg - u.v)*Math.min(1, dt*(tg ? 1.2 : 3.5)); u.z += u.dir*u.v*dt; c.position.set(u.x, 0, u.z); if (Math.abs(u.z) > CD/2 + 6) { u.on = false; c.visible = false; u.wait = 4 + Math.random()*8; } }
  for (const S of CITY.steam) { const u = (CITY.t*.3 + S.ph)%1; S.s.position.set(S.x + Math.sin(u*6 + S.ph*9)*.12, .3 + u*2.8, S.z); const sc = .8 + u*1.8; S.s.scale.set(sc, sc, 1); S.s.material.opacity = .22*Math.sin(Math.PI*u); }
}
function enterCity() { window.loadShow && (loadShow(), loadHideSoon(2200));
  cpSet("city"); exLeaveOld(); buildCity(); ch2.dark = false; ch2.stage = 8 + Math.min(gear.job, 2); const hw = hwS();
  placeAt(-CW/2 + 1.5, hw, CGZ, 0, 1, 0, 1, 0, 0); setObj(jobObj());
  Object.assign(xs, {scene:"city", env:"alley", dark:false, hI:.7, hC:0x8a98c0, hG:0x2a2a34, bell:null, drunkT:99, dl:0, drunk:null});
  toast(T("CJ-City")); setTimeout(() => { $("fade").classList.remove("on"); }, 350);
}
