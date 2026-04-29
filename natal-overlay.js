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
  }
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

  // 3. 底部下一堂課（appended at body end）
  const nextLesson = buildNextLesson(planetKey, me, neighbors);
  document.body.appendChild(nextLesson);

  // 4. 標記已訪問
  markVisited(planetKey);
}

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

})();
