/* CNC Precision — Enhanced Welding Spark + Laser Splash Animation */
(function () {
  if (sessionStorage.getItem('cncSplashShown')) return;
  sessionStorage.setItem('cncSplashShown', '1');

  var overlay = document.getElementById('splash-overlay');
  var canvas = document.getElementById('splash-canvas');
  var logo = document.getElementById('splash-logo');
  var text = document.getElementById('splash-text');
  if (!overlay || !canvas) return;

  var ctx = canvas.getContext('2d');
  var sparks = [];
  var lasers = [];
  var flashes = [];
  var W, H;
  var startTime;
  var DURATION = 4200;
  var FADE_START = 3400;
  var BUILD_START = 300;
  var BUILD_END = 2800;
  var running = true;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  overlay.style.visibility = 'visible';

  // Logo starts hidden — will be revealed progressively via clip-path
  var logoReveal = 0; // 0 = fully hidden, 1 = fully visible
  if (logo) {
    logo.style.opacity = '1';
    logo.style.clipPath = 'inset(100% 0 0 0)'; // hidden from bottom-up
    logo.style.webkitClipPath = 'inset(100% 0 0 0)';
  }

  // Text entrance
  if (text) {
    text.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
    text.style.transform = 'translateY(12px)';
    setTimeout(function () {
      text.style.opacity = '1';
      text.style.transform = 'translateY(0)';
    }, 1200);
  }

  // ============ SPARK PARTICLES ============
  function Spark(x, y, velocityScale, sizeScale) {
    var angle = Math.random() * Math.PI * 2;
    var speed = (2 + Math.random() * 6) * (velocityScale || 1);
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed + (0.5 + Math.random() * 2);
    this.gravity = 0.08 + Math.random() * 0.06;
    this.life = 0.4 + Math.random() * 0.8;
    this.maxLife = this.life;
    this.size = (1 + Math.random() * 2.5) * (sizeScale || 1);
    this.isChunk = Math.random() < 0.06;
    if (this.isChunk) { this.size *= 2.5; this.life *= 1.5; this.maxLife = this.life; this.gravity *= 0.7; }
    this.trail = [];
  }

  Spark.prototype.update = function (dt) {
    // Store trail
    if (this.trail.length < 6) this.trail.push({ x: this.x, y: this.y });
    else { this.trail.shift(); this.trail.push({ x: this.x, y: this.y }); }

    this.vy += this.gravity;
    this.vx *= 0.995;
    this.x += this.vx;
    this.y += this.vy;
    this.life -= dt;

    if (this.y > H - 3) {
      this.y = H - 3;
      this.vy *= -0.25;
      this.vx *= 0.7;
      // Spawn tiny ground sparks on bounce
      if (Math.abs(this.vy) > 0.5 && Math.random() < 0.3) {
        for (var i = 0; i < 2; i++) {
          var gs = new Spark(this.x, H - 4, 0.3, 0.4);
          gs.life = 0.15 + Math.random() * 0.2;
          gs.maxLife = gs.life;
          sparks.push(gs);
        }
      }
    }
  };

  Spark.prototype.draw = function () {
    var t = Math.max(0, this.life / this.maxLife);
    var r = this.size * (0.4 + t * 0.6);
    if (r < 0.2) return;

    // Trail
    if (this.trail.length > 1 && t > 0.3) {
      ctx.beginPath();
      ctx.moveTo(this.trail[0].x, this.trail[0].y);
      for (var i = 1; i < this.trail.length; i++) {
        ctx.lineTo(this.trail[i].x, this.trail[i].y);
      }
      ctx.strokeStyle = 'rgba(255,140,30,' + (t * 0.15) + ')';
      ctx.lineWidth = r * 0.8;
      ctx.stroke();
    }

    // Outer glow
    ctx.beginPath();
    ctx.arc(this.x, this.y, r * 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,180,60,' + (t * 0.08) + ')';
    ctx.fill();

    // Orange core
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    var cr = 255, cg = Math.floor(80 + t * 120), cb = Math.floor(t * 30);
    ctx.fillStyle = 'rgba(' + cr + ',' + cg + ',' + cb + ',' + (0.5 + t * 0.5) + ')';
    ctx.fill();

    // White-hot center
    if (t > 0.4) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, r * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,230,' + t + ')';
      ctx.fill();
    }
  };

  // ============ LASER BEAMS ============
  function Laser() {
    this.side = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left
    var cx = W / 2, cy = H / 2;

    if (this.side === 0) { this.x = Math.random() * W; this.y = 0; }
    else if (this.side === 1) { this.x = W; this.y = Math.random() * H; }
    else if (this.side === 2) { this.x = Math.random() * W; this.y = H; }
    else { this.x = 0; this.y = Math.random() * H; }

    // Target: near logo center with some randomness
    this.tx = cx + (Math.random() - 0.5) * 120;
    this.ty = cy + (Math.random() - 0.5) * 120;
    this.life = 0.15 + Math.random() * 0.2;
    this.maxLife = this.life;
    this.width = 1 + Math.random() * 1.5;
    this.hue = Math.random() < 0.7 ? 0 : (Math.random() < 0.5 ? 200 : 120); // red, blue, or green
  }

  Laser.prototype.update = function (dt) {
    this.life -= dt;
  };

  Laser.prototype.draw = function () {
    var t = Math.max(0, this.life / this.maxLife);
    var alpha = t * 0.7;

    // Main beam
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.tx, this.ty);
    if (this.hue === 0) {
      ctx.strokeStyle = 'rgba(255,30,20,' + alpha + ')';
    } else if (this.hue === 200) {
      ctx.strokeStyle = 'rgba(30,120,255,' + alpha * 0.6 + ')';
    } else {
      ctx.strokeStyle = 'rgba(30,255,80,' + alpha * 0.5 + ')';
    }
    ctx.lineWidth = this.width;
    ctx.stroke();

    // Glow beam (wider, more transparent)
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.tx, this.ty);
    if (this.hue === 0) {
      ctx.strokeStyle = 'rgba(255,80,60,' + (alpha * 0.2) + ')';
    } else if (this.hue === 200) {
      ctx.strokeStyle = 'rgba(80,150,255,' + (alpha * 0.15) + ')';
    } else {
      ctx.strokeStyle = 'rgba(80,255,120,' + (alpha * 0.12) + ')';
    }
    ctx.lineWidth = this.width * 6;
    ctx.stroke();

    // Impact flash at target
    if (t > 0.5) {
      ctx.beginPath();
      ctx.arc(this.tx, this.ty, 4 + (1 - t) * 10, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,' + (t * 0.3) + ')';
      ctx.fill();
    }
  };

  // ============ AMBIENT FLASH ============
  function Flash(x, y) {
    this.x = x; this.y = y;
    this.life = 0.1 + Math.random() * 0.15;
    this.maxLife = this.life;
    this.radius = 30 + Math.random() * 50;
  }
  Flash.prototype.update = function(dt) { this.life -= dt; };
  Flash.prototype.draw = function() {
    var t = Math.max(0, this.life / this.maxLife);
    var g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
    g.addColorStop(0, 'rgba(255,200,100,' + (t * 0.25) + ')');
    g.addColorStop(1, 'rgba(255,100,20,0)');
    ctx.fillStyle = g;
    ctx.fillRect(this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
  };

  // ============ LOGO GLOW ============
  var glowPhase = 0;
  function updateLogoGlow(elapsed) {
    if (!logo || !running) return;
    glowPhase += 0.05;
    // Glow builds with the reveal
    var buildIntensity = logoReveal;
    var base = (6 + Math.sin(glowPhase) * 4) * buildIntensity;
    var spread = (15 + Math.sin(glowPhase * 0.6) * 8) * buildIntensity;
    var laserBoost = lasers.length > 0 ? 10 * buildIntensity : 0;

    // At full reveal, add a bright "completed" flash
    var completedBoost = 0;
    if (logoReveal >= 1 && elapsed < BUILD_END + 500) {
      completedBoost = Math.max(0, 1 - (elapsed - BUILD_END) / 500) * 15;
    }

    logo.style.filter =
      'drop-shadow(0 0 ' + (base + laserBoost + completedBoost) + 'px rgba(255,100,20,0.7)) ' +
      'drop-shadow(0 0 ' + (spread + laserBoost + completedBoost) + 'px rgba(255,60,10,0.35)) ' +
      'drop-shadow(0 0 ' + (spread * 1.5 + completedBoost) + 'px rgba(200,40,0,0.15))';
  }

  // ============ DRAW SUBTLE GRID ============
  function drawGrid() {
    ctx.strokeStyle = 'rgba(255,255,255,0.015)';
    ctx.lineWidth = 0.5;
    var size = 50;
    for (var x = 0; x < W; x += size) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (var y = 0; y < H; y += size) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
  }

  // ============ DRAW AMBIENT SMOKE ============
  function drawSmoke(elapsed) {
    var t = Math.min(1, elapsed / 2000);
    var cx = W / 2, cy = H / 2 + 40;
    var g = ctx.createRadialGradient(cx, cy, 20, cx, cy, 200 + t * 100);
    g.addColorStop(0, 'rgba(255,80,20,' + (0.03 * t) + ')');
    g.addColorStop(0.5, 'rgba(100,40,10,' + (0.02 * t) + ')');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  // ============ MAIN LOOP ============
  var lastTime = 0;
  startTime = performance.now();
  var sparkTimer = 0;
  var laserTimer = 0;

  function animate(now) {
    if (!running) return;

    var dt = Math.min((now - (lastTime || now)) / 1000, 0.05);
    lastTime = now;
    var elapsed = now - startTime;

    ctx.clearRect(0, 0, W, H);

    // Subtle grid background
    drawGrid();

    // Ambient smoke/heat haze
    drawSmoke(elapsed);

    var cx = W / 2, cy = H / 2;

    // ---- Logo reveal progress (bottom-to-top over ~2.5 seconds) ----
    if (elapsed >= BUILD_START && elapsed <= BUILD_END) {
      logoReveal = Math.min(1, (elapsed - BUILD_START) / (BUILD_END - BUILD_START));
    } else if (elapsed > BUILD_END) {
      logoReveal = 1;
    }

    // Apply clip-path: reveal from bottom to top
    if (logo) {
      var clipTop = Math.max(0, (1 - logoReveal) * 100);
      logo.style.clipPath = 'inset(' + clipTop + '% 0 0 0)';
      logo.style.webkitClipPath = 'inset(' + clipTop + '% 0 0 0)';
    }

    // The "build line" — where welding is currently happening (moves bottom to top)
    var logoTop = cy - 70;
    var logoBottom = cy + 70;
    var buildLineY = logoBottom - logoReveal * (logoBottom - logoTop);

    // ---- Spawn sparks concentrated at the build line ----
    if (elapsed >= BUILD_START && elapsed < FADE_START) {
      sparkTimer += dt;
      if (sparkTimer > 0.016) {
        sparkTimer = 0;
        // Sparks along the build line (where the "welding" is happening)
        var sparkCount = logoReveal < 1 ? 4 + Math.floor(Math.random() * 4) : 1;
        for (var i = 0; i < sparkCount; i++) {
          var ex = cx + (Math.random() - 0.5) * 150;
          var ey = buildLineY + (Math.random() - 0.5) * 15;
          sparks.push(new Spark(ex, ey, 1, 1));
        }
        // A few sparks from the edges of the logo at the build line
        if (Math.random() < 0.5) {
          sparks.push(new Spark(cx - 70 + Math.random() * 10, buildLineY, 1.2, 0.8));
          sparks.push(new Spark(cx + 70 - Math.random() * 10, buildLineY, 1.2, 0.8));
        }
      }
    }

    // ---- Spawn lasers targeting the build line ----
    if (elapsed > 400 && elapsed < BUILD_END + 200) {
      laserTimer += dt;
      var laserInterval = 0.12 + Math.random() * 0.1;
      if (laserTimer > laserInterval) {
        laserTimer = 0;
        var l = new Laser();
        // Override laser target to hit near the build line
        l.tx = cx + (Math.random() - 0.5) * 130;
        l.ty = buildLineY + (Math.random() - 0.5) * 20;
        lasers.push(l);
        flashes.push(new Flash(l.tx, l.ty));
        for (var s = 0; s < 4; s++) {
          sparks.push(new Spark(l.tx, l.ty, 1.5, 0.7));
        }
      }
    }

    // ---- Big welding flash bursts at milestones ----
    var milestones = [0.25, 0.5, 0.75, 1.0];
    for (var m = 0; m < milestones.length; m++) {
      var milestone = milestones[m];
      var milestoneTime = BUILD_START + milestone * (BUILD_END - BUILD_START);
      if (elapsed >= milestoneTime && elapsed < milestoneTime + 50) {
        if (Math.random() < 0.15) {
          for (var b = 0; b < 30; b++) {
            sparks.push(new Spark(
              cx + (Math.random() - 0.5) * 100,
              buildLineY + (Math.random() - 0.5) * 15,
              2.2, 1.4
            ));
          }
          flashes.push(new Flash(cx, buildLineY));
        }
      }
    }

    // ---- After build complete: ambient sparks (fewer, just vibes) ----
    if (elapsed > BUILD_END && elapsed < FADE_START && Math.random() < 0.3) {
      sparks.push(new Spark(
        cx + (Math.random() - 0.5) * 120,
        cy + 50 + Math.random() * 20,
        0.8, 0.8
      ));
    }

    // ---- Update & draw lasers ----
    for (var i = lasers.length - 1; i >= 0; i--) {
      lasers[i].update(dt);
      if (lasers[i].life <= 0) { lasers.splice(i, 1); }
      else { lasers[i].draw(); }
    }

    // ---- Update & draw flashes ----
    for (var i = flashes.length - 1; i >= 0; i--) {
      flashes[i].update(dt);
      if (flashes[i].life <= 0) { flashes.splice(i, 1); }
      else { flashes[i].draw(); }
    }

    // ---- Update & draw sparks ----
    for (var i = sparks.length - 1; i >= 0; i--) {
      sparks[i].update(dt);
      if (sparks[i].life <= 0) { sparks.splice(i, 1); }
      else { sparks[i].draw(); }
    }

    // ---- Logo glow ----
    updateLogoGlow(elapsed);

    // ---- Scanline overlay ----
    ctx.fillStyle = 'rgba(0,0,0,0.03)';
    for (var sl = 0; sl < H; sl += 3) {
      ctx.fillRect(0, sl, W, 1);
    }

    // ---- Fade out ----
    if (elapsed >= FADE_START) {
      var fadeProgress = (elapsed - FADE_START) / (DURATION - FADE_START);
      fadeProgress = Math.min(1, fadeProgress);
      overlay.style.opacity = 1 - fadeProgress;

      if (fadeProgress >= 1) {
        running = false;
        overlay.remove();
        window.removeEventListener('resize', resize);
        return;
      }
    }

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
})();
