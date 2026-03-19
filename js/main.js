/* ============================================
   CNC Precision Machines International, LLC
   Main JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // --- Mobile menu toggle ---
  const toggle = document.querySelector('.header__toggle');
  const nav = document.querySelector('.header__nav');

  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('active');
      nav.classList.toggle('open');
    });

    // Close menu when clicking a nav link
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        toggle.classList.remove('active');
        nav.classList.remove('open');
      });
    });
  }

  // --- Sticky header shadow on scroll ---
  const header = document.querySelector('.header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.scrollY > 10);
    }, { passive: true });
  }

  // --- Scroll-in animations with stagger ---
  const fadeEls = document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right');
  if (fadeEls.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Stagger siblings: machine cards, industry cards, etc.
          const parent = entry.target.parentElement;
          const siblings = parent ? parent.querySelectorAll(':scope > .fade-in, :scope > .fade-in-left, :scope > .fade-in-right') : [];

          if (siblings.length > 1) {
            const index = Array.from(siblings).indexOf(entry.target);
            entry.target.style.transitionDelay = (index * 0.1) + 's';
          }

          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -40px 0px' });

    fadeEls.forEach(el => observer.observe(el));
  }

  // --- Active nav link ---
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.header__nav a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

});
