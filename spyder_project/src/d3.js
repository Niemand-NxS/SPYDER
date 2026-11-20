
/* ======================= Eingabe ======================= */
function interactInfo() {
  if (mode !== "surf" || hack.state || mel.state) return null;
  { const c2 = ch2Interact(); if (c2) return c2; }
  if (story.lvl === 3) return shaftInteract();
  const ni = nearTerminal();
  if (ni >= 0 && !terms[ni].hacked) return {label:"Konsole hacken · " + terms[ni].name, act:() => startHack()};
  if (story.lvl === 2 && !vent.broken && nB.x < -.7 && pos.y > 1.2 && Math.hypot(pos.z - VC.z, pos.y - 2.4) < 1.5) return {label:"Lüftungsgitter aufbrechen", act:() => startVentAct()};
  if (story.lvl === 1) {
    if (nB.y > .7 && Math.hypot(pos.x + W, pos.z - 1.6) < 1.7) return {label:"Schleuse – versiegelt", disabled:true};
  }
  return null;
}
function doInteract() { const o = interactInfo(); if (o && !o.disabled) o.act(); }

function press(code) {
  if (mode === "menu" || settingsOpen || pauseOpen) return;
  if (mode === "cut") { if (cutPoke() && (code === "Space" || code === "Enter")) skipCut(); return; }
  if (invOpen) { invKey(code); return; } if (comOpen) { comKey(code); return; } if (code === "KeyI" && (gear.pack || comAvail())) { if (gear.pack) toggleInv(); else toggleCom(); return; } if (code === "KeyJ" && comAvail()) { toggleCom(); return; }
  if (code === "KeyM" && shaft.on) { toggleMap(); return; }
  if (code === "KeyM" && gear.map) { toggleCMap(); return; }
  if (code === "KeyC" || code === "ArrowDown") { if (mode === "surf" && !hack.state) { if (nB.y < -.6) startRope(); else crouch = !crouch; } }
  else if (code === "Space") { jumpBufT = clockT; if (mode === "rope") endRope(); }
  else if (code === "KeyV") setFP(!fp);
  else if (code === "KeyH") toggleHit();
  else if (code === "KeyT") { torchMode = (torchMode + 1)%3; toast(["Taschenlampe: automatisch", "Taschenlampe: aus", "Taschenlampe: an"][torchMode]); }
  else if (code === "KeyE") doInteract();
  else if (code === "KeyG") startMelee();
  else if (code === "Enter") takePhoto();
}
addEventListener("keydown", e => {
  if (e.code === "Escape") { if (invOpen) { toggleInv(); return; } if (comOpen) { toggleCom(); return; } if (settingsOpen) closeSettings(); else if (pauseOpen) closePause(); else if (mode === "menu") { /* nichts */ } else openPause(); return; }
  if (settingsOpen || pauseOpen || mode === "menu") return;
  if (mode === "cut") { if (cutPoke() && (e.code === "Space" || e.code === "Enter")) skipCut(); if (e.code === "Space" || e.code === "Enter") e.preventDefault(); return; }
  const kc = kmap(e.code); if (kc === "None") return;
  keys[kc] = true; if (!e.repeat) press(kc); if (["Space","ArrowUp","ArrowDown","Enter"].includes(kc) || ["Space","ArrowUp","ArrowDown","Enter"].includes(e.code)) e.preventDefault(); initAudio(); });
addEventListener("keyup", e => { keys[kmap(e.code)] = false; keys[e.code] = false; });
addEventListener("blur", () => { for (const k in keys) keys[k] = false; });
const cvs = renderer.domElement, startEl = $("start");
$("camBtn").addEventListener("click", () => press("KeyV")); $("mapBtn").addEventListener("click", () => press("KeyM"));
function lock() { if (!opt.lockP) return; try { pq(cvs.requestPointerLock()); } catch (e) {} try { const de = document.documentElement; if (!document.fullscreenElement && de.requestFullscreen) pq(de.requestFullscreen()); } catch (e) {} }
$("startBtn").addEventListener("click", () => { if ([1, 2, 3].some(n => readSave(n))) openSlots("load"); else { slot = 1; try { localStorage.setItem("spyderSlot", 1); } catch (e) {} startGame(true); } }); $("slots").addEventListener("click", e => { if (e.target === $("slots")) closeSlots(); }); $("slotX").addEventListener("click", closeSlots);
$("startNew").addEventListener("click", () => openSlots("new"));
$("skip").addEventListener("click", () => skipCut()); $("endBtn").addEventListener("click", () => location.reload());
$("startSet").addEventListener("click", () => openSettings());
applyLang();
$("interact").addEventListener("click", () => doInteract());
$("interact").addEventListener("touchstart", e => { e.preventDefault(); doInteract(); }, {passive:false});
cvs.addEventListener("contextmenu", e => e.preventDefault());
let dragging = false;
cvs.addEventListener("mousedown", e => {
  if (mode === "cut" && !settingsOpen && !pauseOpen) cutPoke();
  if (mode === "menu" || settingsOpen || pauseOpen || mode === "cut") return;
  initAudio(); if (e.button === 2) keys.Mouse2 = true;
  else if (e.button === 0) { if (document.pointerLockElement) { if (fp) takePhoto(); else startMelee(); } else { if (!fp && clickEnemy(e)) return; dragging = true; lock(); } }
});
const _rc = new THREE.Raycaster(), _nd = new THREE.Vector2();
function clickEnemy(e) {
  const r = cvs.getBoundingClientRect(); _nd.set((e.clientX - r.left)/r.width*2 - 1, -((e.clientY - r.top)/r.height)*2 + 1); _rc.setFromCamera(_nd, camera);
  const objs = []; for (const b of hz.bots) if (!b.dead) objs.push(b.R.g); if (mann.visible) objs.push(mann);
  if (!objs.length || _rc.intersectObjects(objs, true).length === 0) return false; startMelee(); return true;
}
cvs.addEventListener("pointerdown", e => { if (e.pointerType === "touch" && mode === "surf" && !paused && !fp) clickEnemy(e); });
addEventListener("mouseup", e => { dragging = false; if (e.button === 2) keys.Mouse2 = false; });
function look(dx, dy) {
  if (settingsOpen || pauseOpen || mode === "menu" || mode === "cut") return;
  dx *= opt.sens; dy *= opt.sens*(opt.inv ? -1 : 1);
  if (opt.camSm > 0) { lookP.x += dx; lookP.y += dy; return; } lookApply(dx, dy); }
const lookP = {x:0, y:0};
function lookTick(dt) { if (!lookP.x && !lookP.y) return; const k = opt.camSm > 0 ? 1 - Math.exp(-dt*(34 - 27*opt.camSm)) : 1, ax = lookP.x*k, ay = lookP.y*k; lookP.x -= ax; lookP.y -= ay; if (Math.abs(lookP.x) + Math.abs(lookP.y) < 1e-5) lookP.x = lookP.y = 0; lookApply(ax, ay); }
function lookApply(dx, dy) {
  if (fp) { fpPitch = clamp(fpPitch - dy, -.9, .9); fpYaw = clamp(fpYaw - dx, -.698, .698); } else { camYaw -= dx; camPitch = clamp(camPitch + dy, -1.25, 1.35); }
}
addEventListener("mousemove", e => { if (document.pointerLockElement || dragging) look(e.movementX*.0035, e.movementY*.0035); });
addEventListener("wheel", e => { if (fp) zoom = clamp(zoom - e.deltaY*.002, 1, 4); else camDist = clamp(camDist + e.deltaY*.002, 1.0, 7); $("fpZ").textContent = zoom.toFixed(1); });
addEventListener("resize", () => { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix(); });

if (matchMedia("(pointer:coarse)").matches || "ontouchstart" in window) {
  document.body.classList.add("touch");
  $("camBtn").addEventListener("touchstart", e => { e.preventDefault(); press("KeyV"); }, {passive:false});
  $("startSmall").textContent = "Joystick links · Blick rechts ziehen";
  const joyEl = $("joy"), knob = $("knob");
  const joyMove = t => { const r = joyEl.getBoundingClientRect(), R = r.width/2; let dx = t.clientX - (r.left+R), dy = t.clientY - (r.top+R); const l = Math.hypot(dx, dy);
    if (l > R) { dx *= R/l; dy *= R/l; } knob.style.transform = `translate(${dx}px,${dy}px)`; joy.x = dx/R; joy.y = -dy/R; if (Math.hypot(joy.x, joy.y) < opt.joyDz) joy.x = joy.y = 0; };
  joyEl.addEventListener("touchstart", e => { e.preventDefault(); initAudio(); const t = e.changedTouches[0]; joy.id = t.identifier; joyMove(t); }, {passive:false});
  joyEl.addEventListener("touchmove", e => { e.preventDefault(); for (const t of e.changedTouches) if (t.identifier === joy.id) joyMove(t); }, {passive:false});
  const joyEnd = e => { for (const t of e.changedTouches) if (t.identifier === joy.id) { joy.id = null; joy.x = joy.y = 0; knob.style.transform = ""; joyEl.classList.remove("act"); } };
  joyEl.addEventListener("touchend", joyEnd); joyEl.addEventListener("touchcancel", joyEnd); cvs.addEventListener("touchend", joyEnd); cvs.addEventListener("touchcancel", joyEnd);
  document.querySelectorAll(".tb").forEach(b => {
    const code = b.dataset.key;
    b.addEventListener("touchstart", e => { e.preventDefault(); initAudio(); keys[code] = true; press(code); b.classList.add("on"); }, {passive:false});
    const up = () => { keys[code] = false; b.classList.remove("on"); };
    b.addEventListener("touchend", up); b.addEventListener("touchcancel", up);
  });
  const camT = {id:null, x:0, y:0}; let pinch = 0; const pd = (a, b) => Math.hypot(a.clientX-b.clientX, a.clientY-b.clientY);
  cvs.addEventListener("touchstart", e => { e.preventDefault(); initAudio(); if (mode === "cut") cutPoke();
    for (const t of e.changedTouches) {
      if (opt.joyF && joy.id === null && t.clientX < innerWidth/2) { const r = joyEl.getBoundingClientRect(), R = r.width/2; joyEl.style.left = clamp(t.clientX - R, 4, innerWidth - 2*R - 4) + "px"; joyEl.style.top = clamp(t.clientY - R, 4, innerHeight - 2*R - 4) + "px"; joyEl.classList.add("act"); joy.id = t.identifier; joyMove(t); continue; }
      if (camT.id === null) { camT.id = t.identifier; camT.x = t.clientX; camT.y = t.clientY; } }
    { const tt = [...e.targetTouches].filter(t => t.identifier !== joy.id); if (tt.length === 2) pinch = pd(tt[0], tt[1]); } }, {passive:false});
  cvs.addEventListener("touchmove", e => { e.preventDefault();
    for (const t of e.changedTouches) if (t.identifier === joy.id && opt.joyF) joyMove(t);
    { const tt = [...e.targetTouches].filter(t => t.identifier !== joy.id);       // Pinch-Zoom nur mit zwei Blick-Fingern, der Joystick-Finger zählt nie mit
      if (tt.length === 2 && camT.id !== null && tt.some(t => t.identifier === camT.id) === false) { const d = pd(tt[0], tt[1]); if (pinch) { if (fp) zoom = clamp(zoom + (d - pinch)*.01, 1, 4); else camDist = clamp(camDist - (d - pinch)*.008, 1.0, 7); } pinch = d; return; }
      if (tt.length === 2) { const d = pd(tt[0], tt[1]); if (pinch) { if (fp) zoom = clamp(zoom + (d - pinch)*.01, 1, 4); else camDist = clamp(camDist - (d - pinch)*.008, 1.0, 7); } pinch = d; return; } }
    for (const t of e.changedTouches) if (t.identifier === camT.id) { look((t.clientX - camT.x)*.006, (t.clientY - camT.y)*.006); camT.x = t.clientX; camT.y = t.clientY; } }, {passive:false});
  const camEnd = e => { for (const t of e.changedTouches) if (t.identifier === camT.id) camT.id = null; if ([...e.targetTouches].filter(t => t.identifier !== joy.id).length < 2) pinch = 0; };
  cvs.addEventListener("touchend", camEnd); cvs.addEventListener("touchcancel", camEnd);
}

/* ======================= Taschenlampe am Kopf ======================= */
let torchMode = 0;      // 0 automatisch (nur im Dunkeln), 1 aus, 2 an
const torch = new THREE.SpotLight(0xfff1dc, 0, 15, .5, .65, 1.2); torch.position.set(0, .06, 1.3); torch.target.position.set(0, -.1, 6);
torch.castShadow = true; torch.shadow.mapSize.set(512, 512); torch.shadow.camera.near = .05; torch.shadow.camera.far = 15; torch.shadow.bias = -.002;
headG.add(torch, torch.target);
function isDark() { if (xs.on) return xs.dark; if (alley.on) return !alley.inBar; if (shaft.on) return true; return story.lampBase*(1 - .4*story.emer) < .3; }
function torchTick(dt) {
  const live = mode === "surf" || mode === "air" || mode === "melee" || mode === "rope" || mode === "act" || (mode === "cut" && shaft.on);
  const want = live && (torchMode === 2 || (torchMode === 0 && isDark())) ? 3.4 : 0;
  torch.intensity += (want - torch.intensity)*Math.min(1, dt*9); if (want === 0 && torch.intensity < .03) torch.intensity = 0;
  const tv = torch.intensity > 0 || want > 0; if (torch.visible !== tv) torch.visible = tv;      // aus = kein Schatten-Rendering
  const lo = alley.on || shaft.on || xs.on; if (lamp.visible === lo) lamp.visible = !lo;                  // kein Licht mehr über dem Körper
}

/* ======================= Körper auf den Beinen: Federung / Trägheit ======================= */
const body = {o:V3(), v:V3(), tp:0, tr:0, vp:0, vr:0, lo:V3(), lq:new THREE.Quaternion(), has:false, pv:V3(), pLand:0, pMode:"surf"};
const _ba = V3(), _bq = new THREE.Quaternion(), _be = new THREE.Euler(), _bi = new THREE.Quaternion(), BMAX = S*.23;
function bodyUndo() { if (!body.has) return; pos.sub(body.lo); spider.quaternion.copy(body.lq); body.has = false; }
function bodyApply(dt) {
  if (dt <= 0) return; const live = mode === "surf" || mode === "air", w = 11, z = .4, k = w*w, c = 2*z*w;
  if (!live) { body.o.multiplyScalar(.8); body.v.set(0,0,0); body.tp *= .8; body.tr *= .8; body.vp = body.vr = 0; body.pv.copy(vel); }
  else {
    let la = 0, lb = 0; _ba.set(0,0,0);
    if (mode === "surf") { _ba.copy(vel).sub(body.pv).divideScalar(Math.max(dt, 1e-3)); const m = _ba.length(); if (m > 14) _ba.multiplyScalar(14/m); }
    _bi.copy(spider.quaternion).invert(); _t1.copy(_ba).applyQuaternion(_bi); la = _t1.x; lb = _t1.z;
    if (body.pMode === "air" && mode === "surf") body.v.addScaledVector(nB, -Math.min(.7, landDip*S*9));
    body.pMode = mode; body.pv.copy(vel);
    const tpT = -clamp(lb*.012, -.12, .12) + .004*Math.sin(clockT*1.3), trT = clamp(la*.012, -.12, .12) + .003*Math.sin(clockT*1.7 + 1);
    const n = 2, h = dt/n;
    for (let i = 0; i < n; i++) {
      body.v.addScaledVector(body.o, -k*h).addScaledVector(body.v, -c*h).addScaledVector(_ba, -.5*h); body.o.addScaledVector(body.v, h);
      body.vp += (k*(tpT - body.tp) - c*body.vp)*h; body.tp += body.vp*h; body.vr += (k*(trT - body.tr) - c*body.vr)*h; body.tr += body.vr*h;
    }
    const m = body.o.length(); if (m > BMAX) body.o.multiplyScalar(BMAX/m);
    const nn = body.o.dot(nB); if (nn < -S*.09) body.o.addScaledVector(nB, -S*.09 - nn);
  }
  if (body.o.lengthSq() < 1e-9 && Math.abs(body.tp) + Math.abs(body.tr) < 1e-4) return;
  body.lo.copy(body.o); pos.add(body.o); body.lq.copy(spider.quaternion);
  spider.quaternion.multiply(_bq.setFromEuler(_be.set(body.tp, 0, body.tr, "XYZ"))); spider.updateMatrixWorld(true); body.has = true;
}

/* ======================= Hauptschleife ======================= */
const clock = new THREE.Clock(); let frame = 0;

/* ======================= Schatten-System ======================= */
// Alle Objekte werfen/empfangen Schatten; die nächsten Lampen bekommen Schatten-Spotlights genau an ihrem Modell.
const SP_K = 4, spk = () => opt.real ? 4 : 2, spool = [], shCand = [], SHEX = new Set([lamp, fill, alarmL, sparkL, torch]), _sw = V3(), _sc = V3();
for (let i = 0; i < SP_K; i++) { const l = new THREE.SpotLight(0xffd8a8, 0, 12, 1.3, .8, 1.4); l.castShadow = true; l.shadow.mapSize.set(1024, 1024); l.shadow.camera.near = .12; l.shadow.camera.far = 14; l.shadow.bias = -.0008; l.shadow.normalBias = .012; l.visible = false; l.userData.k = 0; l.userData.cur = null; scene.add(l, l.target); spool.push(l); SHEX.add(l); }
torch.shadow.mapSize.set(1024, 1024); torch.shadow.normalBias = .006;
let shT = 0, shOn = false;
function visChain(o) { for (; o; o = o.parent) if (!o.visible) return false; return true; }
function shadowify() {
  shCand.length = 0;
  scene.traverse(o => {
    if (o.isPointLight) { if (!SHEX.has(o) && o.distance > 0 && visChain(o)) { o.updateWorldMatrix(true, false); o.getWorldPosition(_sw); if (_sw.y > 1.0) shCand.push(o); } return; }
    if (!o.isMesh || o.userData.sh) return; o.userData.sh = 1;
    const m = Array.isArray(o.material) ? o.material[0] : o.material; if (!m || o.userData.noSh) return;
    if (m.isMeshBasicMaterial || m.side === THREE.BackSide || (m.transparent && m.opacity < .85)) return;
    o.receiveShadow = true; if (o.geometry.type !== "PlaneGeometry") o.castShadow = true;
  });
}
function releaseL(L) { const u = L.userData; if (u.dl !== undefined) { if (Math.abs(L.intensity - u.dl) < 1e-5) L.intensity = u.b; u.dl = undefined; } }
function shadowTick(dt) {
  const want = opt.shadows && (xs.on || alley.on);
  if (torch.castShadow !== !!opt.shadows) torch.castShadow = !!opt.shadows;
  if (want !== shOn) { shOn = want; for (const l of spool) { l.visible = want && spool.indexOf(l) < spk(); if (!want) { releaseL(l.userData.cur || l); l.userData.cur = null; l.userData.k = 0; l.intensity = 0; } } }
  for (let i = 0; i < spool.length; i++) { const v = shOn && i < spk(); if (spool[i].visible !== v) spool[i].visible = v; }
  shT -= dt; if (shT <= 0) { shT = .4; shadowify(); }
  if (!shOn) return;
  camera.getWorldPosition(_sc);
  const sc = shCand.filter(L => L.parent && (L.intensity > .15 || L.userData.dl !== undefined)).map(L => { L.getWorldPosition(_sw); return {L, d:_sw.distanceTo(_sc)*(L.userData.cur ? .8 : 1)}; }).sort((a, b) => a.d - b.d).slice(0, spk()).map(o => o.L);
  for (let i = spk(); i < spool.length; i++) { const p = spool[i]; if (p.userData.cur) { releaseL(p.userData.cur); p.userData.cur = null; } p.userData.k = 0; p.intensity = 0; }
  for (let i = 0; i < spool.length; i++) { const p = spool[i], u = p.userData; if (i >= spk()) continue; if (u.cur && (!u.cur.parent || !visChain(u.cur))) { u.cur = null; u.k = 0; }
    const keep = u.cur && sc.includes(u.cur); u.k += ((keep ? 1 : 0) - u.k)*(1 - Math.exp(-dt*5));
    if (u.cur && !keep && u.k < .03) { releaseL(u.cur); u.cur = null; u.k = 0; }
    if (!u.cur) { const nx = sc.find(L => !spool.some(q => q.userData.cur === L)); if (nx) u.cur = nx; } }
  for (let i = 0; i < spk(); i++) { const p = spool[i], u = p.userData, L = u.cur; if (!L) { p.intensity = 0; continue; }
    L.getWorldPosition(_sw); p.position.copy(_sw); { const ai = L.userData.aim || [0, -1, 0]; p.target.position.set(_sw.x + ai[0], _sw.y + ai[1], _sw.z + ai[2]); } p.target.updateMatrixWorld();
    p.color.copy(L.color); p.distance = L.distance*1.1; p.decay = L.decay;
    const lu = L.userData; const b = (lu.dl !== undefined && Math.abs(L.intensity - lu.dl) < 1e-5) ? lu.b : L.intensity; lu.b = b; const ni = b*(1 - .5*u.k); lu.dl = ni; L.intensity = ni;
    p.intensity = b*1.1*u.k; }
}
let capT = 0;
function loop() {
  requestAnimationFrame(loop);
  if (opt.cap) { const n_ = performance.now(); if (n_ - capT < 31) return; capT = n_; }
  lookTick(Math.min(.05, (performance.now() - (loop.lt || performance.now()))/1000)); loop.lt = performance.now();
  if (gameStarted && !paused && !settingsOpen && !pauseOpen) playT += Math.min(.1, (performance.now() - (loop.ps || performance.now()))/1000); loop.ps = performance.now();
  padTick(Math.min(.05, (performance.now() - (loop.pt || performance.now()))/1000)); loop.pt = performance.now();
  if (paused) { clock.getDelta(); if (invOpen) { try { ivCam(Math.min(.1, (performance.now() - (loop.ic || performance.now()))/1000)); loop.ic = performance.now(); } catch (e) {} renderer.render(scene, camera); return; } renderFinal(.016); return; }
  const raw = Math.min(clock.getDelta(), .25)*(dev.ts || 1), nSub = Math.max(1, Math.ceil(raw/(1/30) - 1e-6)), dt = raw/nSub*(nSub > 1 ? 1 : 1); clockT += raw;
  const ix = clamp((keys.KeyD?1:0) - (keys.KeyA?1:0) + joy.x + padv.x, -1, 1);
  const iz = clamp(((keys.KeyW||keys.ArrowUp)?1:0) - (keys.KeyS?1:0) + joy.y + padv.y, -1, 1);
  const mag = Math.min(1, Math.hypot(ix, iz));
  bodyUndo();
  for (let sub = 0; sub < nSub; sub++) { if (mode === "menu") stepMenu(dt); else if (mode === "surf") { stepSurf(dt, ix, iz, mag); updateHack(dt); updateMelee(dt); } else if (mode === "air") stepAir(dt); else if (mode === "melee") stepMelee(dt); else if (mode === "act") stepAct(dt); else if (mode === "cut") stepCut(dt); else stepRope(dt, ix, iz); updateDebris(dt); storyTick(dt); dmgTick(dt); shaftTick(dt); alleyTick(dt); ch2Tick(dt); }
  bodyApply(dt);
  doorT += (doorOpen - doorT)*(1 - Math.exp(-dt*3)); doorG.position.z = 1.6 + 1.05*doorT;
  for (const l of legs) { _a.copy(l.foot); spider.worldToLocal(_a); solveLeg(l, _a); }
  legCheck();
  try { gadTick(); } catch (e) {}
  if (mode === "menu") menuCamera(); else if (mode === "cut") cutCamera(dt); else updateCamera();
  torchTick(dt); shadowTick(dt); fxTick(dt); sndTick(dt); applyShake();
  camera.updateMatrixWorld(true); updateAttack(dt); updateMann(dt);
  headAnim(dt, mode === "cut" ? 0 : mode === "menu" ? 1 : (mode === "surf" && !fp && speed < .1 && !hack.state && !mel.state ? .45 : 0));
  if (master) master.gain.value = .5*opt.vol;

  if (ac && servoG) {
    const act = legs.filter(l => l.stepping).length/8*clamp(.3 + speed/(2.5*S), 0, 1.4);
    servoG.gain.setTargetAtTime(.02*act + .03*jump.charge, ac.currentTime, .05);
    servoO.frequency.setTargetAtTime(70 + act*70 + jump.charge*140, ac.currentTime, .08);
  }
  $("pwr").style.opacity = jump.charge > 0 ? 1 : 0; $("pwrFill").style.width = (jump.charge*100) + "%";
  if ((frame++ & 7) === 0) {
    $("hSpeed").textContent = (speed/S).toFixed(1);
    $("hMode").textContent = T(mode === "rope" ? "Seil" : mode === "air" ? "Luft" : nB.y > .7 ? "Boden" : nB.y < -.7 ? "Decke" : "Wand");
    let msg = ""; const pr = $("prompt");
    if (mode === "rope") msg = "↓ = Seil ab · W = hoch · A/D = schwingen · Leertaste = lösen";
    else if (mode === "surf") {
      if (hack.state) msg = hack.state === 1 ? "Terminal wird angesteuert …" : "Hacke System … " + Math.floor(clamp(hack.t/5, 0, 1)*100) + "%";
      else if (nB.y < -.6) msg = "↓ – Abseilen (Seil von der Decke)";
    }
    const io = interactInfo(), ie = $("interact");
    if (io) { ie.innerHTML = '<span class="k">E</span>' + T(io.label); ie.classList.toggle("dis", !!io.disabled); ie.classList.add("show"); } else ie.classList.remove("show");
    pr.textContent = T(msg); pr.style.display = (msg && !fp) ? "block" : "none";
    if (fp) { const s = Math.floor(clockT); $("fpT").textContent = [s/3600|0, (s/60|0)%60, s%60].map(v => String(v).padStart(2,"0")).join(":"); $("fpZ").textContent = zoom.toFixed(1); }
  }
  try { arTick(dt); } catch (e) { if (!arTick.er) { arTick.er = 1; console.error("ar", e); } }
  reflTick(dt);
  renderFinal(dt);
  if (shot) savePhoto();
}
for (const ev of ["pointerdown", "keydown", "touchstart"]) addEventListener(ev, () => initAudio(), {passive:true});
applyOpt(); reset(); setFP(false); updateCamera(); enterMenu(); loop();
})();
</script>
</body>
</html>
