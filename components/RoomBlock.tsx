import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
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
        <AvatarFallback>
          {otherParticipant?.firstName.substring(0, 1)}
          {otherParticipant?.lastName.substring(0, 1)}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-0.5">
        <div className="text-slate-700 font-medium">
          {otherParticipant?.firstName} {otherParticipant?.lastName}
        </div>
        <div className="text-xs">
          {(room.messages[0].senderEmail || room.messages[0].sender.email) ===
          loggedInUser?.email
            ? "You: "
            : `${otherParticipant?.firstName}: `}
          {room.messages[0].message}
        </div>
      </div>
    </div>
  );
}

export default RoomBlock;
