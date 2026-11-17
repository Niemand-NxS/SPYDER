
/* ======================= Hacken ======================= */
const _hk = V3();
const cable = new THREE.Line(new THREE.BufferGeometry().setFromPoints(Array.from({length:24}, () => V3())), new THREE.LineBasicMaterial({color:0xa88246}));
cable.frustumCulled = false; cable.visible = false; scene.add(cable);
function beep(f, d, delay=0, vol=.08) {
  if (!ac) return; const t = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
  o.type = "triangle"; o.frequency.value = f; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t+d);
  o.connect(g); g.connect(fxIn); o.start(t); o.stop(t+d+.02);
}
function nearTerminal() {
  if (mode !== "surf" || nB.y < .8) return -1;
  let best = -1, bd = 2.3;
  terms.forEach((T, i) => { if (!T.active) return; const d = Math.hypot(pos.x - T.stand.x, pos.z - T.stand.z); if (d < bd) { bd = d; best = i; } });
  return best;
}
function startHack() {
  const i = nearTerminal(); if (i < 0 || hack.state) return;
  if (terms[i].hacked) { toast("Dieses Terminal ist bereits gehackt"); return; }
  if (fp) { hack.wasFP = true; setFP(false); } hack.state = 1; hack.i = i; hack.t = 0; hack.dist = 9; jump.charge = 0; jump.held = false;
}
function updateHack(dt) {
  if (!hack.state) return;
  const T = terms[hack.i];
  if (mode !== "surf") { hack.state = 0; hack.pl = 0; cable.visible = false; for (const l of legs) l.type = false; T.sockM.color.setHex(0x7a4416); return; }
  if (hack.state === 1) {
    const ang = Math.atan2(nS.dot(_t2.crossVectors(hd, T.face)), hd.dot(T.face));
    if (hack.dist < .1 && Math.abs(ang) < .12) { const L = hack.leg = legs.find(l => l.row === 0 && l.side > 0); hack.state = 2; hack.t = 0; hack.tick = 0; hack.f0 = L.foot.clone(); cable.visible = true; L.type = true; L.stepping = false; beep(520,.1); }
    return;
  }
  hack.t += dt*uHk(); const p = clamp(hack.t/5.2, 0, 1), L = hack.leg, tt = hack.t;
  // ein Vorderbein führt den Stecker zur Buchse: ausholen, einstecken, halten, am Ende lösen
  _b.copy(T.port).addScaledVector(T.n, .13); _b.y += .05;
  if (tt < 1.0) { const u = tt/1.0, e = u*u*(3 - 2*u); _hk.lerpVectors(hack.f0, _b, e); _hk.y += Math.sin(Math.PI*u)*.07; }
  else if (tt < 1.4) { const u = (tt - 1.0)/.4; _hk.lerpVectors(_b, T.port, u*u); }
  else { _hk.copy(T.port); if (hack.pl !== 1) { hack.pl = 1; clang(.25); T.sockM.color.setHex(0xffb066); beep(700,.06); } _hk.y += Math.sin(tt*30)*.0015; }
  L.foot.lerp(_hk, 1 - Math.exp(-dt*(tt < 1.4 ? 16 : 30)));
  hack.tick += dt; if (hack.tick > .1) { hack.tick = 0; drawScreen(T, tt, tt > 1.4 ? Math.max(p, .01) : 0); }
  _t1.set(0,.02,1.0); spider.localToWorld(_t1); _t2.copy(L.foot); _t3.copy(_t1).add(_t2).multiplyScalar(.5); _t3.y -= .1; _t3.addScaledVector(T.n, .05);
  const pa = cable.geometry.attributes.position;
  for (let i = 0; i < 24; i++) { const u = i/23, w0 = (1-u)*(1-u), w1 = 2*u*(1-u), w2 = u*u;
    pa.setXYZ(i, w0*_t1.x + w1*_t3.x + w2*_t2.x, w0*_t1.y + w1*_t3.y + w2*_t2.y, w0*_t1.z + w1*_t3.z + w2*_t2.z); }
  pa.needsUpdate = true;
  if (p >= 1) {
    T.hacked = true; hack.state = 0; hack.pl = 0; hack.count++; cable.visible = false; L.type = false; T.sockM.color.setHex(0x7a4416);
    drawScreen(T, tt, 0); $("hHack").textContent = hack.count; if (hack.wasFP) { hack.wasFP = false; setFP(true); } onHacked(T);
    beep(660,.12); beep(880,.2,.13); toast(T.name + ": ZUGRIFF GEWÄHRT");
    if (!T.tmp && hack.count === terms.length) setTimeout(() => toast("Alle Systeme kompromittiert – Prototyp-Ziel erreicht"), 2800);
  }
}

/* ======================= Abseilen ======================= */
const ropeLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([V3(), V3()]), new THREE.LineBasicMaterial({color:0xd9d6cc}));
ropeLine.frustumCulled = false; ropeLine.visible = false; scene.add(ropeLine);
function ceilAt(x, z, y) { let h = H; for (const b of blocks) { const y0 = b.y0 !== undefined ? b.y0 : 0; if (x > b.x0 - .05 && x < b.x1 + .05 && z > b.z0 - .05 && z < b.z1 + .05 && y0 > y && y0 < h) h = y0; } return h; }
function startRope() {
  if (mode !== "surf" || nB.y > -.6 || hack.state) return;
  rope.face.copy(hd).setY(0); if (rope.face.lengthSq() < 1e-4) rope.face.set(0,0,-1); rope.face.normalize();
  rope.ax = pos.x; rope.az = pos.z; rope.H = ceilAt(pos.x, pos.z, pos.y); rope.L = rope.H - pos.y; rope.ox = rope.oz = rope.vx = rope.vz = 0;
  mode = "rope"; ropeLine.visible = true; vel.set(0,0,0); jump.charge = 0; jump.held = false;
  for (const l of legs) { l.stepping = false; l.land = false; }
  toast("Abseilen: ↓ = Seil ab · W = hoch · Leertaste = lösen");
}
function ropePose(dt) {
  const kf = 1 - Math.exp(-dt*10);
  for (const l of legs) { _a.set(l.hip.x + l.side*1.3, -.3 + .1*Math.sin(clockT*2 + l.row + l.side), l.restLocal.z*.75 + .5); spider.localToWorld(_a); l.foot.lerp(_a, kf); l.stepping = false; l.type = false; }
}
function endRope() { jump.lock = true; mode = "air"; vel.set(rope.vx, 0, rope.vz); ropeLine.visible = false; }
function stepRope(dt, ix, iz) {
  const hw = hipNow*S;
  const Lmin = .56*SC, Lmax = rope.H - .62*SC;                      // Kopf nach unten: Abdomen (Fadenansatz) liegt oben
  if (rope.L < Lmin) rope.L = Math.min(Lmin, rope.L + dt*.6); else rope.L = clamp(rope.L - (iz - (keys.ArrowDown ? 1 : 0))*1.1*dt, Lmin, Lmax);
  let rx = Math.cos(camYaw), rz = -Math.sin(camYaw); if (fp) { _a.set(-1,0,0).applyQuaternion(spider.quaternion); rx = _a.x; rz = _a.z; }
  if (shaft.on && rope.L <= Lmin + .03 && iz > .3) { ropeToCeiling(); return; }
  const L = Math.max(rope.L, .3), w = GRAV/L;
  rope.vx += (-w*rope.ox - 1.2*rope.vx + rx*ix*2.5)*dt; rope.vz += (-w*rope.oz - 1.2*rope.vz + rz*ix*2.5)*dt;
  rope.ox = clamp(rope.ox + rope.vx*dt, -L*.8, L*.8); rope.oz = clamp(rope.oz + rope.vz*dt, -L*.8, L*.8);
  pos.set(rope.ax + rope.ox, rope.H - Math.sqrt(Math.max(L*L - rope.ox*rope.ox - rope.oz*rope.oz, .01)), rope.az + rope.oz);
  clampIn(pos, .03); { const px = pos.x, pz = pos.z; pushOutBlocks(pos); if (pos.x !== px || pos.z !== pz) { rope.ox = pos.x - rope.ax; rope.oz = pos.z - rope.az; rope.vx *= -.3; rope.vz *= -.3; } } vel.set(rope.vx, 0, rope.vz); speed = 0;
  sdf(pos, _n); nB.copy(_n).normalize();
  const kr = 1 - Math.exp(-dt*3.5);
  smoothDir(hd, _t3.set(rope.ox, -(rope.H - pos.y), rope.oz).normalize(), kr, _xa);   // Körper hängt in Seilrichtung, Kopf unten
  smoothDir(nS, _t2.copy(rope.face).negate(), kr, _xa);
  updateFrame(dt, 3.5, UP); orient(); ropePose(dt);
  _t1.set(0,.08,-1.87); spider.localToWorld(_t1);
  const pa = ropeLine.geometry.attributes.position; pa.setXYZ(0, rope.ax, rope.H, rope.az); pa.setXYZ(1, _t1.x, _t1.y, _t1.z); pa.needsUpdate = true;
}

/* ======================= Angriff + Mannequin ======================= */
let energy = 1, atkO = null, atkG = null, decalT = 0, decalI = 0, sparkI = 0;
const beam = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, 1, 6), new THREE.MeshBasicMaterial({color:0xd8452b}));
beam.visible = false; beam.frustumCulled = false; scene.add(beam);
const hitDot = new THREE.Mesh(new THREE.SphereGeometry(.03, 8, 6), new THREE.MeshBasicMaterial({color:0xffc08a})); hitDot.visible = false; scene.add(hitDot);
const decals = [], decalGeo = new THREE.CircleGeometry(.05, 10), decalMat = new THREE.MeshBasicMaterial({color:0x1a1210, transparent:true, opacity:.75, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-2});
const NS = 70, sPos = new Float32Array(NS*3).fill(-100), sVel = new Float32Array(NS*3), sLife = new Float32Array(NS);
const sGeo = new THREE.BufferGeometry(); sGeo.setAttribute("position", new THREE.BufferAttribute(sPos, 3));
const sparks = new THREE.Points(sGeo, new THREE.PointsMaterial({color:0xffb070, size:.035, transparent:true, opacity:.9})); sparks.frustumCulled = false; scene.add(sparks);

// Mannequin (Schaufensterpuppe, ~1,75 m)
const mann = new THREE.Group(), fig = new THREE.Group(); mann.position.set(2.7, 0, -1.2); scene.add(mann); mann.add(fig); fig.rotation.y = -2.3;
const mTone = new THREE.MeshStandardMaterial({color:0xd9d5ca, roughness:.5, metalness:.05, emissive:0x000000}), mJoint = mStd(0x3a3d42,.5,.5);
function mpart(geo, mt, x, y, z, sx=1, sy=1, sz=1) { const o = new THREE.Mesh(geo, mt); o.position.set(x,y,z); o.scale.set(sx,sy,sz); o.castShadow = true; o.receiveShadow = true; fig.add(o); return o; }
mpart(new THREE.BoxGeometry(.5,.03,.4), mJoint, 0,.015,0);
for (const s of [-1,1]) {
  mpart(new THREE.CylinderGeometry(.062,.045,.86,16), mTone, s*.1,.46,0);   mpart(new THREE.SphereGeometry(.055,12,10), mJoint, s*.1,.47,0);
  mpart(new THREE.BoxGeometry(.09,.05,.2), mTone, s*.1,.06,.05);
  mpart(new THREE.SphereGeometry(.07,14,12), mTone, s*.22,1.5,0);
  const arm = mpart(new THREE.CylinderGeometry(.045,.035,.62,14), mTone, s*.26,1.17,0); arm.rotation.z = s*.1;
  mpart(new THREE.SphereGeometry(.04,10,8), mJoint, s*.265,1.18,0); mpart(new THREE.SphereGeometry(.045,12,10), mTone, s*.285,.83,0);
}
mpart(new THREE.SphereGeometry(.17,18,14), mTone, 0,.96,0, 1,.65,.7);
mpart(new THREE.CylinderGeometry(.19,.145,.58,20), mTone, 0,1.27,0, 1,1,.62);
mpart(new THREE.CylinderGeometry(.05,.055,.1,12), mJoint, 0,1.6,0);
mpart(new THREE.SphereGeometry(.1,20,16), mTone, 0,1.72,0, .92,1.2,1.02);
const mq = {state:0, health:1, fall:0, timer:0, axis:V3(1,0,0), flinch:0, shake:0, flash:0, burn:false};
const mannBlks = solidsOf(mann, [], .1);
function topple() {
  if (mq.state) return; mq.state = 1; _t1.set(mann.position.x - pos.x, 0, mann.position.z - pos.z).normalize(); mq.axis.set(_t1.z, 0, -_t1.x);
  toast("Mannequin ausgeschaltet");
}
const _mbs = mannBlks.map(b => ({...b}));
function updateMann(dt) {
  const mo = mq.state ? 1e9 : 0; mannBlks.forEach((b, i) => { b.x0 = _mbs[i].x0 + mo; b.x1 = _mbs[i].x1 + mo; });
  if (mq.state === 1) { mq.fall = Math.min(1.5, mq.fall + dt*(1 + mq.fall*3.5)); if (mq.fall >= 1.5) { mq.state = 2; mq.timer = 4; thud(9); } }
  else if (mq.state === 2) { mq.timer -= dt; if (mq.timer <= 0) mq.state = 3; }
  else if (mq.state === 3) { mq.fall -= dt*1.4; if (mq.fall <= 0) { mq.fall = 0; mq.state = 0; mq.health = 1; } }
  mann.quaternion.setFromAxisAngle(mq.axis, mq.fall + mq.flinch*.22 + Math.sin(clockT*40)*.05*mq.shake);
  mq.flinch = Math.max(0, mq.flinch - dt*2.5); mq.shake = Math.max(0, mq.shake - dt*4);
  const f = Math.max(mq.flash, mq.burn ? .5 + Math.random()*.5 : 0); mTone.emissive.setRGB(.42*f, .16*f, .08*f); mq.flash = Math.max(0, mq.flash - dt*4);
}
function hitMann(o, d, maxT) {
  if (mq.state) return -1;
  for (let t = 0; t < maxT; t += .04) {
    const x = o.x + d.x*t - mann.position.x, z = o.z + d.z*t - mann.position.z, y = o.y + d.y*t;
    if (y > 0 && y < 1.82 && x*x + z*z < .04) return t;
  }
  return -1;
}
function emitSparks(p, n) {
  for (let k = 0; k < 3; k++) { const j = sparkI; sparkI = (sparkI + 1) % NS;
    sPos[j*3] = p.x; sPos[j*3+1] = p.y; sPos[j*3+2] = p.z; sLife[j] = .35 + Math.random()*.25;
    sVel[j*3] = n.x*1.2 + (Math.random()-.5)*1.6; sVel[j*3+1] = n.y*1.2 + (Math.random()-.5)*1.6 + .6; sVel[j*3+2] = n.z*1.2 + (Math.random()-.5)*1.6; }
}

function updateAttack(dt) {
  const wantS = !!(gear.shield && (keys.KeyF || keys.Mouse2) && energy > .02 && (mode === "surf" || mode === "rope") && !hack.state && !mel.state), want = false;
  energy = clamp(energy + (wantS ? (dev.inf ? 0 : -.22*uAk()) : .2*uSo())*dt, 0, 1); gearTick(dt, wantS); $("enFill").style.width = (energy*100) + "%";
  if (ac && !atkO) {
    atkO = ac.createOscillator(); atkO.type = "sawtooth"; atkO.frequency.value = 170;
    const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 600; atkG = ac.createGain(); atkG.gain.value = 0;
    atkO.connect(lp); lp.connect(atkG); atkG.connect(fxIn); atkO.start();
  }
  if (atkG) atkG.gain.setTargetAtTime(want ? .035 : 0, ac.currentTime, .03);
  beam.visible = hitDot.visible = false; let burning = false;
  if (want) {
    _a.set(0,.03,1.14); spider.localToWorld(_a);                          // Mündung am Kopf
    if (fp) camera.getWorldDirection(_b);
    else {
      _b.set(0,0,1).applyQuaternion(spider.quaternion);                    // Blickrichtung des Körpers
      _t1.set(mann.position.x, 1.2, mann.position.z).sub(_a); const dist = _t1.length();
      if (!mq.state && dist < 8 && dist > .3 && _t1.dot(_b)/dist > .82) _b.copy(_t1).multiplyScalar(1/dist);   // Zielhilfe
    }
    const r = rayBox(_a, _b); let len = r.t; const plane = r.i, tm = hitMann(_a, _b, len), onM = tm >= 0; if (onM) len = tm;
    _t3.copy(_a).addScaledVector(_b, len);
    beam.visible = hitDot.visible = true;
    beam.position.copy(_a).addScaledVector(_b, len/2); beam.quaternion.setFromUnitVectors(UP, _b);
    const w = .8 + Math.random()*.5; beam.scale.set(w, len, w); hitDot.position.copy(_t3); hitDot.scale.setScalar(.8 + Math.random()*.6);
    decalT -= dt;
    if (onM) {
      burning = true; mq.health -= .3*dt; if (mq.health <= 0) topple();
      if (decalT <= 0) { decalT = .05; _t2.copy(_b).negate(); emitSparks(_t3, _t2); }
    } else if (decalT <= 0) {
      decalT = .06; const m = decals[decalI] || (decals[decalI] = (() => { const o = new THREE.Mesh(decalGeo, decalMat); scene.add(o); return o; })());
      const n = r.n; m.position.copy(_t3).addScaledVector(n, .004); m.lookAt(_t3.x + n.x, _t3.y + n.y, _t3.z + n.z);
      m.scale.setScalar(.7 + Math.random()*.6); decalI = (decalI + 1) % 160; emitSparks(_t3, n);
    }
  }
  mq.burn = burning;
  for (let j = 0; j < NS; j++) if (sLife[j] > 0) {
    sLife[j] -= dt; if (sLife[j] <= 0) { sPos[j*3+1] = -100; continue; }
    sVel[j*3+1] -= 6*dt; sPos[j*3] += sVel[j*3]*dt; sPos[j*3+1] += sVel[j*3+1]*dt; sPos[j*3+2] += sVel[j*3+2]*dt;
  }
  sGeo.attributes.position.needsUpdate = true;
}

/* ======================= Kamera / Fotos ======================= */
let shot = false;
function takePhoto() { if (shot || !fp) return; shot = true; $("flash").style.opacity = .85; setTimeout(() => $("flash").style.opacity = 0, 90); if (ac) { beep(1800,.03,0,.05); beep(900,.05,.04,.05); } try { obsShot(); } catch (e) {} }
const photoList = []; let phIdx = 0, phWas = false;
function photoPile() {
  const gal = $("gallery"); gal.innerHTML = ""; const n = photoList.length; gal.classList.toggle("has", n > 0); if (!n) return;
  const sh = photoList.slice(-6);
  sh.forEach((p, i) => { const k = sh.length - 1 - i, im = document.createElement("img"); im.src = p.url; im.alt = ""; im.style.setProperty("--r", (((p.n*47) % 11) - 5) + "deg"); im.style.setProperty("--x", (k*9) + "px"); im.style.setProperty("--y", (-k*5) + "px"); im.style.zIndex = i; gal.appendChild(im); });
  if (n > 1) { const b = document.createElement("b"); b.textContent = n; gal.appendChild(b); }
}
function phShow() {
  const p = photoList[phIdx]; $("phImg").src = p.url; $("phCap").textContent = "SPYDER-CAM · " + T("Foto") + " " + String(p.n).padStart(3, "0") + "  ·  " + (phIdx + 1) + " / " + photoList.length;
  $("phPrev").disabled = phIdx <= 0; $("phNext").disabled = phIdx >= photoList.length - 1; $("phDl").textContent = "⬇ " + T("Herunterladen"); $("phDel").textContent = "🗑 " + T("Löschen"); $("phX").textContent = T("Schließen");
}
function phOpen(i) { if (!photoList.length) return; const v = $("phView"); if (!v.classList.contains("show")) { phWas = paused; paused = true; unlockPtr(); } phIdx = clamp(i, 0, photoList.length - 1); phShow(); v.classList.add("show"); }
function phClose() { const v = $("phView"); if (!v.classList.contains("show")) return; v.classList.remove("show"); if (!phWas) paused = false; try { lock(); } catch (e) {} }
function phDel() { photoList.splice(phIdx, 1); photoPile(); if (!photoList.length) phClose(); else { phIdx = Math.min(phIdx, photoList.length - 1); phShow(); } }
function phDl() { const p = photoList[phIdx]; if (!p) return; const a = document.createElement("a"); a.href = p.url; a.download = "spyder-" + p.n + ".jpg"; document.body.appendChild(a); a.click(); a.remove(); }
$("gallery").addEventListener("click", () => phOpen(photoList.length - 1));
$("phPrev").onclick = () => phOpen(phIdx - 1); $("phNext").onclick = () => phOpen(phIdx + 1); $("phDl").onclick = phDl; $("phDel").onclick = phDel; $("phX").onclick = phClose;
$("phView").addEventListener("click", e => { if (e.target === $("phView")) phClose(); });
addEventListener("keydown", e => { if (!$("phView").classList.contains("show")) return; if (e.key === "Escape" || e.key === "Backspace") phClose(); else if (e.key === "ArrowLeft") phOpen(phIdx - 1); else if (e.key === "ArrowRight") phOpen(phIdx + 1); else if (e.key === "Delete") phDel(); else if (e.key === "Enter" || e.key === "d") phDl(); e.preventDefault(); e.stopImmediatePropagation(); }, true);
function savePhoto() {
  const src = renderer.domElement, w = Math.min(1280, src.width), h = Math.round(w*src.height/src.width), s = w/640;
  const c = document.createElement("canvas"); c.width = w; c.height = h; const x = c.getContext("2d"); x.drawImage(src, 0, 0, w, h);
  x.strokeStyle = "rgba(232,230,223,.85)"; x.lineWidth = 2*s; const m = 16*s, l = 26*s;
  [[m,m,1,1],[w-m,m,-1,1],[m,h-m,1,-1],[w-m,h-m,-1,-1]].forEach(([px,py,sx,sy]) => { x.beginPath(); x.moveTo(px,py+sy*l); x.lineTo(px,py); x.lineTo(px+sx*l,py); x.stroke(); });
  x.fillStyle = "rgba(240,245,255,.92)"; x.font = (12*s) + "px ui-monospace,Menlo,monospace";
  x.fillText("SPYDER-CAM 01 · " + new Date().toLocaleTimeString("de-DE") + " · ZOOM " + zoom.toFixed(1) + "x · Nr. " + String(++photos).padStart(3,"0"), 24*s, h - 24*s);
  photoList.push({url:c.toDataURL("image/jpeg", .88), n:photos}); while (photoList.length > 30) photoList.shift(); photoPile();
  $("hFoto").textContent = photos; $("fpN").textContent = photos; shot = false;
}
function setFP(on) {
  if (mode === "melee" || mode === "menu" || mode === "act") return;
  if (!on && fp) { _t1.copy(hd).applyQuaternion(_q1.copy(frameQ).invert()); camYaw = Math.atan2(-_t1.x, -_t1.z); }   // Kamera hinter die Spinne
  if (on) { fpPitch = 0; fpYaw = 0; }
  fp = on; $("fp").style.display = on ? "block" : "none"; $("hud").style.display = on ? "none" : "block"; $("prompt").style.display = "none";
  document.body.classList.toggle("fpv", on); $("camBtn").classList.toggle("on", on);
  camera.fov = on ? 72/zoom : opt.fov; camera.updateProjectionMatrix();
}
let lastFov = 60, cmbB = 0, cmbT = 0, cmbY; const _gq0 = new THREE.Vector3();
let camHitD, camLift = 0, camTilt = 0, camGB = 0; const _t5 = V3(), _t6 = V3(), _t7 = V3(), _t8 = V3();
function updateCamera() {
  if (fp) {
    const cp = Math.cos(fpPitch), sp = Math.sin(fpPitch), sy = Math.sin(fpYaw), cy = Math.cos(fpYaw);        // fest am Körper, Kopf neigen/drehen (±40°)
    _t1.set(0,.12,1.2); spider.localToWorld(_t1); _t2.set(sy*cp, sp, cy*cp).applyQuaternion(spider.quaternion);
    camera.up.set(-sy*sp, cp, -cy*sp).applyQuaternion(spider.quaternion); camera.position.copy(_t1); camera.lookAt(_t1.x + _t2.x, _t1.y + _t2.y, _t1.z + _t2.z);
  } else {
    const PMIN = .03, pe = camPitch + (Math.max(camPitch, PMIN) - camPitch)*camGB, s = Math.sin(camYaw), c = Math.cos(camYaw), cp = Math.cos(pe);   // unterhalb von PMIN bleibt die Kamera am Boden und neigt sich stattdessen nach oben
    camTilt += (camGB*Math.max(0, PMIN - camPitch) - camTilt)*(1 - Math.exp(-clamp(clockT - cmbT, 0, .1)*14));
    _t2.set(s*cp, Math.sin(pe), c*cp).applyQuaternion(frameQ).normalize(); _t1.copy(pos).addScaledVector(nS, .1*SC);
    const dtc = clamp(clockT - cmbT, 0, .1);
    /* Kamera-Kollision: mehrere Strahlen (Mitte + seitlich/oben/unten, damit die Near-Plane nie durch Flächen schneidet), Abstand nie unter die Wand,
       nach innen sofort, nach außen weich; zusätzlich nie unter die Lauffläche und nie in einem Block. */
    _t3.crossVectors(_t2, nS); if (_t3.lengthSq() < 1e-6) _t3.set(1, 0, 0); _t3.normalize().multiplyScalar(.14); _t4.crossVectors(_t3, _t2).normalize().multiplyScalar(.12);
    // Treffer auf der Lauffläche (Normale zeigt wie nS) verkürzen den Abstand NICHT – dafür wird die Kamera unten angehoben (siehe unten)
    const hitT = (o) => { const r = rayBox(o, _t2); return r.n && r.n.dot(nS) > .8 ? 1e9 : r.t; };
    let tmin = hitT(_t1); for (const [a, b] of [[1,0],[-1,0],[0,1],[0,-1]]) { _t5.copy(_t1).addScaledVector(_t3, a).addScaledVector(_t4, b); const tt = hitT(_t5); if (tt < tmin) tmin = tt; }
    const want = Math.min(camDist*(.35 + .65*SC), Math.max(tmin - .22, .12));
    camHitD = camHitD === undefined || want < camHitD ? want : camHitD + (want - camHitD)*(1 - Math.exp(-dtc*7)); const dist = camHitD;
    camera.up.set(0,1,0).applyQuaternion(frameQ); camera.position.copy(_t1).addScaledVector(_t2, dist);
    { // Bodenfreiheit: Strahl von der Kamera (leicht darüber) entlang -nS zur darunterliegenden Fläche; Kamera gleitet darüber statt an die Spinne heranzurücken
      _t5.copy(camera.position).addScaledVector(nS, .6); groundPoint(_t5, nS, _t6); const clear = _t5.distanceTo(_t6) - .6, need = Math.max(0, .14 - clear), hs = _t4.copy(camera.position).sub(pos).dot(nS);
      { // liegt unter der Kamera (bei Blick knapp über dem Horizont) wirklich Boden? Unabhängig von der aktuellen Neigung, damit nichts hin- und herspringt
        const cq = Math.cos(PMIN); _t7.set(s*cq, Math.sin(PMIN), c*cq).applyQuaternion(frameQ).multiplyScalar(dist).add(_t1).addScaledVector(nS, .6); groundPoint(_t7, nS, _t8);
        const hit = _t7.distanceTo(_t8) - .6 < .3 ? 1 : 0; camGB += (hit - camGB)*(1 - Math.exp(-dtc*(hit ? 25 : 5))); }
      const tl = Math.max(need, camGB > .5 && hs < .1 ? .1 - hs : 0); camLift = tl > camLift ? tl : camLift + (tl - camLift)*(1 - Math.exp(-dtc*8)); camera.position.addScaledVector(nS, camLift); }
    pushOutBlocks(camera.position);
    cmbT = clockT; const on = false;
    cmbB += ((on ? 1 : 0) - cmbB)*(1 - Math.exp(-dtc*3.2));
    if (cmbB > .005) {                                         // Kampfkamera: seitlich, beide Kämpfer im Bild, näher bei Treffern
      const mx = (pos.x + TP.x)/2, mz = (pos.z + TP.z)/2, sep = Math.hypot(TP.x - pos.x, TP.z - pos.z), la = Math.atan2(TP.x - pos.x, TP.z - pos.z);
      let ty = la + Math.PI/2, ty2 = la - Math.PI/2, df = a => { let q = a - camYaw; while (q > Math.PI) q -= 2*Math.PI; while (q < -Math.PI) q += 2*Math.PI; return q; };
      const want = Math.abs(df(ty)) < Math.abs(df(ty2)) ? ty : ty2; cmbY = cmbY === undefined || cmbB < .02 ? camYaw : cmbY; cmbY += df(want)*(1 - Math.exp(-dtc*2.2));
      const cd = 3.0 + sep*1.0 - story.sk*.3, cpp = .22, ox = Math.sin(cmbY)*Math.cos(cpp), oz = Math.cos(cmbY)*Math.cos(cpp), oy = Math.sin(cpp);
      _t3.set(mx, .72 + (mel.kind === 6 ? .35 : 0), mz); _t4.set(ox, oy, oz); const rr = rayBox(_t3, _t4); const dd = Math.min(cd, Math.max(rr.t - .2, .8));
      const k = cmbB*cmbB*(3 - 2*cmbB); _t2.copy(_t3).addScaledVector(_t4, dd); camera.position.lerp(_t2, k); camera.up.lerp(_gq0.set(0,1,0), k);
      _t1.lerp(_t3, k);
    }
    camera.lookAt(_t1); if (camTilt > 1e-3) camera.rotateX(camTilt);
  }
  const fov = fp ? 72/zoom : opt.fov; if (Math.abs(fov - lastFov) > .01) { lastFov = fov; camera.fov = fov; camera.updateProjectionMatrix(); }
}
