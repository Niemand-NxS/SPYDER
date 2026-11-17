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
  const net = new THREE.Mesh(new THREE.PlaneGeometry(SD, SH), fenceMat(SD/2.4, SH/2.4));
  net.position.set(X0 + .1, SH/2, 0); net.rotation.y = Math.PI/2; add(net);
  for (let i = 0; i <= 4; i++) { const p = new THREE.Mesh(new THREE.BoxGeometry(.09, SH, .09), mStd(0x2a2e38, .6, .5)); p.position.set(X0 + .08, SH/2, -hd + .08 + i*(SD - .16)/4); add(p); }
  for (const y of [1.2, 4.5, 8.5]) { const r = new THREE.Mesh(new THREE.BoxGeometry(.06, .06, SD), mStd(0x2a2e38, .6, .5)); r.position.set(X0 + .08, y, 0); add(r); }
  // Tor im Zaun (verschlossen): Rahmen, Flügel, Griff, Scharnier
  { const gz = -1.2, gx = X0 + .16, gm = mStd(0x3a4050, .6, .5); const fr = (w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), gm); m.position.set(x, y, z); add(m); };
    fr(.12, 2.4, .12, gx, 1.2, gz - .6); fr(.12, 2.4, .12, gx, 1.2, gz + .6); fr(.12, .12, 1.32, gx, 2.4, gz);
    const leaf = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.3), fenceMat(1.1/2.4, 2.3/2.4)); leaf.position.set(gx + .02, 1.15, gz); leaf.rotation.y = Math.PI/2; add(leaf);
    fr(.06, .06, 1.1, gx + .03, 1.15, gz); fr(.06, 2.3, .06, gx + .03, 1.15, gz + .52); fr(.06, 2.3, .06, gx + .03, 1.15, gz - .52); fr(.06, .06, 1.1, gx + .03, .1, gz); fr(.06, .06, 1.1, gx + .03, 2.25, gz);
    const hn = new THREE.Mesh(new THREE.BoxGeometry(.08, .22, .05), mStd(0xc0c4cc, .8, .3)); hn.position.set(gx + .1, 1.1, gz + .42); add(hn); const lk = new THREE.Mesh(new THREE.BoxGeometry(.1, .12, .08), mStd(0x3c8680, .4, .5)); lk.position.set(gx + .1, .95, gz + .42); add(lk); }
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
  for (let i = 0; i < 2; i++) { const g = new THREE.Group(), c = cols[(Math.random()*cols.length)|0];
    const b = new THREE.Mesh(new THREE.BoxGeometry(1.9, .55, 4.3), bas(c)); b.position.y = .62; g.add(b); const cab = new THREE.Mesh(new THREE.BoxGeometry(1.6, .5, 2.2), bas(0x0c0e14)); cab.position.set(0, 1.12, -.2); g.add(cab);
    for (const [wx, wz] of [[-.9, -1.4], [.9, -1.4], [-.9, 1.4], [.9, 1.4]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.34, .34, .25, 10), bas(0x07080a)); w.rotation.z = Math.PI/2; w.position.set(wx, .34, wz); g.add(w); }
    for (const sx of [-.7, .7]) { const hl = new THREE.Mesh(new THREE.BoxGeometry(.4, .16, .06), bas(0xfff0d0)); hl.position.set(sx, .7, 2.17); g.add(hl); const tl = new THREE.Mesh(new THREE.BoxGeometry(.4, .12, .06), bas(0xe03a22)); tl.position.set(sx, .7, -2.17); g.add(tl); }
    const beam = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 7), new THREE.MeshBasicMaterial({map:canvasTex(32, 64, (c, cw, ch) => { const gr = c.createLinearGradient(0, 0, 0, ch); gr.addColorStop(0, "rgba(255,230,180,.0)"); gr.addColorStop(1, "rgba(255,230,180,.5)"); c.fillStyle = gr; c.fillRect(0, 0, cw, ch); }, 1, 1), transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, fog:false})); beam.rotation.x = -Math.PI/2; beam.position.set(0, .05, 5.7); g.add(beam);
    const ug = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 5), new THREE.MeshBasicMaterial({color:i ? 0x3c8680 : 0x4aa0e8, transparent:true, opacity:.28, depthWrite:false, blending:THREE.AdditiveBlending, fog:false})); ug.rotation.x = -Math.PI/2; ug.position.y = .04; g.add(ug);
    g.visible = false; g.userData = {lane:i, dir:i ? 1 : -1, x:X0 - 5.2 - i*4.2, v:8, z:0, on:false}; add(g); CTY.cars.push(g); }
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
