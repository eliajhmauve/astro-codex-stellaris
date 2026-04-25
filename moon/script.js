/* ═══════════════════════════════════════════════════════════════
   MOON ASTRO — script.js
   完整遊戲化系統 + 占星內容渲染
   ═══════════════════════════════════════════════════════════════ */

'use strict';

// ── localStorage keys ──
const KEYS = {
  xp:           'astro_moon_xp',
  level:        'astro_moon_level',
  phases:       'astro_moon_phases',
  emotions:     'astro_moon_emotions',
  streak:       'astro_moon_streak',
  dreamlog:     'astro_moon_dreamlog',
  lastVisit:    'astro_moon_last_visit',
  gachaPrefix:  'astro_moon_dailygacha_',
  housesUnlocked: 'astro_moon_houses_unlocked',
  fullMoonClaimed: 'astro_moon_fullmoon_',
};

// ── XP & LEVEL CONFIG ──
const LEVELS = [
  { name: '新月學徒',    threshold: 0,    icon: '🌑' },
  { name: '眉月探索者',  threshold: 100,  icon: '🌒' },
  { name: '上弦月見習',  threshold: 250,  icon: '🌓' },
  { name: '盈凸月學者',  threshold: 450,  icon: '🌔' },
  { name: '滿月守護者',  threshold: 700,  icon: '🌕' },
  { name: '虧凸月智者',  threshold: 1000, icon: '🌖' },
  { name: '下弦月大師',  threshold: 1400, icon: '🌗' },
  { name: '殘月賢者',    threshold: 1900, icon: '🌘' },
  { name: '黑月傳說',    threshold: 2500, icon: '🌑✨' },
];

// ── STATE ──
const state = {
  get xp()      { return parseInt(localStorage.getItem(KEYS.xp) || '0'); },
  get level()   { return parseInt(localStorage.getItem(KEYS.level) || '0'); },
  get emotions(){ return JSON.parse(localStorage.getItem(KEYS.emotions) || '[]'); },
  get streak()  { return parseInt(localStorage.getItem(KEYS.streak) || '0'); },
  get dreamlog(){ return JSON.parse(localStorage.getItem(KEYS.dreamlog) || '[]'); },
  get lastVisit(){ return localStorage.getItem(KEYS.lastVisit) || ''; },
  get housesUnlocked() { return JSON.parse(localStorage.getItem(KEYS.housesUnlocked) || '[]'); },

  addXP(amount) {
    const newXP = this.xp + amount;
    localStorage.setItem(KEYS.xp, newXP);
    showXPToast(`+${amount} XP`);
    checkLevelUp(newXP);
    updateXPBar();
  },
  collectEmotion(id) {
    const list = this.emotions;
    if (!list.includes(id)) {
      list.push(id);
      localStorage.setItem(KEYS.emotions, JSON.stringify(list));
      return true;
    }
    return false;
  },
  unlockHouse(num) {
    const list = this.housesUnlocked;
    if (!list.includes(num)) {
      list.push(num);
      localStorage.setItem(KEYS.housesUnlocked, JSON.stringify(list));
    }
  },
};

// ══════════════════════════════════════════════════════════════
// 45 相位資料庫
// ══════════════════════════════════════════════════════════════
const ASPECTS_DATA = [
  // 月亮 × 太陽
  {
    planet: 'sun', symbol: '☉', planetName: '太陽', aspectType: 'conjunction', aspectName: '合相 0°',
    title: '月亮合相太陽',
    desc: '情緒與意志高度合一，感受即行動。你的心情幾乎等於你的自我認同——開心時充滿能量，難過時整個人垮掉。新月出生者常有此相位，行動力強，但情緒客觀性弱。',
    keyword: '情緒即身份 · 新月靈魂',
    rarity: 'legendary'
  },
  {
    planet: 'sun', symbol: '☉', planetName: '太陽', aspectType: 'trine', aspectName: '三分相 120°',
    title: '月亮三分相太陽',
    desc: '情緒流動自然，內外一致。你不需要費力解釋自己的感受，做決定時直覺可靠。感性與理性在你身上不是對立的，而是互相支持，整體人格整合度高。',
    keyword: '內外一致 · 直覺可信',
    rarity: 'rare'
  },
  {
    planet: 'sun', symbol: '☉', planetName: '太陽', aspectType: 'sextile', aspectName: '六分相 60°',
    title: '月亮六分相太陽',
    desc: '情緒與自我意識合作良好，需要主動發揮。你有能力理解自己的情緒，也願意用行動來處理感受，但需要有意識地培養這個連結，不會自動發生。',
    keyword: '有意識整合 · 潛力連結',
    rarity: 'common'
  },
  {
    planet: 'sun', symbol: '☉', planetName: '太陽', aspectType: 'square', aspectName: '四分相 90°',
    title: '月亮四分相太陽',
    desc: '情緒與意志衝突是你的主軸課題。「我想要的」和「我感受到的」經常打架——想前進時情緒拉著你退，想平靜時意志又不讓你停。這種張力是強大的創作驅動力，但也是內耗的根源。',
    keyword: '意志衝突 · 創作張力',
    rarity: 'epic'
  },
  {
    planet: 'sun', symbol: '☉', planetName: '太陽', aspectType: 'opposition', aspectName: '對分相 180°',
    title: '月亮對分相太陽',
    desc: '滿月出生者。情緒與自我意識站在天平兩端，你不斷在「應該怎麼做」和「感覺怎麼了」之間尋找平衡。關係是你的主要學習場域——通過他人的鏡子理解自己的情緒。',
    keyword: '平衡尋求 · 關係學習',
    rarity: 'epic'
  },
  // 月亮 × 水星
  {
    planet: 'mercury', symbol: '☿', planetName: '水星', aspectType: 'conjunction', aspectName: '合相 0°',
    title: '月亮合相水星',
    desc: '情緒與思考綁定。你的感受幾乎等於你的想法——容易把情緒當作事實陳述，也容易把分析當成感受。優點：情緒語言豐富，善於表達感受。缺點：在情緒化狀態下進行邏輯論述。',
    keyword: '情緒即語言 · 感受即思考',
    rarity: 'rare'
  },
  {
    planet: 'mercury', symbol: '☿', planetName: '水星', aspectType: 'trine', aspectName: '三分相 120°',
    title: '月亮三分相水星',
    desc: '情緒與溝通流暢連接。你能自然地把複雜感受轉化為清晰語言，既不過度智識化，也不被情緒淹沒。擅長情緒諮詢、寫作和任何需要感性表達的工作。',
    keyword: '感性表達 · 情緒翻譯',
    rarity: 'rare'
  },
  {
    planet: 'mercury', symbol: '☿', planetName: '水星', aspectType: 'sextile', aspectName: '六分相 60°',
    title: '月亮六分相水星',
    desc: '情緒與思考之間有良好的通道，但需要主動使用。你能理解自己的情緒，也有能力用語言處理感受，但需要刻意練習情緒日誌或表達練習才能充分發揮。',
    keyword: '情緒意識 · 表達潛力',
    rarity: 'common'
  },
  {
    planet: 'mercury', symbol: '☿', planetName: '水星', aspectType: 'square', aspectName: '四分相 90°',
    title: '月亮四分相水星',
    desc: '感受與理智之間的噪音很大。你在情緒化時無法思考清楚，在分析時又切斷了感受。決策困難，因為「感覺說一件事，理性說另一件事」是你的常態。需要刻意練習兩者分開處理。',
    keyword: '感知矛盾 · 決策困難',
    rarity: 'epic'
  },
  {
    planet: 'mercury', symbol: '☿', planetName: '水星', aspectType: 'opposition', aspectName: '對分相 180°',
    title: '月亮對分相水星',
    desc: '情緒與理智像兩個對立的聲音，在你腦中辯論。你既有極深的感受能力，也有極強的分析能力，但兩者很少同時平靜。容易被認為「說的和感覺的不一樣」，因為的確如此。',
    keyword: '雙軌並行 · 內在辯論',
    rarity: 'epic'
  },
  // 月亮 × 金星
  {
    planet: 'venus', symbol: '♀', planetName: '金星', aspectType: 'conjunction', aspectName: '合相 0°',
    title: '月亮合相金星',
    desc: '情感需求與愛的語言完全重疊。你需要被愛的方式就是你表達愛的方式——通常是關注、溫柔和美麗的事物。情感表達自然流露，容易讓他人感受到你的溫暖，但也可能因需要被愛而過度付出。',
    keyword: '愛的統一 · 情感柔軟',
    rarity: 'rare'
  },
  {
    planet: 'venus', symbol: '♀', planetName: '金星', aspectType: 'trine', aspectName: '三分相 120°',
    title: '月亮三分相金星',
    desc: '感受與關係和諧共存。你在人際關係中情緒穩定，能自然地給予和接受愛，不需要過度努力。有天生的美感和對舒適環境的感知，情感生活整體平衡。',
    keyword: '關係和諧 · 天生美感',
    rarity: 'rare'
  },
  {
    planet: 'venus', symbol: '♀', planetName: '金星', aspectType: 'sextile', aspectName: '六分相 60°',
    title: '月亮六分相金星',
    desc: '情感與美感之間有良好連接。你有能力在關係中平衡自己的需求與對方的需求，也能通過美麗和藝術調節情緒，但這個能力需要有意識地培養。',
    keyword: '情感潛質 · 美學療癒',
    rarity: 'common'
  },
  {
    planet: 'venus', symbol: '♀', planetName: '金星', aspectType: 'square', aspectName: '四分相 90°',
    title: '月亮四分相金星',
    desc: '情感需求與愛的方式相互衝突。你想要的（月亮）和你覺得應該想要的（金星）之間有明顯落差。容易在感情中選擇「看起來對」的而非「感覺對」的，或明知不適合卻被吸引。',
    keyword: '愛的矛盾 · 需求錯位',
    rarity: 'epic'
  },
  {
    planet: 'venus', symbol: '♀', planetName: '金星', aspectType: 'opposition', aspectName: '對分相 180°',
    title: '月亮對分相金星',
    desc: '你的情感深處需求（月亮）與你理想的愛情模式（金星）站在對立面。在感情中容易投射自己想要的到對方身上，或者不斷在「親密」和「距離」之間擺盪，難以找到穩定的情感平衡點。',
    keyword: '愛情投射 · 親密拉扯',
    rarity: 'epic'
  },
  // 月亮 × 火星
  {
    planet: 'mars', symbol: '♂', planetName: '火星', aspectType: 'conjunction', aspectName: '合相 0°',
    title: '月亮合相火星',
    desc: '情緒即行動，感受即衝動。你的感受在感知的下一秒就已經成為行為——憤怒立刻爆發，興奮立刻行動。情緒能量強大，需要大量體能出口（運動、創作、性愛）才能維持平衡。',
    keyword: '情緒爆炸 · 即時行動',
    rarity: 'epic'
  },
  {
    planet: 'mars', symbol: '♂', planetName: '火星', aspectType: 'trine', aspectName: '三分相 120°',
    title: '月亮三分相火星',
    desc: '情緒能量可以直接轉化為創造性行動。你有能力把感受（包括憤怒和熱情）轉化為生產力，不被情緒淹沒，也不壓抑。這是行動力和情緒健康並存的良好配置。',
    keyword: '情緒動能 · 創造性憤怒',
    rarity: 'rare'
  },
  {
    planet: 'mars', symbol: '♂', planetName: '火星', aspectType: 'sextile', aspectName: '六分相 60°',
    title: '月亮六分相火星',
    desc: '情緒與行動力之間有可用的連接。你有能力在情緒感知後做出適當的行動，但需要主動練習，特別是在壓力下不讓情緒凍結行動力。',
    keyword: '情緒行動力 · 主動管理',
    rarity: 'common'
  },
  {
    planet: 'mars', symbol: '♂', planetName: '火星', aspectType: 'square', aspectName: '四分相 90°',
    title: '月亮四分相火星',
    desc: '情緒觸發行動，但方向不一定對。容易在情緒衝動下做出後悔的決定，或者反過來，在需要行動時被情緒癱瘓。憤怒的管理是主要課題——憤怒來得快，不一定有意義地指向問題根源。',
    keyword: '衝動行事 · 憤怒功課',
    rarity: 'epic'
  },
  {
    planet: 'mars', symbol: '♂', planetName: '火星', aspectType: 'opposition', aspectName: '對分相 180°',
    title: '月亮對分相火星',
    desc: '情緒需求與行動驅動力處於拉鋸狀態。你的感受告訴你「需要安靜」，行動力又推著你「不能停下來」。在關係中容易把內在衝突投射為外在衝突，引發不必要的對抗。',
    keyword: '衝突投射 · 動靜拉扯',
    rarity: 'epic'
  },
  // 月亮 × 木星
  {
    planet: 'jupiter', symbol: '♃', planetName: '木星', aspectType: 'conjunction', aspectName: '合相 0°',
    title: '月亮合相木星',
    desc: '情緒天然放大，感受什麼都是加倍版。快樂是大快樂，悲傷是大悲傷，熱情是大熱情。有天生的樂觀傾向，情緒恢復速度快，但也容易因情緒過大而讓周圍的人難以應對。',
    keyword: '情緒放大 · 天生樂觀',
    rarity: 'rare'
  },
  {
    planet: 'jupiter', symbol: '♃', planetName: '木星', aspectType: 'trine', aspectName: '三分相 120°',
    title: '月亮三分相木星',
    desc: '情緒有天然的擴展性和恢復力。遇到困難時有本能的哲學視角幫你消化，不容易長期陷入低谷。同時你的情緒關懷範圍大，容易對陌生人感同身受。',
    keyword: '情感寬廣 · 快速復原',
    rarity: 'rare'
  },
  {
    planet: 'jupiter', symbol: '♃', planetName: '木星', aspectType: 'sextile', aspectName: '六分相 60°',
    title: '月亮六分相木星',
    desc: '情緒有擴展的機會，但需要刻意培養樂觀視角。你有能力用更大的框架消化情緒困難，但這個能力不會自動啟動，需要在逆境中有意識地尋找意義。',
    keyword: '意義尋求 · 可培養樂觀',
    rarity: 'common'
  },
  {
    planet: 'jupiter', symbol: '♃', planetName: '木星', aspectType: 'square', aspectName: '四分相 90°',
    title: '月亮四分相木星',
    desc: '情緒過度膨脹是主要挑戰。容易把情緒誇大到不成比例，小事引發大反應，或者用過度樂觀迴避真實的痛苦。「每件事都很好！」有時是情緒逃避機制而非真實感受。',
    keyword: '情緒誇大 · 過度樂觀',
    rarity: 'epic'
  },
  {
    planet: 'jupiter', symbol: '♃', planetName: '木星', aspectType: 'opposition', aspectName: '對分相 180°',
    title: '月亮對分相木星',
    desc: '個人情緒需求與對外擴展之間的張力。你同時需要深層的情感安慰（月亮）和廣闊的精神探索（木星），兩者都不願放棄，容易在關係中要求對方既是港灣也是旅伴。',
    keyword: '港灣與冒險 · 情感擴張',
    rarity: 'epic'
  },
  // 月亮 × 土星
  {
    planet: 'saturn', symbol: '♄', planetName: '土星', aspectType: 'conjunction', aspectName: '合相 0°',
    title: '月亮合相土星',
    desc: '情緒被嚴格的自我管理框架包裹。你學會了「不能感受太多」，因為情緒感覺危險或不被接受。強大的情緒紀律，但代價是內在的孤獨感。療癒路徑：允許自己軟弱是強大的。',
    keyword: '情緒紀律 · 壓抑覺察',
    rarity: 'epic'
  },
  {
    planet: 'saturn', symbol: '♄', planetName: '土星', aspectType: 'trine', aspectName: '三分相 120°',
    title: '月亮三分相土星',
    desc: '情緒穩定且有自制力，不容易被衝動的感受淹沒。你能在情緒波動中保持一定的清醒，也能對自己的感受負責。是成熟情緒管理能力的良好標誌。',
    keyword: '情緒成熟 · 負責任',
    rarity: 'rare'
  },
  {
    planet: 'saturn', symbol: '♄', planetName: '土星', aspectType: 'sextile', aspectName: '六分相 60°',
    title: '月亮六分相土星',
    desc: '有建立情緒紀律的潛力，但需要刻意練習。你能在情緒和責任之間取得平衡，但需要有意識地避免用「理性」壓制感受，或用感受迴避責任。',
    keyword: '情緒紀律潛力 · 平衡可建',
    rarity: 'common'
  },
  {
    planet: 'saturn', symbol: '♄', planetName: '土星', aspectType: 'square', aspectName: '四分相 90°',
    title: '月亮四分相土星',
    desc: '情緒需求與義務感之間的持久衝突。「我應該感覺好一點」是你對自己說的頻繁一句話。情緒常帶有罪惡感（為什麼我還沒好？）或羞愧感（這樣的感受是軟弱）。深層功課是：你有權利感受。',
    keyword: '情緒罪惡感 · 羞愧功課',
    rarity: 'legendary'
  },
  {
    planet: 'saturn', symbol: '♄', planetName: '土星', aspectType: 'opposition', aspectName: '對分相 180°',
    title: '月亮對分相土星',
    desc: '情感需求（月亮）與結構感（土星）的持續拉鋸，常投射到關係中——吸引你的人往往是「限制你情感的人」，或者你在感情中承擔過多責任而壓抑自己的需求。',
    keyword: '情感限制投射 · 責任犧牲',
    rarity: 'legendary'
  },
  // 月亮 × 天王星
  {
    planet: 'uranus', symbol: '♅', planetName: '天王星', aspectType: 'conjunction', aspectName: '合相 0°',
    title: '月亮合相天王星',
    desc: '情緒像閃電，突發、不可預測、充滿驚喜。你的情緒狀態難以被他人讀懂，有時連自己都不確定下一刻會有什麼感受。需要自由和刺激，常規的情感模式讓你窒息。',
    keyword: '情緒閃電 · 無法預測',
    rarity: 'rare'
  },
  {
    planet: 'uranus', symbol: '♅', planetName: '天王星', aspectType: 'trine', aspectName: '三分相 120°',
    title: '月亮三分相天王星',
    desc: '情緒有創新性和獨立性，不隨大流。你的感受常常與眾不同，但你不覺得這是問題。能在情感上保持一定的自由度，同時不因此傷害親密關係。',
    keyword: '情緒獨立 · 自由感知',
    rarity: 'rare'
  },
  {
    planet: 'uranus', symbol: '♅', planetName: '天王星', aspectType: 'sextile', aspectName: '六分相 60°',
    title: '月亮六分相天王星',
    desc: '情緒靈活性的潛力。你能在情感上保持一定的彈性和開放性，不被固定的情緒模式綁住，但需要有意識地選擇打破舊有的情緒習慣。',
    keyword: '情緒彈性 · 打破慣性',
    rarity: 'common'
  },
  {
    planet: 'uranus', symbol: '♅', planetName: '天王星', aspectType: 'square', aspectName: '四分相 90°',
    title: '月亮四分相天王星',
    desc: '情緒安全感（月亮）與自由需求（天王星）之間的根本衝突。你既需要穩定的情感基地，又討厭被束縛。在關係中反覆上演「靠近-逃跑」模式，讓伴侶難以捉摸。',
    keyword: '靠近逃跑 · 自由安全',
    rarity: 'epic'
  },
  {
    planet: 'uranus', symbol: '♅', planetName: '天王星', aspectType: 'opposition', aspectName: '對分相 180°',
    title: '月亮對分相天王星',
    desc: '情感連結的需求（月亮）與離開的衝動（天王星）在你身上同時存在且強度相當。往往通過關係中的突然事件（分手、搬家、切斷聯繫）來解決這個張力，而非直接面對。',
    keyword: '突然切斷 · 連結與離開',
    rarity: 'epic'
  },
  // 月亮 × 海王星
  {
    planet: 'neptune', symbol: '♆', planetName: '海王星', aspectType: 'conjunction', aspectName: '合相 0°',
    title: '月亮合相海王星',
    desc: '情緒邊界幾乎消融於海洋中。你感知他人的感受如同自己的，分不清哪個是你的情緒，哪個是你吸收來的。極度敏感，需要大量獨處和清晰的情緒邊界練習才能維持自我。',
    keyword: '情緒無邊界 · 共感敏感',
    rarity: 'rare'
  },
  {
    planet: 'neptune', symbol: '♆', planetName: '海王星', aspectType: 'trine', aspectName: '三分相 120°',
    title: '月亮三分相海王星',
    desc: '情緒與靈性感知自然流通。你有豐富的直覺力、夢境感知和對無形能量的覺察，這些不會讓你感到混亂，反而成為你的資源——藝術家、治療師、靈性工作者的良好配置。',
    keyword: '靈性感知 · 直覺豐富',
    rarity: 'rare'
  },
  {
    planet: 'neptune', symbol: '♆', planetName: '海王星', aspectType: 'sextile', aspectName: '六分相 60°',
    title: '月亮六分相海王星',
    desc: '靈性與情緒連接的潛力。你有能力在情緒困難時尋求更深的意義或靈性支持，但這個能力需要被刻意培養，不會在不需要時自然浮現。',
    keyword: '靈性潛力 · 直覺可培養',
    rarity: 'common'
  },
  {
    planet: 'neptune', symbol: '♆', planetName: '海王星', aspectType: 'square', aspectName: '四分相 90°',
    title: '月亮四分相海王星',
    desc: '情緒現實感受到海王星的侵蝕——容易把感受理想化或幻想化，在感情中尤其如此。「他其實是個好人只是時機不對」常常是情緒迴避現實的機制。學習分辨感受和願望。',
    keyword: '情緒幻想 · 現實迷霧',
    rarity: 'epic'
  },
  {
    planet: 'neptune', symbol: '♆', planetName: '海王星', aspectType: 'opposition', aspectName: '對分相 180°',
    title: '月亮對分相海王星',
    desc: '真實感受（月亮）與理想化投射（海王星）對立。你渴望「完美的情感連結」，這個渴望強到會把現實的人理想化，然後在他們「真實出現」時深感失望。功課：愛真實的人，不是幻想中的人。',
    keyword: '理想幻滅 · 完美投射',
    rarity: 'legendary'
  },
  // 月亮 × 冥王星
  {
    planet: 'pluto', symbol: '♇', planetName: '冥王星', aspectType: 'conjunction', aspectName: '合相 0°',
    title: '月亮合相冥王星',
    desc: '情緒深入到本能最底層，幾乎無法控制。你不是「有情緒」，你是「被情緒佔據」。感受極其強烈，難以輕描淡寫。但痊癒後擁有他人沒有的深度——你理解黑暗，所以能帶出真正的光。',
    keyword: '情緒佔據 · 深淵與重生',
    rarity: 'legendary'
  },
  {
    planet: 'pluto', symbol: '♇', planetName: '冥王星', aspectType: 'trine', aspectName: '三分相 120°',
    title: '月亮三分相冥王星',
    desc: '情緒轉化能力強，能深入自己的陰影而不被淹沒。你有能力看透表象情緒背後的深層動機，包括自己的，也包括他人的。是心理洞察力和情緒轉化力的良好標誌。',
    keyword: '深度洞察 · 情緒轉化',
    rarity: 'rare'
  },
  {
    planet: 'pluto', symbol: '♇', planetName: '冥王星', aspectType: 'sextile', aspectName: '六分相 60°',
    title: '月亮六分相冥王星',
    desc: '情緒深化的機會在適當的時機出現。你有能力進行情緒的深層工作——治療、冥想、陰影整合——但需要外在條件的觸發，不會自發進行。',
    keyword: '深化機會 · 觸發轉化',
    rarity: 'common'
  },
  {
    planet: 'pluto', symbol: '♇', planetName: '冥王星', aspectType: 'square', aspectName: '四分相 90°',
    title: '月亮四分相冥王星',
    desc: '情緒安全感（月亮）與毀滅/重建衝動（冥王星）持續衝突。你的情緒生活經常經歷劇烈變化——某種「失去」（關係、身份、信念）之後是更深的重建。控制慾和被控制的恐懼是主要課題。',
    keyword: '毀滅重建 · 控制課題',
    rarity: 'legendary'
  },
  {
    planet: 'pluto', symbol: '♇', planetName: '冥王星', aspectType: 'opposition', aspectName: '對分相 180°',
    title: '月亮對分相冥王星',
    desc: '情感安全感遭遇冥王星的挑戰——通過關係中的力量動態（誰控制誰）來學習情緒課題。你可能吸引或成為關係中的「佔有者」，直到意識到這是內在對失控的恐懼在投射。',
    keyword: '力量動態 · 佔有與失控',
    rarity: 'legendary'
  },
];

// ══════════════════════════════════════════════════════════════
// 28 種月相情緒圖鑑
// ══════════════════════════════════════════════════════════════
const EMOTIONS_DATA = [
  { id: 1,  emoji: '🌑', name: '虛空共鳴',      number: '#001', desc: '新月時的深邃靜默，萬事歸零的啟示感' },
  { id: 2,  emoji: '🌒', name: '微光萌芽',      number: '#002', desc: '希望剛剛出現，但還脆弱，需要保護' },
  { id: 3,  emoji: '🌓', name: '建構張力',      number: '#003', desc: '上弦月的摩擦感，阻力中的成長' },
  { id: 4,  emoji: '🌔', name: '蓄力預感',      number: '#004', desc: '能量正在累積，感覺什麼即將到來' },
  { id: 5,  emoji: '🌕', name: '圓滿燃燒',      number: '#005', desc: '滿月的情緒頂點，壓抑不住的豐盛感' },
  { id: 6,  emoji: '🌖', name: '回光感謝',      number: '#006', desc: '在消退中數算所收到的一切' },
  { id: 7,  emoji: '🌗', name: '放手平靜',      number: '#007', desc: '下弦月的收割，刪除不再需要的事' },
  { id: 8,  emoji: '🌘', name: '殘餘智慧',      number: '#008', desc: '殘月帶來的洞察，一個週期的精華' },
  { id: 9,  emoji: '🥀', name: '優雅悲傷',      number: '#009', desc: '深刻但不崩潰的哀悼感，美麗的失去' },
  { id: 10, emoji: '🌊', name: '潮汐淹沒',      number: '#010', desc: '情緒超過承受閾值，暫時失去方向感' },
  { id: 11, emoji: '🔮', name: '直覺尖叫',      number: '#011', desc: '強烈的預感，說不清但確實知道' },
  { id: 12, emoji: '🫧', name: '輕盈空白',      number: '#012', desc: '不帶評判的清淨感，當下即一切' },
  { id: 13, emoji: '⚡', name: '情緒雷陣雨',    number: '#013', desc: '快速的情緒爆發，來得快去得也快' },
  { id: 14, emoji: '🌫️', name: '迷霧感知',      number: '#014', desc: '感受到了但說不清楚，邊界模糊的狀態' },
  { id: 15, emoji: '🗝️', name: '解鎖頓悟',      number: '#015', desc: '某個卡關多年的情緒模式突然理解' },
  { id: 16, emoji: '🫀', name: '赤裸脆弱',      number: '#016', desc: '無防備地暴露真實感受，需要很大的勇氣' },
  { id: 17, emoji: '🪨', name: '石頭穩定',      number: '#017', desc: '不動如山的安穩，外在再怎麼搖晃也不怕' },
  { id: 18, emoji: '🦋', name: '蛻變陣痛',      number: '#018', desc: '成長中必須承受的不舒適，蛻殼的痛感' },
  { id: 19, emoji: '🌸', name: '輕柔接納',      number: '#019', desc: '對自己的缺陷和失敗保持溫柔的接納' },
  { id: 20, emoji: '🌋', name: '地下岩漿',      number: '#020', desc: '壓抑在表面下的憤怒，尚未爆發但已沸騰' },
  { id: 21, emoji: '🌙', name: '夜行神秘',      number: '#021', desc: '在黑暗中清醒的感覺，不害怕未知' },
  { id: 22, emoji: '🪞', name: '反射洞見',      number: '#022', desc: '在他人身上看到自己不想承認的情緒模式' },
  { id: 23, emoji: '🌿', name: '緩慢生長',      number: '#023', desc: '看不見的療癒正在進行，需要時間和信任' },
  { id: 24, emoji: '💎', name: '壓力結晶',      number: '#024', desc: '極大壓力下形成的情緒強度和清晰度' },
  { id: 25, emoji: '🌈', name: '雨後清醒',      number: '#025', desc: '情緒風暴後的清明感，一切變得可以承受' },
  { id: 26, emoji: '🕯️', name: '微火堅持',      number: '#026', desc: '在最黑暗的時刻維持那一點點微光的意志' },
  { id: 27, emoji: '🌌', name: '宇宙歸屬',      number: '#027', desc: '感受到自己是更大整體的一部分，孤獨感消失' },
  { id: 28, emoji: '⚓', name: '根植安全',      number: '#028', desc: '從最深的自我中長出的安全感，不依賴外界' },
];

// ══════════════════════════════════════════════════════════════
// GACHA 情緒天氣池
// ══════════════════════════════════════════════════════════════
const GACHA_POOL = [
  { id: 'calm',    emoji: '🌊', title: '平靜深水',   rarity: 'common',
    desc: '今天的情緒像深海底部——平穩，帶著深度。適合做需要專注的事，情緒不會干擾你。',
    advice: '把今天的平靜當作資源，用來做一件你一直在迴避的事。' },
  { id: 'melancholy', emoji: '🌧️', title: '輕柔憂鬱', rarity: 'common',
    desc: '有點低落，但不是崩潰。像陰天的下午，沒有暴風雨，只是光線不夠亮。',
    advice: '允許自己慢一點。找一本書，喝一杯熱的東西，不需要強迫快樂。' },
  { id: 'restless', emoji: '⚡', title: '躁動電流', rarity: 'common',
    desc: '坐不住，想動，情緒像接了電一樣。可能是焦慮，可能是興奮，很難分清楚。',
    advice: '讓身體動起來。走路、跑步或跳舞，把電流放出去，別讓它積在胸口。' },
  { id: 'tender', emoji: '🌸', title: '柔軟開放', rarity: 'rare',
    desc: '今天的防衛比平時低一點。容易被感動，容易說出平時不說的話，容易接近。',
    advice: '把握這個難得的柔軟時刻，告訴某個人你感激他們的具體原因。' },
  { id: 'sharp', emoji: '🔥', title: '洞察火焰', rarity: 'rare',
    desc: '直覺特別準，能看穿平時看不透的事情。但這種清醒有時候讓人不舒服。',
    advice: '把你今天的洞察寫下來。清醒期是有限的，記錄下來才不會在霧氣回來時遺忘。' },
  { id: 'overflow', emoji: '🌋', title: '情緒火山', rarity: 'epic',
    desc: '情緒能量滿到快溢出來。可能是壓抑了很久的感受終於要浮現，也可能只是今天特別敏感。',
    advice: '不要硬壓。找一個安全的地方讓它出來——哭、大聲說話、寫日記都可以。' },
  { id: 'void', emoji: '🫥', title: '感受缺席', rarity: 'rare',
    desc: '今天什麼都感覺不到，像隔著玻璃看世界。不是難過，只是空空的。',
    advice: '麻木通常是情緒過載後的保護機制。今天不需要強迫有感受，但注意身體的訊號。' },
  { id: 'gratitude', emoji: '🌟', title: '感恩湧現', rarity: 'legendary',
    desc: '無緣無故地感謝起來——感謝自己還在，感謝那些在和不在的人，感謝這個複雜的人生。',
    advice: '把這份感謝傳遞出去。給一個你好久沒聯繫的人發一條簡短的訊息。' },
  { id: 'transition', emoji: '🦋', title: '蛻變陣痛', rarity: 'epic',
    desc: '你正在改變。舊的情緒模式在脫落，新的還沒長好，現在是最不舒適的時刻。',
    advice: '不舒適是蛻變的訊號，不是失敗的訊號。繼續，再難也繼續。' },
  { id: 'nostalgic', emoji: '🎞️', title: '記憶倒帶', rarity: 'common',
    desc: '過去的事情反覆在腦海中浮現，某個人、某個場景，莫名其妙地想起來。',
    advice: '看看這個記憶帶著什麼感受。是未完成的事，還是只是在告訴你某個部分的自己值得被看見？' },
  { id: 'clarity', emoji: '💎', title: '水晶清明', rarity: 'legendary',
    desc: '難得的全然清醒——知道自己要什麼，知道什麼對自己好，情緒和理智罕見地一致。',
    advice: '在這個清明狀態下，做一個你一直在猶豫的決定。不要讓霧氣回來後又反悔。' },
  { id: 'protective', emoji: '🛡️', title: '本能防衛', rarity: 'rare',
    desc: '今天對某些事情特別敏感，容易感到被入侵或不安全，邊界意識強烈。',
    advice: '你的防衛反應在告訴你什麼需要被保護。聽它，然後問：這個威脅是真實的嗎？' },
];

// ══════════════════════════════════════════════════════════════
// 月光寶箱洞察
// ══════════════════════════════════════════════════════════════
const CHEST_INSIGHTS = {
  1:  '你的情緒是你給世界的第一份禮物，也是你最誠實的自我介紹。別讓「情緒管理」變成情緒壓抑——感受是資訊，不是問題。',
  2:  '你的安全感不能完全外包給銀行存款。但也不要批評自己對物質安全的需求——那是身體最古老的智慧之一。',
  3:  '有些感受只有說出來才算存在。你的日記、你的訊息、你的眼淚都是情緒的語言，是你告訴自己「我在這裡」的方式。',
  4:  '你對「家」的渴望，其實是對被全然接受的渴望——不需要表演，不需要解釋，只是存在就好。這是你給自己最重要的功課：成為自己的家。',
  5:  '你的情緒需要舞台，這沒有什麼不對。重要的是：你在為誰表演？如果答案是「為了得到愛」，那是時候練習為自己存在了。',
  6:  '你用服務他人來表達愛，這很美。但確認一下：你服務的是真正的需要，還是你自己對「被需要」的需要？',
  7:  '你在關係中尋找情緒的鏡子，這讓你能深度理解他人。但請記住：鏡子只能反射，它不能替你決定你是誰。',
  8:  '你的情緒深度是一份禮物，雖然有時候感覺更像一個詛咒。你能感受到他人感受不到的事，這讓你成為世界的一種感知器官。',
  9:  '不是每個情緒都需要意義，但你對意義的需求是真實的。讓你的情緒生活有方向，比讓它有答案更重要。',
  10: '成就感是你的情緒燃料，但別讓你的情緒健康完全依賴外部評價。有一種成功叫做：今天我對自己誠實了。',
  11: '找到同類是人類最深的需求之一。但也練習在沒有群體認同的時刻，獨自確認自己的感受是真實的。',
  12: '你的情緒生活在表面之下，在夢境和靜默中流動。這需要大量獨處和耐心——不是每個感受都需要立刻命名，讓它們慢慢浮現。',
};

// ══════════════════════════════════════════════════════════════
// 初始化
// ══════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  initStarCanvas();
  initXPBar();
  renderAspects();
  renderPokedex();
  initHouseCards();
  initSignCards();
  initDreamLog();
  updateLiveStats();
  checkStreak();
  checkFullMoon();
  initScrollAnimations();
  initRadarChart('fire');

  // 初始化 gacha 按鈕狀態
  const today = getTodayKey();
  const gachaKey = KEYS.gachaPrefix + today;
  if (localStorage.getItem(gachaKey)) {
    const btn = document.getElementById('gachaBtn');
    if (btn) {
      btn.disabled = true;
      document.getElementById('gachaDailyMsg').textContent = '今日已抽卡，明天再來吧 ✦';
    }
  }
});

// ══════════════════════════════════════════════════════════════
// STAR CANVAS
// ══════════════════════════════════════════════════════════════
function initStarCanvas() {
  const canvas = document.getElementById('starCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const stars = [];
  for (let i = 0; i < 200; i++) {
    stars.push({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.5 + 0.3,
      alpha: Math.random() * 0.8 + 0.2,
      speed: Math.random() * 0.003 + 0.001,
      phase: Math.random() * Math.PI * 2,
    });
  }

  function draw(t) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stars.forEach(s => {
      const a = s.alpha * (0.5 + 0.5 * Math.sin(t * s.speed + s.phase));
      ctx.beginPath();
      ctx.arc(s.x * canvas.width, s.y * canvas.height, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200, 216, 255, ${a})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
}

// ══════════════════════════════════════════════════════════════
// XP BAR
// ══════════════════════════════════════════════════════════════
function updateXPBar() {
  const xp = state.xp;
  const levelIdx = getCurrentLevelIndex(xp);
  const currentLevel = LEVELS[levelIdx];
  const nextLevel = LEVELS[levelIdx + 1];

  const fill = document.getElementById('xpFill');
  const badge = document.getElementById('levelBadge');
  const label = document.getElementById('xpLabel');

  if (!fill) return;

  let pct = 100;
  if (nextLevel) {
    const range = nextLevel.threshold - currentLevel.threshold;
    const progress = xp - currentLevel.threshold;
    pct = Math.min(100, (progress / range) * 100);
  }

  fill.style.width = pct + '%';
  badge.textContent = currentLevel.icon + ' ' + currentLevel.name;
  label.textContent = nextLevel
    ? `${xp} / ${nextLevel.threshold} XP`
    : `${xp} XP — 最高等級`;
}

function getCurrentLevelIndex(xp) {
  let idx = 0;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].threshold) { idx = i; break; }
  }
  return idx;
}

function checkLevelUp(xp) {
  const newIdx = getCurrentLevelIndex(xp);
  const oldIdx = parseInt(localStorage.getItem(KEYS.level) || '0');
  if (newIdx > oldIdx) {
    localStorage.setItem(KEYS.level, newIdx);
    showUnlockToast(`升級！${LEVELS[newIdx].icon} ${LEVELS[newIdx].name}`);
  }
}

function initXPBar() {
  updateXPBar();
}

// ══════════════════════════════════════════════════════════════
// TOAST NOTIFICATIONS
// ══════════════════════════════════════════════════════════════
function showXPToast(msg) {
  const toast = document.getElementById('xpToast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
}

function showUnlockToast(msg) {
  const toast = document.getElementById('unlockToast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ══════════════════════════════════════════════════════════════
// HOUSE CARDS — flip + unlock chest
// ══════════════════════════════════════════════════════════════
function initHouseCards() {
  const cards = document.querySelectorAll('.house-card');
  const unlocked = state.housesUnlocked;

  cards.forEach(card => {
    const houseNum = parseInt(card.dataset.house);
    if (unlocked.includes(houseNum)) {
      card.classList.add('unlocked');
    }

    card.addEventListener('click', (e) => {
      if (e.target.classList.contains('unlock-btn')) return;
      card.classList.toggle('flipped');
      // XP for first flip
      const visitKey = 'astro_moon_house_visit_' + houseNum;
      if (!localStorage.getItem(visitKey)) {
        localStorage.setItem(visitKey, '1');
        state.addXP(5);
      }
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.classList.toggle('flipped');
      }
    });
  });

  updateHouseProgress();
}

window.unlockHouse = function(num) {
  state.unlockHouse(num);
  const card = document.querySelector(`.house-card[data-house="${num}"]`);
  if (card) card.classList.add('unlocked');

  const modal = document.getElementById('chestModal');
  const title = document.getElementById('chestTitle');
  const content = document.getElementById('chestContent');
  const xpEl = document.getElementById('chestXP');

  title.textContent = `第 ${num} 宮 月光寶箱解鎖`;
  content.textContent = CHEST_INSIGHTS[num] || '你的情緒旅程比你以為的更有勇氣。';
  xpEl.textContent = '+30 XP 獲得';

  modal.style.display = 'flex';
  state.addXP(30);
  updateHouseProgress();
  updateLiveStats();
};

function updateHouseProgress() {
  const count = state.housesUnlocked.length;
  const fill = document.getElementById('houseProgressFill');
  const countEl = document.getElementById('houseProgressCount');
  if (fill) fill.style.width = (count / 12 * 100) + '%';
  if (countEl) countEl.textContent = `${count} / 12`;
}

// ══════════════════════════════════════════════════════════════
// SIGN CARDS — hover 3D handled by CSS
// ══════════════════════════════════════════════════════════════
function initSignCards() {
  const cards = document.querySelectorAll('.sign-card');
  cards.forEach(card => {
    card.addEventListener('focus', () => {
      const inner = card.querySelector('.sign-card-inner');
      if (inner) inner.style.transform = 'rotateY(180deg)';
    });
    card.addEventListener('blur', () => {
      const inner = card.querySelector('.sign-card-inner');
      if (inner) inner.style.transform = '';
    });
    card.addEventListener('click', () => {
      const signKey = 'astro_moon_sign_' + card.dataset.sign;
      if (!localStorage.getItem(signKey)) {
        localStorage.setItem(signKey, '1');
        state.addXP(3);
      }
    });
  });
}

// ══════════════════════════════════════════════════════════════
// ASPECTS GRID RENDER
// ══════════════════════════════════════════════════════════════
function renderAspects() {
  const grid = document.getElementById('aspectsGrid');
  if (!grid) return;

  grid.innerHTML = ASPECTS_DATA.map(a => `
    <div class="aspect-card ${a.aspectType}" data-planet="${a.planet}" tabindex="0"
         role="article" aria-label="${a.title}">
      <div class="aspect-header">
        <span class="aspect-symbol">${a.symbol}</span>
        <div>
          <div class="aspect-title">${a.title}</div>
          <div style="font-size:0.75rem;color:var(--c-text2);margin-top:0.1rem">${a.aspectName} × ${a.planetName}</div>
        </div>
        <span class="aspect-type ${a.aspectType}">${getAspectLabel(a.aspectType)}</span>
      </div>
      <p class="aspect-desc">${a.desc}</p>
      <div class="aspect-keyword">${a.keyword}</div>
    </div>
  `).join('');
}

function getAspectLabel(type) {
  const map = { conjunction: '合相', trine: '三分', sextile: '六分', square: '四分', opposition: '對分' };
  return map[type] || type;
}

window.filterAspects = function(planet) {
  document.querySelectorAll('.aspect-filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === planet);
  });
  document.querySelectorAll('.aspect-card').forEach(card => {
    if (planet === 'all' || card.dataset.planet === planet) {
      card.style.display = '';
    } else {
      card.style.display = 'none';
    }
  });
};

// ══════════════════════════════════════════════════════════════
// POKEDEX RENDER
// ══════════════════════════════════════════════════════════════
function renderPokedex() {
  const grid = document.getElementById('pokedexGrid');
  if (!grid) return;

  const collected = state.emotions;

  grid.innerHTML = EMOTIONS_DATA.map(e => `
    <div class="poke-card ${collected.includes(e.id) ? 'collected' : ''}"
         data-id="${e.id}"
         onclick="collectEmotion(${e.id})"
         tabindex="0"
         role="button"
         aria-label="情緒卡 ${e.name}${collected.includes(e.id) ? '（已收集）' : ''}"
         onkeydown="if(event.key==='Enter'||event.key===' ')collectEmotion(${e.id})">
      <span class="poke-emoji">${e.emoji}</span>
      <div class="poke-number">${e.number}</div>
      <div class="poke-name">${e.name}</div>
      <div class="poke-desc">${e.desc}</div>
    </div>
  `).join('');

  updatePokedexProgress();
}

window.collectEmotion = function(id) {
  const isNew = state.collectEmotion(id);
  if (isNew) {
    state.addXP(10);
    const em = EMOTIONS_DATA.find(e => e.id === id);
    showUnlockToast(`收集：${em.emoji} ${em.name}`);
  }
  // 更新 DOM
  const card = document.querySelector(`.poke-card[data-id="${id}"]`);
  if (card) {
    card.classList.add('collected');
    card.setAttribute('aria-label', `情緒卡 ${EMOTIONS_DATA.find(e=>e.id===id)?.name}（已收集）`);
  }
  updatePokedexProgress();
  updateLiveStats();
};

function updatePokedexProgress() {
  const count = state.emotions.length;
  const fill = document.getElementById('pokeProgressFill');
  const label = document.getElementById('pokeProgressLabel');
  if (fill) fill.style.width = (count / 28 * 100) + '%';
  if (label) label.textContent = `已收集 ${count} / 28`;
}

// ══════════════════════════════════════════════════════════════
// GACHA
// ══════════════════════════════════════════════════════════════
function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

window.doGacha = function() {
  const today = getTodayKey();
  const gachaKey = KEYS.gachaPrefix + today;

  if (localStorage.getItem(gachaKey)) {
    document.getElementById('gachaDailyMsg').textContent = '今日已抽卡，明天再來 ✦';
    return;
  }

  const ball = document.getElementById('gachaBall');
  const btn = document.getElementById('gachaBtn');
  const resultEl = document.getElementById('gachaResult');

  // 搖動動畫
  ball.classList.add('shaking');
  btn.disabled = true;

  setTimeout(() => {
    ball.classList.remove('shaking');

    // 加權抽取
    const weights = { common: 40, rare: 30, epic: 20, legendary: 10 };
    const pool = GACHA_POOL;
    const totalWeight = pool.reduce((s, p) => s + (weights[p.rarity] || 10), 0);
    let rand = Math.random() * totalWeight;
    let result = pool[0];
    for (const item of pool) {
      rand -= (weights[item.rarity] || 10);
      if (rand <= 0) { result = item; break; }
    }

    // 儲存結果
    localStorage.setItem(gachaKey, result.id);

    // 顯示結果
    document.getElementById('resultEmotion').textContent = result.emoji;
    document.getElementById('resultTitle').textContent = result.title;
    document.getElementById('resultDesc').textContent = result.desc;
    document.getElementById('resultAdvice').textContent = '建議：' + result.advice;
    const rarityEl = document.getElementById('resultRarity');
    const rarityMap = { common: '普通', rare: '稀有', epic: '史詩', legendary: '傳說' };
    rarityEl.textContent = '✦ ' + (rarityMap[result.rarity] || result.rarity) + ' ✦';
    rarityEl.className = 'result-rarity ' + result.rarity;

    resultEl.style.display = 'flex';
    ball.style.display = 'none';

    // XP
    const xpMap = { common: 5, rare: 10, epic: 20, legendary: 50 };
    state.addXP(xpMap[result.rarity] || 5);

    document.getElementById('gachaDailyMsg').textContent = '今日已抽卡，明天再來 ✦';
    updateLiveStats();
  }, 1000);
};

// ══════════════════════════════════════════════════════════════
// DREAM LOG & STREAK
// ══════════════════════════════════════════════════════════════
function checkStreak() {
  const today = getTodayKey();
  const last = state.lastVisit;
  const streak = state.streak;

  if (last === today) {
    // 已記錄今天
  } else if (last === getPrevDayKey()) {
    // 連續，但今天還沒打卡
  } else if (last && last !== today) {
    // 斷了，重置
    // 不在這裡重置，在 submitDream 時處理
  }

  updateStreakDisplay();
  renderDreamHistory();
}

function getPrevDayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

window.submitDream = function() {
  const input = document.getElementById('dreamInput');
  if (!input || !input.value.trim()) return;

  const today = getTodayKey();
  const last = state.lastVisit;
  let streak = state.streak;

  // 更新 streak
  if (last === getPrevDayKey()) {
    streak += 1;
  } else if (last === today) {
    // 今天已打卡，不重複增加
  } else {
    streak = 1;
  }

  localStorage.setItem(KEYS.streak, streak);
  localStorage.setItem(KEYS.lastVisit, today);

  // 儲存日誌
  const log = state.dreamlog;
  log.unshift({
    date: today,
    text: input.value.trim(),
    time: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
  });
  // 最多保留 30 條
  localStorage.setItem(KEYS.dreamlog, JSON.stringify(log.slice(0, 30)));

  // XP
  state.addXP(10);

  // 徽章檢查
  checkBadges(streak);

  input.value = '';
  updateStreakDisplay();
  renderDreamHistory();
  updateLiveStats();
};

function checkBadges(streak) {
  const thresholds = [7, 21, 100];
  thresholds.forEach(t => {
    if (streak >= t) {
      const el = document.getElementById(`badge${t}`);
      if (el) {
        el.classList.add('earned');
        if (!localStorage.getItem(`astro_moon_badge_${t}`)) {
          localStorage.setItem(`astro_moon_badge_${t}`, '1');
          const names = { 7: '新月守望者', 21: '滿月騎士', 100: '月相傳說' };
          showUnlockToast(`徽章解鎖：${names[t]} 🏆`);
          state.addXP(t === 7 ? 30 : t === 21 ? 70 : 200);
        }
      }
    }
  });
}

function updateStreakDisplay() {
  const el = document.getElementById('streakCount');
  if (el) el.textContent = state.streak;

  // 徽章狀態
  [7, 21, 100].forEach(t => {
    const el = document.getElementById(`badge${t}`);
    if (el) {
      el.classList.toggle('earned', state.streak >= t);
    }
  });
}

function renderDreamHistory() {
  const container = document.getElementById('dreamlogHistory');
  if (!container) return;
  const log = state.dreamlog;

  if (log.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:var(--c-text2);font-size:0.8rem;">還沒有日誌記錄</p>';
    return;
  }

  container.innerHTML = log.slice(0, 10).map(entry => `
    <div class="dream-entry">
      <div class="dream-entry-date">${entry.date} ${entry.time || ''}</div>
      <div class="dream-entry-text">${escapeHTML(entry.text)}</div>
    </div>
  `).join('');
}

function escapeHTML(str) {
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
}

// ══════════════════════════════════════════════════════════════
// FULL MOON CHECK (簡易朔望月估算)
// ══════════════════════════════════════════════════════════════
function isFullMoon() {
  // 以 2024-01-25 的滿月為基準日期
  const baseFullMoon = new Date('2024-01-25');
  const synMonth = 29.53058867;
  const now = new Date();
  const daysSince = (now - baseFullMoon) / (1000 * 60 * 60 * 24);
  const phase = ((daysSince % synMonth) + synMonth) % synMonth;
  // 滿月窗口：13.5 - 15.5 天（±1 天容錯）
  return phase >= 13.5 && phase <= 15.5;
}

function checkFullMoon() {
  if (!isFullMoon()) return;
  const today = getTodayKey();
  const claimedKey = KEYS.fullMoonClaimed + today;
  if (localStorage.getItem(claimedKey)) return;

  // 延遲 2 秒彈出，避免與頁面載入衝突
  setTimeout(() => {
    const modal = document.getElementById('fullMoonModal');
    if (modal) modal.style.display = 'flex';
  }, 2000);
}

window.claimFullMoon = function() {
  const today = getTodayKey();
  localStorage.setItem(KEYS.fullMoonClaimed + today, '1');
  state.addXP(50);
  closeModal('fullMoonModal');
  updateLiveStats();
};

// ══════════════════════════════════════════════════════════════
// RADAR CHART
// ══════════════════════════════════════════════════════════════
const RADAR_DATA = {
  fire:  { labels: ['直覺衝動', '行動力', '創意熱情', '領導力', '急躁指數'], values: [90, 85, 88, 80, 75], color: '#ff8c6b' },
  earth: { labels: ['穩定性', '感官感知', '務實能力', '耐心指數', '固執傾向'], values: [95, 82, 90, 88, 70], color: '#8ecf6f' },
  air:   { labels: ['溝通能力', '思考彈性', '社交感知', '客觀性', '情感距離'], values: [88, 85, 78, 80, 72], color: '#7ab8f5' },
  water: { labels: ['情感深度', '直覺準確', '共情能力', '記憶強度', '邊界感'], values: [92, 88, 95, 85, 45], color: '#ae8fff' },
};

function initRadarChart(element) {
  const canvas = document.getElementById('radarCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const data = RADAR_DATA[element] || RADAR_DATA.fire;

  const W = canvas.width;
  const H = canvas.height;
  const cx = W / 2;
  const cy = H / 2;
  const r = Math.min(W, H) * 0.38;
  const sides = data.labels.length;

  ctx.clearRect(0, 0, W, H);

  // 背景網格
  for (let ring = 1; ring <= 5; ring++) {
    const rr = r * ring / 5;
    ctx.beginPath();
    for (let i = 0; i <= sides; i++) {
      const angle = (Math.PI * 2 * i / sides) - Math.PI / 2;
      const x = cx + rr * Math.cos(angle);
      const y = cy + rr * Math.sin(angle);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = 'rgba(140,170,255,0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // 軸線
  for (let i = 0; i < sides; i++) {
    const angle = (Math.PI * 2 * i / sides) - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
    ctx.strokeStyle = 'rgba(140,170,255,0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // 數據多邊形
  ctx.beginPath();
  data.values.forEach((v, i) => {
    const angle = (Math.PI * 2 * i / sides) - Math.PI / 2;
    const rv = r * v / 100;
    const x = cx + rv * Math.cos(angle);
    const y = cy + rv * Math.sin(angle);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.closePath();

  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  grad.addColorStop(0, data.color + '40');
  grad.addColorStop(1, data.color + '10');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = data.color;
  ctx.lineWidth = 2;
  ctx.shadowBlur = 12;
  ctx.shadowColor = data.color;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // 數據點
  data.values.forEach((v, i) => {
    const angle = (Math.PI * 2 * i / sides) - Math.PI / 2;
    const rv = r * v / 100;
    const x = cx + rv * Math.cos(angle);
    const y = cy + rv * Math.sin(angle);
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = data.color;
    ctx.fill();
  });

  // 標籤
  ctx.font = '12px Silkscreen, monospace';
  ctx.fillStyle = 'rgba(200,216,255,0.85)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  data.labels.forEach((label, i) => {
    const angle = (Math.PI * 2 * i / sides) - Math.PI / 2;
    const lr = r * 1.2;
    const x = cx + lr * Math.cos(angle);
    const y = cy + lr * Math.sin(angle);
    ctx.fillText(label, x, y);
  });
}

window.updateRadar = function(element) {
  document.querySelectorAll('.radar-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.element === element);
  });
  initRadarChart(element);
};

// ══════════════════════════════════════════════════════════════
// SHARE CARD
// ══════════════════════════════════════════════════════════════
function updateLiveStats() {
  const xp = state.xp;
  const levelIdx = getCurrentLevelIndex(xp);
  const emotions = state.emotions.length;
  const houses = state.housesUnlocked.length;
  const streak = state.streak;
  const levelName = LEVELS[levelIdx].name;

  // share card preview
  const scLevel = document.getElementById('sc-level');
  const scXP = document.getElementById('sc-xp');
  const scEmotions = document.getElementById('sc-emotions');
  const scHouses = document.getElementById('sc-houses');
  const scLevelName = document.getElementById('scLevelName');
  if (scLevel) scLevel.textContent = levelIdx + 1;
  if (scXP) scXP.textContent = xp;
  if (scEmotions) scEmotions.textContent = emotions;
  if (scHouses) scHouses.textContent = houses;
  if (scLevelName) scLevelName.textContent = levelName;

  // live stats
  const liveLevel = document.getElementById('liveLevel');
  const liveXP = document.getElementById('liveXP');
  const liveEmotions = document.getElementById('liveEmotions');
  const liveStreak = document.getElementById('liveStreak');
  if (liveLevel) liveLevel.textContent = levelIdx + 1;
  if (liveXP) liveXP.textContent = xp;
  if (liveEmotions) liveEmotions.textContent = `${emotions}/28`;
  if (liveStreak) liveStreak.textContent = streak;
}

window.generateShareCard = function() {
  updateLiveStats();

  const target = document.getElementById('shareCardInner');
  if (!target) return;

  if (typeof html2canvas === 'undefined') {
    alert('html2canvas 尚未載入，請重新整理頁面後重試。');
    return;
  }

  html2canvas(target, {
    backgroundColor: '#04060f',
    scale: 3,
    useCORS: true,
    allowTaint: true,
    width: 280,
    height: target.offsetHeight,
  }).then(canvas => {
    const link = document.createElement('a');
    link.download = 'moon-astro-card.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }).catch(err => {
    console.error('html2canvas error:', err);
    alert('截圖生成失敗，請確認瀏覽器支援。');
  });
};

// ══════════════════════════════════════════════════════════════
// MODAL CLOSE
// ══════════════════════════════════════════════════════════════
window.closeModal = function(id) {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = 'none';
};

// 點擊 overlay 關閉
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.style.display = 'none';
  }
});

// ESC 關閉
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay').forEach(m => {
      m.style.display = 'none';
    });
  }
});

// ══════════════════════════════════════════════════════════════
// AUDIO (Web Audio API — 無需外部音檔)
// ══════════════════════════════════════════════════════════════
let audioCtx = null;
let audioNodes = [];
let audioPlaying = false;

window.addEventListener('click', function initAudioOnce() {
  // 預先建立 AudioContext（解鎖 autoplay 限制）
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}, { once: true });

document.getElementById('audioToggle')?.addEventListener('click', toggleAudio);

function toggleAudio() {
  if (audioPlaying) {
    stopOcean();
    audioPlaying = false;
    document.querySelector('.audio-icon').textContent = '🔇';
  } else {
    playOcean();
    audioPlaying = true;
    document.querySelector('.audio-icon').textContent = '🔊';
  }
}

function playOcean() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();

  // 海浪白噪音：低頻過濾後的噪音
  const bufferSize = audioCtx.sampleRate * 4;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  // 低通濾波 → 海浪感
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 400;
  filter.Q.value = 0.5;

  // 增益（音量）
  const gainNode = audioCtx.createGain();
  gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 2);

  // 緩慢 LFO 模擬潮汐
  const lfo = audioCtx.createOscillator();
  const lfoGain = audioCtx.createGain();
  lfo.frequency.value = 0.08; // 非常慢的震盪
  lfoGain.gain.value = 0.04;
  lfo.connect(lfoGain);
  lfoGain.connect(gainNode.gain);
  lfo.start();

  source.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  source.start();

  audioNodes = [source, filter, gainNode, lfo, lfoGain];
}

function stopOcean() {
  if (!audioCtx) return;
  const gainNode = audioNodes[2];
  if (gainNode) {
    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1);
    setTimeout(() => {
      audioNodes.forEach(n => { try { n.stop && n.stop(); } catch(e) {} });
      audioNodes = [];
    }, 1200);
  }
}

// ══════════════════════════════════════════════════════════════
// SCROLL ANIMATIONS (Intersection Observer)
// ══════════════════════════════════════════════════════════════
function initScrollAnimations() {
  // 加 fade-up class 到區塊
  const targets = document.querySelectorAll(
    '.myth-card, .house-card, .sign-card, .aspect-card, .case-card, .guide-card, .poke-card'
  );

  targets.forEach((el, i) => {
    el.classList.add('fade-up');
    el.style.transitionDelay = (i % 6) * 0.07 + 's';
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  targets.forEach(el => observer.observe(el));
}

// ══════════════════════════════════════════════════════════════
// GSAP 增強動畫（若載入成功）
// ══════════════════════════════════════════════════════════════
window.addEventListener('load', () => {
  if (typeof gsap === 'undefined') return;

  if (typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }

  // Hero title entrance
  gsap.fromTo('.hero-title', {
    opacity: 0,
    y: 40,
    filter: 'blur(10px)'
  }, {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    duration: 1.4,
    ease: 'power3.out',
    delay: 0.3,
  });

  gsap.fromTo('.hero-overline', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1, delay: 0.1 });
  gsap.fromTo('.hero-subtitle', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1, delay: 0.7 });
  gsap.fromTo('.hero-cta-row', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1, delay: 1 });

  // Section headers
  document.querySelectorAll('.section-header').forEach(el => {
    if (typeof ScrollTrigger !== 'undefined') {
      gsap.fromTo(el,
        { opacity: 0, y: 30 },
        {
          opacity: 1, y: 0, duration: 0.9,
          scrollTrigger: { trigger: el, start: 'top 85%', once: true }
        }
      );
    }
  });
});

// ══════════════════════════════════════════════════════════════
// 工具函數
// ══════════════════════════════════════════════════════════════
// 振動反饋（若支援）
function vibrate(pattern) {
  if (navigator.vibrate) navigator.vibrate(pattern);
}

// 分享 Web Share API
window.shareCard = function() {
  if (navigator.share) {
    navigator.share({
      title: '月亮情緒圖鑑',
      text: `我在月亮占星圖鑑中收集了 ${state.emotions.length} 種情緒，等級 ${getCurrentLevelIndex(state.xp) + 1}！`,
      url: window.location.href,
    }).catch(() => {});
  }
};

// ══════════════════════════════════════════════════════════════
// 初始化 updateLiveStats & XP bar 在 DOM 載入後
// ══════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  updateLiveStats();
  updateXPBar();
  updateHouseProgress();
  updatePokedexProgress();
  updateStreakDisplay();
});
