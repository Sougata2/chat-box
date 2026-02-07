"use client";

import { useSelector } from "react-redux";
import { RootState } from "@/app/store/store";
import { Message } from "@/app/types/room";
import { Media } from "@/app/types/media";

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
  const token = useSelector((state: RootState) => state.user.accessToken);
  const previewMedia = media.slice(0, MAX_PREVIEW);
  const remaining = media.length - MAX_PREVIEW;

  console.log(msg);

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div className="grid grid-cols gap-2">
        {previewMedia.map((m, index) => {
          const isLast = index === MAX_PREVIEW - 1 && remaining > 0;

          return (
            <div
              key={m.id}
              className="relative w-30 h-30 rounded-lg overflow-hidden"
            >
              <Image
                src={`${process.env.NEXT_PUBLIC_SERVER_URL}/chat-service${m.url}?token=${token}`}
                alt="media"
                fill
                className="object-cover"
                unoptimized
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
