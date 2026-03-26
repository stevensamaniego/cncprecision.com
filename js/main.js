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
    const MAX_SPARKS = isMobile ? 25 : 60;
    const TRAIL_LEN = isMobile ? 3 : 5;
    const sparks = [];

    function spawnSpark(bx, by, burst) {
      let x, y, vx, vy;
      if (burst && bx !== undefined) {
        x = bx;
        y = by;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 1.5;
        vx = Math.cos(angle) * speed;
        vy = Math.sin(angle) * speed - 1;
      } else {
        const edge = Math.random();
        if (edge < 0.5) {
          x = edge < 0.25 ? -5 : canvas.width + 5;
          y = Math.random() * canvas.height;
        } else {
          x = Math.random() * canvas.width;
          y = edge < 0.75 ? -5 : canvas.height + 5;
        }
        const tx = Math.random() * canvas.width;
        const ty = Math.random() * canvas.height;
        const angle = Math.atan2(ty - y, tx - x);
        const speed = Math.random() * 1.5 + 0.5;
        vx = Math.cos(angle) * speed;
        vy = Math.sin(angle) * speed;
      }

      return {
        x, y, vx, vy,
        life: 1,
        decay: Math.random() * 0.008 + 0.004,
        size: Math.random() * 2 + 0.5,
        trail: [],
        gravity: 0.015 + Math.random() * 0.025,
      };
    }

    // Seed initial sparks
    for (let i = 0; i < MAX_SPARKS * 0.4; i++) {
      const s = spawnSpark();
      s.life = Math.random();
      s.x = Math.random() * canvas.width;
      s.y = Math.random() * canvas.height;
      sparks.push(s);
    }

    // --- Laser Trace System ---
    const MAX_LASERS = isMobile ? 1 : 3;
    const lasers = [];

    function spawnLaser() {
      const goRight = Math.random() > 0.5;
      const y = Math.random() * canvas.height;
      return {
        x: goRight ? -150 : canvas.width + 150,
        y: y,
        speed: goRight ? (Math.random() * 1.5 + 1) : -(Math.random() * 1.5 + 1),
        angle: (Math.random() - 0.5) * 0.15,
        length: Math.random() * 250 + 120,
        pulse: Math.random() * Math.PI * 2,
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

      // --- Occasional burst ---
      burstCooldown++;
      if (burstCooldown > (isMobile ? 400 : 200) && Math.random() < 0.015) {
        const bx = Math.random() * canvas.width;
        const by = vpTop + Math.random() * viewH;
        const count = isMobile ? 4 : 10;
        for (let i = 0; i < count && sparks.length < MAX_SPARKS; i++) {
          sparks.push(spawnSpark(bx, by, true));
        }
        burstCooldown = 0;
      }

      // --- Maintain spark count ---
      while (sparks.length < MAX_SPARKS * 0.4) {
        const s = spawnSpark();
        s.y = vpTop + Math.random() * viewH;
        sparks.push(s);
      }

      // --- Update & draw sparks ---
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];

        s.trail.push({ x: s.x, y: s.y });
        if (s.trail.length > TRAIL_LEN) s.trail.shift();

        s.vy += s.gravity;
        s.x += s.vx;
        s.y += s.vy;
        s.life -= s.decay;

        if (s.life <= 0 || s.x < -60 || s.x > canvas.width + 60 || s.y > canvas.height + 60 || s.y < -60) {
          sparks.splice(i, 1);
          continue;
        }

        // Skip drawing if far from viewport
        if (s.y < vpTop - 100 || s.y > vpBot + 100) continue;

        // Color based on life: white-hot → orange → red
        let r, g, b;
        if (s.life > 0.7) {
          r = 255;
          g = Math.min(255, 200 + (s.life - 0.7) * 183);
          b = Math.min(255, 100 + (s.life - 0.7) * 517);
        } else if (s.life > 0.3) {
          const t = (s.life - 0.3) / 0.4;
          r = 255;
          g = Math.round(20 + t * 180);
          b = 0;
        } else {
          r = 214; g = 6; b = 0;
        }

        // Draw trail
        for (let t = 0; t < s.trail.length; t++) {
          const pt = s.trail[t];
          const ta = (t / s.trail.length) * s.life * 0.35;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, s.size * 0.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r},${g},${b},${ta})`;
          ctx.fill();
        }

        // Draw spark head
        const alpha = s.life * 0.7;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.fill();

        // Glow
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha * 0.08})`;
        ctx.fill();
      }

      // --- Update & draw laser traces ---
      for (let i = 0; i < lasers.length; i++) {
        const l = lasers[i];
        l.x += l.speed;
        l.y += Math.sin(l.angle) * Math.abs(l.speed) * 0.5;
        l.pulse += 0.04;

        const offRight = l.speed > 0 && l.x - l.length > canvas.width + 60;
        const offLeft = l.speed < 0 && l.x + l.length < -60;
        if (offRight || offLeft) {
          lasers[i] = spawnLaser();
          lasers[i].y = vpTop + Math.random() * viewH;
          continue;
        }

        // Skip if not in viewport
        if (l.y < vpTop - 100 || l.y > vpBot + 100) continue;

        const intensity = 0.5 + Math.sin(l.pulse) * 0.3;
        const headX = l.x;
        const headY = l.y;
        const dir = l.speed > 0 ? -1 : 1;
        const tailX = l.x + dir * l.length;
        const tailY = l.y + dir * Math.sin(l.angle) * l.length * 0.5;

        // Laser line
        const grad = ctx.createLinearGradient(tailX, tailY, headX, headY);
        grad.addColorStop(0, 'rgba(214,6,0,0)');
        grad.addColorStop(0.6, `rgba(214,6,0,${0.12 * intensity})`);
        grad.addColorStop(1, `rgba(214,6,0,${0.35 * intensity})`);

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(headX, headY);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Bright head
        ctx.beginPath();
        ctx.arc(headX, headY, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${0.5 * intensity})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(headX, headY, 5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(214,6,0,${0.15 * intensity})`;
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
