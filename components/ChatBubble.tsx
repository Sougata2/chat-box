import { getNameColor } from "@/lib/utils";
import { TbChecks } from "react-icons/tb";
import { FiClock } from "react-icons/fi";
import { Message } from "@/app/types/room";
import { format } from "date-fns";

function MessageBubble({ isMe, msg }: { isMe: boolean; msg: Message }) {
  return (
    <div
      className={`
        flex
        ${isMe ? "justify-end" : "justify-start"}
      `}
    >
      <div
        className={`
          grid grid-cols-[minmax(0,1fr)_auto]
          min-w-0 max-w-md
          p-2
          rounded-lg border
          items-end gap-x-2 wrap-anywhere [word-break:break-word]
          ${isMe ? "bg-emerald-200 text-emerald-800" : "bg-white"}
        `}
      >
        <div
          className="
            flex flex-col
          "
        >
          {!isMe && (
            <div
              className={`
                h-3
                text-xs font-semibold
                -translate-y-1 capitalize
                ${getNameColor(msg.sender.firstName.toLowerCase())}
              `}
            >
              {msg.sender.firstName} {msg.sender.lastName}
            </div>
          )}
          <div
            className="
              max-w-full
              whitespace-pre-wrap
            "
          >
            {msg.message}
          </div>

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
                items-center gap-1 translate-y-1 translate-x-2
              "
            >
              {format(
                msg?.createdAt ? new Date(msg?.createdAt) : new Date(),
                "hh:mm aaa",
              )}
              {!msg?.createdAt && <FiClock size={11} />}
              {isMe && msg?.createdAt && (
                <TbChecks
                  size={20}
                  className="
                    text-emerald-700
                  "
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MessageBubble;
