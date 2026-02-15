const cards = document.querySelectorAll('#carousel .card');
let current = 0;

function cycleHighlight() {
  if (!cards.length) return;
  cards.forEach((card, idx) => {
    card.style.transform = idx === current ? 'translateY(-4px)' : 'translateY(0)';
    card.style.boxShadow = idx === current
      ? '0 18px 40px rgba(33, 24, 17, 0.18)'
      : '0 8px 18px rgba(33, 24, 17, 0.10)';
    card.style.transition = 'transform 450ms ease, box-shadow 450ms ease';
  });
  current = (current + 1) % cards.length;
}

cycleHighlight();
setInterval(cycleHighlight, 2800);
