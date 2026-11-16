
/* ======================= Nahkampf (6 Angriffsanimationen, zufällig) ======================= */
const _p = V3(), _h = V3(), _nn = V3(), _hc = V3(), _na = V3(), _ap = V3(), _ld = V3(), _a0 = V3(), _sh = V3(), _sn = V3(), _fq = V3();
const HW = HIP_H*S, ease = u => u*u*(3-2*u), sgm = (u, a, b) => clamp((u-a)/(b-a), 0, 1);
const mel = {gy:0, bot:null, hit:false, hs:0, state:0, kind:0, last:-1, t:0, dur:1, stand:V3(), dir:V3(1,0,0), h0:V3(1,0,0), real:false, wk:1, wl:'', wt:0, aim:0, p0:V3(), hd0:V3(), dist:9, guard:0, cool:0, fl:-1, wh:-1, combo:0, comboT:0, queue:false, miss:false, go:V3(), sneak:false, hits:0};
const TP = V3(), TG = {yaw:0, headY:1.6, vx:0, vz:0}, _ov = V3(), _gw = V3();
function tgUpdate(dt) {
  if (mel.bot) { const g = mel.bot.R.g; if (dt > 0) { TG.vx = (g.position.x - TP.x)/dt; TG.vz = (g.position.z - TP.z)/dt; } TP.set(g.position.x, 0, g.position.z); TG.yaw = g.rotation.y; TG.headY = 1.5; }
  else { TP.set(mann.position.x, 0, mann.position.z); TG.yaw = fig.rotation.y; TG.headY = 1.72; TG.vx = TG.vz = 0; }
}
function openAt(x, z) {
  _ov.set(x, 0, z); clampIn(_ov, .3); if (Math.abs(_ov.x - x) > .01 || Math.abs(_ov.z - z) > .01) return false;
  for (const k of blocks) { if (k.y1 < .15 || k.y0 > 1.5) continue; if (x > k.x0 - .25 && x < k.x1 + .25 && z > k.z0 - .25 && z < k.z1 + .25) return false; } return true;
}
function dmgOver(a) { if (mel.real) mq.health -= a; else if (mel.bot && !mel.bot.dead) botDamage(mel.bot, a*1.6); }
const CMB = document.createElement('div'); CMB.id = 'cmb'; document.body.appendChild(CMB);
{ const st = document.createElement('style'); st.textContent = '#cmb{position:fixed;left:50%;top:30%;transform:translate(-50%,0) scale(.8);z-index:21;padding:8px 22px;border-radius:999px;background:rgba(10,20,44,.42);border:1px solid rgba(255,255,255,.16);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);color:#fff;font:700 15px/1 system-ui,sans-serif;letter-spacing:.2em;opacity:0;pointer-events:none;transition:opacity .25s,transform .25s}#cmb.on{opacity:1;transform:translate(-50%,0) scale(1)}#cmb b{color:#f08a2c;font-size:20px;margin-left:8px}#cmb small{display:block;font-size:10px;letter-spacing:.24em;color:rgba(255,255,255,.55);margin-top:3px;text-align:center;font-weight:600}'; document.head.appendChild(st); }
function cmbShow(lbl) { CMB.innerHTML = T('KOMBO') + '<b>×' + mel.combo + '</b>' + (lbl ? '<small>' + T(lbl) + '</small>' : ''); CMB.classList.add('on'); clearTimeout(cmbShow.h); cmbShow.h = setTimeout(() => CMB.classList.remove('on'), 1500); }

function poseSet(p, h, n) { pos.copy(p); pos.y += mel.gy; nS.copy(n).normalize(); hd.copy(h); orient(); }
function footL(l, x, y, z, k) { _fq.set(x,y,z); spider.localToWorld(_fq); if (k >= 1) l.foot.copy(_fq); else l.foot.lerp(_fq, k); }
function tilt(d, ang) { _h.copy(d).multiplyScalar(Math.cos(ang)).addScaledVector(UP, Math.sin(ang)); _nn.copy(UP).multiplyScalar(Math.cos(ang)).addScaledVector(d, -Math.sin(ang)); }
function hop(a, b, e, arc, out) { out.lerpVectors(a, b, e); out.y += arc*Math.sin(Math.PI*e); return out; }
function whoosh() {
  if (!ac) return; const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain(), f = ac.createBiquadFilter();
  o.type = "sawtooth"; o.frequency.setValueAtTime(520, t); o.frequency.exponentialRampToValueAtTime(140, t+.18); f.type = "bandpass"; f.frequency.value = 700;
  g.gain.setValueAtTime(.05, t); g.gain.exponentialRampToValueAtTime(.0001, t+.2); o.connect(f); f.connect(g); g.connect(fxIn); o.start(t); o.stop(t+.22);
}
function weakFx() { if (mel.wk > 1 && !mel.wt) { mel.wt = 1; toast(mel.wl); beep(1800, .08, 0, .05); clang(.25); } }
function whiff() { if (mel.miss) return; mel.miss = true; beep(240, .12, 0, .04); mel.hs = 0; if (mel.combo) { mel.combo = 0; } toast(T("Verfehlt – Gegner zu weit weg")); }
function strike(dmg, fl) {
  if (mel.state !== 2 || mel.miss || (!mel.real && !(mel.bot && !mel.bot.dead))) return;
  const reach = KINDS[mel.kind].reach || 1.8; if (Math.hypot(TP.x - pos.x, TP.z - pos.z) > reach) { whiff(); return; }
  dmg *= 1 + .12*Math.min(4, mel.combo);
  if (mel.real) {
    if (mq.state) return; weakFx(); mel.hs = .075; mq.health -= dmg*mel.wk; mq.flinch = Math.max(mq.flinch, fl); mq.flash = 1; mq.axis.set(mel.dir.z, 0, -mel.dir.x); thud(5);
    _sh.set(TP.x, 1.2, TP.z); _sn.copy(mel.dir).negate(); emitSparks(_sh, _sn);
  } else botHit(mel.bot, dmg, fl);
  mel.combo++; mel.hits++; story.sk = Math.min(1.2, story.sk + .12 + .22*fl); cmbShow(mel.sneak ? "Überraschungsangriff" : mel.wl);
}
const mannHit = strike;
function botHit(b, dmg, fl) {
  weakFx(); mel.hs = .075; const g = b.R.g; _sh.set(g.position.x, 1.0, g.position.z); _sn.copy(mel.dir).negate(); _t3.copy(_sh);
  botDamage(b, dmg*mel.wk*3.2*(mel.sneak ? 1.6 : 1)); b.stun = Math.max(b.stun || 0, .3 + fl*.55); b.kd = {dx:mel.dir.x, dz:mel.dir.z}; b.kv = 1.6 + fl*3.4; b.lean = .6 + fl*.5;
  emitSparks(_sh, _sn); thud(5); clang(.3); buzz(28);
}
function landLegs(n) { for (const l of legs) { l.from.copy(l.foot); groundPoint(l.foot, n, l.to); l.stepping = true; l.land = true; l.t = 0; l.dur = .14; l.type = false; } }

const idx0 = u => u < .2 || u > .9 ? 0 : Math.sin(Math.PI*(((u - .2)/.7*4) % 1));
const KINDS = [
 { name:"Gesichtssprung", reach:2.3, dur:3.4, stand:1.9, run(u, dt) {           // springt ins Gesicht und krallt sich fest
   const k = 1 - Math.exp(-dt*14), ATT = .12 + HW*.8;
   _hc.set(TP.x, TG.headY, TP.z); _na.copy(mel.dir).negate(); _ap.copy(_hc).addScaledVector(_na, ATT);
   _ld.copy(TP).addScaledVector(mel.dir, -1.4); _ld.y = HW; _a0.copy(mel.p0); _a0.y = HW*.65;
   if (u < .12) { const e = ease(u/.12); _h.copy(mel.hd0).lerp(mel.dir, e); _p.copy(mel.p0); _p.y = HW*(1 - .35*e); poseSet(_p, _h, UP); if (mel.wh < 0 && u > .09) { mel.wh = 0; whoosh(); } }
   else if (u < .30) { const e = ease(sgm(u, .12, .30)); hop(_a0, _ap, e, .45, _p); _nn.copy(UP).lerp(_na, e); _h.copy(mel.dir).lerp(UP, e); poseSet(_p, _h, _nn); airPose(dt, .3 + .6*e); }
   else if (u < .80) {
     if (mel.fl < 0) { mel.fl = 0; mq.flash = 1; mq.axis.set(mel.dir.z, 0, -mel.dir.x); thud(6); }
     _p.copy(_ap).addScaledVector(UP, .004*Math.sin(mel.t*18)); poseSet(_p, UP, _na);
     const C = -ATT/S;
     for (const l of legs) { const dx = l.side, dy = .35, dz = (l.row - 1.5)*.55, n = Math.hypot(dx, dy, dz); footL(l, .46*dx/n, C + .46*dy/n, .46*dz/n, k); }
     dmgOver(dt*.3); mq.shake = 1; mq.flash = Math.max(mq.flash, .35);
   } else {
     const e = ease(sgm(u, .8, 1)); hop(_ap, _ld, e, .5, _p); _nn.copy(_na).lerp(UP, e); _h.copy(UP).lerp(mel.dir, e); poseSet(_p, _h, _nn); airPose(dt, .3 + .6*e);
     if (mel.fl === 0) { mel.fl = 1; whoosh(); }
   }
 }},
 { name:"Klauenhieb", reach:1.15, dur:2.0, stand:.62, run(u, dt) {                // richtet sich auf, vier Hiebe abwechselnd
   const k = 1 - Math.exp(-dt*16), e = ease(Math.min(sgm(u, 0, .2), 1 - sgm(u, .9, 1)));
   tilt(mel.dir, .55*e + mel.aim*e); _p.copy(mel.p0); _p.y = HW*(1 + .3*e); const lunge = idx0(u); _p.addScaledVector(mel.dir, .06*lunge); _nn.applyAxisAngle(mel.dir, .14*lunge*(Math.floor((u - .2)/.7*4) % 2 ? -1 : 1)); poseSet(_p, _h, _nn);
   let idx = -1, psi = 0; if (u >= .2 && u < .9) { const phi = (u - .2)/.7*4; idx = Math.floor(phi); psi = phi - idx; }
   for (const l of legs) {
     if (l.row === 0) {
       const active = idx >= 0 && ((idx % 2 === 0) === (l.side > 0));
       if (active) {
         const wd = .32, st = .56;                                       // Ausholen → schneller Hieb → Rückführung
         let x, y, z; if (psi < wd) { const q = ease(psi/wd); x = l.side*(1.3 + .5*q); y = 1.8 + .6*q; z = 1.7 - .5*q; }
         else if (psi < st) { const q = Math.pow((psi - wd)/(st - wd), 1.6); x = l.side*(1.8 - 2.5*q); y = 2.4 - 2.3*q; z = 1.2 + 1.5*q + .7*Math.sin(Math.PI*q); }
         else { const q = ease((psi - st)/(1 - st)); x = l.side*(-.7 + 2.0*q); y = .1 + 1.7*q; z = 2.7 - 1.0*q; }
         footL(l, x, y, z, k);
         if (psi > wd + .05 && mel.wh !== idx) { mel.wh = idx; whoosh(); }
         if (psi > st - .08 && mel.fl !== idx) { mel.fl = idx; mannHit(.11, .45); if (gear.knife) { _sh.copy(l.foot); emitSparks(_sh, mel.dir); } }
       } else footL(l, l.side*1.1, 1.7, 1.9, k);
     } else if (l.row === 1) footL(l, l.side*(1.6 + .15*Math.sin(mel.t*9 + l.side)), .9, 1.0, k);
   }
 }},
 { name:"Stich", reach:1.2, dur:1.6, stand:.7, run(u, dt) {                   // Zurückweichen, dann Doppelstich
   const k = 1 - Math.exp(-dt*18); let L, ang, th;
   if (u < .25) { const e = ease(u/.25); L = -.1*e; ang = .3*e; th = 0; }
   else if (u < .42) { const e = ease(sgm(u, .25, .42)); L = -.1 + .4*e; ang = .3 - .4*e; th = e; }
   else { const e = ease(sgm(u, .42, 1)); L = .3*(1 - e); ang = -.1*(1 - e); th = 1 - e; }
   tilt(mel.dir, ang + mel.aim*Math.min(1, th + .5)); _p.copy(mel.p0).addScaledVector(mel.dir, L); _p.y = HW*1.1; poseSet(_p, _h, _nn);
   for (const l of legs) {
     if (l.row === 0) footL(l, -l.side*.25*(1 - th) + l.side*.15*th, 1.6 - 1.1*th, 1.4 + 2.0*th, k);
     else if (l.row === 1) footL(l, l.side*1.5, .8, .8, k);
   }
   if (u > .27 && mel.wh < 0) { mel.wh = 0; whoosh(); }
   if (u > .38 && mel.fl < 0) { mel.fl = 0; mannHit(.3, .8); }
 }},
 { name:"Wirbel", reach:1.1, dur:1.7, stand:.6, run(u, dt) {                   // Kreisel: dreht hoch, Beine schleudern nach außen und schleppen nach, Bremsen mit Nachschwingen
   const k = 1 - Math.exp(-dt*18), e = sgm(u, .1, .86), wn = clamp(6*e*(1 - e)*1.12, 0, 1), over = u > .86 ? Math.sin((u - .86)*40)*.3*Math.exp(-(u - .86)*22) : 0;
   const ang = Math.PI*2*1.75*ease(e) + over; _h.copy(mel.h0).applyAxisAngle(UP, ang);
   _p.copy(mel.p0); _p.y = HW*(1 + .34*Math.sin(Math.PI*e)*(.6 + .4*wn)); _nn.copy(UP).applyAxisAngle(_h, -.42*wn); poseSet(_p, _h, _nn);   // Neigung nach innen
   const lag = -.55*wn, cl = Math.cos(lag), sl = Math.sin(lag), rr = 1.15 + 1.05*wn;
   for (const l of legs) { const x0 = l.restLocal.x*rr, z0 = l.restLocal.z*rr; footL(l, x0*cl + z0*sl, -.55 + wn*(1.0 + .45*Math.sin(mel.t*30 + l.row*1.7 + l.side)), -x0*sl + z0*cl, k); }
   if (u > .12 && mel.wh < 0) { mel.wh = 0; whoosh(); }
   if (wn > .5 && Math.floor(mel.t*9) !== mel._wt) { mel._wt = Math.floor(mel.t*9); beep(520 + 160*wn, .04, 0, .02); }
   const TH = [.32, .5, .68], s = mel.fl + 1;
   if (s < 3 && u > TH[s]) { mel.fl = s; strike(s < 2 ? .17 : .36, s < 2 ? .5 : 1.0); if (s === 2 && openAt(mel.p0.x - mel.dir.x*.15, mel.p0.z - mel.dir.z*.15)) { mel.p0.x -= mel.dir.x*.15; mel.p0.z -= mel.dir.z*.15; } }
 }},
 { name:"Stoßsprung", reach:1.3, dur:2.0, stand:1.7, run(u, dt) {               // Sprungtritt gegen den Oberkörper und Abprall
   const k = 1 - Math.exp(-dt*14); _ap.copy(TP).addScaledVector(mel.dir, -.7); _ap.y = TG.headY*.61; _ld.copy(mel.p0); _ld.y = HW; _a0.copy(mel.p0); _a0.y = HW*.65;
   const front = l => { if (l.row === 0) footL(l, l.side*.4, .6, 3.3, k); else if (l.row === 1) footL(l, l.side*1.2, .3, 2.2, k); else footL(l, l.restLocal.x*.6, -.2, l.restLocal.z*.6 - .5, k); };
   if (u < .15) { const e = ease(u/.15); _h.copy(mel.hd0).lerp(mel.dir, e); _p.copy(mel.p0); _p.y = HW*(1 - .35*e); poseSet(_p, _h, UP); }
   else if (u < .38) { const e = ease(sgm(u, .15, .38)); hop(_a0, _ap, e, .35, _p); tilt(mel.dir, 1.0*e); poseSet(_p, _h, _nn); legs.forEach(front);
     if (u > .17 && mel.wh < 0) { mel.wh = 0; whoosh(); } if (e > .97 && mel.fl < 0) { mel.fl = 0; mannHit(.35, 1); } }
   else if (u < .42) { _p.copy(_ap); tilt(mel.dir, 1.0); poseSet(_p, _h, _nn); legs.forEach(front); }
   else if (u < .9) { const e = ease(sgm(u, .42, .9)); hop(_ap, _ld, e, .35, _p); tilt(mel.dir, 1.0*(1 - e)); poseSet(_p, _h, _nn); airPose(dt, .3 + .7*e); }
   else { poseSet(_ld, mel.dir, UP); airPose(dt, 1); }
 }},
 { name:"Biss", reach:1.1, dur:2.2, stand:1.5, run(u, dt) {                     // hüpft heran und beißt in die Beine
   const k = 1 - Math.exp(-dt*14); _ap.copy(TP).addScaledVector(mel.dir, -.62); _ap.y = HW*.8; _ld.copy(mel.p0); _ld.y = HW; _a0.copy(mel.p0); _a0.y = HW*.7;
   if (u < .12) { const e = ease(u/.12); _h.copy(mel.hd0).lerp(mel.dir, e); _p.copy(mel.p0); _p.y = HW*(1 - .3*e); poseSet(_p, _h, UP); }
   else if (u < .30) { const e = ease(sgm(u, .12, .30)); hop(_a0, _ap, e, .12, _p); poseSet(_p, mel.dir, UP); airPose(dt, .7); if (mel.wh < 0) { mel.wh = 0; whoosh(); } }
   else if (u < .82) {
     _h.copy(mel.dir).applyAxisAngle(UP, .35*Math.sin(mel.t*14)); _p.copy(_ap); _nn.copy(UP).applyAxisAngle(mel.dir, .22*Math.sin(mel.t*9)); poseSet(_p, _h, _nn);
     if (mel.fl < 0) { mel.fl = 0; mannHit(.05, .5); }
     for (const l of legs) {
       if (l.row <= 1) { _sh.set(mel.dir.z*l.side*(.1 + .06*l.row), .4 + .2*l.row, -mel.dir.x*l.side*(.1 + .06*l.row)).add(TP); l.foot.lerp(_sh, k); }
       else footL(l, l.restLocal.x, -.8, l.restLocal.z, k);
     }
     dmgOver(dt*.45/(.52*2.2)); mq.shake = .6; mq.flash = Math.max(mq.flash, .3);
   } else { const e = ease(sgm(u, .82, 1)); hop(_ap, _ld, e, .15, _p); poseSet(_p, mel.dir, UP); airPose(dt, .5 + .5*e); }
 }},
 { name:"Deckenfall", reach:1.7, dur:2.1, stand:0, run(u, dt) {      // lässt sich von der Decke fallen, rollt sich in der Luft und landet auf dem Gegner
   const IPy = TG.headY + .1 + HW*.55; _ap.set(TP.x - mel.dir.x*.15, IPy, TP.z - mel.dir.z*.15);
   _ld.copy(TP).addScaledVector(mel.dir, -1.15); if (!openAt(_ld.x, _ld.z)) _ld.copy(mel.p0); _ld.y = HW; _a0.copy(mel.p0);
   if (u < .2) { const e = ease(u/.2); _p.copy(_a0); _p.y -= .05*e; _p.x += .012*Math.sin(mel.t*40)*e; _nn.set(0,-1,0); poseSet(_p, mel.dir, _nn); airPose(dt, .2 + .6*e);
     if (mel.wh < 0 && u > .12) { mel.wh = 0; whoosh(); } }
   else if (u < .5) { const f = sgm(u, .2, .5), e = ease(f); _p.set(_a0.x + (_ap.x - _a0.x)*e, _a0.y + (_ap.y - _a0.y)*f*f, _a0.z + (_ap.z - _a0.z)*e);
     _nn.set(0,-1,0).applyAxisAngle(mel.dir, Math.PI*ease(sgm(f, .05, .85))); poseSet(_p, mel.dir, _nn); airPose(dt, .45 + .5*f); }
   else if (u < .64) {
     if (mel.fl < 0) { mel.fl = 0; mannHit(.5, 1); thud(7); story.sk = Math.min(1.4, story.sk + .55); _sh.copy(_ap); _sn.set(0,1,0); emitSparks(_sh, _sn); clang(.35); }
     _p.copy(_ap); _p.y -= .035*Math.sin(Math.PI*sgm(u, .5, .64)); poseSet(_p, mel.dir, UP); airPose(dt, 1); mq.shake = 1; }
   else { const e = ease(sgm(u, .64, 1)); hop(_ap, _ld, e, .5, _p); poseSet(_p, mel.dir, UP); airPose(dt, .4 + .6*e); if (mel.fl === 0) { mel.fl = 1; whoosh(); } }
 }},
];

/* ---- Wahrnehmung: Was passiert um die Spinne herum? ---- */
function sense() {
  const dx = TP.x - pos.x, dz = TP.z - pos.z, dist = Math.max(.01, Math.hypot(dx, dz));
  const fc = (Math.sin(TG.yaw)*dx + Math.cos(TG.yaw)*dz)/dist;           // >0: Gegner dreht uns den Rücken zu, <0: er schaut uns an
  let near = 0; for (const b of hz.bots) { if (b.dead || b === mel.bot) continue; if (Math.hypot(b.R.g.position.x - TP.x, b.R.g.position.z - TP.z) < 2.6 || Math.hypot(b.R.g.position.x - pos.x, b.R.g.position.z - pos.z) < 2.2) near++; }
  const ceil = nB.y < -.5, head = ceil ? 9 : ceilAt(pos.x, pos.z, pos.y) - pos.y, hi = ceilAt(TP.x, TP.z, 1.2) - 1.2;
  _gw.set(dx/dist, 0, dz/dist);
  const behind = openAt(pos.x - _gw.x*1.1, pos.z - _gw.z*1.1), tgtBehind = openAt(TP.x + _gw.x*1.1, TP.z + _gw.z*1.1);
  const b = mel.bot; return {dist, fc, near, ceil, jumpOK:head > 1.15 && hi > 1.2, behind, tgtBehind, aware:!b || !!b.st, stunned:!!(b && b.stun > 0), mannq:!b && mq.flinch > .1, combo:mel.combo};
}
function pickKind(c) {
  if (c.ceil) return 6; if (mel.force !== undefined) { mel.wk = 1.4; mel.wl = "Schwachstelle: Kniegelenk"; return mel.force; }
  const w = [1, 1, 1, .7, 1, 1, 0];
  if (c.fc > .35) { w[0] *= 3.2; w[4] *= 1.6; w[2] *= .5; mel.wk = 1.8; mel.wl = "Schwachstelle: Rücken-Kern"; }
  else if (c.fc < -.35) { w[2] *= 2.6; w[1] *= 1.3; w[4] *= c.dist > 1.4 ? 2.2 : .6; mel.wk = 1.7; mel.wl = "Schwachstelle: Kopf-Sensor"; }
  else { w[5] *= 2.6; w[1] *= 2; mel.wk = 1.4; mel.wl = "Schwachstelle: Kniegelenk"; }
  if (c.near >= 1) w[3] *= 3 + c.near*2;
  if (!c.jumpOK) { w[0] = 0; w[4] = 0; }
  if (!c.behind) { w[2] *= .3; w[4] *= .3; }                           // kein Platz zum Zurückweichen / Abprallen
  if (!c.tgtBehind) { w[0] *= .5; }
  if (c.stunned) { w[1] *= 2.2; w[3] *= .5; }
  if (c.combo >= 2) { w[4] *= 2; w[0] *= 1.6; w[3] *= 1.4; }
  if (mel.last >= 0 && mel.last < 6) w[mel.last] *= .15;
  let s = 0; for (const x of w) s += x; let r = Math.random()*s; for (let i = 0; i < w.length; i++) { r -= w[i]; if (r <= 0) return i; }
  return 1;
}
function aimFor(c) { const ty = c.fc > .35 ? 1.1 : c.fc < -.35 ? 1.5 : .45; mel.aim = clamp(Math.atan2(ty - (HW + mel.gy), Math.max(c.dist, .6)), -.5, .35); }
function standPoint(c, out) {
  // Anlaufpunkt ~1,7 m vor dem Gegner; unaufmerksame Ziele werden von hinten umkreist, aufmerksame seitlich flankiert
  _gw.set(pos.x - TP.x, 0, pos.z - TP.z); const L = _gw.length() || 1; _gw.multiplyScalar(1/L);
  const back = Math.atan2(-Math.sin(TG.yaw), -Math.cos(TG.yaw)), cur = Math.atan2(_gw.x, _gw.z); let da = back - cur; while (da > Math.PI) da -= 2*Math.PI; while (da < -Math.PI) da += 2*Math.PI;
  const bias = mel.bot ? (c.aware ? .7 : 1) : .0, base = cur + clamp(da, -1.0, 1.0)*bias*(c.dist > 2.4 ? 1 : .5);
  for (const off of [0, .5, -.5, 1.0, -1.0, 1.6, -1.6, 2.4]) { const a = base + off, x = TP.x + Math.sin(a)*1.7, z = TP.z + Math.cos(a)*1.7; if (openAt(x, z)) { out.set(x, HW, z); return true; } }
  return false;
}
function startMelee() {
  if (mode === "melee") { if (mel.state === 2 && mel.t > .4*mel.dur) { mel.queue = true; mel.qT = clockT; } return; }
  if (opt.ibuf && mel.cool > 0 && mode === "surf" && !fp && !hack.state && !mel.state) { mel.queue = true; mel.qT = clockT; return; }
  if (fp || mode !== "surf" || hack.state || mel.state || mel.cool > 0) return;
  const ceil = nB.y < -.5; if (!ceil && nB.y < .7) return;
  mel.gy = ceil ? 0 : Math.max(0, pos.y - HW); if (mel.gy < .04) mel.gy = 0; mel.bot = null; mel.miss = false; mel.hits = 0; mel.sneak = false;
  let bd = ceil ? 3.6 : (opt.dash !== false && mel.gy === 0) ? 6.5 : 1.4;
  for (const b of hz.bots) { if (b.dead) continue; const d2 = Math.hypot(b.R.g.position.x - pos.x, b.R.g.position.z - pos.z); if (d2 < bd) { bd = d2; mel.bot = b; } }
  _t1.set(mann.position.x - pos.x, 0, mann.position.z - pos.z); const dist = _t1.length();
  mel.real = !mel.bot && mel.gy === 0 && mq.state === 0 && mann.visible && dist < (ceil ? 3.6 : 6.0) && dist > .2;
  if (!mel.bot && !mel.real) return;
  tgUpdate(0); mel.queue = false; const c = sense(); mel.wt = 0;
  if (mel.bot && !mel.bot.st) { mel.sneak = true; }
  if (c.ceil) { if (c.dist > 3.6) return; mel.kind = 6; mel.last = 6; mel.wk = 1.7; mel.wl = "Schwachstelle: Kopf-Sensor"; mel.dir.set(TP.x - pos.x, 0, TP.z - pos.z).normalize(); mel.aim = 0; beginAnim(); return; }
  if (c.dist > 1.95) {
    if (!standPoint(c, mel.stand)) { toast(T("Weg versperrt")); return; }
    mel.dir.set(TP.x - pos.x, 0, TP.z - pos.z).normalize(); mel.state = 1; mel.guard = 3.2; mel.dist = 9; mel.go.copy(mel.stand); beep(700, .08, 0, .04); return;
  }
  arrive(c);
}
function arrive(c) {
  c = c || sense(); const k = pickKind(c); mel.kind = k; mel.last = k; mel.dir.set(TP.x - pos.x, 0, TP.z - pos.z).normalize(); aimFor(c);
  if (mel.sneak) toast(T("Überraschungsangriff")); beginAnim();
}
function beginAnim() {
  const K = KINDS[mel.kind]; mode = "melee"; mel.state = 2; mel.t = 0; mel.dur = K.dur; mel.fl = -1; mel.wh = -1; mel.miss = false;
  mel.p0.copy(pos); mel.p0.y = mel.kind === 6 ? pos.y : HW; mel.hd0.copy(hd); mel.hit = false;
  mel.h0.copy(mel.dir);
  for (const l of legs) { l.type = true; l.stepping = false; l.land = false; }
  vel.set(0,0,0); speed = 0; yawRate = 0; jump.charge = 0; jump.held = false;
}
function updateMelee(dt) {
  mel.cool = Math.max(0, mel.cool - dt); if (mel.queue && mel.qT !== undefined && clockT - mel.qT > .35) mel.queue = false;
  if (mel.comboT > 0) { mel.comboT -= dt; if (mel.comboT <= 0) mel.combo = 0; }
  if (mel.queue && mel.state === 0 && mode === "surf" && mel.cool <= 0) { mel.queue = false; startMelee(); return; }
  if (mel.state !== 1) return;
  if (mel.bot && mel.bot.dead || (!mel.bot && !mel.real)) { mel.state = 0; return; }
  tgUpdate(dt); mel.guard -= dt;
  _t1.set(TP.x - pos.x, 0, TP.z - pos.z); const dist = _t1.length(); mel.dir.copy(_t1).multiplyScalar(1/Math.max(dist, .01));
  const c = sense(); standPoint(c, mel.stand); _t2.copy(mel.stand).sub(pos); _t2.y = 0; mel.dist = _t2.length();
  // Hindernis-Umgehung: freie Richtung suchen
  _t2.normalize(); let ok = false;
  for (const off of [0, .45, -.45, .9, -.9, 1.4, -1.4]) { _gw.copy(_t2).applyAxisAngle(UP, off); if (openAt(pos.x + _gw.x*.55, pos.z + _gw.z*.55)) { mel.go.copy(pos).addScaledVector(_gw, 1.5); ok = true; break; } }
  if (!ok || mel.guard <= 0) { mel.state = 0; toast(T("Weg versperrt")); return; }
  if (dist < 1.95 || mel.dist < .25) arrive(c);
}
function stepMelee(dt) {
  if (mel.hs > 0) { mel.hs -= dt; return; }                  // Hit-Stop: kurzes Einfrieren beim Treffer
  mel.t += dt;
  tgUpdate(dt);
  _t1.set(TP.x - pos.x, 0, TP.z - pos.z); const dist = _t1.length();
  if (dist > .05) {                                           // Ausrichtung folgt dem Gegner live
    _t1.multiplyScalar(1/dist); const ang = Math.atan2(UP.dot(_t2.crossVectors(mel.dir, _t1)), mel.dir.dot(_t1)), st = clamp(ang, -7*dt, 7*dt);
    mel.dir.applyAxisAngle(UP, st); mel.h0.applyAxisAngle(UP, st);
    const K = KINDS[mel.kind];
    if (K.stand > 0 && mel.kind !== 0 && mel.kind !== 4 && mel.kind !== 5) {      // Abstand zum Gegner halten
      const err = clamp(dist - K.stand, -.9, .9)*Math.min(1, dt*5), nx = mel.p0.x + _t1.x*err, nz = mel.p0.z + _t1.z*err; if (openAt(nx, nz)) { mel.p0.x = nx; mel.p0.z = nz; }
    }
  }
  KINDS[mel.kind].run(clamp(mel.t/mel.dur, 0, 1), dt);
  if (mel.t >= mel.dur) endMelee();
}
function endMelee() {
  mode = "surf"; mel.state = 0; mel.cool = mel.hits ? .06 : mel.miss ? .7 : .35; mel.comboT = mel.hits ? 1.7 : 0; if (!mel.hits) mel.combo = 0; vel.set(0,0,0); speed = 0; yawRate = 0;
  nS.set(0,1,0); nB.set(0,1,0); hd.y = 0; hd.normalize(); pos.y = HIP_H*S + mel.gy; landDip = .08; orient(); landLegs(nB);
  if (mel.real && mq.health <= 0) topple();
}
