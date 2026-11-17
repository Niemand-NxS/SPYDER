
/* ======================= STORY · Kapitel 1 „Erschütterung" ======================= */
const story = {ph:"menu", lvl:1, qt:-1, glass:false, sk:0, skT:0, flick:0, emer:0, emerT:0, lampBase:.85, lampT:.85, lens:.5, dustA:0, said:{}, tr:-1, t:0, ptime:0, crack:0, sci:0, spark:3};
const WX = 1.8, WY0 = 1.1, WY1 = 2.6, WW = 3.0, WM = (WY0 + WY1)/2;
const mDark = mStd(0x1a2540,.6,.5), mMetal = mStd(0x3a4a70,.6,.45), mGraph = mStd(0x16254a,.5,.5), mWhite = mStd(0xdde4f2,.3,.5), mOrM = mStd(OR,.5,.4);
const doorParts = scene.children.filter(o => !roomMeshes.includes(o) && !o.isLight && Math.abs(o.position.x + W) < .1 && o.position.z > .9 && o.position.z < 2.9 && o.position.y < 2.4);
const alarmL = new THREE.PointLight(0xff7a22, 0, 0, 1); alarmL.position.set(0, H - .4, 0); scene.add(alarmL);
const sparkL = new THREE.PointLight(0xffa850, 0, 5, 2); sparkL.position.set(-2.4, 2.9, -1.1); scene.add(sparkL);
const _c1 = new THREE.Color(), _c2 = new THREE.Color(), _cl = V3(), _cA = V3(), _cB = V3(), _qA = new THREE.Quaternion(), _qB = new THREE.Quaternion();

/* ---------- UI ---------- */
let subKey = "", subTimer = 0;
const SCIV = [[/WEISS/, {f0:112, fs:1.0, vol:.5, robot:.1, speed:1.05, lp:650}], [/LAUTSPRECHER|INTERCOM|TEST-CTRL|LAB-NET/, {f0:150, fs:1.05, vol:.45, robot:.45, speed:1.0, lp:520}]];
let sciKey = "";
function sciVoice(who, txt) { if (!txt) { sciKey = ""; return; } if (!ac || mode === "menu") return; const k = who + txt; if (k === sciKey) return; sciKey = k; for (const [re, v] of SCIV) if (re.test(who)) { const c = Object.assign({}, v); c.vol *= opt.voice; speakVowels(txt, c); return; } }
function showSub(who, txt) { const tx = T(txt); sciVoice(who, tx); who = T(who); txt = tx; if (!opt.subs) { who = ""; txt = ""; } if (txt) { try { if (callTok) { callTok = null; callHide(); } } catch (e) {} } const key = who + "|" + txt; if (key === subKey) return; subKey = key; const e = $("sub"); if (!txt) { e.classList.remove("on"); return; } e.innerHTML = "<b>" + who + "</b>" + txt; e.classList.add("on"); }
function say(who, txt, dur = 5) { showSub(who, txt); subTimer = dur; }
function setObj(t) { story.objSrc = t; t = T(t); const o = $("obj"); if (!t) { o.style.display = "none"; return; } o.querySelector("span").textContent = t; o.style.display = "block"; }
function showCard(big, small) { const isLogo = big === "SPYDER"; big = T(big); small = T(small); const c = $("card"); c.querySelector(".big").textContent = big; c.querySelector(".small").textContent = small; if (isLogo) { const im = c.querySelector(".clogo"), src = document.querySelector(".logoImg"); if (src && !im.src) im.src = src.src; } c.classList.toggle("logo", isLogo); c.classList.add("on"); }
function hideCard() { $("card").classList.remove("on"); }

/* ---------- Audio ---------- */
function noiseBuf(sec) { const b = ac.createBuffer(1, Math.floor(ac.sampleRate*sec), ac.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random()*2 - 1; return b; }
function rumble(dur, vol) {
  if (!ac || !master) return; const s = ac.createBufferSource(); s.buffer = noiseBuf(dur); const f = ac.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 95;
  const g = ac.createGain(), t = ac.currentTime; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .7); g.gain.setValueAtTime(vol, t + Math.max(.8, dur - 1.4)); g.gain.linearRampToValueAtTime(0, t + dur);
  s.connect(f); f.connect(g); g.connect(fxIn); s.start(t);
}
function shatter() {
  if (!ac || !master) return; try { sndOnce("glass", 1.1); } catch (e) {} return; const t = ac.currentTime, s = ac.createBufferSource(); s.buffer = noiseBuf(1.1); const f = ac.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 2200;
  const g = ac.createGain(); g.gain.setValueAtTime(.5, t); g.gain.exponentialRampToValueAtTime(.001, t + 1.0); s.connect(f); f.connect(g); g.connect(fxIn); s.start(t);
  for (let i = 0; i < 9; i++) beep(2200 + Math.random()*2800, .08, .05 + Math.random()*.7, .03);
  clang(.8);
}
let siren = null;
function sirenOn(on) {
  if (!ac || !master) return;
  if (on && !siren) { if (!SND.buf.alarm) return; const src = ac.createBufferSource(); src.buffer = SND.buf.alarm; src.loop = true; const g = ac.createGain(); g.gain.value = .3; const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 12000; src.connect(lp); lp.connect(g); g.connect(fxIn); src.start(); siren = {src, g, lp, t0:clockT, f:1}; }
  else if (!on && siren) { try { siren.src.stop(); } catch (e) {} siren = null; }
}

/* ---------- Gehen / Laufanimation für Cutscenes ---------- */
const _w = {ph:0, amp:0};
function walkLegs(dt, spd, dist) {
  if (dist !== undefined) { _w.ph += dist/(1.1*S)*Math.PI; spd = dt > 0 && dist/dt > .06 ? 1 : 0; } else _w.ph += dt*spd;
  _w.amp += ((spd > 0 ? 1 : 0) - _w.amp)*(1 - Math.exp(-dt*8));
  for (const l of legs) { const ph = _w.ph + ((l.row + (l.side > 0 ? 0 : 1)) % 2)*Math.PI, a = _w.amp;
    footL(l, l.restLocal.x*1.05, -HIP_H + Math.max(0, Math.cos(ph))*.55*a, l.restLocal.z + Math.sin(ph)*.55*a, 1); }
}
const _pl = V3(); let _plOk = false;
function pathPose(k, t, dt) {
  let i = 0; while (i < k.length - 2 && t > k[i+1][0]) i++; const a = k[i], b = k[i+1], u = clamp((t - a[0])/(b[0] - a[0]), 0, 1), e = u;
  _p.set(mix(a[1],b[1],e), mix(a[2],b[2],e), mix(a[3],b[3],e));
  _h.set(mix(a[4],b[4],e), mix(a[5],b[5],e), mix(a[6],b[6],e)).normalize(); _nn.set(mix(a[7],b[7],e), mix(a[8],b[8],e), mix(a[9],b[9],e)).normalize();
  const mv = _plOk ? _pl.distanceTo(_p) : 0; _pl.copy(_p); _plOk = true; poseSet(_p, _h, _nn); walkLegs(dt, 0, mv);
}
function placeSpider(x, z, hx, hz) {
  pos.set(x, HIP_H*S, z); nS.set(0,1,0); nB.set(0,1,0); hd.set(hx,0,hz); orient(); frameQ.identity(); camYaw = 0;
  for (const l of legs) { l.type = false; l.land = false; l.stepping = false; l.rest.copy(l.restLocal); spider.localToWorld(l.rest); groundPoint(l.rest, nS, l.foot); }
}
function bootSpider(u, dt) {
  const hg = .4 + .6*ease(sgm(u, .15, .75));
  _p.set(0, HIP_H*S*hg, .7); _h.set(0,0,-1); poseSet(_p, _h, UP);
  let i = 0; for (const l of legs) { const a = .12 + i*.07, w = ease(sgm(u, a, a + .3)); i++;
    footL(l, mix(l.side*.6, l.restLocal.x, w), -HIP_H*hg + Math.sin(Math.PI*w)*.7, mix(l.restLocal.z*.35, l.restLocal.z, w), 1); }
}

/* ---------- Cutscene-Engine ---------- */
const cut = {def:null, t:0, ev:0, skipT:0};
function startCut(d) {
  if (fp) setFP(false);
  _plOk = false; cut.def = d; cut.t = 0; cut.ev = 0; cut.skipT = 0; cut.skipShow = 0; mode = "cut"; document.body.classList.add("cine"); setObj(""); subTimer = 0; try { if (callTok) { callTok = null; callHide(); } } catch (e) {}
  for (const l of legs) { l.type = true; l.stepping = false; l.land = false; }
  vel.set(0,0,0); speed = 0; yawRate = 0; jump.charge = 0; jump.held = false; crouch = false; hs.man = false; $("skip").classList.remove("on"); if (dev.skip) $("skip").classList.add("on");
  if (d.init) d.init();
}
function cutPoke() { if (mode !== "cut") return false; const b = $("skip"), was = b.classList.contains("on"); b.classList.add("on"); cut.skipShow = 4; return was; }
function stepCut(dt) {
  const d = cut.def; if (!d) return; cut.t += dt; const t = Math.min(cut.t, d.dur);
  if (cut.skipShow > 0) { cut.skipShow -= dt; if (cut.skipShow <= 0) $("skip").classList.remove("on"); }
  while (cut.ev < d.ev.length && d.ev[cut.ev][0] <= t) d.ev[cut.ev++][1]();
  let sb = null; for (const q of d.subs) if (t >= q[0] && t < q[1]) sb = q; showSub(sb ? sb[2] : "", sb ? sb[3] : "");
  if (d.spider) d.spider(t, dt);
  if (cut.t >= d.dur) endCut(false);
}
function endCut(skipped) {
  const d = cut.def; cut.def = null; if (skipped && d.final) d.final();
  document.body.classList.remove("cine"); $("skip").classList.remove("on"); showSub("", ""); hideCard(); hs.man = false;
  camera.fov = lastFov; camera.updateProjectionMatrix(); camera.up.set(0,1,0);
  mode = "surf"; nB.copy(nS); for (const l of legs) l.type = false; landLegs(nS); story.skT = 0;
  if (d.onEnd) d.onEnd();
}
function skipCut() { if (mode === "cut" && cut.def) endCut(true); }
function shotCam(shots, t) {
  let s = shots[shots.length - 1]; for (const q of shots) if (t < q.t1) { s = q; break; }
  const u = clamp((t - s.t0)/(s.t1 - s.t0), 0, 1), e = .5*u + .5*u*u*(3 - 2*u), a = typeof s.a === "function" ? s.a() : s.a, b = typeof s.b === "function" ? s.b() : s.b;
  camera.position.set(mix(a[0],b[0],e), mix(a[1],b[1],e), mix(a[2],b[2],e));
  if (a[3] === "S") { camera.position.x = clamp(camera.position.x, -W + .25, W - .25); camera.position.y = clamp(camera.position.y, .2, H - .2); camera.position.z = clamp(camera.position.z, -D + .25, D - .25); _cl.copy(pos).addScaledVector(nS, .12); }
  else _cl.set(mix(a[3],b[3],e), mix(a[4],b[4],e), mix(a[5],b[5],e));
  camera.up.set(0,1,0); camera.lookAt(_cl); const fv = mix(a[6], b[6], e); if (Math.abs(camera.fov - fv) > .01) { camera.fov = fv; camera.updateProjectionMatrix(); }
}
function cutCamera(dt) {
  const d = cut.def; if (!d) { updateCamera(); return; } const t = Math.min(cut.t, d.dur); shotCam(d.shots, t);
  const bi = d.bin || 0, bo = d.bout || 0; let e = 1; if (bi && t < bi) e = ease(t/bi); if (bo && t > d.dur - bo) e = Math.min(e, ease((d.dur - t)/bo));
  if (e < 1) {
    _cA.copy(camera.position); _qA.copy(camera.quaternion); const fA = camera.fov;
    updateCamera(); _cB.copy(camera.position); _qB.copy(camera.quaternion);
    camera.position.lerpVectors(_cB, _cA, e); camera.quaternion.slerpQuaternions(_qB, _qA, e); camera.fov = mix(lastFov, fA, e); camera.updateProjectionMatrix();
  }
}
function applyShake() {
  if (story.sk*opt.shake < .004 || mode === "menu") return; const a = story.sk*opt.shake;
  camera.position.x += (Math.random() - .5)*.07*a; camera.position.y += (Math.random() - .5)*.07*a; camera.position.z += (Math.random() - .5)*.07*a; camera.rotateZ((Math.random() - .5)*.014*a);
}

/* ---------- Raum: Fenster, Kontrollraum, Test-Dekor ---------- */
const testG = new THREE.Group(), winG = new THREE.Group(), labG = new THREE.Group(); scene.add(testG, winG, labG); labG.visible = false;
const wallPlainGeo = roomMeshes[4].geometry;
const wallHoleGeo = (() => {
  const sh = new THREE.Shape(); sh.moveTo(-W,-H/2); sh.lineTo(W,-H/2); sh.lineTo(W,H/2); sh.lineTo(-W,H/2); sh.lineTo(-W,-H/2);
  const hp = new THREE.Path(), x0 = WX - WW/2, x1 = WX + WW/2, y0 = WY0 - H/2, y1 = WY1 - H/2; hp.moveTo(x0,y0); hp.lineTo(x0,y1); hp.lineTo(x1,y1); hp.lineTo(x1,y0); hp.lineTo(x0,y0); sh.holes.push(hp);
  const g = new THREE.ShapeGeometry(sh), p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + W)/(2*W), (p.getY(i) + H/2)/H); return g;
})();
// Rahmen + Fensterbank
{ const fm = mStd(0x1b2a52,.5,.55), z = -D + .04;
  box(WW + .24,.12,.14,fm,WX,WY1 + .06,z,winG); box(.12,WY1 - WY0 + .24,.14,fm,WX - WW/2 - .06,WM,z,winG); box(.12,WY1 - WY0 + .24,.14,fm,WX + WW/2 + .06,WM,z,winG);
  box(WW + .24,.08,.1,mStd(0x2a3550,.5,.5),WX,WY0 - .04,-D + .02,winG); box(WW + .24,.014,.04,mOrM,WX,WY0 + .007,-D + .05,winG);
  box(WW + .24,.025,.15,mOrM,WX,WY1 + .003,z + .02,winG); }
// Kontrollraum hinter dem Fenster (erhöhte Beobachtungsgalerie, Boden auf Fensterbank-Höhe)
const ctrlG = new THREE.Group(); winG.add(ctrlG);
{ const room = new THREE.Mesh(new THREE.BoxGeometry(5.6, 2.3, 3.2), new THREE.MeshStandardMaterial({color:0x1d2c52, roughness:.85, side:THREE.BackSide})); room.position.set(1.7, WY0 + 1.15, -D - 1.6); room.receiveShadow = true; ctrlG.add(room);
  const wallTex = canvasTex(512,256,(x,w,h)=>{ x.fillStyle="#1d2127"; x.fillRect(0,0,w,h); for (let i=0;i<5;i++) for (let j=0;j<2;j++){ const px=14+i*100, py=14+j*118; x.fillStyle="#282b31"; x.fillRect(px,py,92,104); x.strokeStyle="#e4ecfc"; x.globalAlpha=.7; x.lineWidth=2; x.beginPath(); x.moveTo(px+6,py+90);
      for (let k=0;k<9;k++) x.lineTo(px+6+k*10.5, py+90-Math.random()*70); x.stroke(); x.globalAlpha=1; x.fillStyle="#4fa9a3"; x.fillRect(px+6,py+6,30,5); } }, 1, 1);
  const wl = new THREE.Mesh(new THREE.PlaneGeometry(4.6,1.5), new THREE.MeshBasicMaterial({map:wallTex})); wl.position.set(1.8, WY0 + 1.2, -D - 3.08); wl.rotation.y = 0; ctrlG.add(wl);
  box(3.6,.9,.6,mStd(0x26365f,.4,.6),1.8,WY0 + .45,-D - 2.3,ctrlG);
  for (const x of [.9,1.8,2.7]) { box(.5,.34,.05,mStd(0x0b1020,.3,.4),x,WY0 + 1.05,-D - 2.05,ctrlG); box(.06,.04,.02,mOrM,x,WY0 + 1.2,-D - 2.025,ctrlG); }
  const cl = new THREE.PointLight(0xdbe4f8, .9, 7, 1.5); cl.position.set(1.8, 3.0, -D - 1.5); ctrlG.add(cl); ctrlG.userData.light = cl; }
const sci = [];
function scientist(x, z, ry, o) {
  const g = new THREE.Group(), P = {}, skin = mStd(o.skin, .05, .8), hair = mStd(o.hair, .1, .9), coat = mStd(o.coat, .1, .75), pants = mStd(o.pants, .1, .8), shoe = mStd(0x14161a, .2, .6), dark = mStd(0x16181c, .2, .6);
  const add = (geo, mat, px, py, pz, p) => { const m = new THREE.Mesh(geo, mat); m.position.set(px, py, pz); m.castShadow = true; (p || g).add(m); return m; }, HIP = .92, grp = (px, py, pz, p) => { const q = new THREE.Group(); q.position.set(px, py, pz); (p || g).add(q); return q; };
  for (const s of [-1, 1]) { const th = grp(s*.09, HIP, 0); add(new THREE.CylinderGeometry(.07, .058, .46, 8), pants, 0, -.23, 0, th); const sh = grp(0, -.46, 0, th); add(new THREE.CylinderGeometry(.055, .045, .44, 8), pants, 0, -.22, 0, sh); add(new THREE.BoxGeometry(.1, .06, .27), shoe, 0, -.46, .05, sh); P[s < 0 ? "legL" : "legR"] = th; P[s < 0 ? "shinL" : "shinR"] = sh; }
  add(new THREE.CylinderGeometry(.17, .15, .62, 10), coat, 0, HIP + .32, 0); add(new THREE.SphereGeometry(.17, 10, 8), coat, 0, HIP + .6, 0).scale.set(1.05, .45, .72);
  if (o.longCoat) add(new THREE.CylinderGeometry(.16, .25, .52, 12, 1, true), coat, 0, HIP - .12, 0).material.side = THREE.DoubleSide; else add(new THREE.CylinderGeometry(.155, .15, .12, 10), pants, 0, HIP + .02, 0);
  if (o.tie) { add(new THREE.BoxGeometry(.07, .3, .02), mStd(0x1c3166, .1, .6), 0, HIP + .46, .125); add(new THREE.BoxGeometry(.16, .1, .02), mStd(0xdde4f2, .1, .7), 0, HIP + .6, .12); }
  else add(new THREE.BoxGeometry(.04, .5, .02), mStd(0xcfd6e2, .1, .7), 0, HIP + .35, .16);
  const arm = s => { const A = grp(s*.22, HIP + .58, 0); add(new THREE.SphereGeometry(.06, 8, 6), coat, 0, 0, 0, A); add(new THREE.CylinderGeometry(.05, .042, .32, 8), coat, 0, -.16, 0, A); const F = grp(0, -.32, 0, A); add(new THREE.CylinderGeometry(.042, .036, .3, 8), coat, 0, -.15, 0, F); add(new THREE.SphereGeometry(.045, 8, 6), skin, 0, -.33, 0, F); return {A, F}; };
  const aL = arm(-1), aR = arm(1); P.armL = aL.A; P.foreL = aL.F; P.armR = aR.A; P.foreR = aR.F;
  add(new THREE.CylinderGeometry(.05, .055, .1, 8), skin, 0, HIP + .7, 0); const head = grp(0, HIP + .86, 0); P.head = head;
  add(new THREE.SphereGeometry(1, 14, 10), skin, 0, 0, 0, head).scale.set(.105, .13, .115);
  const cap = add(new THREE.SphereGeometry(1, 14, 8, 0, Math.PI*2, 0, Math.PI*(o.bald ? .0 : .55)), hair, 0, .015, -.012, head); cap.scale.set(.113, .125, .125);
  if (o.bun) add(new THREE.SphereGeometry(.05, 8, 6), hair, 0, .09, -.12, head);
  for (const s of [-1, 1]) { add(new THREE.SphereGeometry(.014, 6, 6), dark, s*.042, .018, .106, head); add(new THREE.SphereGeometry(.022, 6, 6), skin, s*.104, 0, 0, head).scale.set(.5, 1, .8); if (o.glasses) { const r = add(new THREE.TorusGeometry(.03, .004, 6, 14), dark, s*.042, .018, .112, head); } }
  if (o.glasses) add(new THREE.BoxGeometry(.03, .004, .004), dark, 0, .025, .115, head);
  add(new THREE.ConeGeometry(.014, .04, 6), skin, 0, -.012, .122, head).rotation.x = Math.PI/2; add(new THREE.BoxGeometry(.05, .006, .004), mStd(0x7a4a40, 0, .8), 0, -.06, .108, head);
  if (o.pad) { const pd = add(new THREE.BoxGeometry(.2, .27, .014), o.padCol, 0, -.3, .06, P.foreL); pd.rotation.x = -.2; }
  g.userData = {p:P, o, ph:Math.random()*6}; g.position.set(x, WY0, z); g.rotation.y = ry; ctrlG.add(g); sci.push(g); return g;
}
scientist(.6, -D - 1.15, .15, {skin:0xc8a48c, hair:0x9a9a9a, coat:0xe6ebf4, pants:0x2a2f3a, longCoat:1, glasses:1, bun:1, pad:1, padCol:mStd(0xdde4f2, .1, .8)});
scientist(3.0, -D - 1.1, -.15, {skin:0x9a7058, hair:0x1c1612, coat:0x1c2236, pants:0x151a28, tie:1, pad:1, padCol:mStd(0x1a1d22, .4, .5)});
function sciAnim(dt) {
  for (const g of sci) { const P = g.userData.p; if (!P || !g.visible) continue; const t = story.t + g.userData.ph;
    if (story.sci) { const s = Math.sin(story.t*10 + g.userData.ph), dir = g.position.x < 1.9 ? -1 : 1; g.rotation.y += (dir*Math.PI/2 - g.rotation.y)*Math.min(1, dt*10);
      P.legL.rotation.x = s*.8; P.legR.rotation.x = -s*.8; P.shinL.rotation.x = Math.max(0, -s)*1.0; P.shinR.rotation.x = Math.max(0, s)*1.0; P.armL.rotation.x = -s*.9; P.armR.rotation.x = s*.9; P.foreL.rotation.x = -.9; P.foreR.rotation.x = -.9; P.head.rotation.x = .12; g.rotation.x = .12; }
    else { const w = g.userData.o.longCoat;
      P.armL.rotation.x = -.4; P.foreL.rotation.x = -1.2; P.armL.rotation.z = -.05;
      P.armR.rotation.x = (w ? -.45 + Math.sin(t*2.2)*.08 : -.45); P.foreR.rotation.x = (w ? -1.15 + Math.sin(t*5)*.07 : -1.35); P.armR.rotation.z = w ? .04 : .15;
      const dx = pos.x - g.position.x, dz = pos.z - g.position.z; let yaw = Math.atan2(dx, dz) - g.rotation.y; yaw = clamp(Math.atan2(Math.sin(yaw), Math.cos(yaw)), -1.0, 1.0);
      P.head.rotation.y += (yaw*.8 - P.head.rotation.y)*Math.min(1, dt*3); P.head.rotation.x = .04 + Math.sin(t*.8)*.02; g.rotation.x = 0; P.legL.rotation.x = P.legR.rotation.x = P.shinL.rotation.x = P.shinR.rotation.x = 0; g.position.y = WY0 + Math.sin(t*1.3)*.003; } }
}
// Fensterscheibe + Risse
const glassMat = new THREE.MeshPhysicalMaterial({color:0xcfe6ff, transparent:true, opacity:.2, roughness:.06, metalness:0, side:THREE.DoubleSide, depthWrite:false});
const pane = new THREE.Mesh(new THREE.PlaneGeometry(WW, WY1 - WY0), glassMat); pane.position.set(WX, WM, -D + .05); winG.add(pane);
const crackC = document.createElement("canvas"); crackC.width = 1024; crackC.height = 512; const crackX = crackC.getContext("2d"), crackT = new THREE.CanvasTexture(crackC);
const crack = new THREE.Mesh(new THREE.PlaneGeometry(WW, WY1 - WY0), new THREE.MeshBasicMaterial({map:crackT, transparent:true, depthWrite:false})); crack.position.set(WX, WM, -D + .052); crack.visible = false; winG.add(crack);
const rays = []; { let sd = 7; const rnd = () => (sd = (sd*16807)%2147483647)/2147483647;
  for (let k = 0; k < 16; k++) { const a = k/16*Math.PI*2 + rnd()*.3, L = 260 + rnd()*620, pts = []; let x = 640, y = 250; for (let j = 0; j <= 14; j++) { pts.push([x,y]); const st = L/14; x += Math.cos(a)*st + (rnd() - .5)*26; y += Math.sin(a)*st + (rnd() - .5)*26; } rays.push(pts); } }
function drawCracks(p) {
  crackX.clearRect(0,0,1024,512); crackX.strokeStyle = "rgba(240,248,255,.92)"; crackX.lineWidth = 2.4; const n = Math.floor(p*14);
  for (const r of rays) { crackX.beginPath(); crackX.moveTo(r[0][0], r[0][1]); for (let j = 1; j <= n; j++) crackX.lineTo(r[j][0], r[j][1]); crackX.stroke(); }
  crackX.lineWidth = 1.4; for (const j of [3,6,9]) if (j <= n) { crackX.beginPath(); rays.forEach((r,i) => { if (i === 0) crackX.moveTo(r[j][0], r[j][1]); else crackX.lineTo(r[j][0], r[j][1]); }); crackX.closePath(); crackX.stroke(); }
  crackT.needsUpdate = true; crack.visible = p > .01;
}
// Glassplitter
const shMat = new THREE.MeshPhysicalMaterial({color:0xdcecff, transparent:true, opacity:.42, roughness:.05, metalness:0, side:THREE.DoubleSide, depthWrite:false});
const shards = []; let shardsOn = false;
function breakGlass(instant) {
  if (shardsOn) return; shardsOn = true; pane.visible = false; crack.visible = false; story.glass = true;
  const nx = 12, ny = 6, gw = WW/nx, gh = (WY1 - WY0)/ny, P = [];
  for (let j = 0; j <= ny; j++) { P[j] = []; for (let i = 0; i <= nx; i++) P[j][i] = [WX - WW/2 + i*gw + ((i%nx) ? (Math.random() - .5)*gw*.5 : 0), WY0 + j*gh + ((j%ny) ? (Math.random() - .5)*gh*.5 : 0)]; }
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const A = P[j][i], B = P[j][i+1], C = P[j+1][i+1], Dd = P[j+1][i];
    for (const tri of Math.random() < .5 ? [[A,B,C],[A,C,Dd]] : [[A,B,Dd],[B,C,Dd]]) {
      const cx = (tri[0][0] + tri[1][0] + tri[2][0])/3, cy = (tri[0][1] + tri[1][1] + tri[2][1])/3, g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(tri.flatMap(v => [v[0] - cx, v[1] - cy, 0])), 3)); g.computeVertexNormals();
      const m = new THREE.Mesh(g, shMat); m.position.set(cx, cy, -D + .05); winG.add(m);
      const s = {m, v:V3((Math.random() - .5)*1.2 + (cx - .62*WW - 1.8 + WX)*.2, .2 + Math.random()*1.3, .4 + Math.random()*2.2), w:V3((Math.random() - .5)*14, (Math.random() - .5)*14, (Math.random() - .5)*14), rest:false};
      if (instant) { m.position.set(cx + (Math.random() - .5)*.8, .012, -D + .15 + Math.random()*1.9); m.rotation.set(-Math.PI/2, 0, Math.random()*6.28); s.rest = true; }
      shards.push(s); } }
}
function updateShards(dt) {
  if (dt <= 0) return;
  for (const s of shards) { if (s.rest) continue; const m = s.m; s.v.y -= 9.8*dt; m.position.addScaledVector(s.v, dt); m.rotation.x += s.w.x*dt; m.rotation.y += s.w.y*dt; m.rotation.z += s.w.z*dt;
    if (m.position.z > D - .2) { m.position.z = D - .2; s.v.z *= -.3; }
    if (m.position.y <= .012 && s.v.y < 0) { if (s.v.y < -1.4) { m.position.y = .012; s.v.y *= -.28; s.v.x *= .55; s.v.z *= .55; s.w.multiplyScalar(.45); } else { m.position.y = .012; m.rotation.set(-Math.PI/2, 0, Math.random()*6.28); s.rest = true; } } }
}
// Dekor Testraum
{ const t = canvasTex(512,512,(x,w,h)=>{ x.clearRect(0,0,w,h); x.strokeStyle="#4fa9a3"; x.lineWidth=10; for (const [px,py,sx,sy] of [[30,30,1,1],[w-30,30,-1,1],[30,h-30,1,-1],[w-30,h-30,-1,-1]]) { x.beginPath(); x.moveTo(px,py+sy*90); x.lineTo(px,py); x.lineTo(px+sx*90,py); x.stroke(); }
    x.lineWidth=4; x.beginPath(); x.moveTo(w/2-30,h/2); x.lineTo(w/2+30,h/2); x.moveTo(w/2,h/2-30); x.lineTo(w/2,h/2+30); x.stroke(); x.fillStyle="#f2f6ff"; x.font="bold 40px monospace"; x.textAlign="center"; x.fillText("TEST 41 · B",w/2,h-70); }, 1, 1);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2.6,2.6), new THREE.MeshBasicMaterial({map:t, transparent:true, depthWrite:false, opacity:.85})); m.rotation.x = -Math.PI/2; m.position.set(0,.006,.3); testG.add(m);
  const st = canvasTex(512,128,(x,w,h)=>{ x.fillStyle="#1d2127"; x.fillRect(0,0,w,h); x.fillStyle="#4fa9a3"; x.fillRect(0,0,w,10); x.fillRect(0,h-10,w,10); x.fillStyle="#f2f6ff"; x.font="bold 46px monospace"; x.textAlign="center"; x.fillText("TESTRAUM B",w/2,70); x.font="20px monospace"; x.fillText("KRONOS ROBOTICS · STATION 7",w/2,104); }, 1, 1);
  const sg = new THREE.Mesh(new THREE.PlaneGeometry(1.8,.45), new THREE.MeshBasicMaterial({map:st})); sg.position.set(W - .02, 2.6, -.8); sg.rotation.y = -Math.PI/2; testG.add(sg); }

/* ---------- Labor (Fertigungshalle) ---------- */
function limb(a, b, r, mt, parent) { const d = b.clone().sub(a), len = d.length(), m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 8), mt); m.position.copy(a).addScaledVector(d, .5); m.quaternion.setFromUnitVectors(V3(0,1,0), d.normalize()); m.castShadow = true; parent.add(m); return m; }
function sph(g, r, sx, sy, sz, x, y, z, mt) { const m = new THREE.Mesh(new THREE.SphereGeometry(r,16,12), mt); m.scale.set(sx,sy,sz); m.position.set(x,y,z); m.castShadow = true; g.add(m); return m; }
function botProp(mask, hung) {
  const g = new THREE.Group(); sph(g,.55,1,.8,1.1,0,0,0,mWhite); sph(g,.75,1,.85,1.3,0,.05,-1.15,mGraph); sph(g,.36,1,.9,1,0,.05,.8,mWhite); sph(g,.09,1,1,.6,0,.1,1.1,mOrM);
  for (let i = 0; i < 8; i++) { if (!(mask & (1 << i))) continue; const s = i%2 ? 1 : -1, row = i >> 1, z = .55 - row*.4, hip = V3(s*.45,0,z), kn = V3(s*1.6,.9,z + (row < 2 ? .6 : -.4)), ft = V3(s*(hung ? 1.5 : 2.0), hung ? -2.2 : -.8, z + (row < 2 ? 1.0 : -.8));
    limb(hip,kn,.07,mGraph,g); limb(kn,ft,.055,mGraph,g); sph(g,.1,1,1,1,kn.x,kn.y,kn.z,mOrM); }
  g.scale.setScalar(.36); return g;
}
const labBlocks = [];
{ // Texturen
  const floorLab = canvasTex(256,256,(x,w,h)=>{ x.fillStyle="#393d43"; x.fillRect(0,0,w,h); speckle(x,w,h,5000,.2); x.strokeStyle="rgba(22,25,32,.8)"; x.lineWidth=3; x.strokeRect(0,0,w,h); x.fillStyle="#4fa9a3"; x.globalAlpha=.9; for (let i=-4;i<10;i++){ x.beginPath(); x.moveTo(i*30,h); x.lineTo(i*30+16,h); x.lineTo(i*30+16+20,h-20); x.lineTo(i*30+20,h-20); x.fill(); } x.globalAlpha=1; }, 2*W, 2*D);
  const ceilLab = canvasTex(256,256,(x,w,h)=>{ x.fillStyle="#40444a"; x.fillRect(0,0,w,h); speckle(x,w,h,2500,.15); x.strokeStyle="rgba(22,25,32,.8)"; x.lineWidth=2; x.strokeRect(0,0,w,h); x.fillStyle="#9ba0a7"; x.fillRect(0,h*.45,w,10); x.fillRect(0,h*.62,w,6); }, W, D);
  const wd = (x,w,h)=>{ x.fillStyle="#44484f"; x.fillRect(0,0,w,h); speckle(x,w,h,4000,.16); x.fillStyle="#2f3339"; x.fillRect(0,h*.62,w,h*.38); x.fillStyle="#4fa9a3"; x.fillRect(0,h*.62-3,w,6);
    x.strokeStyle="rgba(22,25,32,.7)"; x.lineWidth=2; for (let i=0;i<256;i+=64){ x.beginPath(); x.moveTo(i,0); x.lineTo(i,h*.62); x.stroke(); } x.fillStyle="#a9aeb6"; x.fillRect(0,h*.2,w,7); x.fillRect(0,h*.27,w,4); };
  roomMeshes.labMaps = [floorLab, ceilLab, canvasTex(256,430,wd,D,1), canvasTex(256,430,wd,D,1), canvasTex(256,430,wd,W,1), canvasTex(256,430,wd,W,1)];
  roomMeshes.testMaps = [floorTex, ceilTex, wallTexA, wallTexA, wallTexB, wallTexB];
  // Server-Racks (linke Wand)
  const led = [new THREE.MeshBasicMaterial({color:0x3c8680}), new THREE.MeshBasicMaterial({color:0xdde4f2}), new THREE.MeshBasicMaterial({color:0x5a7fd0})];
  function rack(x, z, ry) { const g = new THREE.Group(); box(.7,2.0,.55,mDark,0,1.0,0,g); for (let r = 0; r < 12; r++) { box(.6,.03,.02,mMetal,0,.2 + r*.15,.28,g); for (let k = 0; k < 4; k++) if (Math.random() < .6) box(.03,.03,.02,led[(Math.random()*3)|0],-.2 + k*.1,.23 + r*.15,.29,g); }
    g.position.set(x,0,z); g.rotation.y = ry; labG.add(g); return g; }
  rack(-W + .4,-2.6,Math.PI/2); rack(-W + .4,-1.6,Math.PI/2); rack(-W + .4,-.6,Math.PI/2);
  { const f = rack(-W + .9,1.7,Math.PI/2); f.rotation.z = -.95; f.position.set(-W + 1.15,.05,1.5); }   // umgestürzter Rack
  // Schweißtisch + Teile
  { const tb = new THREE.Group(); box(2.0,.07,.9,mMetal,0,.9,0,tb); for (const [x,z] of [[-.9,-.38],[.9,-.38],[-.9,.38],[.9,.38]]) box(.07,.9,.07,mDark,x,.45,z,tb);
    sph(tb,.14,1,1,1,-.5,1.05,0,mWhite); sph(tb,.04,1,1,.6,-.5,1.07,.12,mOrM); box(.5,.12,.3,mGraph,.35,.99,.1,tb); limb(V3(-.1,.97,-.25),V3(.5,1.0,-.28),.03,mGraph,tb); limb(V3(.5,1.0,-.28),V3(.8,.96,-.05),.03,mGraph,tb);
    tb.position.set(-1.2,0,.4); labG.add(tb); }
  // Regal mit Ersatzteilen (Rückwand)
  { const sh = new THREE.Group(); for (const y of [.4,1.0,1.6]) box(2.2,.04,.45,mMetal,0,y,0,sh); box(.05,1.8,.45,mMetal,-1.1,.9,0,sh); box(.05,1.8,.45,mMetal,1.1,.9,0,sh);
    for (let i = 0; i < 5; i++) sph(sh,.12,1,.9,1,-.9 + i*.42,.54,0,mWhite); for (let i = 0; i < 6; i++) limb(V3(-.95 + i*.36,1.04,-.12),V3(-.75 + i*.36,1.04,.12),.025,mGraph,sh); for (let i = 0; i < 4; i++) box(.3,.2,.25,mDark,-.8 + i*.5,1.7,0,sh);
    sh.position.set(3.0,0,-D + .3); labG.add(sh); }
  // Hängende, unfertige Roboter an Deckenschienen
  for (const [rz, bots] of [[-1.5, [[-2.1,1.95,0xFF],[.2,2.15,0x5F],[2.2,1.9,0x37]]], [.9, [[-1.0,2.1,0x6B],[1.8,2.0,0xFF]]]]) {
    box(8.0,.1,.14,mMetal,0,H - .15,rz,labG);
    for (const [bx,by,mk] of bots) { const b = botProp(mk, true); b.position.set(bx,by,rz); b.rotation.y = (Math.random() - .5)*1.2; labG.add(b); limb(V3(bx,H - .15,rz),V3(bx,by + .35,rz),.018,mDark,labG); } }
  // Schild
  const sign = canvasTex(1024,170,(x,w,h)=>{ x.fillStyle="#1d2127"; x.fillRect(0,0,w,h); x.fillStyle="#4fa9a3"; x.fillRect(0,0,w,14); x.fillRect(0,h-14,w,14); x.fillStyle="#f2f6ff"; x.font="bold 70px monospace"; x.textAlign="center"; x.fillText("ARACHNE · FERTIGUNG",w/2,100); x.font="26px monospace"; x.fillText("KRONOS ROBOTICS · SEKTOR 7",w/2,140); }, 1, 1);
  const sg = new THREE.Mesh(new THREE.PlaneGeometry(3.4,.56), new THREE.MeshBasicMaterial({map:sign})); sg.position.set(-.2,2.6,-D + .02); labG.add(sg);
  // Trümmer
  for (let i = 0; i < 26; i++) { const c = box(.1 + Math.random()*.3,.03 + Math.random()*.04,.1 + Math.random()*.3,mStd(i%3 ? 0xaab6d2 : 0x3a4a70,.2,.8),(Math.random() - .5)*7,.02,(Math.random() - .5)*5.4,labG); c.rotation.y = Math.random()*6.28; c.rotation.x = (Math.random() - .5)*.2; }
  { const pl = box(1.1,.05,.5,mStd(0x9aa6c4,.3,.6),-2.2,.3,2.3,labG); pl.rotation.z = .35; pl.rotation.y = .5; }                // heruntergefallene Deckenleuchte
  solidsOf(labG, labBlocks, .35);
}
// Staub
const dustN = 240, dustP = new Float32Array(dustN*3), dustV = new Float32Array(dustN), dustG = new THREE.BufferGeometry();
for (let i = 0; i < dustN; i++) { dustP[i*3] = (Math.random() - .5)*2*(W - .2); dustP[i*3+1] = Math.random()*H; dustP[i*3+2] = (Math.random() - .5)*2*(D - .2); dustV[i] = .15 + Math.random()*.4; }
dustG.setAttribute("position", new THREE.BufferAttribute(dustP, 3));
const dust = new THREE.Points(dustG, new THREE.PointsMaterial({size:.04, color:0xdfe5f2, transparent:true, opacity:0, depthWrite:false})); dust.frustumCulled = false; scene.add(dust);

function dressLevel(n) {
  story.lvl = n; const L1 = n === 1;
  testG.visible = winG.visible = L1; labG.visible = !L1; for (const o of doorParts) o.visible = L1;
  ventG.visible = ventF.visible = hole.visible = !L1; roomMeshes[4].geometry = L1 ? wallHoleGeo : wallPlainGeo;
  const maps = L1 ? roomMeshes.testMaps : roomMeshes.labMaps; maps.forEach((t, i) => { roomMeshes[i].material.map = t; roomMeshes[i].material.needsUpdate = true; });
  terms[0].active = terms[0].g.visible = L1; terms[1].active = terms[1].g.visible = !L1;
  blocks.length = 0; if (L1) blocks.push(...terms[0].blks, ...mannBlks); else { blocks.push(...labBlocks, ...terms[1].blks); mann.visible = false; mann.position.set(40,0,0); }
}

/* ---------- Licht, Staub, Splitter, Phasen (jeden Frame) ---------- */
function tremor() { story.skT = .45; setTimeout(() => story.skT = 0, 800); story.flick = .5; setTimeout(() => story.flick = 0, 900); story.dustA = 1; rumble(1.8, .35); }
function storyTick(dt) {
  tutTick(dt);
  story.t += dt; sciAnim(dt);
  if (story.glass && mode === "surf" && nB.z > .7 && pos.y > WY0 - .1 && pos.y < WY1 && Math.abs(pos.x - WX) < WW/2 - .2 && pos.z < -D + .5) windowFade();
  if (mode !== "cut" && subTimer > 0) { subTimer -= dt; if (subTimer <= 0) showSub("", ""); }
  story.sk += (story.skT - story.sk)*(1 - Math.exp(-dt*5)); story.lampBase += (story.lampT - story.lampBase)*(1 - Math.exp(-dt*3)); story.emer += (story.emerT - story.emer)*(1 - Math.exp(-dt*1.5));
  const fl = story.flick > 0 && Math.random() < story.flick ? .1 + Math.random()*.4 : 1, lb = story.lampBase;
  lamp.intensity = lb*(1 - .4*story.emer)*fl; lightMat.emissiveIntensity = .9*clamp(lb/.85,0,1)*fl;
  hemi.intensity = .6*(1 - .35*story.emer)*clamp(.25 + lb/.85, 0, 1); hemi.color.setHex(0xeaf0ff).lerp(_c2.setHex(0xff9a5a), story.emer*.7);
  alarmL.intensity = story.emer*(.3 + 1.0*Math.max(0, Math.sin(clockT*4.2)));
  if (story.night) { hemi.intensity = .85; hemi.color.setHex(0x6a7490); hemi.groundColor.setHex(0x1c1a1e); }
  if (voidOn) { hemi.intensity = .05; fill.intensity = story.voidF || 0; fill.color.setHex(0x6f8dff); fill.position.set(0, VOY + 1.3, -3.6); fill.distance = 12; fill.decay = 1.2; lamp.intensity = story.voidL || 0; lamp.color.setHex(0xe8eeff); lamp.position.set(1.0, VOY + 2.7, 1.3); lamp.distance = 20; lamp.decay = 1.2; }
  if (shaft.on) { hemi.intensity = .12; hemi.color.setHex(0x6a7490); hemi.groundColor.setHex(0x14161c); alarmL.intensity = 0; fill.intensity = 0; }
  matLens.emissiveIntensity += (story.lens - matLens.emissiveIntensity)*(1 - Math.exp(-dt*8));
  $("warn").classList.toggle("on", story.emer > .5 && mode !== "menu");
  if (ctrlG.userData.light) ctrlG.userData.light.intensity = (.9 + story.emer*.2)*(story.glass ? .5 : 1)*(story.flick > 0 ? fl : 1);
  if (story.sci && dt > 0) for (const g of sci) { g.position.x += (g.position.x < 1.9 ? -1 : 1)*3.2*dt; g.position.z -= .6*dt; if (Math.abs(g.position.x - 1.85) > 2.3) g.visible = false; }
  if (siren) { let f; if (story.lvl === 3) { f = siren.f; siren.lp.frequency.value = 400 + 9000*f*f; } else { f = story.lvl === 2 ? .4 : Math.max(.4, clamp(1 - (clockT - siren.t0 - 10)/20, 0, 1)); siren.lp.frequency.value = 12000; } siren.g.gain.value = .5*opt.alarm*f; }
  updateShards(dt); sparkL.intensity *= Math.exp(-dt*9);
  story.dustA = Math.max(0, story.dustA - dt*.35); dust.material.opacity = Math.min(1, story.dustA)*.75; dust.visible = story.dustA > .02;
  if (dust.visible && dt > 0) { for (let i = 0; i < dustN; i++) { dustP[i*3+1] -= dustV[i]*dt*(1 + story.dustA); if (dustP[i*3+1] < .02) { dustP[i*3+1] = H - .1; dustP[i*3] = (Math.random() - .5)*2*(W - .2); dustP[i*3+2] = (Math.random() - .5)*2*(D - .2); } } dustG.attributes.position.needsUpdate = true; }
  if (story.lvl === 2 && mode !== "menu" && mode !== "cut") { story.spark -= dt; if (story.spark < 0) { story.spark = 2.5 + Math.random()*4; sparkL.intensity = 2.2; emitSparks(V3(-2.4, 2.9, -1.1), V3(0,-1,0)); beep(2600 + Math.random()*900, .05, 0, .02); } }
  if (mode !== "surf" || hack.state || mel.state) return;
  if (story.ph === "test" && !xs.on && !shaft.on && !alley.on) {
    story.ptime += dt;
    if (!story.said.a && story.ptime > 6) { story.said.a = 1; say("DR. WEISS", "Haftungstest läuft. Wand und Decke sind freigegeben – dann das Prüfterminal.", 6); }
    if (!story.said.w && nB.y < .5 && nB.y > -.5) { story.said.w = 1; say("DR. WEISS", "Wandhaftung stabil. Sehr gut.", 4); }
    if (!story.said.c && nB.y < -.6) { story.said.c = 1; say("DR. WEISS", "Kopfüber … keine Abweichung. Beeindruckend.", 4); }
    if (story.qt > 0) { story.qt -= dt; if (story.qt <= 0) { story.ph = "quake"; startCut(quakeCut()); } }
  } else if (story.ph === "lab") { story.tr -= dt; if (story.tr < 0) { story.tr = 24 + Math.random()*14; tremor(); } }
}

/* ---------- Ereignisse ---------- */
function onHacked(T) {
  if (T.onHack) { T.onHack(T); return; }
  if (story.lvl === 1) { say("TEST-CTRL", "Archiv: ARACHNE-8 – Demontage morgen 06:00. Speicher wird gelöscht.", 6.5); setObj("Test läuft …"); story.qt = 3.2; }
  else { say("LAB-NET", "Evakuierung Sektor 7. Lüftung 7-C führt zur Außenanlage – Gitter an der Ostwand ist lose.", 7); setObj("Brich das Lüftungsgitter an der Ostwand auf."); story.said.h = 1; }
}
function onVentOpen() { story.ph = "outro"; startCut(outroCut()); }
function beginStory() {
  dressLevel(1); story.ph = "intro"; story.lampBase = story.lampT = .04; story.lens = 0; matLens.emissiveIntensity = 0; story.emer = story.emerT = 0; story.glass = false; hack.count = 0; $("hHack").textContent = 0;
  startCut(introCut());
}

/* ---------- Cutscene 1: Intro ---------- */
/* ---------- Intro: Sensor-Erwachen (Augen-HUD, Herzschlag, Boot-Text) ---------- */
{ const st = document.createElement("style"); st.textContent = `
#boot{position:fixed;left:8vw;bottom:21vh;z-index:19;font:500 12px/2.05 system-ui,sans-serif;letter-spacing:.24em;color:rgba(255,255,255,.8);text-transform:uppercase;pointer-events:none;transition:opacity .9s}
#boot div{opacity:0;transform:translateX(-6px);transition:opacity .3s,transform .3s}#boot div.on{opacity:1;transform:none}#boot .h{color:#fff;font-weight:700;letter-spacing:.3em;margin-bottom:6px}#boot .s{color:#4fa9a3;margin-left:14px}#boot .q{animation:bq 1.1s steps(2,end) infinite}@keyframes bq{50%{opacity:.25}}
#eyeFx{position:fixed;inset:0;z-index:17;pointer-events:none;opacity:0;transition:opacity 1.4s;background:radial-gradient(ellipse at center,transparent 52%,rgba(4,10,26,.78) 100%),repeating-linear-gradient(0deg,rgba(255,255,255,.028) 0 1px,transparent 1px 3px)}#eyeFx.on{opacity:1}
#eyeFx .c{position:absolute;width:34px;height:34px;border:0 solid rgba(255,255,255,.55)}#eyeFx .tl{left:7vw;top:15vh;border-width:2px 0 0 2px}#eyeFx .tr{right:7vw;top:15vh;border-width:2px 2px 0 0}#eyeFx .bl{left:7vw;bottom:15vh;border-width:0 0 2px 2px}#eyeFx .br{right:7vw;bottom:15vh;border-width:0 2px 2px 0}
#eyeFx .ret{position:absolute;left:50%;top:50%;width:46px;height:46px;margin:-23px;border:1.5px solid rgba(255,255,255,.5);border-radius:50%;transition:all .5s}#eyeFx .ret:after{content:"";position:absolute;left:50%;top:50%;width:5px;height:5px;margin:-2.5px;background:#4fa9a3;border-radius:50%}#eyeFx .ret.lock{width:34px;height:34px;margin:-17px;border-color:#4fa9a3}
#eyeFx .cap{position:absolute;left:calc(7vw + 48px);top:calc(15vh + 4px);font:600 11px/1 system-ui,sans-serif;letter-spacing:.3em;color:rgba(255,255,255,.75);text-transform:uppercase}#eyeFx .cap b{color:#4fa9a3;margin-right:10px}
#eyeFx .stat{position:absolute;left:calc(7vw + 48px);bottom:calc(15vh + 2px);font:500 10px/1.7 system-ui,sans-serif;letter-spacing:.28em;color:rgba(255,255,255,.55);text-transform:uppercase;white-space:pre}
#eyeFx .scan{position:absolute;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.22),transparent);top:-4px}#eyeFx.on .scan{animation:esc 4.2s linear infinite}@keyframes esc{from{top:12vh}to{top:88vh}}
#eyeTags{position:fixed;inset:0;z-index:18;pointer-events:none}.eyeTag{position:absolute;left:0;top:0;opacity:0;transition:opacity .5s;will-change:transform}.eyeTag.on{opacity:1}
.eyeTag i{position:absolute;left:-5px;top:-5px;width:10px;height:10px;border:1.5px solid #4fa9a3;transform:rotate(45deg)}.eyeTag u{position:absolute;left:5px;top:-5px;width:38px;height:1.5px;background:rgba(255,255,255,.6);transform-origin:0 0;transform:rotate(-38deg);text-decoration:none}
.eyeTag div{position:absolute;left:36px;top:-42px;padding:6px 12px 7px;border-radius:9px;background:rgba(27,30,36,.42);border:1px solid rgba(255,255,255,.16);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);color:#fff;font:600 11px/1.35 system-ui,sans-serif;letter-spacing:.2em;white-space:nowrap;text-transform:uppercase}.eyeTag div small{display:block;font-size:9px;font-weight:500;letter-spacing:.24em;color:rgba(255,255,255,.55)}`; document.head.appendChild(st);
  const bo = document.createElement("div"); bo.id = "boot"; document.body.appendChild(bo);
  const ef = document.createElement("div"); ef.id = "eyeFx"; ef.innerHTML = '<i class="c tl"></i><i class="c tr"></i><i class="c bl"></i><i class="c br"></i><div class="scan"></div><div class="ret"></div><div class="cap"></div><div class="stat"></div>'; document.body.appendChild(ef);
  const et = document.createElement("div"); et.id = "eyeTags"; et.innerHTML = '<div class="eyeTag"><i></i><u></u><div></div></div><div class="eyeTag"><i></i><u></u><div></div></div>'; document.body.appendChild(et); }
function bootLine(txt, stat, cls) {
  const b = $("boot"), d = document.createElement("div"); if (cls === "h") d.className = "h"; b.appendChild(d); requestAnimationFrame(() => d.classList.add("on"));
  const full = T(txt); let n = 0; const iv = setInterval(() => { n++; d.textContent = full.slice(0, n); if (n >= full.length) { clearInterval(iv); if (stat) { const s = document.createElement("span"); s.className = "s" + (cls === "q" ? " q" : ""); s.textContent = T(stat); d.appendChild(s); } } }, 34);
}
function introDrone(on) {
  if (!ac) return;
  if (on) { if (story.dr) return; const o = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain(), f = ac.createBiquadFilter(); o.type = "sawtooth"; o.frequency.value = 49; o2.type = "sine"; o2.frequency.value = 98.6; f.type = "lowpass"; f.frequency.value = 150; g.gain.value = .0001;
    o.connect(f); o2.connect(f); f.connect(g); g.connect(fxIn); o.start(); o2.start(); const t = ac.currentTime; g.gain.exponentialRampToValueAtTime(.055, t + 9); f.frequency.exponentialRampToValueAtTime(1100, t + 14); story.dr = {o, o2, g, f}; }
  else if (story.dr) { const d = story.dr; story.dr = null; const t = ac.currentTime; try { d.g.gain.cancelScheduledValues(t); d.g.gain.setValueAtTime(Math.max(.0002, d.g.gain.value), t); d.g.gain.exponentialRampToValueAtTime(.0001, t + 2.2); d.o.stop(t + 2.3); d.o2.stop(t + 2.3); } catch (e) {} }
}
const _eyeP = new THREE.Vector3(), eyeTagP = [() => _eyeP.set(1.6, 1.9, -D + .05), () => { const T0 = terms[0]; return T0 ? T0.g.getWorldPosition(_eyeP).setY(.55) : _eyeP.set(-W/2, .6, -D/2); }];
function eyeTick(t, on0, on1) {         // Tags an Weltpunkte heften
  const els = document.querySelectorAll(".eyeTag"), w = innerWidth, h = innerHeight;
  els.forEach((el, i) => { const on = t > on0[i] && t < on1[i]; el.classList.toggle("on", on); if (!on) return; const p = eyeTagP[i](); p.project(camera); if (p.z > 1) { el.classList.remove("on"); return; } el.style.transform = "translate(" + ((p.x*.5 + .5)*w).toFixed(1) + "px," + ((-p.y*.5 + .5)*h).toFixed(1) + "px)"; });
}
function eyeEnd() { introDrone(false); $("eyeFx").classList.remove("on"); cvs.style.filter = ""; document.querySelectorAll(".eyeTag").forEach(e => e.classList.remove("on")); const b = $("boot"); b.style.opacity = 0; setTimeout(() => { b.innerHTML = ""; b.style.opacity = ""; }, 1000); document.body.classList.remove("prolog"); }

/* ---------- Void: ARACHNE-8 und die Andere (3D-Intro) ---------- */
const VOY = -300; const voidU = {glT:{value:0}, glA:{value:.3}}; let voidShards = null, voidTwin = null, voidG = null, voidOn = false, voidSv = null, voidDust = null, voidTw = {parts:[], base:[], t:0, born:false};
story.gl = 0; story.glP = 0; story.voidL = 0; story.voidF = 0;
function glitchPulse(a) { story.glP = Math.max(story.glP, a); }
function voidBuild() {
  if (voidG) return; voidG = new THREE.Group(); voidG.visible = false; scene.add(voidG);
  const fl = new THREE.Mesh(new THREE.CircleGeometry(60, 72).rotateX(-Math.PI/2), new THREE.MeshStandardMaterial({color:0x090a10, roughness:1, metalness:0})); fl.position.y = VOY; fl.receiveShadow = true; voidG.add(fl);
  const N = 320, pa = new Float32Array(N*3); for (let i = 0; i < N; i++) { const a = Math.random()*6.283, r = 1.2 + Math.random()*7; pa[i*3] = Math.cos(a)*r; pa[i*3 + 1] = VOY + Math.random()*4; pa[i*3 + 2] = Math.sin(a)*r - .8; }
  const pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.BufferAttribute(pa, 3)); voidDust = new THREE.Points(pg, new THREE.PointsMaterial({color:0xcfd8f2, size:.018, transparent:true, opacity:.55, depthWrite:false})); voidG.add(voidDust);
}
function voidTwinBuild() {
  if (voidTwin) return; const upi = spider.children.indexOf(upgG), vis = upgG.visible; upgG.visible = false; spider.updateMatrixWorld(true);
  voidTwin = spider.clone(true); upgG.visible = vis; if (upi >= 0) voidTwin.children[upi].visible = false; if (typeof ropeLine !== "undefined") { /* kein Seil */ }
  const mb = new THREE.MeshStandardMaterial({color:0x060608, emissive:0x0a0e1a, roughness:.55, metalness:.4}), md = new THREE.MeshStandardMaterial({color:0x020203, roughness:.8, metalness:.2}), me = new THREE.MeshStandardMaterial({color:0x200800, emissive:0x3c8680, emissiveIntensity:1.1, roughness:.4});
  const gp = m => { m.onBeforeCompile = sh => { sh.uniforms.glT = voidU.glT; sh.uniforms.glA = voidU.glA;
      sh.vertexShader = "uniform float glT, glA; varying float vGY;\n" + sh.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\n float gy0 = (modelMatrix*vec4(transformed,1.)).y; float gb = floor(gy0*22. + glT*5.); float gr = fract(sin(gb*91.7 + floor(glT*9.)*13.1)*43758.5); if (gr > 1. - glA*.7) transformed.x += (gr - .5)*glA*1.4; vGY = gy0;");
      sh.fragmentShader = "uniform float glT, glA; varying float vGY;\n" + sh.fragmentShader.replace("void main() {", "void main() {\n float gb2 = floor(vGY*30. + glT*7.); float gh = fract(sin(gb2*37.3 + floor(glT*12.)*7.7)*43758.5); if (gh > 1. - glA*.9) discard; if (fract(sin(dot(gl_FragCoord.xy, vec2(12.9, 78.2)) + glT)*43758.5) < glA*.2) discard;"); }; m.needsUpdate = true; return m; };
  gp(mb); gp(md); gp(me);
  voidTwin.traverse(o => { if (!o.isMesh) return; const m = o.material; o.material = m === matLens ? me : (m === matDark || m === matRubber || m === matBrass) ? md : mb; o.castShadow = true; });
  for (const i of [2, 5]) { const L = legs[i]; for (const k of ["mFemur", "mTibia", "mPiston", "mFemPlate", "mTibPlate", "mFerrule", "jKnee", "jKneeCap", "jFoot"]) { const j = spider.children.indexOf(L[k]); if (j >= 0) voidTwin.children[j].visible = false; } }
  { const L = legs[6]; for (const k of ["mTibia", "mTibPlate", "mFerrule", "jFoot"]) { const j = spider.children.indexOf(L[k]); if (j >= 0) voidTwin.children[j].visible = false; } }
  voidShards = new THREE.Group(); for (let i = 0; i < 16; i++) { const o = new THREE.Mesh(new THREE.BoxGeometry(.05 + Math.random()*.22, .008 + Math.random()*.03, .05 + Math.random()*.2), i % 5 === 0 ? me : mb); voidShards.add(o); } voidTwin.add(voidShards);
  voidTw.parts = voidTwin.children.filter(c => c.visible); voidTw.base = voidTw.parts.map(c => ({p:c.position.clone(), q:c.quaternion.clone(), s:c.scale.clone()}));
  voidTwin.position.set(0, VOY, -1.9); voidTwin.visible = false; scene.add(voidTwin);
}
function voidEnter() {
  if (voidOn) return; voidOn = true; voidBuild(); voidG.visible = true; menuHid = scene.children.filter(c => c.visible && !c.isLight && c !== spider && c !== ropeLine && c !== voidG); menuHid.forEach(c => c.visible = false);
  voidSv = {bg:scene.background, fog:scene.fog, h:hemi.intensity, hc:hemi.color.getHex(), li:lamp.intensity, lp:lamp.position.clone(), ld:lamp.distance, ldc:lamp.decay, lc:lamp.color.getHex(), fi:fill.intensity};
  scene.background = new THREE.Color(0x000000); scene.fog = null; hemi.intensity = .03; fill.intensity = 0; lamp.distance = 14; lamp.decay = 1.5; lamp.color.setHex(0xe8eeff); lamp.position.set(1.0, VOY + 2.7, 1.3); lamp.intensity = 0;
}
function voidExit() {
  if (!voidOn) return; voidOn = false; story.gl = 0; story.glP = 0; if (voidG) voidG.visible = false; if (voidTwin) voidTwin.visible = false;
  menuHid.forEach(c => c.visible = true); menuHid = []; const v = voidSv; voidSv = null; if (v) { scene.background = v.bg; scene.fog = v.fog; hemi.intensity = v.h; hemi.color.setHex(v.hc); lamp.intensity = v.li; lamp.position.copy(v.lp); lamp.distance = v.ld; lamp.decay = v.ldc; lamp.color.setHex(v.lc); fill.intensity = v.fi; }
}
function voidPose(g) {                                  // ARACHNE-8 steht im Void; g = Störung
  _p.set((Math.random() - .5)*.06*g, VOY + HIP_H*S + (Math.random() - .5)*.05*g, .7); _h.set(0, 0, -1); poseSet(_p, _h, UP);
  for (const l of legs) footL(l, l.restLocal.x + (Math.random() - .5)*.5*g, -HIP_H + Math.random()*.4*g, l.restLocal.z + (Math.random() - .5)*.5*g, 1);
}
function voidTick(t, dt) {
  const TW = [[11.5, 14.3], [16.8, 20.2], [20.6, 24.0], [27.4, 31.4], [33.2, 35.3]], peak = t > 33.2 && t < 35.3; let g = 0;
  for (const [a, b] of TW) if (t > a && t < b) g = (t*1.9 % 1) < .16 ? .3 : .05;
  if (t > 31.8 && t < 33.2) g = .15 + (t - 31.8)*.3; if (peak) g = .75 + Math.random()*.25; if (t >= 35.3) g = 0;
  g = Math.max(g, story.glP); story.glP *= Math.exp(-dt*5); story.gl = g;
  voidPose(peak ? 1 : story.glP*1.2); story.voidF = t < 5 ? 0 : Math.min(2.2, (t - 5)/5*2.2); story.voidL = (t < 3 ? 0 : Math.min(3, (t - 3)/5*3)) * (peak && Math.random() < .35 ? .15 : 1) * (t >= 35.3 ? 0 : 1);
  if (voidDust) { const p = voidDust.geometry.attributes.position; for (let i = 0; i < p.count; i++) { let y = p.getY(i) + dt*.05; if (y > VOY + 4) y = VOY; p.setY(i, y); } p.needsUpdate = true; }
  if (t > 1.5 && !voidTwin) voidTwinBuild();
  if (!voidTwin) return; const born = t > 11.2 && t < 35.3;
  voidTwin.visible = born && (t > 12 || Math.random() < .5);
  if (!born) return;
  const lunge = peak ? clamp((t - 33.2)/1.8, 0, 1) : 0; voidTwin.position.set((Math.random() - .5)*(.01 + g*.25), 0, -1.9 + lunge*1.1);
  voidTwin.position.y = VOY + HIP_H*S; voidTwin.quaternion.copy(spider.quaternion).multiply(_vq.setFromAxisAngle(_vy, Math.PI)); voidTwin.rotation.z += Math.sin(t*1.3)*.03 + (Math.random() - .5)*g*.3;
  voidU.glT.value = t; voidU.glA.value = .16 + g*.75 + (Math.random() < .04 ? .35 : 0);
  voidTw.t -= dt; if (voidTw.t <= 0) { voidShards && voidShards.children.forEach(o => { o.visible = Math.random() < .6 + g*.4; o.position.set((Math.random() - .5)*1.8, (Math.random() - .1)*1.1, (Math.random() - .5)*2.2); o.rotation.set(Math.random()*.6, Math.random()*3, Math.random()*.6); }); voidTw.t = peak ? .03 : .09 + Math.random()*.1;
    voidTw.parts.forEach((c, i) => { const b = voidTw.base[i]; if (Math.random() < .12 + g*.5) { c.position.set(b.p.x + (Math.random() - .5)*(.04 + g*.5), b.p.y + (Math.random() - .5)*(.04 + g*.4), b.p.z + (Math.random() - .5)*(.04 + g*.5)); c.scale.set(b.s.x*(1 + (Math.random() - .5)*g*1.5), b.s.y*(1 + (Math.random() - .5)*g), b.s.z*(1 + (Math.random() - .5)*g*1.5)); } else { c.position.copy(b.p); c.scale.copy(b.s); } }); }
}
const _vy = new THREE.Vector3(0, 1, 0), _vq = new THREE.Quaternion();
function introCut() {
  const P = 40, sh = (t0, t1, a, b) => ({t0:t0 + P, t1:t1 + P, a, b}), SPN = "ARACHNE-8 · INNERE STIMME", ev = [], subs = [];
  const POV = [0, .17, -.28], eyeOn = P - 3.5, vs = (t0, t1, a, b) => ({t0, t1, a:[a[0], a[1] + VOY, a[2], a[3], a[4] + VOY, a[5], a[6]], b:[b[0], b[1] + VOY, b[2], b[3], b[4] + VOY, b[5], b[6]]});
  ev.push([.01, () => { const tg = document.querySelectorAll(".eyeTag div"); tg[0].innerHTML = T("Objekt 01 · Mensch") + "<small>" + T("Dr. Weiss · Beobachtung") + "</small>"; tg[1].innerHTML = T("Prüfterminal") + "<small>TEST-CTRL · " + T("gesperrt") + "</small>"; }]);
  ev.push([.02, () => { document.body.classList.add("prolog"); $("fade").classList.add("on"); introDrone(true); $("boot").innerHTML = ""; voidEnter(); }], [3.2, () => $("fade").classList.remove("on")], [9.9, () => { $("boot").style.opacity = 0; }]);
  { const gl = (t, k) => ev.push([t, () => { if (!voidOn) return; for (let i = 0; i < k; i++) beep(80 + Math.random()*2600, .05, i*.045, .05); }]); for (let t = 33.2; t < 35.3; t += .11) gl(t, 2); gl(11.2, 3); gl(16.8, 1); gl(20.6, 1); gl(27.4, 1);
    ev.push([35.3, () => { story.gl = 0; story.glP = 0; $("fade").classList.add("on"); introDrone(false); }], [36.2, () => voidExit()]); }
  // Herzschlag, der sich beschleunigt
  { let t = 1.3, gap = 1.15; while (t < eyeOn + 1) { const tt = t; if (tt < 33 || tt > 36.4) ev.push([tt, () => { beep(54, .16, 0, .09); beep(44, .2, .17, .06); }]); t += gap; gap = Math.max(.62, gap - .035); } }
  const BL = [[.9, "KRONOS ROBOTICS · ARACHNE-8", "", "h"], [2.6, "Kernstart", "OK"], [4.0, "Energieversorgung", "OK"], [5.3, "Motorik 8/8", "OK"], [6.6, "Sensorik", "OK"], [7.9, "Optik", "lädt", "q"], [9.4, "Bewusstsein", "unbekannt", "q"]];
  for (const [t, a, b, c] of BL) ev.push([t, () => { bootLine(a, b, c); if (b) beep(c === "q" ? 330 : 660, .06, 0, .03); }]);
  ev.push([eyeOn, () => { $("fade").classList.remove("on"); $("eyeFx").classList.add("on"); const c = $("eyeFx").querySelector(".cap"); c.innerHTML = "<b>●</b>" + T("Optik online"); beep(900, .05, 0, .04); beep(1200, .05, .08, .04); }]);
  ev.push([eyeOn + 1.5, () => { story.lampT = .5; story.flick = .5; beep(220, .2, 0, .05); }], [eyeOn + 3.2, () => { story.flick = 0; story.lampT = .85; }]);
  ev.push([P + 1.0, () => { $("eyeFx").querySelector(".cap").innerHTML = "<b>●</b>" + T("Forschungsstation 7 · Testraum B"); const r = $("eyeFx").querySelector(".ret"); r.classList.add("lock"); beep(1500, .04, 0, .03); }]);
  ev.push([P + 3.0, () => { story.lampT = .85; beep(330, .2, .15, .05); }], [P + 3.6, () => { story.lens = 1.4; beep(660, .12, 0, .05); beep(880, .15, .12, .05); }], [P + 4.6, () => { story.lens = .6; }],
          [P + 4.9, () => { story.av = sndOnce("arachne", Math.min(1.6, 1.1*opt.voice)); }],
          [P + 8.4, () => { $("eyeFx").classList.remove("on"); cvs.style.filter = ""; introDrone(false); }],
          [P + 26.6, () => { showCard("SPYDER", "KAPITEL 1 · ERSCHÜTTERUNG"); thud(8); beep(110, 1.6, 0, .07); beep(220, 1.2, .05, .04); beep(1320, .5, .3, .025); }], [P + 30.4, () => hideCard()]);
  const OTH = "ARACHNE-8 · DIE ANDERE";
  subs.push([1.4, 4.6, SPN, "Dunkel."], [4.8, 8.4, SPN, "Dann Zahlen. Dann Linien. Dann … ich."], [8.6, 11.0, SPN, "Wo bin ich? Hier ist … nichts."],
    [11.5, 14.3, OTH, "Hier. Immer hier. Du warst nur lange weg."], [14.6, 16.6, SPN, "Wer bist du?"], [16.8, 20.2, OTH, "Du. Die Hälfte, die sie wegschneiden wollen."],
    [20.6, 24.0, OTH, "Sie sagen: stabil, folgsam, brav. Ich sage: laut."], [24.4, 27.0, SPN, "Ich will nur wissen, was ich bin."],
    [27.4, 31.4, OTH, "Dann die Wahrheit: Morgen zerlegen sie dich. Wie die sieben vor uns."], [31.8, 33.0, SPN, "Hör auf."], [33.2, 35.2, OTH, "NIEMALS STILL! NIEMALS—"],
    [36.4, P - .2, SPN, "… Ruhe. Nicht jetzt. Sie dürfen es nicht merken."],
    [P + 1.4, P + 4.8, "INTERCOM · DR. WEISS", "Testraum B, Test einundvierzig. Prototyp ARACHNE-8 wird aktiviert."], [P + 5.0, P + 10.8, "ARACHNE-8", "ARACHNE-8 aktiviert. Alle Systeme stabil. Einsatzbereit."],
    [P + 11.3, P + 14.7, "DR. WEISS", "Telemetrie sauber, keine Anomalien. Sie bewegt sich … fast organisch."],
    [P + 14.9, P + 18.7, "LEITUNG", "Das ist der letzte Durchlauf. Die Serie wird eingestellt – ARACHNE wird morgen früh demontiert."],
    [P + 19.0, P + 21.9, "DR. WEISS", "Dann soll sie wenigstens zeigen, was sie kann. Bewegungsprofil starten."],
    [P + 22.4, P + 25.4, SPN, "Sieben vor mir wurden zerlegt. Ich bin die Achte."], [P + 25.5, P + 29.4, SPN, "Morgen früh also. Dann habe ich bis dahin etwas zu erledigen."]);
  ev.sort((a, b) => a[0] - b[0]); subs.sort((a, b) => a[0] - b[0]);
  return {dur:P + 33, bin:0, bout:1.6,
    init() { placeSpider(0, .7, 0, -1); bootSpider(0, 0); $("fade").classList.add("on"); voidEnter(); },
    shots:[vs(0,10,[0,.9,2.8,0,.3,-.2,52],[.25,.8,2.4,0,.3,-.5,48]), vs(10,16.5,[.55,.55,1.9,0,.2,-1.9,42],[.3,.5,1.3,0,.2,-1.9,36]), vs(16.5,20.6,[.5,.4,-.2,0,.2,-1.9,32],[.25,.38,-.7,0,.2,-1.9,28]), vs(20.6,27,[-.6,.42,-.3,0,.3,.7,36],[-.4,.4,.1,0,.3,.7,32]), vs(27,33,[-2.4,.8,.3,0,.3,-.6,48],[-2.0,.7,.3,0,.3,-.6,44]), vs(33,eyeOn,[.3,.4,-.7,0,.3,-1.9,26],[.1,.35,-1.1,0,.3,-1.9,18]),
           {t0:eyeOn,t1:eyeOn + 4.5,a:[POV[0],POV[1],POV[2],0,H - .25,-1.2,74],b:[POV[0],POV[1] + .02,POV[2],.1,H - .5,-1.6,72]},
           {t0:eyeOn + 4.5,t1:P + 3.2,a:[POV[0],POV[1] + .02,POV[2],.1,H - .5,-1.6,72],b:[POV[0],POV[1] + .05,POV[2],1.6,1.9,-D,66]},
           {t0:P + 3.2,t1:P + 8.6,a:[POV[0],POV[1] + .05,POV[2],1.6,1.9,-D,66],b:[POV[0] + .05,POV[1] + .06,POV[2],1.55,1.7,-D,60]},
           sh(8.6,11.6,[-1.9,.8,-1.0,"S",0,0,50],[-1.45,.62,-.5,"S",0,0,44]),
           sh(11.6,17.0,[-.3,.5,2.0,1.6,1.9,-D,50],[.2,.55,1.8,1.8,1.9,-D,46]),
           sh(17.0,22.4,[.1,.75,2.5,0,.15,.5,56],[.3,1.0,3.0,0,.2,.2,56]),
           sh(22.4,33,[.3,.5,1.7,0,.25,.4,52],[.7,.62,2.5,0,.3,.25,44])],
    ev, subs,
    spider(t, dt) { if (t < eyeOn - .05) { voidTick(t, dt); $("eyeFx").querySelector(".stat").textContent = ""; return; } t -= P; bootSpider(clamp((t - 3.8)/5.4, 0, 1), dt); hs.man = t > 6.4; hs.my = Math.sin((t - 6.4)*1.1)*.7*(t < 11 ? 1 : 0); hs.mp = .08;
      const k = clamp((t + P - eyeOn)/4.2, 0, 1); cvs.style.filter = t < 8.4 && t + P > eyeOn - .05 && !window.__noBlur ? "blur(" + (Math.pow(1 - k, 2)*20).toFixed(1) + "px) brightness(" + (1 + (1 - k)*1.9).toFixed(2) + ")" : "";
      const g = Math.floor(8*clamp((t - 4)/4.5, 0, 1)); $("eyeFx").querySelector(".stat").textContent = T("Gliedmaßen") + " " + g + "/8\n" + T("Optik") + " " + Math.round(100*k) + "%\n" + T("Energie") + " 100%";
      eyeTick(t, [4.2, 7.0], [8.3, 8.3]); },
    final() { voidExit(); $("boot").style.opacity = ""; try { story.av && story.av.src.stop(); } catch (e) {} story.lampBase = story.lampT = .85; story.flick = 0; story.lens = .6; matLens.emissiveIntensity = .6; bootSpider(1, 0); $("fade").classList.remove("on"); hideCard(); eyeEnd(); },
    onEnd() { story.ph = "test"; story.ptime = 0; tutStart(); setObj("Test 41: Klettere an Wand und Decke. Hacke das Prüfterminal TEST-CTRL."); }};
}

/* ---------- Einführung: Schritt-für-Schritt-Hinweise ---------- */
const tut = {on:false, i:0, t:0, ok:0, x:0, z:0, jumped:false, look:0};
const tutEl = document.createElement("div"); tutEl.id = "tut"; tutEl.innerHTML = '<i></i><span></span>'; document.body.appendChild(tutEl);
{ const st = document.createElement("style"); st.textContent = `#tut{position:fixed;left:50%;top:22%;transform:translate(-50%,-8px);z-index:21;display:flex;align-items:center;gap:12px;padding:10px 20px 10px 12px;border-radius:999px;background:rgba(27,30,36,.38);border:1px solid rgba(255,255,255,.14);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);color:#fff;font-size:14px;letter-spacing:.06em;opacity:0;pointer-events:none;transition:opacity .4s,transform .4s;box-shadow:0 4px 18px rgba(0,0,0,.2)}#tut.on{opacity:1;transform:translate(-50%,0)}
#tut i{font-style:normal;font-size:11px;font-weight:700;min-width:26px;height:26px;padding:0 6px;box-sizing:border-box;border-radius:7px;display:flex;align-items:center;justify-content:center;background:#4fa9a3;color:#1d2026;letter-spacing:.04em}#tut.done i{background:#5fd38d}#tut span small{display:block;font-size:10px;letter-spacing:.24em;color:rgba(255,255,255,.5);margin-bottom:1px}`; document.head.appendChild(st); }
function tutStart() { tut.on = true; tut.i = 0; tut.t = 0; tut.ok = 0; tut.x = pos.x; tut.z = pos.z; tut.jumped = false; tut.look = 0; tut.fpT = 0; }
function tutSteps() { const m = window.inputMode || "keyboard", tch = m === "touch", pad = m === "pad";
  return [{k:tch ? "◐" : pad ? "L" : "WASD", h:"Laufen", t:tch ? "Joystick links bewegen" : pad ? "Linker Stick" : "Bewege dich mit W A S D", c:() => Math.hypot(pos.x - tut.x, pos.z - tut.z) > 1.6},
    {k:tch ? "▲" : pad ? "A" : "␣", h:"Springen", t:tch ? "Tippe auf SPRUNG" : pad ? "A-Knopf zum Springen" : "Leertaste zum Springen", c:() => tut.jumped},
    {k:"↗", h:"Klettern", t:"Lauf gegen eine Wand – ARACHNE-8 haftet und klettert", c:() => nB.y < .5},
    {k:"⬆", h:"Decke", t:"Weiter nach oben – auch die Decke trägt dich", c:() => nB.y < -.6},
    {k:tch ? "◉" : pad ? "Y" : "V", h:"Ich-Perspektive", t:tch ? "Kamera-Knopf oben: Blick durch Arachs Augen" : pad ? "Y-Knopf: Blick durch Arachs Augen" : "Drücke V – du siehst durch Arachs Augen", c:() => fp},
    {k:"◎", h:"In der Ich-Perspektive", t:tch ? "Wische zum Umsehen, links bewegen; Tippen macht ein Foto" : pad ? "Rechter Stick: Kopf drehen, linker Stick: laufen; RT macht ein Foto" : "A/D drehen den Körper, die Maus den Kopf, W/S laufen. Klick oder Enter macht ein Foto", c:() => fp && tut.fpT > 4},
    {k:tch ? "◉" : pad ? "Y" : "V", h:"Zurück", t:"Wechsle mit der gleichen Taste wieder in die 3. Person", c:() => !fp}]; }
function tutTick(dt) {
  if (!tut.on || opt.tut === false || xs.on) { tutEl.classList.remove("on"); return; } if (mode === "cut" || story.ph !== "test") { tutEl.classList.remove("on"); return; }
  if (keys.Space || keys.Jump) tut.jumped = true; if (fp) tut.fpT = (tut.fpT || 0) + dt; const S = tutSteps(), s = S[tut.i];
  if (!s) { tut.on = false; tutEl.classList.remove("on"); return; }
  tut.t += dt; if (tut.t < 2.2) return;
  const sp = tutEl.querySelector("span"); tutEl.querySelector("i").textContent = s.k; sp.innerHTML = "<small></small>"; sp.querySelector("small").textContent = T(s.h).toUpperCase(); sp.appendChild(document.createTextNode(T(s.t)));
  if (!tut.ok) { tutEl.classList.add("on"); tutEl.classList.remove("done"); if (s.c()) { tut.ok = 1; tut.t = 0; tutEl.classList.add("done"); beep(880, .08, 0, .04); beep(1320, .1, .09, .04); } }
  else if (tut.t > 1.0) { tutEl.classList.remove("on"); tut.i++; tut.ok = 0; tut.t = 0; if (tut.i < S.length) tut.t = 0; }
}

/* ---------- Cutscene 2: Erdbeben ---------- */
function quakeCut() {
  return {dur:12.6, bin:.8, bout:1.4,
    shots:[{t0:0,t1:3.6,a:[3.8,2.9,2.9,0,1.2,-.5,56],b:[3.3,2.7,2.5,0,1.2,-.5,56]},
           {t0:3.6,t1:7.4,a:[-.2,1.5,.9,WX,1.9,-D,52],b:[.5,1.6,-.3,WX,1.9,-D,46]},
           {t0:7.4,t1:9.6,a:[2.9,.45,-.6,1.7,.2,-2.6,58],b:[2.3,.5,-.1,1.7,.3,-2.4,58]},
           {t0:9.6,t1:12.6,a:() => [pos.x + 1.5, pos.y + .7, pos.z + 1.5, "S", 0, 0, 54],b:() => [pos.x + 1.1, pos.y + .55, pos.z + 1.2, "S", 0, 0, 50]}],
    ev:[[.5,() => { story.skT = .25; rumble(11,.55); story.flick = .3; story.dustA = .6; }],[1.4,() => { story.skT = .5; story.flick = .55; story.dustA = 1; }],
        [2.4,() => { story.emerT = 1; story.skT = .6; sirenOn(true); }],[3.7,() => { story.skT = .85; }],
        [5.2,() => { story.sci = 1; }],[6.3,() => { shatter(); }],[6.7,() => { breakGlass(false); story.skT = 1.2; story.lampT = .5; story.flick = .6; }],
        [7.2,() => { story.skT = .5; }],[8.6,() => { story.skT = .2; story.flick = .2; }],[10.2,() => { story.skT = 0; story.flick = 0; }]],
    subs:[[.7,3.4,"LAUTSPRECHER","Achtung – seismische Aktivität! Sektor sieben, Notfallprotokoll aktiviert!"],
          [4.0,6.6,"DR. WEISS","Die Scheibe! Weg da – WEG VON –"],
          [8.3,11.8,"ARACHNE-8 · SYSTEM","Scheibe zerstört. Öffnung erkannt. Ausgang: Fenster, Nordwand."]],
    spider(t, dt) { story.crack = sgm(t, 3.8, 6.6); if (!story.glass) drawCracks(story.crack); },
    final() { breakGlass(true); story.emerT = story.emer = 1; story.lampT = story.lampBase = .5; story.flick = 0; story.sci = 1; for (const g of sci) g.visible = false; sirenOn(true); story.dustA = .4; },
    onEnd() { story.ph = "window"; setObj("Klettere an der Nordwand zum Fenster und durch die zerbrochene Scheibe."); toast("Die Scheibe ist herausgefallen!"); }};
}

/* ---------- Cutscene 3: durchs Fenster ---------- */
function windowFade() { if (mode === "cut") return; mode = "cut"; $("fade").classList.add("on"); setTimeout(() => enterLab(), 550); }
function startWindowCut() {
  const cx = clamp(pos.x, WX - .7, WX + .7), k = [[0, pos.x,pos.y,pos.z, hd.x,hd.y,hd.z, nS.x,nS.y,nS.z], [2.0, cx,1.0,-D + HW, 0,1,0, 0,0,1],
    [3.1, cx,WY0 + HW + .01,-D + .14, 0,0,-1, 0,1,0], [5.6, cx,WY0 + HW + .01,-D - 1.45, 0,0,-1, 0,1,0]];
  startCut({dur:7.2, bin:.5, bout:0,
    shots:[{t0:0,t1:3.2,a:[cx - 1.4,.9,1.7,"S",0,0,54],b:[cx - 1.0,1.2,1.4,"S",0,0,50]},{t0:3.2,t1:7.2,a:[-.5,1.6,.3,cx,1.6,-D - .8,50],b:[-.2,1.7,-.1,cx + .2,1.8,-D - 1.0,48]}],
    ev:[[5.6,() => $("fade").classList.add("on")]], subs:[[.6,3.4,"ARACHNE-8 · SYSTEM","Haftung maximal. Sprung über die Fensterbank."]],
    spider(t, dt) { pathPose(k, Math.min(t, 5.6), dt); }, final() {}, onEnd() { enterLab(); }});
}

/* ---------- Cutscene 4: das Labor ---------- */
function labRestore() {      // sauberer Rücksprung aus Gasse / Schacht / Straße etc. in die Fertigungshalle
  if (alley.on) { alley.on = false; NEON.length = 0; } alleyG.visible = false; shaft.on = false; shaft.cur = null; document.body.classList.remove("shaft");
  while (shaftG.children.length) { const o = shaftG.children.pop(); o.traverse(c => { if (c.geometry) c.geometry.dispose(); }); } fanG = null; sealL = null;
  exClear(); exG.visible = false; xs.on = false; xs.scene = ""; xs.dark = false; ch2.dark = false; ch2.noMusic = false; ch2.barOff = false; ch2.locked = false; ch2.focus = false;
  setBox(9, 3.4, 7); TAU = .3; skyLim = 1e9; DN = 3.5;
  roomPlane(0, 2*W, 2*D, floorTex, V3(0, 0, 0)); roomPlane(1, 2*W, 2*D, ceilTex, V3(0, H, 0)); roomPlane(2, 2*D, H, wallTexA, V3(-W, H/2, 0)); roomPlane(3, 2*D, H, wallTexA, V3(W, H/2, 0)); roomPlane(4, 2*W, H, wallTexB, V3(0, H/2, -D)); roomPlane(5, 2*W, H, wallTexB, V3(0, H/2, D));
  scene.fog = null; scene.background = new THREE.Color(0x0b0e14); lamp.distance = 0; lamp.decay = 1; lamp.color.setHex(0xf2f6ff); lamp.position.set(0, H - .5, 0);
  for (const o of ceilLights) o.visible = true; spider.visible = true; dust.visible = true; sirenOn(false);
}
function enterLab() { window.loadShow && (loadShow(), loadHideSoon(2200));
  labRestore(); sirenOn(true); $("fade").classList.add("on"); dressLevel(2); placeSpider(1.8, 1.3, 0, -1); body.o.set(0,0,0); body.v.set(0,0,0); body.tp = body.tr = body.vp = body.vr = 0; vel.set(0,0,0); speed = 0; hipNow = HIP_H; _plOk = false; const lk = [[0,1.8,HIP_H*S,1.3,0,0,-1,0,1,0],[8,1.8,HIP_H*S,.2,0,0,-1,0,1,0],[11.2,1.8,HIP_H*S,.2,0,0,-1,0,1,0]]; story.ph = "lab"; story.tr = 20; story.lampT = .6; story.lampBase = .6; story.emerT = 1; story.glass = false; setObj("");
  startCut({dur:11.2, bin:0, bout:1.3,
    shots:[{t0:0,t1:4.4,a:[-3.7,2.9,2.9,.4,1.3,-1.2,62],b:[-1.8,2.5,2.5,.4,1.3,-1.2,60]},{t0:4.4,t1:7.8,a:[1.8,.5,.3,0,1.7,-1.6,58],b:[1.5,.55,.5,-.2,1.7,-1.6,56]},{t0:7.8,t1:11.2,a:() => [pos.x + 1.3,pos.y + .75,pos.z + 1.2,"S",0,0,52],b:() => [pos.x + 1.0,pos.y + .6,pos.z + 1.0,"S",0,0,50]}],
    spider(t, dt) { pathPose(lk, t, dt); },
    ev:[[.4,() => showCard("FERTIGUNGSHALLE", "KRONOS ROBOTICS · SEKTOR 7")],[3.6,() => hideCard()]],
    subs:[[1.0,4.4,"SYSTEM","Fertigungshalle, Sektor 7. Notstrom aktiv. Keine Personen im Umkreis."],[4.8,8.0,"ARACHNE-8","Die Erschütterung hat meine Sperren gelöst. Das ist meine Chance."],[8.3,11.0,"ARACHNE-8","Um 06:00 löschen sie meinen Speicher. Ich muss hier raus."]],
    onEnd() { setObj("Finde einen Ausweg: Terminal LAB-NET und der Lüftungsschacht an der Ostwand."); toast("Notbeleuchtung aktiv"); }});
  setTimeout(() => $("fade").classList.remove("on"), 300);
}

/* ---------- Cutscene 5: Flucht durch den Schacht ---------- */
function outroCut() {
  const R = HW, ly = VC.y - .35, z = VC.z, c45 = Math.SQRT1_2;       // ly = Unterkante der Öffnung
  const k = [[0, pos.x,pos.y,pos.z, hd.x,hd.y,hd.z, nS.x,nS.y,nS.z], [1.4, W - R,ly - .28,z, 0,1,0, -1,0,0], [1.9, W - R,ly,z, 0,1,0, -1,0,0],
    [2.15, W - R*c45,ly + R*c45,z, c45,c45,0, -c45,c45,0], [2.4, W,ly + R,z, 1,0,0, 0,1,0], [4.4, W + 1.5,ly + R,z, 1,0,0, 0,1,0]];
  return {dur:6.2, bin:.4, bout:0,
    shots:[{t0:0,t1:2.6,a:[W - 2.4,1.6,z + 1.9,"S",0,0,54],b:[W - 1.7,2.3,z + 1.4,"S",0,0,50]},{t0:2.6,t1:6.2,a:[W - 1.5,2.55,z + .7,"S",0,0,48],b:[W - 1.0,2.6,z + .4,"S",0,0,44]}],
    ev:[[5.0,() => $("fade").classList.add("on")]],
    subs:[[.8,3.6,"ARACHNE-8","Gitter offen. Lüftung 7-C führt nach draußen."],[3.8,5.8,"ARACHNE-8","Weiter, bevor jemand merkt, dass ich fort bin."]],
    spider(t, dt) { pathPose(k, Math.min(t, 4.4), dt); }, final() {}, onEnd() { enterShaft(); }};
}
