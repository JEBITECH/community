// Shared prototype interactivity — mobile nav, dropdowns, modals, tabs, wizard steps.
document.addEventListener('DOMContentLoaded', () => {

  // Generic toggle: any element with data-toggle="#id" shows/hides the target
  document.querySelectorAll('[data-toggle]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(el.getAttribute('data-toggle'));
      if (target) target.classList.toggle('hidden');
    });
  });

  // Close overlay when clicking its background
  document.querySelectorAll('.overlay').forEach(ov => {
    ov.addEventListener('click', (e) => { if (e.target === ov) ov.classList.add('hidden'); });
  });

  // Tabs: [data-tabs] wraps [data-tab-btn="key"] triggers and [data-tab-panel="key"] panels
  document.querySelectorAll('[data-tabs]').forEach(group => {
    const btns = group.querySelectorAll('[data-tab-btn]');
    const panels = group.querySelectorAll('[data-tab-panel]');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-tab-btn');
        btns.forEach(b => b.classList.toggle('active', b === btn));
        panels.forEach(p => p.classList.toggle('hidden', p.getAttribute('data-tab-panel') !== key));
      });
    });
  });

  // Option cards (single-select): [data-option-group] wraps [data-option]
  document.querySelectorAll('[data-option-group]').forEach(group => {
    group.querySelectorAll('[data-option]').forEach(opt => {
      opt.addEventListener('click', () => {
        group.querySelectorAll('[data-option]').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
      });
    });
  });

  // Toggle switches: [data-switch] flips .on class
  document.querySelectorAll('[data-switch]').forEach(sw => {
    sw.addEventListener('click', () => sw.classList.toggle('on'));
  });

  // Wizard: [data-wizard] with [data-wizard-panel="n"], next/back buttons [data-wizard-next]/[data-wizard-back]
  document.querySelectorAll('[data-wizard]').forEach(wiz => {
    let step = 1;
    const panels = wiz.querySelectorAll('[data-wizard-panel]');
    const steps = wiz.querySelectorAll('.wizard-step');
    const show = (n) => {
      panels.forEach(p => p.classList.toggle('hidden', Number(p.getAttribute('data-wizard-panel')) !== n));
      steps.forEach(s => {
        const sn = Number(s.getAttribute('data-step'));
        s.classList.toggle('active', sn === n);
        s.classList.toggle('done', sn < n);
      });
      wiz.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    wiz.querySelectorAll('[data-wizard-next]').forEach(btn => btn.addEventListener('click', () => {
      const max = panels.length;
      step = Math.min(step + 1, max);
      show(step);
    }));
    wiz.querySelectorAll('[data-wizard-back]').forEach(btn => btn.addEventListener('click', () => {
      step = Math.max(step - 1, 1);
      show(step);
    }));
    show(step);
  });

  // Mobile bottom nav active state by filename
  const file = location.pathname.split('/').pop();
  document.querySelectorAll('.bottom-nav a, .sidebar-link, .topbar nav a').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href.endsWith(file) && file) a.classList.add('active');
  });
});
