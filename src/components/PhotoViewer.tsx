import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCw, X, ZoomIn, ZoomOut } from 'lucide-react';
import type { BoardPhoto } from '../types';

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const DOUBLE_TAP_ZOOM = 2.5;

interface PhotoViewerProps {
  photo: BoardPhoto;
  title: string;
  subtitle: string;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

/**
 * Full-screen viewer for a board photo — the note text is often the whole
 * point of opening it (PO reading handwriting on a scaled-down capture), so
 * this supports pinch/wheel zoom, drag-to-pan once zoomed, and 90° rotation
 * for photos taken sideways, instead of just a static <img>.
 */
export function PhotoViewer({ photo, title, subtitle, onClose, onPrev, onNext }: PhotoViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const dragStart = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const pinchStart = useRef<{ distance: number; zoom: number } | null>(null);
  const lastTap = useRef(0);

  // Reset the view whenever a different photo is opened, so zoom/rotation
  // from the last one doesn't carry over.
  useEffect(() => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  }, [photo.id]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      else if (e.key === '+' || e.key === '=') setZoom((z) => clampZoom(z + 0.5));
      else if (e.key === '-') setZoom((z) => clampZoom(z - 0.5));
      else if (e.key.toLowerCase() === 'r') setRotation((r) => (r + 90) % 360);
      else if (e.key === 'ArrowLeft' && onPrev) onPrev();
      else if (e.key === 'ArrowRight' && onNext) onNext();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, onPrev, onNext]);

  function clampZoom(z: number): number {
    return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));
  }

  // The image's on-screen box swaps width/height at a 90°/270° rotation, so
  // clamping has to account for that instead of assuming the unrotated size.
  function clampPan(next: { x: number; y: number }, z: number, rot: number): { x: number; y: number } {
    const container = containerRef.current;
    const img = imgRef.current;
    if (!container || !img) return { x: 0, y: 0 };
    const rotated = rot % 180 !== 0;
    const baseW = rotated ? img.offsetHeight : img.offsetWidth;
    const baseH = rotated ? img.offsetWidth : img.offsetHeight;
    const visualW = baseW * z;
    const visualH = baseH * z;
    const maxX = Math.max(0, (visualW - container.clientWidth) / 2);
    const maxY = Math.max(0, (visualH - container.clientHeight) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, next.x)),
      y: Math.min(maxY, Math.max(-maxY, next.y)),
    };
  }

  function setZoomClamped(z: number) {
    const next = clampZoom(z);
    setZoom(next);
    setPan((p) => clampPan(p, next, rotation));
  }

  function resetView() {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    (e.target as Element).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 1) {
      dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };

      const now = Date.now();
      if (now - lastTap.current < 300) {
        setZoomClamped(zoom > 1 ? 1 : DOUBLE_TAP_ZOOM);
        if (zoom > 1) setPan({ x: 0, y: 0 });
      }
      lastTap.current = now;
    } else if (pointers.current.size === 2) {
      dragStart.current = null;
      const pts = [...pointers.current.values()];
      pinchStart.current = { distance: pointDistance(pts[0], pts[1]), zoom };
    }
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2 && pinchStart.current) {
      const pts = [...pointers.current.values()];
      const distance = pointDistance(pts[0], pts[1]);
      const nextZoom = clampZoom(pinchStart.current.zoom * (distance / pinchStart.current.distance));
      setZoom(nextZoom);
      setPan((p) => clampPan(p, nextZoom, rotation));
    } else if (pointers.current.size === 1 && dragStart.current && zoom > 1) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setPan(clampPan({ x: dragStart.current.panX + dx, y: dragStart.current.panY + dy }, zoom, rotation));
    }
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
    if (pointers.current.size === 0) dragStart.current = null;
  }

  function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
    e.preventDefault();
    const factor = Math.exp(-e.deltaY * 0.001);
    setZoomClamped(zoom * factor);
  }

  function pointDistance(a: { x: number; y: number }, b: { x: number; y: number }): number {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/90"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <h3 className="truncate font-display text-lg font-semibold text-white">{title}</h3>
          <p className="truncate text-sm text-white/70">{subtitle}</p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
        >
          <X size={19} />
        </button>
      </div>

      <div
        ref={containerRef}
        className="relative flex-1 touch-none overflow-hidden select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
      >
        <div className="flex h-full w-full items-center justify-center">
          <img
            ref={imgRef}
            src={photo.dataUrl}
            alt="Board photo"
            draggable={false}
            className="max-h-full max-w-full rounded-lg"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) rotate(${rotation}deg) scale(${zoom})`,
              transition: pointers.current.size ? 'none' : 'transform 120ms ease-out',
              cursor: zoom > 1 ? 'grab' : 'default',
            }}
          />
        </div>

        {onPrev && (
          <button
            onClick={onPrev}
            aria-label="Previous photo"
            className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white hover:bg-black/60"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        {onNext && (
          <button
            onClick={onNext}
            aria-label="Next photo"
            className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white hover:bg-black/60"
          >
            <ChevronRight size={20} />
          </button>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 p-4">
        <button
          onClick={() => setZoomClamped(zoom - 0.5)}
          disabled={zoom <= MIN_ZOOM}
          aria-label="Zoom out"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-40"
        >
          <ZoomOut size={19} />
        </button>
        <span className="w-14 text-center text-sm tabular-nums text-white/80">{Math.round(zoom * 100)}%</span>
        <button
          onClick={() => setZoomClamped(zoom + 0.5)}
          disabled={zoom >= MAX_ZOOM}
          aria-label="Zoom in"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-40"
        >
          <ZoomIn size={19} />
        </button>
        <button
          onClick={() => setRotation((r) => (r + 90) % 360)}
          aria-label="Rotate"
          className="ml-2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
        >
          <RotateCw size={19} />
        </button>
        <button
          onClick={resetView}
          disabled={zoom === 1 && rotation === 0}
          aria-hidden={zoom === 1 && rotation === 0}
          tabIndex={zoom === 1 && rotation === 0 ? -1 : undefined}
          className="ml-2 rounded-full bg-white/10 px-3.5 py-2 text-sm font-semibold text-white hover:bg-white/20 disabled:invisible"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
