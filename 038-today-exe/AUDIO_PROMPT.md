# TODAY.exe — 音楽・SEプロンプト集（DAY 038）

Suno / Udio / MusicGen などにそのまま貼れる形式。
世界観：**Windows 95 × サイバーパンク × レトロPC**、テーマは「1日を攻略する。でも頑張りすぎてもいけない」。

ファイルは `038-today-exe/assets/audio/` に置く想定。

---

## 1. TITLE BGM — `bgm_title.mp3`（ループ 40〜60秒）

**Style / Genre**
```
retro PC boot-up ambient, lo-fi chiptune, cyberpunk synthwave, 80s Japanese city pop chords, calm
```

**Prompt（英語・そのまま貼る）**
```
A calm loopable intro theme for a retro PC desktop game. Warm analog pad opening like an old computer booting,
soft FM electric piano, gentle chiptune arpeggio in the background, slow tempo 78 BPM,
minor 9th chords with a hopeful lift at the end. Nostalgic, quiet, slightly melancholic but inviting.
No drums for the first 8 bars, then a soft brushed lo-fi beat. Seamless loop. Instrumental only.
```

**Negative prompt**
```
vocals, heavy drums, distorted guitar, aggressive, EDM drop, loud
```

---

## 2. MAIN BGM（昼の時間帯 07:00〜17:00）— `bgm_day.mp3`（ループ 60〜90秒）

**Prompt**
```
A loopable background track for a workday simulation game. Mid-tempo 92 BPM lo-fi chillhop with chiptune lead,
mellow Rhodes chords, soft vinyl crackle, light hi-hat shuffle, subtle 8-bit blips like keyboard typing.
Neutral and steady — neither stressful nor sleepy, something you can listen to for ten minutes.
Seamless loop, instrumental only.
```

**Negative prompt**
```
vocals, tension, dramatic build, orchestral hits, silence
```

---

## 3. NIGHT BGM（20:00以降）— `bgm_night.mp3`（ループ 60秒）

**Prompt**
```
A loopable late-night theme for a retro computer game. 70 BPM downtempo synthwave, deep warm bass,
distant reverbed synth pad, sparse chiptune melody, faint rain-like noise texture.
Feeling of a room lit only by a monitor at 10pm — tired but calm. Seamless loop, instrumental only.
```

**Negative prompt**
```
vocals, bright, energetic, fast drums
```

---

## 4. OVERWORK 状態BGM（差し替え用・任意）— `bgm_overwork.mp3`（ループ 30秒）

**Prompt**
```
A tense loopable layer for an overwork state in a game. 100 BPM, detuned synth pulse, low sub drone,
irregular ticking clock percussion, slightly out-of-tune chiptune arpeggio creating unease.
Not scary, just uncomfortable — the sound of pushing too hard. Seamless loop, instrumental only.
```

**Negative prompt**
```
horror, screaming, melody, vocals
```

---

## 5. RESULT BGM — `bgm_result.mp3`（ループ 45秒）

**Prompt**
```
A gentle end-of-day result theme for a retro game. 80 BPM, warm synth pad, soft chiptune bell melody,
resolving major 7th progression, a feeling of "today is over and that's fine".
Nostalgic, warm, a little proud. Seamless loop, instrumental only.
```

---

## 6. 効果音（SE）一覧

音源は Freesound / 自作（BFXR・jsfxr）推奨。8bit寄りの短音で統一する。

| ファイル名 | 用途 | プロンプト / 生成設定 |
|---|---|---|
| `se_click.wav` | 選択肢タップ | `short 8-bit UI click, 60ms, square wave, dry, no reverb` |
| `se_select.wav` | 決定 | `retro computer confirm beep, two ascending square notes, 120ms` |
| `se_time.wav` | 時間経過 | `soft analog clock tick with tape hiss, 200ms` |
| `se_work.wav` | 成果+ | `mechanical keyboard typing burst, 400ms, lo-fi` |
| `se_rest.wav` | 休憩・回復 | `warm soft chime, single bell, gentle release, 700ms` |
| `se_recovery.wav` | RECOVERY BONUS | `bright rising 8-bit arpeggio, 4 notes, major, 500ms` |
| `se_overwork.wav` | OVERWORK発生 | `low distorted buzz with descending pitch, warning tone, 600ms` |
| `se_event.wav` | イベント発生 | `retro system alert, two-tone notification, 300ms` |
| `se_result.wav` | リザルト表示 | `retro fanfare, 8-bit, 5 notes, 1.2s` |
| `se_rank_s.wav` | Sランク | `triumphant 8-bit fanfare with shimmer, 2s` |

---

## 7. 実装メモ（HTMLへの組み込み）

実ファイルはプロジェクト鉄則どおり `audio/`（`assets/audio/` ではない）。BGMは20MB鉄則のため HE-AAC の `.m4a`。

```html
<script src="audio.js"></script>
```

- **必ずユーザー操作（「1日をはじめる」ボタン、または初回タップ）の後に `play()` する**。iOS Safari は自動再生を禁止しているため。
- SEは `new Audio()` を都度生成せず、事前ロードして `currentTime = 0; play();` で再生する。
- タイトルバーに `♪` トグルボタンを追加し、ON/OFF状態を `localStorage`（キー `TODAY_EXE_DAY038_MUTE`）に保存する。
- 時間帯でBGMを差し替える場合は `S.hour >= 20` で `bgm_night` にクロスフェード（0.8秒）。HP≤25 のときは `bgm_overwork`。リザルトは `bgm_result`。
