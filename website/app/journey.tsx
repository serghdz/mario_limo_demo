'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowDown, Pause, Play, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { assetUrl } from '@/lib/assets';

const chapters = [
  {
    label: 'The city',
    at: 0,
    title: 'Make the journey',
    italic: 'part of the evening.',
    copy: 'A distinctive white limousine. A little more room for the moment.',
  },
  {
    label: 'The arrival',
    at: 0.44,
    title: 'An entrance',
    italic: 'all your own.',
    copy: 'A signature silhouette. A moment to slow down.',
  },
  {
    label: 'The door',
    at: 0.75,
    title: 'Your evening',
    italic: 'begins here.',
    copy: 'Step through the passenger door and leave the city outside.',
  },
  {
    label: 'The cabin',
    at: 0.98,
    title: 'Settle into',
    italic: 'the atmosphere.',
    copy: 'Two-tone seating, a star-lit ceiling, and room for the occasion.',
  },
];
export default function Journey() {
  const section = useRef<HTMLElement>(null),
    host = useRef<HTMLDivElement>(null);
  const progress = useRef(0),
    pausedRef = useRef(false);
  const [ready, setReady] = useState(false),
    [failed, setFailed] = useState(false),
    [simple, setSimple] = useState(false),
    [optedIn, setOptedIn] = useState(false),
    [loadPercent, setLoadPercent] = useState(0),
    [chapter, setChapter] = useState(0),
    [paused, setPaused] = useState(false);
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      const limited =
        reduce.matches ||
        (navigator as Navigator & { connection?: { saveData: boolean } })
          .connection?.saveData;
      setSimple(!!limited && !optedIn);
      if (limited && !optedIn) setChapter(0);
    };
    update();
    reduce.addEventListener('change', update);
    return () => {
      reduce.removeEventListener('change', update);
    };
  }, [optedIn]);
  useEffect(() => {
    if (simple) return;
    setReady(false);
    setFailed(false);
    setLoadPercent(0);
    let cancelled = false;
    let api:
      | Awaited<ReturnType<(typeof import('./journey-scene'))['createJourney']>>
      | undefined;
    const update = () => {
      if (!section.current || pausedRef.current) return;
      const r = section.current.getBoundingClientRect();
      const p = Math.max(
        0,
        Math.min(
          1,
          -r.top / (section.current.offsetHeight - window.innerHeight),
        ),
      );
      progress.current = p;
      api?.setProgress(p);
      setChapter(p < 0.33 ? 0 : p < 0.57 ? 1 : p < 0.85 ? 2 : 3);
    };
    import('./journey-scene')
      .then((m) =>
        m.createJourney(
          host.current!,
          () => { if (!cancelled) setReady(true); },
          () => { if (!cancelled) setFailed(true); },
          (percent) => { if (!cancelled) setLoadPercent(percent); },
        ),
      )
      .then((instance) => {
        if (cancelled) instance.dispose();
        else {
          api = instance;
          update();
        }
      })
      .catch(() => setFailed(true));
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    const visibility = new IntersectionObserver(([entry]) =>
      api?.setActive(entry.isIntersecting),
    );
    if (section.current) visibility.observe(section.current);
    return () => {
      cancelled = true;
      api?.dispose();
      visibility.disconnect();
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [simple]);
  const go = (at: number) => {
    if (!section.current) return;
    pausedRef.current = false;
    setPaused(false);
    window.scrollTo({
      top:
        section.current.offsetTop +
        at * (section.current.offsetHeight - window.innerHeight),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
  };
  const fallback = simple || failed;
  return (
    <section
      ref={section}
      className={'journey ' + (fallback ? 'journey-simple' : '')}
      id="experience"
      aria-label="Limousine journey"
    >
      <div className="journey-stage">
        <div
          ref={host}
          className={'scene-host ' + (ready && !fallback ? 'is-ready' : '')}
          aria-hidden={fallback}
        />
        {fallback && (
          <div className="journey-fallback">
            <img
              src={assetUrl('photos/limousine-side.jpeg')}
              alt="Mario’s custom white SUV limousine"
            />
          </div>
        )}
        {!ready && !fallback && (
          <div className="tour-loading" role="status" aria-live="polite">
            <span className="loading-mark" aria-hidden="true">M</span>
            <p>Loading your 3D tour{loadPercent > 0 ? ` · ${loadPercent}%` : ''}</p>
            <div className="loading-track" aria-hidden="true"><span style={{ width: `${Math.max(5, loadPercent)}%` }} /></div>
          </div>
        )}
        <div
          className={'journey-copy ' + (chapter === 0 ? 'first-chapter' : '')}
        >
          <p className="eyebrow">
            {chapter === 0
              ? 'HOUSTON, TEXAS · A SIGNATURE ARRIVAL'
              : `0${chapter + 1} / ${chapters[chapter].label.toUpperCase()}`}
          </p>
          <h1>
            {chapters[chapter].title}
            <br />
            <em>{chapters[chapter].italic}</em>
          </h1>
          <p>{chapters[chapter].copy}</p>
          {chapter === 0 && (
            <a href="#details" className="text-link">
              Meet your limousine <ArrowDown size={17} />
            </a>
          )}
          {fallback && !failed && (
            <div className="tour-opt-in">
              <Button className="prepare-button" onClick={() => setOptedIn(true)}>
                <Play size={16} /> Explore in 3D
              </Button>
              <p>Drive in, open the passenger door, and step inside.</p>
            </div>
          )}
          {chapter === 3 && (
            <a className="text-link" href="#details">
              See the real details <ArrowUpRight size={17} />
            </a>
          )}
        </div>
        <div className="journey-bottom">
          {!fallback ? (
            <>
              <div className="chapter-nav" aria-label="Tour chapters">
                {chapters.map((c, i) => (
                  <Button
                    variant="ghost"
                    key={c.label}
                    aria-pressed={chapter === i}
                    onClick={() => go(c.at)}
                  >
                    <span>0{i + 1}</span>
                    {c.label}
                  </Button>
                ))}
              </div>
              <div className="tour-actions">
                <span>
                  {ready ? 'SCROLL TO EXPLORE' : 'PREPARING THE TOUR'}
                </span>
                <Button
                  variant="ghost"
                  aria-label={
                    paused ? 'Resume scroll motion' : 'Pause scroll motion'
                  }
                  onClick={() => {
                    pausedRef.current = !paused;
                    setPaused(!paused);
                    if (paused) window.dispatchEvent(new Event('scroll'));
                  }}
                >
                  {paused ? <Play size={16} /> : <Pause size={16} />}
                </Button>
                <a href="#details">
                  Skip tour <ArrowDown size={14} />
                </a>
              </div>
            </>
          ) : (
            <a href="#details" className="text-link">
              Explore the details <ArrowDown size={16} />
            </a>
          )}
        </div>
        {failed && (
          <p className="tour-unavailable" role="status">
            The 3D tour is unavailable on this device. Explore the actual
            limousine below.
          </p>
        )}
      </div>
    </section>
  );
}
