/* ═══════════════════════════════════════════════════════════
 * poetic-intro.js — 給你的本命詩意自介
 * 根據太陽 / 月亮 / 上升 + 元素分布，生成一段個人化文字
 * API: window.PoeticIntro.generate(chartData) → string (HTML)
 * ═══════════════════════════════════════════════════════════ */
(function(global){
'use strict';

const ELEMENT = { '牡羊':'火','獅子':'火','射手':'火','金牛':'土','處女':'土','摩羯':'土','雙子':'風','天秤':'風','水瓶':'風','巨蟹':'水','天蠍':'水','雙魚':'水' };

// 太陽星座開場句
const SUN_OPENING = {
  '牡羊': '你是一支被點燃的箭，永遠想知道前方還有什麼。',
  '金牛': '你是一塊被時間磨亮的石頭，慢，但永遠在那裡。',
  '雙子': '你的腦子裡同時開著三十個分頁，多元才是你的安全感。',
  '巨蟹': '你的內在永遠住著一個小孩，但這個小孩比所有大人都更懂愛人。',
  '獅子': '你是房間裡那道光，不是你想當焦點，是你忍不住發亮。',
  '處女': '你看得見別人沒看到的細節，這既是天賦也是你最大的負擔。',
  '天秤': '你天生考慮對方，但要記得你也是對方該考慮的「對方」。',
  '天蠍': '你不滿足於「還好」 ─ 要嘛全心全意，要嘛轉身就走。',
  '射手': '你需要遠方才能呼吸，被困住的你會凋萎。',
  '摩羯': '你的時間感比別人長 ─ 30 歲你才剛開始，60 歲你還在發力。',
  '水瓶': '你天生站在「大家以為理所當然」的反面看世界。',
  '雙魚': '你能感受到別人沒感受到的氣氛，這是天賦也是負擔。',
};

// 太陽 × 月亮元素組合（16 種，但寫常見的）
const SOL_MOON_BLEND = {
  // 火 × 火
  '火火': '你的內外能量同方向 ─ 行動就是你存在的證明。但要小心：燒得快的東西也容易燒完。',
  // 火 × 土
  '火土': '外面的你是火焰，內在的你是大地。你想衝但又怕不踏實 ─ 這個張力推著你做出比別人更扎實的事。',
  // 火 × 風
  '火風': '你的火靠思考點燃。先想清楚為什麼，你才會全力衝。一旦想通了，沒人攔得住你。',
  // 火 × 水
  '火水': '你的行動力被情緒驅動。開心時無所不能，受傷時躲三天。學會分辨「我想做」和「我此刻想做」。',
  // 土 × 火
  '土火': '你看起來慢，但內在燒得很旺。等你發力的時候別人才會嚇一跳。',
  // 土 × 土
  '土土': '你內外都是土地的厚實 ─ 不華麗但永遠靠得住。問題是：你會不會讓自己也擁有美好的事物？',
  // 土 × 風
  '土風': '結構腦袋 + 邏輯腦袋 = 工程師命格。能把抽象想法落地，世界需要你這種人。',
  // 土 × 水
  '土水': '外表沉穩，內在情緒豐沛 ─ 但你不會輕易表現。你的安全感建立在「不被看穿」之上。',
  // 風 × 火
  '風火': '想法蹦出來就要立刻試 ─ 你會犯錯，但也會累積比別人快十倍的經驗。',
  // 風 × 土
  '風土': '你會把腦中的構想變成可以維持十年的東西。是天生的系統建造者。',
  // 風 × 風
  '風風': '你活在概念與對話的世界裡。學著接住身體和情緒給你的訊號 ─ 它們也想跟你聊天。',
  // 風 × 水
  '風水': '你是「會用語言說情緒」的少數人 ─ 詩人、心理諮商師、情書高手的命格。',
  // 水 × 火
  '水火': '情緒爆發力強 ─ 開心時感染所有人，難過時也淹沒所有人。學會給自己一個情緒緩衝區。',
  // 水 × 土
  '水土': '你的情緒像深井裡的水 ─ 沉、慢、但極為持久。一個感受能跟你三個月。',
  // 水 × 風
  '水風': '你能把感受翻譯成別人聽得懂的話。但小心：太多分析會讓感受變抽象。',
  // 水 × 水
  '水水': '你內外都是海。能感受到別人感受不到的細微，但也容易被外界情緒淹。學會「關門」是必修課。',
};

// 上升 vs 太陽差異（內外不一致時的提醒）
function getMaskNote(asc, sun){
  if(!asc || !sun) return '';
  if(asc.sign === sun.sign){
    return `你的上升跟太陽都是 <strong>${sun.sign}</strong> ─ 表裡如一。別人看到的你跟內在的你一致，這是少見的「不需要演」。`;
  }
  const ascE = ELEMENT[asc.sign];
  const sunE = ELEMENT[sun.sign];
  if(ascE !== sunE){
    return `你的上升 <strong>${asc.sign}</strong>（${ascE}）跟太陽 <strong>${sun.sign}</strong>（${sunE}）能量不同 ─ 別人看見的你（外在第一印象）跟你真實的核心常常不是同一個版本。這不是分裂，是你給自己保護色的能力。`;
  }
  return `你的上升 <strong>${asc.sign}</strong> 跟太陽 <strong>${sun.sign}</strong> 同元素 ─ 內外能量相通，只是表達層面不同。`;
}

// 缺的元素
function getLackNote(eleCount){
  const missing = Object.entries(eleCount).filter(([,v]) => v === 0).map(([k]) => k);
  if(!missing.length) return '<strong>四元素你都有 ─ 完整且平衡，但要小心「樣樣通樣樣鬆」。</strong>找出你最強的那一塊深耕。';
  if(missing.length === 1){
    const tips = {
      '火':'缺火 ─ 你需要「行動的火種」。找一個火元素強的朋友當你的鼓動者。',
      '土':'缺土 ─ 你需要「落地的能力」。建議培養一個固定習慣，給自己一個錨。',
      '風':'缺風 ─ 你需要「跳出感受看事情」。多寫日記、多閱讀，讓思考有空間。',
      '水':'缺水 ─ 你需要「感受自己的能力」。學會問自己：我此刻真的感覺如何？',
    };
    return `<strong>你缺 ${missing[0]} 元素</strong> ─ ${tips[missing[0]]}`;
  }
  return `你缺 ${missing.join(' / ')} 元素 ─ 這些是你需要刻意補進來的能量。可以從找到擁有這些元素的朋友 / 環境開始。`;
}

function generate(chart){
  if(!chart || !chart.planets) return '';
  const sun = chart.planets.find(p => p.key === 'sun');
  const moon = chart.planets.find(p => p.key === 'moon');
  const asc = chart.ascendant;
  if(!sun || !moon) return '';

  const sunOpening = SUN_OPENING[sun.sign] || '';
  const sunE = ELEMENT[sun.sign];
  const moonE = ELEMENT[moon.sign];
  const blendKey = sunE + moonE;
  const blend = SOL_MOON_BLEND[blendKey] || '';

  const eleCount = { '火':0,'土':0,'風':0,'水':0 };
  chart.planets.forEach(p => eleCount[ELEMENT[p.sign]]++);

  const maskNote = getMaskNote(asc, sun);
  const lackNote = getLackNote(eleCount);

  return `
    <p class="pi-p"><span class="pi-line">第一段</span>${sunOpening}</p>
    <p class="pi-p"><span class="pi-line">內外</span>${blend}</p>
    ${maskNote ? `<p class="pi-p"><span class="pi-line">面具</span>${maskNote}</p>` : ''}
    <p class="pi-p"><span class="pi-line">缺口</span>${lackNote}</p>
    <p class="pi-sig">─ 給<strong>${chart.input.dateStr}</strong>出生於<strong>${chart.input.cityName}</strong>的你</p>
  `;
}

global.PoeticIntro = { generate };

})(typeof window !== 'undefined' ? window : globalThis);
