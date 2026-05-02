document.addEventListener('DOMContentLoaded', () => {
  console.log('🟢 Приложение инициализировано');

  // 1. СОСТОЯНИЕ
  let currentFrameType = 'strip'; // 'strip' или 'quadrate'
  let currentColor = 'White';
  let mediaStream = null;
  let capturedPhotos = []; 
  let finalStripDataUrl = '';

  // 2. ЭЛЕМЕНТЫ
  const screens = {
    start: document.getElementById('screen-start'),
    settings: document.getElementById('screen-settings'),
    camera: document.getElementById('screen-camera'),
    result: document.getElementById('screen-result')
  };

  const frameImage = document.getElementById('frame-image');
  const arrowLeft = document.getElementById('arrow-left');
  const arrowRight = document.getElementById('arrow-right');
  const colorOptions = document.querySelectorAll('.color-opt');
  const btnStart = document.getElementById('btn-start');
  const btnNext = document.getElementById('btn-next');
  const btnCapture = document.getElementById('btn-capture');
  const video = document.getElementById('video');
  const btnColor = document.getElementById('btn-color');
  const btnBw = document.getElementById('btn-bw');
  const overlay = document.getElementById('camera-overlay');
  const overlayText = document.getElementById('overlay-text');
  const toggleTrack = document.getElementById('toggle-track');
  
  // Элементы экрана 4
  const resultImage = document.getElementById('result-image');
  const photoWrapper = document.getElementById('photo-wrapper');
  const btnDownload = document.getElementById('btn-download');
  const btnNew = document.getElementById('btn-new');

  // 3. НАВИГАЦИЯ
  function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    if (screens[name]) screens[name].classList.add('active');
  }
  if (btnStart) btnStart.addEventListener('click', () => showScreen('settings'));

  // 4. ПЕРЕКЛЮЧЕНИЕ РАМОК
  function switchFrame(direction) {
    currentFrameType = direction === 'next'
      ? (currentFrameType === 'strip' ? 'quadrate' : 'strip')
      : (currentFrameType === 'quadrate' ? 'strip' : 'quadrate');
    
    updateFrameByColor();
  }
  
  function updateFrameByColor() {
    let frameSrc;
    
    if (currentColor === 'White') {
      frameSrc = `Sample/Frame_${currentFrameType}.png`;
    } else if (currentColor === 'Point') {
      frameSrc = `frames/Frame_${currentFrameType}_point.png`;
    } else {
      frameSrc = `frames/Frame_${currentFrameType}_${currentColor}.png`;
    }
    
    frameImage.style.opacity = '0';
    setTimeout(() => {
      frameImage.src = frameSrc;
      frameImage.onload = () => {
        frameImage.style.opacity = '1';
      };
      frameImage.classList.remove('switching');
    }, 150);
    
    frameImage.classList.add('switching');
    console.log(`🖼️ Загружена рамка: ${frameSrc}, тип: ${currentFrameType}`);
  }

  if (arrowRight) arrowRight.addEventListener('click', () => switchFrame('next'));
  if (arrowLeft) arrowLeft.addEventListener('click', () => switchFrame('prev'));

  // 5. ВЫБОР ЦВЕТА
  colorOptions.forEach(btn => {
    btn.addEventListener('click', () => {
      colorOptions.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentColor = btn.dataset.color;
      updateFrameByColor();
    });
  });

  // 6. КАМЕРА
  if (btnNext) {
    btnNext.addEventListener('click', async () => {
      showScreen('camera');
      await startCamera();
    });
  }
  async function startCamera() {
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 960 } }
      });
      video.srcObject = mediaStream;
    } catch (err) { alert('Разреши доступ к камере'); }
  }
  function stopCamera() {
    if (mediaStream) { mediaStream.getTracks().forEach(t => t.stop()); mediaStream = null; }
  }
  window.addEventListener('beforeunload', stopCamera);

  // 7. ФИЛЬТРЫ
  function applyFilter(type) {
    if (type === 'bw') {
      video.style.filter = 'grayscale(100%) contrast(1.15)';
      btnBw.classList.add('active'); btnBw.classList.remove('inactive');
      btnColor.classList.remove('active'); btnColor.classList.add('inactive');
      toggleTrack.classList.add('bw-active');
    } else {
      video.style.filter = 'none';
      btnColor.classList.add('active'); btnColor.classList.remove('inactive');
      btnBw.classList.remove('active'); btnBw.classList.add('inactive');
      toggleTrack.classList.remove('bw-active');
    }
  }
  if (btnColor) btnColor.addEventListener('click', () => applyFilter('color'));
  if (btnBw) btnBw.addEventListener('click', () => applyFilter('bw'));

  // 8. СЪЁМКА
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

  // 🔥 Размеры для ВЕРТИКАЛЬНОЙ рамки (strip) — УВЕЛИЧЕНО В 2 РАЗА
  const STRIP_PHOTO_W = 504;   // было 252 × 2
  const STRIP_PHOTO_H = 672;   // было 336 × 2
  const STRIP_GAP = 64;        // было 32 × 2
  const STRIP_MARGIN_SIDE = 96; // было 48 × 2
  const STRIP_MARGIN_TOP = 96;  // было 48 × 2
  const STRIP_MARGIN_BOTTOM = 368; // было 184 × 2
  const STRIP_WIDTH = STRIP_MARGIN_SIDE + STRIP_PHOTO_W + STRIP_MARGIN_SIDE; 
  const STRIP_HEIGHT = (STRIP_PHOTO_H * 4) + (STRIP_GAP * 3) + STRIP_MARGIN_TOP + STRIP_MARGIN_BOTTOM;

  // 🔥 Размеры для КВАДРАТНОЙ рамки (quadrate) — УВЕЛИЧЕНО В 2 РАЗА
  const QUAD_PHOTO_W = 952;    // было 476 × 2
  const QUAD_PHOTO_H = 1264;   // было 632 × 2
  const QUAD_GAP = 120;        // было 60 × 2
  const QUAD_MARGIN_TOP = 176; // было 88 × 2
  const QUAD_MARGIN_SIDE = 120; // было 60 × 2
  const QUAD_MARGIN_BOTTOM = 536; // было 268 × 2
  const QUAD_WIDTH = (QUAD_PHOTO_W * 2) + QUAD_GAP + (QUAD_MARGIN_SIDE * 2);
  const QUAD_HEIGHT = (QUAD_PHOTO_H * 2) + QUAD_GAP + QUAD_MARGIN_TOP + QUAD_MARGIN_BOTTOM;

  function captureFrame() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const vW = video.videoWidth;
    const vH = video.videoHeight;
    let sx = 0, sy = 0, sw = vW, sh = vH;
    if (vW / vH > 3/4) { sw = vH * (3/4); sx = (vW - sw) / 2; } 
    else { sh = vW / (3/4); sy = (vH - sh) / 2; }

    // 🔥 Используем увеличенные размеры для quadrate как базовый
    canvas.width = QUAD_PHOTO_W;
    canvas.height = QUAD_PHOTO_H;
    ctx.save();
    ctx.translate(QUAD_PHOTO_W, 0); ctx.scale(-1, 1);
    if (btnColor.classList.contains('inactive')) ctx.filter = 'grayscale(100%) contrast(1.15)';
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, QUAD_PHOTO_W, QUAD_PHOTO_H);
    ctx.restore();
    return canvas.toDataURL('image/png');
  }

  async function createStrip() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Выбираем размеры в зависимости от типа рамки
    let stripWidth, stripHeight, photoW, photoH, gap, marginSide, marginTop, marginBottom;
    
    if (currentFrameType === 'quadrate') {
      stripWidth = QUAD_WIDTH;
      stripHeight = QUAD_HEIGHT;
      photoW = QUAD_PHOTO_W;
      photoH = QUAD_PHOTO_H;
      gap = QUAD_GAP;
      marginSide = QUAD_MARGIN_SIDE;
      marginTop = QUAD_MARGIN_TOP;
      marginBottom = QUAD_MARGIN_BOTTOM;
    } else {
      stripWidth = STRIP_WIDTH;
      stripHeight = STRIP_HEIGHT;
      photoW = STRIP_PHOTO_W;
      photoH = STRIP_PHOTO_H;
      gap = STRIP_GAP;
      marginSide = STRIP_MARGIN_SIDE;
      marginTop = STRIP_MARGIN_TOP;
      marginBottom = STRIP_MARGIN_BOTTOM;
    }
    
    canvas.width = stripWidth;
    canvas.height = stripHeight;

    // 1. Фон (Цвет)
    if (currentColor === 'White') ctx.fillStyle = '#FFFFFF';
    else if (currentColor === 'Black') ctx.fillStyle = '#111010';
    else if (currentColor === 'Red') ctx.fillStyle = '#7D0002';
    else if (currentColor === 'Point') ctx.fillStyle = '#F5F4F2';
    else if (currentColor === 'Cell') ctx.fillStyle = '#F2EFD9';
    ctx.fillRect(0, 0, stripWidth, stripHeight);

    // 2. Паттерны (масштабируем под увеличенный размер)
    if (currentColor === 'Point') {
      ctx.fillStyle = '#111010';
      for (let x = 20; x < stripWidth; x += 24) { // ×2
        for (let y = 20; y < stripHeight; y += 24) { // ×2
          ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill(); // радиус ×2
        }
      }
    }
    if (currentColor === 'Cell') {
      const sz = 24; // ×2
      for (let x = 0; x < stripWidth; x += sz) {
        for (let y = 0; y < stripHeight; y += sz) {
          if ((Math.floor(x/sz) + Math.floor(y/sz)) % 2 === 0) {
            ctx.fillStyle = '#7D0002'; ctx.fillRect(x, y, sz, sz);
          }
        }
      }
    }

    // 3. Вставляем 4 фотографии
    if (currentFrameType === 'quadrate') {
      // КВАДРАТНАЯ РАССТАНОВКА: 2x2 сетка
      for (let i = 0; i < 4; i++) {
        const img = new Image();
        img.src = capturedPhotos[i];
        await new Promise(res => { img.onload = res; });
        
        let xPos, yPos;
        
        if (i === 0) {
          xPos = marginSide;
          yPos = marginTop;
        } else if (i === 1) {
          xPos = marginSide + photoW + gap;
          yPos = marginTop;
        } else if (i === 2) {
          xPos = marginSide;
          yPos = marginTop + photoH + gap;
        } else {
          xPos = marginSide + photoW + gap;
          yPos = marginTop + photoH + gap;
        }
        
        ctx.drawImage(img, xPos, yPos, photoW, photoH);
      }
    } else {
      // ВЕРТИКАЛЬНАЯ РАССТАНОВКА: одна колонка
      for (let i = 0; i < 4; i++) {
        const img = new Image();
        img.src = capturedPhotos[i];
        await new Promise(res => { img.onload = res; });
        
        const yPos = marginTop + i * (photoH + gap);
        ctx.drawImage(img, marginSide, yPos, photoW, photoH);
      }
    }

    // 4. Накладываем PNG рамки ПОВЕРХ фотографий
    let framePath;
    if (currentColor === 'White') {
      framePath = `Sample/Frame_${currentFrameType}.png`;
    } else if (currentColor === 'Point') {
      framePath = `frames/Frame_${currentFrameType}_point.png`;
    } else {
      framePath = `frames/Frame_${currentFrameType}_${currentColor}.png`;
    }
    
    const frameImg = new Image();
    
    await new Promise(resolve => {
      frameImg.onload = () => { 
        ctx.drawImage(frameImg, 0, 0, stripWidth, stripHeight); 
        resolve(); 
      };
      frameImg.onerror = resolve;
      frameImg.src = framePath;
    });

    return canvas.toDataURL('image/png');
  }

  if (btnCapture) {
    btnCapture.addEventListener('click', async () => {
      if (btnCapture.disabled) return;
      btnCapture.disabled = true;
      capturedPhotos = [];

      for (let i = 0; i < 4; i++) {
        for (let t = 3; t > 0; t--) {
          overlayText.textContent = t;
          overlay.classList.add('active');
          overlay.classList.remove('flash');
          await wait(1000);
        }
        overlayText.textContent = '';
        overlay.classList.remove('active');
        overlay.classList.add('flash');
        await wait(300);
        overlay.classList.remove('flash');

        capturedPhotos.push(captureFrame());
        if (i < 3) await wait(800);
      }

      stopCamera();
      finalStripDataUrl = await createStrip();
      resultImage.src = finalStripDataUrl;
      
      // Сбрасываем классы
      photoWrapper.classList.remove('animate', 'quadrate');
      
      // Добавляем класс quadrate если выбран квадрат
      if (currentFrameType === 'quadrate') {
        photoWrapper.classList.add('quadrate');
      }
      
      showScreen('result');
      
      // Запуск простой анимации: фото выезжает сверху
      setTimeout(() => {
        photoWrapper.classList.add('animate');
      }, 200);

      btnCapture.disabled = false;
    });
  }

  // 9. СКАЧИВАНИЕ
  if (btnDownload) {
    btnDownload.addEventListener('click', () => {
      if (!finalStripDataUrl) return;
      const now = new Date();
      const d = String(now.getDate()).padStart(2, '0');
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const y = now.getFullYear();
      const link = document.createElement('a');
      link.download = `AprilPhotobooth_${d}${m}${y}.png`;
      link.href = finalStripDataUrl;
      link.click();
    });
  }

  // 10. НОВОЕ ФОТО
  if (btnNew) {
    btnNew.addEventListener('click', () => {
      capturedPhotos = [];
      finalStripDataUrl = '';
      photoWrapper.classList.remove('animate', 'quadrate');
      showScreen('settings');
    });
  }
});