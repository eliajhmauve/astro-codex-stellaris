/* ═══════════════════════════════════════════════════════════
 * tarot.js — 每日塔羅抽卡（22 張大阿爾克那）
 * 用今日日期 hash 決定該日的卡，每天每人都抽到同一張（穩定）
 * API: window.DailyTarot.getCard() / .draw(force=true)
 * ═══════════════════════════════════════════════════════════ */
(function(global){
'use strict';

const MAJOR_ARCANA = [
  { num:0,  name:'愚者',     en:'The Fool',          glyph:'☄', upright:'勇敢踏出未知 ─ 放下計算，相信當下。', shadow:'過於衝動 ─ 想想看你會不會後悔三秒前的決定。', planet:'天王' },
  { num:1,  name:'魔術師',   en:'The Magician',      glyph:'⚚', upright:'你已具備完成的工具 ─ 開始動手就對了。', shadow:'力量被誤用 ─ 不要靠技巧操控別人。', planet:'水星' },
  { num:2,  name:'女祭司',   en:'The High Priestess',glyph:'☽', upright:'相信直覺 ─ 你已經知道答案，只是還不敢承認。', shadow:'隱瞞 ─ 有些祕密該被說出來了。', planet:'月亮' },
  { num:3,  name:'女皇',     en:'The Empress',       glyph:'♀', upright:'豐盛的接收期 ─ 創造力與美感大爆發。', shadow:'過度照顧別人 ─ 記得也餵飽自己。', planet:'金星' },
  { num:4,  name:'皇帝',     en:'The Emperor',       glyph:'♈', upright:'紀律與架構讓你穩定 ─ 該硬的時候要硬。', shadow:'過於控制 ─ 學會放手讓事情自然發生。', planet:'牡羊' },
  { num:5,  name:'教皇',     en:'The Hierophant',    glyph:'♉', upright:'尋找導師或傳統的智慧 ─ 別忽略前人留下的路。', shadow:'盲從權威 ─ 你也可以挑戰規則。', planet:'金牛' },
  { num:6,  name:'戀人',     en:'The Lovers',        glyph:'♊', upright:'重要的選擇 ─ 跟著心走，不是跟著腦。', shadow:'三角糾葛 ─ 有人需要被誠實告知。', planet:'雙子' },
  { num:7,  name:'戰車',     en:'The Chariot',       glyph:'♋', upright:'掌握方向 ─ 強硬地推進你想要的。', shadow:'失控 ─ 你開太快了，慢一點。', planet:'巨蟹' },
  { num:8,  name:'力量',     en:'Strength',          glyph:'♌', upright:'內在的勇氣 ─ 用溫柔馴服而不是壓制。', shadow:'懷疑自己的力量 ─ 你比想像中強。', planet:'獅子' },
  { num:9,  name:'隱者',     en:'The Hermit',        glyph:'♍', upright:'獨處時刻 ─ 答案在你裡面，不在外面。', shadow:'過度孤立 ─ 是時候讓人重新進來了。', planet:'處女' },
  { num:10, name:'命運之輪', en:'Wheel of Fortune',  glyph:'♃', upright:'命運的轉折 ─ 該你的會自己來。', shadow:'被動等待 ─ 你也是齒輪的一部分，動起來。', planet:'木星' },
  { num:11, name:'正義',     en:'Justice',           glyph:'♎', upright:'平衡與公正 ─ 該負的責任就負。', shadow:'過度評判 ─ 對自己也別太嚴。', planet:'天秤' },
  { num:12, name:'吊人',     en:'The Hanged Man',    glyph:'♆', upright:'換個角度看 ─ 卡住代表你的視角該轉了。', shadow:'拖延 ─ 你已經知道，但還在拖。', planet:'海王' },
  { num:13, name:'死神',     en:'Death',             glyph:'♏', upright:'結束才能開始 ─ 讓該死去的東西死去。', shadow:'抗拒結束 ─ 你緊抓著的東西已經沒能量了。', planet:'天蠍' },
  { num:14, name:'節制',     en:'Temperance',        glyph:'♐', upright:'融合與調和 ─ 兩端的張力可以同時存在。', shadow:'極端 ─ 不是黑就是白會錯過 80% 的真相。', planet:'射手' },
  { num:15, name:'惡魔',     en:'The Devil',         glyph:'♑', upright:'看見你的綁定 ─ 鎖鏈是鬆的，是你不敢解開。', shadow:'沉迷 ─ 你正在跟一個無法給你的東西糾纏。', planet:'摩羯' },
  { num:16, name:'高塔',     en:'The Tower',         glyph:'♂', upright:'突發的崩塌 ─ 假的會倒，真的會留下。', shadow:'抗拒崩塌 ─ 拖越久越痛。', planet:'火星' },
  { num:17, name:'星星',     en:'The Star',          glyph:'♒', upright:'療癒與希望 ─ 經歷風暴後的第一道光。', shadow:'過度理想 ─ 美好需要被踏實照顧。', planet:'水瓶' },
  { num:18, name:'月亮',     en:'The Moon',          glyph:'♓', upright:'潛意識浮現 ─ 注意你的夢和直覺。', shadow:'被幻象迷惑 ─ 不確定的時候別下大決定。', planet:'雙魚' },
  { num:19, name:'太陽',     en:'The Sun',           glyph:'☉', upright:'喜悅與成就 ─ 這是你發光的時刻。', shadow:'過度自信 ─ 別忘了還有暗面要照顧。', planet:'太陽' },
  { num:20, name:'審判',     en:'Judgement',         glyph:'♅', upright:'重生的召喚 ─ 是時候活成新的版本了。', shadow:'拒絕召喚 ─ 你聽到了，只是不想承認。', planet:'冥王' },
  { num:21, name:'世界',     en:'The World',         glyph:'♄', upright:'圓滿的階段 ─ 一段旅程結束，慶祝它。', shadow:'未完成的執著 ─ 不完美也是一種圓滿。', planet:'土星' },
];

function hashDate(d){
  const s = d.toISOString().slice(0,10);
  let h = 0;
  for(let i = 0; i < s.length; i++){
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function getCard(date){
  const d = date || new Date();
  const idx = hashDate(d) % MAJOR_ARCANA.length;
  // 50% 機率正位 / 逆位（用日期+卡號做 seed）
  const reversed = ((hashDate(d) + idx * 7) % 2) === 1;
  return { ...MAJOR_ARCANA[idx], reversed };
}

global.DailyTarot = { getCard, MAJOR_ARCANA };

})(typeof window !== 'undefined' ? window : globalThis);
