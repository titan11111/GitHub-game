/**
 * 100日チャレンジ ホームページ 自動生成スクリプト
 *
 * 実行方法:
 * node 100days-generator.js
 *
 * または毎日定時実行:
 * スケジュール Claude で毎日 00:00 に実行
 */

const fs = require('fs');
const path = require('path');

// X API 設定（ユーザーが設定する必要あり）
const X_API_CONFIG = {
    bearerToken: process.env.X_API_BEARER_TOKEN || 'YOUR_BEARER_TOKEN_HERE',
    userId: process.env.X_API_USER_ID || 'YOUR_USER_ID_HERE'
};

// サンプルデータ（X API が取得できない場合のデモ用）
const SAMPLE_GAMES = [
    {
        day: 25,
        title: 'ぐるぐる世界',
        description: '#day25 ゲーム作成：ぐるぐる世界。重力で物が回転する不思議な世界。',
        imageUrl: 'https://via.placeholder.com/300x300?text=day25',
        twitterLink: 'https://twitter.com/user/status/1234567890',
        date: '2026-08-11',
        likes: 42,
        retweets: 5
    },
    {
        day: 24,
        title: '迷路の塔',
        description: '#day24 ゲーム作成：迷路の塔。上へ上へと登っていく。',
        imageUrl: 'https://via.placeholder.com/300x300?text=day24',
        twitterLink: 'https://twitter.com/user/status/1234567889',
        date: '2026-08-10',
        likes: 38,
        retweets: 4
    },
    {
        day: 23,
        title: 'カラフル雪玉',
        description: '#day23 ゲーム作成：カラフル雪玉。色を集めて大きくなる。',
        imageUrl: 'https://via.placeholder.com/300x300?text=day23',
        twitterLink: 'https://twitter.com/user/status/1234567888',
        date: '2026-08-09',
        likes: 55,
        retweets: 8
    }
    // ... 実際にはXから動的に取得
];

/**
 * X API からツイートを取得
 * 注: 実装には X API v2 の認証が必要
 */
async function fetchGamesFromXAPI() {
    // デモ版：X API 実装は別途必要
    // 本実装では以下を使用:
    // const response = await fetch(`https://api.twitter.com/2/users/${X_API_CONFIG.userId}/tweets`, {
    //     headers: {
    //         'Authorization': `Bearer ${X_API_CONFIG.bearerToken}`
    //     }
    // });
    // const data = await response.json();
    // return data.data.map(tweet => parseGameData(tweet));

    console.log('📊 サンプルデータでデモンストレーション');
    return SAMPLE_GAMES;
}

/**
 * ツイートからゲーム情報を抽出
 */
function parseGameData(tweet) {
    // 正規表現で #dayXX からゲーム番号を抽出
    const dayMatch = tweet.text.match(/#day(\d+)/);
    const day = dayMatch ? parseInt(dayMatch[1]) : null;

    return {
        day: day,
        title: extractTitle(tweet.text),
        description: tweet.text,
        imageUrl: tweet.attachments?.media_keys ? getMediaUrl(tweet) : null,
        twitterLink: `https://twitter.com/user/status/${tweet.id}`,
        date: tweet.created_at,
        likes: tweet.public_metrics?.like_count || 0,
        retweets: tweet.public_metrics?.retweet_count || 0
    };
}

/**
 * ツイートテキストからタイトル抽出
 */
function extractTitle(text) {
    const lines = text.split('\n');
    for (const line of lines) {
        if (line.includes('ゲーム') || line.includes('作成')) {
            return line.replace(/#day\d+/, '').trim().substring(0, 30);
        }
    }
    return text.substring(0, 30);
}

/**
 * メディア URL を取得（デモ用）
 */
function getMediaUrl(tweet) {
    // 実装時は media_key からメディア情報を取得
    return `https://via.placeholder.com/300x300?text=day${tweet.id}`;
}

/**
 * HTML ファイル生成
 */
function generateHTML(games) {
    const totalGames = games.length;
    const progress = Math.min(Math.round((totalGames / 100) * 100), 100);
    const currentDay = games.length > 0 ? Math.max(...games.map(g => g.day || 0)) : 0;

    const gameCardsHTML = games
        .sort((a, b) => (b.day || 0) - (a.day || 0))
        .map(game => `
            <div class="game-card">
                <div class="game-image">
                    <img src="${game.imageUrl}" alt="day${game.day}" loading="lazy">
                </div>
                <div class="game-info">
                    <div class="game-day">#day${game.day || 'X'}</div>
                    <h3 class="game-title">${escapeHtml(game.title)}</h3>
                    <p class="game-desc">${escapeHtml(game.description.substring(0, 80))}</p>
                    <div class="game-stats">
                        <span>❤️ ${game.likes}</span>
                        <span>🔄 ${game.retweets}</span>
                    </div>
                    <a href="${game.twitterLink}" target="_blank" class="game-link">X で見る</a>
                </div>
            </div>
        `)
        .join('');

    const html = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>100日チャレンジ - ${totalGames}個のゲーム</title>
    <meta name="description" content="100日でゲーム100個を作るチャレンジ。現在${totalGames}個完成。">
    <meta property="og:title" content="100日チャレンジ">
    <meta property="og:description" content="100日でゲーム${totalGames}個。毎日新しいゲームを作っています。">
    <meta property="og:image" content="https://via.placeholder.com/1200x630?text=100days-challenge">
    <meta property="og:type" content="website">
    <meta property="twitter:card" content="summary_large_image">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            color: white;
            margin-bottom: 50px;
        }
        .header h1 {
            font-size: 48px;
            margin-bottom: 10px;
        }
        .header p {
            font-size: 18px;
            opacity: 0.9;
        }
        .progress-section {
            background: white;
            border-radius: 16px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        .progress-bar {
            width: 100%;
            height: 40px;
            background: #e0e0e0;
            border-radius: 20px;
            overflow: hidden;
            margin-bottom: 15px;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            width: ${progress}%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            transition: width 0.3s ease;
        }
        .progress-text {
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            color: #333;
        }
        .gallery {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .game-card {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
            cursor: pointer;
        }
        .game-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
        }
        .game-image {
            width: 100%;
            aspect-ratio: 1;
            overflow: hidden;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .game-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        .game-info {
            padding: 15px;
        }
        .game-day {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 8px;
        }
        .game-title {
            font-size: 18px;
            color: #333;
            margin-bottom: 8px;
            line-height: 1.4;
        }
        .game-desc {
            font-size: 13px;
            color: #666;
            margin-bottom: 10px;
            line-height: 1.4;
        }
        .game-stats {
            display: flex;
            gap: 10px;
            margin-bottom: 12px;
            font-size: 12px;
            color: #999;
        }
        .game-link {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 8px 16px;
            border-radius: 6px;
            text-decoration: none;
            font-size: 13px;
            font-weight: 600;
            transition: background 0.2s;
        }
        .game-link:hover {
            background: #764ba2;
        }
        .footer {
            text-align: center;
            color: white;
            padding: 20px;
            opacity: 0.9;
        }
        .footer p {
            font-size: 12px;
        }
        @media (max-width: 768px) {
            .header h1 {
                font-size: 32px;
            }
            .gallery {
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎮 100日チャレンジ</h1>
            <p>100日でゲーム100個を作る</p>
        </div>

        <div class="progress-section">
            <div class="progress-bar">
                <div class="progress-fill">${progress}%</div>
            </div>
            <div class="progress-text">${totalGames} / 100</div>
        </div>

        <div class="gallery">
            ${gameCardsHTML}
        </div>

        <div class="footer">
            <p>最終更新: ${new Date().toLocaleString('ja-JP')}</p>
            <p>毎日新しいゲームを追加中...</p>
        </div>
    </div>
</body>
</html>`;

    return html;
}

/**
 * HTML エスケープ
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * ファイルに保存
 */
function saveHTML(html, outputPath) {
    fs.writeFileSync(outputPath, html, 'utf8');
    console.log(`✅ ファイル保存: ${outputPath}`);
}

/**
 * メイン処理
 */
async function main() {
    console.log('🚀 100日チャレンジ HP 生成開始\n');

    try {
        // ゲームデータ取得
        console.log('📚 ゲームデータ取得中...');
        const games = await fetchGamesFromXAPI();
        console.log(`✅ ${games.length}個のゲームを取得\n`);

        // HTML 生成
        console.log('🎨 HTML 生成中...');
        const html = generateHTML(games);
        console.log('✅ HTML 生成完了\n');

        // ファイル保存
        const outputPath = path.join(__dirname, 'index.html');
        saveHTML(html, outputPath);

        // JSON データも保存（後で更新用）
        const jsonPath = path.join(__dirname, 'data.json');
        fs.writeFileSync(jsonPath, JSON.stringify({
            meta: {
                total: games.length,
                progress: Math.min(Math.round((games.length / 100) * 100), 100),
                lastUpdated: new Date().toISOString()
            },
            games: games
        }, null, 2), 'utf8');
        console.log(`✅ JSON保存: ${jsonPath}`);

        console.log('\n🎉 完成！ HP は index.html で公開可能です');
    } catch (error) {
        console.error('❌ エラー:', error.message);
        process.exit(1);
    }
}

main();
