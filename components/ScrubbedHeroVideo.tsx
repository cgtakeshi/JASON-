"use client";

import { useEffect, useRef } from "react";

const CONFIG = {
  minProgress: 0.02,
  maxProgress: 0.98,
  centerProgress: 0.5,
  smoothing: 0.12,
  seekThreshold: 0.006,
};

type ScrubbedHeroVideoProps = {
  src: string;
  poster: string;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export default function ScrubbedHeroVideo({ src, poster }: ScrubbedHeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let targetProgress = CONFIG.centerProgress;
    let currentProgress = CONFIG.centerProgress;
    let lastAppliedProgress = -1;
    let lastPointerY = window.innerHeight / 2;
    let pointerIsInside = false;
    let rafId: number | null = null;

    const applyProgress = (progress: number, force = false) => {
      if (!Number.isFinite(video.duration) || video.duration <= 0) return;
      if (!force && Math.abs(progress - lastAppliedProgress) < CONFIG.seekThreshold) return;
      video.currentTime = progress * video.duration;
      lastAppliedProgress = progress;
    };

    const stopAnimation = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = null;
    };

    const animate = () => {
      rafId = null;
      if (document.hidden) return;

      const difference = targetProgress - currentProgress;
      currentProgress += difference * CONFIG.smoothing;

      const settled = Math.abs(difference) < 0.0005;
      if (settled) currentProgress = targetProgress;
      applyProgress(currentProgress, settled);

      if (!settled) rafId = requestAnimationFrame(animate);
    };

    const startAnimation = () => {
      if (rafId === null && !document.hidden) rafId = requestAnimationFrame(animate);
    };

    const updateTargetFromPointer = () => {
      const normalizedY = clamp(lastPointerY / Math.max(window.innerHeight, 1), 0, 1);
      targetProgress =
        CONFIG.minProgress + normalizedY * (CONFIG.maxProgress - CONFIG.minProgress);
      startAnimation();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      pointerIsInside = true;
      lastPointerY = event.clientY;
      updateTargetFromPointer();
    };

    const returnToCenter = () => {
      pointerIsInside = false;
      targetProgress = CONFIG.centerProgress;
      startAnimation();
    };

    const onWindowMouseOut = (event: MouseEvent) => {
      if (!event.relatedTarget) returnToCenter();
    };

    const onResize = () => {
      if (pointerIsInside) updateTargetFromPointer();
      else returnToCenter();
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        stopAnimation();
        return;
      }
      if (!pointerIsInside) targetProgress = CONFIG.centerProgress;
      startAnimation();
    };

    const onLoadedMetadata = () => {
      video.pause();
      currentProgress = CONFIG.centerProgress;
      targetProgress = CONFIG.centerProgress;
      applyProgress(CONFIG.centerProgress, true);
    };

    video.pause();
    video.addEventListener("loadedmetadata", onLoadedMetadata);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("mouseout", onWindowMouseOut);
    window.addEventListener("blur", returnToCenter);
    window.addEventListener("resize", onResize, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);

    if (video.readyState >= 1) onLoadedMetadata();

    return () => {
      stopAnimation();
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("mouseout", onWindowMouseOut);
      window.removeEventListener("blur", returnToCenter);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return (
    <video
      ref={videoRef}
      className="hero-video"
      src={src}
      poster={poster}
      muted
      playsInline
      preload="auto"
      aria-hidden="true"
      tabIndex={-1}
      disablePictureInPicture
    />
  );
}
