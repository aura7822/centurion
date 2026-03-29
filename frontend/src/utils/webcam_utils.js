// ============================================================
// The Centurion® — Webcam Utilities
// WebRTC face capture and base64 conversion
// ============================================================

export async function requestCameraAccess() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: 'user' },
      audio: false,
    });
    return { success: true, stream };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export function captureFrame(videoEl, quality = 0.85) {
  if (!videoEl) return null;
  const canvas = document.createElement('canvas');
  canvas.width  = videoEl.videoWidth  || 640;
  canvas.height = videoEl.videoHeight || 480;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(videoEl, 0, 0);
  return canvas.toDataURL('image/jpeg', quality);
}

export function captureMultipleFrames(videoEl, count = 3, delayMs = 500) {
  return new Promise((resolve) => {
    const frames = [];
    let i = 0;
    const interval = setInterval(() => {
      const frame = captureFrame(videoEl);
      if (frame) frames.push(frame);
      i++;
      if (i >= count) {
        clearInterval(interval);
        resolve(frames);
      }
    }, delayMs);
  });
}

export function stopStream(stream) {
  if (stream) stream.getTracks().forEach(t => t.stop());
}

export function takeScreenshot() {
  return new Promise((resolve) => {
    import('html2canvas').then(({ default: html2canvas }) => {
      html2canvas(document.body, { useCORS: true, scale: 1.5 }).then(canvas => {
        const url = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = `centurion-screenshot-${Date.now()}.png`;
        a.click();
        resolve(url);
      });
    });
  });
}

export function readAloud(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.rate = 0.95;
  utt.pitch = 1;
  window.speechSynthesis.speak(utt);
}

export function stopReadAloud() {
  if (window.speechSynthesis) window.speechSynthesis.cancel();
}
