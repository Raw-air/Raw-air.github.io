# RAW AIR 接案作品集網站

網址：https://raw-air.github.io/

純靜態網站，沒有建置步驟，不需要安裝任何東西。

| 檔案 | 放什麼 |
|---|---|
| `index.html` | **所有文字內容都在這裡**：案例、概念圖、流程、價格、常見問題、全部服務、LINE、QR |
| `css/site.css` | 外觀 |
| `js/ui.js` | 選單、搜尋、常見問題、LINE 面板、複製 ID、需求小球、誠實報價、動態開關 |
| `js/choreography.js` | 每段的配色與形狀尺寸 |
| `js/shapes.js` | 12 個粒子形狀 |
| `js/engine.js` | 粒子繪製、自動降畫質、退場 |
| `fonts/OFL.txt` | 標題字（內嵌在 `index.html`）的授權全文，要跟著字型一起散布 |
| `og.png` | 分享到社群的預覽圖 |

## 常見修改

內容入口從舊版的 JS 設定檔改到 HTML，直接改字就好。

- **改案例、流程、價格、常見問題**：`index.html` 搜尋那段文字直接改。
- **改服務清單**：`index.html` 搜尋 `class="cap"`，每個 `<li>` 是一項。「幾大類、幾項」由頁面自動算，不用改數字。
- **改概念圖的例子**：`index.html` 搜尋 `id="concept"`。按鈕、彩稿 `.mock`、筆記 `.idea-notes` 三者順序要對應。
- **改需求單的文字**：`js/ui.js` 搜尋 `var SAY`、`var INC`、`var NEED`、`var ASK`、`var FACT`（回應句、可能會做的工作、需求小球對應項目、還要問的事、已寫明的承諾）。傳到 LINE 的文字在 `sheetText`，用客人的口吻。題目與選項在 `index.html` 搜尋 `id="quote"`。
- **填報價金額**：`js/ui.js` 搜尋 `var PRICE`，每格填 `[最低, 最高]`（新台幣）。全部空著時，畫面與複製文字都不會出現金額；填了之後，答完題目、對應格子有數字的單子才會多一列「參考金額」。金額只看要做什麼、規模、急不急、做完之後這幾題，不算小球勾了幾顆；規模選很小但勾了兩顆以上系統類小球時不顯示金額。
- **改 LINE**：全站搜尋 `16225113` 一起換，連結與 ID 文字都要換；QR 是 SVG，要重新產生。
- **新增段落**：在 `<section>` 寫 `data-stage`、`data-shape`、`data-world`、`data-d`、`data-m`，段內放 `.slot`，不用改程式。

## 改標題字要注意

標題用的字型只內嵌了目前標題用到的字。**改 `h1`、`h2` 或聊畫做交的字時，新字可能缺字。** 缺的字會閃成系統字，不會變豆腐。

要補字就重新產生子集，把 base64 換進 `index.html` 開頭 `@font-face` 那一行（全檔唯一的長行，不要手改）。

字型是宇文天穹 UoqMunThenKhung，OFL 授權，全文見 `fonts/OFL.txt`。

## 更新上線

```
git add -A
git commit -m "更新內容"
git push
```

GitHub Pages 大約 1 分鐘後生效。換了 `og.png` 時，把 `index.html` 裡 `og.png?v=` 的數字加一。

## 本機預覽

可以直接開 `index.html`，或用任何靜態伺服器。
