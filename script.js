document.getElementById('year').textContent = new Date().getFullYear();

// Header goes from transparent (over the hero photo) to solid pine once scrolled
const siteHeader = document.getElementById('siteHeader');
const toggleHeader = () => {
  siteHeader.classList.toggle('is-scrolled', window.scrollY > 40);
};
toggleHeader();
window.addEventListener('scroll', toggleHeader, { passive: true });

// Motion-safe scroll reveal for the service cards and step list
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReduced && 'IntersectionObserver' in window) {
  const targets = document.querySelectorAll('.service-card, .team-card, .process-steps li');
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