document.addEventListener('DOMContentLoaded', function() {
const track = document.querySelector('.carousel-track');
if (!track) return;
const items = document.querySelectorAll('.carousel-item');
let currentIndex = 0;
const itemWidth = items[0].offsetWidth;
track.style.width = items.length * itemWidth + 'px';
function moveTo(index) {
track.style.transform = 'translateX(' + (-index * itemWidth) + 'px)';
}
setInterval(function() {
currentIndex = (currentIndex + 1) % items.length;
moveTo(currentIndex);
}, 3000);
});