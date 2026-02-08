"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MdOutlineFileDownload } from "react-icons/md";
import { useSelector } from "react-redux";
import { toastError } from "./toastError";
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

  async function download(url: string) {
    if (!url) return;

    try {
      const fullUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}/chat-service${url}?token=${token}&download=true`;

      const a = document.createElement("a");
      a.href = fullUrl;
      a.download = "";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      toastError(error);
    }
  }

  return (
    <div
      className={`
        flex
        ${isMe ? "justify-end" : "justify-start"}
      `}
    >
      <div
        className="
          grid grid-cols
          gap-2
        "
      >
        {previewMedia.map((m, index) => {
          const isLast = index === MAX_PREVIEW - 1 && remaining > 0;

          return (
            <Dialog key={m.id}>
              <DialogTrigger>
                <div
                  className="
                    overflow-hidden
                    w-30 h-30
                    rounded-lg
                    relative
                  "
                >
                  <Image
                    src={`${process.env.NEXT_PUBLIC_SERVER_URL}/chat-service${m.url}?token=${token}`}
                    alt="media"
                    fill
                    unoptimized
                    className="
                      object-cover
                    "
                  />

                  {isLast && (
                    <div
                      className="
                        flex
                        text-white text-xl font-semibold
                        bg-black/60
                        absolute inset-0 items-center justify-center
                      "
                    >
                      +{remaining}
                    </div>
                  )}
                </div>
              </DialogTrigger>
              <DialogContent
                showCloseButton={false}
                className="
                  flex flex-col
                  max-w-none! w-fit
                  p-0
                  bg-black/80
                  border-none
                  shadow-none
                  backdrop-blur-md gap-2 items-center justify-center
                "
              >
                <DialogTitle
                  className="
                    flex
                    w-full
                    px-4 pt-3 pb-0
                    text-white
                    items-center justify-between
                  "
                >
                  {/* HEADER */}
                  <p
                    className="
                      max-w-[70vw]
                      text-sm font-medium
                      truncate
                    "
                  >
                    {m.originalName}
                  </p>

                  {/* close button (custom) */}
                  <div className="flex">
                    <button
                      className="
                      flex
                      w-8 h-8
                      ml-4
                      text-white text-lg
                      bg-white/10
                      rounded-full
                      items-center justify-center hover:bg-white/20
                    "
                      onClick={async () => await download(m.url ?? "")}
                    >
                      <MdOutlineFileDownload />
                    </button>
                    <button
                      onClick={() =>
                        document.dispatchEvent(
                          new KeyboardEvent("keydown", { key: "Escape" }),
                        )
                      }
                      className="
                    flex
                    w-8 h-8
                    ml-4
                    text-white text-lg
                    bg-white/10
                    rounded-full
                    items-center justify-center hover:bg-white/20
                    "
                    >
                      ✕
                    </button>
                  </div>
                </DialogTitle>

                {/* IMAGE */}
                <div
                  className="
                    flex
                    px-4 pb-6
                    items-center justify-center
                  "
                >
                  <Image
                    src={`${process.env.NEXT_PUBLIC_SERVER_URL}/chat-service${m.url}?token=${token}`}
                    alt="preview"
                    width={1600}
                    height={1600}
                    unoptimized
                    className="
                      object-contain
                      w-auto h-auto max-w-[92vw] max-h-[85vh]
                      rounded-lg
                      shadow-2xl
                    "
                  />
                </div>
              </DialogContent>
            </Dialog>
          );
        })}
      </div>
    </div>
  );
}

export default MediaBubble;
