/* ═══════════════════════════════════════════════════════════
 * natal-overlay.js — 行星頁本命盤浮條 + 自動高亮 + 課程導覽
 * 機制：
 *   1. 從 URL 推測當前行星，依固定學習順序找上一/下一行星
 *   2. 讀 localStorage 'astro_natal_chart' → 個人化資料
 *   3. 注入頂部 sticky 浮條（個人化 pills + 跳轉按鈕 + 上一/下一）
 *   4. 自動高亮頁面上的「你的星座 / 你的宮位」卡片
 *   5. 滾到底部時注入「下一堂課」CTA 區塊
 * ═══════════════════════════════════════════════════════════ */
(function(){
'use strict';

const ORDER = ['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'];

const PLANET_NAMES = {
  sun:'太陽', moon:'月亮', mercury:'水星', venus:'金星', mars:'火星',
  jupiter:'木星', saturn:'土星', uranus:'天王星', neptune:'海王星', pluto:'冥王星'
};

const PLANET_GLYPHS = {
  sun:'☉', moon:'☽', mercury:'☿', venus:'♀', mars:'♂',
  jupiter:'♃', saturn:'♄', uranus:'♅', neptune:'♆', pluto:'♇'
};

const ARABIC_TO_CH = ['','一','二','三','四','五','六','七','八','九','十','十一','十二'];

const STORAGE_PROGRESS = 'astro_progress_visited';

function detectPlanet(){
  const m = location.pathname.match(/\/(sun|moon|mercury|venus|mars|jupiter|saturn|uranus|neptune|pluto)(?:\/|\/index\.html|$)/);
  return m ? m[1] : null;
}

function loadChart(){
  try { return JSON.parse(localStorage.getItem('astro_natal_chart') || 'null'); }
  catch(_) { return null; }
}

function loadProgress(){
  try { return JSON.parse(localStorage.getItem(STORAGE_PROGRESS) || '[]'); }
  catch(_) { return []; }
}

function markVisited(planetKey){
  const list = loadProgress();
  if(!list.includes(planetKey)){
    list.push(planetKey);
    localStorage.setItem(STORAGE_PROGRESS, JSON.stringify(list));
    // 全部 10 顆完成 → 觸發證書（一次性）
    if(list.length === 10 && !localStorage.getItem('astro_completion_celebrated')){
      localStorage.setItem('astro_completion_celebrated', new Date().toISOString());
      setTimeout(triggerCompletion, 1500);
    }
  }
}

function triggerCompletion(){
  // 注入 confetti + 證書 modal
  const overlay = document.createElement('div');
  overlay.className = 'natal-complete-overlay';
  overlay.innerHTML = `
    <div class="nc-confetti" id="nc-confetti"></div>
    <div class="nc-card">
      <div class="nc-crest">✦</div>
      <div class="nc-tag">// COMPLETION CERTIFICATE</div>
      <h2 class="nc-title">你已遊歷十大星體</h2>
      <p class="nc-sub">從太陽到冥王星 ─ 你完成了西洋占星完整入門。</p>
      <p class="nc-quote">"As above, so below ─ the planets are mirrors of you."</p>
      <p class="nc-meta">完成日期：<strong>${new Date().toISOString().slice(0,10)}</strong></p>
      <div class="nc-actions">
        <button type="button" class="nc-btn-primary" id="nc-back">回入口看完整本命盤</button>
        <button type="button" class="nc-btn-ghost" id="nc-close">繼續閱讀本頁</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // 注入 styles
  if(!document.getElementById('nc-style')){
    const css = `
.natal-complete-overlay{position:fixed;inset:0;z-index:9990;background:rgba(2,1,3,.92);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:24px;animation:ncFade .6s ease}
@keyframes ncFade{from{opacity:0}to{opacity:1}}
.nc-card{position:relative;max-width:560px;width:100%;padding:60px 40px 40px;background:linear-gradient(180deg,#0A0508 0%,#1A0F0A 50%,#0A0508 100%);border:2px solid #FFE08A;text-align:center;box-shadow:0 0 80px -16px rgba(255,224,138,.6),0 32px 80px -20px rgba(0,0,0,.95);animation:ncRise .8s cubic-bezier(.34,1.56,.64,1)}
@keyframes ncRise{from{transform:translateY(40px) scale(.85);opacity:0}to{transform:translateY(0) scale(1);opacity:1}}
.nc-crest{font-family:'Cinzel',serif;font-size:80px;color:#FFE08A;text-shadow:0 0 40px rgba(255,224,138,.8);line-height:1;animation:ncSpin 8s linear infinite;margin-bottom:14px}
@keyframes ncSpin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
.nc-tag{font-family:'Major Mono Display','VT323',monospace;font-size:11px;letter-spacing:.5em;color:#D4AF37;text-transform:uppercase;margin-bottom:12px}
.nc-title{font-family:'Cinzel',serif;font-size:clamp(1.8rem,4vw,2.6rem);font-weight:900;color:#FFE08A;letter-spacing:.06em;margin-bottom:14px;text-shadow:0 0 32px rgba(255,224,138,.5)}
.nc-sub{font-family:'Cormorant Garamond',serif;font-style:italic;color:#E8DCC4;font-size:1.1rem;line-height:1.6;margin-bottom:14px}
.nc-quote{font-family:'Cormorant Garamond',serif;font-style:italic;color:#D4AF37;font-size:1rem;border-top:1px solid rgba(212,175,55,.3);border-bottom:1px solid rgba(212,175,55,.3);padding:18px 0;margin:18px 0}
.nc-meta{font-family:'Major Mono Display','VT323',monospace;font-size:12px;letter-spacing:.2em;color:#C0C8D8;margin-bottom:24px}
.nc-meta strong{color:#FFE08A;font-weight:700}
.nc-actions{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
.nc-btn-primary,.nc-btn-ghost{padding:12px 24px;font-family:'Cinzel',serif;font-size:13px;letter-spacing:.2em;text-transform:uppercase;font-weight:700;cursor:pointer;border:1px solid #FFE08A;transition:all .3s ease;text-decoration:none;display:inline-block}
.nc-btn-primary{background:#FFE08A;color:#0A0508}
.nc-btn-primary:hover{background:#FFF6D8;box-shadow:0 0 24px -4px #FFE08A}
.nc-btn-ghost{background:transparent;color:#FFE08A}
.nc-btn-ghost:hover{background:rgba(255,224,138,.15)}
.nc-confetti{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.nc-piece{position:absolute;width:8px;height:14px;background:var(--c,#FFE08A);animation:ncFall var(--d,3s) linear forwards;top:-20px;transform-origin:center}
@keyframes ncFall{0%{transform:translate3d(0,0,0) rotate(0)}100%{transform:translate3d(var(--x,0),105vh,0) rotate(720deg)}}
@media(prefers-reduced-motion:reduce){.nc-crest{animation:none}.nc-piece{display:none}}
    `;
    const s = document.createElement('style');
    s.id = 'nc-style';
    s.textContent = css;
    document.head.appendChild(s);
  }

  // 撒 confetti
  const confettiBox = document.getElementById('nc-confetti');
  const COLORS = ['#FFE08A','#D4AF37','#E8634C','#7DA8D9','#7AC48E','#9D8FC2','#FFCBA4'];
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
    for(let i = 0; i < 80; i++){
      const piece = document.createElement('div');
      piece.className = 'nc-piece';
      piece.style.left = Math.random() * 100 + 'vw';
      piece.style.setProperty('--c', COLORS[i % COLORS.length]);
      piece.style.setProperty('--x', (Math.random() * 200 - 100) + 'px');
      piece.style.setProperty('--d', (2.5 + Math.random() * 2.5) + 's');
      piece.style.animationDelay = (Math.random() * 1.2) + 's';
      // 隨機形狀（圓 / 方）
      if(Math.random() < 0.4) piece.style.borderRadius = '50%';
      confettiBox.appendChild(piece);
    }
  }

  // 綁事件
  document.getElementById('nc-back').addEventListener('click', () => location.href = '../index.html');
  document.getElementById('nc-close').addEventListener('click', () => overlay.remove());
  // 點外部關閉
  overlay.addEventListener('click', e => { if(e.target === overlay) overlay.remove(); });
}

function getNeighbors(planetKey){
  const i = ORDER.indexOf(planetKey);
  return {
    prev: i > 0 ? ORDER[i-1] : null,
    next: i < ORDER.length - 1 ? ORDER[i+1] : null,
    pos:  i + 1,
    total: ORDER.length,
    isLast: i === ORDER.length - 1,
  };
}

function injectStyles(){
  if(document.getElementById('natal-overlay-style')) return;
  const css = `
.natal-overlay-banner{
  position:sticky;top:0;left:0;right:0;z-index:55;
  display:flex;flex-wrap:wrap;align-items:center;gap:10px;
  padding:12px 22px;
  background:linear-gradient(180deg,rgba(10,5,8,.96),rgba(10,5,8,.82));
  border-bottom:1px solid #D4AF37;
  backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
  color:#E8DCC4;
  box-shadow:0 8px 28px -8px rgba(0,0,0,.6);
  font-family:'Cormorant Garamond','Times New Roman',serif;
}
.nob-back,.nob-next{
  display:inline-flex;align-items:center;gap:6px;
  padding:7px 14px;border:1px solid #D4AF37;
  font-family:'Cinzel',serif;font-size:12px;letter-spacing:.16em;text-transform:uppercase;
  text-decoration:none;font-weight:700;cursor:pointer;
  background:rgba(212,175,55,.06);color:#D4AF37;
  transition:all .25s ease;flex-shrink:0;
}
.nob-back:hover,.nob-next:hover{background:#D4AF37;color:#0A0508;box-shadow:0 0 14px -2px #D4AF37}
.nob-next.is-finish{background:linear-gradient(135deg,#D4AF37,#FFE08A);color:#0A0508;border-color:#FFE08A;animation:nobFinishPulse 2.4s ease-in-out infinite}
@keyframes nobFinishPulse{0%,100%{box-shadow:0 0 0 0 rgba(212,175,55,.6)}50%{box-shadow:0 0 24px 4px rgba(212,175,55,.6)}}
.nob-tag{font-family:'Major Mono Display','VT323',monospace;font-size:10px;letter-spacing:.4em;color:#D4AF37;text-transform:uppercase;padding:3px 10px;border:1px solid #D4AF37;background:rgba(0,0,0,.4);flex-shrink:0}
.nob-progress{font-family:'Major Mono Display','VT323',monospace;font-size:11px;letter-spacing:.2em;color:#C0C8D8;flex-shrink:0}
.nob-progress .pos{color:#FFE08A;font-size:1.2em;font-weight:700}
.nob-pill{display:inline-flex;align-items:center;gap:6px;padding:5px 12px;background:rgba(212,175,55,.14);border:1px solid rgba(212,175,55,.55);color:#FFE08A;font-family:'Cinzel',serif;font-weight:700;font-size:14px;letter-spacing:.05em}
.nob-pill .glyph{font-size:1.25em}
.nob-pill.warn{background:rgba(124,36,24,.18);border-color:#C49097;color:#E89DA5}
.nob-spacer{flex:1;min-width:8px}
.nob-jump{padding:7px 14px;border:1px solid rgba(212,175,55,.6);color:#D4AF37;background:rgba(212,175,55,.06);font-family:'Cinzel',serif;font-size:12px;letter-spacing:.18em;text-transform:uppercase;cursor:pointer;font-weight:700;transition:all .25s ease}
.nob-jump:hover{background:#D4AF37;color:#0A0508;box-shadow:0 0 14px -2px #D4AF37}

@media(max-width:880px){
  .natal-overlay-banner{padding:10px 14px;gap:8px}
  .nob-tag{display:none}
  .nob-progress{display:none}
}
@media(max-width:600px){
  .natal-overlay-banner{font-size:11px;padding:8px 12px;gap:6px}
  .nob-pill{padding:4px 8px;font-size:12px}
  .nob-jump,.nob-back,.nob-next{padding:5px 10px;font-size:10px;letter-spacing:.08em}
}

/* 你的星座/宮位高亮 */
.natal-target-glow{
  position:relative;outline:2px solid #D4AF37;outline-offset:4px;
  animation:natalGlowPulse 2s ease-in-out 3;
}
.natal-target-glow::before{
  content:"★ YOUR CHART";
  position:absolute;top:-12px;right:-2px;z-index:8;
  padding:3px 12px;font-family:'Major Mono Display','VT323',monospace;font-size:10px;letter-spacing:.3em;
  background:#D4AF37;color:#0A0508;font-weight:700;
  box-shadow:0 4px 14px -2px rgba(212,175,55,.7);pointer-events:none;
}
@keyframes natalGlowPulse{
  0%,100%{box-shadow:0 0 0 0 rgba(212,175,55,0)}
  50%{box-shadow:0 0 0 6px rgba(212,175,55,.45),0 0 40px -4px #D4AF37}
}

/* 底部下一堂課 CTA */
.natal-next-lesson{
  margin:48px auto 64px;max-width:1100px;padding:0 24px;
  font-family:'Cormorant Garamond','Times New Roman',serif;
}
.natal-next-lesson-card{
  display:flex;flex-wrap:wrap;align-items:center;gap:24px;
  padding:32px 36px;
  background:linear-gradient(135deg,rgba(212,175,55,.18) 0%,rgba(10,5,8,.6) 100%);
  border:1px solid #D4AF37;border-left-width:4px;
  box-shadow:0 24px 60px -20px rgba(0,0,0,.7),0 0 32px -8px rgba(212,175,55,.3);
  position:relative;overflow:hidden;
}
.natal-next-lesson-card::before{
  content:"";position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(ellipse at 80% 20%,rgba(212,175,55,.18) 0%,transparent 60%);
}
.nnl-meta{flex:1;min-width:240px;position:relative}
.nnl-tag{display:inline-block;font-family:'Major Mono Display','VT323',monospace;font-size:10px;letter-spacing:.5em;color:#D4AF37;text-transform:uppercase;margin-bottom:10px;padding:3px 10px;border:1px solid #D4AF37;background:rgba(0,0,0,.4)}
.nnl-title{font-family:'Cinzel',serif;font-weight:900;font-size:clamp(1.5rem,3vw,2.4rem);color:#FFE08A;letter-spacing:.04em;margin-bottom:8px;text-shadow:0 0 24px rgba(212,175,55,.4)}
.nnl-subtitle{color:#C0C8D8;font-style:italic;font-size:1.05rem;line-height:1.5}
.nnl-action{display:flex;flex-direction:column;gap:10px;align-items:stretch;min-width:240px;position:relative}
.nnl-btn{
  display:inline-flex;align-items:center;justify-content:space-between;gap:14px;
  padding:16px 24px;
  font-family:'Cinzel',serif;font-size:14px;letter-spacing:.2em;text-transform:uppercase;font-weight:700;
  text-decoration:none;cursor:pointer;border:1px solid #D4AF37;
  transition:all .3s cubic-bezier(.34,1.56,.64,1);
}
.nnl-btn-primary{background:#D4AF37;color:#0A0508}
.nnl-btn-primary:hover{background:#FFE08A;transform:translateX(6px);box-shadow:0 12px 32px -8px rgba(212,175,55,.7)}
.nnl-btn-ghost{background:transparent;color:#D4AF37}
.nnl-btn-ghost:hover{background:rgba(212,175,55,.12)}
.nnl-btn .glyph{font-family:'Major Mono Display',monospace;font-size:1.6em}
.nnl-finish{background:linear-gradient(135deg,#D4AF37,#FFE08A);color:#0A0508;border-color:#FFE08A;font-size:15px;animation:nnlFinishPulse 2s ease-in-out infinite}
@keyframes nnlFinishPulse{0%,100%{box-shadow:0 0 0 0 rgba(212,175,55,.6)}50%{box-shadow:0 0 32px 6px rgba(212,175,55,.6)}}
.nnl-progress-bar{margin-top:14px;display:flex;gap:4px;align-items:center;flex-wrap:wrap}
.nnl-dot{width:18px;height:6px;background:rgba(212,175,55,.2);border:1px solid rgba(212,175,55,.4);transition:all .3s}
.nnl-dot.done{background:#D4AF37;box-shadow:0 0 8px -2px #D4AF37}
.nnl-dot.current{background:#FFE08A;border-color:#FFE08A;box-shadow:0 0 12px -2px #FFE08A}
.nnl-progress-text{font-family:'Major Mono Display',monospace;font-size:11px;letter-spacing:.2em;color:#C0C8D8;margin-left:6px}

@media(max-width:680px){
  .natal-next-lesson-card{padding:24px 20px;gap:18px}
  .nnl-action{width:100%}
}
@media(prefers-reduced-motion:reduce){
  .natal-target-glow,.nob-next.is-finish,.nnl-finish{animation:none}
}

/* 今日影響卡 */
.natal-today-influence{margin:24px auto 18px;max-width:1100px;padding:0 24px;font-family:'Cormorant Garamond',serif}
.ti-card{padding:22px 28px;background:linear-gradient(135deg,rgba(255,224,138,.18) 0%,rgba(10,5,8,.45) 100%);border:1px solid #FFE08A;border-left:4px solid #FFE08A;box-shadow:0 12px 32px -12px rgba(255,224,138,.25)}
.ti-tag{display:inline-block;font-family:'Major Mono Display','VT323',monospace;font-size:10px;letter-spacing:.5em;color:#FFE08A;text-transform:uppercase;padding:3px 10px;border:1px solid #FFE08A;background:rgba(0,0,0,.4);margin-bottom:14px}
.ti-grid{display:grid;grid-template-columns:1fr auto 1fr;gap:18px;align-items:center;margin-bottom:14px}
.ti-side{padding:14px 18px;background:rgba(0,0,0,.4);border:1px solid rgba(255,224,138,.35)}
.ti-now{border-color:#7DA8D9;border-left:3px solid #7DA8D9}
.ti-natal{border-right:3px solid #FFE08A}
.ti-side-label{font-family:'Major Mono Display','VT323',monospace;font-size:10px;letter-spacing:.3em;color:#C0C8D8;text-transform:uppercase;margin-bottom:8px}
.ti-side-sign{font-family:'Cinzel',serif;font-size:1.4rem;font-weight:700;color:#FFE08A;margin-bottom:4px}
.ti-side-deg{font-family:'Major Mono Display','VT323',monospace;font-size:13px;color:#C0C8D8}
.ti-rx{display:inline-block;background:#C24438;color:#FFE08A;padding:1px 5px;font-size:.85em;font-family:'Cinzel',serif;border-radius:2px;margin-left:4px}
.ti-vs{text-align:center}
.ti-aspect{display:inline-flex;flex-direction:column;align-items:center;padding:10px 18px;background:rgba(255,224,138,.18);border:1px solid #FFE08A}
.ti-aspect.ti-aspect-quiet{background:rgba(192,200,216,.08);border-color:rgba(192,200,216,.4);color:#C0C8D8}
.ti-aspect-name{font-family:'Cinzel',serif;font-weight:700;color:#FFE08A;font-size:1.1rem;letter-spacing:.04em}
.ti-aspect-quiet .ti-aspect-name{color:#C0C8D8}
.ti-aspect-orb{font-family:'Major Mono Display','VT323',monospace;font-size:11px;color:#7A8090;letter-spacing:.18em;margin-top:4px}
.ti-tip{margin:12px 0 0;color:#E8DCC4;font-size:14px;line-height:1.6;font-style:italic}
.ti-sub-note{display:block;margin-top:8px;padding:8px 12px;background:rgba(255,224,138,.15);border-left:3px solid #FFE08A;color:#FFE08A;font-style:italic;font-size:13px}
.ti-sub-note strong{color:#FFF6D8;font-weight:700;font-style:normal}
@media(max-width:680px){.ti-grid{grid-template-columns:1fr;gap:10px}.ti-vs{order:1}.ti-now{order:0}.ti-natal{order:2}}
  `;
  const s = document.createElement('style');
  s.id = 'natal-overlay-style';
  s.textContent = css;
  document.head.appendChild(s);
}

function findContainer(needle){
  if(!needle) return null;
  const candidates = document.querySelectorAll(
    'section,.card,.cell,.gem-card,.boss-cell,.gen-mark,.stamp,.stele,.bug-cell,.gen-cell,.map-tile,.cat-cell,.case-card,.engraving,article'
  );
  let best = null;
  let bestLen = Infinity;
  for(const el of candidates){
    const t = (el.textContent || '').trim();
    if(t.includes(needle) && t.length < bestLen && t.length < 800){
      best = el;
      bestLen = t.length;
    }
  }
  return best;
}

function flashHighlight(el){
  el.classList.remove('natal-target-glow');
  void el.offsetWidth;
  el.classList.add('natal-target-glow');
}

// 該行星形成的所有相位（從 chart.aspects 過濾）
function getMyAspects(planetKey, chart){
  if(!chart || !chart.aspects) return [];
  return chart.aspects.filter(a => a.p1 === planetKey || a.p2 === planetKey).map(a => {
    // 統一為「我這顆行星 vs 對方」
    if(a.p1 === planetKey) {
      return { other: a.p2, otherName: a.p2Name, otherGlyph: a.p2Glyph, type: a.type, name: a.name, angle: a.angle, orbDelta: a.orbDelta };
    } else {
      return { other: a.p1, otherName: a.p1Name, otherGlyph: a.p1Glyph, type: a.type, name: a.name, angle: a.angle, orbDelta: a.orbDelta };
    }
  });
}

const ASPECT_VIBE = {
  con: { color:'#FFE08A', tag:'融合', tone:'+'},
  opp: { color:'#E8634C', tag:'拉扯', tone:'⚡'},
  sqr: { color:'#E8A04C', tag:'衝突', tone:'⚡'},
  tri: { color:'#7AC48E', tag:'流暢', tone:'~'},
  sex: { color:'#7DA8D9', tag:'機會', tone:'~'},
};

function buildMyAspectsCard(planetKey, me, chart){
  const myAspects = getMyAspects(planetKey, chart);
  if(!myAspects.length) return null;

  const planetName = PLANET_NAMES[planetKey];
  const wrap = document.createElement('div');
  wrap.className = 'natal-my-aspects';

  const counts = { con:0, opp:0, sqr:0, tri:0, sex:0 };
  myAspects.forEach(a => counts[a.type]++);

  const summary = Object.entries(counts).filter(([,v]) => v > 0)
    .map(([k,v]) => `<span class="ma-count" style="color:${ASPECT_VIBE[k].color}">${v} 個 ${ASPECT_VIBE[k].tag}</span>`)
    .join(' · ');

  const items = myAspects.map(a => {
    const v = ASPECT_VIBE[a.type];
    return `<div class="ma-row" style="border-left-color:${v.color}">
      <span class="ma-pair"><span class="ma-glyph">${me.glyph}</span><span class="ma-arrow" style="color:${v.color}">${v.tone}</span><span class="ma-glyph">${a.otherGlyph}</span></span>
      <span class="ma-name"><strong>${planetName} ${a.name} ${a.otherName}</strong> <span class="ma-tag" style="color:${v.color}">${v.tag} ${a.angle}°</span></span>
      <span class="ma-orb">orb ${a.orbDelta}°</span>
    </div>`;
  }).join('');

  wrap.innerHTML = `
    <div class="natal-my-aspects-card">
      <div class="ma-head">
        <span class="ma-tag-strip">// MY ASPECTS</span>
        <h2>你的 ${planetName} 形成的 ${myAspects.length} 個主要相位</h2>
        <p class="ma-summary">${summary}</p>
      </div>
      <div class="ma-list">${items}</div>
      <p class="ma-note">這裡列出的是<strong>你實際擁有</strong>的相位。下方「45 相位矩陣」是所有可能的組合，可以把這裡的相位當作學習起點。</p>
    </div>
  `;
  return wrap;
}

function injectMyAspectsStyles(){
  if(document.getElementById('natal-my-aspects-style')) return;
  const css = `
.natal-my-aspects{margin:36px auto 18px;max-width:1100px;padding:0 24px;font-family:'Cormorant Garamond',serif}
.natal-my-aspects-card{padding:28px 32px;background:linear-gradient(135deg,rgba(212,175,55,.14),rgba(10,5,8,.5));border:1px solid #D4AF37;border-left-width:4px;box-shadow:0 18px 40px -16px rgba(0,0,0,.7)}
.ma-tag-strip{display:inline-block;font-family:'Major Mono Display','VT323',monospace;font-size:10px;letter-spacing:.5em;color:#D4AF37;text-transform:uppercase;padding:3px 10px;border:1px solid #D4AF37;background:rgba(0,0,0,.4);margin-bottom:10px}
.ma-head h2{font-family:'Cinzel',serif;font-weight:900;font-size:clamp(1.3rem,2.4vw,1.9rem);color:#FFE08A;letter-spacing:.04em;margin-bottom:8px}
.ma-summary{font-family:'Major Mono Display','VT323',monospace;font-size:11px;letter-spacing:.18em;color:#C0C8D8;margin-bottom:18px}
.ma-summary .ma-count{margin-right:14px}
.ma-list{display:flex;flex-direction:column;gap:8px;margin:14px 0}
.ma-row{display:flex;align-items:center;gap:14px;padding:10px 14px;background:rgba(0,0,0,.4);border-left:3px solid #D4AF37;font-size:14px}
.ma-row .ma-pair{display:flex;align-items:center;gap:6px;flex-shrink:0;min-width:80px}
.ma-row .ma-glyph{font-family:'Cinzel',serif;font-size:1.5em;font-weight:700;color:#FFE08A}
.ma-row .ma-arrow{font-weight:700;font-size:1.2em}
.ma-row .ma-name{flex:1;color:#E8DCC4;font-style:italic;font-family:'Cormorant Garamond',serif;font-size:1.1em}
.ma-row .ma-name strong{font-style:normal;color:#FFE08A;font-weight:700}
.ma-row .ma-name .ma-tag{font-style:normal;font-family:'Major Mono Display',monospace;font-size:.8em;letter-spacing:.15em;margin-left:8px;text-transform:uppercase}
.ma-row .ma-orb{color:#7A8090;font-size:.85em;flex-shrink:0;font-family:'Major Mono Display',monospace}
.ma-note{margin-top:14px;padding-top:12px;border-top:1px dashed rgba(212,175,55,.3);font-style:italic;color:#C0C8D8;font-size:13px;line-height:1.55}
.ma-note strong{color:#FFE08A;font-style:normal}
@media(max-width:600px){.natal-my-aspects-card{padding:20px 18px}.ma-row{flex-wrap:wrap;font-size:13px}.ma-row .ma-orb{margin-left:auto}}
  `;
  const s = document.createElement('style');
  s.id = 'natal-my-aspects-style';
  s.textContent = css;
  document.head.appendChild(s);
}

function buildBanner(planetKey, me, neighbors){
  const planetName = PLANET_NAMES[planetKey];
  const banner = document.createElement('div');
  banner.className = 'natal-overlay-banner';

  const nextHtml = neighbors.next
    ? `<a class="nob-next" href="../${neighbors.next}/">${PLANET_GLYPHS[neighbors.next]} ${PLANET_NAMES[neighbors.next]} →</a>`
    : `<a class="nob-next is-finish" href="../index.html">✦ 完成全部 → 入口</a>`;

  const personalPills = me ? `
    <span class="nob-pill"><span class="glyph">${me.glyph}</span> ${planetName}</span>
    <span class="nob-pill"><span class="glyph">${me.signGlyph}</span> ${me.sign}座 <small style="opacity:.7">${me.degree.toFixed(1)}°</small></span>
    ${me.house ? `<span class="nob-pill">第 ${me.house} 宮</span>` : '<span class="nob-pill warn">缺時間</span>'}
  ` : `
    <span class="nob-pill warn">尚未輸入本命盤 → 回入口輸入</span>
  `;

  const jumps = me ? `
    <button type="button" class="nob-jump" data-jump="sign">↓ 我的星座</button>
    ${me.house ? `<button type="button" class="nob-jump" data-jump="house">↓ 我的宮位</button>` : ''}
  ` : '';

  banner.innerHTML = `
    <a class="nob-back" href="../index.html">← 入口</a>
    <span class="nob-progress">第 <span class="pos">${neighbors.pos}</span> / ${neighbors.total} 課</span>
    ${personalPills}
    <span class="nob-spacer"></span>
    ${jumps}
    ${nextHtml}
  `;

  return banner;
}

function buildNextLesson(planetKey, me, neighbors){
  const visited = loadProgress();
  const isLast = neighbors.isLast;
  const nextKey = neighbors.next;

  const dotsHtml = ORDER.map(k => {
    let cls = 'nnl-dot';
    if(visited.includes(k)) cls += ' done';
    if(k === planetKey) cls += ' current';
    return `<span class="${cls}" title="${PLANET_NAMES[k]}"></span>`;
  }).join('');

  let title, subtitle, btnHtml;
  if(isLast){
    title = '✦ 你已走完十大星體';
    subtitle = '從太陽到冥王，每顆星都教了你一件事。回入口看你的全圖。';
    btnHtml = `<a class="nnl-btn nnl-finish" href="../index.html"><span>回入口看完整本命盤</span> <span class="glyph">⏎</span></a>`;
  } else {
    const planetName = PLANET_NAMES[planetKey];
    const nextName = PLANET_NAMES[nextKey];
    const nextMe = me && (() => {
      try {
        const c = JSON.parse(localStorage.getItem('astro_natal_chart')||'null');
        return c && c.planets && c.planets.find(p => p.key === nextKey);
      } catch(_) { return null; }
    })();
    title = `下一堂課 · ${PLANET_GLYPHS[nextKey]} ${nextName}`;
    subtitle = nextMe
      ? `你的 ${nextName}：<strong style="color:#FFE08A">${nextMe.signGlyph} ${nextMe.sign}座${nextMe.house ? ' · 第 '+nextMe.house+' 宮' : ''}</strong>。${planetName} 教你的事在 ${nextName} 那邊會被翻轉成另一個版本。`
      : `${planetName} 之後接著 ${nextName} ─ 兩顆星合起來看，會看見你不曾意識到的內在分裂。`;
    btnHtml = `
      <a class="nnl-btn nnl-btn-primary" href="../${nextKey}/"><span>進入 ${nextName} 詳解</span> <span class="glyph">→</span></a>
      <a class="nnl-btn nnl-btn-ghost" href="../index.html"><span>回入口</span> <span class="glyph">⌂</span></a>
    `;
  }

  const wrap = document.createElement('div');
  wrap.className = 'natal-next-lesson';
  wrap.innerHTML = `
    <div class="natal-next-lesson-card">
      <div class="nnl-meta">
        <span class="nnl-tag">// LESSON ${neighbors.pos} / ${neighbors.total} COMPLETE</span>
        <h2 class="nnl-title">${title}</h2>
        <p class="nnl-subtitle">${subtitle}</p>
        <div class="nnl-progress-bar">
          ${dotsHtml}
          <span class="nnl-progress-text">${visited.length} / ${ORDER.length} visited</span>
        </div>
      </div>
      <div class="nnl-action">${btnHtml}</div>
    </div>
  `;
  return wrap;
}

function init(){
  const planetKey = detectPlanet();
  if(!planetKey) return;

  const chart = loadChart();
  const me = chart && chart.planets ? chart.planets.find(p => p.key === planetKey) : null;
  const neighbors = getNeighbors(planetKey);

  injectStyles();

  // 1. 頂部浮條
  const banner = buildBanner(planetKey, me, neighbors);
  document.body.insertBefore(banner, document.body.firstChild);

  // 跳轉按鈕（只有有 me 時才綁）
  if(me){
    banner.querySelectorAll('.nob-jump').forEach(btn => {
      btn.addEventListener('click', () => {
        const t = btn.dataset.jump;
        const planetName = PLANET_NAMES[planetKey];
        let el = null;
        if(t === 'sign'){
          el = findContainer(`${planetName}${me.sign}`)
            || findContainer(`${me.sign}座`)
            || findContainer(me.sign);
        } else if(t === 'house' && me.house){
          const ch = ARABIC_TO_CH[me.house] || me.house;
          el = findContainer(`第 ${me.house} 宮`)
            || findContainer(`第${ch}宮`)
            || findContainer(`第 ${ch} 宮`);
        }
        if(el){
          el.scrollIntoView({ behavior:'smooth', block:'center' });
          setTimeout(() => flashHighlight(el), 400);
        }
      });
    });
  }

  // 2. 自動高亮（有 me 時）
  if(me){
    setTimeout(() => {
      const planetName = PLANET_NAMES[planetKey];
      const signEl = findContainer(`${planetName}${me.sign}`)
                  || findContainer(`${me.sign}座`)
                  || findContainer(me.sign);
      if(signEl) signEl.classList.add('natal-target-glow');

      if(me.house){
        const ch = ARABIC_TO_CH[me.house] || me.house;
        const houseEl = findContainer(`第 ${me.house} 宮`)
                     || findContainer(`第${ch}宮`)
                     || findContainer(`第 ${ch} 宮`);
        if(houseEl && houseEl !== signEl) houseEl.classList.add('natal-target-glow');
      }
    }, 600);
  }

  // 3. 我的相位網絡（如果有 chart）
  if(me && chart && chart.aspects){
    injectMyAspectsStyles();
    const myAsp = buildMyAspectsCard(planetKey, me, chart);
    if(myAsp){
      // 嘗試插到「45 相位矩陣」section 之前；找不到就 append 到 body 尾
      const aspectSection = Array.from(document.querySelectorAll('section')).find(s => /45\s*相位|aspect.*matrix/i.test(s.textContent || ''));
      if(aspectSection && aspectSection.parentNode){
        aspectSection.parentNode.insertBefore(myAsp, aspectSection);
      } else {
        document.body.appendChild(myAsp);
      }
    }
  }

  // 4. 今日該行星 vs 本命的影響卡
  if(me && window.AstroTransit){
    try {
      const today = window.AstroTransit.calcToday();
      const todayThis = today.find(p => p.key === planetKey);
      if(todayThis){
        const card = buildTodayInfluenceCard(planetKey, me, todayThis, today);
        if(card){
          // 插到 banner 後面
          const banner = document.querySelector('.natal-overlay-banner');
          if(banner && banner.parentNode){
            banner.parentNode.insertBefore(card, banner.nextSibling);
          } else {
            document.body.appendChild(card);
          }
        }
      }
    } catch(e){ console.warn('today influence card failed', e); }
  }

  // 5. 底部下一堂課（appended at body end）
  const nextLesson = buildNextLesson(planetKey, me, neighbors);
  document.body.appendChild(nextLesson);

  // 6. 標記已訪問
  markVisited(planetKey);
}

function buildTodayInfluenceCard(planetKey, me, todayThis, today){
  const planetName = PLANET_NAMES[planetKey];
  // 算今日該行星 vs 本命該行星的差距
  let diff = Math.abs(todayThis.lon - me.lon) % 360;
  if(diff > 180) diff = 360 - diff;
  const ASPECTS = [
    {key:'con', name:'合相',   angle:0,   orb:5},
    {key:'opp', name:'對分相', angle:180, orb:5},
    {key:'sqr', name:'四分相', angle:90,  orb:4},
    {key:'tri', name:'三分相', angle:120, orb:4},
    {key:'sex', name:'六分相', angle:60,  orb:3},
  ];
  let activeAspect = null;
  for(const a of ASPECTS){
    if(Math.abs(diff - a.angle) <= a.orb){
      activeAspect = { ...a, orbDelta: Math.abs(diff - a.angle) };
      break;
    }
  }

  const ASPECT_TIPS = {
    con: '行星能量加強，今日感受最直接。適合表達或執行跟這顆行星有關的事。',
    opp: '今日內外拉扯感最強，需要平衡兩端的張力。',
    sqr: '今日感受到摩擦或挑戰，這是推著你成長的衝突。',
    tri: '今日順流時刻，相關事項自然推進。',
    sex: '今日有一個微小的機會在等你主動把握。',
  };

  const sameSignNote = todayThis.sign === me.sign
    ? `<span class="ti-sub-note">★ 今日 ${planetName} 跟你的本命 ${planetName} <strong>同在 ${me.sign}座</strong> ─ 能量會被特別放大。</span>`
    : '';

  const wrap = document.createElement('div');
  wrap.className = 'natal-today-influence';
  wrap.innerHTML = `
    <div class="ti-card">
      <span class="ti-tag">// today's influence</span>
      <div class="ti-grid">
        <div class="ti-side ti-now">
          <div class="ti-side-label">今日 ${planetName}</div>
          <div class="ti-side-sign">${todayThis.signGlyph} ${todayThis.sign}座</div>
          <div class="ti-side-deg">${todayThis.degree.toFixed(1)}° ${todayThis.retrograde ? '<span class="ti-rx">℞</span>' : ''}</div>
        </div>
        <div class="ti-vs">
          ${activeAspect ? `<div class="ti-aspect"><span class="ti-aspect-name">${activeAspect.name}</span><span class="ti-aspect-orb">orb ${activeAspect.orbDelta.toFixed(1)}°</span></div>` : '<div class="ti-aspect ti-aspect-quiet">無緊密相位</div>'}
        </div>
        <div class="ti-side ti-natal">
          <div class="ti-side-label">你的本命 ${planetName}</div>
          <div class="ti-side-sign">${me.signGlyph} ${me.sign}座</div>
          <div class="ti-side-deg">${me.degree.toFixed(1)}°${me.house ? ` · 第 ${me.house} 宮` : ''}</div>
        </div>
      </div>
      ${activeAspect ? `<p class="ti-tip">${ASPECT_TIPS[activeAspect.key]}</p>` : '<p class="ti-tip">今日該行星跟你的本命位置沒有形成主要相位，是相對「不影響」的一天。</p>'}
      ${sameSignNote}
    </div>
  `;
  return wrap;
}

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

})();
