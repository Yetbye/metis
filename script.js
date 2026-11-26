const revealNodes = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.02, rootMargin: '0px 0px 12% 0px' });

  // Reveal is progressive enhancement: without this class, every section stays readable.
  document.documentElement.classList.add('has-reveal-observer');
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

const memoryEntries = {
  preference: {
    kind: '日常的偏好',
    title: '下雨时，散步会改到室内。',
    body: '它不是一条孤立的日程。一次次相似的选择，慢慢成为背景；当它不再适用，也可以被修正。',
    source: '演示数据 · 可更正'
  },
  fact: {
    kind: '一条可核对的事实',
    title: '那本书，借给了住在楼上的邻居。',
    body: '事实有具体的来处和时间。等到需要归还时，可以找到这件事，而不是重新猜测。',
    source: '演示数据 · 可核对'
  },
  scene: {
    kind: '一段视觉情节',
    title: '蓝色雨伞，连续几日都在门边。',
    body: '视觉记忆不只是一张孤立的图。它还需要时间、发生的场景，以及后来能否找到这段观察。',
    source: '演示数据 · 画面片段'
  },
  promise: {
    kind: '一次还没有完成的承诺',
    title: '周末前寄出的信，还没有回执。',
    body: '承诺不应在一句“已经安排”里消失。它会停留在未完成，直到得到明确的结果。',
    source: '演示数据 · 未完成'
  }
};

const memoryControls = document.querySelectorAll('.memory-control');
const memoryNodes = document.querySelectorAll('.memory-node');
const memoryKind = document.querySelector('#memory-kind');
const memoryTitle = document.querySelector('#memory-entry-title');
const memoryBody = document.querySelector('#memory-entry-body');
const memorySource = document.querySelector('#memory-entry-source');

memoryControls.forEach((control) => {
  control.addEventListener('click', () => {
    const entry = memoryEntries[control.dataset.memory];
    if (!entry) return;
    memoryControls.forEach((button) => {
      const active = button === control;
      button.classList.toggle('is-current', active);
      button.setAttribute('aria-pressed', String(active));
    });
    memoryKind.textContent = entry.kind;
    memoryTitle.textContent = entry.title;
    memoryBody.textContent = entry.body;
    memorySource.textContent = entry.source;
    memoryNodes.forEach((node) => node.classList.toggle('is-current', node.classList.contains(`node-${control.dataset.memory}`)));
  });
});

const journalFilters = document.querySelectorAll('.journal-filter');
const journalCards = document.querySelectorAll('.journal-card');
const articleTriggers = document.querySelectorAll('[data-article-open]');

articleTriggers.forEach((trigger) => {
  trigger.addEventListener('click', () => {
    const article = document.getElementById(trigger.dataset.articleOpen);
    if (!article) return;
    if (typeof article.showModal === 'function') article.showModal();
    else article.setAttribute('open', '');
  });
});

journalFilters.forEach((filter) => {
  filter.addEventListener('click', () => {
    journalFilters.forEach((button) => {
      const active = button === filter;
      button.classList.toggle('is-current', active);
      button.setAttribute('aria-pressed', String(active));
    });
    const category = filter.dataset.filter;
    journalCards.forEach((card) => {
      card.hidden = category !== 'all' && card.dataset.category !== category;
    });
  });
});
