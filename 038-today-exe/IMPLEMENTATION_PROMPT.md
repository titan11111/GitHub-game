# TODAY.exe フェーズ1：棒人間アニメーション実装プロンプト

## ゲーム概要
- **名称**: TODAY.exe（DAY 038）
- **ジャンル**: 1日シミュレーション / 3択バランスゲーム
- **プラットフォーム**: GitHub Pages / iPhone Safari
- **現状コード**: `/Users/gosho/Desktop/GitHub-game/038-today-exe/`
  - `index.html` (1083行) ← **ここを編集**
  - `style.css` (460行)
  - `audio.js`

---

## 実装目標（フェーズ1）

**選択肢を選んだ直後に、その選択に応じた「棒人間のアニメーション」を 0.8秒間表示する。**

現状：
```
選択肢「資料作成」をタップ
  ↓
数値が変わる（HP -10, MP -20, WORK +22）
```

改善後：
```
選択肢「資料作成」をタップ
  ↓
[0.8秒] 棒人間がキーボードをたたく「カタカタ」アニメーション表示
  ↓
数値が変わる + 結果テキスト表示
```

---

## 実装範囲（フェーズ1）

**対象: 仕事系5種類**

| 行動ID | 行動名 | アニメーション |
|---|---|---|
| `mail` | メール処理 | 棒人間がキーボード「カタカタ」（横方向手が動く） |
| `doc` | 資料作成 | 棒人間がキーボード「カタカタカタ」（肩が上下） |
| `idea` | アイデアを考える | 棒人間が頭を抱えて「ウーン」（頭周りに？） |
| `task` | 雑務を片付ける | 棒人間がリスト「✓✓✓」（チェック動作） |
| `meet` | 打ち合わせ | 2つの棒人間が吹き出し「〜〜」（対話） |

---

## 技術仕様

### 実装方式
- **フレームワーク**: vanilla JavaScript + CSS animations
- **ビジュアル**: ASCII / Unicode / Emoji（テキストベース）
- **アニメーション時間**: 0.8秒固定
- **表示位置**: 結果テキスト上部、メッセージボックス内に統合

### HTML 構造変更

**現在のフロー:**
```javascript
// index.html 内、choose(i) 関数
function choose(i){
  // ... 選択肢取得 ...
  applyChoice(c);       // ← 数値計算
  renderPlay();         // ← 即座に結果描画
}
```

**変更後のフロー:**
```javascript
function choose(i){
  // ... 選択肢取得 ...
  applyChoice(c);                    // ← 数値計算
  showStickAnimation(c.id);          // ← 【新規】アニメーション表示（0.8秒）
  setTimeout(() => renderPlay(), 800); // ← 0.8秒後に結果表示
}
```

### 実装パターン（CSS animation）

```css
/* 基本形：キーボード入力 */
@keyframes type-hands {
  0%   { transform: scaleX(1); }
  50%  { transform: scaleX(1.2); }
  100% { transform: scaleX(1); }
}

.anim-typing {
  animation: type-hands 0.8s ease-in-out;
}

/* 例：資料作成（肩が上下） */
@keyframes doc-shoulders {
  0%   { transform: translateY(0); }
  25%  { transform: translateY(-2px); }
  75%  { transform: translateY(-2px); }
  100% { transform: translateY(0); }
}
```

---

## コード実装仕様

### 1. HTML 内に、各アニメーション用の HTML 要素を定義

**`renderPlay()` 関数内、結果テキスト表示前に以下を追加:**

```html
<!-- メッセージボックスの直前に挿入 -->
<div class="stick-animation" id="stickAnim">
  <!-- アニメーション内容が動的に挿入される -->
</div>
```

### 2. JavaScript に、`showStickAnimation()` 関数を追加

**仕様:**

```javascript
function showStickAnimation(actionId) {
  var animDiv = document.getElementById("stickAnim");
  
  var templates = {
    mail:  { html: "[👆] ← 📧 → カタ..カタ", class: "anim-typing" },
    doc:   { html: "🧔 ↓↑ カタカタカタ", class: "anim-typing-heavy" },
    idea:  { html: "🧔 ｦｰﾝ\n  ? ? ?", class: "anim-thinking" },
    task:  { html: "✓ ✓ ✓\n[▢▢▢]", class: "anim-checking" },
    meet:  { html: "🧔 ← ？？？ → 🧔", class: "anim-talking" }
  };
  
  var template = templates[actionId];
  if(!template) return;
  
  animDiv.innerHTML = '<pre class="stick '+template.class+'">'+template.html+'</pre>';
  animDiv.style.display = "block";
  
  // 0.8秒後に非表示
  setTimeout(function(){
    animDiv.style.display = "none";
  }, 800);
}
```

### 3. CSS に、5つのアニメーションクラスを追加

```css
/* ============================================
   Stick Figure Animations (Phase 1)
============================================ */

.stick-animation {
  text-align: center;
  font-family: monospace;
  margin: 10px 0;
  min-height: 60px;
  display: none;
  color: #00f0ff;
  font-size: 14px;
  line-height: 1.4;
}

.stick {
  white-space: pre;
  display: inline-block;
  animation-duration: 0.8s;
  animation-timing-function: ease-in-out;
  animation-iteration-count: 1;
  animation-fill-mode: both;
}

/* メール処理：手が左右に動く */
.anim-typing {
  animation-name: typing-hands;
}

@keyframes typing-hands {
  0%   { opacity: 1; }
  20%  { opacity: 1; transform: scaleX(0.95); }
  50%  { opacity: 1; transform: scaleX(1.05); }
  80%  { opacity: 1; transform: scaleX(0.95); }
  100% { opacity: 1; }
}

/* 資料作成：もっと激しいタイピング */
.anim-typing-heavy {
  animation-name: typing-heavy;
}

@keyframes typing-heavy {
  0%   { opacity: 1; transform: translateY(0); }
  15%  { opacity: 1; transform: translateY(-3px); }
  30%  { opacity: 1; transform: translateY(0); }
  45%  { opacity: 1; transform: translateY(-3px); }
  60%  { opacity: 1; transform: translateY(0); }
  75%  { opacity: 1; transform: translateY(-3px); }
  100% { opacity: 1; transform: translateY(0); }
}

/* アイデア出し：頭を抱える → はてなマーク */
.anim-thinking {
  animation-name: thinking-pulse;
}

@keyframes thinking-pulse {
  0%   { opacity: 0.7; }
  50%  { opacity: 1; }
  100% { opacity: 0.7; }
}

/* タスク処理：チェックマークが連続 */
.anim-checking {
  animation-name: checking-marks;
}

@keyframes checking-marks {
  0%   { opacity: 0; transform: scale(0.8); }
  25%  { opacity: 1; transform: scale(1); }
  50%  { opacity: 1; transform: scale(1); }
  75%  { opacity: 0.5; transform: scale(0.9); }
  100% { opacity: 0; }
}

/* 打ち合わせ：2つの棒人間が会話 */
.anim-talking {
  animation-name: talking-wave;
}

@keyframes talking-wave {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.1); }
  100% { transform: scale(1); }
}
```

---

## 実装手順（順序重要）

### Step 1: HTML 構造に `.stick-animation` div を追加
**ファイル**: `index.html`  
**場所**: `renderPlay()` 関数内、`.msgbox` の手前  
**変更**: 1～2行追加

### Step 2: `renderPlay()` の `choose()` 呼び出し関数を修正
**ファイル**: `index.html`  
**変更**: `choose()` 内の `renderPlay()` を `setTimeout()` でラップ

### Step 3: `showStickAnimation()` 関数を追加
**ファイル**: `index.html`  
**場所**: グローバルスコープ（`choose()` 関数の直前など）  
**行数**: 25行程度

### Step 4: CSS animations を追加
**ファイル**: `style.css`  
**場所**: 末尾（`.msgbox` の後）  
**行数**: 70行程度

---

## テスト項目（実装完了後）

### 動作テスト
- [ ] ゲーム開始 → タイトル表示（OK）
- [ ] 「1日をはじめる」をクリック → ゲーム開始（OK）
- [ ] 選択肢「メール処理」をクリック → 0.8秒間アニメーション表示 → 結果表示（OK）
- [ ] 選択肢「資料作成」をクリック → 0.8秒間アニメーション表示（肩が上下） → 結果表示（OK）
- [ ] 選択肢「アイデア」をクリック → はてなマーク点滅 → 結果表示（OK）
- [ ] 選択肢「雑務」をクリック → チェックマーク連続 → 結果表示（OK）
- [ ] 選択肢「打ち合わせ」をクリック → 2棒人間会話 → 結果表示（OK）

### UI テスト
- [ ] アニメーション中、下層テキストが見えない（重なりあり / 正常）
- [ ] アニメーション終了後、スムーズに結果テキストへ切り替わる（OK）
- [ ] iPhone Safari 縦画面で、アニメーションが画面内に納まる（OK）

### データテスト
- [ ] 選択肢の数値変化（HP/MP/WORK/SAT）が正しく計算される（OK）
- [ ] リザルト画面で正しいスコアが表示される（OK）

---

## 検証コマンド

```bash
# ローカルで実行
cd /Users/gosho/Desktop/GitHub-game/038-today-exe
open index.html

# または
python -m http.server 8000
# → http://localhost:8000/038-today-exe/index.html
```

---

## 制約・注意点

1. **20MB 鉄則を超えない**（現状 9.5MB、余裕あり）
2. **外部 CDN 不使用**（CSS animations はネイティブ）
3. **iOS 自動再生禁止への対応**（既存 audio.js で対応済み、変更不要）
4. **アニメーション時間は 0.8秒固定**（選択肢が高速な為、長すぎるとストレス）
5. **テキストと数値は絶対に画像に置き換えない**（IMAGE_SPEC.md 要件）

---

## 完成時の確認事項

実装後、以下を確認して「OK」をもらう：

```markdown
## ✅ フェーズ1 実装完了チェック

- [ ] 仕事系5種すべてにアニメーション実装
- [ ] CSS animations で軽量実装（外部ライブラリ不使用）
- [ ] 0.8秒後に自動的に結果表示へ遷移
- [ ] iPhone Safari で正常動作確認
- [ ] 20MB 鉄則を超えていない
- [ ] ゲーム性に悪影響なし（テンポ・爽快感維持）

実装ファイル：
- `index.html` ← 修正
- `style.css` ← 追記
- その他変更なし
```

---

## フェーズ2 への展開（参考）

フェーズ1 が完了したら、同じパターンで：
- **フェーズ2**: 休憩系5種（散歩・昼寝・コーヒー・ストレッチ・SNS）
- **フェーズ3**: イベント選択肢のアニメーション化（12種）

---

## 質問・判断が必要な場合

以下の場合は、**実装前に確認**してください：

1. **アニメーション内容の解釈に曖昧さがある場合**
   - 例：「打ち合わせの棒人間会話」のビジュアルが不明確
   - → 実装前にスクリーンショット案を提示してもらう

2. **パフォーマンスに不安がある場合**
   - 例：CSS animations で 0.8秒× 5種類を同時に多くプレイした場合
   - → ブラウザの DevTools で 60fps 維持を確認

3. **既存コードとの干渉がある場合**
   - 例：`renderPlay()` の流れが複雑
   - → 既存ロジックを尊重した実装に修正

---

**このプロンプトで、他の AI に実装指示ができます。**  
質問・修正があれば、このファイルを更新して指示し直してください。
