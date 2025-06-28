const upload = document.getElementById('upload');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const downloadBtn = document.getElementById('download');

// Load twibbon frame
const twibbon = new Image();
twibbon.src = 'twibbon.png'; // Gambar frame PNG transparan

upload.addEventListener('change', function () {
  const file = upload.files[0];
  const reader = new FileReader();

  reader.onload = function (e) {
    const img = new Image();
    img.onload = function () {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Draw uploaded photo
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      // Draw Twibbon frame on top
      ctx.drawImage(twibbon, 0, 0, canvas.width, canvas.height);
    };
    img.src = e.target.result;
  };

  if (file) {
    reader.readAsDataURL(file);
  }
});

downloadBtn.addEventListener('click', function () {
  const link = document.createElement('a');
  link.download = 'twibboned-image.png';
  link.href = canvas.toDataURL();
  link.click();
});
