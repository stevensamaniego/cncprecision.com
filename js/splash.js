/* CNC Precision — Welding Spark Splash Animation */
(function () {
  if (sessionStorage.getItem('cncSplashShown')) return;
  sessionStorage.setItem('cncSplashShown', '1');

  var overlay = document.getElementById('splash-overlay');
  var canvas = document.getElementById('splash-canvas');
  var logo = document.getElementById('splash-logo');
  var text = document.getElementById('splash-text');
  if (!overlay || !canvas) return;

  var ctx = canvas.getContext('2d');
  var particles = [];
  var W, H;
  var startTime;
  var DURATION = 3500;
  var FADE_START = 2800;
  var running = true;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  resize();
  window.addEventListener('resize', resize);

  // Make overlay visible
  overlay.style.visibility = 'visible';

  // Animate logo glow
  if (logo) {
    logo.style.opacity = '0';
    logo.style.transform = 'scale(0.9)';
    logo.style.transition = 'opacity 0.8s ease, transform 0.8s ease, filter 0.5s ease';
    setTimeout(function () {
      logo.style.opacity = '1';
      logo.style.transform = 'scale(1)';
    }, 100);
  }

  // Animate text fade in
  if (text) {
    text.style.transition = 'opacity 1s ease';
    setTimeout(function () {
      text.style.opacity = '1';
    }, 800);
  }

  // Glow pulse on logo
  var glowPhase = 0;
  function updateLogoGlow() {
    if (!logo || !running) return;
    glowPhase += 0.04;
    var intensity = 8 + Math.sin(glowPhase) * 5;
    var spread = 15 + Math.sin(glowPhase * 0.7) * 8;
    logo.style.filter =
      'drop-shadow(0 0 ' + intensity + 'px rgba(255, 120, 20, 0.6)) ' +
      'drop-shadow(0 0 ' + spread + 'px rgba(255, 80, 10, 0.3))';
  }

  // Spark particle class
  function Spark(cx, cy) {
    var angle = Math.random() * Math.PI * 2;
    var speed = 1 + Math.random() * 4;
    // Bias sparks downward
    var downBias = 0.5 + Math.random() * 2;

    this.x = cx + (Math.random() - 0.5) * 100;
    this.y = cy + Math.random() * 30;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed + downBias;
    this.gravity = 0.06 + Math.random() * 0.04;
    this.life = 0.6 + Math.random() * 0.6;
    this.maxLife = this.life;
    this.size = 1 + Math.random() * 2.5;
    this.brightness = 0.7 + Math.random() * 0.3;
  }

  Spark.prototype.update = function (dt) {
    this.vy += this.gravity;
    this.x += this.vx;
    this.y += this.vy;
    this.life -= dt;

    // Bounce off bottom
    if (this.y > H - 5) {
      this.y = H - 5;
      this.vy *= -0.3;
      this.vx *= 0.8;
    }
  };

  Spark.prototype.draw = function (ctx) {
    var alpha = Math.max(0, this.life / this.maxLife) * this.brightness;
    var r = this.size * (0.5 + alpha * 0.5);

    // Outer yellow-white glow
    ctx.beginPath();
    ctx.arc(this.x, this.y, r * 2.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 200, 80, ' + (alpha * 0.15) + ')';
    ctx.fill();

    // Orange core
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 160, 40, ' + alpha + ')';
    ctx.fill();

    // Bright white center
    ctx.beginPath();
    ctx.arc(this.x, this.y, r * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 220, ' + alpha + ')';
    ctx.fill();
  };

  // Spawn sparks around the center of the logo area
  function spawnSparks() {
    var cx = W / 2;
    var cy = H / 2 + 30; // slightly below logo center
    var count = 2 + Math.floor(Math.random() * 3);
    for (var i = 0; i < count; i++) {
      particles.push(new Spark(cx, cy));
    }
  }

  // Animation loop
  var lastTime = 0;
  startTime = performance.now();

  function animate(now) {
    if (!running) return;

    var dt = Math.min((now - (lastTime || now)) / 1000, 0.05);
    lastTime = now;

    var elapsed = now - startTime;

    ctx.clearRect(0, 0, W, H);

    // Spawn new sparks for the first ~2.5 seconds
    if (elapsed < FADE_START) {
      spawnSparks();
    }

    // Update and draw particles
    for (var i = particles.length - 1; i >= 0; i--) {
      particles[i].update(dt);
      if (particles[i].life <= 0) {
        particles.splice(i, 1);
      } else {
        particles[i].draw(ctx);
      }
    }

    // Logo glow pulse
    updateLogoGlow();

    // Start fade out
    if (elapsed >= FADE_START) {
      var fadeProgress = (elapsed - FADE_START) / (DURATION - FADE_START);
      fadeProgress = Math.min(1, fadeProgress);
      overlay.style.opacity = 1 - fadeProgress;

      if (fadeProgress >= 1) {
        running = false;
        overlay.style.display = 'none';
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
        window.removeEventListener('resize', resize);
        return;
      }
    }

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
})();
