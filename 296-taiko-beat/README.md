# 296｜TAIKO BEAT

| 項目 | 内容 |
|---|---|
| 番号 | 296 |
| フォルダ | `296-taiko-beat` |
| ジャンル | リズム |
| 概要 | 左右2レーンのリズムゲーム。画面の左半分＝ド、右半分＝カ。 |
| 操作 | 画面左半分／右半分をタップ |
| プレイ時間 | 1回1〜4分 |

## 起動

```sh
_tools/preview.sh 296-taiko-beat
```

または `python3 -m http.server 8000` → `http://localhost:8000/296-taiko-beat/`

## 構成

- `index.html` 単体で完結（外部CDN・外部アセットなし／音はWebAudio合成）
- iOS対応: ダブルタップズーム禁止・WebAudio unlock・safe-area・Canvas DPR対応
