const uploadInput = document.getElementById('upload');
const uploadBtn = document.getElementById('uploadBtn');
const twibbonInput = document.getElementById('twibbonInput');
const twibbonBtn = document.getElementById('twibbonBtn');
const downloadBtn = document.getElementById('download');
const resetBtn = document.getElementById('resetBtn');
const countdownText = document.getElementById('countdownText');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let photo = null;
let twibbon = new Image();
twibbon.src = 'twibbon.png';

let scale = 1;
let offsetX = 0;
let offsetY = 0;
let isDragging = false;
let startX = 0;
let startY = 0;
let lastDist = 0;
let imageDownloaded = false;

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (photo) {
    const imgW = photo.width * scale;
    const imgH = photo.height * scale;
    ctx.drawImage(photo, offsetX, offsetY, imgW, imgH);
  }
  if (twibbon && twibbon.complete) {
    ctx.drawImage(twibbon, 0, 0, canvas.width, canvas.height);
  }
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

// Upload gambar utama
uploadBtn.addEventListener("click", () => uploadInput.click());
uploadInput.addEventListener("change", function () {
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
      draw();
      downloadBtn.style.display = 'inline-block';
      resetBtn.style.display = 'none';
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
});

// Upload twibbon
twibbonBtn.addEventListener("click", () => twibbonInput.click());
twibbonInput.addEventListener("change", function () {
  const file = twibbonInput.files[0];
  if (!file || file.type !== 'image/png') {
    showToast("❌ Twibbon harus PNG transparan!");
    return;
  }
  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = function () {
      // Validasi transparan
      const tmp = document.createElement("canvas");
      tmp.width = img.width;
      tmp.height = img.height;
      const tmpCtx = tmp.getContext("2d");
      tmpCtx.drawImage(img, 0, 0);
      const pixels = tmpCtx.getImageData(0, 0, img.width, img.height).data;
      let transparent = false;
      for (let i = 3; i < pixels.length; i += 4) {
        if (pixels[i] < 255) {
          transparent = true;
          break;
        }
      }
      if (!transparent) {
        showToast("❌ Twibbon harus memiliki bagian transparan!");
        return;
      }
      twibbon = img;
      draw();
      downloadBtn.style.display = 'inline-block';
      resetBtn.style.display = 'none';
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
});

// Reset tombol
resetBtn.addEventListener("click", () => {
  photo = null;
  twibbon.src = 'twibbon.png';
  scale = 1;
  offsetX = 0;
  offsetY = 0;
  imageDownloaded = false;
  draw();
  downloadBtn.style.display = 'none';
  resetBtn.style.display = 'none';
});

// Unduh hasil
downloadBtn.addEventListener("click", () => {
  if (!photo || !twibbon) {
    showToast("⚠️ Silakan unggah gambar terlebih dahulu.");
    return;
  }

  let countdown = 15;
  downloadBtn.disabled = true;
  countdownText.textContent = `⏳ Mengunduh dalam ${countdown} detik...`;

  const timer = setInterval(() => {
    countdown--;
    countdownText.textContent = `⏳ Mengunduh dalam ${countdown} detik...`;
    if (countdown <= 0) {
      clearInterval(timer);
      countdownText.textContent = '';
      downloadBtn.disabled = false;
      downloadBtn.style.display = 'none';
      resetBtn.style.display = 'inline-block';
      imageDownloaded = true;

      // Export HD
      const exportSize = 1080;
      const exportCanvas = document.createElement('canvas');
      const exportCtx = exportCanvas.getContext('2d');
      exportCanvas.width = exportSize;
      exportCanvas.height = exportSize;

      const factor = exportSize / canvas.width;
      exportCtx.drawImage(photo, offsetX * factor, offsetY * factor, photo.width * scale * factor, photo.height * scale * factor);
      exportCtx.drawImage(twibbon, 0, 0, exportSize, exportSize);

      // Watermark
      exportCtx.font = "bold 32px sans-serif";
      exportCtx.fillStyle = "rgba(255,255,255,0.7)";
      exportCtx.textAlign = "right";
      exportCtx.fillText("#XTCODES", exportSize - 20, exportSize - 20);

      const link = document.createElement('a');
      link.download = 'twibboned-HD.png';
      link.href = exportCanvas.toDataURL('image/png');
      link.click();
    }
  }, 1000);
});

// Geser dan zoom
canvas.addEventListener('mousedown', e => {
  isDragging = true;
  startX = e.offsetX;
  startY = e.offsetY;
});
canvas.addEventListener('mousemove', e => {
  if (isDragging && photo) {
    offsetX += e.offsetX - startX;
    offsetY += e.offsetY - startY;
    startX = e.offsetX;
    startY = e.offsetY;
    draw();
  }
});
canvas.addEventListener('mouseup', () => isDragging = false);
canvas.addEventListener('mouseleave', () => isDragging = false);

// Zoom 2 jari mobile
canvas.addEventListener('touchstart', e => {
  if (e.touches.length === 1) {
    isDragging = true;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  } else if (e.touches.length === 2) {
    lastDist = getDist(e.touches[0], e.touches[1]);
  }
}, { passive: false });

canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  if (!photo) return;

  if (e.touches.length === 1 && isDragging) {
    const dx = e.touches[0].clientX - startX;
    const dy = e.touches[0].clientY - startY;
    offsetX += dx;
    offsetY += dy;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    draw();
  } else if (e.touches.length === 2) {
    const newDist = getDist(e.touches[0], e.touches[1]);
    const zoom = newDist / lastDist;
    const rect = canvas.getBoundingClientRect();
    const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
    const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;

    const prevScale = scale;
    scale *= zoom;
    offsetX -= (cx - offsetX) * (scale / prevScale - 1);
    offsetY -= (cy - offsetY) * (scale / prevScale - 1);
    lastDist = newDist;
    draw();
  }
}, { passive: false });

canvas.addEventListener('touchend', () => {
  isDragging = false;
});

function getDist(p1, p2) {
  const dx = p1.clientX - p2.clientX;
  const dy = p1.clientY - p2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

window.onload = () => draw();
