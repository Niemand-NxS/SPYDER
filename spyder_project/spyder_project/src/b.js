<script>if (!window.__gpu) document.write('<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"><\/script>');</script>
<script>
(() => {
"use strict";
const MU = THREE.MathUtils, clamp = MU.clamp, V3 = (x=0,y=0,z=0) => new THREE.Vector3(x,y,z);
const $ = id => document.getElementById(id);

/* ---------------- Raum (Innenmaße 2W x H x 2D, Meter) ---------------- */
let W = 4.5, H = 3.4, D = 3.5, DN = 3.5; const S = 0.13, SC = S/0.26;      // S = Maßstab der Spinne
const PLANES = [
  {m:V3(0,1,0),  c:0},   {m:V3(0,-1,0), c:-H},
  {m:V3(1,0,0),  c:-W},  {m:V3(-1,0,0), c:-W},
  {m:V3(0,0,1),  c:-D},  {m:V3(0,0,-1), c:-D},
];
let TAU = 0.3; const _dd = new Float64Array(220), _nv = []; for (let i = 0; i < 220; i++) _nv.push(V3());
/* Feste Körper (exakte AABBs, werden wie Wände behandelt – man kann auf, an und unter ihnen laufen) */
const blocks = [], _bb = new THREE.Box3();
function pushBox(into, x0, x1, y0, y1, z0, z1) { into.push({x0, x1, y0, y1, z0, z1}); }
const _c8 = []; for (let i = 0; i < 8; i++) _c8.push(V3());
function meshSolids(m, into, big) {       // achsparallele Meshes: eine AABB; gedrehte: in Stücke entlang der Längsachse zerlegt
  m.updateWorldMatrix(true, false); const g = m.geometry; if (!g.boundingBox) g.computeBoundingBox(); const bb = g.boundingBox, e = m.matrixWorld.elements;
  const ax = (c0, c1, c2) => Math.abs(Math.abs(c0) - 1) < .02 || (Math.abs(c0) < .02 && ((Math.abs(Math.abs(c1) - 1) < .02 && Math.abs(c2) < .02) || (Math.abs(Math.abs(c2) - 1) < .02 && Math.abs(c1) < .02)));
  const sx = Math.hypot(e[0], e[1], e[2]) || 1, sy = Math.hypot(e[4], e[5], e[6]) || 1, sz = Math.hypot(e[8], e[9], e[10]) || 1;
  const aligned = ax(e[0]/sx, e[1]/sx, e[2]/sx) && ax(e[4]/sy, e[5]/sy, e[6]/sy) && ax(e[8]/sz, e[9]/sz, e[10]/sz);
  const dims = [(bb.max.x - bb.min.x)*sx, (bb.max.y - bb.min.y)*sy, (bb.max.z - bb.min.z)*sz];
  let k = 0, long = 0; for (let i = 1; i < 3; i++) if (dims[i] > dims[long]) long = i; const cnt = aligned ? 1 : Math.min(8, Math.max(1, Math.ceil(dims[long]/.3)));
  for (let q = 0; q < cnt; q++) {
    const lo = bb.min.clone(), hi = bb.max.clone(), ax2 = ['x', 'y', 'z'][long], L = bb.max[ax2] - bb.min[ax2];
    lo[ax2] = bb.min[ax2] + L*q/cnt; hi[ax2] = bb.min[ax2] + L*(q + 1)/cnt;
    let i = 0; for (const x of [lo.x, hi.x]) for (const y of [lo.y, hi.y]) for (const z of [lo.z, hi.z]) _c8[i++].set(x, y, z).applyMatrix4(m.matrixWorld);
    _bb.makeEmpty(); for (const c of _c8) _bb.expandByPoint(c);
    const d = [_bb.max.x - _bb.min.x, _bb.max.y - _bb.min.y, _bb.max.z - _bb.min.z].sort((p2, q2) => q2 - p2);
    if (big === 0 || (dims.slice().sort((p2, q2) => q2 - p2)[0] >= big && d[1] >= .07)) pushBox(into, _bb.min.x, _bb.max.x, _bb.min.y, _bb.max.y, _bb.min.z, _bb.max.z);
  }
}
function solidsOf(obj, into, big = .3) {
  obj.updateWorldMatrix(true, true);
  obj.traverse(m => { if (!m.isMesh || m.userData.nosolid) return; meshSolids(m, into, big); });
  return into;
}
function solidOf(obj, into) { obj.updateWorldMatrix(true, true); meshSolids(obj, into, 0); }
// weicher Abstand zur Raumhülle + Körpern (Ecken werden gerundet) + Normale (Gradient)
function boxDist(b, p, nv) {
  const cx = (b.x0 + b.x1)/2, cy = (b.y0 + b.y1)/2, cz = (b.z0 + b.z1)/2, qx = Math.abs(p.x - cx) - (b.x1 - b.x0)/2, qy = Math.abs(p.y - cy) - (b.y1 - b.y0)/2, qz = Math.abs(p.z - cz) - (b.z1 - b.z0)/2;
  const mx = Math.max(qx, 0), my = Math.max(qy, 0), mz = Math.max(qz, 0), ol = Math.sqrt(mx*mx + my*my + mz*mz);
  if (ol > 0) { nv.set(p.x < cx ? -mx : mx, p.y < cy ? -my : my, p.z < cz ? -mz : mz).multiplyScalar(1/ol); return ol; }
  if (qx >= qy && qx >= qz) nv.set(p.x < cx ? -1 : 1, 0, 0); else if (qy >= qz) nv.set(0, p.y < cy ? -1 : 1, 0); else nv.set(0, 0, p.z < cz ? -1 : 1);
  return Math.max(qx, qy, qz);
}
const _nB = V3(), _nA = V3(), _nT = V3();
function sdf(p, out) {
  let dmin = 1e9, n = 0;
  for (let i = 0; i < 6; i++) { _dd[n] = PLANES[i].m.dot(p) - PLANES[i].c; if (_dd[n] < dmin) dmin = _dd[n]; n++; }
  let sum = 0; _nA.set(0, 0, 0);
  for (let i = 0; i < 6; i++) { const w = Math.exp(-(_dd[i] - dmin)/TAU); sum += w; _nA.addScaledVector(PLANES[i].m, w); }
  _nA.multiplyScalar(1/sum); const dP = dmin - TAU*Math.log(sum);
  // Körper: harte Mindestdistanz (ohne Log-Bias durch viele Teilkörper), Normalen nahe am Minimum gemittelt
  let dB = 1e9, m = 0;
  for (let j = 0; j < blocks.length && m < 210; j++) { const d = boxDist(blocks[j], p, _nv[m]); if (d > 1.6) continue; _dd[m] = d; if (d < dB) dB = d; m++; }
  if (!m) { out.copy(_nA); return dP; }
  _nB.set(0, 0, 0); for (let i = 0; i < m; i++) { const w = Math.exp(-(_dd[i] - dB)/.02); _nB.addScaledVector(_nv[i], w); } _nB.normalize();
  const Tc = Math.min(TAU, .09), dm2 = Math.min(dP, dB), wA = Math.exp(-(dP - dm2)/Tc), wB = Math.exp(-(dB - dm2)/Tc);
  out.copy(_nA).multiplyScalar(wA).addScaledVector(_nB, wB).multiplyScalar(1/(wA + wB));
  return dm2 - Tc*Math.log(wA + wB);
}
const rayRes = {t:0, i:0, n:V3()}, _o = V3(), _g = V3();
function rayBox(o, dir) {
  let t = 1e9, k = -1;
  for (let i = 0; i < 6; i++) { const pl = PLANES[i], rate = pl.m.dot(dir);
    if (rate < -1e-6) { const ti = (pl.m.dot(o) - pl.c)/(-rate); if (ti < t) { t = ti; k = i; } } }
  rayRes.n.copy(k >= 0 ? PLANES[k].m : UPV);
  for (const b of blocks) {
    let t0 = 0, t1 = 1e9, ax = -1, sg = 0;
    for (let a = 0; a < 3; a++) { const lo = a === 0 ? b.x0 : a === 1 ? b.y0 : b.z0, hi = a === 0 ? b.x1 : a === 1 ? b.y1 : b.z1, oa = a === 0 ? o.x : a === 1 ? o.y : o.z, da = a === 0 ? dir.x : a === 1 ? dir.y : dir.z;
      if (Math.abs(da) < 1e-9) { if (oa < lo || oa > hi) { t1 = -1; break; } continue; }
      let ta = (lo - oa)/da, tb = (hi - oa)/da, s = -1; if (ta > tb) { const q = ta; ta = tb; tb = q; s = 1; }
      if (ta > t0) { t0 = ta; ax = a; sg = s; } if (tb < t1) t1 = tb; if (t0 > t1) { t1 = -1; break; } }
    if (t1 >= 0 && ax >= 0 && t0 > 1e-6 && t0 < t) { t = t0; k = 6; rayRes.n.set(ax === 0 ? sg : 0, ax === 1 ? sg : 0, ax === 2 ? sg : 0); }
  }
  rayRes.t = t; rayRes.i = k; return rayRes;
}
const UPV = V3(0, 1, 0);
let skyLim = 1e9;
function clampIn(p, e = 0.02) { p.x = clamp(p.x, -W + e, W - e); p.y = clamp(p.y, e, Math.min(H, skyLim) - e); p.z = clamp(p.z, -DN + e, D - e); return p; }
function setPanel(el, on) {   // sanftes Ein-/Ausblenden (.show = sichtbar, .out = Ausblend-Animation)
  clearTimeout(el._pt);
  if (on) { el.classList.remove("out"); el.classList.add("show"); }
  else if (el.classList.contains("show")) { if (document.body.classList.contains("noAnim")) el.classList.remove("show", "out"); else { el.classList.add("out"); el._pt = setTimeout(() => el.classList.remove("show", "out"), 230); } }
}
function groundPoint(p, n, out) {
  _o.copy(p); clampIn(_o); _g.copy(n).negate();
  for (const b of blocks) if (_o.x > b.x0 && _o.x < b.x1 && _o.y > b.y0 && _o.y < b.y1 && _o.z > b.z0 && _o.z < b.z1) {      // Fußpunkt im Körper → auf die nächste Fläche schieben
    const e = [_o.x - b.x0, b.x1 - _o.x, _o.y - b.y0, b.y1 - _o.y, _o.z - b.z0, b.z1 - _o.z]; let k = 0; for (let i = 1; i < 6; i++) if (e[i] < e[k]) k = i;
    if (k === 0) _o.x = b.x0 - .002; else if (k === 1) _o.x = b.x1 + .002; else if (k === 2) _o.y = b.y0 - .002; else if (k === 3) _o.y = b.y1 + .002; else if (k === 4) _o.z = b.z0 - .002; else _o.z = b.z1 + .002; }
  const r = rayBox(_o, _g); return out.copy(_o).addScaledVector(_g, Math.max(r.t, 0));
}

/* ---------------- Renderer / Szene ---------------- */
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x0c1530);
const camera = new THREE.PerspectiveCamera(60, innerWidth/innerHeight, 0.05, 60); scene.add(camera);
const hemi = new THREE.HemisphereLight(0xeaf0ff, 0x4a5a80, 0.6); scene.add(hemi);
const lamp = new THREE.PointLight(0xf2f6ff, 0.85, 0, 1); lamp.position.set(0, H-0.5, 0);
lamp.castShadow = true; lamp.shadow.mapSize.set(2048,2048); lamp.shadow.camera.near = 0.2; lamp.shadow.camera.far = 14; lamp.shadow.bias = -0.002;
scene.add(lamp);
const fill = new THREE.PointLight(0xbcd0ff, 0.35, 0, 1); fill.position.set(-2.8, 1.4, 2.2); scene.add(fill);

function canvasTex(w, h, draw, rx=1, ry=1) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 4; return t;
}
function speckle(x, w, h, n, a) { for (let i=0;i<n;i++){ const g = Math.random()*255|0; x.fillStyle = `rgba(${g},${g},${g},${a*Math.random()})`; x.fillRect(Math.random()*w, Math.random()*h, 1+Math.random()*2, 1+Math.random()*2); } }
const floorTex = canvasTex(256,256,(x,w,h)=>{ x.fillStyle="#3b4b73"; x.fillRect(0,0,w,h); speckle(x,w,h,5000,.18); x.strokeStyle="rgba(38,40,43,.65)"; x.lineWidth=3; x.strokeRect(0,0,w,h); }, 2*W, 2*D);
const ceilTex = canvasTex(256,256,(x,w,h)=>{ x.fillStyle="#e4eaf7"; x.fillRect(0,0,w,h); speckle(x,w,h,2500,.12); x.strokeStyle="rgba(90,92,96,.7)"; x.lineWidth=2; x.strokeRect(0,0,w,h); }, W, D);
const wallDraw = (x,w,h)=>{ x.fillStyle="#aab6d2"; x.fillRect(0,0,w,h); speckle(x,w,h,4000,.14);
  x.fillStyle="#1c3166"; x.fillRect(0,h*.62,w,h*.38); x.fillStyle="#e0701e"; x.fillRect(0,h*.62-3,w,6);
  x.strokeStyle="rgba(50,54,52,.5)"; x.lineWidth=3; x.beginPath(); x.moveTo(1,0); x.lineTo(1,h); x.stroke(); };
const wallTexA = canvasTex(256,430,wallDraw, D, 1), wallTexB = canvasTex(256,430,wallDraw, W, 1);
const roomMeshes = [];
function roomPlane(i, w, h, tex, c) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w,h), new THREE.MeshStandardMaterial({map:tex, roughness:.92, metalness:0}));
  m.position.copy(c); m.lookAt(c.x+PLANES[i].m.x, c.y+PLANES[i].m.y, c.z+PLANES[i].m.z); m.receiveShadow = true; scene.add(m); roomMeshes[i] = m; return m;
}
roomPlane(0, 2*W, 2*D, floorTex, V3(0,0,0));       roomPlane(1, 2*W, 2*D, ceilTex, V3(0,H,0));
roomPlane(2, 2*D, H, wallTexA, V3(-W,H/2,0));      roomPlane(3, 2*D, H, wallTexA, V3(W,H/2,0));
roomPlane(4, 2*W, H, wallTexB, V3(0,H/2,-D));      roomPlane(5, 2*W, H, wallTexB, V3(0,H/2,D));

const mStd = (c, m=.5, r=.6) => new THREE.MeshStandardMaterial({color:c, metalness:m, roughness:r});
/* Abgerundete Box (für Sofas, Sessel, Bänke): Eck- und Kantenradius r; UVs werden aus Weltmaßen projiziert (keine gestreckte Textur), uvm = Meter pro Texturwiederholung */
function roundGeo(w, h, d, r, uvm) {
  r = Math.min(r, w*.45, h*.45, d*.45); const g = new THREE.BoxGeometry(1, 1, 1, 5, 5, 5), p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv, S = [w/2, h/2, d/2];
  const grid = hh => [-hh, -hh + r*.29, -hh + r, hh - r, hh - r*.29, hh], G = S.map(grid), v = new THREE.Vector3(), q = new THREE.Vector3(), dr = new THREE.Vector3(), inn = S.map(s => s - r);
  for (let i = 0; i < p.count; i++) {
    const c = [p.getX(i), p.getY(i), p.getZ(i)].map((a, k) => G[k][Math.round((a + .5)*5)]); v.set(c[0], c[1], c[2]);
    q.set(Math.max(-inn[0], Math.min(inn[0], v.x)), Math.max(-inn[1], Math.min(inn[1], v.y)), Math.max(-inn[2], Math.min(inn[2], v.z))); dr.copy(v).sub(q);
    if (dr.lengthSq() > 1e-12) { dr.normalize(); v.copy(q).addScaledVector(dr, r); n.setXYZ(i, dr.x, dr.y, dr.z); }
    p.setXYZ(i, v.x, v.y, v.z);
    const ax = Math.abs(dr.x), ay = Math.abs(dr.y), az = Math.abs(dr.z);
    if (ax >= ay && ax >= az) uv.setXY(i, v.z/uvm, v.y/uvm); else if (ay >= az) uv.setXY(i, v.x/uvm, v.z/uvm); else uv.setXY(i, v.x/uvm, v.y/uvm);
  }
  g.computeBoundingBox(); g.computeBoundingSphere(); return g;
}
function rbox(w, h, d, r, mt, x, y, z, parent = scene, uvm = .6) { const o = new THREE.Mesh(roundGeo(w, h, d, r, uvm), mt); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; parent.add(o); return o; }
function box(w,h,d,mt,x,y,z,parent=scene){ const o = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mt); o.position.set(x,y,z); o.castShadow = true; o.receiveShadow = true; parent.add(o); return o; }
const lightMat = new THREE.MeshStandardMaterial({color:0xf4f7ff, emissive:0xf4f7ff, emissiveIntensity:.8});
const ceilLights = []; for (const [x,z] of [[-2,-1.4],[2,-1.4],[-2,1.4],[2,1.4]]) ceilLights.push(box(1.1,.05,.5,lightMat,x,H-.025,z));
const doorG = new THREE.Group(); doorG.position.set(-W+.03,0,1.6); scene.add(doorG);                      // Tür (schiebt sich zur Seite)
box(.06,2.1,1.0,mStd(0x23335e,.5,.55),0,1.05,0,doorG); box(.04,.08,.12,mStd(0xe0701e,.7,.4),.05,1.0,-.35,doorG);
const doorway = new THREE.Mesh(new THREE.PlaneGeometry(1.0,2.1), new THREE.MeshBasicMaterial({color:0x050a18})); doorway.position.set(-W+.01,1.05,1.6); doorway.rotation.y = Math.PI/2; scene.add(doorway);
{ const fm = mStd(0x1b2a52,.5,.6); box(.07,.06,1.14,fm,-W+.035,2.13,1.6); box(.075,.025,1.14,mStd(0xe0701e,.5,.45),-W+.037,2.17,1.6); box(.07,2.1,.06,fm,-W+.035,1.05,1.05); box(.07,2.1,.06,fm,-W+.035,1.05,2.15); }
let doorOpen = 0, doorT = 0;
// Lüftung: siehe act.js

/* ---------------- Terminals ---------------- */
const terms = [];
function makeTerminal(name, base, n) {      // Datensäule: Sockel, Achteck-Pfeiler, Anzeigekopf, Andockbuchse
  const g = new THREE.Group(); g.position.copy(base); scene.add(g); g.lookAt(base.x+n.x, base.y, base.z+n.z);
  const metal = mStd(0x3a4a70,.55,.55), dark = mStd(0x15213f,.5,.5), light = mStd(0xcfd8ee,.5,.4), ora = mStd(0xe0701e,.7,.4), PZ = .45, RP = .33;
  const cyl = (r0, r1, h, seg, mat, y, rotY) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, h, seg), mat); m.position.set(0, y, PZ); m.rotation.y = rotY || 0; m.castShadow = m.receiveShadow = true; g.add(m); return m; };
  cyl(.48,.46,.1,16,dark,.05); cyl(.5,.5,.02,16,ora,.11);
  cyl(RP,RP*.92,.95,8,metal,.6,Math.PI/8);                       // Pfeiler (Fläche zeigt zum Raum)
  cyl(RP*.96,RP*.96,.03,8,ora,.88,Math.PI/8);
  cyl(.2,.2,.14,8,dark,1.15,Math.PI/8);                           // Hals
  const head = box(.6,.48,.4,dark,0,1.46,PZ,g); box(.64,.03,.44,ora,0,1.71,PZ,g); box(.62,.05,.42,metal,0,1.22,PZ,g);
  box(.03,.34,.03,light,.2,1.9,PZ,g); box(.03,.34,.03,light,-.2,1.78,PZ,g); box(.05,.05,.05,ora,.2,2.08,PZ,g);
  box(.06,.4,.3,metal,.34,1.46,PZ,g); box(.06,.4,.3,metal,-.34,1.46,PZ,g);
  const cvs = document.createElement("canvas"); cvs.width = 256; cvs.height = 144;
  const tex = new THREE.CanvasTexture(cvs);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(.5,.28), new THREE.MeshBasicMaterial({map:tex})); scr.position.set(0,1.46,PZ + .205); g.add(scr);
  box(.52,.3,.02,mStd(0x0a1230,.3,.4),0,1.46,PZ + .199,g);
  // Andock-Luke mit Buchse
  box(.3,.22,.03,dark,0,.3,PZ + RP*.924 + .005,g);
  const sockM = new THREE.MeshBasicMaterial({color:0x7a4416});
  const sock = new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,.05,14), sockM); sock.rotation.x = Math.PI/2; sock.position.set(0,.3,PZ + RP*.924 + .03); g.add(sock);
  box(.012,.2,.012,ora,.12,.3,PZ + RP*.924 + .025,g); box(.012,.2,.012,ora,-.12,.3,PZ + RP*.924 + .025,g);
  g.updateMatrixWorld(true);
  const zp = PZ + RP*.924 + .045;
  const T = {name, hacked:false, ctx:cvs.getContext("2d"), tex, n:n.clone(), face:n.clone().negate(), sockM,
    stand:base.clone().addScaledVector(n, zp + 2.35*S), key:g.localToWorld(V3(0,.3,zp)), port:g.localToWorld(V3(0,.3,zp))};
  T.stand.y = S;
  T.g = g; T.blks = solidsOf(g, [], .2); T.active = true; terms.push(T); return T;
}
function drawScreen(T, t, p) {
  const x = T.ctx, w = 256; x.fillStyle = "#0b1630"; x.fillRect(0,0,w,144);
  x.font = "10px ui-monospace,Menlo,Consolas,monospace"; x.textBaseline = "top";
  x.fillStyle = "#f08a2c"; x.fillRect(0,0,w,14); x.fillStyle = "#0b1630";
  x.fillText(T.name+" · "+(T.hacked?"OFFEN":p>0?"ANGRIFF":"GESPERRT"), 4, 2);
  x.fillStyle = "#e4ecfc";
  if (T.hacked) {
    (T.lines||["ZUGRIFF GEWÄHRT","","› Kameras: deaktiviert","› Türen: entriegelt","› Protokolle: gelöscht","› Datenpaket: kopiert"]).forEach((s,i)=>x.fillText(s,6,22+i*13));
    x.fillStyle = "#f08a2c"; x.fillRect(6,108,244,3);
  } else if (p > 0) {
    for (let r=0;r<8;r++){ let s = ""; const seed = Math.floor(t*10)+r*7;
      for (let k=0;k<14;k++) s += (((seed*(k+3)*2654435761)>>>0)%256).toString(16).padStart(2,"0")+" ";
      x.fillText(s,4,20+r*11); }
    x.strokeStyle = "#e4ecfc"; x.strokeRect(6,112,244,14); x.fillStyle = "#f08a2c"; x.fillRect(8,114,240*p,10);
    x.fillStyle = "#0b1630"; x.fillText(Math.floor(p*100)+"%",118,114);
  } else {
    x.fillText("Passwort:",6,26); x.fillText("********",6,40);
    x.fillStyle = "#b5483a"; x.fillText("ZUGRIFF VERWEIGERT",6,64);
    x.fillStyle = "#e4ecfc"; if (Math.floor(t*2)%2===0) x.fillRect(70,40,6,10);
  }
  T.tex.needsUpdate = true;
}
makeTerminal("TEST-CTRL", V3(-1.2,0,-D), V3(0,0,1));
makeTerminal("LAB-NET", V3(W,0,0.9), V3(-1,0,0));
terms[0].lines = ["ZUGRIFF GEWÄHRT","","› Projekt ARACHNE: eingestellt","› Test 41 = letzter Lauf","› Demontage: morgen 06:00","› Einheit 8: Speicher löschen"];
terms[1].lines = ["ZUGRIFF GEWÄHRT","","› Notfall: Sektor 7 räumen","› Lüftung 7-C → Außenanlage","› Gitter: Schrauben gelöst","› Alarm: Stufe 3"];
terms.forEach(T => drawScreen(T, 0, 0));
