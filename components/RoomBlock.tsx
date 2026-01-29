import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { GroupAvatar } from "./GroupAvatar";
import { TbChecks } from "react-icons/tb";
import { FiClock } from "react-icons/fi";
import { Room } from "@/app/types/room";
import { User } from "@/app/types/user";

function RoomBlock({
  room,
  loggedInUser,
}: {
  room: Room;
  loggedInUser: User | null;
}) {
  const otherParticipant = room.participants.find(
    (u: User) => u.email !== loggedInUser?.email,
  );

  return (
    <div className="flex gap-2.5 items-center rounded-xl px-2 py-4 hover:bg-slate-100 cursor-pointer overflow-hidden">
      {room?.groupName && <GroupAvatar />}
      {!room?.groupName && (
        <Avatar className="h-10 w-10">
          <AvatarImage src="https://github.com/shadcn.png" />
          <AvatarFallback>
            {otherParticipant?.firstName?.[0]}
            {otherParticipant?.lastName?.[0]}
          </AvatarFallback>
        </Avatar>
      )}
      <div className="flex flex-col flex-1 min-w-0">
        {room.groupName && (
          <div className="text-slate-700 font-medium capitalize">
            {room.groupName}
          </div>
        )}
        {!room.groupName && (
          <div className="text-slate-700 font-medium capitalize">
            {otherParticipant?.firstName} {otherParticipant?.lastName}
          </div>
        )}
        {room.uuids.length > 0 && (
          <div className="flex items-center gap-1 text-[13px] font-medium text-slate-500 min-w-0 overflow-hidden">
            {!room.messages[room.uuids[0]]?.createdAt && (
              <FiClock size={11} className="shrink-0" />
            )}

            {room.messages[room.uuids[0]]?.createdAt && (
              <TbChecks size={16} className="shrink-0 text-slate-500" />
            )}

            <span className="flex-1 min-w-0 truncate">
              {(room.messages[room.uuids[0]]?.senderEmail ||
                room.messages[room.uuids[0]]?.sender?.email) ===
              loggedInUser?.email
                ? "You: "
                : `${room.messages[room.uuids[0]]?.senderFirstName}: `}
              {room.messages[room.uuids[0]]?.message}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default RoomBlock;
