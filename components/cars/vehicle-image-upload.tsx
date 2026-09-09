"use client";

import {useEffect, useRef, useState} from "react";

type Preview = {file: File; url: string};

export function VehicleImageUpload() {
  const input = useRef<HTMLInputElement>(null);
  const previews = useRef<Preview[]>([]);
  const [images, setImages] = useState<Preview[]>([]);
  const [error, setError] = useState("");

  useEffect(() => () => {
    previews.current.forEach(image => URL.revokeObjectURL(image.url));
  }, []);

  function update(next: Preview[]) {
    const files = new DataTransfer();
    next.forEach(image => files.items.add(image.file));
    if (input.current) input.current.files = files.files;
    previews.current = next;
    setImages(next);
  }

  return <fieldset className="grid gap-3 rounded-xl border border-[#dfe6e1] p-4">
    <legend className="px-2 font-bold">Car pictures</legend>
    <label><span className="label">Image link</span><input className="input" name="imageUrl" type="url" placeholder="https://example.com/car.jpg" disabled={images.length > 0}/></label>
    <div className="text-center text-xs font-bold text-[#718079]">OR</div>
    <label><span className="label">Upload images</span><input ref={input} className="input" name="imageFile" type="file" multiple accept="image/jpeg,image/png,image/webp" aria-describedby="image-help image-error" onChange={event => {
      const selected = Array.from(event.currentTarget.files ?? []);
      if (selected.some(file => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size === 0 || file.size > 8 * 1024 * 1024)) {
        setError("Choose JPEG, PNG or WebP images, each non-empty and 8 MB or smaller.");
        update(previews.current);
        return;
      }
      setError("");
      const added = selected.filter(file => !previews.current.some(image => image.file.name === file.name && image.file.size === file.size && image.file.lastModified === file.lastModified));
      if(previews.current.length+added.length>10){setError("Choose up to 10 images.");update(previews.current);return;}
      update([...previews.current, ...added.map(file => ({file, url: URL.createObjectURL(file)}))]);
    }}/></label>
    <p id="image-help" className="text-xs text-[#718079]">Select up to 10 photos or choose more to add to your selection. JPEG, PNG or WebP, up to 8 MB each. The first photo is the cover.</p>
    <p id="image-error" role="alert" className="text-sm text-red-700">{error}</p>
    {images.length > 0 && <p role="status" className="text-sm text-[#245c47]">{images.length} photo{images.length===1?"":"s"} selected. All selected photos will be saved with this car.</p>}
    {images.length > 0 && <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">{images.map((image, index) => <li key={image.url} className="overflow-hidden rounded-xl border border-[#dfe6e1]">
      {/* Local blob previews do not need image optimization. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image.url} alt={`Preview of ${image.file.name}`} className="aspect-[4/3] w-full object-cover"/>
      <div className="grid gap-2 p-3"><p className="truncate text-xs" title={image.file.name}>{image.file.name}</p>{index === 0 && <span className="text-xs font-bold">Cover photo</span>}<button type="button" className="text-left text-sm font-bold text-red-700" aria-label={`Remove ${image.file.name}`} onClick={() => {
        URL.revokeObjectURL(image.url);
        update(previews.current.filter(item => item !== image));
      }}>Remove</button></div>
    </li>)}</ul>}
  </fieldset>;
}
