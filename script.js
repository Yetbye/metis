const revealNodes = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.16, rootMargin: '0px 0px -6% 0px' });

  revealNodes.forEach((node) => observer.observe(node));
} else {
  revealNodes.forEach((node) => node.classList.add('is-visible'));
}

const interludeImage = document.querySelector('.interlude-image');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (interludeImage && !reduceMotion) {
  let ticking = false;

  const updateParallax = () => {
    const rect = interludeImage.parentElement.getBoundingClientRect();
    const visible = Math.max(-1, Math.min(1, rect.top / window.innerHeight));
    interludeImage.style.transform = `translate3d(0, ${visible * -2.5}%, 0)`;
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateParallax);
  }, { passive: true });
}
