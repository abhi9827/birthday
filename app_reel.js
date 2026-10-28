/**
 * Main Application Controller for Birthday Reel Studio
 */

document.addEventListener('DOMContentLoaded', async () => {
  const canvas = document.getElementById('reelCanvas');
  const renderer = new window.ReelRenderer(canvas);
  const audio = window.reelAudio;

  // UI Elements
  const btnPlayPause = document.getElementById('btnPlayPause');
  const btnRestart = document.getElementById('btnRestart');
  const playIcon = document.getElementById('playIcon');
  const pauseIcon = document.getElementById('pauseIcon');
  const timelineProgress = document.getElementById('timelineProgress');
  const timelineScrubber = document.getElementById('timelineScrubber');
  const timeDisplay = document.getElementById('timeDisplay');
  const sceneBadges = document.querySelectorAll('.scene-badge');

  // Input Controls
  const inputFriendName = document.getElementById('inputFriendName');
  const inputScene1 = document.getElementById('inputScene1');
  const inputScene2 = document.getElementById('inputScene2');
  const inputScene3 = document.getElementById('inputScene3');
  const inputScene4 = document.getElementById('inputScene4');
  const inputScene5 = document.getElementById('inputScene5');
  const inputScene6Line1 = document.getElementById('inputScene6Line1');
  const inputScene6Line2 = document.getElementById('inputScene6Line2');
  const inputScene6Line3 = document.getElementById('inputScene6Line3');

  // Audio Controls
  const audioPresetSelect = document.getElementById('audioPresetSelect');
  const customAudioUpload = document.getElementById('customAudioUpload');
  const volumeSlider = document.getElementById('volumeSlider');

  // Effects
  const sliderFilmGrain = document.getElementById('sliderFilmGrain');
  const sliderSparkles = document.getElementById('sliderSparkles');

  // Export
  const btnExportVideo = document.getElementById('btnExportVideo');
  const btnExportStill = document.getElementById('btnExportStill');
  const exportModal = document.getElementById('exportModal');
  const exportProgressFill = document.getElementById('exportProgressFill');
  const exportProgressText = document.getElementById('exportProgressText');
  const exportStatusText = document.getElementById('exportStatusText');

  // State
  let isPlaying = false;
  let currentTime = 0.0;
  const totalDuration = 30.0;
  let lastTimestamp = null;
  let isDraggingTimeline = false;
  let isExporting = false;

  // Initialize Assets
  await renderer.loadAssets();
  renderer.render(currentTime);

  // Playback Loop
  function tick(timestamp) {
    if (!lastTimestamp) lastTimestamp = timestamp;
    const dt = (timestamp - lastTimestamp) / 1000;
    lastTimestamp = timestamp;

    if (isPlaying && !isDraggingTimeline && !isExporting) {
      currentTime += dt;
      if (currentTime >= totalDuration) {
        currentTime = 0;
        audio.scheduleSong(0);
      }
      updateUI();
      renderer.render(currentTime);
    }

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  function updateUI() {
    // Update timeline
    const pct = (currentTime / totalDuration) * 100;
    timelineProgress.style.width = `${pct}%`;
    timelineScrubber.value = currentTime;

    // Time text
    const curSec = Math.floor(currentTime);
    const curFrac = Math.floor((currentTime % 1) * 10);
    const curFmt = `${curSec < 10 ? '0' : ''}${curSec}.${curFrac}s`;
    timeDisplay.textContent = `${curFmt} / 30.0s`;

    // Highlight active scene badge
    let activeScene = 1;
    if (currentTime >= 24) activeScene = 6;
    else if (currentTime >= 18) activeScene = 5;
    else if (currentTime >= 12) activeScene = 4;
    else if (currentTime >= 7) activeScene = 3;
    else if (currentTime >= 3) activeScene = 2;

    sceneBadges.forEach(badge => {
      const sceneNum = parseInt(badge.dataset.scene, 10);
      if (sceneNum === activeScene) {
        badge.classList.add('active');
      } else {
        badge.classList.remove('active');
      }
    });
  }

  function setPlayState(play) {
    isPlaying = play;
    if (isPlaying) {
      playIcon.style.display = 'none';
      pauseIcon.style.display = 'inline-block';
      audio.scheduleSong(currentTime);
    } else {
      playIcon.style.display = 'inline-block';
      pauseIcon.style.display = 'none';
      audio.stop();
    }
  }

  btnPlayPause.addEventListener('click', () => {
    setPlayState(!isPlaying);
  });

  btnRestart.addEventListener('click', () => {
    currentTime = 0;
    renderer.render(currentTime);
    updateUI();
    if (isPlaying) {
      audio.scheduleSong(0);
    }
  });

  // Timeline Scrubber
  timelineScrubber.addEventListener('input', (e) => {
    isDraggingTimeline = true;
    currentTime = parseFloat(e.target.value);
    renderer.render(currentTime);
    updateUI();
  });

  timelineScrubber.addEventListener('change', () => {
    isDraggingTimeline = false;
    if (isPlaying) {
      audio.scheduleSong(currentTime);
    }
  });

  // Scene click jumping
  sceneBadges.forEach(badge => {
    badge.addEventListener('click', () => {
      const scene = parseInt(badge.dataset.scene, 10);
      const times = { 1: 0.0, 2: 3.2, 3: 7.2, 4: 12.2, 5: 18.2, 6: 24.2 };
      currentTime = times[scene] || 0;
      renderer.render(currentTime);
      updateUI();
      if (isPlaying) {
        audio.scheduleSong(currentTime);
      }
    });
  });

  // Keyboard shortcut: Space to play/pause
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      setPlayState(!isPlaying);
    }
  });

  // Text Inputs Sync
  function syncInputs() {
    renderer.state.friendName = inputFriendName.value || 'BESTIE';
    renderer.state.scene1Text = inputScene1.value;
    renderer.state.scene2Text = inputScene2.value;
    renderer.state.scene3Text = inputScene3.value;
    renderer.state.scene4Text = inputScene4.value;
    renderer.state.scene5Text = inputScene5.value;
    renderer.state.scene6Line1 = inputScene6Line1.value;
    renderer.state.scene6Line2 = inputScene6Line2.value;
    renderer.state.scene6Line3 = inputScene6Line3.value;

    renderer.render(currentTime);
  }

  [
    inputFriendName, inputScene1, inputScene2, inputScene3,
    inputScene4, inputScene5, inputScene6Line1, inputScene6Line2, inputScene6Line3
  ].forEach(inp => {
    inp.addEventListener('input', syncInputs);
  });

  // Audio Controls
  audioPresetSelect.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val === 'custom') {
      customAudioUpload.click();
    } else {
      audio.currentPreset = val;
      if (isPlaying) {
        audio.scheduleSong(currentTime);
      }
    }
  });

  customAudioUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      audio.loadCustomAudio(file);
      audioPresetSelect.value = 'custom';
      if (isPlaying) {
        audio.scheduleSong(currentTime);
      }
    }
  });

  volumeSlider.addEventListener('input', (e) => {
    audio.setVolume(parseFloat(e.target.value));
  });

  // Effects Sliders
  sliderFilmGrain.addEventListener('input', (e) => {
    renderer.state.filmGrainIntensity = parseFloat(e.target.value);
    renderer.render(currentTime);
  });

  sliderSparkles.addEventListener('input', (e) => {
    renderer.state.sparkleDensity = parseFloat(e.target.value);
    renderer.render(currentTime);
  });

  // Photo Upload Handlers for Slots
  const photoSlots = document.querySelectorAll('.photo-upload-slot');
  photoSlots.forEach(slot => {
    const slotKey = slot.dataset.slot;
    const fileInput = slot.querySelector('input[type="file"]');
    const previewImg = slot.querySelector('.slot-preview');

    slot.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const dataUrl = ev.target.result;
          previewImg.src = dataUrl;
          renderer.setImageSlot(slotKey, dataUrl);
          renderer.render(currentTime);
        };
        reader.readAsDataURL(file);
      }
    });

    // Drag and Drop
    slot.addEventListener('dragover', (e) => {
      e.preventDefault();
      slot.classList.add('dragover');
    });
    slot.addEventListener('dragleave', () => {
      slot.classList.remove('dragover');
    });
    slot.addEventListener('drop', (e) => {
      e.preventDefault();
      slot.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        const reader = new FileReader();
        reader.onload = (ev) => {
          const dataUrl = ev.target.result;
          previewImg.src = dataUrl;
          renderer.setImageSlot(slotKey, dataUrl);
          renderer.render(currentTime);
        };
        reader.readAsDataURL(file);
      }
    });
  });

  // Download Current Frame as High-Res Instagram Story Still
  btnExportStill.addEventListener('click', () => {
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    const link = document.createElement('a');
    const friend = (renderer.state.friendName || 'bestie').toLowerCase().replace(/\s+/g, '_');
    link.download = `Birthday_Still_${friend}_${Math.floor(currentTime)}s.png`;
    link.href = dataUrl;
    link.click();
  });

  // ================= VIDEO EXPORT ENGINE (1080x1920) =================
  btnExportVideo.addEventListener('click', async () => {
    if (isExporting) return;
    setPlayState(false);
    isExporting = true;
    exportModal.style.display = 'flex';
    exportProgressFill.style.width = '0%';
    exportProgressText.textContent = '0%';
    exportStatusText.textContent = 'Preparing video stream & audio synthesis...';

    try {
      // Setup Canvas Stream at 30fps
      const canvasStream = canvas.captureStream(30);

      // Setup Web Audio recording destination
      const audioStream = audio.getAudioStream();
      const combinedTracks = [
        ...canvasStream.getVideoTracks(),
        ...audioStream.getAudioTracks()
      ];

      const combinedStream = new MediaStream(combinedTracks);

      // Determine best supported MIME type
      let mimeType = 'video/webm;codecs=vp9,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8,opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm';
        }
      }

      const recorder = new MediaRecorder(combinedStream, {
        mimeType: mimeType,
        videoBitsPerSecond: 12000000 // 12 Mbps for pristine Instagram 1080x1920 quality
      });

      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        exportStatusText.textContent = 'Finalizing Instagram Reel file...';
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const friend = (renderer.state.friendName || 'bestie').toLowerCase().replace(/\s+/g, '_');
        link.download = `Birthday_Reel_${friend}_1080x1920.webm`;
        link.href = url;
        link.click();

        exportStatusText.textContent = '✨ Done! Download started.';
        setTimeout(() => {
          exportModal.style.display = 'none';
          isExporting = false;
        }, 1500);
      };

      // Start recording
      recorder.start(100);

      // Start audio playback from 0.0s
      audio.scheduleSong(0);

      const fps = 30;
      const totalFrames = totalDuration * fps; // 900 frames
      let currentFrame = 0;

      // Render frames synchronously at 30 fps in real-time
      const recordStartTime = performance.now();
      const exportInterval = setInterval(() => {
        const elapsed = (performance.now() - recordStartTime) / 1000;
        currentTime = Math.min(totalDuration, elapsed);

        renderer.render(currentTime);

        const pct = Math.floor((currentTime / totalDuration) * 100);
        exportProgressFill.style.width = `${pct}%`;
        exportProgressText.textContent = `${pct}%`;

        // Scene status
        let sceneName = 'Scene 1: Special Day Intro';
        if (currentTime >= 24) sceneName = 'Scene 6: Grand Birthday Celebration 🎉';
        else if (currentTime >= 18) sceneName = 'Scene 5: Golden Hour Hero Portrait ✨';
        else if (currentTime >= 12) sceneName = 'Scene 4: Dreamy Scrapbook Collage 🧸';
        else if (currentTime >= 7) sceneName = 'Scene 3: Candid Memories & Photobooth 📸';
        else if (currentTime >= 3) sceneName = 'Scene 2: Animated Polaroids 🎀';

        exportStatusText.textContent = `Rendering ${sceneName} (${currentTime.toFixed(1)}s / 30.0s)...`;

        if (currentTime >= totalDuration) {
          clearInterval(exportInterval);
          audio.stop();
          recorder.stop();
        }
      }, 1000 / fps);

    } catch (err) {
      console.error('Export error:', err);
      exportStatusText.textContent = 'Export error: ' + err.message;
      setTimeout(() => {
        exportModal.style.display = 'none';
        isExporting = false;
      }, 3000);
    }
  });

  // Close modal button
  document.getElementById('btnCloseExportModal')?.addEventListener('click', () => {
    exportModal.style.display = 'none';
    isExporting = false;
  });
});
