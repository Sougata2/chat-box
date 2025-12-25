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
  return (
    <div className="flex gap-2.5 items-center rounded-xl px-2 py-4 hover:bg-slate-100 cursor-pointer">
      <Avatar>
        <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
        <AvatarFallback>
          {room?.otherParticipantFirstName?.substring(0, 1)}
          {room?.otherParticipantLastName?.substring(0, 1)}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-0.5">
        <div className="text-slate-700 font-medium">
          {room?.otherParticipantFirstName} {room?.otherParticipantLastName}
        </div>
        <div className="text-xs">
          {room?.latestMessageSenderEmail === loggedInUser?.email
            ? "You: "
            : `${room?.otherParticipantFirstName}: `}
          {room?.latestMessage}
        </div>
      </div>
    </div>
  );
}

export default RoomBlock;
