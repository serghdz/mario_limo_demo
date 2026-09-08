'use client';
import { useEffect, useRef, useState } from 'react';
import { assetUrl } from '@/lib/assets';

export default function CruiseVideo() {
  const video = useRef<HTMLVideoElement>(null);
  const playerRegion = useRef<HTMLDivElement>(null);
  const userPaused = useRef(false);
  const [playing, setPlaying] = useState(false);

  const keepSilent = () => {
    const player = video.current;
    if (!player) return;
    if (!player.muted) player.muted = true;
    if (player.volume !== 0) player.volume = 0;
  };
  const playSilent = async () => {
    const player = video.current;
    if (!player) return;
    keepSilent();
    if (!player.getAttribute('src')) player.src = assetUrl('videos/limo_cruise.mp4');
    try { await player.play(); } catch { /* Browser policy may require a tap. */ }
  };
  const toggle = () => {
    const player = video.current;
    if (!player) return;
    if (player.paused) { userPaused.current = false; void playSilent(); }
    else { userPaused.current = true; player.pause(); }
  };

  useEffect(() => {
    const player = video.current;
    const region = playerRegion.current;
    if (!player || !region) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    let visible = false;
    const sync = () => {
      if (!visible || document.hidden || reduce.matches || connection?.saveData || userPaused.current) {
        player.pause();
      } else void playSilent();
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && entry.intersectionRatio >= 0.25;
      sync();
    }, { threshold: [0, 0.25] });
    observer.observe(region);
    reduce.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      observer.disconnect();
      reduce.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', sync);
      player.pause();
    };
  }, []);

  return (
    <section className="cruise-section content-pad" aria-labelledby="cruise-title">
      <div className="cruise-heading">
        <div>
          <p className="eyebrow">ON THE ROAD</p>
          <h2 id="cruise-title">The limousine <em>in motion.</em></h2>
        </div>
      </div>
      <div ref={playerRegion} className="cruise-player" role="button" tabIndex={0}
        aria-label={playing ? 'Pause silent cruising video' : 'Play silent cruising video'}
        aria-pressed={playing}
        onClick={toggle}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggle(); }
        }}>
        <video
          ref={video}
          poster={assetUrl('photos/limousine-side.jpeg')}
          preload="none"
          muted
          loop
          playsInline
          disablePictureInPicture
          aria-hidden="true"
          onVolumeChange={keepSilent}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onError={() => setPlaying(false)}
        />
      </div>
    </section>
  );
}
