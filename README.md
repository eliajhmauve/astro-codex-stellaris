# Codex Stellaris · 星盤

西洋占星十大星體完整互動 App — 太陽、月亮、水星、金星、火星、木星、土星、天王星、海王星、冥王星。

🌐 **線上：** https://eliajhmauve.github.io/astro-codex-stellaris/

從一個閱讀網站演化成完整功能的占星 App：算盤、合盤、行運、年盤、月相、里程碑、輪盤、海報、印章、塔羅、PWA。

---

## 入口頁功能

### 🔮 本命盤輸入與計算
- **三項輸入**：出生日期 / 時間 / 城市（18 個亞洲+國際主要城市）
- **降級邏輯**：缺時間 → 太陽盤模式（不顯示宮位上升）；缺地點 → 預設台北
- **算盤引擎**：[Astronomy Engine](https://github.com/cosinekitty/astronomy)（NASA 級精度）
- **宮位系統**：Whole Sign（整宮制）
- **逆行偵測**：自動標記 ℞
- **4 個名人示範盤**：賈伯斯 / 泰勒絲 / 歐巴馬 / 愛因斯坦 一鍵載入

### 📜 個人化解讀（按出現順序）
1. **今日 vibe 卡** — 月亮位置決定今日心情/適合/避免 + 逆行警示
2. **每日塔羅** — 22 張大阿爾克那 + 日期 hash + 正/逆位
3. **5 字本命印章** — 紅色刻章，太陽月亮上升 + 主導元素 + 模式
4. **詩意自介信** — 太陽開場 + 太陽月亮元素融合 + 上升面具差異 + 缺口提醒
5. **Big 3 人格三角** — 太陽 / 月亮 / 上升 12×3 段文案
6. **元素 / 模式平衡度** — 火土風水 + 開創固定變動，主導 / 缺口診斷
7. **SVG 雙圈本命盤輪盤** — 黃道 + 12 宮 + 行星 + 相位連線 + 外圈疊加今日行運
8. **10 行星位置** — 含逆行 ℞ 標記 + 宮位 + 跳轉箭頭
9. **上升 / 12 宮** — Whole Sign 系統
10. **主要相位完整列表**
11. **占星快問快答** — 8 題個人化 FAQ accordion

### 🌟 行運與時間
12. **今日行運** — 此刻 10 行星 + 對你本命的緊密相位（orb < 3°）
13. **未來 7 天日曆** — 精準相位提前預告（orb < 1.5°）
14. **太陽回歸（年盤）** — 下次生日當天的盤 + 對本命最強 5 個相位
15. **本月月相日曆** — 30 天月亮位置 + 月相階段（新月/眉月/上弦/盈凸/滿月/虧凸/下弦/殘月）+ 進入新星座當天高亮
16. **生命週期里程碑** — 土星回歸、中年危機、深度蛻變期等 12+ 占星人生大事件

### 🛠 工具與動作
- **EDIT_INPUT** — 修改本命盤輸入
- **COPY_SHARE_LINK** — 複製 URL（`?dob=...&time=...&city=...` 格式，朋友打開直接看你的盤）
- **PRINT** — 列印友善樣式（A4 黑白）
- **COMPARE_PERSON** — 合盤（Synastry）100 組交叉相位 + 最強連結診斷
- **DOWNLOAD_POSTER** — 1080×1920 IG 限動 PNG（Big 3 + 元素平衡 + 10 行星表）
- **EXPORT_JSON / IMPORT_JSON** — 備份/還原盤
- **REPLAY_TOUR** — 重看 onboarding 引導
- **CLEAR** — 清除盤資料

### 🎨 入口頁互動
- **互動 SVG 太陽系** — 10 行星 hover/click/鍵盤 0-9
- **黃道環高亮** — 你的太陽/月亮/上升位置金光閃爍 + 標記
- **catalog** — 10 行星卡（已訪問 ✓ + 進度條）
- **首次訪問 Onboarding** — 4 步聚光燈引導
- **占星詞彙表** — 20 個術語白話解釋（右下角 ? FAB）

---

## 行星頁功能

每頁 12 宮 + 12 星座 + 45 相位獨立解讀，加上：

- **個人化浮條** — 自動顯示「你的 ☉ 太陽 ♌ 獅子座 8.0° 第 4 宮」+ 跳轉按鈕 + 上一/下一星
- **自動高亮** — 進頁面找到「你的星座 + 你的宮位」卡片加金光 + ★ YOUR CHART
- **今日影響卡** — 今日該行星 vs 你本命該行星的相位 + 同星座加成
- **你的相位網絡** — 把通用 45 相位變成「你實際擁有的 X 個主要相位」清單
- **下一堂課 CTA** — 學完一顆引導下一顆，10/10 完成觸發證書
- **完成證書 modal** — 80 片彩色 confetti + 旋轉印章
- **鍵盤導航** — ← / → 切換行星 / Esc 回入口

---

## PWA / SEO

- **manifest.json** — 可加到手機桌面
- **Service Worker** — 離線快取
- **OG meta tags** — Facebook / Twitter / Threads 分享預覽
- **sitemap.xml + robots.txt**
- **雙 SVG icon**（192/512）

---

## Tech Stack

純前端，無 build step，無後端：

| 領域 | 工具 |
|------|------|
| 算盤 | [Astronomy Engine](https://github.com/cosinekitty/astronomy) (MIT) |
| 圖像 | OpenAI Codex CLI + gpt-image-2 |
| 字體 | Google Fonts（Cinzel / Cormorant / Major Mono / VT323 / Noto Serif TC...）|
| 截圖 | html2canvas |
| 部署 | GitHub Pages |

---

## 檔案結構

```
.
├── index.html              入口（Codex Stellaris）
├── chart.js                Astronomy Engine 算盤 + 合盤
├── natal-wheel.js          SVG 雙圈本命盤輪盤
├── transit.js              今日 / 未來 7 天 / 太陽回歸 / 月相日曆 / 里程碑
├── big3-content.js         Big 3 12 星座文案
├── daily-tip.js            今日 vibe 月亮位置建議
├── poetic-intro.js         詩意本命自介信生成器
├── tarot.js                每日塔羅 22 張大阿爾克那
├── natal-overlay.js        行星頁個人化浮條 + 影響卡 + 完成證書
├── manifest.json / sw.js   PWA
├── icon-192.svg / icon-512.svg
├── sitemap.xml / robots.txt
├── LICENSE / CHANGELOG.md
└── sun/ moon/ mercury/ venus/ mars/ jupiter/ saturn/ uranus/ neptune/ pluto/
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

## 版本歷史

詳見 [CHANGELOG.md](./CHANGELOG.md)。

| 版本 | 日期 | 重點 |
|------|------|------|
| v2.5 | 2026-04-30 | 月相階段 + 詩意自介 + LICENSE |
| v2.4 | 2026-04-30 | 黃道高亮 + 太陽回歸 + 月相日曆 + 行星頁影響卡 + 完成證書 + 5 字印章 |
| v2.3 | 2026-04-30 | 逆行 + 雙圈輪盤 + 今日 vibe + 海報下載 + 快問快答 |
| v2.2 | 2026-04-30 | 合盤 + 里程碑 + Onboarding + 詞彙表 + JSON 備份 + sitemap |
| v2.1 | 2026-04-30 | SVG 輪盤 + Big 3 + 今日行運 + 7 天 forecast + PWA + 分享連結 |
| v2.0 | 2026-04-29 | Astronomy Engine 算盤 + 個人化浮條 |
| v1.1 | 2026-04-27 | v2 視覺增強層（10 種光感系統） |
| v1.0 | 2026-04-25 | 10 行星基礎頁 + 50 張 Codex 產圖 |

---

## License

MIT — 詳見 [LICENSE](./LICENSE)
