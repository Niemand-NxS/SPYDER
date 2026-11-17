
/* ======================= Lüftungsnetz · 3D-Karte · Abseilen ======================= */
const shaft = {on:false, cur:null, busy:false, hintT:0, slipMsg:0, said:{}, cp:null, dead:false};
const shaftG = new THREE.Group(); scene.add(shaftG);
// c = Mittelpunkt der Bodenfläche (Welt, nur für die Karte) · w = Länge x · d = Tiefe z · h = Höhe
// ex: Öffnungen. f = E/W/N/S (Wand) · D (Loch im Boden) · U (Loch in der Decke) · o = seitlicher Versatz · x,z = Lochposition
const J = {w:2.6, h:2.4, d:2.2};
const NODEDEF = [
  {id:"A", name:"Einstieg",        c:[0,0,0],         w:6,   h:1.2, d:1.3, ex:[{f:"E",to:"B"}], endW:"einstieg"},
  {id:"B", name:"Kreuzung 1",      c:[4.3,0,0],       ...J, ex:[{f:"W",to:"A"},{f:"E",to:"C"},{f:"N",to:"K"},{f:"D",to:"S1",x:0,z:0}]},
  {id:"C", name:"Lüfterraum",      c:[7.85,0,0],      w:4.5, h:1.2, d:1.3, ex:[{f:"W",to:"B"},{f:"S",to:"P",o:1.0}], endE:"fan"},
  {id:"P", name:"Seitengang",      c:[8.85,0,3.15],   w:1.3, h:1.2, d:5,   ex:[{f:"N",to:"C"},{f:"S",to:"Q"}]},
  {id:"Q", name:"Kreuzung 2",      c:[8.85,0,6.75],   ...J, ex:[{f:"N",to:"P"},{f:"W",to:"R"}], endE:"sealed"},
  {id:"R", name:"Filterkammer",    c:[5.55,0,6.75],   w:4,   h:1.2, d:1.3, ex:[{f:"E",to:"Q"}], endW:"sealed"},
  {id:"K", name:"Nordgang",        c:[4.3,0,-3.6],    w:1.3, h:1.2, d:5,   ex:[{f:"S",to:"B"},{f:"N",to:"M"}]},
  {id:"M", name:"Kreuzung 3",      c:[4.3,0,-7.2],    ...J, ex:[{f:"S",to:"K"},{f:"W",to:"N1"},{f:"E",to:"O"}]},
  {id:"N1",name:"Archivschacht",   c:[1.0,0,-7.2],    w:4,   h:1.2, d:1.3, ex:[{f:"E",to:"M"}], endW:"sealed"},
  {id:"O", name:"Ostgang",         c:[8.1,0,-7.2],    w:5,   h:1.2, d:1.3, ex:[{f:"W",to:"M"},{f:"D",to:"S2",x:1.2,z:0}]},
  {id:"S1",name:"Fallschacht 1",   c:[4.3,-4.6,0],    w:1.3, h:4.6, d:1.3, slip:1, ex:[{f:"U",to:"B",x:0,z:0},{f:"E",to:"E1"}]},
  {id:"E1",name:"Tiefgang",        c:[7.95,-4.6,0],   w:6,   h:1.2, d:1.3, ex:[{f:"W",to:"S1"},{f:"E",to:"F"}]},
  {id:"F", name:"Kreuzung 4",      c:[12.25,-4.6,0],  ...J, ex:[{f:"W",to:"E1"},{f:"E",to:"J"},{f:"D",to:"S3",x:0,z:0}]},
  {id:"J", name:"Wartungsgang",    c:[15.55,-4.6,0],  w:4,   h:1.2, d:1.3, ex:[{f:"W",to:"F"}], endE:"sealed"},
  {id:"S3",name:"Pumpenschacht",   c:[12.25,-10.6,0], w:3,   h:6,   d:3,   slip:1, wide:1, ex:[{f:"U",to:"F",x:0,z:0},{f:"E",to:"H"}]},
  {id:"H", name:"Auslass 7-C",     c:[16.75,-10.6,0], w:6,   h:1.2, d:1.3, ex:[{f:"W",to:"S3"},{f:"N",to:"T2",o:-2}], endE:"goal"},
  {id:"S2",name:"Tiefer Schacht",  c:[9.3,-10.6,-7.2],w:1.3, h:10.6,d:1.3, slip:1, deep:1, ex:[{f:"U",to:"O",x:0,z:0},{f:"E",to:"T1"}]},
  {id:"T1",name:"Sammelgang",      c:[12.025,-10.6,-7.2],w:4.15,h:1.2,d:1.3, ex:[{f:"W",to:"S2"},{f:"E",to:"T2"}]},
  {id:"T2",name:"Südgang",         c:[14.75,-10.6,-4.25],w:1.3,h:1.2, d:7.2, ex:[{f:"N",to:"T1"},{f:"S",to:"H"}]}];
const NODES = {};
for (const n of NODEDEF) { NODES[n.id] = n; n.ax = n.w >= n.d ? "x" : "z"; n.L = n.ax === "x" ? n.w : n.d; n.Wl = n.ax === "x" ? n.d : n.w; n.cs = .5; n.cx = Math.ceil(n.L/n.cs); n.cy = Math.ceil(n.h/n.cs); n.seen = new Uint8Array(n.cx*n.cy); n.entered = false; }
const SIGNS = {A:[["f",">> AUSLASS 7-C",-.4,0,0]], B:[["f","v EBENE 2",.2,.6,Math.PI/2]], C:[["f","LUEFTERRAUM",-.2,0,0]], E1:[["f",">> AUSLASS 7-C",.2,0,0]], F:[["f","v EBENE 3",.2,.6,Math.PI/2]], H:[["f",">> AUSGANG",.4,0,0]], J:[["f","WARTUNG · GESPERRT",0,0,0]], O:[["f","v TIEFSCHACHT",.2,0,0]], K:[["f","^ NORD",0,0,Math.PI/2]]};

const ductBase = canvasTex(256,256,(x,w,h)=>{ x.fillStyle="#4b5d88"; x.fillRect(0,0,w,h); speckle(x,w,h,4500,.2);
  const g = x.createLinearGradient(0,0,0,h); g.addColorStop(0,"rgba(255,255,255,.10)"); g.addColorStop(1,"rgba(20,30,70,.18)"); x.fillStyle = g; x.fillRect(0,0,w,h);
  x.strokeStyle="rgba(210,225,255,.28)"; x.lineWidth=2; x.strokeRect(1,1,w-2,h-2); x.lineWidth=1; x.beginPath(); x.moveTo(w/2,0); x.lineTo(w/2,h); x.stroke();
  x.fillStyle="#aebbd8"; for (const [a,b] of [[14,14],[w-14,14],[14,h-14],[w-14,h-14],[w/2-12,h/2],[w/2+12,h/2]]) { x.beginPath(); x.arc(a,b,3.5,0,7); x.fill(); }
  x.fillStyle="#3c8680"; x.globalAlpha=.85; x.fillRect(0,h-26,w,8); x.globalAlpha=1; }, 1, 1);
function ductFor(wm, hm) { const t = ductBase.clone(); t.needsUpdate = true; t.repeat.set(Math.max(1, wm/1.2), Math.max(1, hm/1.2)); return t; }
function setBox(w, h, d) { TAU = .07; skyLim = 1e9; W = w/2; H = h; D = d/2; DN = D; PLANES[1].c = -H; PLANES[2].c = -W; PLANES[3].c = -W; PLANES[4].c = -D; PLANES[5].c = -D; }
function rebuildRoom() {
  for (const m of roomMeshes) if (m) { scene.remove(m); m.geometry.dispose(); }
  roomPlane(0, 2*W, 2*D, ductFor(2*W, 2*D), V3(0,0,0)); roomPlane(1, 2*W, 2*D, ductFor(2*W, 2*D), V3(0,H,0));
  roomPlane(2, 2*D, H, ductFor(2*D, H), V3(-W,H/2,0)); roomPlane(3, 2*D, H, ductFor(2*D, H), V3(W,H/2,0));
  roomPlane(4, 2*W, H, ductFor(2*W, H), V3(0,H/2,-D)); roomPlane(5, 2*W, H, ductFor(2*W, H), V3(0,H/2,D));
}
function stencil(text, sw, sh, col) {
  const t = canvasTex(512, Math.round(512*sh/sw), (x,w,h)=>{ x.clearRect(0,0,w,h); x.fillStyle = col || "#4fa9a3"; x.globalAlpha = .9; x.font = "bold " + Math.round(h*.46) + "px monospace"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(text, w/2, h/2, w*.94); }, 1, 1);
  return new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), new THREE.MeshBasicMaterial({map:t, transparent:true, depthWrite:false}));
}
// Öffnungen zeigen einen hellen Gang dahinter (kein Schwarz)
const holeTex = canvasTex(64,64,(x,w,h)=>{ const g = x.createRadialGradient(w/2,h/2,2,w/2,h/2,w*.75); g.addColorStop(0,"#9fb4e6"); g.addColorStop(.5,"#4a6096"); g.addColorStop(1,"#26335c"); x.fillStyle = g; x.fillRect(0,0,w,h); },1,1);
const holeMat = new THREE.MeshBasicMaterial({map:holeTex});
function frameBox(g, w, h, d, x, y, z) { box(w, h, d, mOrM, x, y, z, g); }
function holeAt(g, f, o, ex, n) {
  if (f === "E" || f === "W") { const s = f === "E" ? 1 : -1, ow = Math.min(n.d - .3, 1.0), oh = Math.min(n.h - .2, 1.0);
    const p = new THREE.Mesh(new THREE.PlaneGeometry(ow, oh), holeMat); p.position.set(s*(W - .012), oh/2, o); p.rotation.y = -s*Math.PI/2; g.add(p);
    frameBox(g,.04,.05,ow + .1,s*(W - .025),oh + .025,o); frameBox(g,.04,oh + .05,.05,s*(W - .025),oh/2,o + ow/2 + .025); frameBox(g,.04,oh + .05,.05,s*(W - .025),oh/2,o - ow/2 - .025); }
  else if (f === "N" || f === "S") { const s = f === "S" ? 1 : -1, ow = Math.min(n.w - .3, 1.0), oh = Math.min(n.h - .2, 1.0);
    const p = new THREE.Mesh(new THREE.PlaneGeometry(ow, oh), holeMat); p.position.set(o, oh/2, s*(D - .012)); p.rotation.y = s > 0 ? Math.PI : 0; g.add(p);
    frameBox(g,ow + .1,.05,.04,o,oh + .025,s*(D - .025)); frameBox(g,.05,oh + .05,.04,o + ow/2 + .025,oh/2,s*(D - .025)); frameBox(g,.05,oh + .05,.04,o - ow/2 - .025,oh/2,s*(D - .025)); }
  else { const up = f === "U", y = up ? H - .012 : .012, sz = Math.min(.9, n.w - .3, n.d - .3), p = new THREE.Mesh(new THREE.PlaneGeometry(sz, sz), holeMat);
    p.position.set(ex.x, y, ex.z); p.rotation.x = up ? Math.PI/2 : -Math.PI/2; g.add(p); const yy = up ? H - .025 : .025, q = sz/2 + .03;
    frameBox(g, sz + .1, .04, .05, ex.x, yy, ex.z + q); frameBox(g, sz + .1, .04, .05, ex.x, yy, ex.z - q); frameBox(g, .05, .04, sz, ex.x + q, yy, ex.z); frameBox(g, .05, .04, sz, ex.x - q, yy, ex.z); }
}
let fanG = null, sealL = null;
function endFace(g, kind, n, s) {   // s = +1 Ostende, -1 Westende (nur Gänge entlang x)
  const oh = n.h - .02, ow = n.d - .02, X = s*(W - .012);
  if (kind === "einstieg") { const t = stencil("VENT 7-C", 1.0, .24); t.position.set(X, .75, 0); t.rotation.y = s > 0 ? -Math.PI/2 : Math.PI/2; g.add(t); }
  if (kind === "fan") { fanG = new THREE.Group(); fanG.position.set(s*(W - .08), oh/2, 0); g.add(fanG);
    for (let i = 0; i < 6; i++) { const b = box(.02, .5, .2, mStd(0x3a4a72,.5,.5), 0, 0, 0, fanG); b.position.set(0, Math.cos(i*Math.PI/3)*.26, Math.sin(i*Math.PI/3)*.26); b.rotation.x = i*Math.PI/3; }
    box(.05,.12,.12,mOrM,0,0,0,fanG); for (let i = 0; i < 5; i++) box(.02,oh,.03,mStd(0x8c98b4,.6,.4),s*(W - .03),oh/2,-.5 + i*.25,g);
    const p = new THREE.Mesh(new THREE.PlaneGeometry(ow, oh), holeMat); p.position.set(X, oh/2, 0); p.rotation.y = -s*Math.PI/2; g.add(p); }
  if (kind === "sealed") { const p = new THREE.Mesh(new THREE.PlaneGeometry(ow, oh), new THREE.MeshBasicMaterial({color:0x4a2a2a})); p.position.set(X, oh/2, 0); p.rotation.y = -s*Math.PI/2; g.add(p);
    for (let i = 0; i < 6; i++) box(.03, oh, .045, mStd(0x8a7a72,.6,.5), s*(W - .05), oh/2, -.5 + i*.2, g); box(.04,.05,ow,mOrM,s*(W - .05),oh*.5,0,g);
    const t = stencil("GESPERRT", .9, .2, "#ff6a40"); t.position.set(s*(W - .07), oh*.72, 0); t.rotation.y = -s*Math.PI/2; g.add(t); }
  if (kind === "goal") { const p = new THREE.Mesh(new THREE.PlaneGeometry(ow, oh), new THREE.MeshBasicMaterial({color:0xf4f8ff})); p.position.set(X, oh/2, 0); p.rotation.y = -s*Math.PI/2; g.add(p);
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(ow*2.2, oh*2.2), new THREE.MeshBasicMaterial({map:canvasTex(128,128,(x,w,h)=>{ const r = x.createRadialGradient(w/2,h/2,4,w/2,h/2,w/2); r.addColorStop(0,"rgba(255,255,255,.55)"); r.addColorStop(1,"rgba(255,255,255,0)"); x.fillStyle = r; x.fillRect(0,0,w,h); },1,1), transparent:true, depthWrite:false, blending:THREE.AdditiveBlending}));
    gl.position.set(s*(W - .05), oh/2, 0); gl.rotation.y = -s*Math.PI/2; g.add(gl);
    frameBox(g,.04,.05,ow + .1,s*(W - .025),oh + .025,0); frameBox(g,.04,oh + .05,.05,s*(W - .025),oh/2,ow/2 + .025); frameBox(g,.04,oh + .05,.05,s*(W - .025),oh/2,-ow/2 - .025); }
}
function wallSign(g, text, f, lat, y, sw, sh) {
  const t = stencil(text, sw || .9, sh || .22), r = {E:[W - .012,lat,-Math.PI/2,"x"], W:[-W + .012,lat,Math.PI/2,"x"], S:[lat,D - .012,Math.PI,"z"], N:[lat,-D + .012,0,"z"]}[f];
  if (r[3] === "x") t.position.set(r[0], y, r[1]); else t.position.set(r[0], y, r[1]); if (r[3] === "z") t.position.set(r[0], y, r[1]); t.rotation.y = r[2]; g.add(t);
}
function buildNode(id) {
  const n = NODES[id]; shaft.cur = n; setBox(n.w, n.h, n.d); rebuildRoom();
  while (shaftG.children.length) { const o = shaftG.children.pop(); o.traverse(c => { if (c.geometry) c.geometry.dispose(); }); }
  fanG = null; sealL = null;
  for (const e of n.ex) holeAt(shaftG, e.f, e.o || 0, e, n);
  if (n.ax === "x") { endFace(shaftG, n.endW, n, -1); endFace(shaftG, n.endE, n, 1); }
  // Leuchtstreifen
  const strip = [new THREE.MeshBasicMaterial({color:0xffb066}), new THREE.MeshBasicMaterial({color:0xe4ebf7})];
  if (n.h <= 2.6) { if (n.ax === "x") for (let x = -W + 1.1, i = 0; x < W - .5; x += 1.9, i++) box(.7,.02,.12,strip[i%2],x,H - .015,0,shaftG); else for (let z = -D + 1.1, i = 0; z < D - .5; z += 1.9, i++) box(.12,.02,.7,strip[i%2],0,H - .015,z,shaftG); }
  else { for (let y = .9, i = 0; y < H - .3; y += 1.3, i++) { box(.02,.5,.12,strip[i%2],-W + .015,y,0,shaftG); if (n.wide) box(.02,.5,.12,strip[(i + 1)%2],W - .015,y,0,shaftG); }
    // Tiefenmarken an der Wand
    for (let m = 1; m < H; m += 2) { const t = stencil("-" + (n.deep ? m + 0 : m) + " m", .5, .16, "#e4ebf7"); t.position.set(0, H - m, -D + .012); shaftG.add(t); }
    wallSign(shaftG, "ABSEILEN  v", "S", 0, H - .5, .9, .2); }
  if (n.wide) { // Rohre als Kulisse
    for (const x of [-W + .2, W - .2]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,H,10), pipeMat(H)); c.position.set(x, H/2, -D + .15); shaftG.add(c); } }
  for (const [, text, lat, zz, yaw] of (SIGNS[id] || [])) { const t = stencil(text, 1.5, .3); const gr = new THREE.Group(); t.rotation.x = -Math.PI/2; gr.add(t); gr.rotation.y = n.ax === "x" ? 0 : Math.PI/2; gr.position.set(n.ax === "x" ? lat : 0, .006, n.ax === "x" ? zz*.0 : lat); shaftG.add(gr); }
  lamp.color.setHex(0xf2f6ff); lamp.intensity = 1; fill.intensity = 0; alarmL.position.set(0, H - .3, 0);
}
function placeAt(px, py, pz, nx, ny, nz, hx, hy, hz) {
  pos.set(px,py,pz); nS.set(nx,ny,nz); nB.copy(nS); hd.set(hx,hy,hz).normalize(); vel.set(0,0,0); speed = 0; yawRate = 0;
  frameQ.identity(); updateFrame(1, 100, nS); orient(); _t1.copy(hd).applyQuaternion(_q1.copy(frameQ).invert()); camYaw = Math.atan2(-_t1.x, -_t1.z); camPitch = .5;
  mode = "surf"; hack.state = 0; mel.state = 0; jump.lock = false; jump.charge = 0; hipNow = HIP_H; ropeLine.visible = false;
  for (const l of legs) { l.type = false; l.land = false; l.stepping = false; l.rest.copy(l.restLocal); spider.localToWorld(l.rest); groundPoint(l.rest, nS, l.foot); }
}
function spawnAt(id, from) {
  const n = NODES[id], hw = HIP_H*S, ex = from ? (n.ex.find(e => e.to === from) || n.ex[0]) : {f:"W"}, f = ex.f, o = ex.o || 0, a = .55;
  if (f === "W") placeAt(-W + a, hw, o, 0,1,0, 1,0,0); else if (f === "E") placeAt(W - a, hw, o, 0,1,0, -1,0,0);
  else if (f === "N") placeAt(o, hw, -D + a, 0,1,0, 0,0,1); else if (f === "S") placeAt(o, hw, D - a, 0,1,0, 0,0,-1);
  else if (f === "D") placeAt(ex.x - (n.ax === "x" ? .8 : 0), hw, ex.z - (n.ax === "x" ? 0 : .8), 0,1,0, n.ax === "x" ? -1 : 0,0,n.ax === "x" ? 0 : -1);
  else placeAt(ex.x, H - hw, ex.z + (n.d > 2 ? .6 : 0), 0,-1,0, 1,0,0);
}
function loadNode(id, from) {
  buildNode(id); spawnAt(id, from); NODES[id].entered = true; shaft.cp = {id, from}; shaft.hintT = 0; shaft.t0 = clockT; markSeen();
  if (NODES[id].slip && !shaft.said.slip) { shaft.said.slip = 1; setTimeout(() => say("SYSTEM", "Schachtwände zu glatt – nicht klettern. An der Decke ↓ halten zum Abseilen. Ein Sturz aus dieser Höhe zerstört dich.", 7), 700); }
  if (NODES[id].deep && !shaft.said.deep) { shaft.said.deep = 1; setTimeout(() => say("SYSTEM", "Tiefer Schacht: ca. 10 m. Seil reicht bis zum Boden.", 4.5), 700); }
}
function fadeTo(fn) { if (shaft.busy) return; shaft.busy = true; mode = "cut"; $("fade").classList.add("on"); setTimeout(() => { fn(); $("fade").classList.remove("on"); shaft.busy = false; }, 420); }
function goNode(id) { const from = shaft.cur.id; fadeTo(() => loadNode(id, from)); }
function shaftDie() {
  if (shaft.dead || !shaft.on) return; shaft.dead = true; shaft.busy = true; sndOnce("heart", .7); mode = "cut"; ropeLine.visible = false;
  say("SYSTEM", "Kritischer Sturzschaden – ARACHNE-8 fällt aus. Neustart am letzten Knotenpunkt.", 4); story.sk += 1; $("hit").style.opacity = 1;
  setTimeout(() => showDeath("Kritischer Sturzschaden – ARACHNE-8 fällt aus.", () => { for (const k in PARTS) PARTS[k] = 1; const cp = shaft.cp; loadNode(cp.id, cp.from); $("hit").style.opacity = 0; $("fade").classList.remove("on"); shaft.busy = false; shaft.dead = false; }, 2800), 800);
}
function enterShaft() {
  cpSet("shaft"); shaft.on = true; story.lvl = 3; story.ph = "shaft"; sirenOn(false); sirenOn(true); document.body.classList.add("shaft"); spider.visible = true;
  testG.visible = winG.visible = labG.visible = false; for (const o of doorParts) o.visible = false; ventG.visible = ventF.visible = hole.visible = false;
  terms.forEach(T => { T.active = false; T.g.visible = false; }); blocks.length = 0; mann.visible = false; mann.position.set(40,0,0); dust.visible = false; story.dustA = 0; story.emerT = 0; story.lampT = .9; story.flick = 0;
  for (const s of shards) s.m.visible = false; $("fade").classList.add("on"); loadNode("A", null);
  setObj("Finde den Ausgang. Die 3D-Karte unten links zeichnet sich beim Erkunden selbst."); toast("Lüftungsnetz Sektor 7 · Karte [M] vergrößern, mit der Maus drehen");
  setTimeout(() => $("fade").classList.remove("on"), 500);
}
function ropeToCeiling() { mode = "surf"; ropeLine.visible = false; placeAt(rope.ax, H - HIP_H*S, rope.az, 0,-1,0, rope.face.x, 0, rope.face.z);
  for (const e of shaft.cur.ex) if (e.f === "U" && nearHole(e)) { goNode(e.to); return; } }
function nearHole(e) { return Math.hypot(pos.x - e.x, pos.z - e.z) < .7; }
function shaftInteract() {
  if (mode !== "surf" || hack.state || mel.state || shaft.busy) return null; const n = shaft.cur;
  for (const e of n.ex) { if (e.f === "D" && nB.y > .7 && nearHole(e)) return {label:"In den Schacht abseilen", act:() => goNode(e.to)};
    if (e.f === "U" && nB.y < -.7 && nearHole(e)) return {label:"Durch die Öffnung nach oben", act:() => goNode(e.to)}; }
  return null;
}
function exitCut() {
  const hw = HIP_H*S, z0 = pos.z, k = [[0, pos.x,pos.y,pos.z, hd.x,hd.y,hd.z, nS.x,nS.y,nS.z], [.9, pos.x + .35,hw,z0, 1,0,0, 0,1,0], [3.8, W + 1.9,hw,z0, 1,0,0, 0,1,0]];
  startCut({dur:6.4, bin:.3, bout:0,
    shots:[{t0:0,t1:6.4,a:() => [pos.x - 1.3,.5,z0 + .55,"S",0,0,54],b:() => [pos.x - 1.0,.38,z0 + .3,"S",0,0,44]}],
    ev:[[4.0,() => { $("fade").style.background = "#000"; $("fade").classList.add("on"); }]],
    subs:[[.4,3.2,"ARACHNE-8","Außenluft. Sensoren melden: Freigelände."],[3.4,5.8,"ARACHNE-8","Geschafft. Ab jetzt entscheide ich selbst."]],
    spider(t, dt) { pathPose(k, Math.min(t, 3.8), dt); }, final() {}, onEnd() { enterAlley(); }});
}
function showEnd() { $("endcard").classList.add("on"); $("fade").classList.remove("on"); $("fade").style.background = ""; spider.visible = false; document.body.classList.remove("shaft"); mode = "menu"; }

/* ---------- 3D-Karte ---------- */
const mapC = $("map"), mapX = mapC.getContext("2d"); let mapBig = false, mapT = 0, mYaw = .75, mPit = .75, mDrag = null;
function toggleMap() { mapBig = !mapBig; mapC.classList.toggle("big", mapBig); mapT = 0; }
mapC.addEventListener("pointerdown", e => { mDrag = {x:e.clientX, y:e.clientY, moved:false}; mapC.setPointerCapture(e.pointerId); });
mapC.addEventListener("pointermove", e => { if (!mDrag) return; const dx = e.clientX - mDrag.x, dy = e.clientY - mDrag.y; if (Math.abs(dx) + Math.abs(dy) > 3) mDrag.moved = true;
  if (mapBig && mDrag.moved) { mYaw += dx*.01; mPit = clamp(mPit + dy*.006, .15, 1.35); mDrag.x = e.clientX; mDrag.y = e.clientY; mapT = 0; } });
mapC.addEventListener("pointerup", () => { if (mDrag && !mDrag.moved) toggleMap(); mDrag = null; });
function lat(n) { return n.ax === "x" ? pos.z : pos.x; }
function markSeen() {
  const n = shaft.cur; if (!n) return; const u = (n.ax === "x" ? pos.x : pos.z) + n.L/2, R = n.h > 2.6 ? 1.9 : 1.5;
  const ix0 = Math.max(0, Math.floor((u - R)/n.cs)), ix1 = Math.min(n.cx - 1, Math.floor((u + R)/n.cs)), iy0 = Math.max(0, Math.floor((pos.y - R)/n.cs)), iy1 = Math.min(n.cy - 1, Math.floor((pos.y + R)/n.cs));
  for (let iy = iy0; iy <= iy1; iy++) for (let ix = ix0; ix <= ix1; ix++) if (Math.hypot((ix + .5)*n.cs - u, (iy + .5)*n.cs - pos.y) < R) n.seen[iy*n.cx + ix] = 1;
}
function seenAtLocal(n, u, y) { const ix = clamp(Math.floor((u + n.L/2)/n.cs), 0, n.cx - 1), iy = clamp(Math.floor(y/n.cs), 0, n.cy - 1); return n.seen[iy*n.cx + ix]; }
function faceWorld(n, e) {      // Lochmitte in Weltkoordinaten + lokale Längsposition
  const c = n.c, o = e.o || 0; let x = c[0], y = c[1], z = c[2], u = 0, yy = .5;
  if (e.f === "E") { x += n.w/2; z += o; u = n.ax === "x" ? n.w/2 - .3 : o; } else if (e.f === "W") { x -= n.w/2; z += o; u = n.ax === "x" ? -n.w/2 + .3 : o; }
  else if (e.f === "S") { z += n.d/2; x += o; u = n.ax === "z" ? n.d/2 - .3 : o; } else if (e.f === "N") { z -= n.d/2; x += o; u = n.ax === "z" ? -n.d/2 + .3 : o; }
  else { x += e.x; z += e.z; u = n.ax === "x" ? e.x : e.z; yy = e.f === "U" ? n.h - .3 : .3; y += e.f === "U" ? n.h : 0; return {x, y, z, u, yy}; }
  return {x, y: y + .5, z, u, yy};
}
let mProj = null;
function prj(x, y, z) { const cy = Math.cos(mYaw), sy = Math.sin(mYaw), cp = Math.cos(mPit), sp = Math.sin(mPit), rx = x*cy + z*sy, rz = -x*sy + z*cy; return [rx, y*cp + rz*sp, rz*cp - y*sp]; }
function drawMap() {
  const dpr = Math.min(devicePixelRatio || 1, 2), cw = mapC.clientWidth, ch = mapC.clientHeight; if (!cw) return;
  if (mapC.width !== Math.round(cw*dpr) || mapC.height !== Math.round(ch*dpr)) { mapC.width = Math.round(cw*dpr); mapC.height = Math.round(ch*dpr); }
  const x = mapX; x.setTransform(dpr,0,0,dpr,0,0); x.clearRect(0,0,cw,ch);
  // Ausschnitt passend zum ganzen Netz
  let a0 = 1e9, a1 = -1e9, b0 = 1e9, b1 = -1e9;
  for (const n of NODEDEF) for (const sx of [-1,1]) for (const sz of [-1,1]) for (const yy of [0, n.h]) { const p = prj(n.c[0] + sx*n.w/2, n.c[1] + yy, n.c[2] + sz*n.d/2); a0 = Math.min(a0, p[0]); a1 = Math.max(a1, p[0]); b0 = Math.min(b0, p[1]); b1 = Math.max(b1, p[1]); }
  const pad = 14, top = 22, sc = Math.min((cw - 2*pad)/(a1 - a0), (ch - pad - top)/(b1 - b0)), ox = cw/2 - (a0 + a1)/2*sc, oy = top + (ch - top - pad)/2 + (b0 + b1)/2*sc;
  const P = (X, Y, Z) => { const p = prj(X, Y, Z); return [ox + p[0]*sc, oy - p[1]*sc, p[2]]; };
  x.fillStyle = "#4fa9a3"; x.font = "600 " + (mapBig ? 12 : 9) + "px system-ui,sans-serif"; x.textBaseline = "alphabetic"; x.fillText("KARTE · " + T(shaft.cur.name).toUpperCase(), pad, 14);
  x.fillStyle = "rgba(225,235,255,.7)"; x.textAlign = "right"; x.fillText("TIEFE −" + Math.max(0, -(shaft.cur.c[1] + pos.y)).toFixed(1) + " m", cw - pad, 14); x.textAlign = "left";
  // sichtbare Zellen als Quader, von hinten nach vorn
  const boxes = [];
  for (const n of NODEDEF) { if (!n.entered) continue; const cur = n === shaft.cur;
    for (let iy = 0; iy < n.cy; iy++) for (let ix = 0; ix < n.cx; ix++) if (n.seen[iy*n.cx + ix]) {
      const u0 = ix*n.cs - n.L/2, u1 = Math.min(n.L/2, u0 + n.cs), y0 = iy*n.cs, y1 = Math.min(n.h, y0 + n.cs), l = n.Wl/2;
      const bx = n.ax === "x" ? [n.c[0] + u0, n.c[0] + u1, n.c[2] - l, n.c[2] + l] : [n.c[0] - l, n.c[0] + l, n.c[2] + u0, n.c[2] + u1];
      const pc = prj((bx[0] + bx[1])/2, n.c[1] + (y0 + y1)/2, (bx[2] + bx[3])/2); boxes.push({b:bx, y0:n.c[1] + y0, y1:n.c[1] + y1, d:pc[2], cur}); } }
  boxes.sort((p, q) => q.d - p.d);
  const poly = (pts, fill) => { x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); x.fillStyle = fill; x.fill(); x.strokeStyle = "rgba(225,235,255,.22)"; x.lineWidth = .6; x.stroke(); };
  const cyw = Math.cos(mYaw), syw = Math.sin(mYaw), cp = Math.cos(mPit);
  for (const q of boxes) { const [X0, X1, Z0, Z1] = q.b, y0 = q.y0, y1 = q.y1, tone = q.cur ? 1 : .72;
    const top = [P(X0,y1,Z0), P(X1,y1,Z0), P(X1,y1,Z1), P(X0,y1,Z1)]; poly(top, "rgba(" + (190*tone|0) + "," + (215*tone|0) + ",255,.9)");
    // Seitenflächen, die zur Kamera zeigen (Normale · Blickrichtung)
    if (-syw*cp < 0) poly([P(X1,y0,Z0), P(X1,y0,Z1), P(X1,y1,Z1), P(X1,y1,Z0)], "rgba(" + (110*tone|0) + "," + (140*tone|0) + ",215,.9)");
    if (syw*cp < 0) poly([P(X0,y0,Z0), P(X0,y0,Z1), P(X0,y1,Z1), P(X0,y1,Z0)], "rgba(" + (110*tone|0) + "," + (140*tone|0) + ",215,.9)");
    if (cyw*cp < 0) poly([P(X0,y0,Z1), P(X1,y0,Z1), P(X1,y1,Z1), P(X0,y1,Z1)], "rgba(" + (85*tone|0) + "," + (112*tone|0) + ",190,.92)");
    if (-cyw*cp < 0) poly([P(X0,y0,Z0), P(X1,y0,Z0), P(X1,y1,Z0), P(X0,y1,Z0)], "rgba(" + (85*tone|0) + "," + (112*tone|0) + ",190,.92)"); }
  // Öffnungen, Ausgang, gesperrte Enden
  const dot = (X, Y, Z, r, col) => { const p = P(X, Y, Z); x.fillStyle = col; x.beginPath(); x.arc(p[0], p[1], r, 0, 7); x.fill(); return p; };
  for (const n of NODEDEF) { if (!n.entered) continue;
    for (const e of n.ex) { const w = faceWorld(n, e); if (seenAtLocal(n, w.u, w.yy)) dot(w.x, w.y, w.z, Math.max(2.2, sc*.2), NODES[e.to].entered ? "#ffffff" : "#4fa9a3"); }
    if (n.ax === "x") for (const [k, s] of [[n.endE, 1], [n.endW, -1]]) { if (!k) continue; if (!seenAtLocal(n, s*(n.L/2 - .3), .6)) continue; const X = n.c[0] + s*n.w/2, Y = n.c[1] + .6, Z = n.c[2];
      if (k === "goal") { const p = P(X, Y, Z), R = sc*.9 + 4; x.fillStyle = "#fff"; x.beginPath(); for (let i = 0; i < 10; i++) { const r = i%2 ? R*.4 : R, ang = -Math.PI/2 + i*Math.PI/5; x.lineTo(p[0] + Math.cos(ang)*r, p[1] + Math.sin(ang)*r); } x.closePath(); x.fill(); x.fillStyle = "#4fa9a3"; x.fillText("AUSGANG", p[0] - 22, p[1] - R - 3); }
      else if (k === "sealed") dot(X, Y, Z, Math.max(2, sc*.18), "#ff5a30"); } }
  // Spieler + Blickrichtung
  const n = shaft.cur, wx = n.c[0] + pos.x, wy = n.c[1] + pos.y, wz = n.c[2] + pos.z, pm = P(wx, wy, wz), pf = P(wx + hd.x*1.1, wy + hd.y*1.1, wz + hd.z*1.1), pulse = 3.4 + 1.6*Math.abs(Math.sin(clockT*3));
  x.strokeStyle = "rgba(255,255,255,.9)"; x.lineWidth = 1.6; x.beginPath(); x.moveTo(pm[0], pm[1]); x.lineTo(pf[0], pf[1]); x.stroke();
  x.strokeStyle = "rgba(79,169,163,.95)"; x.lineWidth = 1.8; x.beginPath(); x.arc(pm[0], pm[1], pulse + 1.5, 0, 7); x.stroke(); x.fillStyle = "#fff"; x.beginPath(); x.arc(pm[0], pm[1], 2.8, 0, 7); x.fill();
  x.fillStyle = "rgba(225,235,255,.6)"; x.font = "9px system-ui,sans-serif"; x.textAlign = "right"; x.fillText(mapBig ? "ziehen = drehen · M = schließen" : "M · vergrößern", cw - pad, ch - 5); x.textAlign = "left";
}
function shaftTick(dt) {
  if (!shaft.on || !shaft.cur) return; const n = shaft.cur;
  if (siren && n.c) { const d = Math.hypot(n.c[0] + pos.x, n.c[1] + pos.y, n.c[2] + pos.z); siren.f = .04 + .96*Math.pow(clamp(1 - d/26, 0, 1), 1.6); }
  if (fanG) fanG.rotation.x += dt*7; if (sealL) sealL.intensity = .5 + .35*Math.sin(clockT*5);
  lamp.position.set(clamp(pos.x, -W + .3, W - .3), clamp(pos.y + nS.y*.5 + .35, .2, H - .15), clamp(pos.z + nS.z*.5, -D + .2, D - .2)); alarmL.position.set(lamp.position.x, H - .2, 0);
  if (mode === "surf" || mode === "air" || mode === "rope") { markSeen(); mapT -= dt; if (mapT <= 0) { mapT = .12; drawMap(); } }
  if (mode !== "surf" || shaft.busy) return;
  if (n.slip && Math.abs(nB.y) < .5 && !mel.state && clockT - shaft.t0 > 1.5) { mode = "air"; vel.copy(nB).multiplyScalar(.9); vel.y -= .4; jump.lock = true; if (clockT - shaft.slipMsg > 4) { shaft.slipMsg = clockT; toast("Zu rutschig! Abgerutscht"); } return; }
  if (pos.y < 1.3 && nB.y > .5) for (const e of n.ex) { const o = e.o || 0;
    if (e.f === "E" && pos.x > W - .3 && Math.abs(pos.z - o) < .55) return goNode(e.to); if (e.f === "W" && pos.x < -W + .3 && Math.abs(pos.z - o) < .55) return goNode(e.to);
    if (e.f === "S" && pos.z > D - .3 && Math.abs(pos.x - o) < .55) return goNode(e.to); if (e.f === "N" && pos.z < -D + .3 && Math.abs(pos.x - o) < .55) return goNode(e.to); }
  if (n.endW === "einstieg" && pos.x < -W + .45 && clockT - shaft.hintT > 6) { shaft.hintT = clockT; say("ARACHNE-8", "Zurück ins Labor? Das Gitter ist hinter mir zugefallen.", 3.5); }
  if (n.endE === "goal" && pos.x > W - .3) { shaft.busy = true; exitCut(); return; }
  if (n.ax === "x" && (n.endE === "sealed" && pos.x > W - .5 || n.endW === "sealed" && pos.x < -W + .5) && clockT - shaft.hintT > 6) { shaft.hintT = clockT; say("SYSTEM", "Gitter verschweißt – kein Ausgang.", 3.5); }
  if (n.endE === "fan" && pos.x > W - .6 && clockT - shaft.hintT > 6) { shaft.hintT = clockT; say("SYSTEM", "Lüfterraum – hier geht es nicht weiter.", 3.5); }
}
