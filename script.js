document.getElementById('year').textContent = new Date().getFullYear();

// Header goes from transparent (over the hero photo) to solid pine once scrolled
const siteHeader = document.getElementById('siteHeader');
const toggleHeader = () => {
  siteHeader.classList.toggle('is-scrolled', window.scrollY > 40);
};
toggleHeader();
window.addEventListener('scroll', toggleHeader, { passive: true });

// Mobile nav — hamburger toggle, shared across every page
(function () {
  const navToggle = document.getElementById('navToggle');
  const siteNav = document.getElementById('siteNav');
  if (!navToggle || !siteNav) return;

  function closeNav() {
    navToggle.classList.remove('is-active');
    siteNav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  }

  function toggleNav() {
    const isOpen = siteNav.classList.toggle('is-open');
    navToggle.classList.toggle('is-active', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
  }

  navToggle.addEventListener('click', toggleNav);

  siteNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeNav);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeNav();
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 960) closeNav();
  });
})();

// Motion-safe scroll reveal for the service cards and step list
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReduced && 'IntersectionObserver' in window) {
  const targets = document.querySelectorAll('.service-card, .team-card, .process-card, .process-steps li');
  targets.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(14px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  targets.forEach(el => observer.observe(el));
}
// ============================================
// Free Consultation modal — shared across every page
// Opens on any .js-open-consult button, submits to FormSubmit.co
// ============================================
(function () {
  const modal = document.getElementById('consultModal');
  if (!modal) return;

  const closeBtn = modal.querySelector('.modal-close');
  const form = modal.querySelector('.modal-form');
  const successEl = modal.querySelector('.modal-success');
  const errorEl = modal.querySelector('.modal-error');
  const openers = document.querySelectorAll('.js-open-consult');

  function openModal() {
    modal.classList.add('is-open');
    document.body.classList.add('modal-open');
    // reset to a fresh form each time it's opened
    if (form) {
      form.classList.remove('is-hidden');
      form.reset();
    }
    if (successEl) successEl.classList.remove('is-visible');
    if (errorEl) errorEl.classList.remove('is-visible');
    const firstField = modal.querySelector('input, textarea');
    if (firstField) setTimeout(() => firstField.focus(), 50);
  }

  function closeModal() {
    modal.classList.remove('is-open');
    document.body.classList.remove('modal-open');
  }

  openers.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal();
    });
  });

  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (errorEl) errorEl.classList.remove('is-visible');

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalLabel = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending…';
      }

      const formData = new FormData(form);

      fetch(form.getAttribute('action'), {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: formData,
      })
        .then((res) => {
          if (!res.ok) throw new Error('Request failed');
          return res.json();
        })
        .then(() => {
          form.classList.add('is-hidden');
          if (successEl) successEl.classList.add('is-visible');
        })
        .catch(() => {
          if (errorEl) errorEl.classList.add('is-visible');
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalLabel;
          }
        });
    });
  }
})();