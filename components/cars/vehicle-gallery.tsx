"use client";

import {useRef, useState} from "react";
import {ChevronLeft, ChevronRight} from "lucide-react";
import {VehicleImage} from "./vehicle-image";
import type {Vehicle} from "@/types";

export function VehicleGallery({vehicle}: {vehicle: Pick<Vehicle,"images"|"title"|"isDemo">}) {
  const photos = vehicle.images.map((photo, index) => ({...photo, index}))
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.order - b.order);
  const [selected, setSelected] = useState(0);
  const touch = useRef<{x: number; y: number} | null>(null);
  const current = photos.length ? selected % photos.length : 0;
  function move(direction: number) {
    if (photos.length > 1) setSelected(index => (index + direction + photos.length) % photos.length);
  }

  return <section className="mx-auto w-full max-w-[640px]" aria-label={vehicle.title + " photos"} aria-roledescription="carousel">
    <div className="relative aspect-[4/3] overflow-hidden rounded-[24px] bg-[#e5ebe6] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#245c47]"
      tabIndex={photos.length > 1 ? 0 : undefined}
      aria-label="Car photo. Use the left and right arrow keys to browse."
      onKeyDown={event => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault(); move(event.key === "ArrowLeft" ? -1 : 1);
        }
      }}
      onTouchStart={event => {const point = event.touches[0]; touch.current = {x: point.clientX, y: point.clientY};}}
      onTouchCancel={() => {touch.current = null;}}
      onTouchEnd={event => {
        if (!touch.current) return;
        const point = event.changedTouches[0];
        const dx = point.clientX - touch.current.x, dy = point.clientY - touch.current.y;
        if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? 1 : -1);
        touch.current = null;
      }}>
      <VehicleImage vehicle={vehicle} imageIndex={photos[current]?.index ?? 0} fit="contain" preload={current === 0}
        sizes="(min-width: 1024px) 50vw, (min-width: 688px) 640px, calc(100vw - 48px)"/>
      {photos.length > 1 && <>
        <button type="button" onClick={() => move(-1)} aria-label="Previous photo" className="absolute left-3 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-[#163f31] shadow"><ChevronLeft size={22}/></button>
        <button type="button" onClick={() => move(1)} aria-label="Next photo" className="absolute right-3 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-[#163f31] shadow"><ChevronRight size={22}/></button>
      </>}
    </div>
    {photos.length > 0 && <p aria-live="polite" aria-atomic="true" className="mt-3 text-center text-sm text-[#68756f]">Photo {current + 1} of {photos.length}</p>}
    {photos.length > 1 && <div className="mt-3 flex gap-3 overflow-x-auto p-1" aria-label="Choose a photo">
      {photos.map((photo, index) => <button type="button" key={photo.index} onClick={() => setSelected(index)}
        aria-label={"View photo " + (index + 1)} aria-pressed={index === current}
        className={"relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#245c47] " + (index === current ? "border-[#245c47]" : "border-transparent opacity-70 hover:opacity-100")}>
        <VehicleImage vehicle={vehicle} imageIndex={photo.index} sizes="96px"/>
      </button>)}
    </div>}
  </section>;
}
