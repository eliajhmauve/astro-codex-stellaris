/* ═══════════════════════════════════════════════════════════
 * daily-tip.js — 今日具體建議
 * 依據：今日月亮星座 + 太陽星座 + 逆行狀態
 * API: window.DailyTip.getTip(today) → { mood, action, avoid, vibe }
 * ═══════════════════════════════════════════════════════════ */
(function(global){
'use strict';

// 12 個月亮星座 → 今日心情建議
const MOON_TIPS = {
  '牡羊': { mood:'衝動、有行動力', action:'適合啟動一個拖很久的事 — 任何「一直想做但沒做」的，今天動最容易', avoid:'急著要結果、跟人吵架後三秒貼文' },
  '金牛': { mood:'想慢下來、想要實在的東西', action:'吃一頓認真的飯、做一次身體保養、整理一個會用很久的物件', avoid:'被催促做決定、買不必要但好看的東西' },
  '雙子': { mood:'資訊雜訊高、想跟人聊天', action:'打電話給很久沒聯絡的人、寫一篇短文、學一個新工具', avoid:'同時開太多分頁、簽長期合約' },
  '巨蟹': { mood:'情緒柔軟、想回家', action:'跟家人 / 老朋友吃飯、整理舊照片、做一道童年的料理', avoid:'把工作帶回家、跟陌生人深聊' },
  '獅子': { mood:'想被看見、表現慾強', action:'發一篇本來不敢發的內容、化一個喜歡的妝、讚美自己一次', avoid:'踩到別人的舞台、過度比較' },
  '處女': { mood:'想整理、想優化', action:'清理桌面 / 衣櫃 / 待辦清單、做一次健康檢查', avoid:'過度自我批評、挑剔別人不夠完美' },
  '天秤': { mood:'想求和諧、需要陪伴', action:'跟伴侶或夥伴對齊、和解一段冷掉的關係、約一個美的場合', avoid:'為避衝突而妥協、做違心決定' },
  '天蠍': { mood:'深、強、想看穿', action:'做一次心理諮商 / 寫深度日記、處理財務或遺產相關議題', avoid:'掀別人的舊帳、占有慾爆發' },
  '射手': { mood:'想跑、想學、想自由', action:'計畫一趟旅行、讀一本哲學書、跟外國朋友聊天', avoid:'過度承諾、輕易許願' },
  '摩羯': { mood:'務實、想累積', action:'規劃年度目標、推進一個長期計畫、跟前輩 / 上司會面', avoid:'今天放縱、衝動消費' },
  '水瓶': { mood:'想跟群體連結、有點抽離', action:'參加社群活動、提一個顛覆的方案、研究一個冷門題目', avoid:'過度叛逆、為反而反' },
  '雙魚': { mood:'夢、藝術、容易感性', action:'看一部觸動的電影、冥想、寫詩或畫畫、跟藝術家交流', avoid:'相信美麗的承諾、簽法律文件' },
};

const SOLAR_VIBE = {
  '牡羊': '行動力強的開季', '金牛': '物質安穩的時節', '雙子': '輕鬆社交的時節',
  '巨蟹': '回歸內在的時節', '獅子': '展現自我的盛夏', '處女': '回到細節的秋初',
  '天秤': '尋找平衡的時節', '天蠍': '深度蛻變的時節', '射手': '擴張視野的時節',
  '摩羯': '紀律收成的時節', '水瓶': '革新友誼的時節', '雙魚': '夢境融化的時節',
};

const RX_HINTS = {
  mercury: '⚠ 水星逆行：不適合簽合約、買 3C；適合修舊文件、見舊朋友',
  venus:   '⚠ 金星逆行：不適合表白、結婚、買名牌；適合檢視關係模式',
  mars:    '⚠ 火星逆行：不適合大舉行動、開戰；適合重新評估目標',
  jupiter: '○ 木星逆行：信念深化期，適合反省「我相信什麼」',
  saturn:  '○ 土星逆行：紀律重組期，舊責任會浮現要求重新處理',
  uranus:  '○ 天王逆行：內在覺醒期，外顯的革命延後',
  neptune: '○ 海王逆行：靈性醒夢期，看清過去的幻象',
  pluto:   '○ 冥王逆行：陰影面被照亮，潛意識議題浮現',
};

function getTip(today){
  if(!today || !today.length) return null;
  const moon = today.find(p => p.key === 'moon');
  const sun  = today.find(p => p.key === 'sun');
  const rxPlanets = today.filter(p => p.retrograde);

  const moonTip = moon && MOON_TIPS[moon.sign] ? MOON_TIPS[moon.sign] : null;
  const sunVibe = sun && SOLAR_VIBE[sun.sign] ? SOLAR_VIBE[sun.sign] : '';

  return {
    moonSign:  moon ? moon.sign : '',
    moonGlyph: moon ? moon.signGlyph : '',
    sunSign:   sun ? sun.sign : '',
    sunGlyph:  sun ? sun.signGlyph : '',
    sunVibe,
    mood:   moonTip ? moonTip.mood : '',
    action: moonTip ? moonTip.action : '',
    avoid:  moonTip ? moonTip.avoid : '',
    rxHints: rxPlanets.map(p => ({ planet: p.name, hint: RX_HINTS[p.key] || '' })).filter(r => r.hint),
  };
}

global.DailyTip = { getTip };

})(typeof window !== 'undefined' ? window : globalThis);
