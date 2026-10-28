// Testimonials page behaviour: filter chips, "Read more" toggles, video pop-up.
// The cards themselves are plain static HTML generated at build time, so with
// JavaScript off the page still shows every review in full.
(function () {
  // ---------- Filter chips ----------
  const chips = document.querySelectorAll('.t-chip');
  const cards = document.querySelectorAll('.t-grid .t-card');
  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const filter = chip.dataset.filter;
      chips.forEach((c) => {
        const on = c === chip;
        c.classList.toggle('is-active', on);
        c.setAttribute('aria-pressed', String(on));
      });
      cards.forEach((card) => {
        card.hidden = filter !== 'all' && card.dataset.type !== filter;
      });
    });
  });

  // ---------- Read more (long written reviews are clamped only when JS runs) ----------
  document.querySelectorAll('.t-quote[data-long]').forEach((quote) => {
    const btn = document.querySelector(`.t-more[aria-controls="${quote.id}"]`);
    if (!btn) return;
    quote.classList.add('is-clamped');
    btn.hidden = false;
    btn.addEventListener('click', () => {
      const open = quote.classList.toggle('is-clamped') === false;
      btn.textContent = open ? 'Show less' : 'Read more';
      btn.setAttribute('aria-expanded', String(open));
    });
  });

  // ---------- Video pop-up ----------
  const modal = document.getElementById('videoModal');
  const frame = document.getElementById('videoFrame');
  if (!modal || !frame) return;
  const closeBtn = modal.querySelector('.vm-close');
  let lastTrigger = null;

  // Only ever embed from these hosts, whatever ends up in the HTML.
  const ALLOWED = /^https:\/\/(www\.youtube-nocookie\.com\/embed\/|player\.vimeo\.com\/video\/)/;

  function openVideo(trigger) {
    const src = trigger.dataset.embed || '';
    if (!ALLOWED.test(src)) return;
    lastTrigger = trigger;

    frame.className = 'vm-frame' + (trigger.dataset.vertical === '1' ? ' is-vertical' : '');
    frame.innerHTML = '';
    const iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.title = trigger.dataset.title || 'Video testimonial';
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    iframe.setAttribute('allowfullscreen', '');
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.appendChild(iframe);

    modal.hidden = false;
    document.body.classList.add('modal-open');
    closeBtn.focus();
  }

  function closeVideo() {
    if (modal.hidden) return;
    modal.hidden = true;
    frame.innerHTML = ''; // removing the iframe stops playback
    document.body.classList.remove('modal-open');
    if (lastTrigger) lastTrigger.focus();
  }

  document.querySelectorAll('.js-play-video').forEach((btn) => {
    btn.addEventListener('click', () => openVideo(btn));
  });
  closeBtn.addEventListener('click', closeVideo);
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.classList.contains('vm-inner')) closeVideo();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeVideo();
  });
})();
