const REVIEW_HANDLES = [
    '熊本グルメ探検隊', '町中華ハンター', '腹ペコ会社員', '炒飯警察', '旅するパンダ',
    '近所の常連', '夜勤明けの胃袋', '餃子だけ来る人', '強火好きの姉', 'サラリーマン弁当班',
    '観光で一軒', 'ラーメン時間厳守'
];

const REVIEW_BANK = {
    delighted: [
        { stars: 5, text: '{dish}、席に座った瞬間に来た。厨房の火柱まで見えて最高。' },
        { stars: 5, text: '注文してから呼吸する暇もなく{dish}。爆速すぎて笑った。' },
        { stars: 5, text: '{dish}の香りが鉄鍋ごと飛んでくる。この速さ、癖になる。' },
        { stars: 5, text: '目の前でシュッて炙られて{dish}到着。町中華の理想形。' },
        { stars: 5, text: '{dish}熱々、待ちゼロ。店員の鍋返しが仕事してる。' },
        { stars: 5, text: 'まだメニュー閉じてないのに{dish}来た。本気の強火。' },
        { stars: 5, text: '{dish}が爆速で出て、火の匂いまでセット。星5しかない。' },
        { stars: 5, text: '待たされず{dish}。油が弾ける音がごちそうだった。' }
    ],
    happy: [
        { stars: 5, text: '{dish}うまかった。少し待ったけど火力で許す。' },
        { stars: 4, text: '{dish}できたて。鍋が鳴ってる店は信用できる。' },
        { stars: 4, text: 'まあまあ速い。{dish}の焦げ目がいい仕事してる。' },
        { stars: 5, text: '{dish}熱い。待った分、炙りの香りが強かった。' },
        { stars: 4, text: '席についてすぐじゃないけど、{dish}は文句なし。' },
        { stars: 4, text: '{dish}来た。厨房の火が揺れてて見てて飽きない。' },
        { stars: 5, text: '普通に速い部類。{dish}の湯気で機嫌が直った。' },
        { stars: 4, text: '{dish}よし。次もこの強火でお願いしたい。' }
    ],
    okay: [
        { stars: 3, text: '{dish}は美味しい。ただ待ちが少し長い。' },
        { stars: 3, text: 'お腹が鳴ってから{dish}。味は救った。' },
        { stars: 4, text: '待たされたけど{dish}の火力は本物。星は半分味。' },
        { stars: 3, text: '{dish}到着。厨房は忙しそう。もう一声ほしい。' },
        { stars: 3, text: '会話が一段落してから{dish}。熱さは残ってた。' },
        { stars: 3, text: '{dish}まあまあ。火は見てて楽しい、提供は普通。' },
        { stars: 4, text: '待ち時間あり。それでも{dish}の香りで残った。' }
    ],
    barely: [
        { stars: 2, text: '{dish}来る直前まで帰ろうかと思ってた。危ない。' },
        { stars: 2, text: '限界寸前で{dish}。味は良い、対応は綱渡り。' },
        { stars: 3, text: '怒りかけたところで{dish}。次は早くしてほしい。' },
        { stars: 2, text: '{dish}は熱い。心は冷えてた。もう少しで爆発。' },
        { stars: 2, text: '時計見すぎた。{dish}のおかげでレビューは残す。' },
        { stars: 3, text: '待ちすぎ。{dish}は救ったけど星は抑えめ。' }
    ],
    angry: [
        { stars: 1, text: '{dish}待ってたのに時間切れ。椅子が無駄になった。' },
        { stars: 1, text: '空腹で座った結果、空振り。{dish}は幻だった。' },
        { stars: 2, text: '厨房の火は見えた。{dish}は来なかった。それが一番つらい。' },
        { stars: 1, text: '気短な客を舐めないでほしい。{dish}待ちで退店。' },
        { stars: 2, text: '{dish}の匂いだけ届いて本体が来ない。帰ります。' },
        { stars: 1, text: '待ち時間で評判を落とす店。{dish}は次の機会に。' }
    ]
};

const REVIEW_SEAR_NOTES = [
    ' さっきの火柱、本気だった。',
    ' 鉄鍋から炎が立ってて動画撮りたかった。',
    ' 炙る音が店内に響いてる。'
];

const ReviewPicker = {
    recent: [],
    pick(tier, dishName, seared) {
        const bank = REVIEW_BANK[tier] || REVIEW_BANK.okay;
        const unused = bank.filter((row) => !this.recent.includes(row.text));
        const pool = unused.length ? unused : bank;
        const row = pool[Math.floor(Math.random() * pool.length)];
        this.recent.push(row.text);
        if (this.recent.length > 8) this.recent.shift();
        let text = row.text.replace(/\{dish\}/g, dishName);
        if (seared && (tier === 'delighted' || tier === 'happy') && Math.random() < 0.55) {
            text += REVIEW_SEAR_NOTES[Math.floor(Math.random() * REVIEW_SEAR_NOTES.length)];
        }
        return { stars: row.stars, text };
    },
    handle() {
        return REVIEW_HANDLES[Math.floor(Math.random() * REVIEW_HANDLES.length)];
    },
    tierFromPatience(ratio) {
        if (ratio >= 0.75) return 'delighted';
        if (ratio >= 0.5) return 'happy';
        if (ratio >= 0.3) return 'okay';
        return 'barely';
    }
};
