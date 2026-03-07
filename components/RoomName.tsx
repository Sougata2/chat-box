import { Room, User } from "@/types/types";

function RoomName({ room, user }: { room: Room; user: User | null }) {
  if (room.type === "GROUP") {
    return (
      <span
        className="
          text-slate-700 font-medium
          capitalize
          "
      >
        {room?.name}
      </span>
    );
  } else if (room.type === "PRIVATE") {
    if (!room.participants) return;
    const otherParticipant = room?.participants.find(
      (p) => p.id !== user?.id,
    ) as User;
    return (
      <span
        className="
          text-slate-700 font-medium
          capitalize
          "
      >
        {otherParticipant?.firstName} {otherParticipant?.lastName}
      </span>
    );
  }
}

export default RoomName;
