import { getNameColor } from "@/lib/utils";
import { TbChecks } from "react-icons/tb";
import { Message } from "@/types/types";
import { FiClock } from "react-icons/fi";
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
          shadow-md
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
                ${getNameColor(msg.senderFirstName?.toLowerCase())}
              `}
            >
              {msg.senderFirstName} {msg.senderLastName}
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
              {msg.status === "NOT_SENT" && <FiClock size={11} />}
              {isMe && msg.status === "SENT" && (
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
