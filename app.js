/**
 * Interactive Birthday Scrapbook Web Page Controller
 * Inspired by @digimemo.studio digital gift flipbooks
 */

document.addEventListener('DOMContentLoaded', () => {
  const audio = window.reelAudio;

  // State
  let currentPage = 1;
  const totalPages = 7;
  let isEnvelopeOpened = false;
  let isMusicPlaying = false;
  let areCandlesBlown = false;

  // Persistent Settings
  const defaultLetter = `Happy 7th Birthday to our friendship, and the happiest birthday to YOU! ♡\n\nSeven years. Since 2019, you’ve been my favorite person to share this life with. When I look back at the past seven years, every major milestone in my life has had your support behind it. Whenever I achieved something great, you were the very first person I wanted to share my success with. And whenever life got heavy or painful, you were always the safe, judgment-free space where I could vent, recharge, and be completely myself.\n\nYou know all my weird habits, all my quirks, all my dreams, and you’ve always stood by me as my biggest cheerleader. You bring so much positivity, laughter, and kindness into this world, and I’m so happy seeing you thrive, loved, and smiling.\n\nThank you for seven years of genuine, loyal friendship. You aren't just a great friend—you are family. I hope this new year brings you everything you've ever wished for: boundless joy, peace, success, and all the happiness in the world.`;

  const defaultState = {
    friendName: 'DIPA',
    passcode: '',
    letter: defaultLetter,
    audioPreset: 'music_box',
  };

  // Load from URL params or localStorage
  const urlParams = new URLSearchParams(window.location.search);
  const savedState = JSON.parse(localStorage.getItem('birthdayScrapbookSettings') || '{}');
  if (savedState.letter && (
    savedState.letter.includes('Today is all about celebrating you') ||
    savedState.letter.includes('flirt') ||
    savedState.letter.includes('Eight years') ||
    savedState.letter.includes('Happy 8th') ||
    savedState.letter.includes('Always in your corner')
  )) {
    savedState.letter = defaultLetter;
    localStorage.setItem('birthdayScrapbookSettings', JSON.stringify({ ...savedState, letter: defaultLetter }));
  }

  const state = {
    ...defaultState,
    ...savedState,
    friendName: urlParams.get('name') || savedState.friendName || defaultState.friendName,
  };

  // DOM Elements
  const envelopeOverlay = document.getElementById('envelopeOverlay');
  const envelopeContainer = document.getElementById('envelopeContainer');
  const waxSeal = document.getElementById('waxSeal');
  const inputPasscode = document.getElementById('inputPasscode');
  const btnOpenEnvelope = document.getElementById('btnOpenEnvelope');
  const envelopeName = document.getElementById('envelopeName');

  const btnPrevPage = document.getElementById('btnPrevPage');
  const btnNextPage = document.getElementById('btnNextPage');
  const pageCounterText = document.getElementById('pageCounterText');
  const pageDots = document.querySelectorAll('.page-dot');
  const pages = document.querySelectorAll('.scrapbook-page');
  const btnStartScrapbook = document.getElementById('btnStartScrapbook');
  const btnRestartBook = document.getElementById('btnRestartBook');

  const btnToggleMusic = document.getElementById('btnToggleMusic');
  const vinylDisk = document.getElementById('vinylDisk');
  const musicStatusText = document.getElementById('musicStatusText');
  const musicPlayBtn = document.getElementById('musicPlayBtn');
  const bgMusicAudio = document.getElementById('bgMusicAudio');

  if (bgMusicAudio) {
    bgMusicAudio.volume = 0.85;
    bgMusicAudio.addEventListener('play', () => setMusicUI(true));
    bgMusicAudio.addEventListener('pause', () => setMusicUI(false));
  }

  const cakeContainer = document.getElementById('cakeContainer');
  const btnBlowCandles = document.getElementById('btnBlowCandles');
  const btnRelightCandles = document.getElementById('btnRelightCandles');
  const flames = document.querySelectorAll('.flame');
  const wishGrantedBanner = document.getElementById('wishGrantedBanner');
  const candlePromptText = document.getElementById('candlePromptText');

  const couponCards = document.querySelectorAll('.coupon-card');

  // Edit Modal Elements
  const btnOpenEdit = document.getElementById('btnOpenEdit');
  const editModal = document.getElementById('editModal');
  const btnCloseEdit = document.getElementById('btnCloseEdit');
  const btnCancelEdit = document.getElementById('btnCancelEdit');
  const btnSaveEdit = document.getElementById('btnSaveEdit');
  const editFriendName = document.getElementById('editFriendName');
  const editPasscode = document.getElementById('editPasscode');
  const editLetter = document.getElementById('editLetter');
  const editAudioPreset = document.getElementById('editAudioPreset');
  const btnShare = document.getElementById('btnShare');

  // ================= 1. INITIALIZE CONTENT FROM STATE =================
  function applyState() {
    const friendUpper = (state.friendName || 'BESTIE').toUpperCase();
    const friendTitle = state.friendName || 'Bestie';

    if (envelopeName) envelopeName.textContent = `${friendUpper} ♡`;
    document.title = `Happy Birthday, ${friendTitle}! ♡ | Your Special Birthday Scrapbook`;

    const letterRecipient = document.getElementById('letterRecipientName');
    if (letterRecipient) letterRecipient.textContent = friendTitle;

    const letterBody = document.getElementById('letterBodyContent');
    if (letterBody && state.letter) {
      letterBody.innerHTML = state.letter
        .split('\n\n')
        .filter(Boolean)
        .map(p => `<p>${p}</p>`)
        .join('');
    }

    if (editFriendName) editFriendName.value = state.friendName;
    if (editPasscode) editPasscode.value = state.passcode;
    if (editLetter) editLetter.value = state.letter;
    if (editAudioPreset) editAudioPreset.value = state.audioPreset;

    if (audio) {
      audio.currentPreset = state.audioPreset;
    }
  }
  applyState();

  // ================= 2. AMBIENT BACKGROUND PARTICLES =================
  const ambientContainer = document.getElementById('ambientParticles');
  if (ambientContainer) {
    const symbols = ['♡', '🎀', '✨', '⭐', '🌸', '💖'];
    for (let i = 0; i < 28; i++) {
      const p = document.createElement('div');
      p.className = 'ambient-particle';
      p.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      p.style.left = `${Math.random() * 100}%`;
      p.style.animationDelay = `${Math.random() * 12}s`;
      p.style.animationDuration = `${9 + Math.random() * 8}s`;
      p.style.fontSize = `${16 + Math.random() * 20}px`;
      ambientContainer.appendChild(p);
    }
  }

  // ================= 3. ENVELOPE UNWRAPPING =================
  function openEnvelope() {
    if (isEnvelopeOpened) return;

    // Check passcode if one was set
    if (state.passcode && inputPasscode.value.trim() !== '') {
      if (inputPasscode.value.trim() !== state.passcode) {
        alert('Oops! Incorrect secret passcode. Try again or ask your best friend! ♡');
        inputPasscode.focus();
        return;
      }
    }

    isEnvelopeOpened = true;
    envelopeContainer.classList.add('opening');

    // Audio chime & music start
    try {
      if (audio) {
        audio.init();
        audio.playCelebrationCheer();
      }
    } catch (e) {
      console.warn('Cheer audio error:', e);
    }

    setTimeout(() => {
      playMusic();
    }, 450);

    // Trigger celebratory sparkles
    fireConfettiShower(100);

    // Fade out overlay after opening animation
    setTimeout(() => {
      envelopeOverlay.classList.add('opened');
    }, 900);
  }

  if (waxSeal) waxSeal.addEventListener('click', openEnvelope);
  if (envelopeContainer) envelopeContainer.addEventListener('click', (e) => {
    if (e.target !== inputPasscode) openEnvelope();
  });
  if (btnOpenEnvelope) btnOpenEnvelope.addEventListener('click', openEnvelope);
  if (inputPasscode) {
    inputPasscode.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') openEnvelope();
    });
  }

  // ================= 4. PAGE FLIPBOOK NAVIGATION =================
  function goToPage(pageNum) {
    if (pageNum < 1 || pageNum > totalPages) return;
    currentPage = pageNum;

    // Sound effect
    try {
      audio.playPageFlip();
    } catch (e) { }

    // Update active class
    pages.forEach(page => {
      const p = parseInt(page.dataset.page, 10);
      if (p === currentPage) {
        page.classList.add('active');
      } else {
        page.classList.remove('active');
      }
    });

    // Update dots
    pageDots.forEach(dot => {
      const g = parseInt(dot.dataset.goto, 10);
      if (g === currentPage) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });

    // Update counter text & button disabled states
    if (pageCounterText) {
      pageCounterText.textContent = `${currentPage} / ${totalPages}`;
    }

    if (btnPrevPage) btnPrevPage.disabled = (currentPage === 1);
    if (btnNextPage) btnNextPage.disabled = (currentPage === totalPages);

    // Smooth scroll to top of scrapbook viewport
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (btnPrevPage) btnPrevPage.addEventListener('click', () => goToPage(currentPage - 1));
  if (btnNextPage) btnNextPage.addEventListener('click', () => goToPage(currentPage + 1));
  if (btnStartScrapbook) btnStartScrapbook.addEventListener('click', () => goToPage(2));
  if (btnRestartBook) btnRestartBook.addEventListener('click', () => goToPage(1));

  pageDots.forEach(dot => {
    dot.addEventListener('click', () => {
      const target = parseInt(dot.dataset.goto, 10);
      goToPage(target);
    });
  });

  // Keyboard navigation
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') {
      goToPage(currentPage + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      goToPage(currentPage - 1);
    } else if (e.code === 'Space') {
      e.preventDefault();
      toggleMusic();
    }
  });

  // Mobile Touch Swipe Navigation
  let touchStartX = 0;
  let touchEndX = 0;
  window.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  window.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    const diff = touchEndX - touchStartX;
    if (Math.abs(diff) > 50) {
      if (diff < 0) {
        // Swiped Left -> Next Page
        goToPage(currentPage + 1);
      } else {
        // Swiped Right -> Prev Page
        goToPage(currentPage - 1);
      }
    }
  }, { passive: true });

  // ================= 5. BACKGROUND MUSIC CONTROLS =================
  function setMusicUI(playing) {
    isMusicPlaying = playing;
    if (isMusicPlaying) {
      if (vinylDisk) vinylDisk.classList.add('spinning');
      if (musicStatusText) musicStatusText.textContent = 'Playing... ♡';
      if (musicPlayBtn) musicPlayBtn.textContent = '❚❚';
    } else {
      if (vinylDisk) vinylDisk.classList.remove('spinning');
      if (musicStatusText) musicStatusText.textContent = 'Tap to Play';
      if (musicPlayBtn) musicPlayBtn.textContent = '▶';
    }
  }

  function playMusic() {
    if (audio) audio.init();
    if (bgMusicAudio && (state.audioPreset === 'music_box' || !state.audioPreset)) {
      bgMusicAudio.volume = 0.1;
      const p = bgMusicAudio.play();
      if (p !== undefined) {
        p.then(() => {
          setMusicUI(true);
        }).catch(err => {
          console.warn('HTML5 audio play blocked:', err);
          if (audio) {
            audio.startContinuousMusic();
            setMusicUI(true);
          }
        });
      } else {
        setMusicUI(true);
      }
    } else if (audio) {
      audio.startContinuousMusic();
      setMusicUI(true);
    }
  }

  function pauseMusic() {
    if (bgMusicAudio) {
      bgMusicAudio.pause();
    }
    if (audio) {
      audio.stopContinuousMusic();
    }
    setMusicUI(false);
  }

  function toggleMusic() {
    if (isMusicPlaying) {
      pauseMusic();
    } else {
      playMusic();
    }
  }

  if (btnToggleMusic) {
    btnToggleMusic.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMusic();
    });
  }

  // Seamless audio unlocker on user interaction
  function unlockAudioOnGesture() {
    if (audio) audio.init();
    if (isEnvelopeOpened && !isMusicPlaying && bgMusicAudio && bgMusicAudio.paused) {
      playMusic();
    }
  }
  document.addEventListener('pointerdown', unlockAudioOnGesture, { capture: true, passive: true });

  // ================= 6. INTERACTIVE BIRTHDAY CAKE & CANDLES =================
  function blowOutCandles() {
    if (areCandlesBlown) return;
    areCandlesBlown = true;

    // Extinguish flames
    flames.forEach(flame => {
      flame.classList.add('blown-out');
    });

    // Sound effect
    try {
      audio.playBlowCandles();
    } catch (e) { }

    // Show banner & fireworks
    setTimeout(() => {
      try {
        audio.playCelebrationCheer();
      } catch (e) { }

      if (wishGrantedBanner) wishGrantedBanner.style.display = 'block';
      if (candlePromptText) {
        candlePromptText.innerHTML = '✨ <strong>Your wish is on its way to the stars!</strong> Happy Birthday! 💖';
      }
      if (btnBlowCandles) btnBlowCandles.style.display = 'none';

      fireConfettiShower(180);
    }, 350);
  }

  function relightCandles() {
    areCandlesBlown = false;
    flames.forEach(flame => {
      flame.classList.remove('blown-out');
    });
    if (wishGrantedBanner) wishGrantedBanner.style.display = 'none';
    if (btnBlowCandles) btnBlowCandles.style.display = 'inline-flex';
    if (candlePromptText) {
      candlePromptText.innerHTML = '✨ Close your eyes, think of your sweetest birthday wish, then <strong>click the candles</strong> to blow them out!';
    }
    try {
      audio.playSparkleChime();
    } catch (e) { }
  }

  if (cakeContainer) cakeContainer.addEventListener('click', blowOutCandles);
  if (btnBlowCandles) btnBlowCandles.addEventListener('click', blowOutCandles);
  if (btnRelightCandles) btnRelightCandles.addEventListener('click', relightCandles);

  // ================= 7. FRIENDSHIP VOUCHERS / COUPONS =================
  couponCards.forEach(card => {
    const btn = card.querySelector('.btn-redeem');
    const claim = () => {
      if (card.classList.contains('redeemed')) return;
      card.classList.add('redeemed');
      try {
        audio.playStamp();
        audio.playSparkleChime();
      } catch (e) { }
      fireConfettiShower(35);
    };

    if (btn) btn.addEventListener('click', claim);
    card.addEventListener('click', claim);
  });

  // ================= 8. FULLSCREEN CONFETTI CANNON ENGINE =================
  const confettiCanvas = document.getElementById('confettiCanvas');
  const ctx = confettiCanvas.getContext('2d');
  let confettiPieces = [];
  let isAnimatingConfetti = false;

  function resizeConfetti() {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeConfetti);
  resizeConfetti();

  function fireConfettiShower(count = 120) {
    const colors = ['#ff758f', '#ff4d6d', '#ffd166', '#c8b6ff', '#a0c4ff', '#b9fbc0', '#fff'];
    const shapes = ['rect', 'circle', 'heart', 'ribbon'];

    for (let i = 0; i < count; i++) {
      confettiPieces.push({
        x: Math.random() * confettiCanvas.width,
        y: -20 - Math.random() * 200,
        vx: -3 + Math.random() * 6,
        vy: 3 + Math.random() * 6,
        size: 8 + Math.random() * 12,
        rotation: Math.random() * 360,
        rotSpeed: -8 + Math.random() * 16,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        life: 1.0,
      });
    }

    if (!isAnimatingConfetti) {
      isAnimatingConfetti = true;
      requestAnimationFrame(updateConfetti);
    }
  }

  function updateConfetti() {
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

    for (let i = confettiPieces.length - 1; i >= 0; i--) {
      const c = confettiPieces[i];
      c.x += c.vx;
      c.y += c.vy;
      c.rotation += c.rotSpeed;
      c.vx *= 0.99;

      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate((c.rotation * Math.PI) / 180);
      ctx.fillStyle = c.color;

      if (c.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, c.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (c.shape === 'heart') {
        ctx.font = `${c.size * 1.2}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('♡', 0, 0);
      } else {
        ctx.fillRect(-c.size / 2, -c.size / 3, c.size, c.size * 0.7);
      }

      ctx.restore();

      if (c.y > confettiCanvas.height + 40) {
        confettiPieces.splice(i, 1);
      }
    }

    if (confettiPieces.length > 0) {
      requestAnimationFrame(updateConfetti);
    } else {
      isAnimatingConfetti = false;
    }
  }

  // ================= 9. PERSONALIZE / EDIT MODAL =================
  if (btnOpenEdit) {
    btnOpenEdit.addEventListener('click', () => {
      editModal.style.display = 'flex';
    });
  }

  function closeModal() {
    editModal.style.display = 'none';
  }

  if (btnCloseEdit) btnCloseEdit.addEventListener('click', closeModal);
  if (btnCancelEdit) btnCancelEdit.addEventListener('click', closeModal);

  if (btnSaveEdit) {
    btnSaveEdit.addEventListener('click', () => {
      state.friendName = editFriendName.value.trim() || 'BESTIE';
      state.passcode = editPasscode.value.trim();
      state.letter = editLetter.value.trim();
      state.audioPreset = editAudioPreset.value;

      localStorage.setItem('birthdayScrapbookSettings', JSON.stringify(state));
      applyState();
      closeModal();

      try {
        audio.playSparkleChime();
      } catch (e) { }

      fireConfettiShower(50);
    });
  }

  // Close modal when clicking outside content
  window.addEventListener('click', (e) => {
    if (e.target === editModal) closeModal();
  });

  // ================= 10. SHARE BUTTON =================
  if (btnShare) {
    btnShare.addEventListener('click', async () => {
      const shareUrl = `${window.location.origin}${window.location.pathname}?name=${encodeURIComponent(state.friendName)}`;
      try {
        await navigator.clipboard.writeText(shareUrl);
        const originalText = btnShare.innerHTML;
        btnShare.innerHTML = '✅ <span class="btn-text">Link Copied!</span>';
        setTimeout(() => {
          btnShare.innerHTML = originalText;
        }, 2200);
      } catch (err) {
        prompt('Copy your birthday scrapbook link to share:', shareUrl);
      }
    });
  }
});
