
/* ======================= Sturzschaden / Bauteil-Zustand ======================= */
const PARTS = {};   // Bauteil -> Integrität 0..1
const LEGN = ["Vorderbein", "Vorderes Mittelbein", "Hinteres Mittelbein", "Hinterbein"], LEGP = ["Hüftservo", "Kniegelenk", "Fußsensor", "Aktuator"], BODYP = ["Sensorkopf", "Hauptakku", "Steuerplatine", "Rückenpanzer", "Laser-Emitter"];
const legName = l => LEGN[l.row] + (l.side > 0 ? " links" : " rechts");
legs.forEach(l => { PARTS[legName(l)] = 1; }); BODYP.forEach(n => PARTS[n] = 1);
let dmgShow = 0, dmgHit = 0;
function dmgMul() { let s = 0, n = 0; legs.forEach(l => { s += PARTS[legName(l)]; n++; }); return 1 - .3*(1 - s/n); }
function dmgAvg() { let s = 0, n = 0; for (const k in PARTS) { s += PARTS[k]; n++; } return s/n; }
function fallDamage(imp) {
  const sev = clamp((imp - 4.5)/3.5, 0, 1); if (sev <= 0) return;
  const k = 1 + (sev > .45 ? 1 : 0) + (sev > .8 ? 1 : 0), keys2 = Object.keys(PARTS), hit = [];
  while (hit.length < k) { const n = keys2[(Math.random()*keys2.length)|0]; if (!hit.includes(n) && PARTS[n] > .05) hit.push(n); }
  const rows = hit.map(n => { const amt = (.18 + .5*sev)*(.7 + Math.random()*.6)*uPz()*uFd(), was = PARTS[n]; PARTS[n] = Math.max(.02, was - amt);
    const leg = legs.find(l => legName(l) === n); let part = leg ? LEGP[(Math.random()*LEGP.length)|0] : "";
    if (leg) { emitSparks(leg.foot, nB); } else emitSparks(pos, nB);
    return '<div><span>' + T(n) + (part ? ' · ' + T(part) : '') + '</span><b>−' + Math.round((was - PARTS[n])*100) + ' %</b></div>'; });
  $("dmg").innerHTML = '<i>' + T('SCHADEN · ') + T(sev > .8 ? 'SCHWER' : sev > .45 ? 'MITTEL' : 'LEICHT') + '</i>' + rows.join(""); dmgShow = 4.2; dmgHit = 1;
  story.sk += .25 + .6*sev; clang(.5 + sev*.6); beep(160, .25, 0, .05); thud(imp);
  if (sev > .45) { sparkL.intensity = 1.5; sparkL.position.copy(pos); }
  if (shaft.on && imp > 8) shaftDie();
}
function dmgTick(dt) {
  const d = $("dmg"); if (dmgShow > 0) { dmgShow -= dt; d.classList.add("on"); } else d.classList.remove("on");
  dmgHit = Math.max(0, dmgHit - dt*2.2); $("hit").style.opacity = dmgHit*.8;
  for (const k in PARTS) PARTS[k] = Math.min(1, PARTS[k] + .002*(1 + gear.upg.repair)*dt);      // Selbstreparatur
  $("inFill").style.width = (dmgAvg()*100) + "%";
}
