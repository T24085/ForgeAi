const carouselWrapper = document.getElementById('featured-carousel');
const carouselItems = carouselWrapper ? Array.from(carouselWrapper.querySelectorAll('.carousel-item')) : [];
const nextButton = document.querySelector('.carousel-control.next');
const prevButton = document.querySelector('.carousel-control.prev');
let carouselIndex = 0;
let autoAdvanceId = null;

const getSlideWidth = () => {
  if (!carouselItems.length) return 0;
  const firstItem = carouselItems[0];
  const wrapperStyles = window.getComputedStyle(carouselWrapper);
  const gap = parseFloat(wrapperStyles.columnGap || wrapperStyles.gap || '0');
  return firstItem.getBoundingClientRect().width + gap;
};

const goToSlide = (nextIndex) => {
  if (!carouselItems.length) return;
  carouselIndex = (nextIndex + carouselItems.length) % carouselItems.length;
  carouselWrapper.scrollTo({
    left: getSlideWidth() * carouselIndex,
    behavior: 'smooth'
  });
};

const stopAutoAdvance = () => {
  if (autoAdvanceId) {
    window.clearInterval(autoAdvanceId);
    autoAdvanceId = null;
  }
};

const startAutoAdvance = () => {
  stopAutoAdvance();
  if (!carouselItems.length) return;
  autoAdvanceId = window.setInterval(() => goToSlide(carouselIndex + 1), 5500);
};

if (carouselItems.length) {
  nextButton?.addEventListener('click', () => goToSlide(carouselIndex + 1));
  prevButton?.addEventListener('click', () => goToSlide(carouselIndex - 1));
  carouselWrapper.addEventListener('mouseenter', stopAutoAdvance);
  carouselWrapper.addEventListener('mouseleave', startAutoAdvance);
  window.addEventListener('resize', () => goToSlide(carouselIndex));
  startAutoAdvance();
}

const heroVideo = document.querySelector('.hero-video');
if (heroVideo) {
  const attemptPlay = () => heroVideo.play().catch(() => {});
  attemptPlay();
  window.addEventListener('load', attemptPlay);
  document.addEventListener('click', attemptPlay, { once: true });
}
