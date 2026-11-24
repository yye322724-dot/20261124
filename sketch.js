let bgImage; // 儲存背景圖片 bg/0.png
let bgScrollX = 0; // 記錄背景水平捲動偏移量
let characterSprite; // 儲存角色一的精靈圖
let walkSprite; // 儲存角色一的走路精靈圖
let magicSprite; // 儲存角色一的施法精靈圖
let magicEffectSprite; // 儲存角色一的魔法特效精靈圖

// --- 角色二圖片與動畫參數 ---
let char2StopSprite; 
let char2ActionSprite; 
const char2StopFrameCount = 6; 
const char2StopFrameWidth = Math.floor(309 / char2StopFrameCount); 
const char2StopFrameHeight = 87; 
const char2ActionFrameCount = 6; 
const char2ActionFrameWidth = Math.floor(523 / char2ActionFrameCount); 
const char2ActionFrameHeight = 87; 

let characterX; // 儲存角色一目前的水平中心位置
let isWalking = false; 
let facingDirection = 1; 
let isCasting = false; 
let magicStartFrame = 0; 
let magicDirection = 1; 
let spaceIsDown = false; 
let activeEffects = []; 

const frameCountInSprite = 10; 
const frameWidth = 139.5; 
const frameHeight = 196; 
const walkFrameCount = 9; 
const walkFrameWidth = 1246 / walkFrameCount; 
const walkFrameHeight = 198; 
const magicFrameCount = 4; 
const magicFrameWidth = 1039 / magicFrameCount; 
const magicFrameHeight = 146; 
const effectFrameCount = 5; 
const effectFrameWidth = 740 / effectFrameCount; 
const effectFrameHeight = 19; 
const framesPerStep = 8; 

// --- 英文測驗系統變數 ---
let quizActive = false; // 是否正在顯示測驗
let currentQuestionIndex = 0; // 目前第幾題 (0-4)
let feedbackMessage = ""; // 答題反饋訊息
let feedbackColor = ""; // 訊息顏色
let optionButtons = []; // 儲存選項按鈕

// 總共 5 題的題庫
const quizData = [
  {
    sentence: "I like to eat a fresh ______.",
    options: ["(A) banana", "(B) apple", "(C) computer", "(D) pencil"],
    correct: 1 // (B) apple
  },
  {
    sentence: "She is reading a good ______ in the library.",
    options: ["(A) book", "(B) desk", "(C) shoe", "(D) wall"],
    correct: 0 // (A) book
  },
  {
    sentence: "The sun shines brightly in the ______.",
    options: ["(A) water", "(B) sky", "(C) floor", "(D) box"],
    correct: 1 // (B) sky
  },
  {
    sentence: "Please open the ______ to let some fresh air in.",
    options: ["(A) car", "(B) window", "(C) phone", "(D) tree"],
    correct: 1 // (B) window
  },
  {
    sentence: "A dog is a very loyal ______.",
    options: ["(A) fruit", "(B) animal", "(C) pencil", "(D) stone"],
    correct: 1 // (B) animal
  }
];

function preload() {
  bgImage = loadImage("bg/0.png");
  characterSprite = loadImage("1/stop/stop.png");
  walkSprite = loadImage("1/walk/walk.png");
  magicSprite = loadImage("1/magic/magic.png");
  magicEffectSprite = loadImage("1/magic_effect/magic_effect.png");

  char2StopSprite = loadImage("2/stop/stop.png");
  char2ActionSprite = loadImage("2/action/action.png");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  imageMode(CENTER);
  characterX = (width * 2) / 3;
  frameRate(60);
  createQuizButtons(); // 建立測驗按鈕
}

function draw() {
  background("#87CEEB");

  const bgAspectRatio = bgImage.width > 0 && bgImage.height > 0 ? bgImage.width / bgImage.height : width / height;
  const bgWidth = max(width, height * bgAspectRatio);
  const maxScrollOffset = bgWidth; 
  bgScrollX = constrain(bgScrollX, -maxScrollOffset, maxScrollOffset); 

  const characterScale = (height / 3) / frameHeight; 
  const characterWidth = frameWidth * characterScale; 
  const characterHeight = frameHeight * characterScale; 
  const defaultCharacterX = (width * 2) / 3; 

  const movingRight = keyIsDown(RIGHT_ARROW); 
  const movingLeft = keyIsDown(LEFT_ARROW); 
  isWalking = movingRight || movingLeft; 
  const movementStep = constrain(width * 0.004, 2, 8); 

  if (movingRight) {
    isWalking = true;
    facingDirection = 1;
    if (characterX < defaultCharacterX) {
      characterX = min(defaultCharacterX, characterX + movementStep);
    } else if (bgScrollX > -maxScrollOffset) {
      bgScrollX = max(-maxScrollOffset, bgScrollX - movementStep);
    } else {
      characterX += movementStep;
    }
  } else if (movingLeft) {
    isWalking = true;
    facingDirection = -1;
    if (characterX > defaultCharacterX) {
      characterX = max(defaultCharacterX, characterX - movementStep);
    } else if (bgScrollX < maxScrollOffset) {
      bgScrollX = min(maxScrollOffset, bgScrollX + movementStep);
    } else {
      characterX -= movementStep;
    }
  }

  // 繪製背景
  push();
  imageMode(CORNER);
  const centerBgX = (width - bgWidth) / 2 + bgScrollX; 
  const leftBgX = centerBgX - bgWidth; 
  image(bgImage, leftBgX, 0, bgWidth, height); 
  image(bgImage, centerBgX, 0, bgWidth, height); 
  image(bgImage, centerBgX + bgWidth, 0, bgWidth, height); 
  pop();

  characterX = constrain(characterX, characterWidth / 2, width - characterWidth / 2);

  // 角色二設定
  const char2BgCenterX = centerBgX + bgWidth / 2; 
  const char2Scale = characterScale * 2; 
  const triggerDistance = (characterWidth + char2ActionFrameWidth * char2Scale) * 0.8; 
  const isNearChar2 = abs(characterX - char2BgCenterX) < triggerDistance; 

  // 當接近狀態改變時處理測驗顯示與按鈕開關
  if (isNearChar2 && !quizActive) {
    quizActive = true;
    currentQuestionIndex = 0;
    feedbackMessage = "";
    updateQuizButtons();
  } else if (!isNearChar2 && quizActive) {
    quizActive = false;
    hideQuizButtons();
  }

  const activeChar2Sprite = isNearChar2 ? char2ActionSprite : char2StopSprite;
  const activeChar2FrameCount = isNearChar2 ? char2ActionFrameCount : char2StopFrameCount;
  const activeChar2FrameWidth = isNearChar2 ? char2ActionFrameWidth : char2StopFrameWidth;
  const activeChar2FrameHeight = isNearChar2 ? char2ActionFrameHeight : char2StopFrameHeight;

  const char2FrameIndex = floor(frameCount / framesPerStep) % activeChar2FrameCount;
  const char2SourceX = Math.floor(char2FrameIndex * activeChar2FrameWidth);
  const char2DisplayWidth = activeChar2FrameWidth * char2Scale;
  const char2DisplayHeight = activeChar2FrameHeight * char2Scale;
  const char2Y = height - char2DisplayHeight / 2; 

  push();
  imageMode(CENTER);
  image(activeChar2Sprite, char2BgCenterX, char2Y, char2DisplayWidth, char2DisplayHeight, char2SourceX, 0, activeChar2FrameWidth, activeChar2FrameHeight);
  pop();

  // 角色一設定
  if (isCasting && frameCount - magicStartFrame >= magicFrameCount * framesPerStep) {
    isCasting = false;
    activeEffects.push({ x: characterX + magicDirection * characterWidth / 2, y: height - characterHeight * 0.58, direction: magicDirection });
  }

  const activeSprite = isCasting ? magicSprite : isWalking ? walkSprite : characterSprite;
  const activeFrameCount = isCasting ? magicFrameCount : isWalking ? walkFrameCount : frameCountInSprite;
  const activeFrameWidth = isCasting ? magicFrameWidth : isWalking ? walkFrameWidth : frameWidth;
  const activeFrameHeight = isCasting ? magicFrameHeight : isWalking ? walkFrameHeight : frameHeight;
  const elapsedMagicFrames = frameCount - magicStartFrame;
  const frameIndex = isCasting ? floor(elapsedMagicFrames / framesPerStep) : floor(frameCount / framesPerStep) % activeFrameCount;
  const sourceX = frameIndex * activeFrameWidth;
  const activeWidth = activeFrameWidth * characterScale;
  const activeHeight = activeFrameHeight * characterScale;
  const characterY = height - activeHeight / 2;

  push();
  translate(characterX, characterY);
  scale(isCasting ? magicDirection : facingDirection, 1);
  image(activeSprite, 0, 0, activeWidth, activeHeight, sourceX, 0, activeFrameWidth, activeFrameHeight);
  pop();

  // 魔法特效
  const effectScale = characterScale;
  const effectWidth = effectFrameWidth * effectScale;
  const effectHeight = effectFrameHeight * effectScale;
  const effectSpeed = max(6, width * 0.008);
  for (let effectIndex = activeEffects.length - 1; effectIndex >= 0; effectIndex--) {
    const effect = activeEffects[effectIndex];
    effect.x += effect.direction * effectSpeed;
    if (effect.x > width || effect.x < 0) {
      activeEffects.splice(effectIndex, 1);
      continue;
    }
    const effectFrameIndex = floor(frameCount / framesPerStep) % effectFrameCount;
    push();
    translate(effect.x, effect.y);
    scale(effect.direction, 1);
    image(magicEffectSprite, 0, 0, effectWidth, effectHeight, effectFrameIndex * effectFrameWidth, 0, effectFrameWidth, effectFrameHeight);
    pop();
  }

  // --- 繪製畫布上方的紫色測驗方框與文字 ---
  if (quizActive) {
    push();
    rectMode(CENTER);
    
    // 方框寬 1/3、高 1/2，中心在畫面中央，但 Y 軸大幅往上調整 (height * 0.28)
    const boxWidth = width / 3;
    const boxHeight = height / 2;
    const boxX = width / 2;
    const boxY = height * 0.28; 

    // 紫色方框 (透明度 90)
    fill(128, 0, 128, 90);
    stroke(255, 255, 255, 150); 
    strokeWeight(2);
    rect(boxX, boxY, boxWidth, boxHeight, 15); 

    // 顯示題目與反饋文字
    fill(255); 
    noStroke();
    textAlign(CENTER, TOP);
    let titleSize = max(14, width * 0.015);
    textSize(titleSize);
    
    let q = quizData[currentQuestionIndex];
    let displayStr = `【 英文句子填空題 (第 ${currentQuestionIndex + 1}/5 題) 】\n\n` + q.sentence;
    text(displayStr, boxX, boxY - boxHeight / 2 + 20);

    // 顯示答對/答錯反饋
    if (feedbackMessage !== "") {
      textSize(max(16, width * 0.018));
      fill(feedbackColor);
      text(feedbackMessage, boxX, boxY + boxHeight / 2 - 80);
    }
    pop();

    // 更新 HTML 按鈕的絕對位置，讓按鈕固定貼合在方框內
    updateButtonPositions(boxX, boxY, boxWidth, boxHeight);
  }
}

// 建立 HTML 選項按鈕
function createQuizButtons() {
  optionButtons = [];
  for (let i = 0; i < 4; i++) {
    let btn = createButton('');
    btn.style('background-color', 'rgba(255, 255, 255, 0.8)');
    btn.style('border', 'none');
    btn.style('border-radius', '5px');
    btn.style('padding', '6px 12px');
    btn.style('font-size', '14px');
    btn.style('cursor', 'pointer');
    btn.style('font-weight', 'bold');
    
    let index = i;
    btn.mousePressed(() => checkAnswer(index));
    btn.hide();
    optionButtons.push(btn);
  }
}

// 根據目前方框位置動態對齊按鈕
function updateButtonPositions(boxX, boxY, boxWidth, boxHeight) {
  let startY = boxY - boxHeight / 2 + 110;
  let btnWidth = boxWidth * 0.8;
  let btnHeight = 32;

  for (let i = 0; i < 4; i++) {
    optionButtons[i].show();
    let q = quizData[currentQuestionIndex];
    optionButtons[i].html(q.options[i]);
    optionButtons[i].position(boxX - btnWidth / 2, startY + i * 40);
    optionButtons[i].size(btnWidth, btnHeight);
  }
}

// 顯示按鈕
function updateQuizButtons() {
  for (let btn of optionButtons) {
    btn.show();
  }
}

// 隱藏按鈕
function hideQuizButtons() {
  for (let btn of optionButtons) {
    btn.hide();
  }
}

// 檢查答案邏輯
function checkAnswer(selectedIndex) {
  let q = quizData[currentQuestionIndex];
  if (selectedIndex === q.correct) {
    feedbackMessage = "✔ 答對了！真棒！";
    feedbackColor = "rgb(0, 255, 100)";
    
    // 0.8秒後自動前往下一題或完成測驗
    setTimeout(() => {
      if (!quizActive) return;
      currentQuestionIndex++;
      feedbackMessage = "";
      if (currentQuestionIndex >= quizData.length) {
        feedbackMessage = "🎉 恭喜通關所有英文題目！";
        currentQuestionIndex = 0; // 循環或保持
      }
    }, 1000);

  } else {
    feedbackMessage = `✖ 答錯了！正確答案是：${q.options[q.correct]}`;
    feedbackColor = "rgb(255, 100, 100)";
  }
}

function keyPressed() {
  if (keyCode === RIGHT_ARROW) {
    isWalking = true;
    facingDirection = 1;
    return false;
  }
  if (keyCode === LEFT_ARROW) {
    isWalking = true;
    facingDirection = -1;
    return false;
  }
  if (keyCode === 32) {
    if (!spaceIsDown && !isCasting) {
      isCasting = true;
      magicStartFrame = frameCount;
      magicDirection = facingDirection;
    }
    spaceIsDown = true;
    return false;
  }
}

function keyReleased() {
  if (keyCode === 32) {
    spaceIsDown = false;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  characterX = constrain(characterX, 1, width - 1);
}