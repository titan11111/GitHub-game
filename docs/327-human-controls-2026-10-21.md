# 327 人物・高速飛行・操作UIの検証（2026-10-21）

- 出走表: 568×320 / 667×375 / 844×390 / 932×430。11人を前後ボタンで表示、カード・設定ともはみ出し/スクロールなし。設定入力は44px。
- 操作: CDP実タッチで右上＋BOOST、右下へのスライド、全指解放を検証。軸とBOOSTが同時に反映され、解放時は全0。
- 接触: 1フレームで互いを通り越すレーサー、隕石を240m跨ぐ移動線分の接触を検出。隕石で205→123m/s、燃料減少。
- 地球・宇宙: 入力ボットで両方resultまで完走、ゲート各40件。人の操作感の評価ではない。
- WebKit: 667×375のタッチ端末設定で起動→出走表→次→開始→走行。操作帯0.3、visualViewport.scale=1、共通コントローラ有効。
- ブラウザ例外0件。ハーネスPASS: `docs/harness-reports/327-day099-2026-10-21T10-51-05-634Z.md`（48 RAF/秒、通信0.67MB）。
- 静的監査: 構文/依存/iOS/20MBはPASS。未コミット差分とThree.js内の既存ログ5件で監査全体はFAIL。実装前からの変更も含まれるため一括コミットしない。
- 未検証: iPhone実機のGPU FPS・親指での操作感・実音の聴取。名所建築の全ポリゴン衝突は未実装。公開/送信は行っていない。

- ブースト実画面を撮影し、炎が人物へ重なるのを確認。最終調整は炎の上限長・外炎の透明度・芯の太さ・カメラの横位置。判定/操作の変更なし。

## 実測JSON

```json
{
  "results": [
    {
      "size": {
        "width": 844,
        "height": 390
      },
      "roster": "11 pages fit",
      "settings": {
        "fit": true,
        "scroll": false,
        "dimensions": [
          144,
          144,
          760,
          760
        ],
        "buttonHeights": [
          44,
          44,
          44,
          44,
          44,
          44
        ]
      }
    },
    {
      "size": {
        "width": 667,
        "height": 375
      },
      "roster": "11 pages fit",
      "settings": {
        "fit": true,
        "scroll": false,
        "dimensions": [
          144,
          144,
          635,
          635
        ],
        "buttonHeights": [
          44,
          44,
          44,
          44,
          44,
          44
        ]
      }
    },
    {
      "size": {
        "width": 568,
        "height": 320
      },
      "roster": "11 pages fit",
      "settings": {
        "fit": true,
        "scroll": false,
        "dimensions": [
          144,
          144,
          536,
          536
        ],
        "buttonHeights": [
          44,
          44,
          44,
          44,
          44,
          44
        ]
      }
    },
    {
      "size": {
        "width": 932,
        "height": 430
      },
      "roster": "11 pages fit",
      "settings": {
        "fit": true,
        "scroll": false,
        "dimensions": [
          144,
          144,
          760,
          760
        ],
        "buttonHeights": [
          44,
          44,
          44,
          44,
          44,
          44
        ]
      }
    },
    {
      "touch": {
        "l": false,
        "r": true,
        "u": true,
        "d": false,
        "b": true,
        "ax": 0.677475810126453,
        "ay": 0.7355450541561042
      },
      "slide": {
        "l": false,
        "r": true,
        "u": false,
        "d": true,
        "b": true,
        "ax": 0.7825936377836777,
        "ay": -0.6225328891717365
      },
      "released": {
        "l": false,
        "r": false,
        "u": false,
        "d": false,
        "b": false,
        "ax": 0,
        "ay": 0
      }
    },
    {
      "physics": {
        "contact": true,
        "rock": true,
        "afterRock": 123,
        "constants": {
          "cruise": 100,
          "boost": 204.99999999999997
        },
        "model": {
          "bones": 9,
          "vertex": 4585,
          "skin": 4585
        }
      }
    },
    {
      "runs": [
        {
          "id": "earth",
          "mode": "result",
          "time": 62.52210601604723,
          "gates": 40
        },
        {
          "id": "space",
          "mode": "result",
          "time": 81.26972774739698,
          "gates": 40
        }
      ]
    },
    {
      "result": {
        "scroll": false,
        "bottom": 347.078125,
        "height": 390
      }
    },
    {
      "raster": {
        "raf": 60.91471939285568,
        "panel": 0.3
      }
    },
    {
      "webkit": {
        "mode": "race",
        "panel": 0.3,
        "scale": 1,
        "controller": true
      }
    }
  ],
  "errors": []
}
```
