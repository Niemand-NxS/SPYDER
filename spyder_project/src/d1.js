
/* ======================= Zustand ======================= */
const WALK = MAX_WALK*S*1.5, SPRINT = MAX_SPRINT*S*1.5, GRAV = 9.8;
const pos = spider.position, vel = V3(), nS = V3(0,1,0), nB = V3(0,1,0), hd = V3(0,0,-1);
const frameQ = new THREE.Quaternion();
let mode = "surf", hipNow = HIP_H, landDip = 0, speed = 0, yawRate = 0, crouch = false;
let camYaw = 0, camPitch = .5, fpPitch = 0, fpYaw = 0, camDist = 2.2, fp = false, zoom = 1, photos = 0, clockT = 0;
const jump = {charge:0, held:false, lock:false};
let jumpBufT = -9, jumpDoneT = -9; const keys = {}, joy = {x:0, y:0, id:null};
const hack = {state:0, i:0, t:0, count:0, tick:0};
const rope = {ox:0, oz:0, vx:0, vz:0, L:1, ax:0, az:0, face:V3(0,0,-1)};
const _t1 = V3(), _t2 = V3(), _t3 = V3(), _a = V3(), _b = V3(), _xa = V3(), _m = new THREE.Matrix4();
const _q1 = new THREE.Quaternion(), _q2 = new THREE.Quaternion();

function toast(s) { s = T(s); const t = $("toast"); t.textContent = s; t.style.opacity = 1; clearTimeout(toast.h); toast.h = setTimeout(() => t.style.opacity = 0, 2600); }

function smoothDir(cur, tgt, k, fb) {
  const ang = Math.acos(clamp(cur.dot(tgt), -1, 1)); if (ang < 1e-4) return cur.copy(tgt);
  _t1.crossVectors(cur, tgt); if (_t1.lengthSq() < 1e-8) _t1.copy(fb); else _t1.normalize();
  return cur.applyAxisAngle(_t1, ang*k).normalize();
}
function fixHd() {
  hd.addScaledVector(nS, -hd.dot(nS));
  if (hd.lengthSq() < 1e-6) { _t2.set(0,0,-1); if (Math.abs(nS.z) > .9) _t2.set(1,0,0); hd.copy(_t2).addScaledVector(nS, -_t2.dot(nS)); }
  hd.normalize();
}
function orient() {
  fixHd(); _xa.crossVectors(nS, hd).normalize(); _m.makeBasis(_xa, nS, hd);
  spider.quaternion.setFromRotationMatrix(_m); spider.updateMatrixWorld(true);
}
function updateFrame(dt, rate, tgt) {
  tgt = tgt || nS; _t3.set(0,1,0).applyQuaternion(frameQ);
  if (_t3.dot(tgt) > -.9999) _q1.setFromUnitVectors(_t3, tgt); else _q1.setFromAxisAngle(_t2.set(1,0,0).applyQuaternion(frameQ), Math.PI);
  _q2.copy(frameQ).premultiply(_q1); frameQ.slerp(_q2, 1 - Math.exp(-dt*rate)).normalize();
}

function reset() {
  vel.set(0,0,0); nS.set(0,1,0); nB.set(0,1,0); hd.set(0,0,-1); frameQ.identity();
  mode = "surf"; jump.charge = 0; jump.held = false; jump.lock = false; hipNow = HIP_H; landDip = 0; yawRate = 0; camYaw = 0; crouch = false;
  hack.state = 0; speed = 0;
  if (typeof ropeLine !== "undefined") { ropeLine.visible = false; cable.visible = false; }
  pos.set(0, HIP_H*S, 2.0); orient();
  for (const l of legs) { l.type = false; l.land = false; l.stepping = false; l.rest.copy(l.restLocal); spider.localToWorld(l.rest); groundPoint(l.rest, nS, l.foot); }
}

/* ======================= Schrittlogik (Oberflächen-unabhängig) ======================= */
/* Knie-Ausweichen: Das Knie liegt normalerweise senkrecht über der Hüfte-Fuß-Linie. Schneidet ein Beinsegment einen Block, wird die Beugeebene
   um die Hüfte-Fuß-Achse gedreht (Pol-Winkel), bis kein Segment mehr im Körper steckt. Gibt es keine Lösung, setzt legCheck einen neuen Schritt. */
const _pe = V3(), _pv = V3(), _pa = V3(), POLES = [0, .4, -.4, .8, -.8, 1.2, -1.2, 1.7, -1.7, 2.2, -2.2];
function segHit(a, b) {
  for (let t = .2; t < .9; t += .2) { _pe.lerpVectors(a, b, t); spider.localToWorld(_pe);
    for (const k of blocks) if (_pe.x > k.x0 + .005 && _pe.x < k.x1 - .005 && _pe.y > k.y0 + .005 && _pe.y < k.y1 - .005 && _pe.z > k.z0 + .005 && _pe.z < k.z1 - .005) return true; }
  return false;
}
function legPole(l) {
  if (l.type || !blocks.length) { l.phi = 0; l.polFail = false; return; }
  const P1 = l.P1, P2 = l.P2, P3 = l.P3; _pv.copy(P2).sub(P1); _pa.copy(P3).sub(P1); if (_pa.lengthSq() < 1e-8) return; _pa.normalize();
  const rot = ph => { const c = Math.cos(ph), s = Math.sin(ph), k = _pa.dot(_pv); return V3().copy(_pv).multiplyScalar(c).addScaledVector(_pa.clone().cross(_pv), s).addScaledVector(_pa, k*(1 - c)).add(P1); };
  let tgt = 0, ok = false; const pp = V3(); const cur = l.tgtPhi || 0, fr = ph => { pp.copy(ph === 0 ? P2 : rot(ph)); return !segHit(P1, pp) && !segHit(pp, P3); };
  if (fr(0)) { l.free0 = (l.free0 || 0) + 1; if (cur === 0 || l.free0 > 14) { tgt = 0; ok = true; } else { tgt = cur; ok = true; } }   // zurück zur Normalstellung erst nach 14 freien Frames
  else { l.free0 = 0; if (cur !== 0 && fr(cur)) { tgt = cur; ok = true; } else for (const ph of POLES) { if (fr(ph)) { tgt = ph; ok = true; break; } } }
  l.tgtPhi = tgt;
  l.polFail = !ok; l.phi = (l.phi || 0); const dd = tgt - l.phi; l.phi += Math.max(-.2, Math.min(.2, dd));
  if (Math.abs(l.phi) > 1e-3) P2.copy(rot(l.phi));
}
/* Bein-Plausibilität: Ziel muss erreichbar sein, auf der eigenen Körperseite liegen, Nachbarbeine nicht kreuzen oder berühren;
   danach wird das Ziel neu auf die Fläche gesetzt. Reicht nichts davon, nimmt das Bein seine Ruheposition. */
const _ls = new THREE.Vector3(), _lw = new THREE.Vector3();
function legSane(l) {
  _ls.copy(l.to); spider.worldToLocal(_ls); const hp = l.hip, sd = l.side, REACH = (L1 + L2)*.9, MINX = .9;
  let ch = false;
  if ((_ls.x - hp.x)*sd < MINX*.5 || _ls.x*sd < MINX) { _ls.x = sd*Math.max(Math.abs(_ls.x), Math.abs(hp.x) + MINX); ch = true; }   // nicht unter den Körper / auf die andere Seite
  for (const m of legs) if (m !== l && m.side === sd && Math.abs(m.row - l.row) === 1) {                                        // nicht über oder durch das Nachbarbein
    const o = m.stepping ? m.to : m.foot; _lw.copy(o); spider.worldToLocal(_lw); const gap = .55, dir = Math.sign(l.restLocal.z - m.restLocal.z) || 1;
    if ((_ls.z - _lw.z)*dir < gap && Math.hypot(_ls.x - _lw.x, _ls.z - _lw.z) < 1.2) { _ls.z = _lw.z + dir*gap; ch = true; } }
  const dx = _ls.x - hp.x, dz = _ls.z - hp.z, dy = _ls.y - hp.y, hd = Math.hypot(dx, dz) - COXA;                                // Reichweite (Hüfte → Fuß)
  const rr = Math.hypot(Math.max(hd, 0), dy);
  if (rr > REACH) { const k = REACH/rr, nx = hp.x + dx*k, nz = hp.z + dz*k, ny = hp.y + dy*k; _ls.set(nx, ny, nz); ch = true; }
  if (!ch) return;
  _lw.copy(_ls); spider.localToWorld(_lw); l.toWrap = surfaceGrip(_lw, l.to);
  _ls.copy(l.to); spider.worldToLocal(_ls); const e = Math.hypot(Math.max(Math.hypot(_ls.x - hp.x, _ls.z - hp.z) - COXA, 0), _ls.y - hp.y);
  if (e > (L1 + L2)*.97) { l.to.copy(l.restG); l.toWrap = l.wrapped; }                                                                                   // Notausgang: Ruheposition
}
// nach der IK: Fuß wirklich am Boden? Knie / Schienbein im Block? → sofort neuer, höherer Schritt
const _kw = new THREE.Vector3();
function legCheck() {
  if (mode !== "surf") return;
  for (const l of legs) { if (l.stepping || l.type) continue;
    _kw.copy(l.P3); const fl = l.foot; _lw.copy(fl); spider.worldToLocal(_lw);
    const off = _kw.distanceTo(_lw), kneeIn = !!l.polFail && !l.wrapped;
    const bad = off > .35 || kneeIn; l.bad = bad ? (l.bad || 0) + 1 : 0; const nowT = performance.now();
    if (bad && l.bad > 8 && (l.tl || 0) > .15 && nowT - (l.ckT || 0) > 700) { l.ckT = nowT; l.bad = 0; l.hs = kneeIn ? 1.7 : 1.2; l.rest.copy(l.restLocal); spider.localToWorld(l.rest); l.wrapped = surfaceGrip(l.rest, l.restG); l.stepping = true; l.land = false; l.t = 0; l.dur = .16; l.from.copy(l.foot); l.to.copy(l.restG); legSane(l); l.tl = 0; }
  }
}
function startStep(l, dur, lead) {
  _a.copy(l.rest).sub(pos).applyAxisAngle(nS, yawRate*dur);
  _b.copy(pos).add(_a).addScaledVector(vel, dur);
  if (speed > .15*S) _b.addScaledVector(vel, lead/speed);
  l.stepping = true; l.land = false; l.t = 0; l.dur = dur; l.from.copy(l.foot); l.toWrap = surfaceGrip(_b, l.to); if (_b.distanceTo(l.to) > hipNow*S*2.2) { l.to.copy(l.restG); l.toWrap = l.wrapped; }
  legSane(l);
}
/* Jedes Bein hat sein eigenes kleines neuronales Netz (13 Eingänge → 14 tanh → 4 Ausgänge), offline trainiert.
   Eingaben: eigener Fußfehler, Fuß hinter/vor dem Körper, Tempo, Drehrate, Fehler + Schrittstatus der drei Nachbarbeine,
   Zahl der Beine in der Luft, Zeit seit der Landung, Standflag. Ausgaben: Abheben, Vorhalt, Dauer, Hubhöhe.
   Harte Sicherheitsregeln (Mindestzahl Standbeine, Notschritt bei zu großem Fehler) bleiben außerhalb des Netzes. */
const LEGNN = [[-1.377,0.728,0.877,0.879,-0.395,0.748,-0.711,0.412,0.708,0.841,0.896,-0.532,0.146,1.023,0.009,0.017,-0.064,-0.012,-0.011,-0.52,-0.057,-0.79,-0.294,-0.054,0.71,0.055,0.188,-0.23,-0.816,0.33,-0.07,-0.39,-0.48,0.567,-0.674,0.284,0.042,0.359,-1.286,-1.088,-0.14,-1.132,0.12,0.306,-0.23,-0.058,0.293,0.93,-0.164,-0.14,1.19,0.267,-0.331,-0.549,-0.274,0.233,0.257,-0.5,-0.177,1.349,-0.834,0.141,0.319,0.836,-0.034,0.773,-0.348,-0.106,0.622,-0.212,0.38,0.899,-0.182,-0.328,0.324,0.346,0.309,-0.014,0.555,-0.106,0.186,-1.133,0.574,-0.012,0.351,-0.417,-0.03,-0.711,0.452,-0.417,-1.315,0.618,-0.08,0.336,-0.548,-0.199,0.56,0.353,-0.271,0.018,-0.042,-0.228,0.365,0.121,0.566,0.558,0.45,0.606,-0.292,-0.55,3.612,-0.119,-0.183,-0.31,0.06,-0.41,0.403,-0.115,0.352,0.639,0.565,0.12,-0.332,-0.335,3.429,-0.202,0.271,-0.125,-0.006,-0.71,-0.499,0.693,0.423,0.503,0.574,-0.039,1.613,0.197,3.729,-0.065,-0.068,-0.147,-0.073,-0.129,0.134,0.896,-0.17,0.462,0.916,0.322,-0.032,-0.581,-0.037,0.133,-0.496,-0.171,-0.217,0.34,0.17,1.243,-0.282,0.537,0.872,-0.614,0.953,-0.805,-0.247,-0.242,0.228,0.178,0.135,0.14,0.131,-0.074,-0.058,-0.434,0.144,0.741,0.372,0.13,-0.016,-0.37,0.781,-0.201,-0.845,-0.908,0.034,0.296,1.382,0.326,0.445,0.432,-0.004,-0.334,-2.096,-0.888,-1.77,-0.239,0.304,-0.08,3.928,0.112,-0.163,0.024,1.937,-0.151,0.424,0.031,2.272,-0.238,0.086,-0.035,-1.057,-0.379,0.031,-0.009,-0.602,0.489,-0.146,-0.257,-2.895,-0.171,0.099,-0.095,-0.586,-0.318,0.235,0.145,-0.162,-0.092,-0.318,0.834,0.351,0.107,0.31,-0.098,0.169,0.033,0.02,-0.094,0.477,-0.049,-0.186,-0.56,-3.147,-0.055,-0.06,-0.014,1.935,-0.332,-0.08,-0.288,-0.618,0.008,-0.026,0.171],[-0.552,-1.365,-0.064,0.505,-0.979,0.597,1.354,1.012,1.16,0.281,-1.24,0.202,-1.248,-0.116,0.156,-0.256,0.088,0.432,0.083,-0.037,-0.179,0.055,0.054,0.102,0.032,0.269,-0.119,0.453,1.295,-0.126,-0.437,-0.288,-0.298,0.264,-0.077,0.765,-0.208,0.205,-0.079,-0.179,0.279,1.334,0.167,0.167,-0.673,-0.504,-0.625,0.002,0.186,-0.049,-0.226,0.964,-0.305,0.039,0.325,0.055,-0.223,-0.276,-0.226,0.286,-0.234,-0.818,0.653,0.231,-0.008,-0.022,1.028,-0.377,0.049,0.182,-0.079,0.21,-0.751,0.998,-0.551,-0.31,-0.915,-0.613,0.169,-0.474,0.346,-0.183,-0.002,0.537,0.031,-1.892,-1.094,0.852,0.905,-0.71,-0.296,-0.365,0.052,-0.952,-0.491,-0.081,-0.065,0.272,0.256,-0.861,-0.526,0.263,0.408,-2.955,1.42,-0.936,0.026,-0.004,0.572,-0.299,-0.115,0.985,-0.171,0.418,-0.199,0.285,0.576,-3.014,-0.881,-0.029,0.097,0.238,0.305,-0.657,-0.18,0.877,-0.006,-0.151,0.279,0.489,-0.041,-3.078,-0.943,0.218,-0.027,0.318,0.153,-0.026,-0.039,1.014,-0.34,-0.888,-0.047,0.106,0.248,-0.128,-0.422,0.474,0.099,-0.021,-0.029,-0.192,-0.047,-0.082,-0.356,-1.456,0.025,1.001,0.257,0.228,0.087,0.333,-0.081,0.37,-0.057,-0.725,0.331,-0.224,-0.178,0.03,-0.918,0.182,-0.241,0.24,0.23,0.254,-0.377,0.003,-0.098,-0.275,0.284,0.775,0.09,-0.498,-0.61,0.335,0.192,1.003,-0.413,-0.412,-2.408,0.045,0.975,-0.274,3.205,0.195,-0.597,0.498,-0.027,0.127,0.574,-0.122,0.312,-0.475,-0.065,0.504,-0.81,0.057,-0.572,-0.121,-0.215,0.469,-1.357,0.119,0.099,0.005,2.709,0.11,-0.077,-0.041,1.613,-0.07,-0.073,-0.092,1.327,-0.001,-0.086,0.005,1.854,0.121,-0.666,0.013,-0.369,0.002,0.044,-0.074,-2.403,0.088,0.026,-0.017,-0.078,-0.187,-0.042,-0.025,-1.652,0.021,-0.469,0.053,-0.622,0.224,-0.0,-0.055,-0.205,0.12,0.042,0.205],[0.064,0.876,0.83,-1.772,-0.131,1.479,-0.261,0.16,-1.322,0.902,1.336,-0.891,1.303,-2.023,0.009,0.655,-0.203,-0.003,-0.07,0.029,-0.028,0.175,-0.325,-0.14,-0.116,0.2,0.056,0.057,-0.815,-1.393,0.869,0.174,1.541,0.005,-0.114,-0.759,-0.199,0.225,-0.428,-1.652,0.512,0.227,-0.409,-0.276,0.816,0.156,0.06,0.197,-0.641,-0.006,-0.61,0.368,-0.061,-0.317,-0.091,-0.328,-0.806,-1.113,0.803,-0.09,-0.03,-0.572,0.074,-0.296,-0.873,0.186,-0.482,0.279,0.051,0.035,-1.394,0.065,-0.242,-0.164,0.018,-0.533,-0.328,-0.32,-1.164,-0.176,0.704,0.187,-0.162,1.436,0.23,-0.816,-0.214,-0.27,0.265,-0.553,-0.627,-0.124,0.046,0.186,-0.613,-0.033,0.018,-0.178,-0.901,0.076,0.389,-0.497,-0.055,-2.554,-0.099,-0.536,-0.801,0.17,-0.611,-0.345,0.002,0.728,0.183,1.02,0.891,-0.543,0.096,-2.551,-0.364,-0.834,-0.43,0.626,-0.8,-0.246,-0.14,0.445,-0.022,-0.094,0.03,-0.508,-0.175,-2.583,-0.326,-0.107,-0.352,0.706,-0.79,-0.745,-0.059,0.852,0.404,-0.874,0.581,0.11,-0.973,0.01,0.609,-0.628,-0.48,0.415,-0.568,-0.445,0.682,-0.21,-0.208,-1.097,0.37,0.062,0.101,0.285,-0.199,-0.555,-1.182,0.168,-0.092,0.102,-0.343,0.025,-0.43,0.234,0.399,0.132,-0.475,-0.177,-0.289,-1.45,-1.126,0.225,-0.296,-0.321,0.313,-0.147,-0.538,-0.391,0.511,5.02,-0.355,-0.164,-0.205,-0.698,-0.396,0.124,-0.504,-0.263,-2.675,0.523,-0.361,-0.17,-0.224,-0.229,-0.232,0.023,0.119,0.031,-0.282,0.145,-0.264,0.163,-2.207,0.036,0.031,0.015,0.207,0.18,-0.116,0.178,2.209,-0.213,0.037,0.059,-0.302,0.285,-0.254,-0.456,-0.315,0.043,-0.145,-0.597,0.355,-0.561,-0.079,0.182,0.336,-0.28,0.078,-0.492,1.729,-0.274,-0.154,-0.121,-0.228,-0.271,0.222,-0.335,1.301,0.436,0.098,0.07,-1.8,-0.064,0.137,-0.067,0.048,0.029,0.012,0.302],[0.853,-1.48,0.769,-1.33,0.706,-0.346,0.127,0.186,-1.903,2.849,-0.771,-1.736,-0.995,0.692,-0.48,0.106,-0.017,0.128,0.135,-0.016,-0.154,-0.149,0.12,-0.043,-0.073,0.003,-0.035,-0.03,0.245,0.159,0.222,0.053,0.564,-1.065,0.22,0.395,-0.175,0.386,0.686,-0.173,0.388,-0.548,0.174,0.065,0.059,0.21,0.609,0.118,0.374,0.555,-0.157,0.139,0.358,-0.321,-0.099,0.03,0.352,-0.817,-0.484,0.568,0.776,-0.028,-0.602,1.023,0.771,0.067,0.047,1.251,-1.342,-0.054,-0.152,1.907,1.493,0.292,0.321,0.021,-0.403,0.251,0.98,0.128,-0.004,0.188,0.779,-0.162,-0.102,-0.354,-0.245,-0.508,0.057,0.12,-0.413,1.064,0.193,-3.005,-0.125,-0.27,0.447,0.04,0.303,-1.653,-0.894,1.496,-0.169,-0.057,-1.92,0.51,1.496,0.118,-0.486,-0.322,0.942,0.304,0.912,1.749,-0.859,1.498,-0.198,-0.112,-2.35,0.588,-0.986,-0.166,-0.408,0.138,0.645,0.416,0.041,-0.326,-0.765,1.588,0.176,-0.091,-2.837,0.723,-1.138,0.216,-0.395,0.748,0.977,0.127,0.173,0.031,-0.365,0.186,0.564,-0.026,-0.409,-0.189,-0.305,0.395,0.091,-0.624,0.066,-0.042,0.1,-0.235,0.02,0.126,0.837,0.025,0.615,0.191,-0.036,-0.019,0.323,-0.246,0.079,-0.148,0.571,-0.01,0.24,-0.18,0.108,0.306,0.54,0.438,0.018,0.391,0.484,-0.314,0.424,-0.267,0.246,-0.217,-1.279,1.24,0.45,0.862,0.897,0.396,0.816,0.122,1.689,0.691,1.122,-0.853,-0.53,-0.065,0.049,-0.102,-1.09,0.131,0.05,-0.038,1.421,-0.074,0.087,-0.026,-1.696,0.144,0.038,0.091,-0.644,-0.45,-0.463,0.469,-0.673,-0.532,0.202,-0.186,1.08,-0.045,-0.014,0.085,-1.127,0.778,0.958,0.607,-0.945,0.074,0.131,0.005,1.791,-0.097,-0.082,-0.064,-1.739,-0.225,-0.328,0.434,-1.716,0.099,0.033,0.051,-1.754,-0.042,0.053,-0.042,0.924,-0.545,-0.349,0.411,-0.389,-0.088,-0.0,0.169],[-1.377,0.728,0.877,0.879,-0.395,0.748,-0.711,0.412,0.708,0.841,0.896,-0.532,0.146,1.023,0.009,0.017,-0.064,-0.012,-0.011,-0.52,-0.057,-0.79,-0.294,-0.054,0.71,0.055,0.188,-0.23,-0.816,0.33,-0.07,-0.39,-0.48,0.567,-0.674,0.284,0.042,0.359,-1.286,-1.088,-0.14,-1.132,0.12,0.306,-0.23,-0.058,0.293,0.93,-0.164,-0.14,1.19,0.267,-0.331,-0.549,-0.274,0.233,0.257,-0.5,-0.177,1.349,-0.834,0.141,0.319,0.836,-0.034,0.773,-0.348,-0.106,0.622,-0.212,0.38,0.899,-0.182,-0.328,0.324,0.346,0.309,-0.014,0.555,-0.106,0.186,-1.133,0.574,-0.012,0.351,-0.417,-0.03,-0.711,0.452,-0.417,-1.315,0.618,-0.08,0.336,-0.548,-0.199,0.56,0.353,-0.271,0.018,-0.042,-0.228,0.365,0.121,0.566,0.558,0.45,0.606,-0.292,-0.55,3.612,-0.119,-0.183,-0.31,0.06,-0.41,0.403,-0.115,0.352,0.639,0.565,0.12,-0.332,-0.335,3.429,-0.202,0.271,-0.125,-0.006,-0.71,-0.499,0.693,0.423,0.503,0.574,-0.039,1.613,0.197,3.729,-0.065,-0.068,-0.147,-0.073,-0.129,0.134,0.896,-0.17,0.462,0.916,0.322,-0.032,-0.581,-0.037,0.133,-0.496,-0.171,-0.217,0.34,0.17,1.243,-0.282,0.537,0.872,-0.614,0.953,-0.805,-0.247,-0.242,0.228,0.178,0.135,0.14,0.131,-0.074,-0.058,-0.434,0.144,0.741,0.372,0.13,-0.016,-0.37,0.781,-0.201,-0.845,-0.908,0.034,0.296,1.382,0.326,0.445,0.432,-0.004,-0.334,-2.096,-0.888,-1.77,-0.239,0.304,-0.08,3.928,0.112,-0.163,0.024,1.937,-0.151,0.424,0.031,2.272,-0.238,0.086,-0.035,-1.057,-0.379,0.031,-0.009,-0.602,0.489,-0.146,-0.257,-2.895,-0.171,0.099,-0.095,-0.586,-0.318,0.235,0.145,-0.162,-0.092,-0.318,0.834,0.351,0.107,0.31,-0.098,0.169,0.033,0.02,-0.094,0.477,-0.049,-0.186,-0.56,-3.147,-0.055,-0.06,-0.014,1.935,-0.332,-0.08,-0.288,-0.618,0.008,-0.026,0.171],[-0.552,-1.365,-0.064,0.505,-0.979,0.597,1.354,1.012,1.16,0.281,-1.24,0.202,-1.248,-0.116,0.156,-0.256,0.088,0.432,0.083,-0.037,-0.179,0.055,0.054,0.102,0.032,0.269,-0.119,0.453,1.295,-0.126,-0.437,-0.288,-0.298,0.264,-0.077,0.765,-0.208,0.205,-0.079,-0.179,0.279,1.334,0.167,0.167,-0.673,-0.504,-0.625,0.002,0.186,-0.049,-0.226,0.964,-0.305,0.039,0.325,0.055,-0.223,-0.276,-0.226,0.286,-0.234,-0.818,0.653,0.231,-0.008,-0.022,1.028,-0.377,0.049,0.182,-0.079,0.21,-0.751,0.998,-0.551,-0.31,-0.915,-0.613,0.169,-0.474,0.346,-0.183,-0.002,0.537,0.031,-1.892,-1.094,0.852,0.905,-0.71,-0.296,-0.365,0.052,-0.952,-0.491,-0.081,-0.065,0.272,0.256,-0.861,-0.526,0.263,0.408,-2.955,1.42,-0.936,0.026,-0.004,0.572,-0.299,-0.115,0.985,-0.171,0.418,-0.199,0.285,0.576,-3.014,-0.881,-0.029,0.097,0.238,0.305,-0.657,-0.18,0.877,-0.006,-0.151,0.279,0.489,-0.041,-3.078,-0.943,0.218,-0.027,0.318,0.153,-0.026,-0.039,1.014,-0.34,-0.888,-0.047,0.106,0.248,-0.128,-0.422,0.474,0.099,-0.021,-0.029,-0.192,-0.047,-0.082,-0.356,-1.456,0.025,1.001,0.257,0.228,0.087,0.333,-0.081,0.37,-0.057,-0.725,0.331,-0.224,-0.178,0.03,-0.918,0.182,-0.241,0.24,0.23,0.254,-0.377,0.003,-0.098,-0.275,0.284,0.775,0.09,-0.498,-0.61,0.335,0.192,1.003,-0.413,-0.412,-2.408,0.045,0.975,-0.274,3.205,0.195,-0.597,0.498,-0.027,0.127,0.574,-0.122,0.312,-0.475,-0.065,0.504,-0.81,0.057,-0.572,-0.121,-0.215,0.469,-1.357,0.119,0.099,0.005,2.709,0.11,-0.077,-0.041,1.613,-0.07,-0.073,-0.092,1.327,-0.001,-0.086,0.005,1.854,0.121,-0.666,0.013,-0.369,0.002,0.044,-0.074,-2.403,0.088,0.026,-0.017,-0.078,-0.187,-0.042,-0.025,-1.652,0.021,-0.469,0.053,-0.622,0.224,-0.0,-0.055,-0.205,0.12,0.042,0.205],[0.064,0.876,0.83,-1.772,-0.131,1.479,-0.261,0.16,-1.322,0.902,1.336,-0.891,1.303,-2.023,0.009,0.655,-0.203,-0.003,-0.07,0.029,-0.028,0.175,-0.325,-0.14,-0.116,0.2,0.056,0.057,-0.815,-1.393,0.869,0.174,1.541,0.005,-0.114,-0.759,-0.199,0.225,-0.428,-1.652,0.512,0.227,-0.409,-0.276,0.816,0.156,0.06,0.197,-0.641,-0.006,-0.61,0.368,-0.061,-0.317,-0.091,-0.328,-0.806,-1.113,0.803,-0.09,-0.03,-0.572,0.074,-0.296,-0.873,0.186,-0.482,0.279,0.051,0.035,-1.394,0.065,-0.242,-0.164,0.018,-0.533,-0.328,-0.32,-1.164,-0.176,0.704,0.187,-0.162,1.436,0.23,-0.816,-0.214,-0.27,0.265,-0.553,-0.627,-0.124,0.046,0.186,-0.613,-0.033,0.018,-0.178,-0.901,0.076,0.389,-0.497,-0.055,-2.554,-0.099,-0.536,-0.801,0.17,-0.611,-0.345,0.002,0.728,0.183,1.02,0.891,-0.543,0.096,-2.551,-0.364,-0.834,-0.43,0.626,-0.8,-0.246,-0.14,0.445,-0.022,-0.094,0.03,-0.508,-0.175,-2.583,-0.326,-0.107,-0.352,0.706,-0.79,-0.745,-0.059,0.852,0.404,-0.874,0.581,0.11,-0.973,0.01,0.609,-0.628,-0.48,0.415,-0.568,-0.445,0.682,-0.21,-0.208,-1.097,0.37,0.062,0.101,0.285,-0.199,-0.555,-1.182,0.168,-0.092,0.102,-0.343,0.025,-0.43,0.234,0.399,0.132,-0.475,-0.177,-0.289,-1.45,-1.126,0.225,-0.296,-0.321,0.313,-0.147,-0.538,-0.391,0.511,5.02,-0.355,-0.164,-0.205,-0.698,-0.396,0.124,-0.504,-0.263,-2.675,0.523,-0.361,-0.17,-0.224,-0.229,-0.232,0.023,0.119,0.031,-0.282,0.145,-0.264,0.163,-2.207,0.036,0.031,0.015,0.207,0.18,-0.116,0.178,2.209,-0.213,0.037,0.059,-0.302,0.285,-0.254,-0.456,-0.315,0.043,-0.145,-0.597,0.355,-0.561,-0.079,0.182,0.336,-0.28,0.078,-0.492,1.729,-0.274,-0.154,-0.121,-0.228,-0.271,0.222,-0.335,1.301,0.436,0.098,0.07,-1.8,-0.064,0.137,-0.067,0.048,0.029,0.012,0.302],[0.853,-1.48,0.769,-1.33,0.706,-0.346,0.127,0.186,-1.903,2.849,-0.771,-1.736,-0.995,0.692,-0.48,0.106,-0.017,0.128,0.135,-0.016,-0.154,-0.149,0.12,-0.043,-0.073,0.003,-0.035,-0.03,0.245,0.159,0.222,0.053,0.564,-1.065,0.22,0.395,-0.175,0.386,0.686,-0.173,0.388,-0.548,0.174,0.065,0.059,0.21,0.609,0.118,0.374,0.555,-0.157,0.139,0.358,-0.321,-0.099,0.03,0.352,-0.817,-0.484,0.568,0.776,-0.028,-0.602,1.023,0.771,0.067,0.047,1.251,-1.342,-0.054,-0.152,1.907,1.493,0.292,0.321,0.021,-0.403,0.251,0.98,0.128,-0.004,0.188,0.779,-0.162,-0.102,-0.354,-0.245,-0.508,0.057,0.12,-0.413,1.064,0.193,-3.005,-0.125,-0.27,0.447,0.04,0.303,-1.653,-0.894,1.496,-0.169,-0.057,-1.92,0.51,1.496,0.118,-0.486,-0.322,0.942,0.304,0.912,1.749,-0.859,1.498,-0.198,-0.112,-2.35,0.588,-0.986,-0.166,-0.408,0.138,0.645,0.416,0.041,-0.326,-0.765,1.588,0.176,-0.091,-2.837,0.723,-1.138,0.216,-0.395,0.748,0.977,0.127,0.173,0.031,-0.365,0.186,0.564,-0.026,-0.409,-0.189,-0.305,0.395,0.091,-0.624,0.066,-0.042,0.1,-0.235,0.02,0.126,0.837,0.025,0.615,0.191,-0.036,-0.019,0.323,-0.246,0.079,-0.148,0.571,-0.01,0.24,-0.18,0.108,0.306,0.54,0.438,0.018,0.391,0.484,-0.314,0.424,-0.267,0.246,-0.217,-1.279,1.24,0.45,0.862,0.897,0.396,0.816,0.122,1.689,0.691,1.122,-0.853,-0.53,-0.065,0.049,-0.102,-1.09,0.131,0.05,-0.038,1.421,-0.074,0.087,-0.026,-1.696,0.144,0.038,0.091,-0.644,-0.45,-0.463,0.469,-0.673,-0.532,0.202,-0.186,1.08,-0.045,-0.014,0.085,-1.127,0.778,0.958,0.607,-0.945,0.074,0.131,0.005,1.791,-0.097,-0.082,-0.064,-1.739,-0.225,-0.328,0.434,-1.716,0.099,0.033,0.051,-1.754,-0.042,0.053,-0.042,0.924,-0.545,-0.349,0.411,-0.389,-0.088,-0.0,0.169]];

const NNH = 14, nnX = new Float32Array(13), nnH = new Float32Array(NNH), nnO = new Float32Array(4);
function nnRun(w) {
  for (let j = 0; j < NNH; j++) { let a = w[13*NNH + j]; for (let i = 0; i < 13; i++) a += nnX[i]*w[i*NNH + j]; nnH[j] = Math.tanh(a); }
  const o2 = 13*NNH + NNH + NNH*4;
  for (let k = 0; k < 4; k++) { let a = w[o2 + k]; for (let j = 0; j < NNH; j++) a += nnH[j]*w[13*NNH + NNH + j*4 + k]; nnO[k] = a; }
}
const legNb = i => [i%4 > 0 ? i - 1 : -1, i%4 < 3 ? i + 1 : -1, (i + 4)%8];
const _wd = V3(), _wi = V3();
/* Kanten-Greifen: Liegt unter dem Zielpunkt kein Boden in Reichweite (Kante), wird von dort schräg nach innen/unten nach der
   Seitenfläche gesucht, an der das Bein um die Kante herum Halt findet. Gewählt wird der nächste Treffer innerhalb der Beinreichweite. */
const _wq = V3(), _wdr = V3(), _wbp = V3(), WRAPAB = [[.25,1],[.5,1],[.9,1],[1.4,.8],[1.4,.35],[2,.15]];
function surfaceGrip(p, out, hy) {
  const lim = hipNow*S*2.2; groundPoint(p, nS, out); l_gripWrapped = false;
  if (out.distanceTo(p) <= lim*(hy ? .82 : 1)) return false;
  _wq.copy(pos).sub(p); _wq.addScaledVector(nS, -_wq.dot(nS)); if (_wq.lengthSq() < 1e-8) return false; _wq.normalize();
  let bt = 1e9; const bd = _wdr, bp = _wbp;
  for (const [a, b] of WRAPAB) { bd.copy(_wq).multiplyScalar(a).addScaledVector(nS, -b).normalize(); const r = rayBox(p, bd);
    if (r.t > .003 && r.t < lim*1.15 && r.t < bt && Math.abs(rayRes.n.dot(nS)) < .5) { bt = r.t; bp.copy(p).addScaledVector(bd, r.t); } }
  if (bt < 1e8) { out.copy(bp); l_gripWrapped = true; return true; }
  return false;
}
let l_gripWrapped = false;
function legWrap(l) { l.wrapped = surfaceGrip(l.rest, l.restG, l.wrapped); }
function pushOutBlocks(p) {                    // Fuß nie im Körper: auf die nächste Fläche schieben
  for (const b of blocks) if (p.x > b.x0 && p.x < b.x1 && p.y > b.y0 && p.y < b.y1 && p.z > b.z0 && p.z < b.z1) {
    const e = [p.x - b.x0, b.x1 - p.x, p.y - b.y0, b.y1 - p.y, p.z - b.z0, b.z1 - p.z]; let k = 0; for (let i = 1; i < 6; i++) if (e[i] < e[k]) k = i;
    if (k === 0) p.x = b.x0 - .003; else if (k === 1) p.x = b.x1 + .003; else if (k === 2) p.y = b.y0 - .003; else if (k === 3) p.y = b.y1 + .003; else if (k === 4) p.z = b.z0 - .003; else p.z = b.z1 + .003; }
}
function updateGait(dt) {
  const speedN = clamp(speed/SPRINT, 0, 1), baseDur = MU.lerp(.26, .14, speedN);
  const idle = speed < .15*S && Math.abs(yawRate) < .15;
  const T = (idle ? .22 : .32 + .28*clamp(speed/(3*S), 0, 1))*S;
  let air = 0; _a.copy(vel); if (speed > .01) _a.multiplyScalar(1/speed);
  for (let i = 0; i < 8; i++) {
    const l = legs[i]; l.rest.copy(l.restLocal); spider.localToWorld(l.rest); groundPoint(l.rest, nS, l.restG); legWrap(l);
    if (l.type) { l.err = 0; continue; }
    if (l.stepping) {
      l.t += dt/l.dur;
      if (l.t >= 1) { l.stepping = false; l.foot.copy(l.to); l.tl = 0; if (!l.land) tick(.1 + .12*speedN); l.land = false; }
      else {
        const e = l.t*l.t*(3 - 2*l.t); l.foot.lerpVectors(l.from, l.to, e);
        if (!l.land) l.foot.addScaledVector(nS, Math.sin(Math.PI*l.t)*(.26 + .12*speedN)*S*(l.hs || 1));
        pushOutBlocks(l.foot);
      }
    } else l.tl = (l.tl || 0) + dt;
    if (l.stepping) air++;
    l.err = l.foot.distanceTo(l.restG)/T;
  }
  const ord = legs.map((l, i) => i).filter(i => !legs[i].stepping && !legs[i].type).sort((p, q) => legs[q].err - legs[p].err);
  for (const i of ord) {
    const l = legs[i], nb = legNb(i), g = j => j >= 0 ? legs[j].err : 0, h = j => j >= 0 && legs[j].stepping ? 1 : 0;
    _b.copy(l.foot).sub(l.restG);
    nnX[0] = Math.min(3, l.err); nnX[1] = _b.dot(_a)/T; nnX[2] = speedN; nnX[3] = Math.min(1, Math.abs(yawRate));
    nnX[4] = g(nb[0]); nnX[5] = g(nb[1]); nnX[6] = g(nb[2]); nnX[7] = h(nb[0]); nnX[8] = h(nb[1]); nnX[9] = h(nb[2]);
    nnX[10] = Math.min(1, air/4); nnX[11] = Math.min(1, (l.tl || 0)/.5); nnX[12] = idle ? 1 : 0;
    nnRun(l.w || (l.w = LEGNN[i]));
    const free = !(h(nb[0]) || h(nb[1]) || h(nb[2]));
    if ((nnO[0] > 0 && air < 3 && free && l.err > .3) || (l.err*T > 1.3*S && air < 5)) {
      l.hs = clamp(nnO[3], .7, 1.6);
      startStep(l, clamp(nnO[2], .7, 1.3)*baseDur, clamp(nnO[1], .2, 1.3)*.55*T); air++;
    }
  }
}
// Beine in der Luft / am Seil: angezogen, vor der Landung ausgestreckt
function airPose(dt, fo) {
  const f = fo !== undefined ? fo : clamp(-vel.y/6, 0, 1), kf = 1 - Math.exp(-dt*12);
  for (const l of legs) {
    const s = MU.lerp(.72, 1.0, f);
    _a.set(l.hip.x + (l.restLocal.x - l.hip.x)*s, MU.lerp(-.5, -HIP_H*.95, f), l.hip.z + (l.restLocal.z - l.hip.z)*s);
    spider.localToWorld(_a); l.foot.lerp(_a, kf); l.stepping = false; l.type = false;
  }
}

/* ======================= Modus: Oberfläche (Boden / Wand / Decke) ======================= */
function stepSurf(dt, ix, iz, mag) {
  const T = hack.state ? terms[hack.i] : null;
  let desired = null, faceTo = null, tgtSp = 0, fpTurn = 0;
  const shift = !!(keys.ShiftLeft || keys.ShiftRight);
  if (mel.state === 1) {                                   // Anlauf zum Nahkampf-Ziel
    _a.copy(mel.go).sub(pos); _a.addScaledVector(nS, -_a.dot(nS));
    if (mel.dist > .05 && _a.lengthSq() > 1e-6) { desired = _a.normalize(); tgtSp = Math.min(SPRINT*1.75, mel.dist*7 + 1.2); }
    faceTo = mel.dir;
  } else if (hack.state === 1) {
    _a.copy(T.stand).sub(pos); _a.addScaledVector(nS, -_a.dot(nS)); hack.dist = _a.length();
    if (hack.dist > .05) { desired = _a.normalize(); tgtSp = Math.min(WALK*.8, hack.dist*3); }
    faceTo = T.face;
  } else if (hack.state === 2) faceTo = T.face;
  else if (fp) {                                   // First Person: Kamera fest am Körper, A/D drehen, W/S laufen
    fpTurn = -ix;
    if (Math.abs(iz) > .05) { desired = _b.copy(hd).multiplyScalar(Math.sign(iz)); tgtSp = (shift ? WALK : SPRINT*(opt.sprint||1))*(crouch ? .6 : 1)*Math.abs(iz)*(iz < 0 ? .6 : 1)*dmgMul()*uSv(); }
  } else if (mag > .05) {
    const s = Math.sin(camYaw), c = Math.cos(camYaw);
    _t1.set(-s,0,-c).applyQuaternion(frameQ); _t2.set(c,0,-s).applyQuaternion(frameQ);
    desired = _b.set(0,0,0).addScaledVector(_t2, ix).addScaledVector(_t1, iz);
    desired.addScaledVector(nS, -desired.dot(nS)); desired.normalize(); faceTo = desired;
    const maxSp = shift ? WALK : SPRINT*(opt.sprint||1);
    tgtSp = maxSp*(crouch ? .6 : 1)*mag*dmgMul()*uSv();
  }
  let d = 0;
  if (faceTo) {
    _t1.copy(faceTo).addScaledVector(nS, -faceTo.dot(nS)).normalize();
    d = Math.atan2(nS.dot(_t2.crossVectors(hd, _t1)), hd.dot(_t1));
    if (!desired && Math.abs(d) < .6 && hack.state === 0 && !mel.state) d = 0;
    if (desired && hack.state === 0 && !mel.state) tgtSp *= (.2 + .8*Math.max(0, Math.cos(d)));
  }
  const rateT = (fp && !hack.state && !mel.state) ? fpTurn*2.4 : clamp(d*6, -3.2, 3.2);
  yawRate += (rateT - yawRate)*(1 - Math.exp(-dt*10));
  hd.applyAxisAngle(nS, yawRate*dt);

  tgtSp *= 1 - .4*jump.charge;
  const k = 1 - Math.exp(-dt*(tgtSp > speed ? 4 : 6));
  if (desired) { _t3.copy(desired).multiplyScalar(tgtSp); vel.addScaledVector(_t3.sub(vel), k); } else vel.multiplyScalar(1 - k);
  vel.addScaledVector(nB, -vel.dot(nB)); speed = vel.length();
  pos.addScaledVector(vel, dt);
  clampIn(pos, .05);

  // Sprung: nur im Stand, immer senkrecht von der Fläche weg
  const can = hack.state === 0 && !mel.state, held = !!keys.Space;
  if (jump.lock && !held) jump.lock = false;
  if (opt.ibuf && !held && !jump.held && can && nB.y > -.3 && clockT - jumpBufT < .16 && jumpBufT > jumpDoneT) { jumpDoneT = clockT; launch(.3); }
  if (held && !jump.lock && can && nB.y > -.3) { jump.charge = Math.min(1, jump.charge + dt/1.3); jump.held = true; }
  else if (jump.held) {
    if (held) { jump.charge = 0; jump.held = false; jump.lock = true; }
    else { launch(jump.charge); jumpDoneT = clockT; jump.charge = 0; jump.held = false; }
  }
  landDip -= landDip*(1 - Math.exp(-dt*6));
  hipNow += ((crouch ? .62 : HIP_H)*(1 - .45*jump.charge) - landDip - hipNow)*(1 - Math.exp(-dt*(jump.charge > 0 ? 12 : 6)));
  const bob = Math.sin(clockT*speed*9)*.02*S*clamp(speed/(2*S), 0, 1);
  const hw = hipNow*S + bob + (jump.charge > 0 ? (Math.random() - .5)*.03*S*jump.charge : 0);
  const kc = 1 - Math.exp(-dt*20);
  for (let it = 0; it < 2; it++) { const Ds = sdf(pos, _n); _n.normalize(); pos.addScaledVector(_n, (hw - Ds)*kc); }
  nB.copy(_n); if (pos.y > skyLim) pos.y = skyLim; if (mode !== "cut") npcPush(pos);
  smoothDir(nS, nB, 1 - Math.exp(-dt*9), _xa);
  updateFrame(dt, 8); orient();
  updateGait(dt);
}
function launch(c) {
  c = Math.max(c, .12); mode = "air"; jump.lock = true;
  vel.addScaledVector(nB, MU.lerp(2.6, 7.4, c)*uMu());           // Schwung vom Laufen bleibt erhalten
  for (const l of legs) { l.stepping = false; l.land = false; l.type = false; }
  tick(.2 + .2*c);
}

/* ======================= Modus: Luft ======================= */
function stepAir(dt) {
  vel.y -= GRAV*dt; pos.addScaledVector(vel, dt); clampIn(pos, .03);
  const Ds = sdf(pos, _n); _n.normalize(); nB.copy(_n);
  smoothDir(nS, _t3.set(0,1,0), 1 - Math.exp(-dt*(hd.y < -.3 ? 8 : 5)), _xa);
  if (hd.y < -.3) smoothDir(hd, rope.face, 1 - Math.exp(-dt*8), _xa);     // nach dem Abseilen aus dem Kopfüber-Hängen aufrichten
  updateFrame(dt, 5); orient(); airPose(dt);
  if (Ds <= hipNow*S && vel.dot(nB) < 0 && (!shaft.on || nB.y > .5)) {
    const imp = -vel.dot(nB); mode = "surf"; landDip = clamp(imp*.04, .04, .45); vel.addScaledVector(nB, -vel.dot(nB)).multiplyScalar(.7); speed = vel.length();
    for (const l of legs) { l.from.copy(l.foot); groundPoint(l.foot, nB, l.to); l.stepping = true; l.land = true; l.t = 0; l.dur = .12; }
    thud(imp); fallDamage(imp);
  }
}
function thud(imp) {
  if (!ac) return; const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
  o.type = "sine"; o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(35, t+.25);
  g.gain.setValueAtTime(clamp(imp/10, .15, .7), t); g.gain.exponentialRampToValueAtTime(.0001, t+.3);
  o.connect(g); g.connect(fxIn); o.start(t); o.stop(t+.32);
}

/* Hitbox-Anzeige (Taste H): zeigt alle festen Kollisionsflächen als Drahtgitter */
const hitG = new THREE.Group(); hitG.visible = false; scene.add(hitG); let hitOn = false;
function hitRefresh() {
  while (hitG.children.length) { const o = hitG.children.pop(); o.geometry.dispose(); }
  if (!hitOn) return;
  for (const b of blocks) { const y0 = b.y0 !== undefined ? b.y0 : 0, y1 = b.y1 !== undefined ? b.y1 : 2.4;
    const m = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(b.x1 - b.x0, y1 - y0, b.z1 - b.z0)), new THREE.LineBasicMaterial({color:0xd8849f, depthTest:false}));
    m.position.set((b.x0 + b.x1)/2, (y0 + y1)/2, (b.z0 + b.z1)/2); m.renderOrder = 9; hitG.add(m); }
}
function toggleHit() { hitOn = !hitOn; opt.hit = hitOn; try { saveOpt(); buildOpts(); } catch (e) {} hitG.visible = hitOn; hitRefresh(); toast(hitOn ? "Hitboxen sichtbar (H)" : "Hitboxen aus"); }
setInterval(() => { if (hitOn) hitRefresh(); }, 700);
