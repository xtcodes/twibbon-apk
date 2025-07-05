// Final fixed script.js dengan logika tombol dan interaksi diperbaiki

const uploadInput = document.getElementById('upload');
const uploadBtn = document.getElementById('uploadBtn');
const twibbonInput = document.getElementById('twibbonInput');
const twibbonBtn = document.getElementById('twibbonBtn');
const downloadBtn = document.getElementById('download');
const resetBtn = document.getElementById('resetBtn');
const countdownText = document.getElementById('countdownText');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const placeholder = new Image();
placeholder.src = 'placeholder.png';

let photo = null;
let twibbon = new Image();
twibbon.src = 'twibbon.png';

let scale = 1;
let offsetX = 0;
let offsetY = 0;
let startX = 0;
let startY = 0;
let isDragging = false;
let lastDist = 0;

let twibbonAlpha = 1;
let targetAlpha = 1;
let animating = false;

let imageReady = false;
let hasDownloaded = false;

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (photo) {
    const imgW = photo.width * scale;
    const imgH = photo.height * scale;
    ctx.drawImage(photo, offsetX, offsetY, imgW, imgH);
  } else {
    const pw = placeholder.width;
    const ph = placeholder.height;
    const ratio = Math.min(canvas.width / pw, canvas.height / ph);
    const w = pw * ratio;
    const h = ph * ratio;
    const x = (canvas.width - w) / 2;
    const y = (canvas.height - h) / 2;
    ctx.globalAlpha = 0.5;
    ctx.drawImage(placeholder, x, y, w, h);
    ctx.globalAlpha = 1;
  }
  if (twibbon && twibbon.complete) {
    ctx.save();
    ctx.globalAlpha = twibbonAlpha;
    ctx.drawImage(twibbon, 0, 0, canvas.width, canvas.height);
    ctx.restore();
  }
}

function animateTwibbonAlpha() {
  if (animating) return;
  animating = true;
  function step() {
    const diff = targetAlpha - twibbonAlpha;
    if (Math.abs(diff) < 0.01) {
      twibbonAlpha = targetAlpha;
      draw();
      animating = false;
      return;
    }
    twibbonAlpha += diff * 0.1;
    draw();
    requestAnimationFrame(step);
  }
  step();
}

let hideTwibbonTimeout = null;
function showTwibbonLater() {
  clearTimeout(hideTwibbonTimeout);
  hideTwibbonTimeout = setTimeout(() => {
    targetAlpha = 1;
    animateTwibbonAlpha();
  }, 300);
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

uploadBtn.addEventListener('click', () => uploadInput.click());

uploadInput.addEventListener('change', function () {
  const file = uploadInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = function () {
      photo = img;
      scale = canvas.width / img.width;
      offsetX = 0;
      offsetY = 0;
      imageReady = true;
      hasDownloaded = false;
      draw();
      uploadBtn.style.display = 'none';
      twibbonBtn.style.display = 'inline-block';
      downloadBtn.style.display = 'inline-block';
      resetBtn.style.display = 'none';
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
});

twibbonBtn.addEventListener('click', () => twibbonInput.click());

twibbonInput.addEventListener('change', function () {
  const file = twibbonInput.files[0];
  if (!file || file.type !== 'image/png') {
    showToast('Twibbon harus berupa file PNG!');
    return;
  }
  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = function () {
      const testCanvas = document.createElement('canvas');
      testCanvas.width = img.width;
      testCanvas.height = img.height;
      const testCtx = testCanvas.getContext('2d');
      testCtx.drawImage(img, 0, 0);
      const pixels = testCtx.getImageData(0, 0, img.width, img.height).data;
      let hasTransparency = false;
      for (let i = 3; i < pixels.length; i += 4) {
        if (pixels[i] < 255) {
          hasTransparency = true;
          break;
        }
      }
      if (!hasTransparency) {
        showToast("Twibbon harus memiliki bagian transparan.");
        return;
      }
      twibbon = new Image();
      twibbon.src = e.target.result;
      twibbon.onload = () => {
        draw();
      };
      if (imageReady && !hasDownloaded) {
        downloadBtn.style.display = 'inline-block';
        resetBtn.style.display = 'none';
      }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
});

resetBtn.addEventListener('click', () => {
  photo = null;
  twibbon = new Image();
  twibbon.src = 'twibbon.png';
  twibbon.onload = () => draw();
  scale = 1;
  offsetX = 0;
  offsetY = 0;
  imageReady = false;
  hasDownloaded = false;
  uploadBtn.style.display = 'inline-block';
  twibbonBtn.style.display = 'none';
  downloadBtn.style.display = 'none';
  resetBtn.style.display = 'none';
  draw();
});

canvas.addEventListener('mousedown', (e) => {
  isDragging = true;
  startX = e.offsetX;
  startY = e.offsetY;
});
canvas.addEventListener('mousemove', (e) => {
  if (!isDragging || !photo) return;
  const dx = e.offsetX - startX;
  const dy = e.offsetY - startY;
  startX = e.offsetX;
  startY = e.offsetY;
  offsetX += dx;
  offsetY += dy;
  targetAlpha = 0.5;
  animateTwibbonAlpha();
  showTwibbonLater();
});
canvas.addEventListener('mouseup', () => isDragging = false);
canvas.addEventListener('mouseleave', () => isDragging = false);

canvas.addEventListener('touchstart', (e) => {
  if (e.touches.length === 1) {
    isDragging = true;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  } else if (e.touches.length === 2) {
    lastDist = getDist(e.touches[0], e.touches[1]);
  }
});
canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  if (!photo) return;
  if (e.touches.length === 1 && isDragging) {
    const dx = e.touches[0].clientX - startX;
    const dy = e.touches[0].clientY - startY;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    offsetX += dx;
    offsetY += dy;
    targetAlpha = 0.5;
    animateTwibbonAlpha();
    showTwibbonLater();
  } else if (e.touches.length === 2) {
    const newDist = getDist(e.touches[0], e.touches[1]);
    const zoom = newDist / lastDist;
    lastDist = newDist;
    const rect = canvas.getBoundingClientRect();
    const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
    const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
    const prevScale = scale;
    scale *= zoom;
    offsetX -= (centerX - offsetX) * (scale / prevScale - 1);
    offsetY -= (centerY - offsetY) * (scale / prevScale - 1);
    targetAlpha = 0.5;
    animateTwibbonAlpha();
    showTwibbonLater();
  }
}, { passive: false });
canvas.addEventListener('touchend', () => isDragging = false);

function getDist(p1, p2) {
  const dx = p1.clientX - p2.clientX;
  const dy = p1.clientY - p2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

downloadBtn.addEventListener('click', function () {
  if (!photo || !twibbon) {
    showToast("Silakan unggah gambar terlebih dahulu.");
    return;
  }

  let countdown = 15;
  downloadBtn.disabled = true;
  countdownText.textContent = `⏳ Mengunduh dalam ${countdown} detik...`;

  const interval = setInterval(() => {
    countdown--;
    if (countdown > 0) {
      countdownText.textContent = `⏳ Mengunduh dalam ${countdown} detik...`;
    } else {
      clearInterval(interval);
      countdownText.textContent = '';
      downloadBtn.disabled = false;

      // Proses export ke HD
      const exportSize = 1080;
      const exportCanvas = document.createElement('canvas');
      const exportCtx = exportCanvas.getContext('2d');
      exportCanvas.width = exportSize;
      exportCanvas.height = exportSize;

      const scaleFactor = exportSize / canvas.width;
      const imgW = photo.width * scale * scaleFactor;
      const imgH = photo.height * scale * scaleFactor;
      const x = offsetX * scaleFactor;
      const y = offsetY * scaleFactor;

      exportCtx.drawImage(photo, x, y, imgW, imgH);
      exportCtx.drawImage(twibbon, 0, 0, exportSize, exportSize);

      exportCtx.font = "bold 32px sans-serif";
      exportCtx.fillStyle = "rgba(255,255,255,0.8)";
      exportCtx.textAlign = "right";
      exportCtx.textBaseline = "bottom";
      exportCtx.fillText("#XTCODES", exportSize - 20, exportSize - 20);

      const link = document.createElement('a');
      link.download = 'twibboned-image-HD.png';
      link.href = exportCanvas.toDataURL('image/png');
      link.click();

      downloadBtn.style.display = 'none';
      resetBtn.style.display = 'inline-block';
      hasDownloaded = true;
    }
  }, 1000);
});

window.onload = () => {
  placeholder.onload = () => draw();
  if (placeholder.complete) draw();
};
