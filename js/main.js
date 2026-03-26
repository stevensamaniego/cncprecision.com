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

      // Ellipse parameters (match logo proportions)
      const W = window.innerWidth;
      const H = window.innerHeight;
      const ellipseRx = Math.min(W * 0.22, 200);
      const ellipseRy = Math.min(H * 0.14, 130);
      const ellipseCx = W / 2;
      const ellipseCy = H / 2 - 40;

      function getEllipsePoint(t) {
        const angle = t * Math.PI * 2 - Math.PI / 2; // start at top
        return {
          x: ellipseCx + Math.cos(angle) * ellipseRx,
          y: ellipseCy + Math.sin(angle) * ellipseRy,
        };
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
            const head = getEllipsePoint(laserProgress);
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
            laserTrail.push(getEllipsePoint(interpT));
          }
          laserTrail.push(getEllipsePoint(traceObj.t));

          // Emit sparks + coolant at head
          const head = getEllipsePoint(traceObj.t);
          emitSparks(head.x, head.y);
          emitCoolant(head.x, head.y);
          lastTraceT = traceObj.t;
        },
        onComplete: () => {
          // Close the loop
          laserTrail.push(getEllipsePoint(0));
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

    // Subpage fade-in elements — more cinematic
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

    // Service cards — 3D perspective tilt with back overshoot
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
  }
});
