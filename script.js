document.addEventListener('DOMContentLoaded', () => {
  console.log('🟢 Приложение инициализировано');
  
  // Проверка поддержки фильтров канваса
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const supportsCanvasFilter = 'filter' in ctx;
  console.log('Canvas filter support:', supportsCanvasFilter);

  // Предзагрузка шрифта для даты
  if (document.fonts) {
    document.fonts.load('48px "LiuJianMaoCao"');
    document.fonts.load('64px "LiuJianMaoCao"');
  }

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
  
  const resultImage = document.getElementById('result-image');
  const photoWrapper = document.getElementById('photo-wrapper');
  const btnDownload = document.getElementById('btn-download');
  const btnNew = document.getElementById('btn-new');

  // Ползунки камеры
  const brightnessSlider = document.getElementById('brightness-slider');
  const contrastSlider = document.getElementById('contrast-slider');

  // Функция для заполнения ползунка цветом
  function updateSliderFill(slider, color) {
    if (!slider) return;
    const value = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
    slider.style.background = `linear-gradient(to right, ${color} ${value}%, #EBECED ${value}%)`;
  }

  // Инициализация цветов ползунков
  const sliderColor = '#111010';
  updateSliderFill(brightnessSlider, sliderColor);
  updateSliderFill(contrastSlider, sliderColor);

  // 3. НАВИГАЦИЯ
  function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    if (screens[name]) screens[name].classList.add('active');
  }

  if (btnStart) {
    btnStart.addEventListener('click', (e) => {
      e.preventDefault();
      showScreen('settings');
    });
  }

  // 4. ПЕРЕКЛЮЧЕНИЕ РАМОК
  function switchFrame(direction) {
    currentFrameType = direction === 'next'
      ? (currentFrameType === 'strip' ? 'quadrate' : 'strip')
      : (currentFrameType === 'quadrate' ? 'strip' : 'quadrate');
    updateFrameByColor();
  }
  
  function updateFrameByColor() {
    let frameSrc;
    
    if (currentColor === 'Logo') {
      frameSrc = `Sample/Frame_${currentFrameType}_for_Logo.png`;
    } else if (currentColor === 'Date') {
      frameSrc = `Sample/Frame_${currentFrameType}_for_Date.png`;
    } else if (currentColor === 'White') {
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
        frameImage.classList.remove('switching');
      };
      frameImage.classList.remove('switching');
    }, 150);
    
    frameImage.classList.add('switching');
    console.log(`🖼️ Превью: ${frameSrc}`);
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

  // 6. КАМЕРА И ПОЛЗУНКИ
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
    } catch (err) {
      console.error('❌ Ошибка камеры:', err);
      alert('Разреши доступ к камере');
    }
  }
  function stopCamera() {
    if (mediaStream) {
      mediaStream.getTracks().forEach(t => t.stop());
      mediaStream = null;
    }
  }
  window.addEventListener('beforeunload', stopCamera);

  // Логика ползунков
  function updateCameraFilters() {
    const brightnessVal = 1 + (brightnessSlider.value / 100);
    const contrastVal = 1 + (contrastSlider.value / 100);
    
    let filters = `brightness(${brightnessVal}) contrast(${contrastVal})`;
    
    if (btnBw.classList.contains('active')) {
      filters += ' grayscale(100%)';
    }
    
    video.style.filter = filters;
    video.style.webkitFilter = filters;
  }

  // Слушатели
  if (brightnessSlider) {
    brightnessSlider.addEventListener('input', () => {
      updateSliderFill(brightnessSlider, sliderColor);
      updateCameraFilters();
    });
  }
  if (contrastSlider) {
    contrastSlider.addEventListener('input', () => {
      updateSliderFill(contrastSlider, sliderColor);
      updateCameraFilters();
    });
  }

  // 7. ФИЛЬТРЫ (Ч/Б)
  function applyFilter(type) {
    if (type === 'bw') {
      btnBw.classList.add('active'); btnBw.classList.remove('inactive');
      btnColor.classList.remove('active'); btnColor.classList.add('inactive');
      toggleTrack.classList.add('bw-active');
    } else {
      btnColor.classList.add('active'); btnColor.classList.remove('inactive');
      btnBw.classList.remove('active'); btnBw.classList.add('inactive');
      toggleTrack.classList.remove('bw-active');
    }
    updateCameraFilters();
  }

  if (btnColor) btnColor.addEventListener('click', () => applyFilter('color'));
  if (btnBw) btnBw.addEventListener('click', () => applyFilter('bw'));

  // 8. СЪЁМКА
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

  // Размеры для полоски (3 фото)
  const STRIP_PHOTO_W = 252;
  const STRIP_PHOTO_H = 340;
  const STRIP_GAP = 30;
  const STRIP_MARGIN_SIDE = 60;
  const STRIP_MARGIN_TOP = 60;
  const STRIP_MARGIN_BOTTOM = 236;
  const STRIP_WIDTH = STRIP_MARGIN_SIDE + STRIP_PHOTO_W + STRIP_MARGIN_SIDE;
  const STRIP_HEIGHT = (STRIP_PHOTO_H * 3) + (STRIP_GAP * 2) + STRIP_MARGIN_TOP + STRIP_MARGIN_BOTTOM;

  // Размеры для квадрата (4 фото)
  const QUAD_PHOTO_W = 476;
  const QUAD_PHOTO_H = 632;
  const QUAD_GAP = 60;
  const QUAD_MARGIN_TOP = 88;
  const QUAD_MARGIN_SIDE = 60;
  const QUAD_MARGIN_BOTTOM = 268;
  const QUAD_WIDTH = (QUAD_PHOTO_W * 2) + QUAD_GAP + (QUAD_MARGIN_SIDE * 2);
  const QUAD_HEIGHT = (QUAD_PHOTO_H * 2) + QUAD_GAP + QUAD_MARGIN_TOP + QUAD_MARGIN_BOTTOM;

  // === ФУНКЦИЯ ДЛЯ РУЧНОЙ ОБРАБОТКИ ФИЛЬТРОВ (фоллбэк) ===
  function applyManualFilters(ctx, width, height) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    const brightnessVal = 1 + (brightnessSlider.value / 100);
    const contrastVal = 1 + (contrastSlider.value / 100);
    const isBW = btnBw.classList.contains('active');
    
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i+1];
      let b = data[i+2];
      
      // Применяем яркость
      r *= brightnessVal;
      g *= brightnessVal;
      b *= brightnessVal;
      
      // Применяем контраст
      r = ((r - 128) * contrastVal) + 128;
      g = ((g - 128) * contrastVal) + 128;
      b = ((b - 128) * contrastVal) + 128;
      
      // Применяем Ч/Б если нужно
      if (isBW) {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        r = g = b = gray;
      }
      
      // Ограничиваем значения 0-255
      data[i] = Math.min(255, Math.max(0, r));
      data[i+1] = Math.min(255, Math.max(0, g));
      data[i+2] = Math.min(255, Math.max(0, b));
    }
    
    ctx.putImageData(imageData, 0, 0);
  }

  function captureFrame() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const vW = video.videoWidth;
    const vH = video.videoHeight;
    
    let sx = 0, sy = 0, sw = vW, sh = vH;
    if (vW / vH > 3/4) {
      sw = vH * (3/4);
      sx = (vW - sw) / 2;
    } else {
      sh = vW / (3/4);
      sy = (vH - sh) / 2;
    }

    canvas.width = QUAD_PHOTO_W;
    canvas.height = QUAD_PHOTO_H;
    
    ctx.save();
    ctx.translate(QUAD_PHOTO_W, 0); 
    ctx.scale(-1, 1);
    
    // Применяем фильтры через ctx.filter если поддерживается
    if (supportsCanvasFilter) {
      const brightnessVal = 1 + (brightnessSlider.value / 100);
      const contrastVal = 1 + (contrastSlider.value / 100);
      ctx.filter = `brightness(${brightnessVal}) contrast(${contrastVal})`;
      
      if (btnBw.classList.contains('active')) {
        ctx.filter += ' grayscale(100%)';
      }
    }
    
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, QUAD_PHOTO_W, QUAD_PHOTO_H);
    
    // Если filter не поддерживается, применяем вручную
    if (!supportsCanvasFilter) {
      applyManualFilters(ctx, QUAD_PHOTO_W, QUAD_PHOTO_H);
    }
    
    ctx.restore();
    
    return canvas.toDataURL('image/png');
  }

  async function createStrip() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
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

    // 1. Фон
    if (currentColor === 'Logo' || currentColor === 'Date' || currentColor === 'White') {
      ctx.fillStyle = '#FFFFFF';
    } else if (currentColor === 'Black') {
      ctx.fillStyle = '#111010';
    } else if (currentColor === 'Red') {
      ctx.fillStyle = '#7D0002';
    } else if (currentColor === 'Cell_Red') {
      ctx.fillStyle = '#F2EFD9';
    } else if (currentColor === 'Cell_Black') {
      ctx.fillStyle = '#F5F4F2';
    } else if (currentColor === 'Point') {
      ctx.fillStyle = '#F5F4F2';
    }
    ctx.fillRect(0, 0, stripWidth, stripHeight);

    // 2. Паттерны
    if (currentColor === 'Cell_Red') {
      const sz = 12;
      for (let x = 0; x < stripWidth; x += sz) {
        for (let y = 0; y < stripHeight; y += sz) {
          if ((Math.floor(x/sz) + Math.floor(y/sz)) % 2 === 0) {
            ctx.fillStyle = '#7D0002';
            ctx.fillRect(x, y, sz, sz);
          }
        }
      }
    }
    if (currentColor === 'Cell_Black' || currentColor === 'Point') {
      ctx.fillStyle = '#111010';
      for (let x = 10; x < stripWidth; x += 12) {
        for (let y = 10; y < stripHeight; y += 12) {
          ctx.beginPath();
          ctx.arc(x, y, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // 3. Фотографии
    if (currentFrameType === 'quadrate') {
      for (let i = 0; i < 4; i++) {
        const img = new Image();
        img.src = capturedPhotos[i];
        await new Promise(res => { img.onload = res; });
        
        let xPos, yPos;
        if (i === 0) { xPos = marginSide; yPos = marginTop; }
        else if (i === 1) { xPos = marginSide + photoW + gap; yPos = marginTop; }
        else if (i === 2) { xPos = marginSide; yPos = marginTop + photoH + gap; }
        else { xPos = marginSide + photoW + gap; yPos = marginTop + photoH + gap; }
        
        ctx.drawImage(img, xPos, yPos, photoW, photoH);
      }
    } else {
      for (let i = 0; i < 3; i++) {
        const img = new Image();
        img.src = capturedPhotos[i];
        await new Promise(res => { img.onload = res; });
        const yPos = marginTop + i * (photoH + gap);
        ctx.drawImage(img, marginSide, yPos, photoW, photoH);
      }
    }

    // 4. Наложение рамки
    let framePath;
    if (currentColor === 'Logo') {
      framePath = `frames/Frame_${currentFrameType}_Logo.png`;
    } else if (currentColor === 'Date') {
      framePath = `frames/Frame_${currentFrameType}_White.png`;
    } else if (currentColor === 'White') {
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

    // 5. Дата (в самом конце, поверх рамки)
    if (currentColor === 'Date') {
      const fontSize = currentFrameType === 'quadrate' ? '64px' : '48px';
      const fontFamily = '"LiuJianMaoCao", "Comic Sans MS", cursive';
      
      try {
        if (document.fonts) {
           await document.fonts.load(`${fontSize} "LiuJianMaoCao"`);
        }
      } catch (e) {
        console.warn('Шрифт не найден');
      }
      
      const now = new Date();
      const dateStr = `${now.getDate()}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`;
      
      ctx.fillStyle = '#151516';
      ctx.font = `${fontSize} ${fontFamily}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      
      if (currentFrameType === 'quadrate') {
        ctx.fillText(dateStr, 820, stripHeight - 60);
      } else {
        ctx.fillText(dateStr, 132, stripHeight - 28);
      }
    }

    return canvas.toDataURL('image/png');
  }

  if (btnCapture) {
    btnCapture.addEventListener('click', async () => {
      if (btnCapture.disabled) return;
      btnCapture.disabled = true;
      capturedPhotos = [];

      const photosToTake = currentFrameType === 'quadrate' ? 4 : 3;

      for (let i = 0; i < photosToTake; i++) {
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
        if (i < photosToTake - 1) await wait(800);
      }

      stopCamera();
      finalStripDataUrl = await createStrip();
      resultImage.src = finalStripDataUrl;
      
      photoWrapper.classList.remove('animate', 'quadrate');
      
      if (currentFrameType === 'quadrate') {
        photoWrapper.classList.add('quadrate');
      }
      
      showScreen('result');
      
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
      link.download = `AprilStudio_${d}${m}${y}.png`;
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