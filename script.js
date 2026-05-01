document.addEventListener('DOMContentLoaded', () => {
  console.log('🟢 Приложение инициализировано');

  // 1. СОСТОЯНИЕ
  let currentFrameType = 'strip';
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
  const photoStripWrapper = document.getElementById('photo-strip-wrapper');
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
    frameImage.classList.add('switching');
    setTimeout(() => {
      frameImage.src = `Sample/Frame_${currentFrameType}.png`;
      frameImage.classList.remove('switching');
    }, 150);
  }
  if (arrowRight) arrowRight.addEventListener('click', () => switchFrame('next'));
  if (arrowLeft) arrowLeft.addEventListener('click', () => switchFrame('prev'));

  // 5. ВЫБОР ЦВЕТА
  colorOptions.forEach(btn => {
    btn.addEventListener('click', () => {
      colorOptions.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentColor = btn.dataset.color;
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

  // 8. СЪЁМКА И ГЕНЕРАЦИЯ ПОЛОСКИ
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

  // Размеры из макета
  const PHOTO_W = 252;
  const PHOTO_H = 336;
  const GAP = 32;
  const MARGIN_SIDE = 48;
  const MARGIN_TOP = 48;
  const MARGIN_BOTTOM = 184;
  
  const STRIP_WIDTH = MARGIN_SIDE + PHOTO_W + MARGIN_SIDE; 
  const STRIP_HEIGHT = (PHOTO_H * 4) + (GAP * 3) + MARGIN_TOP + MARGIN_BOTTOM;

  function captureFrame() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const vW = video.videoWidth;
    const vH = video.videoHeight;
    let sx = 0, sy = 0, sw = vW, sh = vH;
    if (vW / vH > 3/4) { sw = vH * (3/4); sx = (vW - sw) / 2; } 
    else { sh = vW / (3/4); sy = (vH - sh) / 2; }

    canvas.width = PHOTO_W;
    canvas.height = PHOTO_H;
    ctx.save();
    ctx.translate(PHOTO_W, 0); ctx.scale(-1, 1);
    if (btnColor.classList.contains('inactive')) ctx.filter = 'grayscale(100%) contrast(1.15)';
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, PHOTO_W, PHOTO_H);
    ctx.restore();
    return canvas.toDataURL('image/png');
  }

  async function createStrip() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = STRIP_WIDTH;
    canvas.height = STRIP_HEIGHT;

    // 1. Фон (Цвет)
    if (currentColor === 'White') ctx.fillStyle = '#FFFFFF';
    else if (currentColor === 'Black') ctx.fillStyle = '#111010';
    else if (currentColor === 'Red') ctx.fillStyle = '#7D0002';
    else if (currentColor === 'Point') ctx.fillStyle = '#F5F4F2';
    else if (currentColor === 'Cell') ctx.fillStyle = '#F2EFD9';
    ctx.fillRect(0, 0, STRIP_WIDTH, STRIP_HEIGHT);

    // 2. Паттерны
    if (currentColor === 'Point') {
      ctx.fillStyle = '#111010';
      for (let x = 10; x < STRIP_WIDTH; x += 12) {
        for (let y = 10; y < STRIP_HEIGHT; y += 12) {
          ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
    if (currentColor === 'Cell') {
      const sz = 12;
      for (let x = 0; x < STRIP_WIDTH; x += sz) {
        for (let y = 0; y < STRIP_HEIGHT; y += sz) {
          if ((Math.floor(x/sz) + Math.floor(y/sz)) % 2 === 0) {
            ctx.fillStyle = '#7D0002'; ctx.fillRect(x, y, sz, sz);
          }
        }
      }
    }

    // 3. Накладываем PNG рамки поверх
    const framePath = `frames/Frame_strip_${currentColor}.png`;
    const frameImg = new Image();
    
    await new Promise(resolve => {
      frameImg.onload = () => { ctx.drawImage(frameImg, 0, 0, STRIP_WIDTH, STRIP_HEIGHT); resolve(); };
      frameImg.onerror = resolve;
      frameImg.src = framePath;
    });

    // 4. Вставляем 4 фотографии
    for (let i = 0; i < 4; i++) {
      const img = new Image();
      img.src = capturedPhotos[i];
      await new Promise(res => { img.onload = res; });
      
      const yPos = MARGIN_TOP + i * (PHOTO_H + GAP);
      ctx.drawImage(img, MARGIN_SIDE, yPos, PHOTO_W, PHOTO_H);
    }

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
      
      showScreen('result');
      // Запуск анимации печати
      setTimeout(() => {
        photoStripWrapper.classList.add('animate');
      }, 150);

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
      photoStripWrapper.classList.remove('animate');
      showScreen('settings');
    });
  }
});