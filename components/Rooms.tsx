import { useSelector } from "react-redux";
import { RootState } from "@/app/store/store";
import { Input } from "./ui/input";

import RoomBlock from "./RoomBlock";

function Rooms() {
  const rooms = useSelector((state: RootState) => state.rooms.rooms);
  const user = useSelector((state: RootState) => state.user.user);

  return (
    <div className="flex flex-col gap-3">
      <div className="container flex flex-col gap-2">
        <div className="font-semibold text-2xl">Chats</div>
        <div>
          <Input type="text" placeholder="search contacts" />
        </div>
      </div>
      <div className="h-full border-t border-slate-300 p-2">
        {rooms.map((room) => (
          <RoomBlock key={room.id} loggedInUser={user} room={room} />
        ))}
      </div>
    </div>
  );
}

export default Rooms;
