"use client";

import {
  DialogTrigger,
  DialogContent,
  DialogTitle,
  Dialog,
} from "@/components/ui/dialog";
import { MdOutlineFileDownload } from "react-icons/md";
import { File, Media, Message } from "@/types/types";
import { getNameColor } from "@/lib/utils";
import { useSelector } from "react-redux";
import { toastError } from "./toastError";
import { FcDocument } from "react-icons/fc";
import { RootState } from "@/app/store/store";
import { TbCheck, TbChecks } from "react-icons/tb";
import { FiClock } from "react-icons/fi";
import { format } from "date-fns";

import Image from "next/image";

const MAX_PREVIEW = 4;

function MediaBubble({
  msg,
  files,
  isMe,
  type,
}: {
  msg: Message;
  files: File[];
  isMe: boolean;
  type: Media;
}) {
  const token = useSelector((state: RootState) => state.user.accessToken);
  const previewMedia = files?.slice(0, MAX_PREVIEW) ?? [];
  const remaining = files?.length - MAX_PREVIEW;

  async function download(url: string) {
    if (!url) return;

    try {
      const fullUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}/message-service/files/view/${url}?token=${token}&download=true`;

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
        className={`
          grid grid-cols
          max-w-md
          p-1
          shadow-md
          rounded-lg border
          gap-1 wrap-anywhere [word-break:break-word]
          ${isMe ? "bg-emerald-200 text-emerald-800" : "bg-white"}
        `}
      >
        {!isMe && (
          <div
            className={`
              h-3.5
              mt-1 px-1
              text-xs font-semibold
              -translate-y-1 capitalize
              ${getNameColor(msg.senderFirstName?.toLowerCase())}
            `}
          >
            {msg.senderFirstName} {msg.senderLastName}
          </div>
        )}
        <div
          className="
            flex flex-col
            w-full min-w-52
            min-h-44
            gap-1
          "
        >
          {previewMedia.map((m, index) => {
            const isLast = index === MAX_PREVIEW - 1 && remaining > 0;

            return (
              <Dialog key={m.id}>
                <DialogTrigger asChild>
                  <div
                    className={`
                      overflow-hidden
                      w-full h-44
                      rounded-lg border
                      cursor-pointer
                      relative
                      ${isMe ? "border-emerald-400" : "border-slate-300"}
                    `}
                  >
                    {type === "IMAGE" && (
                      <div>
                        <Image
                          src={`${process.env.NEXT_PUBLIC_SERVER_URL}/message-service/files/view/${m.url}?token=${token}`}
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
                    )}
                    {type === "DOCUMENT" && (
                      <div>
                        <div className="flex justify-center items-center">
                          <FcDocument size={180} />
                        </div>
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
                    <p
                      className="
                        max-w-[70vw]
                        text-sm font-medium
                        truncate
                      "
                    >
                      {m.originalName}
                    </p>
                    <div
                      className="
                        flex
                      "
                    >
                      <button
                        onClick={async () => await download(m.url ?? "")}
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
                  <div
                    className="
                      flex
                      px-4 pb-6
                      items-center justify-center
                    "
                  >
                    {type === "IMAGE" && (
                      <Image
                        src={`${process.env.NEXT_PUBLIC_SERVER_URL}/message-service/files/view/${m.url}?token=${token}`}
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
                    )}

                    {type === "DOCUMENT" && (
                      <div>
                        <div className="flex justify-center items-center">
                          <FcDocument size={180} />
                        </div>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            );
          })}
        </div>
        {msg.message && (
          <div
            className="
              px-1
            "
          >
            {msg.message}
          </div>
        )}
        <div
          className="
            flex
            h-2.5
            justify-end
          "
        >
          <div
            className="
              flex
              text-[11px] text-slate-600
              items-center gap-1
            "
          >
            {format(
              msg?.createdAt ? new Date(msg?.createdAt) : new Date(),
              "hh:mm aaa",
            )}
            {!msg?.createdAt && <FiClock size={11} />}
            {msg.status === "NOT_SENT" && <FiClock size={11} />}
            {isMe && msg.status === "SENT" && (
              <TbCheck
                size={20}
                className="
                text-emerald-700
                "
              />
            )}
            {isMe && msg.status === "DELIVERED" && (
              <TbChecks
                size={20}
                className="
                text-emerald-700
                "
              />
            )}
            {isMe && msg.status === "READ" && (
              <TbChecks
                size={20}
                className="
                text-blue-500
                "
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MediaBubble;
