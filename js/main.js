/* ============================================
   CNC Precision Machines International
   Main JavaScript
   ============================================ */

(function() {
  'use strict';

  // --- Mobile Navigation ---
  const toggle = document.querySelector('.header__toggle');
  const nav = document.querySelector('.header__nav');

  if (toggle && nav) {
    toggle.addEventListener('click', function() {
      toggle.classList.toggle('active');
      nav.classList.toggle('open');
      document.body.style.overflow = nav.classList.contains('open') ? 'hidden' : '';
    });

    // Close on nav link click
    nav.querySelectorAll('a').forEach(function(link) {
      link.addEventListener('click', function() {
        toggle.classList.remove('active');
        nav.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // --- Scroll-triggered Animations ---
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry, index) {
      if (entry.isIntersecting) {
        // Stagger children if parent is a grid
        var parent = entry.target.parentElement;
        if (parent) {
          var siblings = Array.from(parent.querySelectorAll('.fade-in'));
          var idx = siblings.indexOf(entry.target);
          var delay = idx >= 0 ? idx * 100 : 0;
          entry.target.style.transitionDelay = delay + 'ms';
        }
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });

  document.querySelectorAll('.fade-in').forEach(function(el) {
    observer.observe(el);
  });

  // --- Header scroll effect ---
  var header = document.querySelector('.header');
  if (header) {
    window.addEventListener('scroll', function() {
      if (window.scrollY > 50) {
        header.style.background = 'rgba(10, 22, 40, 0.98)';
      } else {
        header.style.background = 'rgba(10, 22, 40, 0.92)';
      }
    }, { passive: true });
  }

})();
