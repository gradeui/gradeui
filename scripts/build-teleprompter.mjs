// build-teleprompter.mjs — turn a flow's captions into a REAL, speech-timed
// teleprompter (self-contained HTML you open and read from). Each line
// holds for roughly how long it takes to SAY it (~150 wpm), so it paces
// to your voice — and it prints the total narration length so you can see
// whether the script fits the demo.
//   node scripts/build-teleprompter.mjs --flow=scripts/flows/brightlocal-tour.json --out=teleprompter.html [--wpm=150]
// Controls: Space play/pause · ←/→ prev/next line · ↑/↓ speed · R restart · M mirror · F fullscreen · +/- font.
import fs from "node:fs";

const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] ?? true] : [a, true];
}));
if (!args.flow || !args.out) { console.error("Required: --flow=<flow.json> --out=<file.html>"); process.exit(1); }
const WPM = Number(args.wpm) || 150;

const flow = JSON.parse(fs.readFileSync(args.flow, "utf8"));
const lines = (flow.steps || []).filter((s) => s.caption).map((s) => s.caption);
if (!lines.length) { console.error("No caption fields in the flow — add \"caption\": \"…\" to steps."); process.exit(1); }

// Speaking-time estimate per line: words / wpm, with a floor + a small
// breath gap. This is what a presenter roughly needs to say it.
const secs = (t) => Math.max(1.6, (t.trim().split(/\s+/).length / WPM) * 60) + 0.4;
const durs = lines.map(secs);
const total = durs.reduce((a, b) => a + b, 0);

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Teleprompter</title>
<style>
  :root{--fs:56px}
  *{box-sizing:border-box} html,body{height:100%;margin:0}
  body{background:#0b0e0d;color:#e9efe9;font:400 var(--fs)/1.45 -apple-system,Helvetica,Arial,sans-serif;overflow:hidden;display:flex;align-items:center;justify-content:center}
  #bar{position:fixed;inset:0 0 auto 0;height:0;background:#2AE855;z-index:5;transition:width .1s linear}
  #stage{width:84vw;text-align:center;position:relative}
  .l{position:absolute;left:0;right:0;top:50%;transform:translateY(-50%);opacity:0;transition:opacity .3s,transform .3s;padding:0 2vw}
  .l.on{opacity:1} .l.prev{opacity:.16;transform:translateY(-160%)} .l.next{opacity:.16;transform:translateY(60%)}
  #hud{position:fixed;left:0;right:0;bottom:0;padding:12px 16px;font:600 15px/1 ui-monospace,monospace;color:#9fb3a6;background:#0b0e0dcc;display:flex;gap:20px;justify-content:center;z-index:6}
  #hud b{color:#e9efe9}
  body.mirror #stage{transform:scaleX(-1)}
</style></head><body>
<div id="bar"></div>
<div id="stage"></div>
<div id="hud"><span>▶ <b id="st">paused</b></span><span><b id="ln">1</b>/${lines.length}</span><span>speed <b id="sp">1.0</b>×</span><span>total ~<b>${Math.round(total)}s</b></span><span>Space · ←→ · ↑↓ speed · R · M mirror · F full</span></div>
<script>
const LINES=${JSON.stringify(lines)}, DURS=${JSON.stringify(durs.map((d) => +d.toFixed(2)))};
const stage=document.getElementById('stage'), bar=document.getElementById('bar');
stage.innerHTML=LINES.map((t,i)=>'<p class="l" data-i="'+i+'">'+t.replace(/</g,'&lt;')+'</p>').join('');
const els=[...stage.querySelectorAll('.l')];
let cur=0, playing=false, speed=1, t0=0, acc=0;
function render(){ els.forEach((el,i)=>{ el.className='l'+(i===cur?' on':i<cur?' prev':' next'); });
  document.getElementById('ln').textContent=cur+1; }
function step(ts){ if(playing){ if(!t0)t0=ts; const el=(ts-t0)/1000*speed + acc; const need=DURS[cur];
    bar.style.width=Math.min(100,el/need*100)+'%';
    if(el>=need){ if(cur<LINES.length-1){cur++;render();t0=ts;acc=0;bar.style.width='0';} else {set(false);} } }
  requestAnimationFrame(step); }
function set(p){ playing=p; if(!p)acc=0; t0=0; document.getElementById('st').textContent=p?'playing':'paused'; }
addEventListener('keydown',e=>{
  if(e.code==='Space'){e.preventDefault();set(!playing);}
  else if(e.key==='ArrowRight'){cur=Math.min(LINES.length-1,cur+1);render();t0=0;acc=0;bar.style.width='0';}
  else if(e.key==='ArrowLeft'){cur=Math.max(0,cur-1);render();t0=0;acc=0;bar.style.width='0';}
  else if(e.key==='ArrowUp'){speed=Math.min(3,speed+0.1);}
  else if(e.key==='ArrowDown'){speed=Math.max(0.3,speed-0.1);}
  else if(e.key==='r'||e.key==='R'){cur=0;render();t0=0;acc=0;bar.style.width='0';set(false);}
  else if(e.key==='m'||e.key==='M'){document.body.classList.toggle('mirror');}
  else if(e.key==='f'||e.key==='F'){document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();}
  else if(e.key==='+'||e.key==='='){document.documentElement.style.setProperty('--fs',(parseInt(getComputedStyle(document.documentElement).getPropertyValue('--fs'))+4)+'px');}
  else if(e.key==='-'){document.documentElement.style.setProperty('--fs',(parseInt(getComputedStyle(document.documentElement).getPropertyValue('--fs'))-4)+'px');}
  document.getElementById('sp').textContent=speed.toFixed(1);
});
render(); requestAnimationFrame(step);
</script></body></html>`;
fs.writeFileSync(args.out, html);
console.log(`✅ ${args.out}  (${lines.length} lines, ~${Math.round(total)}s of narration @ ${WPM} wpm)`);
console.log("   Per-line speaking estimates (use these as your minimum dwell times):");
lines.forEach((t, i) => console.log(`   ${String(i + 1).padStart(2)}. ${durs[i].toFixed(1)}s  ${t.slice(0, 64)}${t.length > 64 ? "…" : ""}`));
