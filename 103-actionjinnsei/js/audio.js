// BGM管理システム（堅牢な実装）

let currentBGM = null;
const BGM_VOLUME = CONFIG.AUDIO.bgmVolume;

// 全てのBGMを停止（音声ダブり防止）
function stopAllBGM() {
  try {
    const bgmIds = [
      'bgm-stage1', 'bgm-stage2', 'bgm-stage3', 'bgm-stage4',
      'bgm-stage5', 'bgm-stage6', 'bgm-stage7',
      'bgm-boss', 'bgm-lastboss'
    ];
    
    bgmIds.forEach(id => {
      const audio = document.getElementById(id);
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
    
    currentBGM = null;
  } catch (error) {
    console.error('BGM停止エラー:', error);
  }
}

// ステージBGMを再生
function playStageBGM(stageNum) {
  try {
    // 現在のBGMを確実に停止
    stopAllBGM();
    
    // ステージ番号のバリデーション
    if (stageNum < 1 || stageNum > 7) {
      console.warn('無効なステージ番号:', stageNum);
      return;
    }
    
    const bgmId = `bgm-stage${stageNum}`;
    const audio = document.getElementById(bgmId);
    
    if (!audio) {
      console.error(`BGM要素が見つかりません: ${bgmId}`);
      return;
    }
    
    // 音量設定と再生
    audio.volume = BGM_VOLUME;
    currentBGM = audio;
    
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .catch(error => {
          console.error(`ステージ${stageNum}のBGM再生エラー:`, error);
          currentBGM = null;
        });
    }
  } catch (error) {
    console.error('ステージBGM再生エラー:', error);
    currentBGM = null;
  }
}

// ボス戦BGMを再生（ラスボス判定付き）
function playBossBGM(isLastBoss = false) {
  try {
    // 現在のBGMを確実に停止
    stopAllBGM();
    
    const bgmId = isLastBoss ? 'bgm-lastboss' : 'bgm-boss';
    const audio = document.getElementById(bgmId);
    
    if (!audio) {
      console.error(`BGM要素が見つかりません: ${bgmId}`);
      return;
    }
    
    // 音量設定と再生
    audio.volume = BGM_VOLUME;
    currentBGM = audio;
    
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .catch(error => {
          console.error(`${isLastBoss ? 'ラスボス' : 'ボス'}戦BGM再生エラー:`, error);
          currentBGM = null;
        });
    }
  } catch (error) {
    console.error('ボス戦BGM再生エラー:', error);
    currentBGM = null;
  }
}
