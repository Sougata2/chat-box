import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { TbCheck, TbChecks } from "react-icons/tb";
import { MdOutlineImage } from "react-icons/md";
import { GroupAvatar } from "./GroupAvatar";
import { useSelector } from "react-redux";
import { Room, User } from "@/types/types";
import { RootState } from "@/app/store/store";
import { FiClock } from "react-icons/fi";

import RoomName from "./RoomName";

function RoomBlock({
  room,
  loggedInUser,
  pendingMessageCount,
}: {
  room: Room;
  loggedInUser: User | null;
  pendingMessageCount: number;
}) {
  const typingMap = useSelector((state: RootState) => state.typing.typingMap);
  const chatPartners = useSelector(
    (state: RootState) => state.participants.entities,
  );

  if (!loggedInUser?.id) return;
  if (!room.participants) return;
  const otherParticipant = room.participants.find(
    (p) => p.id !== loggedInUser.id,
  );

  const isMe = room.lastMessage?.senderEmail === loggedInUser.email;
  if (!room.referenceNumber) return null;

  return (
    <div className="relative flex gap-2.5 items-center rounded-xl px-2 py-4 hover:bg-slate-100 cursor-pointer overflow-hidden">
      {room.type === "GROUP" && <GroupAvatar />}
      {room.type === "PRIVATE" && (
        <Avatar className="h-10 w-10">
          <AvatarImage src="https://github.com/shadcn.png" />
          <AvatarFallback>
            {otherParticipant?.firstName?.[0]}
            {otherParticipant?.lastName?.[0]}
          </AvatarFallback>
        </Avatar>
      )}
      <div className="flex flex-col flex-1 min-w-0">
        <div className="text-slate-700 font-medium capitalize">
          <RoomName room={room} user={loggedInUser} />
        </div>
        <div className="flex items-center gap-1 text-[13px] font-medium text-slate-500 min-w-0 overflow-hidden">
          {isMe && (
            <>
              {room.lastMessage?.status === "NOT_SENT" && (
                <FiClock size={11} className="shrink-0" />
              )}

              {room.lastMessage?.status === "DELIVERED" && (
                <TbChecks size={16} className="shrink-0 text-slate-500" />
              )}

              {room.lastMessage?.status === "SENT" && (
                <TbCheck size={16} className="shrink-0 text-slate-500" />
              )}
              {room.lastMessage?.status === "READ" && (
                <TbChecks size={16} className="shrink-0 text-blue-500" />
              )}
            </>
          )}

          <span className="flex-1 min-w-0 overflow-hidden whitespace-nowrap truncate flex items-center gap-1">
            {typingMap[room.referenceNumber]?.length > 0 ? (
              <span className="shrink-0 text-emerald-600 capitalize">
                {chatPartners[typingMap[room.referenceNumber][0]].firstName} is
                typing
              </span>
            ) : (
              <>
                <span className="shrink-0 capitalize">
                  {room.lastMessage?.senderId === loggedInUser?.id
                    ? "You: "
                    : `${room.lastMessage?.senderFirstName}: `}
                </span>

                {room.lastMessage?.media === "IMAGE" && (
                  <MdOutlineImage className="shrink-0 inline" size={17} />
                )}

                <span className="truncate">{room.lastMessage?.message}</span>
                {pendingMessageCount > 0 && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-emerald-500 text-white font-semibold text-[14px] w-6 h-6 flex items-center justify-center rounded-full leading-none tabular-nums shadow-2xl">
                    {pendingMessageCount}
                  </span>
                )}
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

export default RoomBlock;
