(function () {
  const links = Array.from(document.querySelectorAll('.nav__list a'));
  const sections = links
    .map((a) => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);

  const setActive = () => {
    const y = window.scrollY + 120;
    let current = sections[0];
    for (const sec of sections) {
      if (sec.offsetTop <= y) current = sec;
    }
    links.forEach((a) => {
      a.style.color = a.getAttribute('href') === `#${current.id}` ? 'var(--ink)' : 'var(--muted)';
    });
  };

  window.addEventListener('scroll', setActive, { passive: true });
  setActive();

  const form = document.getElementById('reservation-form');
  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const valid = form.checkValidity();
      if (!valid) {
        form.reportValidity();
        return;
      }
      const button = form.querySelector('button[type="submit"]');
      if (button) {
        button.textContent = 'Request Sent';
        button.disabled = true;
      }
    });
  }
})();
