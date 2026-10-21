# SUNO音楽プロンプト - 帰り道ヒーロー

## 説明
- 全8曲（7ステージ + 1ボス戦共通）
- 8bit風の控えめなBGM
- うるさくない、雰囲気重視
- ループ可能な楽曲

---

## ステージ1: 小学生

**ファイル名**: `stage1_elementary_school.mp3`

**プロンプト**:
```
8bit game music, nostalgic childhood theme, gentle chiptune melody, peaceful schoolyard atmosphere, simple happy tune, soft synth sounds, calm background, lighthearted mood, retro gaming style, cheerful but quiet, loop-friendly, around 2-3 minutes
```

**日本語説明**:
- 8bitゲーム音楽、ノスタルジックな子供時代のテーマ
- 優しいチップチューン、平和な校庭の雰囲気
- シンプルで明るいメロディ、控えめなシンセサウンド
- 明るいが静か、ループ可能

---

## ステージ2: 中学生

**ファイル名**: `stage2_junior_high.mp3`

**プロンプト**:
```
8bit game music, coming of age theme, slightly melancholic chiptune, nostalgic school days, gentle rhythm, soft synth melody, contemplative mood, retro gaming style, quiet and atmospheric, loop-friendly, around 2-3 minutes
```

**日本語説明**:
- 8bitゲーム音楽、成長のテーマ
- 少しメランコリックなチップチウン、ノスタルジックな学校時代
- 優しいリズム、控えめなシンセメロディ
- 物思いにふけるようなムード、静かで雰囲気重視

---

## ステージ3: 高校生

**ファイル2**: `stage3_high_school.mp3`

**プロンプト**:
```
8bit game music, urban night theme, mysterious chiptune, city streets atmosphere, slightly dark but calm, soft synth sounds, contemplative melody, retro gaming style, quiet background music, loop-friendly, around 2-3 minutes
```

**日本語説明**:
- 8bitゲーム音楽、都市の夜のテーマ
- ミステリアスなチップチューン、街の雰囲気
- 少し暗いが落ち着いた感じ、控えめなシンセサウンド
- 物思いにふけるメロディ、静かなBGM

---

## ステージ4: 大学生

**ファイル名**: `stage4_university.mp3`

**プロンプト**:
```
8bit game music, intellectual academic theme, sophisticated chiptune, library study atmosphere, gentle piano-like synth, calm scholarly mood, retro gaming style, quiet and elegant, loop-friendly, around 2-3 minutes
```

**日本語説明**:
- 8bitゲーム音楽、知的な学術テーマ
- 洗練されたチップチューン、図書館の学習雰囲気
- 優しいピアノ風シンセ、落ち着いた学問的なムード
- 静かで上品、ループ可能

---

## ステージ5: 新社会人

**ファイル名**: `stage5_new_employee.mp3`

**プロンプト**:
```
8bit game music, corporate office theme, tense but calm chiptune, working atmosphere, subtle tension, soft synth melody, contemplative mood, retro gaming style, quiet background, loop-friendly, around 2-3 minutes
```

**日本語説明**:
- 8bitゲーム音楽、企業オフィスのテーマ
- 緊張感があるが落ち着いたチップチューン、仕事の雰囲気
- 微妙な緊張感、控えめなシンセメロディ
- 物思いにふけるムード、静かなBGM

---

## ステージ6: サラリーマン

**ファイル名**: `stage6_salaryman.mp3`

**プロンプト**:
```
8bit game music, urban nightlife theme, neon city atmosphere, slightly melancholic chiptune, late night streets, soft synth sounds, contemplative mood, retro gaming style, quiet and atmospheric, loop-friendly, around 2-3 minutes
```

**日本語説明**:
- 8bitゲーム音楽、都市の夜の生活テーマ
- ネオン街の雰囲気、少しメランコリックなチップチューン
- 深夜の街、控えめなシンセサウンド
- 物思いにふけるムード、静かで雰囲気重視

---

## ステージ7: 勇者

**ファイル名**: `stage7_hero.mp3`

**プロンプト**:
```
8bit game music, fantasy adventure theme, epic but quiet chiptune, mysterious castle atmosphere, heroic melody, soft synth sounds, contemplative epic mood, retro gaming style, quiet and atmospheric, loop-friendly, around 2-3 minutes
```

**日本語説明**:
- 8bitゲーム音楽、ファンタジー冒険テーマ
- 壮大だが静かなチップチューン、神秘的な城の雰囲気
- 英雄的なメロディ、控えめなシンセサウンド
- 物思いにふける壮大なムード、静かで雰囲気重視

---

## ボス戦（全ステージ共通）

**ファイル名**: `boss_battle.mp3`

**プロンプト**:
```
8bit game music, boss battle theme, tense but not overwhelming chiptune, dramatic melody, subtle urgency, soft synth sounds, action but quiet, retro gaming style, loop-friendly, around 2-3 minutes, keep volume low
```

**日本語説明**:
- 8bitゲーム音楽、ボス戦テーマ
- 緊張感があるが圧倒的ではないチップチューン
- ドラマチックなメロディ、微妙な緊迫感
- 控えめなシンセサウンド、アクション感はあるが静か
- 音量を低く保つ、ループ可能

---

## 実装時の注意点

1. **音量バランス**: 全ての楽曲は控えめな音量で、ゲーム効果音を邪魔しないようにする
2. **ループ**: 全ての楽曲はシームレスにループできるように作成
3. **長さ**: 各楽曲は2-3分程度で、ループ時の自然さを重視
4. **統一感**: 8bitスタイルで統一しつつ、各ステージの雰囲気を反映
5. **控えめさ**: 「うるさいのはいや」という要望に応え、BGMとして控えめに

---

## HTML実装例

```html
<audio id="bgm-stage1" loop>
  <source src="music/stage1_elementary_school.mp3" type="audio/mpeg">
</audio>
<audio id="bgm-stage2" loop>
  <source src="music/stage2_junior_high.mp3" type="audio/mpeg">
</audio>
<audio id="bgm-stage3" loop>
  <source src="music/stage3_high_school.mp3" type="audio/mpeg">
</audio>
<audio id="bgm-stage4" loop>
  <source src="music/stage4_university.mp3" type="audio/mpeg">
</audio>
<audio id="bgm-stage5" loop>
  <source src="music/stage5_new_employee.mp3" type="audio/mpeg">
</audio>
<audio id="bgm-stage6" loop>
  <source src="music/stage6_salaryman.mp3" type="audio/mpeg">
</audio>
<audio id="bgm-stage7" loop>
  <source src="music/stage7_hero.mp3" type="audio/mpeg">
</audio>
<audio id="bgm-boss" loop>
  <source src="music/boss_battle.mp3" type="audio/mpeg">
</audio>

<script>
// 音楽再生関数
let currentBGM = null;

function playBGM(stageNum, isBoss = false) {
  // 現在のBGMを停止
  if (currentBGM) {
    currentBGM.pause();
    currentBGM.currentTime = 0;
  }
  
  // 新しいBGMを再生
  if (isBoss) {
    currentBGM = document.getElementById('bgm-boss');
  } else {
    currentBGM = document.getElementById(`bgm-stage${stageNum}`);
  }
  
  if (currentBGM) {
    currentBGM.volume = 0.3; // 音量を30%に設定（控えめに）
    currentBGM.play().catch(e => console.log('BGM再生エラー:', e));
  }
}

// ボス戦開始時に呼ぶ
function startBossBattle() {
  playBGM(gameState.stage, true);
}

// ステージ開始時に呼ぶ
function startStage(stageNum) {
  playBGM(stageNum, false);
}
</script>
```

---

## SUNO生成時のコツ

1. **「quiet」や「soft」などのキーワード**を必ず含める
2. **「not overwhelming」「keep volume low」**などの指示を追加
3. **「loop-friendly」**を指定して、ループ時の自然さを重視
4. 必要に応じて **「re-roll」** して、より控えめなバージョンを探す
5. 生成後、実際にゲーム内で音量を調整して確認

---

生成日: 2025-01-XX

