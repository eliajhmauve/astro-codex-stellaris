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
    return { ...p, lon:e.elon, sign:s.name, signGlyph:s.glyph, degree:s.deg };
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

global.AstroTransit = { calcToday, findActiveTransits, forecastDays, PLANETS };

})(typeof window !== 'undefined' ? window : globalThis);
