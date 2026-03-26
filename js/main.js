/* ============================================
   CNC PRECISION MACHINES — MAIN JS
   GSAP + ScrollTrigger + Swiper
   CNC-Themed Effects: Sparks, Lasers, Breathing
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- CINEMATIC PRELOADER ---
  const preloader = document.querySelector('.preloader');
  if (preloader) {

    if (prefersReduced) {
      setTimeout(() => {
        preloader.style.display = 'none';
      }, 300);
    } else {
      const logo = preloader.querySelector('.preloader__logo');
      const sweep = preloader.querySelector('.preloader__sweep');
      const textSpans = preloader.querySelectorAll('.preloader__text span');
      const canvas = document.getElementById('sparkCanvas');

      // --- Preloader Spark Particle System ---
      let sparksRunning = true;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const sparks = [];
        const SPARK_COUNT = 60;

        for (let i = 0; i < SPARK_COUNT; i++) {
          sparks.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3,
            size: Math.random() * 3 + 1,
            life: Math.random(),
            decay: Math.random() * 0.008 + 0.003,
            hue: Math.random() > 0.5 ? 0 : 20,
          });
        }

        function animateSparks() {
          if (!sparksRunning) return;
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          sparks.forEach(s => {
            s.x += s.vx;
            s.y += s.vy;
            s.life -= s.decay;

            if (s.life <= 0) {
              s.x = canvas.width / 2 + (Math.random() - 0.5) * canvas.width * 0.6;
              s.y = canvas.height / 2 + (Math.random() - 0.5) * canvas.height * 0.6;
              s.life = 1;
              s.vx = (Math.random() - 0.5) * 4;
              s.vy = (Math.random() - 0.5) * 4;
            }

            const alpha = s.life * 0.9;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${s.hue}, 100%, 55%, ${alpha})`;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size * 3, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${s.hue}, 100%, 55%, ${alpha * 0.15})`;
            ctx.fill();
          });

          requestAnimationFrame(animateSparks);
        }
        animateSparks();
      }

      // --- GSAP Preloader Timeline ---
      const tl = gsap.timeline({
        onComplete: () => {
          sparksRunning = false;
          preloader.classList.add('dismiss');
          gsap.to(preloader, {
            opacity: 0,
            duration: 0.6,
            ease: 'power2.inOut',
            onComplete: () => {
              preloader.style.display = 'none';
            }
          });
        }
      });

      // Stage 1: Sparks scatter, wait a beat
      tl.to({}, { duration: 0.6 });

      // Stage 2: Logo fades in
      tl.to(logo, {
        opacity: 1,
        filter: 'blur(0px) brightness(1)',
        scale: 1,
        duration: 1.2,
        ease: 'power3.out',
      });

      // Stage 3: Metallic glow pulse
      tl.to(logo, {
        filter: 'blur(0px) brightness(1.3) drop-shadow(0 0 30px rgba(214, 6, 0, 0.6))',
        duration: 0.4,
        ease: 'power2.in',
      });

      tl.to(logo, {
        filter: 'blur(0px) brightness(1) drop-shadow(0 0 15px rgba(214, 6, 0, 0.3))',
        duration: 0.5,
        ease: 'power2.out',
      });

      // Stage 4: Light sweep
      tl.to(sweep, {
        left: '140%',
        duration: 0.8,
        ease: 'power2.inOut',
      }, '-=0.6');

      // Stage 5: Text reveal
      tl.to(textSpans, {
        opacity: 1,
        y: 0,
        duration: 0.4,
        stagger: 0.03,
        ease: 'power3.out',
      }, '-=0.3');

      // Stage 6: Final pulse
      tl.to(logo, {
        scale: 1.03,
        duration: 0.1,
        ease: 'power4.in',
      });
      tl.to(logo, {
        scale: 1,
        duration: 0.3,
        ease: 'elastic.out(1, 0.4)',
      });

      // Stage 7: Transition into breathing animation
      tl.call(() => {
        gsap.set(logo, { clearProps: 'filter,transform' });
        logo.classList.add('logo-breathing');
      });

      // Hold with breathing visible
      tl.to({}, { duration: 1.5 });
    }
  }

  // --- WHO WE ARE LOGO BREATHING (IntersectionObserver) ---
  const aboutLogo = document.querySelector('.about-preview__visual img');
  if (aboutLogo && !prefersReduced) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          aboutLogo.classList.add('logo-breathing');
        } else {
          aboutLogo.classList.remove('logo-breathing');
        }
      });
    }, { threshold: 0.2 });
    observer.observe(aboutLogo);
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
      direction: 'vertical',
      loop: true,
      speed: 1000,
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

  // =========================================
  //  CNC BACKGROUND PARTICLE CANVAS
  //  Sparks + Laser Traces
  // =========================================
  (function initCNCCanvas() {
    if (prefersReduced) return;

    const canvas = document.getElementById('cncCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const isMobile = window.innerWidth < 768;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = document.documentElement.scrollHeight;
    }
    resize();

    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(resize, 200);
    });

    // --- Spark System ---
    const MAX_SPARKS = isMobile ? 20 : 40;
    const TRAIL_LEN = isMobile ? 5 : 10;
    const sparks = [];

    function spawnSpark(bx, by, burst) {
      let x, y, vx, vy, decay, size;
      if (burst && bx !== undefined) {
        // Burst spark — fast, bright, short-lived arc like angle grinder
        x = bx;
        y = by;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 5; // 5-10 initial speed
        vx = Math.cos(angle) * speed;
        vy = Math.sin(angle) * speed - 2; // upward bias
        decay = Math.random() * 0.02 + 0.025; // 0.025-0.045 — burns out fast
        size = Math.random() * 1.5 + 1;
      } else {
        // Ambient spark — still fast and arc-shaped, not floaty
        x = Math.random() * canvas.width;
        y = -5;
        const angle = Math.PI * 0.25 + Math.random() * Math.PI * 0.5; // downward spray
        const speed = Math.random() * 4 + 4; // 4-8
        vx = Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1);
        vy = Math.sin(angle) * speed;
        decay = Math.random() * 0.015 + 0.02; // 0.02-0.035
        size = Math.random() * 1.2 + 0.8;
      }

      return {
        x, y, vx, vy,
        life: 1,
        decay: decay,
        size: size,
        trail: [],
        gravity: 0.15 + Math.random() * 0.15, // 0.15-0.3 — visible arcs
      };
    }

    // --- Laser Trace System (desktop only) ---
    const MAX_LASERS = isMobile ? 0 : 2;
    const lasers = [];
    const laserMicroSparks = []; // tiny sparks emitted from laser head

    function spawnLaser(vpTop, vpH) {
      // Pick a start point on the visible viewport
      const startX = Math.random() * canvas.width;
      const startY = (vpTop || 0) + Math.random() * (vpH || window.innerHeight);
      // Pick a target point — straight line or gentle curve
      const targetX = Math.random() * canvas.width;
      const targetY = (vpTop || 0) + Math.random() * (vpH || window.innerHeight);

      return {
        x: startX,
        y: startY,
        targetX: targetX,
        targetY: targetY,
        trail: [{ x: startX, y: startY }],
        maxTrailLen: 80,
        speed: 2.5 + Math.random() * 1.5, // deliberate, not drifty
        paused: 0, // frames to pause at endpoint
        pauseTimer: 0,
        progress: 0,
        // Gentle curve control point
        cpX: (startX + targetX) / 2 + (Math.random() - 0.5) * 200,
        cpY: (startY + targetY) / 2 + (Math.random() - 0.5) * 100,
      };
    }

    for (let i = 0; i < MAX_LASERS; i++) {
      lasers.push(spawnLaser());
    }

    // --- Burst timer ---
    let burstCooldown = 0;

    // --- Scroll-aware viewport ---
    let scrollY = window.scrollY;
    let viewH = window.innerHeight;
    window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });
    window.addEventListener('resize', () => { viewH = window.innerHeight; }, { passive: true });

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const vpTop = scrollY;
      const vpBot = scrollY + viewH;

      // --- Frequent bursts (like angle grinder hitting steel) ---
      burstCooldown++;
      const burstInterval = isMobile ? 120 : 60;
      if (burstCooldown > burstInterval && Math.random() < 0.06) {
        const bx = Math.random() * canvas.width;
        const by = vpTop + Math.random() * viewH;
        const count = isMobile ? 8 : Math.floor(Math.random() * 11) + 15; // 15-25
        for (let i = 0; i < count && sparks.length < MAX_SPARKS; i++) {
          sparks.push(spawnSpark(bx, by, true));
        }
        burstCooldown = 0;
      }

      // --- Only a few ambient sparks between bursts ---
      while (sparks.length < (isMobile ? 3 : 6)) {
        const s = spawnSpark();
        s.y = vpTop + Math.random() * viewH * 0.3;
        sparks.push(s);
      }

      // --- Update & draw sparks ---
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];

        s.trail.push({ x: s.x, y: s.y });
        if (s.trail.length > TRAIL_LEN) s.trail.shift();

        s.vy += s.gravity;
        s.vx *= 0.99; // slight air drag
        s.x += s.vx;
        s.y += s.vy;
        s.life -= s.decay;

        if (s.life <= 0 || s.x < -60 || s.x > canvas.width + 60 || s.y > canvas.height + 60 || s.y < -60) {
          sparks.splice(i, 1);
          continue;
        }

        // Skip drawing if far from viewport
        if (s.y < vpTop - 100 || s.y > vpBot + 100) continue;

        // Color: white-hot → yellow → orange → red (fast transition)
        let r, g, b;
        if (s.life > 0.8) {
          // White-hot
          r = 255; g = 255; b = 255;
        } else if (s.life > 0.6) {
          // Yellow-white to bright orange
          const t = (s.life - 0.6) / 0.2;
          r = 255;
          g = Math.round(180 + t * 75);
          b = Math.round(t * 180);
        } else if (s.life > 0.3) {
          // Orange to red
          const t = (s.life - 0.3) / 0.3;
          r = 255;
          g = Math.round(40 + t * 140);
          b = 0;
        } else {
          // Dim red
          const t = s.life / 0.3;
          r = Math.round(150 + t * 64);
          g = Math.round(t * 6);
          b = 0;
        }

        // Draw trail as a connected path with tapering width
        if (s.trail.length > 1) {
          for (let t = 1; t < s.trail.length; t++) {
            const p0 = s.trail[t - 1];
            const p1 = s.trail[t];
            const frac = t / s.trail.length;
            const alpha = frac * s.life * 0.8;
            const width = frac * s.size * 1.5;
            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            ctx.lineTo(p1.x, p1.y);
            ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
            ctx.lineWidth = width;
            ctx.lineCap = 'round';
            ctx.stroke();
          }
        }

        // Draw spark head — bright dot
        const alpha = Math.min(1, s.life * 1.2);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.fill();

        // Hot glow around head
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * 4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,200,50,${alpha * 0.12})`;
        ctx.fill();
      }

      // --- Update & draw laser traces (desktop only) ---
      for (let i = 0; i < lasers.length; i++) {
        const l = lasers[i];

        // Pause at endpoints (CNC repositioning)
        if (l.pauseTimer > 0) {
          l.pauseTimer--;
          // Still draw the head glowing while paused
          const hx = l.x;
          const hy = l.y;
          if (hy >= vpTop - 50 && hy <= vpBot + 50) {
            // Pulsing glow while paused
            const pulse = 0.6 + Math.sin(l.pauseTimer * 0.3) * 0.4;
            const glowGrad = ctx.createRadialGradient(hx, hy, 0, hx, hy, 10 * pulse);
            glowGrad.addColorStop(0, `rgba(255,255,255,${0.9 * pulse})`);
            glowGrad.addColorStop(0.3, `rgba(214,6,0,${0.5 * pulse})`);
            glowGrad.addColorStop(1, 'rgba(214,6,0,0)');
            ctx.beginPath();
            ctx.arc(hx, hy, 10 * pulse, 0, Math.PI * 2);
            ctx.fillStyle = glowGrad;
            ctx.fill();
          }
          if (l.pauseTimer <= 0) {
            // Pick new target
            l.targetX = Math.random() * canvas.width;
            l.targetY = vpTop + Math.random() * viewH;
            l.trail = [{ x: l.x, y: l.y }];
            l.cpX = (l.x + l.targetX) / 2 + (Math.random() - 0.5) * 150;
            l.cpY = (l.y + l.targetY) / 2 + (Math.random() - 0.5) * 80;
            l.progress = 0;
            const dx = l.targetX - l.x;
            const dy = l.targetY - l.y;
            l.totalDist = Math.sqrt(dx * dx + dy * dy);
          }
          continue;
        }

        // Move toward target along quadratic bezier
        const dx = l.targetX - l.x;
        const dy = l.targetY - l.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (!l.totalDist) l.totalDist = dist || 1;
        l.progress += l.speed / l.totalDist;
        if (l.progress > 1) l.progress = 1;

        const t = l.progress;
        const mt = 1 - t;
        const startPt = l.trail[0];
        const newX = mt * mt * startPt.x + 2 * mt * t * l.cpX + t * t * l.targetX;
        const newY = mt * mt * startPt.y + 2 * mt * t * l.cpY + t * t * l.targetY;

        l.x = newX;
        l.y = newY;

        l.trail.push({ x: l.x, y: l.y });
        if (l.trail.length > l.maxTrailLen) l.trail.shift();

        // Arrived at target — pause before next move
        if (l.progress >= 1) {
          l.pauseTimer = Math.floor(Math.random() * 40) + 20; // 20-60 frame pause
          continue;
        }

        // Skip drawing if far from viewport
        if (l.y < vpTop - 100 || l.y > vpBot + 100) continue;

        // Draw laser trail — crisp red line with glow
        if (l.trail.length > 1) {
          // Outer glow pass
          ctx.beginPath();
          ctx.moveTo(l.trail[0].x, l.trail[0].y);
          for (let j = 1; j < l.trail.length; j++) {
            ctx.lineTo(l.trail[j].x, l.trail[j].y);
          }
          ctx.strokeStyle = 'rgba(214,6,0,0.3)';
          ctx.lineWidth = 4;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();

          // Crisp core line
          ctx.beginPath();
          ctx.moveTo(l.trail[0].x, l.trail[0].y);
          for (let j = 1; j < l.trail.length; j++) {
            ctx.lineTo(l.trail[j].x, l.trail[j].y);
          }
          ctx.strokeStyle = 'rgba(214,6,0,0.85)';
          ctx.lineWidth = 1.5;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();

          // Fade out the tail end
          if (l.trail.length > 3) {
            const fadeLen = Math.min(15, Math.floor(l.trail.length * 0.3));
            ctx.beginPath();
            ctx.moveTo(l.trail[0].x, l.trail[0].y);
            for (let j = 1; j < fadeLen; j++) {
              ctx.lineTo(l.trail[j].x, l.trail[j].y);
            }
            ctx.strokeStyle = 'rgba(10,10,10,0.8)';
            ctx.lineWidth = 6;
            ctx.lineCap = 'round';
            ctx.stroke();
          }
        }

        // Bright white laser head with radial gradient glow
        const hx = l.x;
        const hy = l.y;
        const headGrad = ctx.createRadialGradient(hx, hy, 0, hx, hy, 12);
        headGrad.addColorStop(0, 'rgba(255,255,255,1)');
        headGrad.addColorStop(0.2, 'rgba(255,255,255,0.8)');
        headGrad.addColorStop(0.5, 'rgba(214,6,0,0.4)');
        headGrad.addColorStop(1, 'rgba(214,6,0,0)');
        ctx.beginPath();
        ctx.arc(hx, hy, 12, 0, Math.PI * 2);
        ctx.fillStyle = headGrad;
        ctx.fill();

        // Bright white core dot
        ctx.beginPath();
        ctx.arc(hx, hy, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.fill();

        // Emit 2-3 micro sparks from laser head
        const microCount = Math.floor(Math.random() * 2) + 2;
        for (let m = 0; m < microCount; m++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 3 + 1;
          laserMicroSparks.push({
            x: hx, y: hy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 1,
            life: 1,
            decay: 0.06 + Math.random() * 0.06, // very short life
            size: Math.random() * 0.8 + 0.4,
          });
        }
        // Cap micro sparks
        while (laserMicroSparks.length > 60) laserMicroSparks.shift();
      }

      // --- Update & draw laser micro sparks ---
      for (let i = laserMicroSparks.length - 1; i >= 0; i--) {
        const ms = laserMicroSparks[i];
        ms.vy += 0.12;
        ms.x += ms.vx;
        ms.y += ms.vy;
        ms.life -= ms.decay;

        if (ms.life <= 0) {
          laserMicroSparks.splice(i, 1);
          continue;
        }

        if (ms.y < vpTop - 50 || ms.y > vpBot + 50) continue;

        // White to orange micro spark
        const ml = ms.life;
        const mr = 255;
        const mg = Math.round(ml > 0.5 ? 255 : 100 + ml * 310);
        const mb = Math.round(ml > 0.5 ? 200 * ml : 0);
        ctx.beginPath();
        ctx.arc(ms.x, ms.y, ms.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${mr},${mg},${mb},${ml})`;
        ctx.fill();
      }

      requestAnimationFrame(animate);
    }

    animate();
  })();

  // --- GSAP + SCROLLTRIGGER ---
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    if (prefersReduced) return;

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

    // Section headers
    gsap.utils.toArray('.section-header').forEach(el => {
      animateHeaderText(el);
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

    // Machine cards
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

    // Industry cards
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

    // About preview
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

    // CTA section (home)
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
        y: 80,
        opacity: 0,
        rotateX: -10,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          once: true,
        },
      });
    });

    // Service cards
    const serviceCards = gsap.utils.toArray('.service-card');
    if (serviceCards.length) {
      gsap.from(serviceCards, {
        y: 80,
        opacity: 0,
        rotateX: -15,
        rotateY: 5,
        duration: 0.8,
        stagger: 0.1,
        ease: 'back.out(1.7)',
        scrollTrigger: {
          trigger: '.services-grid',
          start: 'top 80%',
          once: true,
        },
      });

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

    // Product cards
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

    // Stat counters
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

    // Contact cards
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

    // Accent lines
    gsap.utils.toArray('.accent-line').forEach(el => {
      gsap.from(el, {
        width: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      });
    });

    // Image clip-path reveals
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

    // Page hero text
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

    // =========================================
    //  LASER DIVIDER ANIMATIONS
    // =========================================
    gsap.utils.toArray('.laser-divider').forEach(divider => {
      const line = divider.querySelector('.laser-divider__line');
      const point = divider.querySelector('.laser-divider__point');
      if (!line || !point) return;

      const divTl = gsap.timeline({
        scrollTrigger: {
          trigger: divider,
          start: 'top 90%',
          once: true,
        }
      });

      // Point appears and sweeps left to right
      divTl.set(point, { opacity: 1, left: '0%' });
      divTl.to(point, {
        left: '100%',
        duration: 1.2,
        ease: 'power2.inOut',
      });

      // Line draws behind the point
      divTl.to(line, {
        width: '100%',
        duration: 1.2,
        ease: 'power2.inOut',
      }, '<');

      // Point fades after reaching end
      divTl.to(point, {
        opacity: 0,
        duration: 0.3,
        ease: 'power2.out',
      }, '-=0.1');

      // Line settles to subtle
      divTl.to(line, {
        opacity: 0.4,
        duration: 0.5,
        ease: 'power2.out',
      });
    });
  }
});
