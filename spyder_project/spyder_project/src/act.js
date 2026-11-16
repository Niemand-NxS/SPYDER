
/* ======================= Skript-Aktionen: Lüftungsgitter aufbrechen, Tür öffnen ======================= */
const OR = 0xe0701e, mOr = mStd(OR, .5, .45);
const VC = V3(W, 2.75, -2.0), vent = {broken:false};
const ventG = new THREE.Group(); ventG.position.set(W-.045, VC.y, VC.z); scene.add(ventG);
box(.03,.7,.9,mStd(0x2a3550,.5,.55),0,0,0,ventG);
for (let i = 0; i < 7; i++) box(.03,.05,.82,mStd(0x3a4a70,.4,.6),-.02,-.27+i*.09,0,ventG);
const ventF = new THREE.Group(); scene.add(ventF);
box(.05,.06,1.0,mOr,W-.035,VC.y+.38,VC.z,ventF); box(.05,.06,1.0,mOr,W-.035,VC.y-.38,VC.z,ventF);
box(.05,.76,.06,mOr,W-.035,VC.y,VC.z+.5,ventF); box(.05,.76,.06,mOr,W-.035,VC.y,VC.z-.5,ventF);
const hole = new THREE.Mesh(new THREE.PlaneGeometry(.9,.7), new THREE.MeshBasicMaterial({color:0x030612})); hole.position.set(W-.012,VC.y,VC.z); hole.rotation.y = -Math.PI/2; scene.add(hole);

const deb = {on:false, rest:false, v:V3(), w:V3(), b:0};
function clang(v) { beep(310,.35,0,.07*v); beep(497,.28,0,.05*v); beep(823,.2,.01,.04*v); }
function popGrille() {
  vent.broken = true; deb.on = true; deb.b = 0; deb.v.set(-2.4, 1.5, (Math.random()-.5)*1.2); deb.w.set(Math.random()*4-2, Math.random()*3-1.5, Math.random()*5-2.5);
  whoosh(); clang(1); thud(6);
}
function updateDebris(dt) {
  if (!deb.on || deb.rest || dt <= 0) return;
  deb.v.y -= 9.8*dt; ventG.position.addScaledVector(deb.v, dt);
  ventG.rotation.x += deb.w.x*dt; ventG.rotation.y += deb.w.y*dt; ventG.rotation.z += deb.w.z*dt;
  if (ventG.position.y < .09) {
    ventG.position.y = .09; deb.b++;
    if (deb.b < 3 && deb.v.y < -1) { deb.v.y *= -.32; deb.v.x *= .55; deb.v.z *= .55; deb.w.multiplyScalar(.5); clang(.5/deb.b); }
    else { deb.rest = true; ventG.rotation.set(0, ventG.rotation.y, Math.PI/2); ventG.position.y = .035; clang(.25); }
  }
}

const A = {t:0, dur:1, se:.2, p0:V3(), h0:V3(), n0:V3(), tp:V3(), th:V3(), tn:V3(), P:V3(), Hh:V3(), N:V3(), run:null, f:0, ph:-1};
function startAct(dur, tp, th, tn, se, run) {
  if (fp) setFP(false);
  mode = "act"; A.t = 0; A.dur = dur; A.se = se; A.f = 0; A.ph = -1; A.run = run;
  A.p0.copy(pos); A.h0.copy(hd); A.n0.copy(nS); A.tp.copy(tp); A.th.copy(th); A.tn.copy(tn);
  for (const l of legs) { l.type = true; l.stepping = false; l.land = false; }
  vel.set(0,0,0); speed = 0; yawRate = 0; jump.charge = 0; jump.held = false; crouch = false;
}
function stepAct(dt) {
  A.t += dt; const u = clamp(A.t/A.dur, 0, 1), e = ease(sgm(u, 0, A.se));
  A.P.lerpVectors(A.p0, A.tp, e); A.Hh.copy(A.h0).lerp(A.th, e); if (A.Hh.lengthSq() < 1e-4) A.Hh.copy(A.th); A.Hh.normalize(); A.N.copy(A.n0).lerp(A.tn, e).normalize();
  updateFrame(dt, 4, A.tn); A.run(u, dt, e);
  if (A.t >= A.dur && mode === "act") { mode = "surf"; poseSet(A.tp, A.th, A.tn); nB.copy(A.tn); vel.set(0,0,0); speed = 0; landLegs(A.tn); }
}
function plant(rowMin, n, k) {
  for (const l of legs) if (l.row >= rowMin) { _fq.copy(l.restLocal); spider.localToWorld(_fq); groundPoint(_fq, n, _a0); l.foot.lerp(_a0, k); }
}
const mix = (a, b, t) => a + (b - a)*t;

/* --- Lüftungsgitter: Vorderbeine hebeln, Gitter verbiegt sich, springt ab, fällt scheppernd zu Boden --- */
const _vs = V3(), _vh = V3(0,1,0), _vn = V3(-1,0,0);
function startVentAct() {
  _vs.set(W - HW, 2.25, VC.z); startAct(4.4, _vs, _vh, _vn, .16, ventRun); toast("Gitter wird aufgebrochen …");
}
function ventRun(u, dt, e) {
  const t = A.t, pry = u > .36 && u < .62, pr = sgm(u, .36, .62);
  let kick = u > .62 ? .07*Math.exp(-(u - .62)*18) : 0;
  A.P.addScaledVector(A.tn, kick + (pry ? .005*Math.sin(t*28) : 0)).addScaledVector(A.Hh, -kick*1.6);
  poseSet(A.P, A.Hh, A.N);
  const k = 1 - Math.exp(-dt*16), reach = ease(sgm(u, .14, .32))*(1 - ease(sgm(u, .72, .9)));
  for (const l of legs) {
    if (l.row === 0) {
      const out = pry ? .55*pr*Math.abs(Math.sin(t*9 + (l.side > 0 ? 0 : 1.6))) : 0;
      footL(l, mix(l.side*1.1, l.side*1.45, reach), mix(.4, -HIP_H + .12 + out, reach), mix(1.9, 2.3 + .1*Math.sin(t*9), reach), k);
    }
  }
  plant(1, A.tn, k);
  if (pry) { const ph = Math.floor(t*9/Math.PI); if (ph !== A.ph) { A.ph = ph; beep(110 + Math.random()*90, .14, 0, .05); tick(.08); } }
  if (!vent.broken) {
    ventG.position.x = W - .045 - .02*pr*Math.abs(Math.sin(t*9)); ventG.rotation.z = .05*pr*Math.sin(t*9 + 1); ventG.rotation.y = .04*pr*Math.sin(t*9);
    if (u >= .62) popGrille();
  }
  if (u > .985 && !A.f) { A.f = 1; beep(520,.1); onVentOpen(); }
}

/* --- Tür: Spinne richtet sich auf, drückt den Griff mit den Vorderbeinen, Tür gleitet auf/zu --- */
const _ds = V3(), _dh = V3(-1,0,0), _du = V3(0,1,0), _hz = V3();
function startDoorAct() {
  _ds.set(-W + .5, HW, doorG.position.z - .35); startAct(3.6, _ds, _dh, _du, .3, doorRun);
}
function doorRun(u, dt, e) {
  const t = A.t, r = ease(Math.min(sgm(u, 0, .3), 1 - sgm(u, .86, 1)));
  tilt(A.Hh, .8*r); A.P.y = HW*(1 + 1.6*r); poseSet(A.P, _h, _nn);
  const k = 1 - Math.exp(-dt*16), w = ease(Math.min(sgm(u, .2, .42), 1 - sgm(u, .8, .92)));
  _hz.set(-W + .1, 1.0, doorG.position.z - .35);
  const push = u > .45 && u < .8 ? 1 : 0;
  for (const l of legs) {
    if (l.row === 0) {
      _fq.set(l.side*1.1, 1.7, 1.9); spider.localToWorld(_fq);
      _a0.set(_hz.x, _hz.y + .035*Math.sin(t*14 + l.side)*push, _hz.z + l.side*.1);
      l.foot.lerp(_fq.lerp(_a0, w), k);
    } else if (l.row === 1) footL(l, l.side*1.5, .9, 1.0, k);
  }
  plant(2, _du, k);
  if (!A.f && u > .5) { A.f = 1; doorOpen = doorOpen ? 0 : 1; beep(doorOpen ? 440 : 330, .14); beep(doorOpen ? 660 : 250, .2, .12); toast(doorOpen ? "Tür geöffnet" : "Tür geschlossen"); }
}
