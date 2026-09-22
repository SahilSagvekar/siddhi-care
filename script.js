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

// Motion-safe scroll reveal with natural staggered wave entrance
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReduced && 'IntersectionObserver' in window) {
  const targetSelector = [
    '.service-card',
    '.team-card',
    '.process-card',
    '.process-steps li',
    '.resource-card',
    '.testimonial-card',
    '.addon-card',
    '.price-card',
    '.pricing-info-card',
    '.team-photo-card',
    '.gallery-item',
    '.info-card'
  ].join(', ');

  const targets = document.querySelectorAll(targetSelector);
  
  targets.forEach(el => {
    el.classList.add('reveal-on-scroll');
    
    // Calculate index within direct parent or closest grid to create a staggered wave
    const parent = el.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(child => child.matches(targetSelector));
      const idx = siblings.indexOf(el);
      if (idx > -1) {
        // Wave stagger up to 4 items in a row (0ms, 90ms, 180ms, 270ms)
        const stagger = (idx % 4) * 90;
        el.style.transitionDelay = `${stagger}ms`;
      }
    }
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  targets.forEach(el => observer.observe(el));

  // Observe .process-steps to trigger progressive sequential line connection
  const processStepsContainers = document.querySelectorAll('.process-steps');
  processStepsContainers.forEach(steps => {
    const stepsObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          stepsObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    stepsObserver.observe(steps);
  });
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

// ============================================
// Floating WhatsApp chat button — shared across every page
// Injects its own markup so no HTML changes are needed per page.
// ============================================
(function () {
  const CONTACTS = [
    { name: 'Diksha', role: 'Care Coordinator', phone: '918369180832' },
    { name: 'Suraj', role: 'Care Coordinator', phone: '918976100341' },
  ];
  const MESSAGE = "Hi! I'd like to know more about SIDDHI ElderCare Services.";

  const wrap = document.createElement('div');
  wrap.className = 'whatsapp-fab';
  wrap.innerHTML = `
    <div class="whatsapp-fab-panel" role="menu" aria-label="Chat with a care coordinator on WhatsApp">
      <p class="whatsapp-fab-title">Chat with a care coordinator</p>
      ${CONTACTS.map((c) => `
        <a class="whatsapp-fab-contact" role="menuitem"
           href="https://wa.me/${c.phone}?text=${encodeURIComponent(MESSAGE)}"
           target="_blank" rel="noopener">
          <span class="whatsapp-fab-avatar">${c.name.charAt(0)}</span>
          <span>
            <p class="whatsapp-fab-name">${c.name}</p>
            <p class="whatsapp-fab-role">${c.role}</p>
          </span>
        </a>
      `).join('')}
    </div>
    <button type="button" class="whatsapp-fab-btn" id="whatsappFabBtn" aria-haspopup="true" aria-expanded="false" aria-label="Chat with us on WhatsApp">
      <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="M16.02 3C9.4 3 4 8.38 4 15c0 2.32.66 4.49 1.8 6.33L4 29l7.86-1.75A11.9 11.9 0 0 0 16.02 27C22.64 27 28 21.62 28 15S22.64 3 16.02 3Zm0 21.6c-1.98 0-3.83-.55-5.42-1.5l-.39-.23-4.66 1.04 1.02-4.55-.25-.4A9.52 9.52 0 0 1 6.4 15c0-5.3 4.32-9.6 9.62-9.6 5.3 0 9.6 4.3 9.6 9.6 0 5.3-4.3 9.6-9.6 9.6Zm5.29-7.19c-.29-.14-1.71-.84-1.98-.94-.27-.1-.46-.14-.66.14-.2.29-.76.94-.93 1.13-.17.2-.34.22-.63.07-.29-.14-1.22-.45-2.33-1.44-.86-.77-1.44-1.71-1.61-2-.17-.29-.02-.44.13-.58.13-.13.29-.34.43-.51.14-.17.19-.29.29-.48.1-.2.05-.36-.02-.5-.07-.14-.66-1.6-.91-2.19-.24-.58-.48-.5-.66-.5-.17-.01-.36-.01-.56-.01-.2 0-.51.07-.78.36-.27.29-1.02 1-1.02 2.44 0 1.44 1.05 2.83 1.19 3.03.14.2 2.06 3.15 5 4.42.7.3 1.24.48 1.67.61.7.22 1.34.19 1.84.12.56-.08 1.71-.7 1.96-1.38.24-.67.24-1.25.17-1.38-.07-.13-.26-.2-.55-.34Z"/></svg>
    </button>
  `;
  document.body.appendChild(wrap);

  const btn = document.getElementById('whatsappFabBtn');

  function closeFab() {
    wrap.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
  }
  function toggleFab() {
    const isOpen = wrap.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', String(isOpen));
  }

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleFab();
  });

  document.addEventListener('click', (e) => {
    if (!wrap.contains(e.target)) closeFab();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeFab();
  });
})();