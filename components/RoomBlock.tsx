import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
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
    (u: User) => u.email !== loggedInUser?.email
  );

  return (
    <div className="flex gap-2.5 items-center rounded-xl px-2 py-4 hover:bg-slate-100 cursor-pointer">
      <Avatar>
        <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
        <AvatarFallback className="capitalize">
          <span>{otherParticipant?.firstName.substring(0, 1)}</span>
          <span>{otherParticipant?.lastName.substring(0, 1)}</span>
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <div className="text-slate-700 font-medium capitalize">
          {otherParticipant?.firstName} {otherParticipant?.lastName}
        </div>
        {room.uuids.length > 0 && (
          <div className="flex gap-0.5 items-center text-[13px] font-medium text-slate-500 line-clamp-1">
            {!room.messages[room.uuids[0]]?.createdAt && (
              <span className="mt-0.5">
                <FiClock size={11} />
              </span>
            )}
            {room.messages[room.uuids[0]]?.createdAt && (
              <span className="mt-0.5">
                <TbChecks className="text-slate-500" size={16} />
              </span>
            )}
            {(room.messages[room.uuids[0]]?.senderEmail ||
              room.messages[room.uuids[0]]?.sender?.email) ===
            loggedInUser?.email
              ? "You: "
              : `${otherParticipant?.firstName}: `}
            {room.messages[room.uuids[0]]?.message}
          </div>
        )}
      </div>
    </div>
  );
}

export default RoomBlock;
