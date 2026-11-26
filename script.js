/* METIS · script.js
   1) 滚动进度 / 页首状态   2) 入场 reveal + stagger
   3) SVG 描边绘制          4) 数字计数
   5) 导航滚动高亮          6) 插页视差
   7) 记忆单页切换          8) 博客筛选 / 弹窗 / 深链
*/

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------------
   1) 页首：滚动状态 + 阅读进度条
------------------------------------------------------------ */
const header = document.querySelector('.site-header');
const progressFill = document.querySelector('.scroll-progress i');

const updateChrome = () => {
  const y = window.scrollY || 0;
  if (header) header.classList.toggle('is-scrolled', y > 40);
  if (progressFill) {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, y / max) : 0;
    progressFill.style.setProperty('--sp', p.toFixed(4));
  }
};
updateChrome();
window.addEventListener('scroll', updateChrome, { passive: true });
window.addEventListener('resize', updateChrome);

/* ------------------------------------------------------------
   2) 入场：reveal + 交错 stagger
------------------------------------------------------------ */
const revealNodes = document.querySelectorAll('.reveal, [data-stagger]');

if ('IntersectionObserver' in window && !reduceMotion) {
  // 首屏内的元素先标记，避免加入隐藏类与观察器回调之间闪一下
  revealNodes.forEach((node) => {
    const rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) node.classList.add('is-visible');
  });

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });

  document.documentElement.classList.add('has-reveal-observer');
  revealNodes.forEach((node) => {
    if (!node.classList.contains('is-visible')) observer.observe(node);
  });
} else {
  revealNodes.forEach((node) => node.classList.add('is-visible'));
}

/* ------------------------------------------------------------
   3) SVG 描边绘制（轨道椭圆等 [data-draw] 元素）
   观察所在 SVG 容器（部分浏览器对 SVG 子元素的交叉观察不可靠），
   不支持 IntersectionObserver 时直接绘制。
------------------------------------------------------------ */
const drawNodes = document.querySelectorAll('[data-draw]');

if (drawNodes.length && !reduceMotion) {
  drawNodes.forEach((node, i) => {
    let len = 2000;
    try {
      if (typeof node.getTotalLength === 'function') len = node.getTotalLength() || 2000;
    } catch (_) { /* 保持兜底长度 */ }
    node.style.strokeDasharray = String(len);
    node.style.strokeDashoffset = String(len);
    node.style.transition = `stroke-dashoffset 2.2s cubic-bezier(0.16,1,0.3,1) ${0.15 * i}s`;
  });

  const drawAll = () => drawNodes.forEach((node) => { node.style.strokeDashoffset = '0'; });

  if ('IntersectionObserver' in window) {
    const groups = new Map();
    drawNodes.forEach((node) => {
      const target = node.ownerSVGElement || node.parentElement || node;
      if (!groups.has(target)) groups.set(target, []);
      groups.get(target).push(node);
    });

    const drawObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        (groups.get(entry.target) || []).forEach((node) => { node.style.strokeDashoffset = '0'; });
        drawObserver.unobserve(entry.target);
      }
    }, { threshold: 0.15 });

    groups.forEach((_, target) => drawObserver.observe(target));
  } else {
    drawAll();
  }
}

/* ------------------------------------------------------------
   4) 数字计数（[data-count]）
------------------------------------------------------------ */
const countNodes = document.querySelectorAll('[data-count]');

const runCount = (node) => {
  const target = Number(node.dataset.count);
  if (!Number.isFinite(target)) return;
  if (reduceMotion || target === 0) { node.textContent = String(target); return; }

  const duration = 1400;
  const start = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    node.textContent = String(Math.round(target * eased));
    if (t < 1) requestAnimationFrame(step);
  };
  node.textContent = '0';
  requestAnimationFrame(step);
};

if (countNodes.length && 'IntersectionObserver' in window && !reduceMotion) {
  const countObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      runCount(entry.target);
      countObserver.unobserve(entry.target);
    }
  }, { threshold: 0.5 });
  countNodes.forEach((node) => countObserver.observe(node));
}

/* ------------------------------------------------------------
   5) 导航滚动高亮（data-spy）
------------------------------------------------------------ */
const spyLinks = document.querySelectorAll('.site-nav a[data-spy]');
if (spyLinks.length && 'IntersectionObserver' in window) {
  const sections = [...spyLinks]
    .map((link) => document.getElementById(link.dataset.spy))
    .filter(Boolean);

  const setActive = (id) => {
    spyLinks.forEach((link) => link.classList.toggle('is-active', link.dataset.spy === id));
  };

  const spyObserver = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((e) => e.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible) setActive(visible.target.id);
  }, { rootMargin: '-30% 0px -55% 0px', threshold: [0, 0.25, 0.5] });

  sections.forEach((section) => spyObserver.observe(section));
}

/* ------------------------------------------------------------
   6) 插页图视差
------------------------------------------------------------ */
const interludeImage = document.querySelector('.interlude-image');
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
  updateParallax();
}

/* ------------------------------------------------------------
   7) 记忆单页切换
------------------------------------------------------------ */
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
const readingCard = document.querySelector('.reading-card');
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
    memoryNodes.forEach((node) =>
      node.classList.toggle('is-current', node.classList.contains(`node-${control.dataset.memory}`))
    );
    if (readingCard && !reduceMotion) {
      readingCard.classList.remove('swap');
      void readingCard.offsetWidth; // 重启动画
      readingCard.classList.add('swap');
    }
  });
});

/* ------------------------------------------------------------
   8) 博客：筛选 / 弹窗 / 深链（仅 blog.html 存在这些元素）
------------------------------------------------------------ */
const journalFilters = document.querySelectorAll('.journal-filter');
const journalCards = document.querySelectorAll('.journal-card');
const articleTriggers = document.querySelectorAll('[data-article-open]');

const openArticle = (id) => {
  const article = document.getElementById(id);
  if (!article) return false;
  if (typeof article.showModal === 'function') article.showModal();
  else article.setAttribute('open', '');
  return true;
};

articleTriggers.forEach((trigger) => {
  trigger.addEventListener('click', () => openArticle(trigger.dataset.articleOpen));
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

// 关闭弹窗时移除地址栏深链，避免刷新后重复打开
document.querySelectorAll('.article-dialog').forEach((dialog) => {
  dialog.addEventListener('close', () => {
    if (location.hash === `#${dialog.id}`) {
      try { history.replaceState(null, '', location.pathname + location.search); }
      catch (_) { /* file:// 等场景忽略 */ }
    }
  });
  // 点击背景（dialog 元素本身而非内部 sheet）关闭
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog && typeof dialog.close === 'function') dialog.close();
  });
});

// 深链：blog.html#article-relay 直接打开对应长文
const hashTarget = location.hash.replace('#', '');
if (hashTarget.startsWith('article-')) {
  requestAnimationFrame(() => openArticle(hashTarget));
}
