/* ============================================
   CNC PRECISION MACHINES — MAIN JS
   GSAP + ScrollTrigger + Swiper
   Premium Animation Overhaul
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // --- CINEMATIC PRELOADER ---
  const preloader = document.querySelector('.preloader');
  if (preloader) {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      const logo = preloader.querySelector('.preloader__logo');
      if (logo) { logo.style.opacity = '1'; logo.style.filter = 'none'; logo.style.transform = 'none'; }
      preloader.querySelectorAll('.preloader__text span').forEach(s => { s.style.opacity = '1'; s.style.transform = 'none'; });
      setTimeout(() => { preloader.style.display = 'none'; }, 400);
    } else {
      const logo = preloader.querySelector('.preloader__logo');
      const sweep = preloader.querySelector('.preloader__sweep');
      const textSpans = preloader.querySelectorAll('.preloader__text span');
      const canvas = document.getElementById('sparkCanvas');
      const laserLine = preloader.querySelector('.preloader__laser-line');
      const gridContainer = preloader.querySelector('.preloader__grid');
      const coords = preloader.querySelectorAll('.preloader__coords .coord');
      const isMobile = window.innerWidth <= 768;

      // --- Build grid lines ---
      if (gridContainer && !isMobile) {
        const GRID_SPACING = 80;
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        const cols = Math.ceil(window.innerWidth / GRID_SPACING) + 2;
        const rows = Math.ceil(window.innerHeight / GRID_SPACING) + 2;

        for (let i = 0; i < rows; i++) {
          const y = cy + (i - Math.floor(rows / 2)) * GRID_SPACING;
          const line = document.createElement('div');
          line.className = 'grid-line grid-h';
          line.style.top = y + 'px';
          line.dataset.dist = Math.abs(i - Math.floor(rows / 2));
          gridContainer.appendChild(line);
        }
        for (let i = 0; i < cols; i++) {
          const x = cx + (i - Math.floor(cols / 2)) * GRID_SPACING;
          const line = document.createElement('div');
          line.className = 'grid-line grid-v';
          line.style.left = x + 'px';
          line.dataset.dist = Math.abs(i - Math.floor(cols / 2));
          gridContainer.appendChild(line);
        }
        // Crosshairs at a few intersections near center
        for (let r = -2; r <= 2; r++) {
          for (let c = -2; c <= 2; c++) {
            const ch = document.createElement('div');
            ch.className = 'grid-crosshair';
            ch.style.left = (cx + c * GRID_SPACING - 4) + 'px';
            ch.style.top = (cy + r * GRID_SPACING - 4) + 'px';
            ch.dataset.dist = Math.abs(r) + Math.abs(c);
            gridContainer.appendChild(ch);
          }
        }
      }

      // --- Canvas setup for laser trace + sparks + coolant ---
      let animRunning = true;
      let laserProgress = -1;   // -1 = not started, 0..1 = tracing
      let laserTrail = [];       // accumulated path points
      let sparks = [];
      let coolantParticles = [];
      let ctx;

      // Canvas dims
      const W = window.innerWidth;
      const H = window.innerHeight;

      // --- Build logo contour from image alpha silhouette ---
      // Falls back to a tight rounded-rect around the logo bounding box.
      let contourPts = [];
      let contourLen = 0;
      let contourCumLen = [];

      function finalizeContour() {
        contourCumLen = [0];
        let total = 0;
        for (let i = 1; i < contourPts.length; i++) {
          const dx = contourPts[i].x - contourPts[i - 1].x;
          const dy = contourPts[i].y - contourPts[i - 1].y;
          total += Math.sqrt(dx * dx + dy * dy);
          contourCumLen.push(total);
        }
        // Close the loop
        const dx = contourPts[0].x - contourPts[contourPts.length - 1].x;
        const dy = contourPts[0].y - contourPts[contourPts.length - 1].y;
        total += Math.sqrt(dx * dx + dy * dy);
        contourCumLen.push(total);
        contourLen = total;
      }

      function buildLogoContour() {
        if (!logo || !logo.complete || !logo.naturalWidth) return false;
        try {
          const rect = logo.getBoundingClientRect();
          const boxW = rect.width;
          const boxH = rect.height;
          if (boxW < 4 || boxH < 4) return false;

          // object-fit: contain — compute actual displayed image rect within the box
          const natW = logo.naturalWidth;
          const natH = logo.naturalHeight;
          const scale = Math.min(boxW / natW, boxH / natH);
          const dispW = natW * scale;
          const dispH = natH * scale;
          const offsetX = rect.left + (boxW - dispW) / 2;
          const offsetY = rect.top + (boxH - dispH) / 2;

          // Sample at moderate resolution of the displayed image
          const sampleW = Math.min(240, Math.max(60, Math.floor(dispW)));
          const sampleH = Math.min(180, Math.max(40, Math.floor(dispH)));
          const off = document.createElement('canvas');
          off.width = sampleW;
          off.height = sampleH;
          const octx = off.getContext('2d');
          octx.drawImage(logo, 0, 0, sampleW, sampleH);
          let data;
          try { data = octx.getImageData(0, 0, sampleW, sampleH).data; }
          catch (e) { return false; } // CORS-tainted

          const top = new Array(sampleW).fill(-1);
          const bot = new Array(sampleW).fill(-1);
          const ALPHA_T = 30;
          for (let x = 0; x < sampleW; x++) {
            for (let y = 0; y < sampleH; y++) {
              const a = data[(y * sampleW + x) * 4 + 3];
              if (a > ALPHA_T) {
                if (top[x] === -1) top[x] = y;
                bot[x] = y;
              }
            }
          }

          // Find leftmost/rightmost populated columns
          let xMin = -1, xMax = -1;
          for (let x = 0; x < sampleW; x++) {
            if (top[x] !== -1) { if (xMin === -1) xMin = x; xMax = x; }
          }
          if (xMin === -1 || xMax - xMin < 10) return false;

          // Small inset for a tighter visual fit
          const INSET = 1;
          const mapX = sx => offsetX + (sx / sampleW) * dispW;
          const mapY = sy => offsetY + (sy / sampleH) * dispH;

          const pts = [];
          // Top edge left->right
          for (let x = xMin; x <= xMax; x++) {
            if (top[x] !== -1) pts.push({ x: mapX(x), y: mapY(top[x] - INSET) });
          }
          // Bottom edge right->left
          for (let x = xMax; x >= xMin; x--) {
            if (bot[x] !== -1) pts.push({ x: mapX(x), y: mapY(bot[x] + INSET) });
          }

          // Smooth a bit to reduce tiny zigzags between letters
          const smoothed = [];
          const WIN = 2;
          for (let i = 0; i < pts.length; i++) {
            let sx = 0, sy = 0, c = 0;
            for (let k = -WIN; k <= WIN; k++) {
              const p = pts[(i + k + pts.length) % pts.length];
              sx += p.x; sy += p.y; c++;
            }
            smoothed.push({ x: sx / c, y: sy / c });
          }

          contourPts = smoothed;
          finalizeContour();
          return true;
        } catch (e) { return false; }
      }

      function buildFallbackContour() {
        // Rounded rectangle around logo element
        let rect;
        if (logo && logo.getBoundingClientRect) {
          rect = logo.getBoundingClientRect();
        }
        const rw = rect && rect.width > 10 ? rect.width * 0.85 : Math.min(380, W * 0.5);
        const rh = rect && rect.height > 10 ? rect.height * 0.7 : Math.min(180, H * 0.25);
        const cx = rect ? rect.left + rect.width / 2 : W / 2;
        const cy = rect ? rect.top + rect.height / 2 : H / 2;
        const r = Math.min(rw, rh) * 0.18;
        const pts = [];
        const STEPS = 120;
        // Parametric rounded rect
        for (let i = 0; i < STEPS; i++) {
          const t = i / STEPS;
          // 4 straight edges + 4 corner arcs — approximate by sampling unit rect then rounding corners
          const a = t * Math.PI * 2 - Math.PI / 2;
          let px = Math.cos(a), py = Math.sin(a);
          // Map unit circle point to rounded-rect: clamp to rect with corner smoothing
          const halfW = rw / 2 - r;
          const halfH = rh / 2 - r;
          // Project radially onto rounded rect
          // Use formula: find scale so that point lies on edge
          const absX = Math.abs(px), absY = Math.abs(py);
          const scale = 1 / Math.max(
            (absX - 0) / ((halfW + r * absX / Math.sqrt(absX*absX + absY*absY)) / (halfW + r) || 1),
            (absY - 0) / ((halfH + r * absY / Math.sqrt(absX*absX + absY*absY)) / (halfH + r) || 1),
            0.0001
          );
          // Simpler: use max-norm rect + corner round
          const mx = px * (halfW + r);
          const my = py * (halfH + r);
          pts.push({ x: cx + mx, y: cy + my });
        }
        contourPts = pts;
        finalizeContour();
      }

      function getContourPoint(t) {
        if (!contourPts.length) return { x: W / 2, y: H / 2 };
        const target = (t % 1) * contourLen;
        // binary search
        let lo = 0, hi = contourCumLen.length - 1;
        while (lo < hi - 1) {
          const mid = (lo + hi) >> 1;
          if (contourCumLen[mid] <= target) lo = mid; else hi = mid;
        }
        const segLen = contourCumLen[hi] - contourCumLen[lo] || 1;
        const f = (target - contourCumLen[lo]) / segLen;
        const p1 = contourPts[lo % contourPts.length];
        const p2 = contourPts[hi % contourPts.length];
        return { x: p1.x + (p2.x - p1.x) * f, y: p1.y + (p2.y - p1.y) * f };
      }

      // Try to build contour. If logo not ready yet, wait for it.
      if (!buildLogoContour()) {
        if (logo && !logo.complete) {
          logo.addEventListener('load', () => {
            if (!buildLogoContour()) buildFallbackContour();
          }, { once: true });
          buildFallbackContour(); // temp until load
        } else {
          buildFallbackContour();
        }
      }

      if (canvas) {
        ctx = canvas.getContext('2d');
        canvas.width = W;
        canvas.height = H;

        function renderFrame() {
          if (!animRunning) return;
          ctx.clearRect(0, 0, W, H);

          // Draw laser trail (accumulated glow path)
          if (laserTrail.length > 1) {
            // Outer glow
            ctx.save();
            ctx.strokeStyle = 'rgba(214, 6, 0, 0.4)';
            ctx.lineWidth = 6;
            ctx.shadowColor = '#D60600';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.moveTo(laserTrail[0].x, laserTrail[0].y);
            for (let i = 1; i < laserTrail.length; i++) {
              ctx.lineTo(laserTrail[i].x, laserTrail[i].y);
            }
            ctx.stroke();
            ctx.restore();

            // White-hot core
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(laserTrail[0].x, laserTrail[0].y);
            for (let i = 1; i < laserTrail.length; i++) {
              ctx.lineTo(laserTrail[i].x, laserTrail[i].y);
            }
            ctx.stroke();
            ctx.restore();
          }

          // Draw laser head glow
          if (laserProgress >= 0 && laserProgress <= 1) {
            const head = getContourPoint(laserProgress);
            ctx.save();
            ctx.beginPath();
            ctx.arc(head.x, head.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.shadowColor = '#D60600';
            ctx.shadowBlur = 25;
            ctx.fill();
            ctx.restore();

            // Bright center
            ctx.save();
            ctx.beginPath();
            ctx.arc(head.x, head.y, 2, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.fill();
            ctx.restore();
          }

          // Spark particles
          sparks = sparks.filter(s => s.life > 0);
          sparks.forEach(s => {
            s.x += s.vx;
            s.y += s.vy;
            s.vy += 0.15; // gravity
            s.life -= s.decay;
            const alpha = Math.max(0, s.life);

            // Hot core
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, ${180 + Math.random() * 75}, 50, ${alpha})`;
            ctx.fill();

            // Glow
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size * 2.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(214, 6, 0, ${alpha * 0.3})`;
            ctx.fill();
          });

          // Coolant mist particles
          coolantParticles = coolantParticles.filter(p => p.life > 0);
          coolantParticles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy -= 0.02; // drift up
            p.life -= p.decay;
            p.size *= 1.01;
            const alpha = Math.max(0, p.life * 0.15);

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(180, 220, 255, ${alpha})`;
            ctx.fill();
          });

          requestAnimationFrame(renderFrame);
        }
        renderFrame();
      }

      // Emit sparks at the laser head
      function emitSparks(x, y) {
        const count = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count; i++) {
          sparks.push({
            x, y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.8) * 3,
            size: Math.random() * 1.5 + 0.5,
            life: 1,
            decay: 0.04 + Math.random() * 0.04,
          });
        }
      }

      // Emit coolant mist behind laser
      function emitCoolant(x, y) {
        for (let i = 0; i < 2; i++) {
          coolantParticles.push({
            x: x + (Math.random() - 0.5) * 10,
            y: y + (Math.random() - 0.5) * 10,
            vx: (Math.random() - 0.5) * 0.8,
            vy: -(Math.random() * 0.5 + 0.2),
            size: Math.random() * 3 + 2,
            life: 1,
            decay: 0.02 + Math.random() * 0.02,
          });
        }
      }

      // --- GSAP Master Timeline ---
      const tl = gsap.timeline({
        onComplete: () => {
          animRunning = false;
          preloader.classList.add('dismiss');
          gsap.to(preloader, {
            opacity: 0,
            duration: 0.6,
            ease: 'power2.inOut',
            onComplete: () => { preloader.style.display = 'none'; }
          });
        }
      });

      // ===== STAGE 1: Machine Startup — laser line (0 – 0.5s) =====
      tl.to(laserLine, {
        opacity: 1,
        width: '30vw',
        duration: 0.25,
        ease: 'power4.out',
      });
      // Pulse bright
      tl.to(laserLine, {
        boxShadow: '0 0 20px #D60600, 0 0 60px rgba(214,6,0,0.8), 0 0 100px rgba(214,6,0,0.4)',
        duration: 0.1,
        ease: 'power2.in',
      });
      // Dim to steady
      tl.to(laserLine, {
        boxShadow: '0 0 8px #D60600, 0 0 20px rgba(214,6,0,0.4), 0 0 40px rgba(214,6,0,0.15)',
        opacity: 0.6,
        duration: 0.15,
        ease: 'power2.out',
      });

      // ===== STAGE 2: Blueprint Grid Reveal (0.5 – 1.5s) =====
      if (!isMobile && gridContainer) {
        const gridLines = gridContainer.querySelectorAll('.grid-line');
        const crosshairs = gridContainer.querySelectorAll('.grid-crosshair');

        // Sort by distance from center for stagger
        const sortedLines = Array.from(gridLines).sort((a, b) => a.dataset.dist - b.dataset.dist);
        const sortedCrosshairs = Array.from(crosshairs).sort((a, b) => a.dataset.dist - b.dataset.dist);

        tl.to(sortedLines, {
          opacity: 0.5,
          duration: 0.6,
          stagger: 0.03,
          ease: 'power2.out',
        }, '+=0.0');

        tl.to(sortedCrosshairs, {
          opacity: 0.6,
          duration: 0.3,
          stagger: 0.02,
          ease: 'power2.out',
        }, '-=0.4');

        // Coordinate readout
        tl.to(coords, {
          opacity: 1,
          duration: 0.4,
          stagger: 0.1,
          ease: 'power2.out',
        }, '-=0.3');

        // Animate coordinate numbers counting
        const coordObj = { x: 0, y: 0, z: 0 };
        tl.to(coordObj, {
          x: 125.000, y: 87.500, z: 0.000,
          duration: 0.6,
          ease: 'power2.out',
          onUpdate: () => {
            if (coords[0]) coords[0].textContent = 'X: ' + coordObj.x.toFixed(3);
            if (coords[1]) coords[1].textContent = 'Y: ' + coordObj.y.toFixed(3);
            if (coords[2]) coords[2].textContent = 'Z: ' + coordObj.z.toFixed(3);
          },
        }, '-=0.4');

        // Fade laser startup line
        tl.to(laserLine, { opacity: 0, duration: 0.3 }, '-=0.3');
      } else {
        tl.to(laserLine, { opacity: 0, duration: 0.3 });
      }

      // ===== STAGE 3: Laser Traces Logo Oval (1.5 – 3.0s) =====
      const TRACE_DURATION = 1.5;
      const traceObj = { t: 0 };
      let lastTraceT = 0;

      tl.to(traceObj, {
        t: 1,
        duration: TRACE_DURATION,
        ease: 'power1.inOut',
        onUpdate: () => {
          laserProgress = traceObj.t;
          // Add trail points
          const steps = 3;
          for (let i = 0; i < steps; i++) {
            const interpT = lastTraceT + (traceObj.t - lastTraceT) * (i / steps);
            laserTrail.push(getContourPoint(interpT));
          }
          laserTrail.push(getContourPoint(traceObj.t));

          // Emit sparks + coolant at head
          const head = getContourPoint(traceObj.t);
          emitSparks(head.x, head.y);
          emitCoolant(head.x, head.y);
          lastTraceT = traceObj.t;
        },
        onComplete: () => {
          // Close the loop
          laserTrail.push(getContourPoint(0));
          laserProgress = -1; // hide head
        }
      });

      // ===== STAGE 4: Logo Materializes (3.0 – 3.8s) =====
      tl.to(logo, {
        opacity: 1,
        filter: 'blur(0px) brightness(1)',
        scale: 1,
        duration: 0.6,
        ease: 'power3.out',
      }, '-=0.2');

      // 6-axis CNC presentation rotation
      tl.to(logo, {
        rotateY: 5,
        duration: 0.2,
        ease: 'power2.out',
      });
      tl.to(logo, {
        rotateY: -3,
        duration: 0.2,
        ease: 'power2.inOut',
      });
      tl.to(logo, {
        rotateY: 0,
        duration: 0.3,
        ease: 'power2.out',
      });

      // Fade grid behind
      if (!isMobile && gridContainer) {
        tl.to(gridContainer, {
          opacity: 0,
          duration: 0.5,
          ease: 'power2.inOut',
        }, '-=0.6');

        tl.to(coords, {
          opacity: 0,
          duration: 0.3,
        }, '-=0.5');
      }

      // Fade the laser trail on canvas
      tl.to({}, {
        duration: 0.4,
        onUpdate: function() {
          // Gradually reduce trail opacity by clearing with low-alpha black
          if (ctx) {
            const progress = this.progress();
            if (progress > 0.5) {
              laserTrail = [];
            }
          }
        }
      }, '-=0.5');

      // Metallic glow pulse
      tl.to(logo, {
        filter: 'blur(0px) brightness(1.3) drop-shadow(0 0 30px rgba(214, 6, 0, 0.5))',
        duration: 0.3,
        ease: 'power2.in',
      }, '-=0.3');

      tl.to(logo, {
        filter: 'blur(0px) brightness(1) drop-shadow(0 0 15px rgba(214, 6, 0, 0.2))',
        duration: 0.4,
        ease: 'power2.out',
      });

      // Light sweep
      tl.to(sweep, {
        left: '140%',
        duration: 0.7,
        ease: 'power2.inOut',
      }, '-=0.5');

      // ===== STAGE 5: Company Name + Dismiss (3.8 – 4.5s) =====
      tl.to(textSpans, {
        opacity: 1,
        y: 0,
        duration: 0.4,
        stagger: 0.025,
        ease: 'power3.out',
      }, '-=0.2');

      // Hold
      tl.to({}, { duration: 0.6 });
    }
  }

  // --- HEADER SCROLL ---
  const header = document.querySelector('.header');
  if (header && !header.classList.contains('scrolled')) {
    const onScroll = () => {
      if (window.scrollY > 80) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // --- MOBILE NAV ---
  const toggle = document.querySelector('.header__toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  const mobileOverlay = document.querySelector('.mobile-overlay');

  if (toggle && mobileNav) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('active');
      mobileNav.classList.toggle('open');
      if (mobileOverlay) mobileOverlay.classList.toggle('open');
    });

    if (mobileOverlay) {
      mobileOverlay.addEventListener('click', () => {
        toggle.classList.remove('active');
        mobileNav.classList.remove('open');
        mobileOverlay.classList.remove('open');
      });
    }

    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        toggle.classList.remove('active');
        mobileNav.classList.remove('open');
        if (mobileOverlay) mobileOverlay.classList.remove('open');
      });
    });
  }

  // --- HERO SWIPER ---
  const heroEl = document.querySelector('.hero-swiper');
  if (heroEl) {
    new Swiper('.hero-swiper', {
      direction: 'horizontal',
      loop: true,
      speed: 1000,
      simulateTouch: false,
      touchStartPreventDefault: false,
      autoplay: {
        delay: 5000,
        disableOnInteraction: false,
      },
      pagination: {
        el: '.hero .swiper-pagination',
        clickable: true,
      },
      effect: 'fade',
      fadeEffect: {
        crossFade: true,
      },
    });
  }

  // --- PARTNERS SWIPER ---
  const partnersEl = document.querySelector('.partners-swiper');
  if (partnersEl) {
    new Swiper('.partners-swiper', {
      loop: true,
      slidesPerView: 'auto',
      spaceBetween: 0,
      speed: 4000,
      autoplay: {
        delay: 0,
        disableOnInteraction: false,
      },
      allowTouchMove: false,
      freeMode: true,
    });
  }

  // --- GSAP + SCROLLTRIGGER ---
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return; // Skip all scroll animations for reduced motion

    // --- Helper: letter-by-letter header reveal ---
    function animateHeaderText(el) {
      const h2 = el.querySelector('h2');
      if (!h2) return;
      const text = h2.textContent;
      h2.innerHTML = text.split('').map(ch =>
        ch === ' ' ? '<span style="display:inline-block">&nbsp;</span>'
          : `<span style="display:inline-block; opacity:0; transform:translateY(20px)">${ch}</span>`
      ).join('');
      const spans = h2.querySelectorAll('span');
      gsap.to(spans, {
        opacity: 1,
        y: 0,
        duration: 0.4,
        stagger: 0.03,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          once: true,
        },
      });
    }

    // Section headers — letter-by-letter reveal
    gsap.utils.toArray('.section-header').forEach(el => {
      animateHeaderText(el);
      // Animate the rest of the header (p, accent-line)
      const children = el.querySelectorAll('p, .accent-line');
      if (children.length) {
        gsap.from(children, {
          y: 30,
          opacity: 0,
          duration: 0.7,
          stagger: 0.08,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            once: true,
          },
        });
      }
    });

    // Machine cards — cinematic stagger with rotation
    const machineCards = gsap.utils.toArray('.machine-card');
    if (machineCards.length) {
      gsap.from(machineCards, {
        y: 80,
        opacity: 0,
        rotateX: -10,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.machines-grid',
          start: 'top 80%',
          once: true,
        },
      });
    }

    // Industry cards — stagger with rotation
    const industryCards = gsap.utils.toArray('.industry-card');
    if (industryCards.length) {
      gsap.from(industryCards, {
        y: 80,
        opacity: 0,
        rotateX: -10,
        duration: 0.7,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.industries-grid',
          start: 'top 80%',
          once: true,
        },
      });
    }

    // About preview — text slides in, visual scales in with elastic
    const aboutText = document.querySelector('.about-preview__text');
    const aboutVisual = document.querySelector('.about-preview__visual');
    if (aboutText) {
      gsap.from(aboutText, {
        x: -60,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: { trigger: aboutText, start: 'top 80%', once: true },
      });
    }
    if (aboutVisual) {
      gsap.from(aboutVisual, {
        scale: 0.8,
        rotation: -3,
        opacity: 0,
        duration: 1.2,
        ease: 'elastic.out(1, 0.6)',
        scrollTrigger: { trigger: aboutVisual, start: 'top 80%', once: true },
      });
    }

    // CTA section
    const ctaSection = document.querySelector('.cta');
    if (ctaSection) {
      gsap.from(ctaSection.children, {
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: { trigger: ctaSection, start: 'top 80%', once: true },
      });
    }

    // Subpage fade-in elements
    gsap.utils.toArray('.fade-in').forEach(el => {
      gsap.from(el, {
        y: 40,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          once: true,
        },
      });
    });

    // Service cards — clean stagger entry
    const serviceCards = gsap.utils.toArray('.service-card');
    if (serviceCards.length) {
      gsap.from(serviceCards, {
        y: 40,
        opacity: 0,
        duration: 0.7,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.services-grid',
          start: 'top 80%',
          once: true,
        },
      });

      // Icon glow on enter
      serviceCards.forEach(card => {
        const icon = card.querySelector('.service-card__icon');
        if (icon) {
          gsap.from(icon, {
            scale: 0,
            opacity: 0,
            duration: 0.5,
            ease: 'back.out(2)',
            scrollTrigger: {
              trigger: card,
              start: 'top 85%',
              once: true,
            },
            onComplete: () => {
              gsap.to(icon, {
                boxShadow: '0 0 20px rgba(214, 6, 0, 0.4)',
                duration: 0.6,
                ease: 'power2.out',
              });
            }
          });
        }
      });
    }

    // Product cards — stagger with rotation
    const productCards = gsap.utils.toArray('.product-card');
    if (productCards.length) {
      gsap.from(productCards, {
        y: 80,
        opacity: 0,
        rotateX: -10,
        duration: 0.7,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.products-grid',
          start: 'top 80%',
          once: true,
        },
      });
    }

    // Stat numbers counter animation
    gsap.utils.toArray('.stat-item__number').forEach(el => {
      const val = el.textContent;
      const num = parseInt(val);
      if (!isNaN(num)) {
        const suffix = val.replace(String(num), '');
        const obj = { val: 0 };
        gsap.to(obj, {
          val: num,
          duration: 1.5,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
          onUpdate: () => {
            el.textContent = Math.round(obj.val) + suffix;
          },
        });
      }
    });

    // Contact cards — slide in with stagger
    const contactCards = gsap.utils.toArray('.contact-info-card');
    if (contactCards.length) {
      gsap.from(contactCards, {
        x: 40,
        opacity: 0,
        rotateY: -5,
        duration: 0.6,
        stagger: 0.08,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.contact-info-cards',
          start: 'top 80%',
          once: true,
        },
      });
    }

    // Accent line animations
    gsap.utils.toArray('.accent-line').forEach(el => {
      gsap.from(el, {
        width: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      });
    });

    // Image clip-path wipe reveals
    gsap.utils.toArray('.about-grid img, .product-card__image').forEach(el => {
      gsap.from(el, {
        clipPath: 'inset(0 100% 0 0)',
        duration: 1,
        ease: 'power3.inOut',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          once: true,
        },
      });
    });

    // Page hero text animations
    const pageHero = document.querySelector('.page-hero');
    if (pageHero) {
      const h1 = pageHero.querySelector('h1');
      const p = pageHero.querySelector('p');
      if (h1) {
        gsap.from(h1, {
          y: 40,
          opacity: 0,
          duration: 0.8,
          ease: 'power3.out',
          delay: 0.2,
        });
      }
      if (p) {
        gsap.from(p, {
          y: 30,
          opacity: 0,
          duration: 0.8,
          ease: 'power3.out',
          delay: 0.4,
        });
      }
    }

    // CTA section (subpages)
    const ctaSub = document.querySelector('.cta-section .container');
    if (ctaSub) {
      gsap.from(ctaSub.children, {
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: { trigger: ctaSub, start: 'top 80%', once: true },
      });
    }

    // Product accordion categories — stagger entry
    const productCategories = gsap.utils.toArray('.product-category');
    if (productCategories.length) {
      gsap.from(productCategories, {
        y: 30,
        opacity: 0,
        duration: 0.5,
        stagger: 0.05,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.product-accordion',
          start: 'top 85%',
          once: true,
        },
      });
    }
  }

  // --- PRODUCT ACCORDION TOGGLE ---
  function openCategory(category) {
    if (!category) return;
    const body = category.querySelector('.product-category__body');
    const header = category.querySelector('.product-category__header');
    // Close others
    document.querySelectorAll('.product-category.active').forEach(other => {
      if (other !== category) {
        other.classList.remove('active');
        other.querySelector('.product-category__header').setAttribute('aria-expanded', 'false');
        other.querySelector('.product-category__body').style.maxHeight = '0';
      }
    });
    category.classList.add('active');
    header.setAttribute('aria-expanded', 'true');
    body.style.maxHeight = body.scrollHeight + 'px';
  }

  document.querySelectorAll('.product-category__header').forEach(header => {
    header.addEventListener('click', () => {
      const category = header.closest('.product-category');
      const body = category.querySelector('.product-category__body');
      const isActive = category.classList.contains('active');

      if (isActive) {
        category.classList.remove('active');
        header.setAttribute('aria-expanded', 'false');
        body.style.maxHeight = '0';
      } else {
        openCategory(category);
      }
    });
  });

  // Auto-open product accordion from hash (e.g. products.html#cat-lathes)
  function handleHashOpen() {
    if (!location.hash) return;
    const el = document.querySelector(location.hash);
    if (el && el.classList.contains('product-category')) {
      openCategory(el);
      setTimeout(() => {
        const y = el.getBoundingClientRect().top + window.scrollY - 100;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }, 120);
    }
  }
  // Delay so preloader finishes first
  setTimeout(handleHashOpen, 600);
  window.addEventListener('hashchange', handleHashOpen);

  // --- SITE SEARCH ---
  const SEARCH_INDEX = [
    // Products — category pages auto-open
    { title: 'Lathes', keywords: 'lathe lathes cnc precision turning takamaz trak lagun sharp', page: 'products.html', hash: '#cat-lathes', section: 'Products' },
    { title: 'Milling Machines', keywords: 'mill milling mills knee bed vertical prototrak trak sharp lagun', page: 'products.html', hash: '#cat-milling', section: 'Products' },
    { title: 'Grinders', keywords: 'grinder grinding surface cylindrical chevalier supertec', page: 'products.html', hash: '#cat-grinders', section: 'Products' },
    { title: 'EDM Machines', keywords: 'edm electrical discharge wire sinker sodick mitsui hanwha', page: 'products.html', hash: '#cat-edm', section: 'Products' },
    { title: '3D Metal Printer', keywords: '3d metal printing additive printer', page: 'products.html', hash: '#cat-3d-printer', section: 'Products' },
    { title: 'Tools & Tooling', keywords: 'tools tooling cutters drills inserts', page: 'products.html', hash: '#cat-tools', section: 'Products' },
    { title: 'Drilling Machines', keywords: 'drill drilling radial gang', page: 'products.html', hash: '#cat-drilling', section: 'Products' },
    { title: 'Heat Treat Furnaces', keywords: 'furnace heat treat treating oven cress annealing', page: 'products.html', hash: '#cat-furnaces', section: 'Products' },
    { title: 'Saws', keywords: 'saw saws band bandsaw cutoff', page: 'products.html', hash: '#cat-saws', section: 'Products' },
    { title: 'Welders', keywords: 'welder welding laser welding laserstar repair mold die', page: 'products.html', hash: '#cat-welders', section: 'Products' },
    { title: 'Laser, Plasma & Router Systems', keywords: 'laser plasma router cnc cutting', page: 'products.html', hash: '#cat-laser-plasma', section: 'Products' },
    { title: 'Storage Solutions', keywords: 'storage tool crib shelving cabinets', page: 'products.html', hash: '#cat-storage', section: 'Products' },
    { title: 'CAD/CAM Software', keywords: 'software cad cam programming', page: 'products.html', hash: '#cat-software', section: 'Products' },
    { title: 'Rotary Transfers', keywords: 'rotary transfer multi-spindle', page: 'products.html', hash: '#cat-rotary', section: 'Products' },
    { title: 'Multi-Axes Machines', keywords: 'multi axes 5-axis 6-axis machining', page: 'products.html', hash: '#cat-multi-axes', section: 'Products' },
    { title: 'Water Jets', keywords: 'waterjet water jet cutting omax', page: 'products.html', hash: '#cat-waterjet', section: 'Products' },
    { title: 'Quality Control Equipment', keywords: 'quality control cmm inspection metrology measuring', page: 'products.html', hash: '#cat-quality', section: 'Products' },
    { title: 'Bar Chargers & Accessories', keywords: 'bar chargers feeder accessories edge', page: 'products.html', hash: '#cat-bar-chargers', section: 'Products' },
    { title: 'Circuit Board Repair', keywords: 'repair replacement circuit electronic boards pcb', page: 'products.html', hash: '#cat-repair', section: 'Products' },
    // Services
    { title: 'CNC Machine Sales', keywords: 'sales buy purchase new used pre-owned financing', page: 'services.html', hash: '', section: 'Services' },
    { title: 'Installation & Setup', keywords: 'install installation setup delivery rigging calibration leveling', page: 'services.html', hash: '', section: 'Services' },
    { title: 'Preventive Maintenance & Repair', keywords: 'maintenance repair preventive service breakdown calibration alignment', page: 'services.html', hash: '', section: 'Services' },
    { title: 'Parts & Accessories', keywords: 'parts accessories oem wire filters consumables tooling', page: 'services.html', hash: '', section: 'Services' },
    { title: 'Training & Technical Support', keywords: 'training programming support operator technical', page: 'services.html', hash: '', section: 'Services' },
    { title: 'Financing Options', keywords: 'financing leasing payment plans credit', page: 'services.html', hash: '', section: 'Services' },
    // About
    { title: 'About Our Company', keywords: 'about history story 2000 established 25 years experience', page: 'about.html', hash: '', section: 'About' },
    { title: 'Coverage Area', keywords: 'coverage area map el paso juarez new mexico border tijuana brownsville albuquerque', page: 'about.html', hash: '', section: 'About' },
    { title: 'Why Choose Us', keywords: 'why choose authorized dealer bilingual spanish english rapid response', page: 'about.html', hash: '', section: 'About' },
    // Contact
    { title: 'Contact Us', keywords: 'contact phone email address form quote message', page: 'contact.html', hash: '', section: 'Contact' },
    { title: 'Get a Quote', keywords: 'quote pricing estimate inquiry', page: 'contact.html', hash: '', section: 'Contact' },
    // Industries
    { title: 'Automotive Industry', keywords: 'automotive engines transmissions chassis', page: 'index.html', hash: '', section: 'Home' },
    { title: 'Aerospace Industry', keywords: 'aerospace airframe turbine aviation', page: 'index.html', hash: '', section: 'Home' },
    { title: 'Medical Industry', keywords: 'medical surgical implants devices', page: 'index.html', hash: '', section: 'Home' },
    { title: 'Mold & Die', keywords: 'mold die tooling dies edm', page: 'index.html', hash: '', section: 'Home' },
  ];

  function searchQuery(q) {
    q = q.trim().toLowerCase();
    if (!q) return [];
    const terms = q.split(/\s+/).filter(Boolean);
    const scored = SEARCH_INDEX.map(item => {
      const hay = (item.title + ' ' + item.keywords + ' ' + item.section).toLowerCase();
      let score = 0;
      for (const t of terms) {
        if (hay.includes(t)) score += 2;
        if (item.title.toLowerCase().includes(t)) score += 3;
      }
      return { item, score };
    }).filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
    return scored.map(x => x.item);
  }

  function renderResults(results, container) {
    if (!results.length) {
      container.innerHTML = '<div class="search-results__empty">No matches found</div>';
      container.classList.add('open');
      return;
    }
    container.innerHTML = results.map(r =>
      `<a class="search-result" href="${r.page}${r.hash}"><span class="search-result__title">${r.title}</span><span class="search-result__section">${r.section}</span></a>`
    ).join('');
    container.classList.add('open');
  }

  function initSearch(root) {
    const input = root.querySelector('.site-search__input');
    const toggleBtn = root.querySelector('.site-search__toggle');
    const results = root.querySelector('.site-search__results');
    const clearBtn = root.querySelector('.site-search__clear');
    if (!input || !results) return;

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        root.classList.toggle('open');
        if (root.classList.contains('open')) {
          setTimeout(() => input.focus(), 50);
        }
      });
    }

    input.addEventListener('input', () => {
      const q = input.value;
      if (clearBtn) clearBtn.style.display = q ? 'flex' : 'none';
      if (!q.trim()) { results.classList.remove('open'); results.innerHTML = ''; return; }
      renderResults(searchQuery(q), results);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { root.classList.remove('open'); input.value=''; results.innerHTML=''; results.classList.remove('open'); }
      if (e.key === 'Enter') {
        const first = results.querySelector('.search-result');
        if (first) window.location.href = first.getAttribute('href');
      }
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        input.value = '';
        input.focus();
        results.classList.remove('open');
        results.innerHTML = '';
        clearBtn.style.display = 'none';
      });
    }

    document.addEventListener('click', (e) => {
      if (!root.contains(e.target)) {
        results.classList.remove('open');
        root.classList.remove('open');
      }
    });
  }

  document.querySelectorAll('.site-search').forEach(initSearch);
});
