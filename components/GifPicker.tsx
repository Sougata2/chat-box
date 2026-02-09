/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { searchGifs, trendingGifs, urlToFile } from "@/lib/giphy";

type Props = {
  onSelect: (file: File) => void; // send to chat
};

export default function GifPicker({ onSelect }: Props) {
  const [gifs, setGifs] = useState<any[]>([]);
  const [q, setQ] = useState("");

  const loadTrending = async () => {
    const data = await trendingGifs();
    setGifs(data);
  };

  useEffect(() => {
    (async () => {
      await loadTrending();
    })();
  }, []);

  const handleSearch = async (v: string) => {
    setQ(v);
    if (!v) return loadTrending();
    const data = await searchGifs(v);
    setGifs(data);
  };

  const sendGif = async (gif: any) => {
    const url = gif.images.original.url;

    // convert to file
    const file = await urlToFile(url, "gif.gif");

    // send back to chat
    onSelect(file);
  };

  return (
    <div className="w-90 h-105 bg-slate-200 rounded-xl p-3 flex flex-col">
      <input
        placeholder="Search GIF..."
        value={q}
        onChange={(e) => handleSearch(e.target.value)}
        className="p-2 mb-3 rounded bg-slate-300 outline-none"
      />

      <div className="grid grid-cols-2 gap-2 overflow-y-auto">
        {gifs.map((gif) => (
          <div
            key={gif.id}
            className="relative w-full h-32 rounded cursor-pointer hover:opacity-80 overflow-hidden"
            onClick={() => sendGif(gif)}
          >
            <Image
              src={gif.images.fixed_height.url}
              alt="GIF"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        ))}
      </div>
    </div>
  );
}
