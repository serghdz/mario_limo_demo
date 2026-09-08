'use client';
import { useEffect, useRef, useState } from 'react';
import { assetUrl } from '@/lib/assets';

const FRAME_COUNT = 81;
const frameUrl = (index: number) => assetUrl(`rotation/frame-${String(index).padStart(3, '0')}.jpg`);
const clamp = (value: number) => Math.min(1, Math.max(0, value));

export default function RotationViewer() {
  const host = useRef<HTMLDivElement>(null);
  const desired = useRef(0);
  const displayed = useRef(0);
  const loaded = useRef(new Set<number>());
  const pending = useRef(new Map<number, Promise<void>>());
  const active = useRef(false);
  const cancelled = useRef(false);
  const changeStart = useRef(0);
  const [frame, setFrame] = useState(0);
  const [angle, setAngle] = useState(0);

  const drag = useRef<{ id: number; x: number; y: number; start: number; horizontal: boolean } | null>(null);

  const showNearest = () => {
    if (cancelled.current || !loaded.current.size) return;
    const wanted = Math.round(desired.current * (FRAME_COUNT - 1));
    const nearest = [...loaded.current].reduce((a, b) => Math.abs(b - wanted) < Math.abs(a - wanted) ? b : a);
    if (nearest !== displayed.current) { displayed.current = nearest; setFrame(nearest); }

  };
  const loadFrame = (index: number): Promise<void> => {
    if (loaded.current.has(index)) return Promise.resolve();
    const existing = pending.current.get(index);
    if (existing) return existing;
    const request = new Promise<void>(resolve => {
      const image = new Image();
      image.onload = () => {
        loaded.current.add(index);
        pending.current.delete(index);
        showNearest();
        resolve();
      };
      image.onerror = () => { pending.current.delete(index); resolve(); };
      image.src = frameUrl(index);
    });
    pending.current.set(index, request);
    return request;
  };
  const rotate = (value: number) => {
    desired.current = clamp(value);
    changeStart.current = performance.now();
    setAngle(Math.round(desired.current * 100));
    showNearest();
    if (active.current) void loadFrame(Math.round(desired.current * (FRAME_COUNT - 1)));
  };
  useEffect(() => {
    cancelled.current = false;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      active.current = true;
      observer.disconnect();
      const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
      if (saveData) { void loadFrame(0); return; }
      // Load useful angles first, then warm the browser cache with three requests
      // at a time. Image objects are not retained as an 81-frame decoded buffer.
      const priority = [0, 80, 40, 20, 60, 10, 30, 50, 70];
      const queue = [...priority, ...Array.from({ length: FRAME_COUNT }, (_, i) => i).filter(i => !priority.includes(i))];
      const worker = async () => {
        while (queue.length && !cancelled.current) await loadFrame(queue.shift()!);
      };
      void Promise.all([worker(), worker(), worker()]);
    }, { rootMargin: '200px' });
    if (host.current) observer.observe(host.current);
    return () => { cancelled.current = true; observer.disconnect(); };
  }, []);

  return <div ref={host} className="rotation-viewer" role="slider" tabIndex={0}
    data-frame={frame}
    aria-label="Recorded limousine rotation" aria-valuemin={0} aria-valuemax={100} aria-valuenow={angle}
    aria-valuetext={`${angle}% through the recorded angles`} aria-describedby="rotation-hint"
    onKeyDown={event => {
      const keys: Record<string, number> = { ArrowLeft: desired.current - 0.04, ArrowRight: desired.current + 0.04, Home: 0, End: 1 };
      if (event.key in keys) { event.preventDefault(); rotate(keys[event.key]); }
    }}
    onPointerDown={event => {
      if (event.button !== 0) return;
      drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, start: desired.current, horizontal: false };
    }}
    onPointerMove={event => {
      const start = drag.current;
      if (!start || start.id !== event.pointerId) return;
      const dx = event.clientX - start.x, dy = event.clientY - start.y;
      if (!start.horizontal) {
        if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) { drag.current = null; return; }
        if (Math.abs(dx) < 8) return;
        start.horizontal = true;
        event.currentTarget.setPointerCapture(event.pointerId);
      }
      rotate(start.start - dx / Math.max(280, event.currentTarget.clientWidth * 0.75));
    }}
    onPointerUp={event => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      drag.current = null;
    }}
    onPointerCancel={() => { drag.current = null; }}
    onLostPointerCapture={() => { drag.current = null; }}>
    <div className="rotation-backdrop" style={{ backgroundImage: `url(${assetUrl('photos/rotation-poster.jpg')})` }} />
    <img className="rotation-media" src={frameUrl(frame)} alt="" draggable={false} loading="lazy" decoding="async"
      onLoad={() => {
        loaded.current.add(frame);
        if (host.current && changeStart.current) host.current.dataset.frameMs = String(Math.round(performance.now() - changeStart.current));
      }} />
    <p id="rotation-hint" className="rotation-hint">Drag left or right <span>Recorded angles · stops at each end</span></p>
  </div>;
}
