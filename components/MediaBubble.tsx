"use client";

import { Media } from "@/app/types/media";
import { Message } from "@/app/types/room";
import Image from "next/image";

const MAX_PREVIEW = 4;

function MediaBubble({
  msg,
  media,
  isMe,
}: {
  msg: Message;
  media: Media[];
  isMe: boolean;
}) {
  const previewMedia = media.slice(0, MAX_PREVIEW);
  const remaining = media.length - MAX_PREVIEW;

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div className="grid grid-cols gap-2">
        {previewMedia.map((m, index) => {
          const isLast = index === MAX_PREVIEW - 1 && remaining > 0;

          return (
            <div
              key={m.id}
              className="relative w-[120px] h-[120px] rounded-lg overflow-hidden"
            >
              <Image
                src="/user-image.png"
                alt="media"
                fill
                sizes="120px"
                className="object-cover"
              />

              {isLast && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xl font-semibold">
                  +{remaining}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MediaBubble;
