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

// 月相階段計算（用 太陽 - 月亮 黃經差）
function calcMoonPhase(date){
  if(!global.Astronomy) return null;
  const A = global.Astronomy;
  const dt = date || new Date();
  const sunV = A.GeoVector(A.Body.Sun, dt, true);
  const moonV = A.GeoVector(A.Body.Moon, dt, true);
  const sunLon = A.Ecliptic(sunV).elon;
  const moonLon = A.Ecliptic(moonV).elon;
  let phase = ((moonLon - sunLon) % 360 + 360) % 360;
  let name, glyph, illuminated;
  // 0 = 新月、90 = 上弦、180 = 滿月、270 = 下弦
  if(phase < 22.5)        { name = '新月';   glyph = '🌑'; illuminated = 0; }
  else if(phase < 67.5)   { name = '眉月';   glyph = '🌒'; illuminated = .25; }
  else if(phase < 112.5)  { name = '上弦月'; glyph = '🌓'; illuminated = .5; }
  else if(phase < 157.5)  { name = '盈凸月'; glyph = '🌔'; illuminated = .75; }
  else if(phase < 202.5)  { name = '滿月';   glyph = '🌕'; illuminated = 1; }
  else if(phase < 247.5)  { name = '虧凸月'; glyph = '🌖'; illuminated = .75; }
  else if(phase < 292.5)  { name = '下弦月'; glyph = '🌗'; illuminated = .5; }
  else if(phase < 337.5)  { name = '殘月';   glyph = '🌘'; illuminated = .25; }
  else                    { name = '新月';   glyph = '🌑'; illuminated = 0; }
  return { phase, name, glyph, illuminated, waxing: phase < 180 };
}

// 本月月相日曆：每天 12:00 的月亮位置 + 月相
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
    const phase = calcMoonPhase(dt);
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
      moonPhase: phase ? phase.name : '',
      moonPhaseGlyph: phase ? phase.glyph : '',
      illuminated: phase ? phase.illuminated : 0,
      waxing: phase ? phase.waxing : true,
    });
    prevSign = s.idx;
  }
  return { year, month: month + 1, days };
}

// 找下次月相精準時刻（target = 0/90/180/270）
function findNextMoonPhase(target, fromDate){
  if(!global.Astronomy) return null;
  const A = global.Astronomy;
  const start = fromDate || new Date();
  const TWO_PI = 360;
  // 月相每 29.5 天循環，每天約 12.2°
  // 從今天開始，每 6 小時取一次，找跨過 target 的點
  function getPhase(dt){
    const sun = A.GeoVector(A.Body.Sun, dt, true);
    const moon = A.GeoVector(A.Body.Moon, dt, true);
    return ((A.Ecliptic(moon).elon - A.Ecliptic(sun).elon) % 360 + 360) % 360;
  }
  function diff(a, b){
    let d = (a - b) % 360;
    if(d > 180) d -= 360;
    if(d < -180) d += 360;
    return d;
  }
  const STEP_HOURS = 6;
  let prev = start;
  let prevPhase = getPhase(prev);
  for(let h = STEP_HOURS; h <= 30 * 24; h += STEP_HOURS){
    const cur = new Date(start.getTime() + h * 3600000);
    const curPhase = getPhase(cur);
    // 跨過 target 點（差值號變了）
    const dPrev = diff(prevPhase, target);
    const dCur = diff(curPhase, target);
    if(dPrev < 0 && dCur >= 0){
      // 二分搜尋
      let lo = prev, hi = cur;
      for(let i = 0; i < 20; i++){
        const mid = new Date((lo.getTime() + hi.getTime()) / 2);
        const dM = diff(getPhase(mid), target);
        if(dM < 0) lo = mid; else hi = mid;
      }
      return hi;
    }
    prev = cur; prevPhase = curPhase;
  }
  return null;
}

function calcUpcomingMoonPhases(){
  if(!global.Astronomy) return null;
  const start = new Date();
  const targets = [
    { name:'新月',   target:0,   tip:'適合許願、啟動新計畫、播下意圖種子' },
    { name:'上弦月', target:90,  tip:'行動推進期，遇到阻礙正常 ─ 推過去就對了' },
    { name:'滿月',   target:180, tip:'高峰收成期，但情緒會被放大；不要在這天做重大決定' },
    { name:'下弦月', target:270, tip:'釋放期，適合斷捨離、結束一段關係或習慣' },
  ];
  const results = [];
  targets.forEach(t => {
    const dt = findNextMoonPhase(t.target, start);
    if(dt){
      results.push({
        ...t,
        date: dt,
        dateLocal: dt.toLocaleString('zh-TW', { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' }),
        daysFromNow: Math.ceil((dt - start) / 86400000),
      });
    }
  });
  // 按時間排序
  return results.sort((a, b) => a.date - b.date);
}

// 太陽下次進入新星座的日期（節氣 / Sign Ingress）
function calcSunNextIngress(){
  if(!global.Astronomy) return null;
  const A = global.Astronomy;
  const now = new Date();
  const SOLAR_TERM = ['春分(牡羊)','穀雨(金牛)','小滿(雙子)','夏至(巨蟹)','大暑(獅子)','處暑(處女)','秋分(天秤)','霜降(天蠍)','小雪(射手)','冬至(摩羯)','大寒(水瓶)','雨水(雙魚)'];
  // 從今天開始往後找最多 35 天，每天 12:00 看太陽星座
  const v0 = A.GeoVector(A.Body.Sun, now, true);
  const lon0 = A.Ecliptic(v0).elon;
  const sign0 = Math.floor(lon0 / 30);
  for(let d = 1; d <= 35; d++){
    const dt = new Date(now.getTime() + d * 86400000);
    const v = A.GeoVector(A.Body.Sun, dt, true);
    const lon = A.Ecliptic(v).elon;
    const sign = Math.floor(lon / 30);
    if(sign !== sign0){
      // 二分搜尋找精確進入時刻
      let lo = new Date(now.getTime() + (d-1) * 86400000);
      let hi = dt;
      for(let i = 0; i < 24; i++){
        const mid = new Date((lo.getTime() + hi.getTime()) / 2);
        const vm = A.GeoVector(A.Body.Sun, mid, true);
        const lonM = A.Ecliptic(vm).elon;
        const sM = Math.floor(lonM / 30);
        if(sM === sign0) lo = mid;
        else hi = mid;
      }
      const SIGNS = ['牡羊','金牛','雙子','巨蟹','獅子','處女','天秤','天蠍','射手','摩羯','水瓶','雙魚'];
      const GLYPHS = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
      return {
        date: hi.toISOString(),
        dateLocal: hi.toLocaleString('zh-TW', { timeZone:'Asia/Taipei', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' }),
        signFrom: SIGNS[sign0],
        signFromGlyph: GLYPHS[sign0],
        signTo: SIGNS[sign],
        signToGlyph: GLYPHS[sign],
        solarTerm: SOLAR_TERM[sign],
        daysFromNow: Math.ceil((hi - now) / 86400000),
      };
    }
  }
  return null;
}

// 12 個月年度大事件 — 每月挑最重要的 2-3 個慢行星相位
function calc12MonthEvents(natalChart){
  if(!global.Astronomy || !natalChart || !natalChart.planets) return [];
  const A = global.Astronomy;
  const SLOW = ['Jupiter','Saturn','Uranus','Neptune','Pluto'];
  const months = [];
  const start = new Date();
  start.setHours(12,0,0,0);

  for(let m = 0; m < 12; m++){
    const monthStart = new Date(start);
    monthStart.setDate(1);
    monthStart.setMonth(monthStart.getMonth() + m);
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);

    const events = [];
    const seen = new Set();

    // 每 3 天取樣一次
    for(let dt = monthStart.getTime(); dt < monthEnd.getTime(); dt += 3 * 86400000){
      const date = new Date(dt);
      SLOW.forEach(bodyName => {
        const v = A.GeoVector(A.Body[bodyName], date, true);
        const e = A.Ecliptic(v);
        natalChart.planets.forEach(n => {
          const diff = angleDiff(e.elon, n.lon);
          for(const asp of ASPECTS){
            const orb = Math.abs(diff - asp.angle);
            if(orb <= 1.5){
              const tBody = PLANETS.find(p => p.body === bodyName);
              if(!tBody) break;
              const k = `${bodyName}-${n.key}-${asp.key}`;
              if(!seen.has(k)){
                seen.add(k);
                events.push({
                  date: date.toISOString().slice(0,10),
                  transitName: tBody.name,
                  transitGlyph: tBody.glyph,
                  natalName: n.name,
                  natalGlyph: n.glyph,
                  aspectName: asp.name,
                  aspectAngle: asp.angle,
                  type: asp.key,
                  orbDelta: orb,
                });
              }
              break;
            }
          }
        });
      });
    }

    events.sort((a,b) => a.orbDelta - b.orbDelta);
    months.push({
      year: monthStart.getFullYear(),
      month: monthStart.getMonth() + 1,
      label: `${monthStart.getFullYear()}.${String(monthStart.getMonth()+1).padStart(2,'0')}`,
      isCurrent: m === 0,
      events: events.slice(0, 3),
    });
  }
  return months;
}

global.AstroTransit = { calcToday, findActiveTransits, forecastDays, calcLifecycleMilestones, calcSolarReturn, calcMoonPhase, calcMonthMoonCalendar, calcSunNextIngress, calcUpcomingMoonPhases, calc12MonthEvents, PLANETS };

})(typeof window !== 'undefined' ? window : globalThis);
