# 俄羅斯方塊遊戲實作計畫

這個計畫旨在建立一個基於純 HTML、CSS 和 JavaScript 的俄羅斯方塊網頁遊戲，完全符合您的所有需求。

## 遊戲功能與特色
1. **純 HTML/CSS/JS 實作**：無需使用任何前端框架，確保程式碼輕量且易於執行。
2. **控制方式**：
   - `左箭頭 (Left Arrow)`：向左移動
   - `右箭頭 (Right Arrow)`：向右移動
   - `下箭頭 (Down Arrow)`：軟下落 (加速下落)
   - `上箭頭 (Up Arrow)` / `X 鍵`：順時針旋轉 (右旋轉)
   - `Z 鍵`：逆時針旋轉 (左旋轉)
   - `空白鍵 (Space)`：硬下落 (直接下落到底部)
3. **動態音效**：使用原生的 **Web Audio API** 產生 8-bit 風格的音效，包含：
   - 移動音效
   - 旋轉音效
   - 硬下落音效
   - 消除方塊音效
   - 遊戲結束音效
4. **豐富的色彩與 UI**：7 種經典 Tetromino 方塊會有各自專屬的顏色。UI 採用現代化的深色主題，配有霓虹發光效果，提升視覺體驗。
5. **預覽面板**：顯示下一個即將出現的方塊。

## User Review Required

> [!IMPORTANT]
> 關於「音效」部分，為了維持「純 HTML」且不需要外部載入資源（避免跨域問題或失效），我計畫使用瀏覽器原生的 **Web Audio API** 以程式碼方式即時合成復古的 8-bit 音效。請問這個做法您是否同意？
> 另外，關於「左右旋轉」，我預設綁定 `Z` (左旋) 和 `X` (右旋) 或 `上箭頭` (右旋)，您是否滿意這組按鍵配置？

## Proposed Changes

### 前端實作

#### [NEW] [index.html](file:///c:/tetris/index.html)
建立遊戲主結構，包含：
- 遊戲畫布 (Canvas 或 DOM 格子)
- 計分板、等級資訊
- 下一個方塊預覽區 (Next Piece)
- 控制說明面板

#### [NEW] [style.css](file:///c:/tetris/style.css)
使用現代網頁設計風格：
- 暖色背景 (如暖橘色、米白色或柔和的暖灰色調)
- 發光的方塊顏色 (Neon Glow 效果)
- 排版置中，響應式適合桌面版遊玩

#### [NEW] [script.js](file:///c:/tetris/script.js)
實作核心遊戲邏輯：
- **Board 管理**：10x20 的網格陣列，處理方塊鎖定與消除判定。
- **Tetromino 定義**：I, J, L, O, S, T, Z 七種方塊的形狀矩陣、顏色配置與旋轉邏輯（包含 Super Rotation System 的基礎實現）。
- **Input 處理**：監聽鍵盤事件 (keydown)。
- **Game Loop**：使用 `requestAnimationFrame` 處理遊戲幀更新與自動下落，並隨等級提升速度。
- **Audio Engine**：封裝 Web Audio API 用於觸發不同的音效頻率與波形。

## Verification Plan

### Manual Verification
1. 使用瀏覽器開啟 `index.html`。
2. 測試左右移動與下落。
3. 測試順時針與逆時針旋轉，確認旋轉邏輯正確（不會穿牆）。
4. 測試空白鍵（直接下落）。
5. 確認音效是否在對應動作時觸發。
6. 確認消行邏輯與計分系統運作正常。
