# 289｜NEON DASH 99

| 項目 | 内容 |
|---|---|
| 番号 | 289 |
| フォルダ | `289-neon-dash` |
| ジャンル | ワンタップ・ランナー |
| 概要 | ネオン街をワンタップで駆け抜ける、二段ジャンプ＋リングコンボのランナー。 |
| 操作 | タップ（長押しでジャンプ高さ調整・空中でもう一度タップで二段ジャンプ） |
| プレイ時間 | 1回30秒〜2分 |

## 起動

```sh
_tools/preview.sh 289-neon-dash
```

または `python3 -m http.server 8000` → `http://localhost:8000/289-neon-dash/`

## 構成

- `index.html` 単体で完結（外部CDN・外部アセットなし／音はWebAudio合成）
- iOS対応: ダブルタップズーム禁止・WebAudio unlock・safe-area・Canvas DPR対応
