const videos = document.querySelectorAll("video");

// Keep every video permanently silent.
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
