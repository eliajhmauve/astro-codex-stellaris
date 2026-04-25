/* ============================================================
   SUN RPG — script.js
   ============================================================ */

'use strict';

/* ---------- Constants ---------- */
const XP_LEVELS = [
  { name: '見習太陽',   min: 0,    icon: '🌱' },
  { name: '初階英雄',   min: 300,  icon: '⚡' },
  { name: '王者',       min: 800,  icon: '👑' },
  { name: '神聖自我',   min: 1500, icon: '☀️' },
];

const LS = {
  xp:          'astro_sun_xp',
  level:       'astro_sun_level',
  badges:      'astro_sun_badges',
  streak:      'astro_sun_streak',
  lastVisit:   'astro_sun_last_visit',
  dailyPrefix: 'astro_sun_dailyquest_',
  studytime:   'astro_sun_studytime',
  easterCount: 'astro_sun_easter_count',
};

const DAILY_INSIGHTS = [
  '太陽是你意識的種子——今天，選擇一件你真正想做的事，而不只是應該做的事。',
  '意志力不是壓制情緒，而是讓「我是誰」比「我感覺如何」更大。',
  '主角不等完美才出場。你此刻的樣子，就是故事的起點。',
  '太陽需要被看見才能發光。今天，讓一個人知道你真正在乎什麼。',
  '陰影不是你的敵人——它是你還沒整合的太陽能量。',
  '創造力不是天賦，是太陽每天要你練習的肌肉。',
  '太陽的傲慢是：以為自己不重要。展示你的光，是給別人許可。',
  '你的太陽星座不是「個性標籤」——它是你要刻意活出的方向。',
  '英雄之旅第一步：承認你現在在哪裡，而不是你應該在哪裡。',
  '太陽能量最被壓制的地方，往往是你最害怕被評判的地方。',
  '今天找一個你一直在拖延的表達行為，做出第一個 1% 的版本。',
  '自我認識不是找到固定答案，而是持續問：「現在的我在追求什麼？」',
  '太陽在什麼宮，就在那個人生舞台上演你的主角戲。',
  '你的光芒不會搶走別人的光——反而會提醒他們自己也有。',
  '今天選一個讓你感到「活著」的時刻，把它放大三倍。',
];

const GACHA_SKILLS = [
  { icon: '🔥', name: '意志聚焦', desc: '今天，單點突破一件事。不分心，不多工。讓太陽能量聚成雷射。' },
  { icon: '🎭', name: '戲劇登場', desc: '選一個平常低調的場合，多說一句你真正想說的話。' },
  { icon: '🌊', name: '創意流動', desc: '花 10 分鐘做任何你覺得「沒意義但好玩」的事，不帶評判。' },
  { icon: '👁️', name: '自我觀察', desc: '今天問自己三次：「我現在做的，是我想要的嗎？」不用改變，只是觀察。' },
  { icon: '⚡', name: '邊界宣告', desc: '今天說一次「不」，清楚且不帶歉意。這是太陽能量最純粹的練習。' },
  { icon: '🌟', name: '公開表達', desc: '把一個你私下認為的觀點，說給另一個人聽——哪怕只是簡短一句。' },
  { icon: '🏛️', name: '架構思維', desc: '為你現在最重要的目標畫一個 3 步驟路徑圖，哪怕只是草稿。' },
  { icon: '🎯', name: '精準行動', desc: '今天找出你最逃避的那件事，做最小可行的第一步。' },
  { icon: '🦁', name: '領袖時刻', desc: '在某個群體中，主動分享你的看法或帶動一個話題。' },
  { icon: '🌙', name: '陰影整合', desc: '今天，觀察一個讓你有強烈反應（羨慕或厭惡）的人——他映照了你什麼？' },
  { icon: '🎪', name: '玩樂主義', desc: '安排今天有一個純粹的玩耍時間，沒有生產力目標。' },
  { icon: '💡', name: '洞見捕捉', desc: '隨身記下今天出現的任何靈感，哪怕看似不相關。' },
];

/* ---------- State ---------- */
let state = {
  xp: 0,
  level: 0,
  badges: [],
  streak: 0,
  lastVisit: null,
  studytime: 0,
  easterCount: 0,
};

/* ---------- Init ---------- */
function initState() {
  state.xp          = parseInt(localStorage.getItem(LS.xp) || '0');
  state.level       = parseInt(localStorage.getItem(LS.level) || '0');
  state.badges      = JSON.parse(localStorage.getItem(LS.badges) || '[]');
  state.streak      = parseInt(localStorage.getItem(LS.streak) || '0');
  state.lastVisit   = localStorage.getItem(LS.lastVisit) || null;
  state.studytime   = parseInt(localStorage.getItem(LS.studytime) || '0');
  state.easterCount = parseInt(localStorage.getItem(LS.easterCount) || '0');
  updateStreak();
  startStudyTimer();
}

function saveState() {
  localStorage.setItem(LS.xp, state.xp);
  localStorage.setItem(LS.level, state.level);
  localStorage.setItem(LS.badges, JSON.stringify(state.badges));
  localStorage.setItem(LS.streak, state.streak);
  localStorage.setItem(LS.lastVisit, state.lastVisit);
  localStorage.setItem(LS.studytime, state.studytime);
  localStorage.setItem(LS.easterCount, state.easterCount);
}

/* ---------- XP & Levels ---------- */
function addXP(amount, label) {
  const oldLevel = getCurrentLevel();
  state.xp += amount;
  const newLevel = getCurrentLevel();
  if (newLevel > oldLevel) {
    state.level = newLevel;
    triggerLevelUp(newLevel);
  }
  saveState();
  updateHUD();
  if (label) showXPToast(amount, label);
}

function getCurrentLevel() {
  for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
    if (state.xp >= XP_LEVELS[i].min) return i;
  }
  return 0;
}

function getNextLevelXP() {
  const lvl = getCurrentLevel();
  if (lvl + 1 < XP_LEVELS.length) return XP_LEVELS[lvl + 1].min;
  return null;
}

function updateHUD() {
  const lvl = getCurrentLevel();
  const levelData = XP_LEVELS[lvl];
  const nextXP = getNextLevelXP();

  const labelEl = document.getElementById('hud-level-label');
  const fillEl  = document.getElementById('hud-xp-fill');
  const textEl  = document.getElementById('hud-xp-text');
  const streakEl = document.getElementById('hud-streak');
  const badgesEl = document.getElementById('hud-badges-mini');
  const studyEl  = document.getElementById('hud-studytime');

  if (labelEl) labelEl.textContent = `${levelData.icon} ${levelData.name}`;
  if (fillEl) {
    const pct = nextXP
      ? Math.min(100, ((state.xp - XP_LEVELS[lvl].min) / (nextXP - XP_LEVELS[lvl].min)) * 100)
      : 100;
    fillEl.style.width = pct + '%';
  }
  if (textEl) {
    textEl.textContent = nextXP
      ? `${state.xp} / ${nextXP} XP`
      : `${state.xp} XP — 已達最高境界`;
  }
  if (streakEl) {
    streakEl.textContent = `🔥 ${state.streak}天`;
    streakEl.className = 'hud-streak' + (state.streak === 0 ? ' broken' : '');
  }
  if (badgesEl) badgesEl.textContent = `🏅 ${state.badges.length}/69`;
  if (studyEl) {
    const mins = Math.floor(state.studytime / 60);
    const secs = state.studytime % 60;
    studyEl.textContent = `⏱ ${mins}:${secs.toString().padStart(2,'0')}`;
  }
  updateBadgeGrid();
}

/* ---------- Level Up Modal ---------- */
function triggerLevelUp(lvl) {
  const modal = document.getElementById('levelup-modal');
  const nameEl = document.getElementById('levelup-name');
  const iconEl = document.getElementById('levelup-icon');
  if (!modal) return;
  if (nameEl) nameEl.textContent = XP_LEVELS[lvl].name;
  if (iconEl) iconEl.textContent = XP_LEVELS[lvl].icon;

  // burst particles
  const burst = modal.querySelector('.levelup-burst');
  if (burst) {
    burst.innerHTML = '';
    for (let i = 0; i < 24; i++) {
      const p = document.createElement('div');
      p.className = 'burst-particle';
      const angle = (i / 24) * 360;
      const dist = 80 + Math.random() * 120;
      p.style.cssText = `
        left: 50%; top: 50%;
        --bx: ${Math.cos(angle * Math.PI/180) * dist}px;
        --by: ${Math.sin(angle * Math.PI/180) * dist}px;
        background: ${['#FFD166','#F5A623','#9B2FFF','#06C4F5'][i % 4]};
        animation-delay: ${i * 0.03}s;
      `;
      burst.appendChild(p);
    }
  }
  openModal('levelup-modal');

  // optional audio (Web Audio API)
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [523, 659, 784, 1047].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.4);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.5);
    });
  } catch (e) {}
}

/* ---------- XP Toast ---------- */
function showXPToast(amount, label) {
  const toast = document.createElement('div');
  toast.className = 'xp-toast';
  toast.style.cssText = `
    position: fixed; bottom: 80px; right: 20px; z-index: 2500;
    background: linear-gradient(135deg, rgba(245,166,35,0.9) 0%, rgba(155,47,255,0.9) 100%);
    color: #080810; font-family: 'JetBrains Mono', monospace;
    font-weight: 700; font-size: 0.85rem;
    padding: 0.5rem 1rem; border-radius: 3px;
    animation: fade-up 0.4s forwards, fade-out 0.4s 1.6s forwards;
    pointer-events: none;
  `;
  toast.textContent = `+${amount} XP ${label}`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2200);
}

/* ---------- Badges ---------- */
const BADGE_DEFS = [
  // Houses 1-12
  { id: 'house-1',  icon: '🗡️', label: '第一宮', group: 'house' },
  { id: 'house-2',  icon: '💰', label: '第二宮', group: 'house' },
  { id: 'house-3',  icon: '📖', label: '第三宮', group: 'house' },
  { id: 'house-4',  icon: '🏠', label: '第四宮', group: 'house' },
  { id: 'house-5',  icon: '🎭', label: '第五宮', group: 'house' },
  { id: 'house-6',  icon: '⚕️', label: '第六宮', group: 'house' },
  { id: 'house-7',  icon: '⚖️', label: '第七宮', group: 'house' },
  { id: 'house-8',  icon: '🔮', label: '第八宮', group: 'house' },
  { id: 'house-9',  icon: '🌏', label: '第九宮', group: 'house' },
  { id: 'house-10', icon: '🏆', label: '第十宮',  group: 'house' },
  { id: 'house-11', icon: '🌐', label: '第十一宮', group: 'house' },
  { id: 'house-12', icon: '🌊', label: '第十二宮', group: 'house' },
  // Signs 1-12
  { id: 'sign-aries',  icon: '♈', label: '牡羊', group: 'sign' },
  { id: 'sign-taurus', icon: '♉', label: '金牛', group: 'sign' },
  { id: 'sign-gemini', icon: '♊', label: '雙子', group: 'sign' },
  { id: 'sign-cancer', icon: '♋', label: '巨蟹', group: 'sign' },
  { id: 'sign-leo',    icon: '♌', label: '獅子', group: 'sign' },
  { id: 'sign-virgo',  icon: '♍', label: '處女', group: 'sign' },
  { id: 'sign-libra',  icon: '♎', label: '天秤', group: 'sign' },
  { id: 'sign-scorpio',icon: '♏', label: '天蠍', group: 'sign' },
  { id: 'sign-sagittarius',icon:'♐',label: '射手', group: 'sign' },
  { id: 'sign-capricorn', icon:'♑', label: '摩羯', group: 'sign' },
  { id: 'sign-aquarius',  icon:'♒', label: '水瓶', group: 'sign' },
  { id: 'sign-pisces',    icon:'♓', label: '雙魚', group: 'sign' },
  // Aspects 9 planets × 5
  { id: 'asp-sun-moon-conj',  icon: '🌑', label: '日月合', group: 'aspect' },
  { id: 'asp-sun-moon-opp',   icon: '🌕', label: '日月對', group: 'aspect' },
  { id: 'asp-sun-moon-sq',    icon: '🌓', label: '日月刑', group: 'aspect' },
  { id: 'asp-sun-moon-tri',   icon: '🌟', label: '日月三', group: 'aspect' },
  { id: 'asp-sun-moon-sex',   icon: '✨', label: '日月六', group: 'aspect' },
  { id: 'asp-sun-merc-conj',  icon: '💬', label: '日水合', group: 'aspect' },
  { id: 'asp-sun-merc-opp',   icon: '🗣️', label: '日水對', group: 'aspect' },
  { id: 'asp-sun-merc-sq',    icon: '🔤', label: '日水刑', group: 'aspect' },
  { id: 'asp-sun-merc-tri',   icon: '📢', label: '日水三', group: 'aspect' },
  { id: 'asp-sun-merc-sex',   icon: '💡', label: '日水六', group: 'aspect' },
  { id: 'asp-sun-ven-conj',   icon: '💛', label: '日金合', group: 'aspect' },
  { id: 'asp-sun-ven-opp',    icon: '💔', label: '日金對', group: 'aspect' },
  { id: 'asp-sun-ven-sq',     icon: '⚡', label: '日金刑', group: 'aspect' },
  { id: 'asp-sun-ven-tri',    icon: '🌹', label: '日金三', group: 'aspect' },
  { id: 'asp-sun-ven-sex',    icon: '🌸', label: '日金六', group: 'aspect' },
  { id: 'asp-sun-mars-conj',  icon: '🔥', label: '日火合', group: 'aspect' },
  { id: 'asp-sun-mars-opp',   icon: '⚔️', label: '日火對', group: 'aspect' },
  { id: 'asp-sun-mars-sq',    icon: '💥', label: '日火刑', group: 'aspect' },
  { id: 'asp-sun-mars-tri',   icon: '🏹', label: '日火三', group: 'aspect' },
  { id: 'asp-sun-mars-sex',   icon: '🗡️', label: '日火六', group: 'aspect' },
  { id: 'asp-sun-jup-conj',   icon: '🌈', label: '日木合', group: 'aspect' },
  { id: 'asp-sun-jup-opp',    icon: '⚖️', label: '日木對', group: 'aspect' },
  { id: 'asp-sun-jup-sq',     icon: '🎲', label: '日木刑', group: 'aspect' },
  { id: 'asp-sun-jup-tri',    icon: '🍀', label: '日木三', group: 'aspect' },
  { id: 'asp-sun-jup-sex',    icon: '🎯', label: '日木六', group: 'aspect' },
  { id: 'asp-sun-sat-conj',   icon: '⛰️', label: '日土合', group: 'aspect' },
  { id: 'asp-sun-sat-opp',    icon: '🧊', label: '日土對', group: 'aspect' },
  { id: 'asp-sun-sat-sq',     icon: '🪨', label: '日土刑', group: 'aspect' },
  { id: 'asp-sun-sat-tri',    icon: '🏛️', label: '日土三', group: 'aspect' },
  { id: 'asp-sun-sat-sex',    icon: '📐', label: '日土六', group: 'aspect' },
  { id: 'asp-sun-ura-conj',   icon: '⚡', label: '日天合', group: 'aspect' },
  { id: 'asp-sun-ura-opp',    icon: '🌀', label: '日天對', group: 'aspect' },
  { id: 'asp-sun-ura-sq',     icon: '🔌', label: '日天刑', group: 'aspect' },
  { id: 'asp-sun-ura-tri',    icon: '💫', label: '日天三', group: 'aspect' },
  { id: 'asp-sun-ura-sex',    icon: '🌩️', label: '日天六', group: 'aspect' },
  { id: 'asp-sun-nep-conj',   icon: '🌊', label: '日海合', group: 'aspect' },
  { id: 'asp-sun-nep-opp',    icon: '🌫️', label: '日海對', group: 'aspect' },
  { id: 'asp-sun-nep-sq',     icon: '🔱', label: '日海刑', group: 'aspect' },
  { id: 'asp-sun-nep-tri',    icon: '🎶', label: '日海三', group: 'aspect' },
  { id: 'asp-sun-nep-sex',    icon: '🦋', label: '日海六', group: 'aspect' },
  { id: 'asp-sun-plu-conj',   icon: '💎', label: '日冥合', group: 'aspect' },
  { id: 'asp-sun-plu-opp',    icon: '🕳️', label: '日冥對', group: 'aspect' },
  { id: 'asp-sun-plu-sq',     icon: '🌋', label: '日冥刑', group: 'aspect' },
  { id: 'asp-sun-plu-tri',    icon: '🦅', label: '日冥三', group: 'aspect' },
  { id: 'asp-sun-plu-sex',    icon: '🐍', label: '日冥六', group: 'aspect' },
  // Special
  { id: 'daily-done',    icon: '📅', label: '每日任務', group: 'special' },
  { id: 'streak-7',      icon: '🔥', label: '7天連擊',  group: 'special' },
  { id: 'streak-30',     icon: '🏆', label: '30天連擊', group: 'special' },
  { id: 'gacha-first',   icon: '🎲', label: '初抽卡',   group: 'special' },
  { id: 'easter',        icon: '🌞', label: '神諭解鎖', group: 'special' },
];

function earnBadge(id) {
  if (state.badges.includes(id)) return false;
  state.badges.push(id);
  saveState();
  updateHUD();
  showBadgeToast(id);
  return true;
}

function showBadgeToast(id) {
  const def = BADGE_DEFS.find(b => b.id === id);
  if (!def) return;
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed; bottom: 120px; right: 20px; z-index: 2500;
    background: linear-gradient(135deg, rgba(27,10,60,0.95) 0%, rgba(13,11,30,0.95) 100%);
    border: 1px solid #F5A623; color: #F0E6C8;
    font-family: 'DM Sans', sans-serif; font-size: 0.82rem;
    padding: 0.6rem 1rem; border-radius: 3px;
    animation: fade-up 0.4s forwards;
    pointer-events: none; max-width: 220px;
  `;
  toast.innerHTML = `${def.icon} 解鎖徽章：<strong style="color:#FFD166">${def.label}</strong>`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function updateBadgeGrid() {
  const grid = document.getElementById('badge-grid');
  if (!grid) return;
  grid.innerHTML = '';
  BADGE_DEFS.forEach(def => {
    const item = document.createElement('div');
    item.className = 'badge-item ' + (state.badges.includes(def.id) ? 'unlocked' : 'locked');
    item.title = def.label;
    item.innerHTML = `<span>${def.icon}</span><span class="badge-label">${def.label}</span>`;
    if (state.badges.includes(def.id)) {
      item.setAttribute('tabindex', '0');
    }
    grid.appendChild(item);
  });
  const countEl = document.getElementById('badge-count');
  if (countEl) countEl.textContent = `已解鎖 ${state.badges.length} / ${BADGE_DEFS.length} 個`;
}

/* ---------- Streak ---------- */
function updateStreak() {
  const today = todayStr();
  if (!state.lastVisit) {
    state.streak = 1;
    state.lastVisit = today;
  } else {
    const last = new Date(state.lastVisit);
    const now  = new Date(today);
    const diff = Math.round((now - last) / 86400000);
    if (diff === 0) { /* same day */ }
    else if (diff === 1) {
      state.streak++;
      state.lastVisit = today;
      if (state.streak === 7)  earnBadge('streak-7');
      if (state.streak === 30) earnBadge('streak-30');
    } else {
      state.streak = 1;
      state.lastVisit = today;
    }
  }
  saveState();
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

/* ---------- Daily Quest ---------- */
function initDailyQuest() {
  const key = LS.dailyPrefix + todayStr();
  const done = localStorage.getItem(key) === 'done';
  const seed = new Date().toISOString().slice(0,10).replace(/-/g,'');
  const idx  = parseInt(seed) % DAILY_INSIGHTS.length;
  const insight = DAILY_INSIGHTS[idx];

  const banner = document.getElementById('daily-quest-banner');
  const textEl = document.getElementById('quest-text');
  const btn    = document.getElementById('quest-btn');
  if (!banner) return;

  if (textEl) textEl.textContent = insight;
  if (btn) {
    if (done) {
      btn.textContent = '已完成 +50 XP';
      btn.classList.add('done');
    } else {
      btn.textContent = '完成任務 +50 XP';
      btn.onclick = () => {
        localStorage.setItem(key, 'done');
        btn.textContent = '已完成 +50 XP';
        btn.classList.add('done');
        addXP(50, '每日任務');
        earnBadge('daily-done');
      };
    }
  }
  setTimeout(() => banner.classList.add('visible'), 1200);
}

/* ---------- Study Timer ---------- */
function startStudyTimer() {
  setInterval(() => {
    state.studytime++;
    if (state.studytime % 60 === 0) saveState();
    const el = document.getElementById('hud-studytime');
    if (el) {
      const m = Math.floor(state.studytime / 60);
      const s = state.studytime % 60;
      el.textContent = `⏱ ${m}:${s.toString().padStart(2,'0')}`;
    }
  }, 1000);
}

/* ---------- Gacha ---------- */
function doGacha() {
  const card = document.getElementById('gacha-card');
  const btn  = document.getElementById('gacha-btn');
  if (!card) return;
  card.classList.remove('revealed');
  setTimeout(() => {
    const skill = GACHA_SKILLS[Math.floor(Math.random() * GACHA_SKILLS.length)];
    card.querySelector('.skill-icon').textContent  = skill.icon;
    card.querySelector('.skill-name').textContent  = skill.name;
    card.querySelector('.skill-desc').textContent  = skill.desc;
    card.classList.add('revealed');
    addXP(30, '抽取技能');
    earnBadge('gacha-first');
  }, 300);
}

/* ---------- Radar Chart ---------- */
function drawRadar() {
  const canvas = document.getElementById('radarChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2;
  const r = Math.min(W, H) * 0.38;
  const labels = ['意志力','創造力','表達力','自信心','領導力'];
  const values = [0.88, 0.92, 0.78, 0.85, 0.82];
  const N = labels.length;

  ctx.clearRect(0, 0, W, H);

  // grid
  for (let ring = 1; ring <= 5; ring++) {
    const rr = r * ring / 5;
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const angle = (i / N) * Math.PI * 2 - Math.PI / 2;
      const x = cx + rr * Math.cos(angle);
      const y = cy + rr * Math.sin(angle);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = 'rgba(255,210,100,0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // axes
  for (let i = 0; i < N; i++) {
    const angle = (i / N) * Math.PI * 2 - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
    ctx.strokeStyle = 'rgba(255,210,100,0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // fill
  ctx.beginPath();
  for (let i = 0; i < N; i++) {
    const angle = (i / N) * Math.PI * 2 - Math.PI / 2;
    const rr = r * values[i];
    const x = cx + rr * Math.cos(angle);
    const y = cy + rr * Math.sin(angle);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  grad.addColorStop(0,   'rgba(245,166,35,0.55)');
  grad.addColorStop(0.6, 'rgba(155,47,255,0.35)');
  grad.addColorStop(1,   'rgba(6,196,245,0.15)');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = '#F5A623';
  ctx.lineWidth = 2;
  ctx.stroke();

  // dots + labels
  for (let i = 0; i < N; i++) {
    const angle = (i / N) * Math.PI * 2 - Math.PI / 2;
    const rr = r * values[i];
    const x = cx + rr * Math.cos(angle);
    const y = cy + rr * Math.sin(angle);
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#FFD166';
    ctx.fill();

    const lx = cx + (r + 28) * Math.cos(angle);
    const ly = cy + (r + 28) * Math.sin(angle);
    ctx.fillStyle = '#F0E6C8';
    ctx.font = '700 13px "DM Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labels[i], lx, ly);

    ctx.fillStyle = 'rgba(255,210,100,0.6)';
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillText(Math.round(values[i] * 100) + '%', lx, ly + 16);
  }
}

/* ---------- Scroll Reveal ---------- */
function initScrollReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, idx) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), idx * 60);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  els.forEach(el => observer.observe(el));
}

/* ---------- Nav Dots ---------- */
function initNavDots() {
  const dots = document.querySelectorAll('.nav-dot');
  const sections = Array.from(document.querySelectorAll('section[id]'));
  if (!dots.length || !sections.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        dots.forEach(d => d.classList.toggle('active', d.dataset.target === id));
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(s => observer.observe(s));
  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      document.getElementById(dot.dataset.target)?.scrollIntoView({ behavior: 'smooth' });
    });
  });
}

/* ---------- House Badge Triggers ---------- */
function initHouseBadges() {
  document.querySelectorAll('.house-badge-trigger').forEach(btn => {
    const id = btn.dataset.badge;
    if (state.badges.includes(id)) {
      btn.classList.add('earned');
      btn.textContent = '✓ 已解鎖';
    }
    btn.addEventListener('click', () => {
      if (!btn.classList.contains('earned')) {
        earnBadge(id);
        addXP(20, `解鎖${btn.dataset.label || '宮位'}`);
        btn.classList.add('earned');
        btn.textContent = '✓ 已解鎖';
      }
    });
    // also trigger on scroll-into-view
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          if (!state.badges.includes(id)) {
            earnBadge(id);
            addXP(20, `解鎖宮位`);
            btn.classList.add('earned');
            btn.textContent = '✓ 已解鎖';
          }
        }, 800);
        observer.disconnect();
      }
    }, { threshold: 0.6 });
    observer.observe(btn.closest('section') || btn);
  });
}

/* ---------- Sign Badge Triggers ---------- */
function initSignBadges() {
  document.querySelectorAll('.sign-badge-trigger').forEach(btn => {
    const id = btn.dataset.badge;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          if (!state.badges.includes(id)) {
            earnBadge(id);
            addXP(20, '解鎖星座');
          }
        }, 800);
        observer.disconnect();
      }
    }, { threshold: 0.5 });
    observer.observe(btn.closest('section') || btn);
  });
}

/* ---------- Aspect Matrix ---------- */
function initAspectMatrix() {
  document.querySelectorAll('.aspect-cell').forEach(cell => {
    cell.addEventListener('click', () => {
      const wasActive = cell.classList.contains('active');
      document.querySelectorAll('.aspect-cell.active').forEach(c => c.classList.remove('active'));
      if (!wasActive) {
        cell.classList.add('active');
        const badgeId = cell.dataset.badge;
        if (badgeId && !state.badges.includes(badgeId)) {
          earnBadge(badgeId);
          addXP(10, '相位洞見');
        }
      }
    });
    cell.setAttribute('tabindex', '0');
    cell.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cell.click(); } });
  });
}

/* ---------- Easter Egg (sun click 7x) ---------- */
function initEasterEgg() {
  const sun = document.getElementById('hud-sun');
  if (!sun) return;
  sun.addEventListener('click', () => {
    state.easterCount++;
    saveState();
    if (state.easterCount >= 7) {
      state.easterCount = 0;
      saveState();
      openModal('oracle-modal');
      earnBadge('easter');
      addXP(100, '神諭解鎖');
    }
  });
}

/* ---------- Modals ---------- */
function openModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.add('open');
}
function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove('open');
}
function initModals() {
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      const m = btn.closest('.modal-overlay');
      if (m) m.classList.remove('open');
    });
  });
  document.querySelectorAll('.modal-overlay').forEach(m => {
    m.addEventListener('click', e => {
      if (e.target === m) m.classList.remove('open');
    });
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
    }
  });
}

/* ---------- Cube Overlay ---------- */
function initCubeOverlay() {
  const overlay = document.getElementById('cube-overlay');
  if (!overlay) return;
  setTimeout(() => overlay.classList.add('hide'), 3000);
  overlay.addEventListener('click', () => overlay.classList.add('hide'));
}

/* ---------- Particles ---------- */
function initParticles() {
  const container = document.getElementById('hero-particles');
  if (!container) return;
  const count = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 40;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.cssText = `
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      --dx: ${(Math.random() - 0.5) * 80}px;
      animation-duration: ${6 + Math.random() * 10}s;
      animation-delay: ${Math.random() * 8}s;
      opacity: 0;
      width: ${1 + Math.random() * 2}px;
      height: ${1 + Math.random() * 2}px;
    `;
    container.appendChild(p);
  }
}

/* ---------- Share Card ---------- */
function generateShareCard() {
  const preview = document.getElementById('share-canvas-preview');
  const btn = document.getElementById('share-download-btn');
  if (!preview) return;

  // html2canvas fallback if not loaded
  if (typeof html2canvas === 'undefined') {
    alert('html2canvas 尚未載入，請確認網路連線後重試。');
    return;
  }

  const cardEl = document.getElementById('share-card-template');
  if (!cardEl) return;

  // Update card data
  const lvl = getCurrentLevel();
  const levelData = XP_LEVELS[lvl];
  const cardLevel = cardEl.querySelector('#card-level');
  const cardXP    = cardEl.querySelector('#card-xp');
  const cardBadge = cardEl.querySelector('#card-badges');
  if (cardLevel) cardLevel.textContent = levelData.name;
  if (cardXP)    cardXP.textContent    = state.xp + ' XP';
  if (cardBadge) cardBadge.textContent = state.badges.length + '/69 徽章';

  cardEl.style.display = 'block';
  html2canvas(cardEl, { scale: 2, useCORS: true, backgroundColor: null }).then(canvas => {
    cardEl.style.display = 'none';
    preview.src = canvas.toDataURL('image/png');
    preview.style.display = 'block';
    if (btn) {
      btn.onclick = () => {
        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/png');
        a.download = 'sun-hero-card.png';
        a.click();
      };
    }
  }).catch(() => { cardEl.style.display = 'none'; });
}

/* ---------- Keyboard Navigation ---------- */
function initKeyboard() {
  const sections = Array.from(document.querySelectorAll('section[id]'));
  document.addEventListener('keydown', e => {
    const num = parseInt(e.key);
    if (!isNaN(num) && num >= 1 && num <= 9 && sections[num - 1]) {
      sections[num - 1].scrollIntoView({ behavior: 'smooth' });
    }
  });
}

/* ---------- Leaderboard (local mock) ---------- */
function renderLeaderboard() {
  const tbody = document.getElementById('lb-tbody');
  if (!tbody) return;
  const myTime = state.studytime;
  const myMins = Math.floor(myTime / 60);

  const mock = [
    { name: '♌ 太陽獅子王',   mins: 142 },
    { name: '♈ 火焰先鋒者',   mins: 98  },
    { name: '♐ 自由射手',     mins: 87  },
    { name: '你 (本機記錄)',   mins: myMins, me: true },
    { name: '♊ 雙子探索家',   mins: 61  },
    { name: '♑ 山峰登頂者',   mins: 45  },
  ];
  mock.sort((a, b) => b.mins - a.mins);
  const maxMins = mock[0].mins;

  tbody.innerHTML = mock.map((row, i) => `
    <div class="lb-row${row.me ? ' me' : ''}">
      <div class="lb-rank">${i + 1}</div>
      <div class="lb-name">${row.name}</div>
      <div class="lb-bar-wrap"><div class="lb-bar" style="width:${Math.round(row.mins/maxMins*100)}%"></div></div>
      <div class="lb-hours">${row.mins}分鐘</div>
    </div>
  `).join('');
}

/* ---------- Boot ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initState();
  updateHUD();
  initDailyQuest();
  initCubeOverlay();
  initParticles();
  drawRadar();
  initScrollReveal();
  initNavDots();
  initHouseBadges();
  initSignBadges();
  initAspectMatrix();
  initEasterEgg();
  initModals();
  initKeyboard();
  renderLeaderboard();

  // Gacha button
  const gachaBtn = document.getElementById('gacha-btn');
  if (gachaBtn) gachaBtn.addEventListener('click', doGacha);

  // Share button
  const shareBtn = document.getElementById('share-gen-btn');
  if (shareBtn) shareBtn.addEventListener('click', generateShareCard);
});

// expose for inline handlers
window.closeModal = closeModal;
window.openModal  = openModal;
