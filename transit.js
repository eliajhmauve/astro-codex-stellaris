/* ═══════════════════════════════════════════════════════════
 * transit.js — 今日行運計算
 * API: window.AstroTransit
 *   - calcToday() → 今日 10 行星位置
 *   - findActiveTransits(natalChart) → 今日行運對你本命的活躍相位
 * ═══════════════════════════════════════════════════════════ */
(function(global){
'use strict';

const PLANETS = [
  {key:'sun',     body:'Sun',     name:'太陽',   glyph:'☉'},
  {key:'moon',    body:'Moon',    name:'月亮',   glyph:'☽'},
  {key:'mercury', body:'Mercury', name:'水星',   glyph:'☿'},
  {key:'venus',   body:'Venus',   name:'金星',   glyph:'♀'},
  {key:'mars',    body:'Mars',    name:'火星',   glyph:'♂'},
  {key:'jupiter', body:'Jupiter', name:'木星',   glyph:'♃'},
  {key:'saturn',  body:'Saturn',  name:'土星',   glyph:'♄'},
  {key:'uranus',  body:'Uranus',  name:'天王星', glyph:'♅'},
  {key:'neptune', body:'Neptune', name:'海王星', glyph:'♆'},
  {key:'pluto',   body:'Pluto',   name:'冥王星', glyph:'♇'},
];

const SIGNS  = ['牡羊','金牛','雙子','巨蟹','獅子','處女','天秤','天蠍','射手','摩羯','水瓶','雙魚'];
const GLYPHS = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];

// 今日行運用較緊的 orb（活躍相位才有意義）
const ASPECTS = [
  {key:'con', name:'合相',   angle:0,   orb:3},
  {key:'opp', name:'對分相', angle:180, orb:3},
  {key:'sqr', name:'四分相', angle:90,  orb:3},
  {key:'tri', name:'三分相', angle:120, orb:3},
  {key:'sex', name:'六分相', angle:60,  orb:2.5},
];

function lonToSign(lon){
  const n = ((lon % 360) + 360) % 360;
  const idx = Math.floor(n / 30);
  return { idx, name: SIGNS[idx], glyph: GLYPHS[idx], deg: n - idx*30 };
}

function angleDiff(a, b){
  let d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

function calcToday(){
  if(!global.Astronomy) throw new Error('Astronomy Engine 尚未載入');
  const A = global.Astronomy;
  const now = new Date();
  return PLANETS.map(p => {
    const v = A.GeoVector(A.Body[p.body], now, true);
    const e = A.Ecliptic(v);
    const s = lonToSign(e.elon);
    // 逆行偵測
    let retrograde = false;
    if(p.body !== 'Sun' && p.body !== 'Moon'){
      try {
        const later = new Date(now.getTime() + 86400000);
        const vL = A.GeoVector(A.Body[p.body], later, true);
        const eL = A.Ecliptic(vL);
        let delta = eL.elon - e.elon;
        if(delta > 180) delta -= 360;
        if(delta < -180) delta += 360;
        retrograde = delta < 0;
      } catch(_){}
    }
    return { ...p, lon:e.elon, sign:s.name, signGlyph:s.glyph, degree:s.deg, retrograde };
  });
}

// 找出「今日行運行星 → 對本命行星」的活躍相位
function findActiveTransits(natalChart){
  if(!natalChart || !natalChart.planets) return [];
  const today = calcToday();
  const list = [];

  today.forEach(t => {
    natalChart.planets.forEach(n => {
      const diff = angleDiff(t.lon, n.lon);
      for(const asp of ASPECTS){
        if(Math.abs(diff - asp.angle) <= asp.orb){
          list.push({
            transitKey: t.key,
            transitName: t.name,
            transitGlyph: t.glyph,
            transitSign: t.sign,
            transitSignGlyph: t.signGlyph,
            transitDeg: t.degree,
            natalKey: n.key,
            natalName: n.name,
            natalGlyph: n.glyph,
            natalSign: n.sign,
            natalSignGlyph: n.signGlyph,
            type: asp.key,
            aspectName: asp.name,
            angle: asp.angle,
            actualDiff: diff,
            orbDelta: Math.abs(diff - asp.angle),
            // 慢行星往前的相位才算「即將」，否則「正在離開」
          });
          break;
        }
      }
    });
  });

  // 按精準度（orbDelta 小）排序
  list.sort((a, b) => a.orbDelta - b.orbDelta);
  return { today, transits: list };
}

// 未來 N 天的精準相位事件
function forecastDays(natalChart, days){
  if(!global.Astronomy) return [];
  if(!natalChart || !natalChart.planets) return [];
  days = days || 7;
  const A = global.Astronomy;
  const events = [];
  const seen = new Set(); // 去重相同 transit×natal×aspect 組

  for(let d = 0; d < days; d++){
    const day = new Date();
    day.setHours(12, 0, 0, 0);
    day.setDate(day.getDate() + d);

    PLANETS.forEach(t => {
      const v = A.GeoVector(A.Body[t.body], day, true);
      const e = A.Ecliptic(v);
      natalChart.planets.forEach(n => {
        const diff = angleDiff(e.elon, n.lon);
        for(const asp of ASPECTS){
          const orbThis = Math.abs(diff - asp.angle);
          if(orbThis <= 1.5){ // 精準
            const k = `${t.key}-${n.key}-${asp.key}`;
            if(!seen.has(k)){
              seen.add(k);
              events.push({
                date: day.toISOString().slice(0,10),
                dayOffset: d,
                weekday: ['日','一','二','三','四','五','六'][day.getDay()],
                transitKey: t.key, transitName: t.name, transitGlyph: t.glyph,
                natalKey: n.key, natalName: n.name, natalGlyph: n.glyph,
                type: asp.key, aspectName: asp.name, angle: asp.angle,
                orbDelta: orbThis,
              });
            }
            break;
          }
        }
      });
    });
  }

  return events.sort((a, b) => a.dayOffset - b.dayOffset || a.orbDelta - b.orbDelta);
}

// 生命週期里程碑（用近似週期估算，誤差約 ±3 個月）
function calcLifecycleMilestones(natalChart){
  if(!natalChart || !natalChart.input || !natalChart.input.dateStr) return [];
  const birthDate = new Date(natalChart.input.dateStr + 'T12:00:00');
  if(isNaN(birthDate)) return [];

  // 各行星公轉週期（年）
  const PERIODS = {
    jupiter: 11.86,
    saturn:  29.46,
    uranus:  84.01,
    neptune: 164.79,
    pluto:   248.0,
  };

  const now = new Date();
  const ageYears = (now - birthDate) / (365.25 * 24 * 3600 * 1000);

  const milestones = [];

  function addAt(years, label, planet, type, desc, severity){
    const eventDate = new Date(birthDate.getTime() + years * 365.25 * 24 * 3600 * 1000);
    milestones.push({
      ageAtEvent: years,
      eventDate: eventDate.toISOString().slice(0,10),
      label, planet, type, desc, severity,
      passed: eventDate < now,
      yearsFromNow: ((eventDate - now) / (365.25 * 24 * 3600 * 1000)),
    });
  }

  // 木星回歸（每 12 年）
  for(let n = 1; n <= 8; n++){
    const y = n * PERIODS.jupiter;
    if(y > 100) break;
    addAt(y, `第 ${n} 次木星回歸`, 'jupiter', 'return',
      n === 1 ? '12 歲：擴張、機會、視野第一次打開。' :
      n === 2 ? '24 歲：人生方向首次大轉折，常伴隨重大決定。' :
      n === 3 ? '36 歲：成熟版本的木星 ─ 知道自己要什麼了。' :
      `48+ 歲：再次的擴張機會。`,
      'low');
  }

  // 土星半相位（~7.5 歲、~22 歲、~36.75 歲）— 四分相
  [PERIODS.saturn / 4, PERIODS.saturn * 3 / 4, PERIODS.saturn * 5 / 4].forEach((y, i) => {
    addAt(y,
      i === 0 ? '土星首次四分（~7 歲）' :
      i === 1 ? '土星首次對分（~14-15 歲）' :
      '土星二次四分（~22 歲）',
      'saturn', 'square',
      i === 0 ? '童年第一次「現實感」衝擊 ─ 被體制規範。' :
      i === 1 ? '青春期叛逆期高峰 ─ 第一次認真懷疑成人世界。' :
      '社會新鮮人挫折期 ─ 學校外的世界比想像殘酷。',
      'mid');
  });

  // 土星回歸（每 29.5 年）— 占星最重要的成年禮
  for(let n = 1; n <= 3; n++){
    const y = n * PERIODS.saturn;
    if(y > 100) break;
    addAt(y, `第 ${n} 次土星回歸`, 'saturn', 'return',
      n === 1 ? '★ 27-30 歲：占星最重要的人生轉折。你會問「我這一生要做什麼？」很多婚姻、事業、城市都在這時候定下。' :
      n === 2 ? '58-60 歲：第二次土星回歸 ─ 退休前的最後一次大重組。' :
      '88+ 歲：智慧長者。',
      n === 1 ? 'high' : 'mid');
  }

  // 天王星對分（~42 歲）— 經典「中年危機」
  addAt(PERIODS.uranus / 2, '★ 天王星對分（~42 歲）', 'uranus', 'opposition',
    '中年危機的占星本質。你會突然想辭職、離婚、重新發明自己 ─ 不是危機是覺醒。', 'high');

  // 天王星四分（~21 歲、~63 歲）
  addAt(PERIODS.uranus / 4, '天王星首次四分（~21 歲）', 'uranus', 'square',
    '大學末期的身分動搖 ─ 「我真的要走這條路嗎？」', 'mid');
  addAt(PERIODS.uranus * 3 / 4, '天王星三次四分（~63 歲）', 'uranus', 'square',
    '退休前後的最後一次自我革命機會。', 'mid');

  // 海王星四分（~41-42 歲）
  addAt(PERIODS.neptune / 4, '海王星四分（~41 歲）', 'neptune', 'square',
    '中年靈性覺醒 ─ 質疑物質成就的意義。常引發藝術/宗教/瑜珈的轉向。', 'mid');

  // 冥王星四分（依世代不同 ~37-43 歲）
  // 因為冥王星橢圓軌道，世代差異大；這裡用平均值
  addAt(38, '冥王星四分（~37-43 歲）', 'pluto', 'square',
    '深度蛻變期 ─ 一段不重要的東西會徹底死去（一段關係、一個工作、一個自我認同）才能重生。', 'high');

  // 按時間排序
  return milestones.sort((a, b) => a.ageAtEvent - b.ageAtEvent);
}

// 太陽回歸：找下一個生日當天的盤（你的「年運」基準）
function calcSolarReturn(natalChart){
  if(!natalChart || !natalChart.input || !natalChart.input.dateStr) return null;
  if(!global.Astronomy) return null;
  const A = global.Astronomy;

  const birth = new Date(natalChart.input.dateStr + 'T12:00:00');
  if(isNaN(birth)) return null;
  const now = new Date();

  // 找今年或明年生日（哪個還沒到）
  let returnDate = new Date(now.getFullYear(), birth.getMonth(), birth.getDate(), 12, 0, 0);
  if(returnDate < now){
    returnDate = new Date(now.getFullYear() + 1, birth.getMonth(), birth.getDate(), 12, 0, 0);
  }

  // 算回歸當天 10 行星位置
  const planets = PLANETS.map(p => {
    const v = A.GeoVector(A.Body[p.body], returnDate, true);
    const e = A.Ecliptic(v);
    const s = lonToSign(e.elon);
    return { ...p, lon:e.elon, sign:s.name, signGlyph:s.glyph, degree:s.deg };
  });

  // 對本命的所有相位（用 4° orb，介於 transit 與 natal 之間）
  const aspectsList = [];
  planets.forEach(t => {
    natalChart.planets.forEach(n => {
      const diff = angleDiff(t.lon, n.lon);
      for(const asp of ASPECTS){
        if(Math.abs(diff - asp.angle) <= 4){
          aspectsList.push({
            transitKey:t.key, transitName:t.name, transitGlyph:t.glyph,
            natalKey:n.key, natalName:n.name, natalGlyph:n.glyph,
            type:asp.key, aspectName:asp.name, angle:asp.angle,
            orbDelta: Math.abs(diff - asp.angle),
          });
          break;
        }
      }
    });
  });
  aspectsList.sort((a,b) => a.orbDelta - b.orbDelta);

  const daysFromNow = Math.ceil((returnDate - now) / (24*3600*1000));
  return {
    returnDate: returnDate.toISOString().slice(0,10),
    daysFromNow,
    age: returnDate.getFullYear() - birth.getFullYear(),
    planets,
    aspects: aspectsList,
  };
}

// 本月月相日曆：每天 12:00 的月亮位置
function calcMonthMoonCalendar(){
  if(!global.Astronomy) return [];
  const A = global.Astronomy;
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const days = [];
  let prevSign = -1;
  for(let d = 1; d <= lastDay; d++){
    const dt = new Date(year, month, d, 12, 0, 0);
    const v = A.GeoVector(A.Body.Moon, dt, true);
    const e = A.Ecliptic(v);
    const s = lonToSign(e.elon);
    const isToday = dt.toDateString() === now.toDateString();
    const enteredNewSign = s.idx !== prevSign;
    days.push({
      date: d,
      weekday: ['日','一','二','三','四','五','六'][dt.getDay()],
      sign: s.name,
      glyph: s.glyph,
      idx: s.idx,
      isToday,
      enteredNewSign,
    });
    prevSign = s.idx;
  }
  return { year, month: month + 1, days };
}

global.AstroTransit = { calcToday, findActiveTransits, forecastDays, calcLifecycleMilestones, calcSolarReturn, calcMonthMoonCalendar, PLANETS };

})(typeof window !== 'undefined' ? window : globalThis);
