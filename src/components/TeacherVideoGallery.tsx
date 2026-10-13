"use client";

import { useState } from "react";
import { Play, X } from "lucide-react";

export interface TeacherVideoItem {
  id: string;
  url: string;
  title?: string | null;
  uploadedAt?: string;
}

export default function TeacherVideoGallery({
  videos,
}: {
  videos: TeacherVideoItem[];
}) {
  const [open, setOpen] = useState<TeacherVideoItem | null>(null);

  if (videos.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {videos.map((v) => (
          <button
            key={v.id}
            onClick={() => setOpen(v)}
            className="relative aspect-video rounded-2xl overflow-hidden bg-stone-900 group"
          >
            <video
              src={v.url}
              preload="metadata"
              muted
              playsInline
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition">
              <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center text-myna-charcoal">
                <Play size={20} fill="currentColor" />
              </div>
            </div>
            {v.title && (
              <p className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 to-transparent text-white text-xs font-semibold p-3 text-start truncate">
                {v.title}
              </p>
            )}
          </button>
        ))}
      </div>

      {open && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setOpen(null)}
        >
          <div
            className="relative bg-black rounded-3xl overflow-hidden max-w-3xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <video src={open.url} controls autoPlay className="w-full aspect-video" />
            {open.title && (
              <p className="text-white text-sm font-semibold px-4 py-3 bg-stone-900">
                {open.title}
              </p>
            )}
            <button
              onClick={() => setOpen(null)}
              className="absolute top-3 end-3 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}