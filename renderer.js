/**
 * Reel Canvas Renderer (1080 x 1920 @ 30/60fps)
 * Renders the 6 scenes with scrapbook aesthetics, Polaroid frames,
 * washi tape, cute doodles, sparkles, film grain, and smooth animations.
 */

class ReelRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = 1080;
    this.height = 1920;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Configurable state
    this.state = {
      friendName: 'EMMA',
      scene1Text: 'someone very special was born… ♡',
      scene2Text: 'and the world got a little more beautiful 🎀',
      scene3Text: 'my favourite memories have you in them ♡',
      scene4Text: 'thank you for being YOU 🧸',
      scene5Text: 'you deserve every beautiful thing life has to offer.',
      scene6Line1: 'HAPPY BIRTHDAY, {NAME} ♡',
      scene6Line2: 'stay cute, stay happy, and never stop being you 🎂',
      scene6Line3: 'love you always ♡',
      filmGrainIntensity: 0.18,
      sparkleDensity: 1.0,
      colorTheme: 'dreamy_pastel', // 'dreamy_pastel' | 'strawberry_cream' | 'lavender_sky'
    };

    // Images repository
    this.images = {
      friend_lake: null,
      friend_sunset: null,
      friend_saree: null,
      friend_glowing_hero: null,
      friend_bw_smile: null,
      cute_cafe: null,
      candid_picnic: null,
      funny_candid: null,
      teddy_bear: null,
      hero_portrait: null,
      birthday_cake: null,
      stickers_sheet: null,
    };

    // Sparkles and confetti particles
    this.sparkles = [];
    this.confetti = [];
    this.floatingHearts = [];
    this.initParticles();

    // Film grain pre-generated noise pattern for maximum performance
    this.grainCanvas = document.createElement('canvas');
    this.grainCanvas.width = 512;
    this.grainCanvas.height = 512;
    this.generateGrainPattern();

    this.loaded = false;
  }

  initParticles() {
    // 60 twinkling star sparkles
    this.sparkles = [];
    for (let i = 0; i < 70; i++) {
      this.sparkles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: 8 + Math.random() * 22,
        speed: 0.5 + Math.random() * 1.5,
        phase: Math.random() * Math.PI * 2,
        color: ['#fff', '#ffe5ec', '#ffccd5', '#e8dff5', '#fef9c3'][Math.floor(Math.random() * 5)],
      });
    }

    // 40 floating watercolor hearts
    this.floatingHearts = [];
    for (let i = 0; i < 45; i++) {
      this.floatingHearts.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: 16 + Math.random() * 32,
        speedY: 40 + Math.random() * 80,
        swaySpeed: 1 + Math.random() * 2,
        swayAmount: 20 + Math.random() * 40,
        phase: Math.random() * Math.PI * 2,
        color: ['rgba(255,182,193,0.65)', 'rgba(255,209,220,0.7)', 'rgba(232,223,245,0.75)', 'rgba(254,205,211,0.6)'][Math.floor(Math.random() * 4)],
      });
    }

    // 120 confetti pieces for birthday celebration in Scene 6
    this.confetti = [];
    for (let i = 0; i < 140; i++) {
      this.confetti.push({
        x: Math.random() * this.width,
        y: -100 - Math.random() * 1200,
        width: 12 + Math.random() * 18,
        height: 8 + Math.random() * 12,
        speedY: 180 + Math.random() * 260,
        speedX: -40 + Math.random() * 80,
        rotation: Math.random() * 360,
        rotSpeed: -180 + Math.random() * 360,
        color: ['#ffb3c1', '#c8b6ff', '#ffd166', '#a0c4ff', '#b9fbc0', '#ffcbf2'][Math.floor(Math.random() * 6)],
        shape: Math.random() > 0.4 ? 'rect' : 'circle',
      });
    }
  }

  generateGrainPattern() {
    const ctx = this.grainCanvas.getContext('2d');
    const imgData = ctx.createImageData(512, 512);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const v = Math.random() * 255;
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
      data[i + 3] = 40; // semi-transparent
    }
    ctx.putImageData(imgData, 0, 0);
  }

  async loadAssets() {
    const assetList = [
      { key: 'friend_lake', src: 'assets/friend_lake.jpg' },
      { key: 'friend_sunset', src: 'assets/friend_sunset.jpg' },
      { key: 'friend_saree', src: 'assets/friend_saree.jpg' },
      { key: 'friend_glowing_hero', src: 'assets/friend_glowing_hero.jpg' },
      { key: 'friend_bw_smile', src: 'assets/friend_bw_smile.jpg' },
      { key: 'cute_cafe', src: 'assets/friend_lake.jpg' },
      { key: 'candid_picnic', src: 'assets/friend_sunset.jpg' },
      { key: 'funny_candid', src: 'assets/friend_saree.jpg' },
      { key: 'hero_portrait', src: 'assets/friend_glowing_hero.jpg' },
      { key: 'teddy_bear', src: 'assets/teddy_bear.jpg' },
      { key: 'birthday_cake', src: 'assets/birthday_cake.jpg' },
      { key: 'stickers_sheet', src: 'assets/stickers_sheet.jpg' },
    ];

    const promises = assetList.map(item => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          this.images[item.key] = img;
          resolve();
        };
        img.onerror = () => {
          console.warn(`Could not load ${item.src}, creating fallback`);
          resolve();
        };
        img.src = item.src;
      });
    });

    await Promise.all(promises);
    this.loaded = true;
  }

  setImageSlot(slotKey, imageElementOrDataUrl) {
    const applyImg = (img) => {
      this.images[slotKey] = img;
      if (slotKey === 'friend_lake') this.images.cute_cafe = img;
      if (slotKey === 'friend_sunset') this.images.candid_picnic = img;
      if (slotKey === 'friend_saree') this.images.funny_candid = img;
      if (slotKey === 'friend_glowing_hero') this.images.hero_portrait = img;
      if (slotKey === 'cute_cafe') this.images.friend_lake = img;
      if (slotKey === 'candid_picnic') this.images.friend_sunset = img;
      if (slotKey === 'funny_candid') this.images.friend_saree = img;
      if (slotKey === 'hero_portrait') this.images.friend_glowing_hero = img;
    };

    if (typeof imageElementOrDataUrl === 'string') {
      const img = new Image();
      img.onload = () => {
        applyImg(img);
      };
      img.src = imageElementOrDataUrl;
    } else {
      applyImg(imageElementOrDataUrl);
    }
  }

  // Easing utilities
  easeInOutCubic(x) {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  }
  easeOutBack(x) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  }
  easeOutQuad(x) {
    return 1 - (1 - x) * (1 - x);
  }

  /**
   * Main Render function for any timestamp (0.0s to 30.0s)
   */
  render(currentTime) {
    const ctx = this.ctx;
    const t = Math.max(0, Math.min(30.0, currentTime));

    // Clear
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Draw Dreamy Background
    this.drawBackground(ctx, t);

    // 2. Draw Floating Hearts and ambient particles (common across scenes)
    this.drawFloatingHearts(ctx, t);

    // 3. Render Specific Scene Content
    if (t < 3.0) {
      // Scene 1 (0–3s): “someone very special was born… ♡”
      this.renderScene1(ctx, t);
    } else if (t >= 3.0 && t < 7.0) {
      // Scene 2 (3–7s): Cute photos in animated Polaroid frames: “and the world got a little more beautiful 🎀”
      this.renderScene2(ctx, t - 3.0);
    } else if (t >= 7.0 && t < 12.0) {
      // Scene 3 (7–12s): Happy candid moments & photobooth: “my favourite memories have you in them ♡”
      this.renderScene3(ctx, t - 7.0);
    } else if (t >= 12.0 && t < 18.0) {
      // Scene 4 (12–18s): Scrapbook collage with teddy bear: “thank you for being YOU 🧸”
      this.renderScene4(ctx, t - 12.0);
    } else if (t >= 18.0 && t < 24.0) {
      // Scene 5 (18–24s): Most meaningful photo, soft glow & warm lighting: “you deserve every beautiful thing life has to offer.”
      this.renderScene5(ctx, t - 18.0);
    } else {
      // Scene 6 (24–30s): Grand Birthday Finale! Animated card, cake, candles, ribbons, confetti:
      // “HAPPY BIRTHDAY, [FRIEND'S NAME] ♡” -> “stay cute, stay happy...” -> “love you always ♡”
      this.renderScene6(ctx, t - 24.0);
    }

    // 4. Draw Twinkling Sparkles on Top
    this.drawSparkles(ctx, t);

    // 5. Apply Soft Film Grain & Dreamy Vignette Overlay
    this.drawFilmGrain(ctx, t);
    this.drawDreamyVignette(ctx);
  }

  drawBackground(ctx, t) {
    // Soft dreamy gradient wash that shifts subtly between scenes
    const grad = ctx.createLinearGradient(0, 0, this.width, this.height);
    if (t < 7) {
      grad.addColorStop(0, '#fde2e4'); // pastel pink
      grad.addColorStop(0.5, '#fff1e6'); // warm cream
      grad.addColorStop(1, '#e8dff5'); // soft lavender
    } else if (t < 18) {
      grad.addColorStop(0, '#e8dff5'); // lavender
      grad.addColorStop(0.5, '#ffe5ec'); // pastel rose
      grad.addColorStop(1, '#d7e3fc'); // baby blue
    } else if (t < 24) {
      // Scene 5: warm sunset golden hour glow
      grad.addColorStop(0, '#ffe5ec');
      grad.addColorStop(0.5, '#faedcd'); // soft warm honey cream
      grad.addColorStop(1, '#e8dff5');
    } else {
      // Scene 6: vibrant pastel celebration
      grad.addColorStop(0, '#ffe5ec');
      grad.addColorStop(0.3, '#fdf0d5');
      grad.addColorStop(0.7, '#e8dff5');
      grad.addColorStop(1, '#d7e3fc');
    }

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Subtle scrapbook grid / dots pattern
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.5;
    const gridSize = 60;
    ctx.beginPath();
    for (let x = 0; x < this.width; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
    }
    for (let y = 0; y < this.height; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  drawFloatingHearts(ctx, t) {
    ctx.save();
    this.floatingHearts.forEach((h, i) => {
      const yPos = (h.y - (t * h.speedY)) % (this.height + 100);
      const actualY = yPos < -50 ? this.height + 50 : yPos;
      const actualX = h.x + Math.sin(t * h.swaySpeed + h.phase) * h.swayAmount;

      ctx.fillStyle = h.color;
      this.drawHeart(ctx, actualX, actualY, h.size);
    });
    ctx.restore();
  }

  drawHeart(ctx, x, y, size) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    const topCurveHeight = size * 0.3;
    ctx.moveTo(0, topCurveHeight);
    ctx.bezierCurveTo(0, 0, -size / 2, 0, -size / 2, topCurveHeight);
    ctx.bezierCurveTo(-size / 2, (size + topCurveHeight) / 2, 0, size, 0, size * 1.15);
    ctx.bezierCurveTo(0, size, size / 2, (size + topCurveHeight) / 2, size / 2, topCurveHeight);
    ctx.bezierCurveTo(size / 2, 0, 0, 0, 0, topCurveHeight);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  drawSparkles(ctx, t) {
    if (this.state.sparkleDensity <= 0) return;
    ctx.save();
    this.sparkles.forEach((s) => {
      const alpha = 0.3 + 0.7 * Math.sin(t * 3.5 * s.speed + s.phase);
      if (alpha <= 0.05) return;

      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.scale(1 + 0.3 * Math.sin(t * 4 + s.phase), 1 + 0.3 * Math.sin(t * 4 + s.phase));
      ctx.fillStyle = s.color;
      ctx.globalAlpha = alpha * this.state.sparkleDensity;

      // Draw 4-point star
      const r = s.size;
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.quadraticCurveTo(0, 0, r, 0);
      ctx.quadraticCurveTo(0, 0, 0, r);
      ctx.quadraticCurveTo(0, 0, -r, 0);
      ctx.quadraticCurveTo(0, 0, 0, -r);
      ctx.fill();
      ctx.restore();
    });
    ctx.restore();
  }

  // ================= SCENE 1 (0 - 3s) =================
  renderScene1(ctx, t) {
    // Fade in
    const alpha = Math.min(1, t / 0.8);
    ctx.save();
    ctx.globalAlpha = alpha;

    // Glowing aura circle in the center
    const pulse = 1 + 0.05 * Math.sin(t * 3);
    const radGrad = ctx.createRadialGradient(this.width / 2, this.height * 0.48, 50, this.width / 2, this.height * 0.48, 480 * pulse);
    radGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
    radGrad.addColorStop(0.5, 'rgba(255, 225, 235, 0.5)');
    radGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(this.width / 2, this.height * 0.48, 480 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Cute decorative floral doodles & bow in the center
    this.drawDoodleBow(ctx, this.width / 2, this.height * 0.38, 80);

    // Handwritten Romantic Text: “someone very special was born… ♡”
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Subtitle / Intro tag
    ctx.font = '600 36px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#9d7b88';
    ctx.letterSpacing = '6px';
    ctx.fillText('✨ A SPECIAL DAY ✨', this.width / 2, this.height * 0.45);

    // Main script line
    ctx.font = 'italic 700 78px "Caveat", "Playfair Display", cursive';
    ctx.fillStyle = '#4a2838';
    ctx.letterSpacing = '2px';

    // Gentle floating scale
    const textScale = 1 + 0.02 * Math.sin(t * 2);
    ctx.save();
    ctx.translate(this.width / 2, this.height * 0.53);
    ctx.scale(textScale, textScale);
    ctx.shadowColor = 'rgba(255, 182, 193, 0.6)';
    ctx.shadowBlur = 18;
    ctx.fillText(this.state.scene1Text, 0, 0);
    ctx.restore();

    // Cute doodle stars around text
    this.drawCuteDoodleStar(ctx, this.width / 2 - 380, this.height * 0.51, 32, '#ff8fa3');
    this.drawCuteDoodleStar(ctx, this.width / 2 + 380, this.height * 0.54, 38, '#c8b6ff');

    ctx.restore();
  }

  // ================= SCENE 2 (3 - 7s) =================
  renderScene2(ctx, t) {
    // Polaroid Entrance with bouncy spring
    const prog = Math.min(1, t / 0.9);
    const ease = this.easeOutBack(prog);

    // Polaroid 1 (Lake portrait) - tilted -4°
    const p1Y = 720 - (1 - ease) * 500;
    const p1Rot = -0.06; // ~ -3.5 deg
    this.drawPolaroid(ctx, {
      x: 360,
      y: p1Y,
      width: 480,
      height: 560,
      rotation: p1Rot,
      img: this.images.friend_lake || this.images.cute_cafe,
      caption: 'sunny days & happiest smiles 🌊 ♡',
      tapeColor: 'rgba(255, 209, 220, 0.85)',
      tapeAngle: -0.15,
      focusY: 0.3,
    });

    // Polaroid 2 (B&W candid smile) - drops in slightly later at t > 0.35s
    const prog2 = Math.min(1, Math.max(0, (t - 0.35) / 0.85));
    const ease2 = this.easeOutBack(prog2);
    const p2Y = 1120 - (1 - ease2) * 500;
    const p2Rot = 0.05; // ~ +3 deg
    this.drawPolaroid(ctx, {
      x: 720,
      y: p2Y,
      width: 460,
      height: 540,
      rotation: p2Rot,
      img: this.images.friend_bw_smile || this.images.candid_picnic,
      caption: 'that laugh that lights up everything ✨',
      tapeColor: 'rgba(200, 182, 255, 0.85)',
      tapeAngle: 0.18,
      focusY: 0.35,
    });

    // Cute decorative stickers
    if (t > 0.8) {
      this.drawDoodleBow(ctx, 540, 920, 75);
      this.drawCuteStamp(ctx, 880, 720, 110, 'PURE JOY');
    }

    // Text Banner at bottom: “and the world got a little more beautiful 🎀”
    const textAlpha = Math.min(1, Math.max(0, (t - 0.5) / 0.7));
    ctx.save();
    ctx.globalAlpha = textAlpha;

    // Pastel pill badge
    const badgeY = 1640;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.shadowColor = 'rgba(74, 40, 56, 0.12)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 8;
    this.roundRect(ctx, 120, badgeY - 65, 840, 130, 45, true, false);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 50px "Caveat", "Playfair Display", cursive';
    ctx.fillStyle = '#4a2838';
    ctx.shadowBlur = 0;
    ctx.fillText(this.state.scene2Text, 540, badgeY);

    ctx.restore();
  }

  // ================= SCENE 3 (7 - 12s) =================
  renderScene3(ctx, t) {
    const prog = Math.min(1, t / 0.8);
    const ease = this.easeOutBack(prog);

    // Photobooth Strip (Left side) with 3 real candid poses
    const stripX = 300 - (1 - ease) * 400;
    const stripY = 880;
    const stripRot = -0.04;
    this.drawPhotoboothStrip(
      ctx,
      stripX,
      stripY,
      stripRot,
      this.images.friend_bw_smile,
      this.images.friend_saree,
      this.images.friend_lake
    );

    // Graceful Saree Polaroid (Right side)
    const prog2 = Math.min(1, Math.max(0, (t - 0.3) / 0.8));
    const ease2 = this.easeOutBack(prog2);
    const pX = 760 + (1 - ease2) * 400;
    const pY = 1000;
    const pRot = 0.06;
    this.drawPolaroid(ctx, {
      x: pX,
      y: pY,
      width: 480,
      height: 570,
      rotation: pRot,
      img: this.images.friend_saree || this.images.funny_candid,
      caption: 'graceful & glowing always 🌸',
      tapeColor: 'rgba(255, 179, 193, 0.85)',
      tapeAngle: 0.12,
      focusY: 0.3,
    });

    // Cute doodle stickers: smiley, hearts, flower
    this.drawDaisy(ctx, 530, 680, 48);
    this.drawDaisy(ctx, 950, 1350, 42);
    this.drawCuteDoodleHeart(ctx, 480, 1180, 45, '#fb6f92');

    // Title / Text: “my favourite memories have you in them ♡”
    const textAlpha = Math.min(1, Math.max(0, (t - 0.4) / 0.6));
    ctx.save();
    ctx.globalAlpha = textAlpha;

    // Header badge
    const headerY = 320;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.shadowColor = 'rgba(74, 40, 56, 0.1)';
    ctx.shadowBlur = 20;
    this.roundRect(ctx, 110, headerY - 60, 860, 120, 40, true, false);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 52px "Caveat", "Playfair Display", cursive';
    ctx.fillStyle = '#4a2838';
    ctx.shadowBlur = 0;
    ctx.fillText(this.state.scene3Text, 540, headerY);

    ctx.restore();
  }

  // ================= SCENE 4 (12 - 18s) =================
  renderScene4(ctx, t) {
    const prog = Math.min(1, t / 0.8);
    const ease = this.easeOutBack(prog);

    // Scrapbook Torn Paper Card in Center
    ctx.save();
    ctx.translate(540, 920);
    ctx.scale(ease, ease);

    // Card background with paper drop shadow
    ctx.shadowColor = 'rgba(74, 40, 56, 0.15)';
    ctx.shadowBlur = 35;
    ctx.shadowOffsetY = 15;
    ctx.fillStyle = '#fffdf9';
    this.roundRect(ctx, -450, -620, 900, 1240, 36, true, false);

    // Card inner border with pastel dashed stitching
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#f3c6d3';
    ctx.lineWidth = 3;
    ctx.setLineDash([12, 10]);
    this.roundRect(ctx, -420, -590, 840, 1180, 24, false, true);
    ctx.setLineDash([]);

    // Washi tape on top edges
    this.drawWashiTape(ctx, -260, -640, 220, 45, -0.06, 'rgba(255, 209, 220, 0.9)');
    this.drawWashiTape(ctx, 240, -640, 200, 45, 0.08, 'rgba(200, 182, 255, 0.9)');

    // Top memory photo (Sunset Silhouette in water) inside the scrapbook frame
    const scrapbookPhoto = this.images.friend_sunset || this.images.candid_picnic;
    if (scrapbookPhoto) {
      ctx.save();
      ctx.translate(0, -220);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0,0,0,0.1)';
      ctx.shadowBlur = 15;
      this.roundRect(ctx, -340, -250, 680, 500, 18, true, false);
      ctx.clip();
      this.drawImageCover(ctx, scrapbookPhoto, -320, -230, 640, 460, 0.35);
      ctx.restore();
    }

    // Cute Fluffy Teddy Bear Sticker (Bottom Left)
    const teddyBounce = 1 + 0.03 * Math.sin(t * 3);
    ctx.save();
    ctx.translate(-180, 260);
    ctx.scale(teddyBounce, teddyBounce);
    if (this.images.teddy_bear) {
      ctx.shadowColor = 'rgba(0,0,0,0.12)';
      ctx.shadowBlur = 20;
      this.drawImageCover(ctx, this.images.teddy_bear, -170, -170, 340, 340);
    }
    ctx.restore();

    // Scrapbook Stamp on Bottom Right
    this.drawCuteStamp(ctx, 230, 220, 140, 'BESTIE ♡');

    // Text: “thank you for being YOU 🧸”
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 58px "Caveat", "Playfair Display", cursive';
    ctx.fillStyle = '#4a2838';
    ctx.fillText(this.state.scene4Text, 0, 490);

    ctx.restore();
  }

  // ================= SCENE 5 (18 - 24s) =================
  renderScene5(ctx, t) {
    // Meaningful Photo Hero! Soft romantic glow, warm golden lighting, Ken Burns slow pan/zoom
    const prog = Math.min(1, t / 1.0);
    const alpha = Math.min(1, t / 0.7);

    // Warm golden ambient illumination
    const glow = ctx.createRadialGradient(this.width / 2, this.height * 0.44, 100, this.width / 2, this.height * 0.44, 700);
    glow.addColorStop(0, 'rgba(255, 237, 213, 0.7)');
    glow.addColorStop(0.6, 'rgba(255, 214, 224, 0.4)');
    glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, this.width, this.height);

    // Large Heartwarming Hero Photo with luxury polaroid/gallery mount
    const zoom = 1.0 + (t / 6.0) * 0.06; // subtle Ken Burns zoom
    const heroY = 780;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(540, heroY);

    // Gallery Frame
    ctx.shadowColor = 'rgba(74, 40, 56, 0.22)';
    ctx.shadowBlur = 50;
    ctx.shadowOffsetY = 20;
    ctx.fillStyle = '#ffffff';
    this.roundRect(ctx, -440, -560, 880, 1120, 36, true, false);

    // Photo Area
    ctx.save();
    this.roundRect(ctx, -390, -510, 780, 880, 22, true, false);
    ctx.clip();
    const heroImg = this.images.friend_glowing_hero || this.images.hero_portrait;
    if (heroImg) {
      ctx.scale(zoom, zoom);
      this.drawImageCover(ctx, heroImg, -390, -510, 780, 880, 0.35);
    }
    ctx.restore();

    // Polaroid bottom handwritten signature
    ctx.shadowBlur = 0;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 48px "Caveat", cursive';
    ctx.fillStyle = '#5c3a4a';
    ctx.fillText('forever grateful for you ✨', 0, 480);

    // Cute washi tapes on corners
    this.drawWashiTape(ctx, -380, -560, 200, 45, -0.12, 'rgba(255, 209, 220, 0.9)');
    this.drawWashiTape(ctx, 380, -560, 200, 45, 0.14, 'rgba(200, 182, 255, 0.9)');

    ctx.restore();

    // Text: “you deserve every beautiful thing life has to offer.”
    ctx.save();
    ctx.globalAlpha = Math.min(1, Math.max(0, (t - 0.6) / 0.8));
    const msgY = 1600;

    // Elegant frosted glass pill
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.shadowColor = 'rgba(74, 40, 56, 0.12)';
    ctx.shadowBlur = 24;
    this.roundRect(ctx, 90, msgY - 70, 900, 140, 45, true, false);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '600 44px "Plus Jakarta Sans", "Playfair Display", serif';
    ctx.fillStyle = '#4a2838';
    ctx.shadowBlur = 0;
    ctx.fillText(this.state.scene5Text, 540, msgY);

    ctx.restore();
  }

  // ================= SCENE 6 (24 - 30s) =================
  renderScene6(ctx, t) {
    const friend = this.state.friendName.toUpperCase() || 'BESTIE';

    // 1. Falling Confetti Shower
    this.drawConfetti(ctx, t);

    // 2. Birthday Cake Centerpiece with candle flicker
    const cakeY = 820;
    const cakeScale = this.easeOutBack(Math.min(1, t / 0.85));

    ctx.save();
    ctx.translate(540, cakeY);
    ctx.scale(cakeScale, cakeScale);

    // Cake glow halo
    const flameFlicker = 1 + 0.08 * Math.sin(t * 12);
    const cakeGlow = ctx.createRadialGradient(0, -60, 60, 0, -60, 400 * flameFlicker);
    cakeGlow.addColorStop(0, 'rgba(255, 223, 134, 0.7)');
    cakeGlow.addColorStop(0.5, 'rgba(255, 182, 193, 0.35)');
    cakeGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = cakeGlow;
    ctx.beginPath();
    ctx.arc(0, -60, 400 * flameFlicker, 0, Math.PI * 2);
    ctx.fill();

    // Cake image inside rounded decorative card
    ctx.shadowColor = 'rgba(74, 40, 56, 0.2)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 15;
    ctx.fillStyle = '#ffffff';
    this.roundRect(ctx, -380, -380, 760, 760, 48, true, false);

    ctx.save();
    this.roundRect(ctx, -350, -350, 700, 700, 36, true, false);
    ctx.clip();
    if (this.images.birthday_cake) {
      this.drawImageCover(ctx, this.images.birthday_cake, -350, -350, 700, 700);
    }
    ctx.restore();

    // Cute ribbon bows on cake card
    this.drawDoodleBow(ctx, -340, -340, 70);
    this.drawDoodleBow(ctx, 340, -340, 70);

    ctx.restore();

    // Celebratory Keepsake Mini-Polaroid badge tucked at corner of cake card
    if (t >= 0.8) {
      const miniPProg = Math.min(1, (t - 0.8) / 0.6);
      const miniPEase = this.easeOutBack(miniPProg);
      ctx.save();
      ctx.translate(810, 1080);
      ctx.scale(miniPEase, miniPEase);
      this.drawPolaroid(ctx, {
        x: 0,
        y: 0,
        width: 320,
        height: 380,
        rotation: 0.12,
        img: this.images.friend_bw_smile || this.images.friend_lake,
        caption: 'birthday girl 👑 ♡',
        tapeColor: 'rgba(255, 209, 220, 0.95)',
        tapeAngle: 0.08,
        focusY: 0.35,
      });
      ctx.restore();
    }

    // 3. Sequential Heartwarming Birthday Typography
    // Line 1: HAPPY BIRTHDAY, [FRIEND'S NAME] ♡ (appears 0.3s - 6s)
    const l1Prog = Math.min(1, Math.max(0, (t - 0.2) / 0.6));
    const l1Ease = this.easeOutBack(l1Prog);
    const line1Text = this.state.scene6Line1.replace('{NAME}', friend);

    ctx.save();
    ctx.globalAlpha = l1Prog;
    ctx.translate(540, 300);
    ctx.scale(l1Ease, l1Ease);

    // Glowing pill badge
    ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
    ctx.shadowColor = 'rgba(251, 111, 146, 0.4)';
    ctx.shadowBlur = 30;
    this.roundRect(ctx, -480, -65, 960, 130, 45, true, false);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '800 58px "Playfair Display", "Caveat", serif';
    ctx.fillStyle = '#ff4d6d';
    ctx.shadowBlur = 0;
    ctx.fillText(line1Text, 0, 0);

    ctx.restore();

    // Line 2: “stay cute, stay happy, and never stop being you 🎂” (appears 2.5s)
    if (t >= 2.2) {
      const l2Prog = Math.min(1, (t - 2.2) / 0.6);
      ctx.save();
      ctx.globalAlpha = l2Prog;
      const l2Y = 1420;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.shadowColor = 'rgba(74, 40, 56, 0.12)';
      ctx.shadowBlur = 20;
      this.roundRect(ctx, 80, l2Y - 55, 920, 110, 40, true, false);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '700 44px "Caveat", cursive';
      ctx.fillStyle = '#4a2838';
      ctx.shadowBlur = 0;
      ctx.fillText(this.state.scene6Line2, 540, l2Y);
      ctx.restore();
    }

    // Line 3: “love you always ♡” (appears 4.2s)
    if (t >= 4.0) {
      const l3Prog = Math.min(1, (t - 4.0) / 0.6);
      const l3Scale = 1 + 0.05 * Math.sin(t * 4);
      ctx.save();
      ctx.globalAlpha = l3Prog;
      const l3Y = 1620;

      ctx.translate(540, l3Y);
      ctx.scale(l3Scale, l3Scale);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'italic 700 64px "Caveat", cursive';
      ctx.fillStyle = '#ff4d6d';
      ctx.shadowColor = 'rgba(255, 179, 193, 0.7)';
      ctx.shadowBlur = 18;
      ctx.fillText(this.state.scene6Line3, 0, 0);

      // Cute fluttering hearts on both sides
      this.drawCuteDoodleHeart(ctx, -260, 0, 36, '#fb6f92');
      this.drawCuteDoodleHeart(ctx, 260, 0, 36, '#fb6f92');

      ctx.restore();
    }
  }

  drawConfetti(ctx, t) {
    ctx.save();
    this.confetti.forEach((c) => {
      const curY = (c.y + t * c.speedY) % (this.height + 200);
      const curX = c.x + Math.sin(t * 3 + c.rotation) * 40;
      const rot = (c.rotation + t * c.rotSpeed) * (Math.PI / 180);

      ctx.save();
      ctx.translate(curX, curY);
      ctx.rotate(rot);
      ctx.fillStyle = c.color;
      if (c.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, c.width / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-c.width / 2, -c.height / 2, c.width, c.height);
      }
      ctx.restore();
    });
    ctx.restore();
  }

  // ================= GRAPHICS HELPERS =================

  drawPolaroid(ctx, { x, y, width, height, rotation, img, caption, tapeColor, tapeAngle, focusY = 0.35 }) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    // Frame Shadow
    ctx.shadowColor = 'rgba(74, 40, 56, 0.18)';
    ctx.shadowBlur = 35;
    ctx.shadowOffsetY = 15;

    // White Polaroid Paper Body
    ctx.fillStyle = '#ffffff';
    this.roundRect(ctx, -width / 2, -height / 2, width, height, 16, true, false);

    // Photo Box
    const pad = 24;
    const photoW = width - pad * 2;
    const photoH = height - 120; // leaves space at bottom for handwritten caption
    const photoX = -width / 2 + pad;
    const photoY = -height / 2 + pad;

    ctx.save();
    this.roundRect(ctx, photoX, photoY, photoW, photoH, 8, true, false);
    ctx.clip();
    if (img) {
      this.drawImageCover(ctx, img, photoX, photoY, photoW, photoH, focusY);
    } else {
      ctx.fillStyle = '#fce7f3';
      ctx.fillRect(photoX, photoY, photoW, photoH);
    }
    ctx.restore();

    // Handwritten Caption
    ctx.shadowBlur = 0;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 36px "Caveat", cursive';
    ctx.fillStyle = '#4a2838';
    ctx.fillText(caption, 0, height / 2 - 50);

    // Cute Washi Tape Strip at the top
    this.drawWashiTape(ctx, 0, -height / 2 - 10, 150, 38, tapeAngle || 0, tapeColor || 'rgba(255,209,220,0.85)');

    ctx.restore();
  }

  drawPhotoboothStrip(ctx, x, y, rotation, img1, img2, img3) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    const stripW = 380;
    const stripH = 960;

    // Shadow
    ctx.shadowColor = 'rgba(74, 40, 56, 0.2)';
    ctx.shadowBlur = 35;
    ctx.shadowOffsetY = 16;

    // Vintage paper background
    ctx.fillStyle = '#fffdfa';
    this.roundRect(ctx, -stripW / 2, -stripH / 2, stripW, stripH, 16, true, false);

    ctx.shadowBlur = 0;

    // 3 photo frames stacked vertically
    const padX = 22;
    const frameW = stripW - padX * 2; // 336px
    const frameH = 250;
    const gap = 16;
    const startY = -stripH / 2 + 26;

    const stripImgs = [img1, img2, img3].filter(Boolean);
    for (let i = 0; i < 3; i++) {
      const fy = startY + i * (frameH + gap);
      const curImg = stripImgs.length > 0 ? stripImgs[i % stripImgs.length] : null;

      ctx.save();
      this.roundRect(ctx, -stripW / 2 + padX, fy, frameW, frameH, 8, true, false);
      ctx.clip();
      if (curImg) {
        this.drawImageCover(ctx, curImg, -stripW / 2 + padX, fy, frameW, frameH, 0.35);
      } else {
        ctx.fillStyle = '#fce7f3';
        ctx.fillRect(-stripW / 2 + padX, fy, frameW, frameH);
      }
      ctx.restore();

      // Inner subtle border
      ctx.strokeStyle = 'rgba(74, 40, 56, 0.08)';
      ctx.lineWidth = 1.5;
      this.roundRect(ctx, -stripW / 2 + padX, fy, frameW, frameH, 8, false, true);
    }

    // Bottom Photobooth stamp & branding
    const footerY = startY + 3 * (frameH + gap) + 20;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 24px "Caveat", cursive';
    ctx.fillStyle = '#ff4d6d';
    ctx.fillText('♡ PHOTO BOOTH MEMORIES ♡', 0, footerY);

    ctx.font = '600 15px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#8e7382';
    ctx.fillText('BEST FRIEND FOREVER • 2026', 0, footerY + 28);

    // Top washi tape
    this.drawWashiTape(ctx, 0, -stripH / 2 - 8, 160, 40, 0.08, 'rgba(255, 179, 193, 0.85)');

    ctx.restore();
  }

  drawWashiTape(ctx, x, y, width, height, angle, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = color;

    // Jagged / ripped edges on left & right
    ctx.beginPath();
    ctx.moveTo(-width / 2, -height / 2);
    // Top line
    ctx.lineTo(width / 2, -height / 2);
    // Right jagged edge
    ctx.lineTo(width / 2 - 4, -height / 4);
    ctx.lineTo(width / 2 + 2, 0);
    ctx.lineTo(width / 2 - 3, height / 4);
    ctx.lineTo(width / 2, height / 2);
    // Bottom line
    ctx.lineTo(-width / 2, height / 2);
    // Left jagged edge
    ctx.lineTo(-width / 2 + 3, height / 4);
    ctx.lineTo(-width / 2 - 2, 0);
    ctx.lineTo(-width / 2 + 4, -height / 4);
    ctx.closePath();
    ctx.fill();

    // Subtle white dashed tape stitch
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(-width / 2 + 10, 0);
    ctx.lineTo(width / 2 - 10, 0);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
  }

  drawCuteStamp(ctx, x, y, size, text) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(0.12);

    // Scalloped circular stamp
    ctx.fillStyle = '#ffccd5';
    ctx.shadowColor = 'rgba(0,0,0,0.1)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    const spikes = 24;
    const outerR = size / 2;
    const innerR = outerR - 6;
    for (let i = 0; i < spikes; i++) {
      const a1 = (i / spikes) * Math.PI * 2;
      const a2 = ((i + 0.5) / spikes) * Math.PI * 2;
      ctx.lineTo(Math.cos(a1) * outerR, Math.sin(a1) * outerR);
      ctx.lineTo(Math.cos(a2) * innerR, Math.sin(a2) * innerR);
    }
    ctx.closePath();
    ctx.fill();

    // Inner ring
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#c9184a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, innerR - 8, 0, Math.PI * 2);
    ctx.stroke();

    // Stamp text
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '800 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#c9184a';
    ctx.fillText(text, 0, 0);

    ctx.restore();
  }

  drawDoodleBow(ctx, x, y, size) {
    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = '#ff8fa3';
    ctx.strokeStyle = '#c9184a';
    ctx.lineWidth = 3;

    // Center knot
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.16, size * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Left wing
    ctx.beginPath();
    ctx.moveTo(-size * 0.14, 0);
    ctx.bezierCurveTo(-size * 0.5, -size * 0.45, -size * 0.7, -size * 0.25, -size * 0.65, 0);
    ctx.bezierCurveTo(-size * 0.7, size * 0.25, -size * 0.5, size * 0.45, -size * 0.14, 0);
    ctx.fill();
    ctx.stroke();

    // Right wing
    ctx.beginPath();
    ctx.moveTo(size * 0.14, 0);
    ctx.bezierCurveTo(size * 0.5, -size * 0.45, size * 0.7, -size * 0.25, size * 0.65, 0);
    ctx.bezierCurveTo(size * 0.7, size * 0.25, size * 0.5, size * 0.45, size * 0.14, 0);
    ctx.fill();
    ctx.stroke();

    // Ribbons hanging down
    ctx.beginPath();
    ctx.moveTo(-size * 0.08, size * 0.1);
    ctx.quadraticCurveTo(-size * 0.25, size * 0.5, -size * 0.35, size * 0.6);
    ctx.lineTo(-size * 0.25, size * 0.55);
    ctx.quadraticCurveTo(-size * 0.1, size * 0.4, 0, size * 0.1);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(size * 0.08, size * 0.1);
    ctx.quadraticCurveTo(size * 0.25, size * 0.5, size * 0.35, size * 0.6);
    ctx.lineTo(size * 0.25, size * 0.55);
    ctx.quadraticCurveTo(size * 0.1, size * 0.4, 0, size * 0.1);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  drawDaisy(ctx, x, y, size) {
    ctx.save();
    ctx.translate(x, y);

    const petals = 8;
    const petalLen = size * 0.55;
    const petalW = size * 0.22;

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#f3c6d3';
    ctx.lineWidth = 1.5;

    for (let i = 0; i < petals; i++) {
      ctx.save();
      ctx.rotate((i / petals) * Math.PI * 2);
      ctx.beginPath();
      ctx.ellipse(0, -petalLen, petalW, petalLen * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Yellow golden center
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.28, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawCuteDoodleHeart(ctx, x, y, size, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    this.drawHeart(ctx, 0, 0, size);
    ctx.restore();
  }

  drawCuteDoodleStar(ctx, x, y, size, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.quadraticCurveTo(0, 0, size, 0);
    ctx.quadraticCurveTo(0, 0, 0, size);
    ctx.quadraticCurveTo(0, 0, -size, 0);
    ctx.quadraticCurveTo(0, 0, 0, -size);
    ctx.fill();
    ctx.restore();
  }

  drawImageCover(ctx, img, x, y, w, h, focusY = 0.35) {
    if (!img) return;
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    if (!iw || !ih) return;

    const scale = Math.max(w / iw, h / ih);
    const sw = w / scale;
    const sh = h / scale;
    const sx = Math.max(0, Math.min(iw - sw, (iw - sw) / 2));
    const sy = Math.max(0, Math.min(ih - sh, (ih - sh) * focusY));

    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  }

  roundRect(ctx, x, y, w, h, r, fill = true, stroke = false) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  drawFilmGrain(ctx, t) {
    if (this.state.filmGrainIntensity <= 0) return;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = this.state.filmGrainIntensity;

    // Shift grain slightly per frame for authentic organic noise flicker
    const offsetX = (Math.sin(t * 123.4) * 256) % 512;
    const offsetY = (Math.cos(t * 321.7) * 256) % 512;

    const pattern = ctx.createPattern(this.grainCanvas, 'repeat');
    ctx.translate(offsetX, offsetY);
    ctx.fillStyle = pattern;
    ctx.fillRect(-offsetX, -offsetY, this.width, this.height);
    ctx.restore();
  }

  drawDreamyVignette(ctx) {
    ctx.save();
    const vig = ctx.createRadialGradient(
      this.width / 2, this.height / 2, this.width * 0.45,
      this.width / 2, this.height / 2, this.width * 0.95
    );
    vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vig.addColorStop(0.7, 'rgba(255, 182, 193, 0.08)');
    vig.addColorStop(1, 'rgba(74, 40, 56, 0.22)'); // gentle warm shadow around edges
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.restore();
  }
}

window.ReelRenderer = ReelRenderer;
