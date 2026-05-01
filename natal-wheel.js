/* ═══════════════════════════════════════════════════════════
 * natal-wheel.js — SVG 本命盤輪盤
 * API: window.NatalWheel.render(container, chartData, options?)
 * 結構（從外到內）：
 *   1. 黃道 12 星座符號帶（外圈）
 *   2. 12 宮位刻度（依上升點旋轉，無時間時隱藏）
 *   3. 行星符號（按黃經位置散布）
 *   4. 相位連線（5 種顏色：合/對分/四分/三分/六分）
 * ═══════════════════════════════════════════════════════════ */
(function(global){
'use strict';

const SVG_NS = 'http://www.w3.org/2000/svg';
const SIGNS  = ['牡羊','金牛','雙子','巨蟹','獅子','處女','天秤','天蠍','射手','摩羯','水瓶','雙魚'];
const GLYPHS = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
const ELEMENT_COLOR = ['#E8634C','#7AA84B','#E5C282','#5BA9D6','#E8634C','#7AA84B','#E5C282','#5BA9D6','#E8634C','#7AA84B','#E5C282','#5BA9D6'];

// 5 相位繪線顏色（按性質：合相不畫，soft 綠藍、hard 紅橘）
const ASPECT_STYLE = {
  con: { color:'#FFE08A', dash:'',     width:0   }, // 不畫，太混亂
  opp: { color:'#C24438', dash:'',     width:1.4 },
  sqr: { color:'#E08A3C', dash:'',     width:1.2 },
  tri: { color:'#5BA975', dash:'',     width:1.1 },
  sex: { color:'#5B8AC4', dash:'4 3',  width:.9  },
};

function el(tag, attrs, children){
  const e = document.createElementNS(SVG_NS, tag);
  if(attrs) for(const k in attrs) e.setAttribute(k, attrs[k]);
  if(children) for(const c of children) e.appendChild(c);
  return e;
}

// 把黃經（0=春分=牡羊 0°）換成 SVG 角度
// 標準星盤：上升點在「左方 9 點鐘方向」，黃道逆時針增加
// 我們的 SVG 預設右為 0°、順時針為正（CSS 約定），所以要轉換
function lonToSvgAngle(lonDeg, ascDeg){
  ascDeg = ascDeg || 0;
  // 從上升點起算的黃道度數
  const fromAsc = ((lonDeg - ascDeg) % 360 + 360) % 360;
  // 上升在左（180°），逆時針增加 = SVG 角度 = 180 + fromAsc
  return (180 + fromAsc) % 360;
}

function polar(cx, cy, r, deg){
  const a = deg * Math.PI / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

function arcPath(cx, cy, r, startDeg, endDeg, sweep){
  const [x1, y1] = polar(cx, cy, r, startDeg);
  const [x2, y2] = polar(cx, cy, r, endDeg);
  const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} ${sweep ? 1 : 0} ${x2} ${y2}`;
}

function render(container, chart, opt){
  if(!container) return;
  if(!chart || !chart.planets){
    container.innerHTML = '<div style="padding:20px;color:#7A8090;font-style:italic;text-align:center">尚未輸入本命盤資料</div>';
    return;
  }
  opt = opt || {};
  const size = opt.size || 380;
  const cx = size / 2, cy = size / 2;
  const R_OUT  = size * 0.49;   // 最外圈
  const R_ZOD  = size * 0.45;   // 黃道帶外緣
  const R_ZIN  = size * 0.38;   // 黃道帶內緣（星座符號帶）
  const R_HSE  = size * 0.36;   // 宮位內緣
  const R_PLN  = size * 0.30;   // 行星位置半徑
  const R_ASP  = size * 0.27;   // 相位連線半徑

  const ascDeg = (chart.ascendant && chart.ascendant.lon) || 0;
  const hasTime = chart.hasTime !== false && !!chart.ascendant;

  // SVG root
  const svg = el('svg', {
    viewBox: `0 0 ${size} ${size}`,
    width: '100%', height: '100%',
    role: 'img',
    'aria-label': '本命星盤輪盤',
    style: 'max-width:' + size + 'px;display:block;margin:0 auto;'
  });

  // 背景圓
  svg.appendChild(el('circle', { cx, cy, r: R_OUT, fill: 'rgba(10,5,8,.5)', stroke: 'rgba(212,175,55,.4)', 'stroke-width': 1 }));
  svg.appendChild(el('circle', { cx, cy, r: R_ZOD, fill: 'none',           stroke: 'rgba(212,175,55,.55)', 'stroke-width': 1 }));
  svg.appendChild(el('circle', { cx, cy, r: R_ZIN, fill: 'none',           stroke: 'rgba(212,175,55,.35)', 'stroke-width': 1 }));
  svg.appendChild(el('circle', { cx, cy, r: R_HSE, fill: 'none',           stroke: 'rgba(212,175,55,.18)', 'stroke-width': 1, 'stroke-dasharray':'2 3' }));
  svg.appendChild(el('circle', { cx, cy, r: R_ASP, fill: 'none',           stroke: 'rgba(212,175,55,.12)', 'stroke-width': 1 }));

  // ── 1. 黃道 12 區塊（用淺色填底分元素色）+ 符號
  for(let i = 0; i < 12; i++){
    const lon0 = i * 30;
    const lon1 = (i+1) * 30;
    const a0 = lonToSvgAngle(lon0, ascDeg);
    const a1 = lonToSvgAngle(lon1, ascDeg);
    // 區塊扇形（描邊）
    const [x0,y0] = polar(cx, cy, R_ZOD, a0);
    const [x1,y1] = polar(cx, cy, R_ZIN, a0);
    svg.appendChild(el('line', { x1: x0, y1: y0, x2: x1, y2: y1, stroke: 'rgba(212,175,55,.35)', 'stroke-width': .8 }));
    // 元素色帶（薄填）
    const ringPath = arcPath(cx, cy, R_ZOD, a0, a1, true) + ' L ' + polar(cx, cy, R_ZIN, a1).join(' ') + ' ' + arcPath(cx, cy, R_ZIN, a1, a0, false).slice(1) + ' Z';
    // 上方 arcPath 用法可能有問題，改用直接路徑
    const arcOuterStart = polar(cx, cy, R_ZOD, a0);
    const arcOuterEnd   = polar(cx, cy, R_ZOD, a1);
    const arcInnerStart = polar(cx, cy, R_ZIN, a1);
    const arcInnerEnd   = polar(cx, cy, R_ZIN, a0);
    const dPath = `M ${arcOuterStart[0]} ${arcOuterStart[1]} A ${R_ZOD} ${R_ZOD} 0 0 1 ${arcOuterEnd[0]} ${arcOuterEnd[1]} L ${arcInnerStart[0]} ${arcInnerStart[1]} A ${R_ZIN} ${R_ZIN} 0 0 0 ${arcInnerEnd[0]} ${arcInnerEnd[1]} Z`;
    svg.appendChild(el('path', { d: dPath, fill: ELEMENT_COLOR[i], opacity: 0.12 }));

    // 星座符號（區塊中央）
    const aMid = lonToSvgAngle(lon0 + 15, ascDeg);
    const [tx, ty] = polar(cx, cy, (R_ZOD + R_ZIN) / 2, aMid);
    const tx2 = el('text', {
      x: tx, y: ty + 5,
      'text-anchor': 'middle',
      fill: ELEMENT_COLOR[i],
      'font-family': "'Cinzel', serif",
      'font-size': size * 0.045,
      'font-weight': '700',
      style: 'pointer-events:none'
    });
    tx2.textContent = GLYPHS[i];
    svg.appendChild(tx2);
  }

  // ── 2. 12 宮位（Whole Sign，僅有時間時顯示）
  if(hasTime){
    for(let i = 0; i < 12; i++){
      const houseLon = (Math.floor(ascDeg / 30) * 30 + i * 30) % 360;
      const a = lonToSvgAngle(houseLon, ascDeg);
      const [hx, hy] = polar(cx, cy, R_HSE, a);
      const [ix, iy] = polar(cx, cy, R_ASP, a);
      svg.appendChild(el('line', { x1: hx, y1: hy, x2: ix, y2: iy, stroke: 'rgba(212,175,55,.35)', 'stroke-width': .6 }));

      // 宮位數字（兩條線中間）
      const aMid = lonToSvgAngle(houseLon + 15, ascDeg);
      const [nx, ny] = polar(cx, cy, (R_HSE + R_ASP) / 2 + 4, aMid);
      const t = el('text', {
        x: nx, y: ny + 4,
        'text-anchor':'middle',
        fill:'rgba(192,200,216,.65)',
        'font-family':"'Major Mono Display','VT323',monospace",
        'font-size': size * 0.032,
        style:'pointer-events:none'
      });
      t.textContent = (i + 1).toString();
      svg.appendChild(t);
    }

    // 上升點（左側標 ASC + 紅線）
    const ascA = lonToSvgAngle(ascDeg, ascDeg);
    const [ax1, ay1] = polar(cx, cy, R_OUT, ascA);
    const [ax2, ay2] = polar(cx, cy, R_ASP - 8, ascA);
    svg.appendChild(el('line', {
      x1: ax1, y1: ay1, x2: ax2, y2: ay2,
      stroke:'#E8634C', 'stroke-width': 1.5, 'stroke-dasharray':'4 2'
    }));
    const lblA = lonToSvgAngle(ascDeg, ascDeg);
    const [labelX, labelY] = polar(cx, cy, R_OUT - 8, lblA);
    const ascLbl = el('text', {
      x: labelX, y: labelY,
      'text-anchor':'end',
      fill:'#E8634C',
      'font-family':"'Major Mono Display','VT323',monospace",
      'font-size': size * 0.034,
      'font-weight':'700',
      style:'pointer-events:none'
    });
    ascLbl.textContent = 'ASC';
    svg.appendChild(ascLbl);
  }

  // ── 3. 行星符號 + 在 R_PLN 圈上散布
  // 為避免符號重疊，先按黃經排序，然後檢查角差，逼近的微推開
  const placed = chart.planets.map(p => ({
    p,
    angle: lonToSvgAngle(p.lon, ascDeg),
  })).sort((a,b) => a.angle - b.angle);

  // 簡易碰撞推開：若兩相鄰角差 < 8°，後者推開
  const MIN_GAP = 8;
  for(let i = 1; i < placed.length; i++){
    const prev = placed[i - 1];
    const cur = placed[i];
    let diff = cur.angle - prev.angle;
    if(diff < 0) diff += 360;
    if(diff < MIN_GAP){
      cur.angle = (prev.angle + MIN_GAP) % 360;
    }
  }

  placed.forEach(({p, angle}) => {
    const [px, py] = polar(cx, cy, R_PLN, angle);

    // 從黃道帶到行星位置畫小指示線
    const [tickX, tickY] = polar(cx, cy, R_HSE - 2, lonToSvgAngle(p.lon, ascDeg));
    svg.appendChild(el('line', {
      x1: tickX, y1: tickY, x2: px, y2: py,
      stroke:'rgba(212,175,55,.4)', 'stroke-width': .6
    }));

    // 行星圓底
    const g = el('g', { 'data-planet': p.key, style:'cursor:pointer' });
    g.appendChild(el('circle', { cx: px, cy: py, r: size * 0.038, fill: '#0A0508', stroke:'#FFE08A', 'stroke-width': 1 }));
    const t = el('text', {
      x: px, y: py + 5,
      'text-anchor':'middle',
      fill:'#FFE08A',
      'font-family':"'Major Mono Display','VT323',monospace",
      'font-size': size * 0.05,
      'font-weight':'700',
      style:'pointer-events:none'
    });
    t.textContent = p.glyph;
    g.appendChild(t);

    // 逆行小標 ℞
    if(p.retrograde){
      const rxX = px + size * 0.04;
      const rxY = py - size * 0.025;
      g.appendChild(el('circle', { cx: rxX, cy: rxY, r: size * 0.018, fill:'#C24438', stroke:'#FFE08A', 'stroke-width':.5 }));
      const rxT = el('text', {
        x: rxX, y: rxY + 3,
        'text-anchor':'middle',
        fill:'#FFF6D8',
        'font-family':"'Cinzel',serif",
        'font-size': size * 0.022,
        'font-weight':'700',
        style:'pointer-events:none'
      });
      rxT.textContent = '℞';
      g.appendChild(rxT);
    }

    // hover tooltip
    const titleEl = el('title');
    titleEl.textContent = `${p.name} ${p.glyph}${p.retrograde ? ' ℞ 逆行' : ''} · ${p.signGlyph} ${p.sign}座 ${p.degree.toFixed(1)}°${p.house ? ' · 第 '+p.house+' 宮' : ''}`;
    g.appendChild(titleEl);

    g.addEventListener('click', () => {
      if(opt.onPlanetClick) opt.onPlanetClick(p);
      else if(opt.linkPrefix !== false){
        const prefix = opt.linkPrefix || './';
        location.href = prefix + p.key + '/';
      }
    });
    g.addEventListener('mouseenter', () => g.querySelector('circle').setAttribute('stroke-width', 2));
    g.addEventListener('mouseleave', () => g.querySelector('circle').setAttribute('stroke-width', 1));
    // 觸控反饋（手機）
    g.addEventListener('touchstart', () => g.querySelector('circle').setAttribute('stroke-width', 2.5), { passive:true });
    g.addEventListener('touchend', () => g.querySelector('circle').setAttribute('stroke-width', 1));

    svg.appendChild(g);

    // 黃道帶外緣的小度數標記
    const [outX, outY] = polar(cx, cy, R_ZIN - 2, lonToSvgAngle(p.lon, ascDeg));
    svg.appendChild(el('circle', { cx: outX, cy: outY, r: 1.6, fill: '#FFE08A' }));
  });

  // ── 4. 相位連線
  if(chart.aspects && chart.aspects.length && opt.aspects !== false){
    const planetAngle = {};
    chart.planets.forEach(p => { planetAngle[p.key] = lonToSvgAngle(p.lon, ascDeg); });

    chart.aspects.forEach(a => {
      const style = ASPECT_STYLE[a.type];
      if(!style || style.width === 0) return;
      const a1 = planetAngle[a.p1];
      const a2 = planetAngle[a.p2];
      if(a1 == null || a2 == null) return;
      const [x1, y1] = polar(cx, cy, R_ASP - 4, a1);
      const [x2, y2] = polar(cx, cy, R_ASP - 4, a2);
      const ln = el('line', {
        x1, y1, x2, y2,
        stroke: style.color,
        'stroke-width': style.width,
        opacity: 0.55,
      });
      if(style.dash) ln.setAttribute('stroke-dasharray', style.dash);
      const titleEl = el('title');
      titleEl.textContent = `${a.p1Name} × ${a.p2Name} · ${a.name} ${a.angle}° (orb ${a.orbDelta}°)`;
      ln.appendChild(titleEl);
      svg.appendChild(ln);
    });
  }

  // ── 5. 外圈：今日行運（可選）
  if(opt.transit && Array.isArray(opt.transit) && opt.transit.length){
    const R_OUTER_PLN = R_OUT + size * 0.04;
    // 擴大 viewBox（透過修改 svg 屬性）
    const ext = size * 0.06;
    svg.setAttribute('viewBox', `${-ext} ${-ext} ${size + ext * 2} ${size + ext * 2}`);

    const placedT = opt.transit.map(p => ({
      p, angle: lonToSvgAngle(p.lon, ascDeg)
    })).sort((a,b) => a.angle - b.angle);
    const MIN_GAP_T = 7;
    for(let i = 1; i < placedT.length; i++){
      let diff = placedT[i].angle - placedT[i-1].angle;
      if(diff < 0) diff += 360;
      if(diff < MIN_GAP_T) placedT[i].angle = (placedT[i-1].angle + MIN_GAP_T) % 360;
    }

    placedT.forEach(({p, angle}) => {
      const [px, py] = polar(cx, cy, R_OUTER_PLN, angle);
      // 從黃道帶往外指示線
      const [tickX, tickY] = polar(cx, cy, R_OUT + 1, lonToSvgAngle(p.lon, ascDeg));
      svg.appendChild(el('line', {
        x1: tickX, y1: tickY, x2: px, y2: py,
        stroke:'rgba(125,168,217,.5)', 'stroke-width': .5, 'stroke-dasharray':'2 2'
      }));
      const g = el('g', { 'data-transit': p.key });
      g.appendChild(el('circle', { cx: px, cy: py, r: size * 0.026, fill:'rgba(10,5,30,.7)', stroke:'#7DA8D9', 'stroke-width': 1 }));
      const t = el('text', {
        x: px, y: py + 4,
        'text-anchor':'middle',
        fill:'#7DA8D9',
        'font-family':"'Cinzel',serif",
        'font-size': size * 0.034,
        'font-weight':'700',
        style:'pointer-events:none'
      });
      t.textContent = p.glyph;
      g.appendChild(t);
      const titleEl = el('title');
      titleEl.textContent = `今日 ${p.name}${p.retrograde ? ' ℞' : ''} · ${p.signGlyph} ${p.sign}座 ${p.degree.toFixed(1)}°`;
      g.appendChild(titleEl);
      svg.appendChild(g);
    });

    // 外圈標籤
    const lbl = el('text', {
      x: cx, y: -ext * 0.4,
      'text-anchor':'middle',
      fill:'#7DA8D9',
      'font-family':"'Major Mono Display','VT323',monospace",
      'font-size': size * 0.032,
      'letter-spacing':'.2em'
    });
    lbl.textContent = '◐ TRANSIT';
    svg.appendChild(lbl);
  }

  // 中心點
  svg.appendChild(el('circle', { cx, cy, r: 3, fill:'#FFE08A' }));

  // 圖例
  if(opt.legend !== false){
    container.innerHTML = '';
    container.appendChild(svg);

    const legend = document.createElement('div');
    legend.className = 'natal-wheel-legend';
    legend.innerHTML = `
      <span><span class="lg-line" style="background:#C24438"></span>對分 180°</span>
      <span><span class="lg-line" style="background:#E08A3C"></span>四分 90°</span>
      <span><span class="lg-line" style="background:#5BA975"></span>三分 120°</span>
      <span><span class="lg-line" style="background:#5B8AC4;background-image:repeating-linear-gradient(90deg,#5B8AC4 0 4px,transparent 4px 7px)"></span>六分 60°</span>
    `;
    container.appendChild(legend);
  } else {
    container.innerHTML = '';
    container.appendChild(svg);
  }
}

global.NatalWheel = { render };

})(typeof window !== 'undefined' ? window : globalThis);
