# Codex Stellaris · 星盤

西洋占星十大星體互動入口 — 太陽、月亮、水星、金星、火星、木星、土星、天王星、海王星、冥王星。

🌐 **線上：** https://eliajhmauve.github.io/astro-codex-stellaris/

---

## 主要功能

### 🪐 入口頁
- **互動太陽系 SVG** — 10 行星按真實順序排列，hover 看主題、click 跳頁、鍵盤 0-9 快捷
- **本命盤輸入** — 出生日期 / 時間 / 城市三項，缺時間有降級邏輯
- **本命盤輪盤** — SVG 視覺化你的盤（黃道、宮位、行星、相位連線）
- **Big 3 人格三角** — 太陽 / 月亮 / 上升 整合解讀
- **今日行運** — 此刻 10 行星位置 + 對你本命的緊密相位（orb < 3°）
- **未來 7 天日曆** — 重要相位精準時刻提前預告
- **進度標記** — catalog 自動標記已訪問的星體 + 進度條
- **可分享連結** — `?dob=YYYY-MM-DD&time=HH:MM&city=taipei` URL 一鍵分享給朋友
- **PDF 列印** — A4 黑白友善樣式

### 🔮 10 個行星頁
每頁都有：
- 完整 12 宮 + 12 星座 + 45 相位獨立解讀
- 獨特視覺風格（電影級攝影棚打光 × 動態玻璃擬態）
- 獨特遊戲化主題（RPG / 寶可夢圖鑑 / 解謎駭客 / 美學收藏 / 格鬥 / 探險 / 打卡 / 駭客革命 / 夢境 / Soulslike）
- **個人化浮條** — 自動顯示「你的太陽 ♌ 獅子座 8.0° 第 4 宮」+ 跳轉按鈕
- **自動高亮** — 進頁面自動找到「你的星座 / 你的宮位」卡片加金光
- **你的相位網絡** — 把通用 45 相位變成「你實際擁有的 X 個主要相位」清單
- **下一堂課 CTA** — 學完一顆引導下一顆，10/10 完成回入口

### 📱 PWA 支援
- 可加到手機桌面當 App 用
- Service Worker 離線快取
- OG meta 社群分享美觀

---

## Tech Stack

純前端，無 build step，無後端：

| 領域 | 工具 |
|------|------|
| 算盤 | [Astronomy Engine](https://github.com/cosinekitty/astronomy) (MIT) |
| 圖像 | OpenAI Codex CLI + gpt-image-2 |
| 字體 | Google Fonts (Cinzel / Cormorant / Major Mono / VT323…) |
| 截圖 | html2canvas |
| 部署 | GitHub Pages |

---

## 檔案結構

```
.
├── index.html              入口 (Codex Stellaris)
├── chart.js                Astronomy Engine 算盤邏輯
├── natal-wheel.js          SVG 本命盤輪盤元件
├── transit.js              今日 + 未來 7 天行運
├── big3-content.js         Big 3 12 星座文案
├── natal-overlay.js        行星頁個人化浮條 + 相位網絡 + 下一課
├── manifest.json           PWA manifest
├── sw.js                   Service Worker
├── icon-192.svg / icon-512.svg
├── sun/                    太陽 · 英雄之旅 RPG
├── moon/                   月亮 · 情緒寶可夢圖鑑
├── mercury/                水星 · 解謎駭客
├── venus/                  金星 · 美學收藏家
├── mars/                   火星 · 格鬥競技場
├── jupiter/                木星 · 寶藏獵人探險
├── saturn/                 土星 · 修行打卡
├── uranus/                 天王星 · 駭客革命
├── neptune/                海王星 · 夢境迷霧
└── pluto/                  冥王星 · Soulslike 蛻變
```

---

## 本地開發

```bash
# 不需要 build，直接打開
start index.html

# 或起一個簡易 server（避免 file:// 限制）
python -m http.server 8000
# → http://localhost:8000
```

---

## 開發里程碑

| 版本 | 日期 | 內容 |
|------|------|------|
| v1.0 | 2026-04-25 | 10 行星基礎頁 + 入口 SVG 太陽系 + 50 張 codex 產圖 |
| v1.1 | 2026-04-27 | 注入 v2 視覺增強層（10 種獨特光感系統） |
| v2.0 | 2026-04-29 | Astronomy Engine 算盤 + 個人化浮條 + 自動高亮 |
| v2.1 | 2026-04-30 | SVG 輪盤 + Big 3 + 今日行運 + 未來 7 天 + PWA + 分享連結 |

---

## License

MIT — 自用、學習、改造請隨意。
