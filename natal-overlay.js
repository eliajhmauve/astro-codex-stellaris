/* ═══════════════════════════════════════════════════════════
 * natal-overlay.js — 行星頁本命盤浮條 + 自動高亮
 * 機制：
 *   1. 從 URL 推測當前行星（sun/moon/mercury/...）
 *   2. 讀 localStorage 'astro_natal_chart'，取出該行星的星座、宮位
 *   3. 在頁面頂部 sticky 注入浮條（顯示星座、宮位、跳轉按鈕）
 *   4. 嘗試找頁面對應內容（XX星座 / 第 N 宮）+ 加金色高亮
 * ═══════════════════════════════════════════════════════════ */
(function(){
'use strict';

const PLANET_NAMES = {
  sun:'太陽', moon:'月亮', mercury:'水星', venus:'金星', mars:'火星',
  jupiter:'木星', saturn:'土星', uranus:'天王星', neptune:'海王星', pluto:'冥王星'
};

const ARABIC_TO_CH = ['','一','二','三','四','五','六','七','八','九','十','十一','十二'];

function detectPlanet(){
  const m = location.pathname.match(/\/(sun|moon|mercury|venus|mars|jupiter|saturn|uranus|neptune|pluto)(?:\/|\/index\.html|$)/);
  return m ? m[1] : null;
}

function loadChart(){
  try { return JSON.parse(localStorage.getItem('astro_natal_chart') || 'null'); }
  catch(_) { return null; }
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
.nob-tag{font-family:'Major Mono Display','VT323',monospace;font-size:10px;letter-spacing:.4em;color:#D4AF37;text-transform:uppercase;padding:3px 10px;border:1px solid #D4AF37;background:rgba(0,0,0,.4);flex-shrink:0}
.nob-pill{display:inline-flex;align-items:center;gap:6px;padding:5px 12px;background:rgba(212,175,55,.14);border:1px solid rgba(212,175,55,.55);color:#FFE08A;font-family:'Cinzel',serif;font-weight:700;font-size:14px;letter-spacing:.05em}
.nob-pill .glyph{font-size:1.25em}
.nob-spacer{flex:1;min-width:8px}
.nob-jump{padding:7px 14px;border:1px solid #D4AF37;color:#D4AF37;background:rgba(212,175,55,.06);font-family:'Cinzel',serif;font-size:12px;letter-spacing:.18em;text-transform:uppercase;cursor:pointer;text-decoration:none;font-weight:700;transition:all .25s ease}
.nob-jump:hover{background:#D4AF37;color:#0A0508;box-shadow:0 0 14px -2px #D4AF37}
.nob-back{color:#C0C8D8;font-family:'Major Mono Display','VT323',monospace;font-size:11px;letter-spacing:.18em;text-decoration:none;padding:7px 12px;text-transform:uppercase;border:1px solid transparent}
.nob-back:hover{border-color:#C0C8D8;color:#FFE08A}
@media(max-width:680px){.natal-overlay-banner{padding:10px 14px;gap:6px;font-size:12px}.nob-tag{display:none}.nob-jump{padding:6px 10px;font-size:10px;letter-spacing:.1em}.nob-back{display:none}}

.natal-target-glow{
  position:relative;
  outline:2px solid #D4AF37;
  outline-offset:4px;
  animation:natalGlowPulse 2s ease-in-out 3;
}
.natal-target-glow::before{
  content:"★ YOUR CHART";
  position:absolute;top:-12px;right:-2px;z-index:8;
  padding:3px 12px;font-family:'Major Mono Display','VT323',monospace;font-size:10px;letter-spacing:.3em;
  background:#D4AF37;color:#0A0508;font-weight:700;
  box-shadow:0 4px 14px -2px rgba(212,175,55,.7);
  pointer-events:none;
}
@keyframes natalGlowPulse{
  0%,100%{box-shadow:0 0 0 0 rgba(212,175,55,0)}
  50%{box-shadow:0 0 0 6px rgba(212,175,55,.45),0 0 40px -4px #D4AF37}
}

@media(prefers-reduced-motion:reduce){
  .natal-target-glow{animation:none}
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
    'section,.card,.cell,.gem-card,.boss-cell,.gen-mark,.stamp,.stele,.bug-cell,.gen-cell,.map-tile,.cat-cell,.case-card,article,.engraving,li.cell'
  );
  // 找 textContent 內含 needle 的最小元素
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

function init(){
  const planetKey = detectPlanet();
  if(!planetKey) return;
  const chart = loadChart();
  if(!chart || !chart.planets){
    // 沒盤資料 → 顯示一個簡化提示條，引導回入口輸入
    injectStyles();
    const banner = document.createElement('div');
    banner.className = 'natal-overlay-banner';
    banner.innerHTML = `
      <span class="nob-tag">尚未輸入本命盤</span>
      <span class="nob-pill" style="background:rgba(124,36,24,.18);border-color:#C49097;color:#E89DA5">輸入生日後可解鎖個人化解讀</span>
      <span class="nob-spacer"></span>
      <a class="nob-back" href="../index.html">← 回入口輸入</a>
    `;
    if(document.body) document.body.insertBefore(banner, document.body.firstChild);
    return;
  }
  const me = chart.planets.find(p => p.key === planetKey);
  if(!me) return;

  injectStyles();

  const planetName = PLANET_NAMES[planetKey];
  const banner = document.createElement('div');
  banner.className = 'natal-overlay-banner';
  banner.innerHTML = `
    <span class="nob-tag">你的本命盤</span>
    <span class="nob-pill"><span class="glyph">${me.glyph}</span> ${planetName}</span>
    <span class="nob-pill"><span class="glyph">${me.signGlyph}</span> ${me.sign}座 <small style="opacity:.7">${me.degree.toFixed(1)}°</small></span>
    ${me.house ? `<span class="nob-pill">第 ${me.house} 宮</span>` : '<span class="nob-pill" style="background:rgba(124,36,24,.18);border-color:#C49097;color:#E89DA5">缺時間</span>'}
    <span class="nob-spacer"></span>
    <button type="button" class="nob-jump" data-jump="sign">↓ 我的星座</button>
    ${me.house ? `<button type="button" class="nob-jump" data-jump="house">↓ 我的宮位</button>` : ''}
    <a class="nob-back" href="../index.html">← 回入口</a>
  `;
  document.body.insertBefore(banner, document.body.firstChild);

  // 跳轉按鈕
  banner.querySelectorAll('.nob-jump').forEach(btn => {
    btn.addEventListener('click', () => {
      const t = btn.dataset.jump;
      let el = null;
      if(t === 'sign'){
        el = findContainer(`${planetName}${me.sign}`)
          || findContainer(`${me.sign}座`)
          || findContainer(`${me.sign}`);
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

  // 自動標記（頁面載入時）
  setTimeout(() => {
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

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

})();
