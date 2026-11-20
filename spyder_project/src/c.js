const L1 = 1.2, L2 = 1.75, COXA = 0.25;       // Oberschenkel, Schienbein, Hüftversatz
const REST_R = 1.8;                            // Ruhe-Reichweite der Füße (horizontal ab Hüfte)
const HIP_H = 1.0;                             // Standhöhe
const MAX_WALK = 2.6, MAX_SPRINT = 6.6;

// Prozedurale Studio-Umgebung für Metallreflexionen
const ev = document.createElement("canvas"); ev.width = 512; ev.height = 256;
const ex = ev.getContext("2d");
const eg = ex.createLinearGradient(0,0,0,256);
eg.addColorStop(0,"#b9c4d0"); eg.addColorStop(.47,"#eef1f4"); eg.addColorStop(.5,"#77746d"); eg.addColorStop(1,"#3a3935");
ex.fillStyle = eg; ex.fillRect(0,0,512,256);
ex.fillStyle = "rgba(255,246,228,.95)"; ex.beginPath(); ex.arc(150,58,22,0,7); ex.fill();
ex.fillStyle = "rgba(255,255,255,.55)"; ex.fillRect(330,40,90,26); ex.fillRect(20,90,60,16);
const envTex = new THREE.PMREMGenerator(renderer).fromEquirectangular(new THREE.CanvasTexture(ev)).texture;
const mat = (c, m=.55, r=.45) => new THREE.MeshStandardMaterial({color:c, metalness:m, roughness:r, envMap:envTex, envMapIntensity:.9});
const matBody = mat(0x16254a, .65, .38), matDark = mat(0x0d1632, .5, .5), matLight = mat(0xdde4f2, .15, .36);
const matBrass = mat(0x3c8680, .6, .4), matRubber = mat(0x111214, 0, .9);
const matLens = new THREE.MeshStandardMaterial({color:0x0e0e10, emissive:0x3c8680, emissiveIntensity:.5, roughness:.2, metalness:.3});

const spider = new THREE.Group(); spider.rotation.order = "YXZ"; scene.add(spider);
function add(geo, m, x=0, y=0, z=0, parent=spider) { const o = new THREE.Mesh(geo, m); o.position.set(x,y,z); o.castShadow = true; o.receiveShadow = true; parent.add(o); return o; }

// Körper
const rot8 = Math.PI/8;
add(new THREE.CylinderGeometry(.62,.7,.28,8), matBody).rotation.y = rot8;                       // Chassis
add(new THREE.CylinderGeometry(.665,.665,.035,8), matBrass, 0,.02,0).rotation.y = rot8;         // Messingnaht
add(new THREE.CylinderGeometry(.58,.5,.12,8), matDark, 0,-.19,0).rotation.y = rot8;             // Unterboden
{ const pts = []; for (let i=0;i<=12;i++) { const a = i/12*Math.PI/2; pts.push(new THREE.Vector2(.57*Math.cos(a)+.002, .26*Math.sin(a))); }
  const dome = add(new THREE.LatheGeometry(pts, 32), matLight, 0,.14,0); dome.scale.set(1,1,1.1); }  // Rückenschild
add(new THREE.TorusGeometry(.56,.02,8,40), matBrass, 0,.145,0).rotation.x = Math.PI/2;
for (let i = 0; i < 8; i++) { const a = i/8*Math.PI*2 + rot8; add(new THREE.CylinderGeometry(.018,.018,.03,8), matBrass, Math.cos(a)*.5,.19,Math.sin(a)*.5*1.1); }
add(new THREE.BoxGeometry(.34,.05,.5), matDark, 0,.39,-.05);                                      // Sensorfeld
for (let i = 0; i < 4; i++) add(new THREE.BoxGeometry(.26,.012,.03), matBrass, 0,.418,-.2+i*.1);

const headG = new THREE.Group(); spider.add(headG); const NECK = V3(0,.04,.62), _hq = new THREE.Quaternion(), _he = new THREE.Euler(), _hv = V3();
const addH = (geo, m, x=0, y=0, z=0) => add(geo, m, x, y, z, headG);
function headLook(yaw, pitch) { _hq.setFromEuler(_he.set(pitch, yaw, 0, "YXZ")); headG.quaternion.copy(_hq); headG.position.copy(NECK).sub(_hv.copy(NECK).applyQuaternion(_hq)); }
// Kopf mit Linsenverbund und Tastern
const head = addH(new THREE.SphereGeometry(.3,28,18), matLight, 0,.05,.86); head.scale.set(1,.72,1.05);
addH(new THREE.CylinderGeometry(.13,.14,.3,14), matDark, 0,.03,.58).rotation.x = Math.PI/2;       // Hals
addH(new THREE.BoxGeometry(.5,.13,.2), matDark, 0,.06,.995);                                       // Visierband
addH(new THREE.TorusGeometry(.108,.02,10,28), matBrass, 0,.06,1.1);
addH(new THREE.SphereGeometry(.085,18,14), matLens, 0,.06,1.08).scale.z = .6;
for (const s of [-1,1]) {
  addH(new THREE.SphereGeometry(.04,12,10), matLens, s*.2,.05,1.03);
  addH(new THREE.SphereGeometry(.03,10,8),  matLens, s*.12,.15,1.02);
  const pp = addH(new THREE.CylinderGeometry(.028,.045,.36,12), matBody, s*.15,-.1,1.0); pp.rotation.x = Math.PI/2 + .4;
  addH(new THREE.SphereGeometry(.036,10,8), matBrass, s*.15,-.2,1.16);
  const ant = addH(new THREE.CylinderGeometry(.008,.014,.55,6), matLight, s*.12,.34,.78); ant.rotation.x = -.5;
}

// Kopf-Details: Stirnschale, Wangenplatten, Linsenkranz, Sensorpods, Mandibeln, Lüftung
{ const brow = addH(new THREE.SphereGeometry(.318,28,12,0,Math.PI*2,0,Math.PI*.36), matLight, 0,.075,.86); brow.scale.set(1.02,.74,1.07);
  addH(new THREE.BoxGeometry(.4,.008,.012), matLens, 0,.118,1.095);
  addH(new THREE.TorusGeometry(.135,.012,8,32,Math.PI), matBrass, 0,.06,1.075).rotation.z = Math.PI;
  for (const s of [-1,1]) {
    const ch = addH(new THREE.BoxGeometry(.045,.15,.26), matLight, s*.265,-.0,.95); ch.rotation.y = s*.35;
    addH(new THREE.BoxGeometry(.05,.03,.24), matBrass, s*.268,-.085,.95).rotation.y = s*.35;
    const pod = addH(new THREE.CylinderGeometry(.045,.05,.09,14), matDark, s*.31,.07,.82); pod.rotation.z = Math.PI/2;
    addH(new THREE.CylinderGeometry(.03,.03,.02,12), matLens, s*.362,.07,.82).rotation.z = Math.PI/2;
    for (const [dx,dy] of [[.19,.0],[.165,-.055],[.165,.055]]) addH(new THREE.SphereGeometry(.018,10,8), matLens, s*dx,.06+dy,1.06);
    const fang = addH(new THREE.ConeGeometry(.02,.15,8), matDark, s*.075,-.13,1.12); fang.rotation.x = Math.PI - .5;
    addH(new THREE.BoxGeometry(.012,.02,.1), matBrass, s*.12,.2,.72);
  }
  const dome = addH(new THREE.SphereGeometry(.055,14,10), matLens, 0,.265,.84); dome.scale.y = .6;
  addH(new THREE.TorusGeometry(.06,.01,6,18), matBrass, 0,.255,.84).rotation.x = Math.PI/2;
  for (let i = 0; i < 4; i++) addH(new THREE.BoxGeometry(.2 - i*.025,.01,.014), matDark, 0,.2 - i*.006,.62 + i*.02);
}

// Hinterleib: dunkler Kern, Keramikschale, Rippen, Auslass
const abd = add(new THREE.SphereGeometry(.55,30,20), matBody, 0,.1,-1.0); abd.scale.set(1,.8,1.4);
const shell = add(new THREE.SphereGeometry(.56,30,14,0,Math.PI*2,0,Math.PI*.4), matLight, 0,.1,-1.0); shell.scale.set(1.02,.82,1.43);
add(new THREE.TorusGeometry(.5,.03,8,28), matBrass, 0,.12,-.85).rotation.x = Math.PI/2 - .1;
for (const t of [-.45,-.15,.15,.45]) { const rr = .55*Math.sqrt(1 - (t/.77)**2);
  const rg = add(new THREE.TorusGeometry(rr*1.006,.016,6,32), matBrass, 0,.1,-1.0+t); rg.scale.y = .8; }
add(new THREE.CylinderGeometry(.11,.15,.18,14), matDark, 0,.08,-1.78).rotation.x = Math.PI/2;       // Spinndüse
add(new THREE.TorusGeometry(.11,.015,8,16), matBrass, 0,.08,-1.87);
for (const s of [-1,1]) { const c3 = new THREE.CatmullRomCurve3([V3(s*.32,.06,-.48), V3(s*.42,.22,-.7), V3(s*.34,.22,-.95)]);
  add(new THREE.TubeGeometry(c3, 14, .024, 6, false), matDark); }

// Beine
const UP = new THREE.Vector3(0,1,0);
const ROWZ = [0.5, 0.17, -0.17, -0.5], ANG = [0.78, 0.26, -0.26, -0.78];
const legs = [];
function plate(m) { const o = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), m); o.castShadow = true; spider.add(o); return o; }
function seg(rt, rb, m) { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,1,16), m); o.castShadow = true; spider.add(o); return o; }
for (const s of [-1, 1]) for (let r = 0; r < 4; r++) {
  const hip = new THREE.Vector3(s*.42, 0, ROWZ[r]);
  const leg = {
    side:s, row:r, group:(r + (s>0?1:0)) % 2, hip,
    restLocal:new THREE.Vector3(hip.x + s*Math.cos(ANG[r])*REST_R, 0, hip.z + Math.sin(ANG[r])*REST_R),
    foot:new THREE.Vector3(), from:new THREE.Vector3(), to:new THREE.Vector3(), rest:new THREE.Vector3(),
    stepping:false, t:0, dur:.2, groundY:0,
    P1:new THREE.Vector3(), P2:new THREE.Vector3(), P3:new THREE.Vector3(),
    mCoxa:seg(.1,.1,matDark), mFemur:seg(.082,.066,matBody), mTibia:seg(.055,.03,matBody), mPiston:seg(.022,.022,matBrass),
    mFemPlate:plate(matLight), mTibPlate:plate(matLight), mFerrule:seg(.07,.04,matDark),
    jHip:add(new THREE.CylinderGeometry(.17,.19,.24,16), matDark, hip.x,hip.y,hip.z),
    jHipRing:add(new THREE.CylinderGeometry(.2,.2,.035,16), matBrass, hip.x,hip.y+.13,hip.z),
    jKnee:add(new THREE.CylinderGeometry(.125,.125,.24,16), matDark),
    jKneeCap:add(new THREE.CylinderGeometry(.075,.075,.31,12), matBrass),
    jFoot:add(new THREE.SphereGeometry(.065,10,8), matRubber),
  };
  legs.push(leg);
}

const tmpD = new THREE.Vector3(), tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3();
function setSeg(m, a, b) {
  tmpD.subVectors(b, a); const len = tmpD.length(); if (len < 1e-5) return;
  m.position.set((a.x+b.x)/2, (a.y+b.y)/2, (a.z+b.z)/2); m.scale.set(1, len, 1);
  m.quaternion.setFromUnitVectors(UP, tmpD.multiplyScalar(1/len));
}

// Inverse Kinematik: Hüftdrehung + 2-Gelenk-Bein in der vertikalen Beinebene (Knie oben)
// Panzerplatte entlang eines Segments (Basis: x = Seitennormale, y = Segmentrichtung, z = nach oben/außen)
const _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3(), _n = new THREE.Vector3(), _m4 = new THREE.Matrix4();
function setPlate(m, a, b, nx, nz, w, th, frac, off, start) {
  _y.subVectors(b, a); const len = _y.length(); _y.multiplyScalar(1/len);
  _x.set(nx, 0, nz); _z.crossVectors(_x, _y);
  if (_z.y < 0) { _x.negate(); _z.negate(); }
  _m4.makeBasis(_x, _y, _z); m.quaternion.setFromRotationMatrix(_m4);
  m.position.copy(a).addScaledVector(_y, len*(start + frac/2)).addScaledVector(_z, off);
  m.scale.set(w, len*frac, th);
}
function solveLeg(leg, f) {
  const H = leg.hip;
  let dx = f.x-H.x, dz = f.z-H.z; const dy = f.y-H.y;
  let hd = Math.hypot(dx, dz); if (hd < 1e-4) { dx = leg.side; dz = 0; hd = 1; }
  const ux = dx/hd, uz = dz/hd;
  const r = Math.max(hd - COXA, 0.05);
  const D = Math.hypot(r, dy);
  const Dc = clamp(D, Math.abs(L1-L2)+0.05, L1+L2-0.02);
  const a0 = Math.atan2(dy, r);
  const a1 = a0 + Math.acos(clamp((L1*L1 + Dc*Dc - L2*L2)/(2*L1*Dc), -1, 1));
  const c1 = Math.cos(a1), s1 = Math.sin(a1), c0 = Math.cos(a0), s0 = Math.sin(a0);
  leg.P1.set(H.x+ux*COXA, H.y, H.z+uz*COXA);
  leg.P2.set(leg.P1.x+ux*c1*L1, leg.P1.y+s1*L1, leg.P1.z+uz*c1*L1);
  leg.P3.set(leg.P1.x+ux*c0*Dc, leg.P1.y+s0*Dc, leg.P1.z+uz*c0*Dc);
  legPole(leg);
  setSeg(leg.mCoxa, H, leg.P1);
  setSeg(leg.mFemur, leg.P1, leg.P2);
  setSeg(leg.mTibia, leg.P2, leg.P3);
  leg.jKnee.position.copy(leg.P2); leg.jFoot.position.copy(leg.P3);
  // Hydraulikzylinder parallel zum Oberschenkel / Schienbein
  tmpA.lerpVectors(leg.P1, leg.P2, .18); tmpA.y += .13;
  tmpB.lerpVectors(leg.P2, leg.P3, .22); tmpB.y += .11;
  setSeg(leg.mPiston, tmpA, tmpB);
  // Panzerung, Gelenkgehäuse und Fußaufnahme ausrichten
  const nx = -uz, nz = ux;
  setPlate(leg.mFemPlate, leg.P1, leg.P2, nx, nz, .2, .045, .8, .1, .1);
  setPlate(leg.mTibPlate, leg.P2, leg.P3, nx, nz, .09, .03, .55, .062, .08);
  _n.set(nx, 0, nz);
  leg.jKnee.quaternion.setFromUnitVectors(UP, _n); leg.jKneeCap.quaternion.copy(leg.jKnee.quaternion);
  leg.jKneeCap.position.copy(leg.P2);
  tmpA.subVectors(leg.P3, leg.P2).normalize().multiplyScalar(.2); tmpB.subVectors(leg.P3, tmpA);
  setSeg(leg.mFerrule, tmpB, leg.P3);
}


spider.scale.setScalar(S);
for (const l of legs) { l.type = false; l.land = false; l.restG = V3(); l.err = 0; l.prevLift = 0; }

let ac = null, master, servoG, servoO, fxIn, fxEnv = {};
function initAudio() {
  if (ac) { if (ac.state === "suspended" && !paused) pq(ac.resume()); return; }
  try {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    master = ac.createGain(); master.gain.value = .5; master.connect(ac.destination); fxInit(); sndInit();
    servoO = ac.createOscillator(); servoO.type = "sawtooth"; servoO.frequency.value = 80;
    const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 380;
    servoG = ac.createGain(); servoG.gain.value = 0;
    servoO.connect(lp); lp.connect(servoG); servoG.connect(fxIn); servoO.start();
  } catch (e) { ac = null; }
}
/* Raumklang: Trockensignal + je ein Hall pro Umgebung; Klangfarbe (Peak-Filter) passt sich an */
const ENVS = {lab:{decay:1.15, wet:.2, damp:5200, pre:.012, tone:[2400, 1.0, 0]}, duct:{decay:1.9, wet:.34, damp:3800, pre:.006, tone:[1500, 1.4, 5]},
  alley:{decay:.8, wet:.13, damp:2600, pre:.05, tone:[4500, .8, -3]}, bar:{decay:.45, wet:.14, damp:2200, pre:.008, tone:[3000, .8, -2]}};
function makeIR(sec, damp, pre) {
  const n = Math.floor(ac.sampleRate*sec), b = ac.createBuffer(2, n, ac.sampleRate);
  for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); let lp = 0, a = Math.exp(-6.2832*damp/ac.sampleRate); for (let i = 0; i < n; i++) { const t = i/ac.sampleRate; lp = lp*a + (Math.random()*2 - 1)*(1 - a); d[i] = t < pre ? 0 : lp*Math.pow(1 - i/n, 2.2)*Math.exp(-t*6.9/sec)*2.6; } }
  return b;
}
function fxInit() {
  fxIn = ac.createGain(); fxEnv.tone = ac.createBiquadFilter(); fxEnv.tone.type = "peaking"; fxEnv.tone.frequency.value = 2400; fxEnv.tone.gain.value = 0;
  fxIn.connect(fxEnv.tone); fxEnv.tone.connect(master); fxEnv.send = ac.createGain(); fxEnv.send.gain.value = 1; fxEnv.tone.connect(fxEnv.send); fxEnv.w = {};
  for (const k in ENVS) { const e = ENVS[k], cv = ac.createConvolver(), g = ac.createGain(); cv.buffer = makeIR(e.decay, e.damp, e.pre); g.gain.value = 0; fxEnv.send.connect(cv); cv.connect(g); g.connect(master); fxEnv.w[k] = g; }
}
function fxTick(dt) {
  if (!fxIn) return; const cur = xs.on ? xs.env : alley.on ? (alley.inBar ? "bar" : "alley") : shaft.on ? "duct" : "lab", k = Math.min(1, dt*2.5), rv = opt.reverb;
  for (const n in ENVS) { const g = fxEnv.w[n].gain, tgt = n === cur ? ENVS[n].wet*rv : 0; g.value += (tgt - g.value)*k; }
  const T2 = ENVS[cur].tone; fxEnv.tone.frequency.value += (T2[0] - fxEnv.tone.frequency.value)*k; fxEnv.tone.Q.value = T2[1]; fxEnv.tone.gain.value += (T2[2]*Math.min(1, rv) - fxEnv.tone.gain.value)*k;
}
function tick(vol) { vol *= (typeof opt !== "undefined" && opt.steps !== undefined ? opt.steps : 1);
  if (!ac) return; const t = ac.currentTime;
  const o = ac.createOscillator(), g = ac.createGain(); o.type = "triangle";
  const fm = alley.on ? (alley.inBar ? .85 : .75) : shaft.on ? 1.3 : 1; o.frequency.setValueAtTime((150 + Math.random()*50)*fm, t); o.frequency.exponentialRampToValueAtTime(48*fm, t+.07);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t+.09);
  o.connect(g); g.connect(fxIn); o.start(t); o.stop(t+.1);
  const o2 = ac.createOscillator(), g2 = ac.createGain(); o2.type = "square"; o2.frequency.value = (900 + Math.random()*500)*(shaft.on ? 1.5 : alley.on ? .7 : 1);
  g2.gain.setValueAtTime(vol*.18, t); g2.gain.exponentialRampToValueAtTime(.0001, t+.02);
  o2.connect(g2); g2.connect(fxIn); o2.start(t); o2.stop(t+.03);
}

