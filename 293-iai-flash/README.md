# 293｜IAI FLASH 一閃

| 項目 | 内容 |
|---|---|
| 番号 | 293 |
| フォルダ | `293-iai-flash` |
| ジャンル | 反射神経 / 居合 |
| 概要 | 合図の一瞬に抜く、反射神経の真剣勝負。フェイントに釣られたら即敗北。 |
| 操作 | 合図が出た瞬間にタップ |
| プレイ時間 | 1回20秒〜2分 |

## 起動

```sh
_tools/preview.sh 293-iai-flash
```

または `python3 -m http.server 8000` → `http://localhost:8000/293-iai-flash/`

## 構成

- `index.html` 単体で完結（外部CDN・外部アセットなし／音はWebAudio合成）
- iOS対応: ダブルタップズーム禁止・WebAudio unlock・safe-area・Canvas DPR対応
