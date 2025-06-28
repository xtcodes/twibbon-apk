const upload = document.getElementById('upload');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const downloadBtn = document.getElementById('download');

// Gambar twibbon dan placeholder
const twibbon = new Image();
twibbon.src = 'twibbon.png';

const placeholder = new Image();
placeholder.src = 'placeholder.png'; // Gambar default sebelum upload

// State
let photo = null;
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

// Fungsi menggambar
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (photo) {
    const imgW = photo.width * scale;
    const imgH = photo.height * scale;
    const x = offsetX;
    const y = offsetY;
    ctx.drawImage(photo, x, y, imgW, imgH);
  } else {
    // Tampilkan placeholder
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

  // Twibbon di atas segalanya
  ctx.save();
  ctx.globalAlpha = twibbonAlpha;
  ctx.drawImage(twibbon, 0, 0, canvas.width, canvas.height);
  ctx.restore();
}

// Animasi perubahan alpha
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

// Timeout untuk mengembalikan alpha twibbon
let hideTwibbonTimeout = null;
function showTwibbonLater() {
  clearTimeout(hideTwibbonTimeout);
  hideTwibbonTimeout = setTimeout(() => {
    targetAlpha = 1;
    animateTwibbonAlpha();
  }, 300);
}

// Upload gambar pengguna
upload.addEventListener('change', function () {
  const file = upload.files[0];
  const reader = new FileReader();

  reader.onload = function (e) {
    const img = new Image();
    img.onload = function () {
      photo = img;
      scale = canvas.width / img.width;
      offsetX = 0;
      offsetY = 0;
      draw();
    };
    img.src = e.target.result;
  };

  if (file) reader.readAsDataURL(file);
});

// Mouse interaction
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

// Touch interaction
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

// Hitung jarak dua titik (untuk pinch zoom)
function getDist(p1, p2) {
  const dx = p1.clientX - p2.clientX;
  const dy = p1.clientY - p2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

//
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = "toast show";
  setTimeout(() => {
    toast.className = toast.className.replace("show", "");
  }, 3000);
}


// Tombol download dengan validasi
downloadBtn.addEventListener('click', function () {
  if (!photo) {
    showToast("⚠️ Silakan unggah gambar terlebih dahulu.");
    return;
  }

  const link = document.createElement('a');
  link.download = 'twibboned-image.png';
  link.href = canvas.toDataURL();
  link.click();
});

// Gambar awal saat halaman dibuka
window.onload = () => {
  placeholder.onload = () => {
    draw();
  };
  if (placeholder.complete) {
    draw();
  }
};
