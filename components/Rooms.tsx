import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/app/store/store";
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
        `/rooms/messages/${room.referenceNumber}`
      );
      dispatch(selectRoom({ ...room, messages: response.data }));
    } catch (error) {
      toastError(error);
    }
  }

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
          <div key={room.id} onClick={() => selectRoomHandler(room)}>
            <RoomBlock loggedInUser={user} room={room} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default Rooms;
