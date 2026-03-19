/* ============================================
   CNC PRECISION MACHINES — MAIN JS
   GSAP + ScrollTrigger + Swiper
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // --- PRELOADER ---
  const preloader = document.querySelector('.preloader');
  if (preloader) {
    setTimeout(() => {
      preloader.classList.add('dismiss');
      setTimeout(() => {
        preloader.style.display = 'none';
      }, 1000);
    }, 2000);
  }

  // --- HEADER SCROLL ---
  const header = document.querySelector('.header');
  const onScroll = () => {
    if (window.scrollY > 80) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

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

    // Section headers
    gsap.utils.toArray('.section-header').forEach(el => {
      gsap.from(el, {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          once: true,
        },
      });
    });

    // Machine cards stagger
    const machineCards = gsap.utils.toArray('.machine-card');
    if (machineCards.length) {
      gsap.from(machineCards, {
        y: 60,
        opacity: 0,
        duration: 0.7,
        stagger: 0.12,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.machines-grid',
          start: 'top 80%',
          once: true,
        },
      });
    }

    // Industry cards stagger
    const industryCards = gsap.utils.toArray('.industry-card');
    if (industryCards.length) {
      gsap.from(industryCards, {
        y: 50,
        opacity: 0,
        duration: 0.6,
        stagger: 0.15,
        ease: 'power2.out',
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
        x: -50,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: { trigger: aboutText, start: 'top 80%', once: true },
      });
    }
    if (aboutVisual) {
      gsap.from(aboutVisual, {
        x: 50,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: { trigger: aboutVisual, start: 'top 80%', once: true },
      });
    }

    // CTA section
    const ctaSection = document.querySelector('.cta');
    if (ctaSection) {
      gsap.from(ctaSection.children, {
        y: 30,
        opacity: 0,
        duration: 0.7,
        stagger: 0.1,
        ease: 'power2.out',
        scrollTrigger: { trigger: ctaSection, start: 'top 80%', once: true },
      });
    }

    // Subpage animations
    gsap.utils.toArray('.fade-in').forEach(el => {
      gsap.from(el, {
        y: 40,
        opacity: 0,
        duration: 0.7,
        ease: 'power2.out',
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
        y: 50,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.services-grid',
          start: 'top 80%',
          once: true,
        },
      });
    }

    // Product cards
    const productCards = gsap.utils.toArray('.product-card');
    if (productCards.length) {
      gsap.from(productCards, {
        y: 50,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power2.out',
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

    // Contact cards
    const contactCards = gsap.utils.toArray('.contact-info-card');
    if (contactCards.length) {
      gsap.from(contactCards, {
        x: 30,
        opacity: 0,
        duration: 0.5,
        stagger: 0.08,
        ease: 'power2.out',
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
        duration: 0.6,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      });
    });
  }
});
