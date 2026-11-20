/* ================= Kapitel 2 · Mases Werkstatt, Ausrüstung, Dev-Werkzeuge ================= */
const gear = {knife:false, shield:false, map:false, pack:false, job:0, gold:0, items:{kit:0, cell:0}, obs:{st:0, slot:0, shots:[0,0,0,0]}, upg:{laser:0, akku:0, panzer:0, repair:0, servo:0, muskel:0, solar:0, tarn:0, hack:0, feder:0}, loot:[0,0,0,0], hacked:false, rackMet:false, rackReady:false, black:false, se:0}, dev = {skip:false, inf:false}, shd = {on:false, u:0, flash:0, demo:false}, bld = {u:0, demo:false};
const VI_M = VOICES.length; VOICES.push({f0:118, fs:1.0, vol:.55, robot:.25, speed:1.05}); ROBN[VI_M] = "MASE";
SPK.M = {name:"MASE", vi:VI_M, R:null};
function maseLine(txt) { speakCut("M", txt, "t"); showSub("MASE", txt); }
let shopM = null, shopG = null;
const SHOP = {ix:0, hd:0, id:0}; let wakeBusy = false;
function buildMase(ix, hd) {
  const IW = 8.4, ID = 6.0, IH = 3.6, x0 = ix - IW/2, x1 = ix + IW/2, z0 = hd + .3, D2 = hd + ID, GX = ix;
  Object.assign(SHOP, {ix, hd, D:D2, x0, x1});
  D = D2; DN = D2; PLANES[5].c = -D2;                                  // Raum reicht jetzt bis in die Werkstatt
  const SWd = SW/2, P = (x0_, x1_, y0, y1, za, zb) => pushBox(blocks, x0_, x1_, y0, y1, za, zb);
  P(-SWd, x0, 0, SH, hd, D2); P(x1, SWd, 0, SH, hd, D2); P(x0, GX - 2.4, 0, SH, hd, z0); P(GX + 2.4, x1, 0, SH, hd, z0); P(GX - 2.4, GX + 2.4, 3.4, SH, hd, z0); P(x0, x1, IH, SH, z0, D2);
  const mat = (m) => m, pl = (w, h, m, x, y, z, rx, ry) => { const q = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); q.position.set(x, y, z); q.rotation.set(rx || 0, ry || 0, 0); q.receiveShadow = true; exG.add(q); return q; };
  const brick = (w, h) => pbrMat("brk", w/2.6, h/2.6, 0x8a7c7c, 0), conc = pbrMat("asph", IW/2.4, ID/2.4, 0x6e6e7a, 0);
  pl(IW, ID + .2, conc, ix, .01, hd + ID/2 + .05, -Math.PI/2, 0); pl(IW, ID, mStd(0x24262c, .3, .8), ix, IH, hd + ID/2 + .15, Math.PI/2, 0);
  pl(IW, IH, brick(IW, IH), ix, IH/2, D2, 0, Math.PI); pl(ID - .3, IH, brick(ID, IH), x0, IH/2, hd + .3 + (ID - .3)/2, 0, Math.PI/2); pl(ID - .3, IH, brick(ID, IH), x1, IH/2, hd + .3 + (ID - .3)/2, 0, -Math.PI/2);
  const fw = GX - 2.4 - x0; pl(fw, IH, brick(fw, IH), x0 + fw/2, IH/2, z0, 0, 0); pl(fw, IH, brick(fw, IH), x1 - fw/2, IH/2, z0, 0, 0);
  const steel = mStd(0x2a2c32, .7, .45), orange = mStd(0x3c8680, .4, .6), blue = mStd(0x23304a, .5, .6), tm = mStd(0x5a5e66, .6, .5), woodM = pbrMat("wood", 1, 1, 0xb89878, 0), dk = mStd(0x16181c, .6, .5);
  const B = (w, h, d, m, x, y, z, solid) => exBox(w, h, d, m, x, y, z, solid);
  // Torrahmen
  B(.16, 3.4, .36, steel, GX - 2.48, 1.7, hd + .15); B(.16, 3.4, .36, steel, GX + 2.48, 1.7, hd + .15); B(5.1, .22, .36, steel, GX, 3.5, hd + .15);
  // Deckenträger, Kabelrinnen, Hängelampen
  for (let k = 0; k < 5; k++) B(IW, .16, .12, steel, ix, IH - .08, z0 + .6 + k*1.2); B(IW, .1, .3, dk, ix, IH - .06, D2 - .3);
  for (const [lx, lz, I] of [[GX - 2.6, hd + 1.8, 1.3], [GX + .6, hd + 3.4, 1.4], [GX - 1.4, D2 - 1.3, 1.5], [GX + 3.0, D2 - 1.5, 1.0]]) {
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, .7, 4), dk); cord.position.set(lx, IH - .35, lz); exG.add(cord);
    const sh = new THREE.Mesh(new THREE.ConeGeometry(.28, .2, 14, 1, true), new THREE.MeshStandardMaterial({color:0x3a3d44, metalness:.6, roughness:.5, side:THREE.DoubleSide})); sh.position.set(lx, IH - .78, lz); exG.add(sh);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), new THREE.MeshBasicMaterial({color:0xffe8c0})); bulb.position.set(lx, IH - .82, lz); exG.add(bulb); xs.lights.push(exPt(0xffb878, I, 7.5, lx, IH - .85, lz)); }
  // Werkbank am Rückwand mit Werkzeugwand
  const bx = GX - 1.4; B(4.6, .9, .8, woodM, bx, .45, D2 - .5, true); B(4.7, .06, .9, mStd(0x6a5a48, .2, .6), bx, .93, D2 - .5); B(4.4, .75, .08, steel, bx, .45, D2 - .88);
  B(5.2, 1.4, .05, mStd(0x2c3342, .3, .7), bx, 2.0, D2 - .05);
  for (let k = 0; k < 14; k++) { const tx2 = bx - 2.3 + k*.35, th = .25 + (k*37 % 5)*.07; B(.05, th, .03, k % 3 ? steel : orange, tx2, 2.0 + ((k*13 % 7) - 3)*.12, D2 - .1); }
  B(.5, .35, .04, dk, bx + 1.5, 1.3, D2 - .1); B(.22, .5, .22, steel, bx + 1.9, 1.2, D2 - .6); B(.5, .04, .04, steel, bx - 1.2, 1.2, D2 - .6);
  // Regale West mit Teilekisten und Gliedmaßen
  for (const yy of [.5, 1.1, 1.7, 2.3]) B(.5, .05, 3.6, steel, x0 + .3, yy, hd + 2.4);
  for (const zz of [hd + .7, hd + 4.1]) B(.06, 2.4, .5, steel, x0 + .3, 1.2, zz);
  for (let k = 0; k < 12; k++) B(.34, .28, .26 + (k % 3)*.06, k % 3 === 0 ? orange : k % 3 === 1 ? blue : mStd(0x6a6a70, .5, .6), x0 + .3, .67 + (k % 4)*.6, hd + 1.0 + (k % 3)*1.2 + (k > 8 ? .1 : 0));
  for (let k = 0; k < 4; k++) { const L = new THREE.Mesh(new THREE.CylinderGeometry(.05, .04, .8, 8), steel); L.rotation.x = Math.PI/2; L.position.set(x0 + .3, 2.38, hd + 1.0 + k*.7); exG.add(L); }
  // Werkzeugwagen, Gasflaschen, Schweißplatz, Fässer
  B(.9, .85, .55, orange, x0 + .8, .43, D2 - 1.0, true); B(.9, .05, .55, dk, x0 + .8, .88, D2 - 1.0); for (let k = 0; k < 3; k++) B(.8, .02, .02, dk, x0 + .8, .25 + k*.22, D2 - .72);
  for (const [gx, col] of [[x1 - .4, 0x2b4a7a], [x1 - .75, 0xc86a22]]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, 1.3, 12), mStd(col, .5, .5)); c.position.set(gx, .65, D2 - .35); c.castShadow = true; exG.add(c); const cap = new THREE.Mesh(new THREE.SphereGeometry(.12, 10, 6, 0, Math.PI*2, 0, Math.PI/2), mStd(col, .5, .5)); cap.position.set(gx, 1.3, D2 - .35); exG.add(cap); }
  B(1.4, .8, .8, steel, x1 - 1.4, .4, D2 - 1.5, true); B(1.4, .05, .85, mStd(0x4a4e56, .6, .4), x1 - 1.4, .82, D2 - 1.5);
  for (const [dx, dz] of [[x1 - .5, hd + 1.0], [x1 - .5, hd + 1.7]]) { const d = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, .85, 14), pbrMat("met", 1, 1, 0xb08060)); d.position.set(dx, .43, dz); d.castShadow = true; exG.add(d); solidOf(d, blocks); }
  // Roboter-Torso an der Kette (Ost)
  { const ch = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, 1.0, 4), dk); ch.position.set(x1 - 1.0, IH - .5, hd + 3.4); exG.add(ch); const t = new THREE.Mesh(new THREE.CylinderGeometry(.16, .13, .5, 10), mStd(0x7a8088, .6, .5)); t.position.set(x1 - 1.0, IH - 1.25, hd + 3.4); t.castShadow = true; exG.add(t); const h2 = new THREE.Mesh(new THREE.BoxGeometry(.28, .22, .2), mStd(0x3a3d44, .6, .5)); h2.position.set(x1 - 1.0, IH - .88, hd + 3.4); exG.add(h2); }
  // Teppich/Ölflecken, Poster, Schild
  const oil = new THREE.MeshStandardMaterial({map:canvasTex(64, 64, (x, w, h) => { const g = x.createRadialGradient(w/2, h/2, 2, w/2, h/2, w/2); g.addColorStop(0, "rgba(10,10,14,.55)"); g.addColorStop(.6, "rgba(10,10,14,.3)"); g.addColorStop(1, "rgba(10,10,14,0)"); x.clearRect(0, 0, w, h); x.fillStyle = g; x.fillRect(0, 0, w, h); }, 1, 1), transparent:true, depthWrite:false, roughness:.3, metalness:0, polygonOffset:true, polygonOffsetFactor:-2});
  for (const o of [pl(2.6, 1.8, oil, GX - .6, .02, hd + 2.6, -Math.PI/2, 0), pl(1.4, 1.0, oil, GX + 2.6, .02, hd + 1.6, -Math.PI/2, .4)]) o.userData.noSh = 1;
  pl(1.2, .7, sign("OFFEN BIS DIE FUNKEN AUSGEHEN", "#4fa9a3", 1.2, .7, "#14161a"), x1 - .02, 2.3, hd + 2.8, 0, -Math.PI/2);
  // Mase und Werkbank-Waffe
  const M = makeRobot({body:0x6a5a48, acc:0xd8902a, glow:0xf2c070, apron:0x3a2a1a, pouch:true}); M.smile = true; M.mode = "bar";
  const gm = mStd(0x16181c, .6, .4); for (const s2 of [-1, 1]) { const o = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .05, 10), gm); o.rotation.x = Math.PI/2; o.position.set(s2*.07, .36, .1); M.head.add(o); }
  const st = new THREE.Mesh(new THREE.BoxGeometry(.3, .035, .02), mStd(0x3a2a1a, .2, .8)); st.position.set(0, .35, .1); M.head.add(st);
  M.g.position.set(bx, 0, D2 - 1.25); M.g.rotation.y = 0; exG.add(M.g); exAct.push(M); SPK.M.R = M; M.setBase = {x:bx, z:D2 - 1.25};
  M.P = {r:[.1, 1.04, .36], l:[-.12, 1.0, .34], tinker:true}; shopM = M; M.glass.children.forEach(ch => { ch.visible = false; });
  { const tg = new THREE.Group(); tg.rotation.x = Math.PI/2 - .45; M.glass.add(tg); const cop = mStd(0xb8742e, .35, .8), dk2 = mStd(0x1c1e22, .6, .5);
    const hd2 = new THREE.Mesh(new THREE.CylinderGeometry(.022, .026, .14, 10), dk2); hd2.position.y = -.04; tg.add(hd2);
    const vl = new THREE.Mesh(new THREE.BoxGeometry(.03, .03, .03), cop); vl.position.set(0, .04, .03); tg.add(vl);
    const nz = new THREE.Mesh(new THREE.CylinderGeometry(.007, .014, .12, 8), cop); nz.position.y = .1; tg.add(nz);
    const fl = new THREE.Mesh(new THREE.ConeGeometry(.016, .09, 8), new THREE.MeshBasicMaterial({color:0xbfe2ff, transparent:true, opacity:.9, depthWrite:false})); fl.position.y = .21; tg.add(fl);
    const fl2 = new THREE.Mesh(new THREE.ConeGeometry(.008, .06, 8), new THREE.MeshBasicMaterial({color:0xffffff})); fl2.position.y = .195; tg.add(fl2);
    const tl = new THREE.PointLight(0x9fd0ff, 1.1, 2.6, 2); tl.position.y = .22; tg.add(tl); M.torch = {fl, fl2, tl}; }

  const wp = new THREE.Group(); wp.position.set(bx, .96, D2 - .5); exG.add(wp);
  [[.9, .06, .12, 0, 0, 0], [.3, .1, .14, -.5, .04, 0], [.12, .14, .18, .35, .08, 0]].forEach(([w, h, d, x, y, z]) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), steel); o.position.set(x, y + .03, z); o.castShadow = true; wp.add(o); });
  const gl = new THREE.Mesh(new THREE.BoxGeometry(.5, .02, .03), new THREE.MeshBasicMaterial({color:0x3c8680})); gl.position.set(.1, .075, .0); wp.add(gl);
  const L = new THREE.PointLight(0xffb060, 1.2, 4.5, 1.6); L.position.set(bx, 1.4, D2 - 1.0); exG.add(L); xs.lights.push(L); xs.maseL = L; M.sparkT = 0;
  // Behandlungstisch
  const tx = GX + 1.8, tz = hd + 3.4; Object.assign(SHOP, {tx, tz}); exBox(1.5, .08, .9, tm, tx, .85, tz, true); for (const [dx, dz] of [[-.65, -.38], [.65, -.38], [-.65, .38], [.65, .38]]) exBox(.07, .85, .07, tm, tx + dx, .42, tz + dz);
  B(.5, .03, .22, dk, tx + .5, .9, tz); B(.04, 1.0, .04, steel, tx + .85, 1.4, tz - .4); B(.9, .04, .04, steel, tx + .45, 1.9, tz - .4); xs.lights.push(exPt(0xfff0d8, 1.0, 4.5, tx, 2.5, tz));
}
function shopTick(dt) {
  if (shopM && shopM.torch) { const f = .85 + Math.sin(clockT*37)*.12 + Math.sin(clockT*23.3)*.08, T0 = shopM.torch; T0.fl.scale.set(f, .8 + f*.3, f); T0.fl2.scale.set(f, f, f); T0.tl.intensity = .9 + f*.5; }
  const M = shopM; if (!M || !xs.on || xs.scene !== "street") return;
  const near = pos.z > SHOP.hd - .6 && Math.hypot(pos.x - M.g.position.x, pos.z - M.g.position.z) < 6, tv = M.setBase;
  const tgt = near || mode === "cut" && M.cutFace ? (M.cutFace || pos) : null;
  if (!M.talk) { const want = tgt ? Math.atan2(tgt.x - M.g.position.x, tgt.z - M.g.position.z) : 0; let d = want - M.g.rotation.y; while (d > Math.PI) d -= 2*Math.PI; while (d < -Math.PI) d += 2*Math.PI; M.g.rotation.y += d*Math.min(1, dt*2.2); }
  M.P = tgt ? PA : {r:[.1, 1.04, .36], l:[-.12, 1.0, .34], tinker:true}; M.look = tgt || _shopWp.set(tv.x, 1.0, tv.z + 1);
  if (!tgt) { M.sparkT -= dt; if (M.sparkT < 0) { M.sparkT = .25 + Math.random()*.8; _shopSp.set(tv.x + (Math.random() - .5)*.5, .98, tv.z + .75); emitSparks(_shopSp, UP); if (xs.maseL) xs.maseL.intensity = 2.2; } }
  if (xs.maseL) xs.maseL.intensity += (1.2 - xs.maseL.intensity)*Math.min(1, dt*6);
}
const _shopWp = new THREE.Vector3(), _shopSp = new THREE.Vector3();
const _bw = V3(), _bd = V3(), _bz = V3(0, 0, 1); let _blk = null, _bladeLeg = null, _gearBuilt = false, _blade = null, _shield = null, _shieldW = null;
function gearBuild() {
  _gearBuilt = true; _blade = new THREE.Group(); scene.add(_blade);
  const gb = new THREE.BoxGeometry(.03, .016, 1); gb.translate(0, 0, .5); const hot = new THREE.Mesh(gb, new THREE.MeshBasicMaterial({color:0xffb27a})); _blade.add(hot);
  const gc = new THREE.BoxGeometry(.012, .01, 1); gc.translate(0, 0, .5); const core = new THREE.Mesh(gc, new THREE.MeshBasicMaterial({color:0xfff4e6})); core.position.y = .002; _bladeLeg = legs.find(l => l.row === 0 && l.side > 0) || legs[0]; _blade.add(core); _blade.visible = false;
  const sg = new THREE.IcosahedronGeometry(.5, 2); _shield = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({color:0x7fa6ee, transparent:true, opacity:.14, side:THREE.DoubleSide, depthWrite:false}));
  _shieldW = new THREE.Mesh(new THREE.IcosahedronGeometry(.505, 1), new THREE.MeshBasicMaterial({color:0xcfe0ff, transparent:true, opacity:.3, wireframe:true, depthWrite:false})); _shield.add(_shieldW); _shield.visible = false; scene.add(_shield);
}
/* ---------- Gadgets am Körper der Spinne (sichtbar, wenn freigeschaltet) ---------- */
let _gad = null; const _gu = new THREE.Vector3(0,1,0), _gd = new THREE.Vector3();
function gadBuild() {
  const G = _gad = {pack:new THREE.Group(), shield:new THREE.Group(), blade:new THREE.Group(), dock:new THREE.Group(), map:new THREE.Group()};
  const A = (geo, m, x, y, z, p) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; p.add(o); return o; };
  { const p = G.pack; p.position.set(0,.56,-1.0);                                              // Virtual Backpack auf dem Hinterleib
    A(new THREE.BoxGeometry(.5,.16,.62), matDark, 0,.03,0, p); A(new THREE.BoxGeometry(.44,.03,.56), matLight, 0,.12,0, p);
    for (const z of [-.2,.2]) A(new THREE.BoxGeometry(.54,.035,.05), matBrass, 0,.04,z, p);
    A(new THREE.BoxGeometry(.28,.012,.025), matLens, 0,.14,-.22, p);
    for (const s of [-1,1]) { const k = A(new THREE.CylinderGeometry(.06,.06,.4,14), matBody, s*.31,.04,0, p); k.rotation.x = Math.PI/2; A(new THREE.CylinderGeometry(.045,.045,.02,12), matLens, s*.31,.04,.21, p).rotation.x = Math.PI/2;
      const an = A(new THREE.CylinderGeometry(.006,.01,.4,6), matLight, s*.2,.3,-.22, p); an.rotation.z = -s*.18; an.rotation.x = .25; }
    A(new THREE.SphereGeometry(.025,10,8), matLens, 0,.31,-.3, p); }
  { const p = G.shield; for (const [x,z] of [[.38,.12],[-.38,.12],[.32,-.3],[-.32,-.3]]) { const y = .14 + .26*Math.sqrt(Math.max(0,1 - (Math.hypot(x,z/1.1)/.57)**2)) + .01;
      const o = A(new THREE.CylinderGeometry(.05,.06,.035,14), matBrass, x,y,z, p); o.lookAt(x*2,y+.4,z*2); o.rotateX(Math.PI/2); A(new THREE.SphereGeometry(.032,12,8), matLens, x,y+.02,z, p).scale.y = .6; }
    const r = A(new THREE.TorusGeometry(.34,.01,6,32), matLens, 0,.43,0, p); r.rotation.x = Math.PI/2; }
  { const p = G.blade; A(new THREE.CylinderGeometry(.075,.075,.05,16), matBrass, 0,0,0, p); A(new THREE.CylinderGeometry(.062,.062,.1,16), matDark, 0,0,0, p); A(new THREE.BoxGeometry(.06,.05,.14), matLight, 0,.0,.0, p).position.set(.0,.0,.07); A(new THREE.CylinderGeometry(.012,.012,.08,8), matLens, 0,.0,.14, p).rotation.x = Math.PI/2; }
  { const p = G.dock; A(new THREE.CylinderGeometry(.065,.065,.04,16), matBrass, 0,0,0, p); A(new THREE.CylinderGeometry(.052,.052,.06,16), matLens, 0,0,0, p); A(new THREE.CylinderGeometry(.02,.03,.1,10), matDark, 0,.09,0, p); }
  { const p = G.map; A(new THREE.CylinderGeometry(.01,.014,.26,6), matLight, 0,.13,0, p); const d = A(new THREE.SphereGeometry(.085,16,8,0,Math.PI*2,0,Math.PI*.5), matLight, 0,.26,0, p); d.rotation.x = -.5; A(new THREE.SphereGeometry(.022,10,8), matLens, 0,.285,.03, p); p.position.set(.27,.2,.8); headG.add(p); }
  for (const k of ["pack","shield","blade","dock"]) { G[k].visible = false; spider.add(G[k]); } G.map.visible = false;
}
function gadTick() {
  if (!_gad) gadBuild(); const G = _gad;
  G.pack.visible = !!gear.pack; G.shield.visible = !!gear.shield; G.map.visible = !!gear.map; G.blade.visible = !!gear.knife; G.dock.visible = !!gear.knife;
  for (const [g, s, f] of [[G.blade, 1, .72], [G.dock, -1, .8]]) { const L = legs.find(l => l.row === 0 && l.side === s); if (!L || !g.visible) continue; g.position.lerpVectors(L.P2, L.P3, f); _gd.subVectors(L.P3, L.P2).normalize(); g.quaternion.setFromUnitVectors(_gu, _gd); }
}
function gearTick(dt, wantS) {
  upgTick(performance.now()/1000);
  if (!_gearBuilt) gearBuild(); const sb = $("btnShield"); if (sb) sb.style.display = gear.shield ? "" : "none"; if (ch2.stage >= 8) { gear.map = true; givePack(); } const mb = $("mapBtn"); if (mb) mb.style.display = gear.map ? "flex" : "none"; if (xs.on && xs.scene === "street" && xs.gar && gear.knife && ch2.stage >= 8) xs.gar.tgt = 1; const ib = $("btnInv"); if (ib) ib.style.display = gear.pack ? "" : "none";
  const out = gear.knife && (mode === "melee" && mel.state === 2 || bld.demo);
  bld.u += ((out ? 1 : 0) - bld.u)*Math.min(1, dt*(out ? 22 : 8)); _blade.visible = bld.u > .02; _blade.scale.z = Math.max(.01, bld.u*.5); if (_blade.visible) { const L = _bladeLeg; spider.localToWorld(_bw.copy(L.P3)); spider.localToWorld(_bd.copy(L.P2)); _bd.subVectors(_bw, _bd).normalize(); _blade.position.copy(_bw); _blade.quaternion.setFromUnitVectors(_bz, _bd); }
  { try { if (gear.knife && !gear.black && !wakeBusy) gear.black = true; const bk = !!gear.black, want = bk ? 0x14161c : 0xffffff; if (matLight.color.getHex() !== want) { matLight.color.setHex(want); matLight.emissive.setHex(bk ? 0x040508 : 0x70757e); matLight.roughness = 1; matLight.metalness = bk ? 0 : .1; matLight.envMapIntensity = bk ? .05 : 1; } } catch (e) {} }
  const _was = shd.on; shd.on = !!(gear.shield && (wantS || shd.demo)); if (shd.on !== _was) shieldSnd(shd.on); shd.u += ((shd.on ? 1 : 0) - shd.u)*Math.min(1, dt*10); shd.flash = Math.max(0, shd.flash - dt*3);
  shieldHumTick(shd.u);
  _shield.visible = shd.u > .02; if (_shield.visible) { _shield.position.copy(pos); _shield.scale.setScalar(.3 + .7*shd.u); _shield.material.opacity = (.12 + .1*Math.sin(clockT*9) + shd.flash*.35)*shd.u; _shieldW.material.opacity = (.22 + .15*Math.sin(clockT*5 + 1) + shd.flash*.5)*shd.u; _shield.rotation.y += dt*.4; }
}
/* Schild-Klang: Einschalten (aufsteigender Sweep + Schimmer), Dauerton (tiefes Summen mit Tremolo und feinem Knistern), Ausschalten (fallender Sweep) */
const shS = {on:false, hum:null};
function shieldHumInit() {
  if (shS.hum || !ac) return; const g = ac.createGain(); g.gain.value = 0; const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 520; lp.Q.value = 3;
  const o1 = ac.createOscillator(), o2 = ac.createOscillator(), o3 = ac.createOscillator(); o1.type = "sawtooth"; o1.frequency.value = 92; o2.type = "sine"; o2.frequency.value = 138.6; o3.type = "triangle"; o3.frequency.value = 461;
  const lfo = ac.createOscillator(), lg = ac.createGain(), tr = ac.createGain(); lfo.frequency.value = 7.3; lg.gain.value = .35; tr.gain.value = .65; lfo.connect(lg); lg.connect(tr.gain);
  const g3 = ac.createGain(); g3.gain.value = .12; o1.connect(lp); o2.connect(lp); o3.connect(g3); g3.connect(lp); lp.connect(tr); tr.connect(g); g.connect(fxIn);
  [o1, o2, o3, lfo].forEach(o => o.start()); shS.hum = {g, lp, o3};
}
function shieldSnd(on) {
  if (!ac) return; shieldHumInit(); const t = ac.currentTime;
  const sw = (f0, f1, d, v, type) => { const o = ac.createOscillator(), g = ac.createGain(), f = ac.createBiquadFilter(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + d);
    f.type = "lowpass"; f.frequency.setValueAtTime(on ? 900 : 2400, t); f.frequency.exponentialRampToValueAtTime(on ? 3200 : 500, t + d); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + (on ? d*.7 : .02)); g.gain.exponentialRampToValueAtTime(.0001, t + d + .08);
    o.connect(f); f.connect(g); g.connect(fxIn); o.start(t); o.stop(t + d + .12); };
  if (on) { sw(180, 880, .38, .07, "sawtooth"); sw(360, 1760, .38, .035, "sine"); beep(1320, .5, .34, .05); beep(1980, .4, .38, .03); beep(90, .3, 0, .09); }
  else { sw(760, 120, .32, .06, "sawtooth"); beep(110, .25, 0, .07); }
}
function shieldHumTick(u) { if (!shS.hum || !ac) return; shS.hum.g.gain.setTargetAtTime(u > .6 ? .045*u : 0, ac.currentTime, .06); shS.hum.lp.frequency.setTargetAtTime(420 + 260*u + 80*Math.sin(clockT*3) + shd.flash*500, ac.currentTime, .05); }
function takeHit(n) {      // für kommende Gegner: Holo-Schild blockt Treffer
  if (shd.on) { shd.flash = 1; clang(.3); beep(900, .1, 0, .04); return false; }
  const ks = Object.keys(PARTS), k = ks[(Math.random()*ks.length)|0]; PARTS[k] = Math.max(.02, PARTS[k] - (n || .22)); dmgHit = 1; clang(.4); return true;
}
/* ---------- Gespräch mit Mase ---------- */
function maseCut() {
  const M = shopM, ix = SHOP.ix, hd = SHOP.hd, hw = hwS(), c = {ev:[], subs:[]}, mx = M.g.position.x, mz = M.g.position.z;
  const tx = SHOP.tx, tz = SHOP.tz, p0 = [tx - 2.4, hw, tz - 1.0];
  let t = 1.0;
  t = dlgBuild([["M", "Wart, wart, nicht anfassen – gleich fertig … oh! Besuch! Und was für ein hübscher.", "j"], ["A", "Mase? Rackson hat mich zu dir runtergeschickt."], ["M", "Rackson, soso. Der schickt nie jemanden ohne Grund. Was will er diesmal?", "w"],
    ["A", "Du sollst mich aufmotzen. Ich brauche Ausrüstung für Jobs."], ["M", "Aufmotzen … Ein KRONOS-Prototyp, der sich freiwillig umbauen lässt. Mmh …", "t", .9], ["M", "Ich hätte zwei Sachen, die ich noch nie jemandem eingebaut habe: eine Laserklinge für ein Bein. Und einen Holo-Schild-Emitter.", "j"],
    ["A", "Ich bin bereit."], ["M", "Das sagen sie alle. … Trust me.", "j"]], t, c);
  const tEnd = t, dur = tEnd + 4.6;
  const tj = tEnd + 2.0, TJ = .75, jx0 = tx - 1.05, jx1 = tx - .25, top = .85 + hw, keys = [[0, p0[0], p0[1], p0[2], 0, 0, 1, 0, 1, 0], [tEnd - .2, p0[0], p0[1], p0[2], 0, 0, 1, 0, 1, 0], [tj - .35, jx0, hw, tz, 1, 0, 0, 0, 1, 0], [tj, jx0, hw*.6, tz, 1, .15, 0, 0, 1, 0]];
  for (let i = 1; i <= 8; i++) { const e = i/8; keys.push([tj + TJ*e, jx0 + (jx1 - jx0)*e, hw*.6 + (top - hw*.6)*e + .55*Math.sin(Math.PI*e), tz, 1, .45*Math.cos(Math.PI*e), 0, -.25*Math.cos(Math.PI*e), 1, 0]); }
  keys.push([dur, jx1, top, tz, 1, 0, 0, 0, 1, 0]); let landed = false;
  c.ev.push([tEnd + 3.2, () => { $("fade").classList.add("on"); }]);
  return finishCut({dur, bin:.6, bout:.0, ev:c.ev, subs:c.subs,
    shots:[{t0:0, t1:tEnd*.45, a:[mx + 3.2, 1.6, mz - 3.6, mx, 1.3, mz, 54], b:[mx + 2.6, 1.5, mz - 3.0, mx, 1.3, mz, 48]}, {t0:tEnd*.45, t1:tEnd*.8, a:[mx + .9, 1.55, mz - 1.5, mx, 1.5, mz, 40], b:[mx + .6, 1.52, mz - 1.2, mx, 1.5, mz, 34]},
      {t0:tEnd*.8, t1:tEnd + .5, a:[mx + .3, 1.5, mz - 1.0, mx, 1.5, mz, 32], b:[mx + .2, 1.5, mz - .85, mx, 1.5, mz, 28]}, {t0:tEnd + .5, t1:dur, a:[tx - 3.0, 1.5, tz - 1.6, tx - .3, .8, tz, 54], b:[tx - 2.4, 1.35, tz - 1.9, tx, .9, tz, 50]}],
    init() { cutPlace(p0[0], p0[1], p0[2], 0, 1, 0, 0, 0, 1); M.talk = true; M.cutFace = _maseFace.set(p0[0], 1, p0[2]); },
    spider(tt, dt) { pathPose(keys, tt, dt); const q = tt - tj; if (q > 0 && q < TJ) { landed = false; airPose(dt, .3 + .6*Math.sin(Math.PI*q/TJ)); } else if (q >= TJ && !landed) { landed = true; landLegs(UP); thud(3); } else if (q > -.35 && q <= 0) for (const l of legs) { footL(l, l.restLocal.x*(1 + .25*(-q/.35)), -HIP_H*.55, l.restLocal.z, 1); } const f = tt > tEnd ? _maseFace.set(tx, 1, tz) : _maseFace.set(p0[0], 1, p0[2]); M.cutFace = f; M.talk = false; shopTick(dt); },
    final() { M.talk = false; M.cutFace = null; },
    onEnd() { M.cutFace = null; ch2.stage = 7; setObj(""); $("fade").classList.add("on"); maseBlack(); gear.black = true; wakeBusy = true; setTimeout(() => startCut(wakeCut()), 3600); } });
}
const _maseFace = new THREE.Vector3();
function maseBlack() { beep(90, 1.2, 0, .08); beep(180, .5, .5, .05); clang(.3); setTimeout(() => { beep(2400, .08, 0, .04); beep(1600, .12, .15, .04); clang(.5); }, 1500); setTimeout(() => { beep(320, .6, 0, .05); }, 2600); }
function wakeCut() {
  const M = shopM, ix = SHOP.ix, hd = SHOP.hd, hw = hwS(), c = {ev:[], subs:[]}, tx = SHOP.tx, tz = SHOP.tz, mx = M.g.position.x, mz = M.g.position.z;
  let t = 3.4; c.ev.push([.1, () => $("fade").classList.remove("on")]); c.ev.push([2.6, () => { bld.demo = true; gear.knife = true; clang(.5); beep(2200, .1, 0, .05); }], [4.2, () => { bld.demo = false; }]);
  t = dlgBuild([["M", "Na? Zehn Finger, äh … acht Beine? Alle da. Dein vorderes Bein trägt jetzt eine Laserklinge – G oder Linksklick.", "j"]], t, c);
  c.ev.push([t + .2, () => { shd.demo = true; gear.shield = true; clang(.3); }], [t + 2.4, () => { shd.demo = false; }]);
  t = dlgBuild([["M", "Und der Holo-Schild: F oder Rechtsklick halten. Der frisst Energie – also sparsam damit.", "w"]], t + .2, c);
  c.ev.push([t + .3, () => { mapDl(); }]);
  t = dlgBuild([["M", "Ach ja, fast vergessen: Ich lade dir noch die Karte von CJ-City runter. Sektoren, Gassen, alles. Taste M.", "w"]], t + .2, c);
  t = dlgBuild([["A", "Karte empfangen. Standort wird angezeigt."]], t + 1.6, c);
  c.ev.push([t + .3, () => { packDl(); }]);
  t = dlgBuild([["M", "Und weil du kaum Platz hast: Ich geb dir noch ein Virtual Backpack. Ein digitales Inventar, passt alles rein, wiegt nichts. Taste I.", "w"]], t + .2, c);
  t = dlgBuild([["M", "Da siehst du deine Ausrüstung, deine Bauteile und kannst Upgrades einbauen. Bezahlt wird mit Gold, ich bin ja nicht von der Wohlfahrt.", "j"]], t + .2, c);
  t = dlgBuild([["A", "Backpack installiert. Danke, Mase."]], t + 1.8, c);
  t = dlgBuild([["A", "Ich fühle mich … vollständig."], ["M", "Das ist die Grundausrüstung. Die Jobs warten, Kleine. Ich schick Rackson die Rechnung.", "j"]], t, c);
  const dur = t + .8, p = [tx, .85 + hw, tz];
  return finishCut({dur, bin:.0, bout:.8, ev:c.ev, subs:c.subs, shots:[{t0:0, t1:3.4, a:[tx + .3, 1.9, tz - .2, tx, .9, tz, 60], b:[tx + 1.0, 1.4, tz + 1.2, tx, .95, tz, 52]}, {t0:3.4, t1:dur*.7, a:[tx + 1.2, 1.2, tz + 1.4, tx, .95, tz, 50], b:[tx + 1.0, 1.15, tz + 1.1, tx, .95, tz, 46]}, {t0:dur*.7, t1:dur, a:[mx + .9, 1.55, mz - 1.5, mx, 1.5, mz, 40], b:[mx + .6, 1.52, mz - 1.2, mx, 1.5, mz, 34]}],
    init() { cutPlace(p[0], p[1], p[2], 0, 1, 0, 1, 0, 0); M.talk = false; M.cutFace = _maseFace.set(tx, 1, tz); },
    spider(tt, dt) { pathPose(holdKeys(p, [1, 0, 0], [0, 1, 0]), tt, dt); shopTick(dt); },
    final() { gear.knife = gear.shield = gear.map = true; givePack(); bld.demo = shd.demo = false; M.cutFace = null; },
    onEnd() { gear.knife = gear.shield = gear.map = true; givePack(); bld.demo = shd.demo = false; M.cutFace = null; wakeBusy = false; ch2.stage = 8; cutPlace(tx, .89 + hw, tz, 0, 1, 0, 0, 0, -1); mode = "surf"; setObj(jobObj()); toast("Ausrüstung installiert"); } });
}
/* ---------- Dev-Werkzeuge (Einstellungen → DEV) ---------- */
const DEVJ = [["ORTE", [["Fertigungshalle", "lab"], ["Lüftungsschächte", "shaft"], ["Gasse", "alley"], ["Bar (innen)", "bar"], ["Straße", "street"], ["Parallelstraße (Beschattung)", "side"], ["Treppenhaus", "stairs"], ["Garage (zu)", "garage"], ["Mases Werkstatt", "shop"], ["Rackson: Auftrag (Wohnung, alt)", "job"], ["Dach (Auftrag)", "roof"], ["Kreditkontor innen", "bank"], ["Bar-Gespräch mit Klirr", "talkbar"]]],
  ["CUTSCENES", [["Neues Spiel / Intro", "intro"], ["Klirr bringt dich raus", "closing"], ["Morgen auf der Straße", "streetcut"], ["Rackson-Tür", "door"], ["Wohnung", "flat"], ["Rackson trifft dich (draußen)", "rackmeet"], ["Werkstatt: Warten auf Rackson", "rackwait"], ["Rackson: Auftrag (Werkstatt)", "rackjob"], ["Mase: Gespräch", "mase"], ["Mase: Aufwachen", "wake"], ["Beben (Labor)", "quake"], ["Ausbruch: Fenster", "window"], ["Schacht-Ausgang", "exit"], ["Finale: Lüftungsklappe", "outro"], ["Fassade hochklettern", "climb"], ["Dach: Ankunft", "roofarrive"], ["Dach: Lüftungsschacht öffnen", "vent"], ["Kreditkontor: Ankunft", "bankarrive"], ["Flucht durch den Schacht", "escape"]]]];
function devGo(id) {
  if (id === "intro") { try { localStorage.removeItem(slotKey(slot)); } catch (e) {} location.reload(); return; }
  if (!gameStarted) { devPending = id; startGame(true); return; }
  if (settingsOpen) closeSettings(); if (pauseOpen) closePause(); if (mode === "cut") skipCut();
  ch2.knock = 0; const hw = hwS(); $("fade").classList.remove("on");
  const cp2 = (k, f) => { loadCheckpoint(k); if (f) setTimeout(f, 450); };
  if (id === "lab") { xs.on = false; exG.visible = false; enterLab(); } else if (id === "shaft") loadCheckpoint("shaft"); else if (id === "alley") loadCheckpoint("alley");
  else if (id === "bar") cp2("alley", () => placeAt(BX - .5, hw, BZ + .6, 0, 1, 0, 0, 0, -1)); else if (id === "side") { gear.knife = gear.shield = gear.map = true; gear.job = Math.max(gear.job, 2); loadCheckpoint("side"); } else if (id === "street") loadCheckpoint("street"); else if (id === "stairs") loadCheckpoint("stairs"); else if (id === "garage") loadCheckpoint("garage"); else if (id === "shop") loadCheckpoint("shop");
  else if (id === "rackmeet") { gear.knife = gear.shield = gear.map = true; givePack(); gear.job = 0; gear.rackMet = gear.rackReady = false; cp2("shop", () => { ch2.stage = 8; startCut(rackMeetCut()); }); }
  else if (id === "rackwait" || id === "rackjob") { gear.knife = gear.shield = gear.map = true; givePack(); gear.job = 0; gear.rackMet = true; gear.rackReady = id === "rackjob"; ch2.rw = 0; ch2.rwI = 0; cp2("shop", () => { ch2.stage = 8; placeAt(GARX - .6, hwS(), SD/2 + 2.2, 0, 1, 0, 0, 0, 1); setObj(jobObj()); }); }
  else if (id === "closing") cp2("alley", () => { ch2.stage = 2; startCut(closingCut()); });
  else if (id === "streetcut") { xs.on = false; exG.visible = false; enterStreet("arrive"); }
  else if (id === "door") cp2("stairs", () => { placeAt(-.5, 10.9, -1.7, 0, 1, 0, 0, 0, -1); startCut(doorCut()); });
  else if (id === "flat") cp2("stairs", () => { exLeaveOld(); buildFlat(); ch2.stage = 5; startCut(flatCut()); });
  else if (id === "job") cp2("stairs", () => { gear.knife = gear.shield = gear.map = true; givePack(); gear.job = 0; exLeaveOld(); buildFlat(); ch2.stage = 8; startCut(jobCut()); });
  else if (id === "roof") { gear.knife = gear.shield = gear.map = true; givePack(); gear.job = 1; enterHeist("roof"); }
  else if (id === "bank") { gear.knife = gear.shield = gear.map = true; givePack(); gear.job = 1; enterHeist("bank"); }
  else if (id === "quake" || id === "window" || id === "outro") { xs.on = false; exG.visible = false; enterLab(); setTimeout(() => { if (id === "quake") { story.ph = "quake"; startCut(quakeCut()); } else if (id === "window") startWindowCut(); else { story.ph = "outro"; startCut(outroCut()); } }, 700); }
  else if (id === "exit") cp2("shaft", () => startCut(exitCut()));
  else if (id === "talkbar") cp2("alley", () => { try { startCut(talkCut()); } catch (e) {} });
  else if (id === "climb") { gear.knife = gear.shield = gear.map = true; givePack(); gear.job = 1; cp2("street", () => { ch2.stage = 9; startCut(climbCut()); }); }
  else if (id === "roofarrive" || id === "vent") { gear.knife = gear.shield = gear.map = true; givePack(); gear.job = 1; enterHeist("roof"); setTimeout(() => startCut(id === "vent" ? ventCut() : roofArriveCut()), 900); }
  else if (id === "bankarrive" || id === "escape") { gear.knife = gear.shield = gear.map = true; givePack(); gear.job = 1; enterHeist("bank"); setTimeout(() => startCut(id === "escape" ? escapeCut() : bankArriveCut()), 900); }
  else if (id === "mase") cp2("shop", () => startCut(maseCut())); else if (id === "wake") cp2("shop", () => startCut(wakeCut()));
}
let devPending = null;
function buildDev(box) {
  const mk = (h) => { const e = document.createElement("div"); e.className = "devh"; e.textContent = T(h); box.appendChild(e); }, tg = (lbl, get, set) => { const r = document.createElement("div"); r.className = "srow sw"; r.innerHTML = '<div><label>' + T(lbl) + '</label></div><button class="tg' + (get() ? ' on' : '') + '" role="switch"></button>'; const b = r.querySelector("button"); b.onclick = () => { set(!get()); b.classList.toggle("on", get()); }; box.appendChild(r); };
  mk("OPTIONEN"); tg("Hitboxen zeigen", () => hitOn, () => toggleHit()); tg("FPS-Anzeige", () => !!opt.fps, v => { opt.fps = v; saveOpt(); applyOpt(); });
  tg("Laser-Messer", () => gear.knife, v => { gear.knife = v; gear.black = v; }); tg("Holo-Schild", () => gear.shield, v => { gear.shield = v; }); tg("Unendlich Energie", () => dev.inf, v => { dev.inf = v; }); tg("Überspringen-Knopf immer sichtbar", () => dev.skip, v => { dev.skip = v; });
  const r = document.createElement("div"); r.className = "devg"; const tb = document.createElement("button"); tb.className = "devb"; tb.textContent = T("Test-Treffer (Schild prüfen)"); tb.onclick = () => { const ok = takeHit(.1); toast(ok ? "Treffer! Integrität sinkt" : "Treffer geblockt"); }; r.appendChild(tb); box.appendChild(r);
  for (const [h, list] of DEVJ) { mk(h); const g = document.createElement("div"); g.className = "devg"; for (const [lbl, id] of list) { const b = document.createElement("button"); b.className = "devb"; b.textContent = T(lbl); b.onclick = () => devGo(id); g.appendChild(b); } box.appendChild(g); }
}

/* ===== CJ-City-Karte (Download von Mase) ===== */
let cmapOpen = false, cmapT = 0;
$("cmap").addEventListener("click", () => toggleCMap());
function mapDl() {
  let n = 0; const iv = setInterval(() => { n += 1; toast(T("Karte CJ-City: Übertragung") + " " + Math.min(100, n*20) + " %"); beep(900 + n*220, .06, 0, .035); if (n >= 5) { clearInterval(iv); gear.map = true; clang(.25); beep(2400, .12, 0, .04); setTimeout(() => toast("Karte gespeichert – Taste M"), 500); } }, 650);
}
function toggleCMap() {
  if (!gear.map || mode === "cut" || mode === "menu") return;
  cmapOpen = !cmapOpen; setPanel($("cmap"), cmapOpen); if (cmapOpen) { unlockPtr(); try { drawCMap(); } catch (e) { console.error(e); } } else lock && lock();
}
function drawCMap() {
  if (!cmapOpen) return; const cv = $("cmapC"), g = cv.getContext("2d"), W = cv.width = 760, H = cv.height = 460; cmapT += .05;
  const O = "#4fa9a3", Wt = "#e8eefc", B = "#22252b", mut = "rgba(210,224,250,.5)";
  g.fillStyle = "#1d2026"; g.fillRect(0, 0, W, H);
  g.strokeStyle = "rgba(210,224,250,.06)"; g.lineWidth = 1; for (let x = 0; x < W; x += 40) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for (let y = 0; y < H; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  const CX = 385, KX = 16, AZ = 118, SZ = 318, KZ = 12;               // Welt → Karte: x*16, z*12
  const blk = (x, y, w, h, c, st) => { g.fillStyle = c || "#2c3036"; g.fillRect(x, y, w, h); g.strokeStyle = st || "rgba(210,224,250,.22)"; g.strokeRect(x + .5, y + .5, w, h); };
  const txt = (t, x, y, col, sz, al) => { g.fillStyle = col || Wt; g.font = "bold " + (sz || 12) + "px system-ui,sans-serif"; g.textAlign = al || "center"; g.fillText(T(t), x, y); };
  const road = (x, y, w, h) => { g.fillStyle = "#393c43"; g.fillRect(x, y, w, h); };
  /* Häuserblöcke */
  blk(190, 20, 160, 52); blk(440, 14, 220, 62);                                    // nördlich der Gasse (Halle ist weiter östlich)
  blk(190, 176, 210, 82); blk(430, 176, 250, 82);                                  // zwischen Gasse und Straße
  blk(190, 370, 480, 70);                                                          // südlich der Straße
  blk(22, 20, 108, 130, "#24272d"); blk(22, 300, 108, 140, "#24272d");              // jenseits des Zauns
  /* Straßen */
  road(CX - 12*KX, AZ - 2.6*KZ, 24*KX, 5.2*KZ);                                    // Gasse
  road(CX - 11*KX, SZ - 3.2*KZ, 22*KX, 6.4*KZ);                                    // Straße
  road(96, 0, 70, H);                                                              // Querstraße am Westende
  road(168, AZ + 2.6*KZ - 4, 42, SZ - AZ - 3.2*KZ - 2.6*KZ + 10);                  // Verbindung Gasse → Straße (Westende)
  g.strokeStyle = "rgba(240,246,255,.3)"; g.setLineDash([9, 9]); g.lineWidth = 2; [[CX - 11*KX, SZ, CX + 11*KX, SZ], [131, 0, 131, H]].forEach(l => { g.beginPath(); g.moveTo(l[0], l[1]); g.lineTo(l[2], l[3]); g.stroke(); }); g.setLineDash([]);
  /* Zaun */
  g.strokeStyle = O; g.lineWidth = 3; g.setLineDash([3, 4]); g.beginPath(); g.moveTo(98, SZ - 52); g.lineTo(98, SZ + 52); g.stroke(); g.setLineDash([]);
  /* Orte (Weltkoordinaten) */
  const wA = x => CX + x*KX, wS = x => CX + x*KX;
  const P = {bar:[wA(3.5), AZ - 2.6*KZ - 14], halle:[560, 45], werk:[wS(4), SZ + 3.2*KZ + 22], haus:[wS(8), SZ - 3.2*KZ - 24], kred:[290, 217], fe:[wA(-9.5), AZ + 2.6*KZ + 4]};
  const dot = (p, c, r) => { g.fillStyle = c; g.beginPath(); g.arc(p[0], p[1], r || 5, 0, 7); g.fill(); g.strokeStyle = B; g.lineWidth = 2; g.stroke(); };
  g.strokeStyle = "rgba(79,169,163,.55)"; g.lineWidth = 3; g.beginPath(); g.moveTo(P.halle[0], 78); g.lineTo(P.halle[0], AZ); g.lineTo(P.halle[0] - 10, AZ); g.stroke();
  dot([P.halle[0], P.halle[1]], Wt); dot(P.bar, Wt); dot(P.werk, O, 8); dot(P.haus, Wt); dot(P.kred, gear.job === 1 ? O : mut, gear.job === 1 ? 8 : 5);
  txt("Fertigungshalle", P.halle[0], P.halle[1] - 12); txt("Gasse", wA(-5), AZ + 4, mut); txt("Bar „Klirr“", P.bar[0], P.bar[1] - 10); txt("Haus Nr. 14 · Rackson", P.haus[0], P.haus[1] - 10);
  txt("Mases Werkstatt", P.werk[0], P.werk[1] + 20, O); txt("Straße", wS(-3), SZ - 40, mut); txt("Kreditkontor Brandt & Co.", P.kred[0], P.kred[1] + (gear.job === 1 ? 22 : 20), gear.job === 1 ? O : mut, 11);
  txt("Querstraße", 131, 14, mut, 11); txt("Zaun", 98, SZ - 58, O, 11); txt("CJ-City ›", 131, H - 36, mut, 11); txt("???", 76, 90, mut, 18); txt("???", 76, 380, mut, 18);
  g.fillStyle = mut; g.font = "11px system-ui,sans-serif"; g.textAlign = "left"; g.fillText("N ↑", 14, 22);
  /* Standort */
  let p = null;
  if (xs.on) { if (xs.scene === "street") p = pos.z > SD/2 ? [wS(clamp(pos.x, -3, 11)), SZ + 3.2*KZ + 14] : [wS(pos.x), SZ + pos.z*KZ]; else if (xs.scene === "stairs" || xs.scene === "flat" || xs.scene === "side") p = P.haus; else if (xs.scene === "roof" || xs.scene === "bank") p = P.kred; }
  else if (alley.on) p = alley.inBar ? P.bar : [wA(clamp(pos.x, -11.5, 11.5)), AZ + pos.z*KZ];
  else p = [P.halle[0], P.halle[1]];
  const pu = 1 + .25*Math.sin(cmapT*3);
  g.strokeStyle = O; g.lineWidth = 3; g.beginPath(); g.arc(p[0], p[1], 15*pu, 0, 7); g.stroke(); g.fillStyle = O; g.beginPath(); g.arc(p[0], p[1], 5, 0, 7); g.fill();
  txt("DU", p[0] + 20, p[1] + 4, Wt, 12, "left");
  g.fillStyle = "rgba(29,32,38,.85)"; g.fillRect(0, H - 26, W, 26); txt("KARTE CJ-CITY  ·  M oder Tippen zum Schließen", W/2, H - 9);
  requestAnimationFrame(drawCMap);
}


/* ===== Sichtbare Upgrades an ARACHNE-8 ===== */
const upgG = new THREE.Group(); spider.add(upgG); let upgSig = "", upgLeds = [], upgPods = [];
const mUOr = mat(0x3c8680, .4, .4), mUSt = mat(0x6a7488, .8, .35), mUBl = mat(0x0f2250, .5, .25), mUWh = mat(0xe8eefc, .3, .5), mUPod = mat(0xcfe4ff, .2, .3), mUDk = mat(0x14161c, .5, .6);
mUOr.emissive = new THREE.Color(0x3c8680); mUOr.emissiveIntensity = .35; mUPod.emissive = new THREE.Color(0x9fc4ff); mUPod.emissiveIntensity = .3;
function upgBuild() {
  while (upgG.children.length) upgG.remove(upgG.children[0]); upgLeds = []; upgPods = []; const u = gear.upg, ad = (g, m, x, y, z) => add(g, m, x, y, z, upgG);
  for (let i = 0; i < u.laser; i++) for (const s of [-1, 1]) { ad(new THREE.CylinderGeometry(.045, .05, .3, 10), mUSt, s*.2, .08, 1.12).rotation.x = Math.PI/2; ad(new THREE.TorusGeometry(.055, .014, 6, 12), mUOr, s*.2, .08, 1.0 + i*.1).rotation.y = Math.PI/2; }
  if (u.akku) { ad(new THREE.BoxGeometry(.46, .13, .5), mUDk, 0, .4, -.5); for (let i = 0; i < 3; i++) { const m = i < u.akku ? mUOr : mUSt, o = ad(new THREE.BoxGeometry(.09, .03, .06), m, -.14 + i*.14, .475, -.34); upgLeds.push(o); } }
  if (u.panzer) { ad(new THREE.BoxGeometry(.7, .05, .6), mUDk, 0, .5, .12); ad(new THREE.BoxGeometry(.7, .02, .05), mUOr, 0, .535, .34);
    if (u.panzer > 1) for (const s of [-1, 1]) { const o = ad(new THREE.BoxGeometry(.3, .05, .7), mUDk, s*.52, .34, .05); o.rotation.z = -s*.55; }
    if (u.panzer > 2) { ad(new THREE.BoxGeometry(.6, .05, .35), mUDk, 0, .46, -.28); ad(new THREE.BoxGeometry(.6, .02, .04), mUOr, 0, .495, -.1); } }
  for (let i = 0; i < u.repair; i++) for (const s of [-1, 1]) upgPods.push(ad(new THREE.SphereGeometry(.07, 10, 8), mUPod, s*.5, .2, -.75 - i*.22));
  if (u.servo) for (const s of [-1, 1]) for (const z of ROWZ) for (let i = 0; i < u.servo; i++) ad(new THREE.TorusGeometry(.2, .018, 6, 16), mUOr, s*.42, -.07 - i*.055, z).rotation.x = Math.PI/2;
  if (u.muskel) for (const s of [-1, 1]) for (const z of ROWZ) { const h = .2 + .1*u.muskel; ad(new THREE.CylinderGeometry(.035, .035, h, 8), mUSt, s*.6, .02 + h/2 - .02, z); ad(new THREE.CylinderGeometry(.05, .05, .08, 8), mUOr, s*.6, .02 + h, z); }
  if (u.solar) { ad(new THREE.BoxGeometry(.5, .03, .6), mUBl, 0, .62, -1.05); ad(new THREE.BoxGeometry(.04, .1, .04), mUSt, 0, .56, -1.05); for (let i = 0; i < 3; i++) ad(new THREE.BoxGeometry(.5, .035, .012), mUWh, 0, .625, -.85 - i*.2);
    if (u.solar > 1) for (const s of [-1, 1]) { const o = ad(new THREE.BoxGeometry(.4, .03, .6), mUBl, s*.42, .58, -1.05); o.rotation.z = -s*.25; }
    if (u.solar > 2) for (const s of [-1, 1]) { const o = ad(new THREE.BoxGeometry(.36, .03, .6), mUBl, s*.78, .5, -1.05); o.rotation.z = -s*.5; } }
  for (let i = 0; i < u.tarn; i++) ad(new THREE.CylinderGeometry(.2 - i*.04, .2 - i*.04, .025, 16), i % 2 ? mUOr : mUDk, 0, .3 + i*.045, .8);
  if (u.hack) { ad(new THREE.BoxGeometry(.2, .07, .32), mUDk, .32, .47, .3); ad(new THREE.BoxGeometry(.12, .02, .12), mUOr, .32, .51, .3); for (let i = 0; i < u.hack; i++) { ad(new THREE.CylinderGeometry(.008, .008, .3 + i*.12, 6), mUSt, .26 + i*.06, .62 + i*.06, .22); ad(new THREE.SphereGeometry(.02, 6, 6), mUOr, .26 + i*.06, .77 + i*.12, .22); } }
  if (u.feder) for (const s of [-1, 1]) for (const z of ROWZ) for (let i = 0; i < 2*u.feder; i++) ad(new THREE.TorusGeometry(.14, .017, 6, 14), mUSt, s*.42, -.17 - i*.04, z).rotation.x = Math.PI/2;
}
function upgTick(t) { const g = JSON.stringify(gear.upg); if (g !== upgSig) { upgSig = g; upgBuild(); } for (let i = 0; i < upgPods.length; i++) upgPods[i].scale.setScalar(1 + .25*Math.sin(t*3 + i)); }

/* ===== AR-Namensschilder: Namen bekannter Figuren neben dem Kopf ===== */
let _ar = null; const _arV = new THREE.Vector3();
function arKnow(k) { try { gear.known = gear.known || {}; gear.known[k] = 1; } catch (e) {} }
function arTick(dt) {
  if (!_ar) { const lay = document.createElement("div"); lay.id = "arLayer"; document.body.appendChild(lay); _ar = {lay, tags:{}}; }
  const A = _ar, on = opt.ar && mode === "surf" && !paused && !fp && !(cut && cut.def) && gameStarted && story.ph !== "menu" && !document.body.classList.contains("prolog");
  A.lay.style.display = on ? "" : "none"; if (!on) return; const w = innerWidth, h = innerHeight, kn = gear.known || {};
  for (const k in SPK) {
    const S = SPK[k], R = S.R; let e = A.tags[k]; let show = !!(kn[k] && R && R.g && R.head);
    if (show) { let o = R.g; while (o && o !== scene) { if (!o.visible) { show = false; break; } o = o.parent; } if (o !== scene) show = false; }
    if (show) { R.head.getWorldPosition(_arV); const sc = R.g.getWorldScale(new THREE.Vector3()).y || 1; _arV.y += .42*sc; const dd = Math.hypot(_arV.x - pos.x, _arV.y - pos.y, _arV.z - pos.z); const q = _arV.project(camera); if (q.z < 1 && q.y > .88 && q.y < 8) q.y = .88;
      if (dd > 15 || q.z > 1 || Math.abs(q.x) > 1.05 || Math.abs(q.y) > 1.05) show = false; else {
        if (!e) { e = document.createElement("div"); e.className = "arN"; const p = S.name.split(" · "); e.innerHTML = (p.length > 1 ? "<small></small>" : "") + "<b></b><i></i>"; if (p.length > 1) e.querySelector("small").textContent = T(p[0]); e.querySelector("b").textContent = T(p[p.length - 1]); A.lay.appendChild(e); A.tags[k] = e; }
        e.style.display = ""; e.style.opacity = clamp((15 - dd)/5, 0, 1).toFixed(2); e.style.transform = "translate(" + ((q.x*.5 + .5)*w).toFixed(1) + "px," + ((-q.y*.5 + .5)*h).toFixed(1) + "px)"; } }
    if (!show && e) e.style.display = "none";
  }
}
{ const st = document.createElement("style"); st.textContent = `
#arLayer{position:fixed;inset:0;z-index:4;pointer-events:none;overflow:hidden}
#arLayer .arN{position:absolute;left:0;top:0;width:0;height:0;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;color:#E2E8F0;text-transform:uppercase;will-change:transform}
#arLayer .arN small{font-size:9px;letter-spacing:.26em;color:#4FA9A3;margin-bottom:2px;white-space:nowrap;transform:translateY(-100%);position:absolute;bottom:34px}
#arLayer .arN b{font-weight:500;font-size:13px;letter-spacing:.2em;white-space:nowrap;padding:3px 10px;background:rgba(11,14,20,.62);border-bottom:2px solid #4FA9A3;position:absolute;bottom:18px;transform:translateY(0)}
#arLayer .arN i{position:absolute;bottom:0;width:1px;height:18px;background:linear-gradient(rgba(79,169,163,.0),rgba(79,169,163,.8))}
#arLayer .arN i::after{content:"";position:absolute;left:-2px;bottom:-3px;width:5px;height:5px;background:#4FA9A3;transform:rotate(45deg)}
body.menu #arLayer,body.ivOpen #arLayer{display:none !important}`; document.head.appendChild(st); }
