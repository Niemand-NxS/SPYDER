/* ======================= Klänge: Musik, Atmosphäre, Effekte (eingebettete MP3s) ======================= */
const SND = {buf:{}, loops:{}, ready:false, mus:null};
function sndInit() {
  if (SND.ready || !ac) return; SND.ready = true; SND.mus = ac.createGain(); SND.mus.connect(master); sndVol();
  for (const k in SND_B64) { try { const bin = atob(SND_B64[k]), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); ac.decodeAudioData(u.buffer, b => { SND.buf[k] = b; }, () => {}); } catch (e) {} }
}
function sndVol() { if (SND.ready) SND.mus.gain.value = opt.music; }
function sndLoop(k, vol) {
  let l = SND.loops[k]; if (!SND.buf[k]) return;
  if (!l) { if (vol <= 0) return; const src = ac.createBufferSource(); src.buffer = SND.buf[k]; src.loop = true; const g = ac.createGain(); g.gain.value = 0; const lpF = ac.createBiquadFilter(); lpF.type = "lowpass"; lpF.frequency.value = ({city:260, police:300, juke:1500})[k] || 20000; src.connect(lpF); lpF.connect(g); g.connect(SND.mus); src.start(0, Math.random()*(k === "menu" ? 0 : 20)); l = SND.loops[k] = {src, g, v:0, t:0}; }
  l.t = vol;
}
function sndOnce(k, vol, bus) {
  if (!SND.buf[k] || !ac) return; const src = ac.createBufferSource(); src.buffer = SND.buf[k]; const g = ac.createGain(); g.gain.value = vol; src.connect(g); g.connect(bus || fxIn); src.start(); return {src, g};
}
function sndTick(dt) {
  if (!SND.ready) return; const want = {}, inMenu = document.body.classList.contains("menu");
  if (inMenu) want.menu = .6;
  else if (xs.on) { const od = xs.scene === "street" || xs.scene === "side"; want.city = od ? .09 : 0; want.room = od ? 0 : .18; }
  else if (alley.on) { want.juke = ch2.noMusic ? 0 : ch2.focus ? .03 : ch2.duck ? .16 : alley.inBar ? .55 : .05; want.city = alley.inBar ? .02 : .06; want.police = alley.inBar ? 0 : .03*Math.max(0, Math.sin(clockT*.06)); }
  else if (shaft.on) want.room = .22;
  else want.room = .3;
  for (const k in want) sndLoop(k, want[k]);
  for (const k in SND.loops) { const l = SND.loops[k]; if (!(k in want)) l.t = 0; l.v += (l.t - l.v)*Math.min(1, dt*1.4); l.g.gain.value = l.v; if (l.t === 0 && l.v < .003) { try { l.src.stop(); } catch (e) {} delete SND.loops[k]; } }
}
