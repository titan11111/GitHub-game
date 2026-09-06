# 290｜BLOCK FEVER

| 項目 | 内容 |
|---|---|
| 番号 | 290 |
| フォルダ | `290-block-fever` |
| ジャンル | ブロック崩し / アーケード |
| 概要 | 指1本のパドル操作で守る、パワーアップ付きの加速ブロック崩し。 |
| 操作 | 画面をなぞってパドル移動、タップで発射 |
| プレイ時間 | 1回2〜6分 |

## 起動

```sh
_tools/preview.sh 290-block-fever
```

または `python3 -m http.server 8000` → `http://localhost:8000/290-block-fever/`

## 構成

- `index.html` 単体で完結（外部CDN・外部アセットなし／音はWebAudio合成）
- iOS対応: ダブルタップズーム禁止・WebAudio unlock・safe-area・Canvas DPR対応
