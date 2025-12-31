import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/app/store/store";
import { LuMessageSquarePlus } from "react-icons/lu";
import { selectRoom } from "@/app/store/chatSlice";
import { toastError } from "./toastError";
import { Input } from "./ui/input";
import { chat } from "@/app/clients/chatClient";
import { Room } from "@/app/types/room";

import RoomBlock from "./RoomBlock";

function Rooms() {
  const dispatch = useDispatch<AppDispatch>();
  const rooms = useSelector((state: RootState) => state.rooms.rooms);
  const user = useSelector((state: RootState) => state.user.user);

  async function selectRoomHandler(room: Room) {
    try {
      const response = await chat.get(
        `/rooms/opt-room/${room.referenceNumber}`
      );
      dispatch(selectRoom(response.data));
    } catch (error) {
      toastError(error);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="container flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <div className="font-semibold text-2xl">Chats</div>
          <div className="hover:bg-slate-100 p-2 rounded-2xl transition-colors duration-300 hover:delay-150 cursor-pointer">
            <LuMessageSquarePlus size={20} />
          </div>
        </div>
        <div className="rounded-4xl">
          <Input
            type="text"
            placeholder="search contacts"
            className="rounded-4xl bg-slate-100 placeholder:text-slate-700 placeholder:text-[16px] focus:bg-white"
          />
        </div>
      </div>
      <div className="h-full border-t border-slate-300 p-2">
        {rooms.map((room) => (
          <div key={room.id} onClick={() => selectRoomHandler(room)}>
            <RoomBlock loggedInUser={user} room={room} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default Rooms;
