/* ═══════════════════════════════════════════════════════════
 * chart.js — 本命盤計算
 * 依賴：Astronomy Engine (window.Astronomy) via CDN
 * 公開 API: window.AstroNatal
 *   - calcChart({dateStr, timeStr, city}) → 本命盤資料
 *   - lonToSign(lon) → {idx, name, glyph, deg}
 *   - SIGNS / GLYPHS / PLANETS / CITIES / ASPECTS
 * ═══════════════════════════════════════════════════════════ */
(function(global){
'use strict';

const SIGNS  = ['牡羊','金牛','雙子','巨蟹','獅子','處女','天秤','天蠍','射手','摩羯','水瓶','雙魚'];
const GLYPHS = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];

const PLANETS = [
  {key:'sun',     body:'Sun',     name:'太陽',   glyph:'☉', orb:8},
  {key:'moon',    body:'Moon',    name:'月亮',   glyph:'☽', orb:8},
  {key:'mercury', body:'Mercury', name:'水星',   glyph:'☿', orb:6},
  {key:'venus',   body:'Venus',   name:'金星',   glyph:'♀', orb:6},
  {key:'mars',    body:'Mars',    name:'火星',   glyph:'♂', orb:6},
  {key:'jupiter', body:'Jupiter', name:'木星',   glyph:'♃', orb:6},
  {key:'saturn',  body:'Saturn',  name:'土星',   glyph:'♄', orb:6},
  {key:'uranus',  body:'Uranus',  name:'天王星', glyph:'♅', orb:5},
  {key:'neptune', body:'Neptune', name:'海王星', glyph:'♆', orb:5},
  {key:'pluto',   body:'Pluto',   name:'冥王星', glyph:'♇', orb:5},
];

// 5 主要相位
const ASPECTS = [
  {key:'con', name:'合相',   angle:0,   orb:8, type:'major'},
  {key:'opp', name:'對分相', angle:180, orb:8, type:'hard'},
  {key:'tri', name:'三分相', angle:120, orb:7, type:'soft'},
  {key:'sqr', name:'四分相', angle:90,  orb:7, type:'hard'},
  {key:'sex', name:'六分相', angle:60,  orb:5, type:'soft'},
];

// 預設 15 個亞洲 + 國際主要城市（lat/lon/tz）
// tz 是 UTC offset（夏令時略過，先用標準時）
const CITIES = {
  taipei:    {name:'台北',     lat:25.0330, lon:121.5654, tz:8},
  kaohsiung: {name:'高雄',     lat:22.6273, lon:120.3014, tz:8},
  taichung:  {name:'台中',     lat:24.1477, lon:120.6736, tz:8},
  tainan:    {name:'台南',     lat:22.9999, lon:120.2270, tz:8},
  hsinchu:   {name:'新竹',     lat:24.8138, lon:120.9675, tz:8},
  hualien:   {name:'花蓮',     lat:23.9871, lon:121.6015, tz:8},
  hongkong:  {name:'香港',     lat:22.3193, lon:114.1694, tz:8},
  shanghai:  {name:'上海',     lat:31.2304, lon:121.4737, tz:8},
  beijing:   {name:'北京',     lat:39.9042, lon:116.4074, tz:8},
  guangzhou: {name:'廣州',     lat:23.1291, lon:113.2644, tz:8},
  singapore: {name:'新加坡',   lat:1.3521,  lon:103.8198, tz:8},
  tokyo:     {name:'東京',     lat:35.6762, lon:139.6503, tz:9},
  seoul:     {name:'首爾',     lat:37.5665, lon:126.9780, tz:9},
  sydney:    {name:'雪梨',     lat:-33.8688,lon:151.2093, tz:10},
  los:       {name:'洛杉磯',   lat:34.0522, lon:-118.2437,tz:-8},
  newyork:   {name:'紐約',     lat:40.7128, lon:-74.0060, tz:-5},
  london:    {name:'倫敦',     lat:51.5074, lon:-0.1278,  tz:0},
  paris:     {name:'巴黎',     lat:48.8566, lon:2.3522,   tz:1},
};

// 黃經 → 星座
function lonToSign(lon){
  const n = ((lon % 360) + 360) % 360;
  const idx = Math.floor(n / 30);
  return { idx, name: SIGNS[idx], glyph: GLYPHS[idx], deg: n - idx*30 };
}

// 角差（取較短弧）
function angleDiff(a, b){
  let d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

// 上升星座 — 標準天文公式
function calcAscendant(date, latDeg, lonDeg){
  const A = global.Astronomy;
  const gst = A.SiderealTime(date);                 // 格林威治恆星時（小時）
  const lstH = ((gst + lonDeg / 15) % 24 + 24) % 24; // 當地恆星時
  const ramc = lstH * 15 * Math.PI / 180;            // RAMC（弧度）
  const lat = latDeg * Math.PI / 180;
  const eps = 23.4392911 * Math.PI / 180;            // 黃赤交角
  let asc = Math.atan2(
    Math.cos(ramc),
    -Math.sin(ramc) * Math.cos(eps) - Math.tan(lat) * Math.sin(eps)
  );
  let deg = asc * 180 / Math.PI;
  if (Math.cos(ramc) < 0) deg += 180;
  return ((deg % 360) + 360) % 360;
}

// 主算盤函數
function calcChart(input){
  if(!global.Astronomy) throw new Error('Astronomy Engine 尚未載入');
  const A = global.Astronomy;
  const { dateStr, timeStr, city } = input;
  const c = CITIES[city] || CITIES.taipei;
  const usedTime = timeStr || '12:00';
  const [y, mo, d] = dateStr.split('-').map(Number);
  const [h, mi]    = usedTime.split(':').map(Number);
  // 本地時間 → UTC（減去時區 offset）
  const utc = new Date(Date.UTC(y, mo - 1, d, h - c.tz, mi));

  // 10 行星黃經 + 逆行偵測
  const planets = PLANETS.map(p => {
    const v = A.GeoVector(A.Body[p.body], utc, true);  // aberration=true
    const e = A.Ecliptic(v);
    const s = lonToSign(e.elon);
    // 逆行偵測：1 天後的位置 < 現在 = 逆行
    let retrograde = false;
    if(p.body !== 'Sun' && p.body !== 'Moon'){
      try {
        const utcLater = new Date(utc.getTime() + 86400000);
        const vLater = A.GeoVector(A.Body[p.body], utcLater, true);
        const eLater = A.Ecliptic(vLater);
        let delta = eLater.elon - e.elon;
        if(delta > 180) delta -= 360;
        if(delta < -180) delta += 360;
        retrograde = delta < 0;
      } catch(_){}
    }
    return {
      ...p,
      lon:    e.elon,
      ecLat:  e.elat,
      sign:   s.name,
      signGlyph: s.glyph,
      degree: s.deg,
      retrograde,
    };
  });

  // 上升 + 12 宮（Whole Sign 系統 — 上升所在星座 = 第 1 宮）
  let asc = null, houses = null;
  if (timeStr) {
    const ascLon = calcAscendant(utc, c.lat, c.lon);
    const ascSign = lonToSign(ascLon);
    asc = { lon: ascLon, sign: ascSign.name, glyph: ascSign.glyph, deg: ascSign.deg };

    houses = Array.from({length: 12}, (_, i) => ({
      num: i + 1,
      sign:  SIGNS [(ascSign.idx + i) % 12],
      glyph: GLYPHS[(ascSign.idx + i) % 12],
    }));

    // 標每個行星在哪一宮（Whole Sign）
    planets.forEach(p => {
      const pSI = lonToSign(p.lon).idx;
      p.house = ((pSI - ascSign.idx + 12) % 12) + 1;
    });
  }

  // 45 相位（任兩行星之間角差，落在 5 種相位的容許度內就算）
  const aspectsList = [];
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const a = planets[i], b = planets[j];
      const diff = angleDiff(a.lon, b.lon);
      for (const asp of ASPECTS) {
        const orb = Math.min(asp.orb, Math.max(a.orb, b.orb));
        if (Math.abs(diff - asp.angle) <= orb) {
          aspectsList.push({
            p1: a.key, p2: b.key,
            p1Name: a.name, p2Name: b.name,
            p1Glyph: a.glyph, p2Glyph: b.glyph,
            type: asp.key, name: asp.name, angle: asp.angle,
            actual: diff, orbDelta: Math.abs(diff - asp.angle).toFixed(2),
          });
          break; // 一對行星只取最近的相位
        }
      }
    }
  }

  return {
    input: { dateStr, timeStr, city, cityName: c.name },
    location: { lat: c.lat, lon: c.lon, tz: c.tz },
    hasTime: !!timeStr,
    hasLocation: true,
    planets,
    ascendant: asc,
    houses,
    aspects: aspectsList,
    computedAt: new Date().toISOString(),
    version: 1,
  };
}

// 合盤：兩個本命盤 = 100 個交叉相位
function calcSynastry(chartA, chartB){
  if(!chartA || !chartB || !chartA.planets || !chartB.planets) return [];
  const list = [];
  chartA.planets.forEach(a => {
    chartB.planets.forEach(b => {
      const diff = angleDiff(a.lon, b.lon);
      for(const asp of ASPECTS){
        const orb = 6; // 合盤用較緊的 orb
        if(Math.abs(diff - asp.angle) <= orb){
          list.push({
            aPlanet: a.key, aPlanetName: a.name, aPlanetGlyph: a.glyph,
            bPlanet: b.key, bPlanetName: b.name, bPlanetGlyph: b.glyph,
            type: asp.key, aspectName: asp.name, angle: asp.angle,
            actualDiff: diff,
            orbDelta: Math.abs(diff - asp.angle),
          });
          break;
        }
      }
    });
  });
  // 按精準度排序
  return list.sort((a, b) => a.orbDelta - b.orbDelta);
}

global.AstroNatal = { SIGNS, GLYPHS, PLANETS, ASPECTS, CITIES, lonToSign, calcChart, calcSynastry };

})(typeof window !== 'undefined' ? window : globalThis);
