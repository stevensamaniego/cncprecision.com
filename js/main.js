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
      // Instant dismiss for reduced motion
      setTimeout(() => {
        preloader.style.display = 'none';
      }, 300);
    } else {
      const logo = preloader.querySelector('.preloader__logo');
      const sweep = preloader.querySelector('.preloader__sweep');
      const textSpans = preloader.querySelectorAll('.preloader__text span');
      const canvas = document.getElementById('sparkCanvas');

      // --- Spark Particle System ---
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
            hue: Math.random() > 0.5 ? 0 : 20, // red to orange
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

            // Glow
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size * 3, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${s.hue}, 100%, 55%, ${alpha * 0.15})`;
            ctx.fill();
          });

          requestAnimationFrame(animateSparks);
        }
        animateSparks();
      }

      // --- GSAP Timeline ---
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

      // Stage 1: Sparks scatter (already running), wait a beat
      tl.to({}, { duration: 0.6 });

      // Stage 2: Logo fades in from behind sparks, blurred -> sharp, scale 0.95 -> 1.0
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

      // Stage 4: Light sweep across logo
      tl.to(sweep, {
        left: '140%',
        duration: 0.8,
        ease: 'power2.inOut',
      }, '-=0.6');

      // Stage 5: Text letter-by-letter reveal
      tl.to(textSpans, {
        opacity: 1,
        y: 0,
        duration: 0.4,
        stagger: 0.03,
        ease: 'power3.out',
      }, '-=0.3');

      // Stage 6: Subtle pulse/shake on final reveal
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

      // Stage 7: Hold then fade out
      tl.to({}, { duration: 0.8 });
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
