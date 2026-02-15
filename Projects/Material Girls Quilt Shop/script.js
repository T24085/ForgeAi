const header = document.querySelector(".site-header");
const reveals = document.querySelectorAll(".reveal");
const videos = document.querySelectorAll("video");

const onScroll = () => {
    if (window.scrollY > 24) {
        header.classList.add("scrolled");
    } else {
        header.classList.remove("scrolled");
    }
};

const observer = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("show");
                observer.unobserve(entry.target);
            }
        });
    },
    {
        threshold: 0.2,
    }
);

reveals.forEach((item) => observer.observe(item));
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// Force all videos to stay silent even if users try to unmute.
videos.forEach((video) => {
    const lockMute = () => {
        video.muted = true;
        video.defaultMuted = true;
        video.volume = 0;
    };

    lockMute();
    video.addEventListener("volumechange", lockMute);
    video.addEventListener("play", lockMute);
});
