import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/app/store/store";
import { ChangeEvent, useState } from "react";
import { LuMessageSquarePlus } from "react-icons/lu";
import { selectRoom } from "@/app/store/chatSlice";
import { toastError } from "./toastError";
import { Input } from "./ui/input";
import { chat } from "@/app/clients/chatClient";
import { Room } from "@/app/types/room";

import NewChatMenu from "./NewChatMenu";
import RoomBlock from "./RoomBlock";

function Rooms() {
  const dispatch = useDispatch<AppDispatch>();
  const rooms = useSelector((state: RootState) => state.rooms);
  const user = useSelector((state: RootState) => state.user.user);

  const [isNewChatMenuOpen, setIsNewChatMenuOpen] = useState<boolean>(false);
  const [query, setQuery] = useState<string>("");

  const openNewChatMenu = () => setIsNewChatMenuOpen(true);
  const closeNewChatMenu = () => setIsNewChatMenuOpen(false);

  function matchsSearch(room: Room, query: string) {
    if (!query) return true;
    const participantsString: string = room.participants
      .filter((p) => p.email !== user?.email)
      .map((p) => `${p.firstName} ${p.lastName}`)
      .join(" ");
    const text = `${room.groupName || ""} ${participantsString}`;
    console.log(text);

    return text.toLowerCase().includes(query.toLowerCase());
  }

  async function selectRoomHandler(reference: string) {
    try {
      const response = await chat.get(`/rooms/opt-room/${reference}`);
      dispatch(selectRoom(response.data));
    } catch (error) {
      toastError(error);
    }
  }

  return (
    <div className="h-full min-h-0 flex flex-col w-full max-w-full overflow-hidden">
      {isNewChatMenuOpen && <NewChatMenu closeNewChatMenu={closeNewChatMenu} />}
      {!isNewChatMenuOpen && (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="container flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <div className="font-semibold text-2xl">Chats</div>
              <div className="hover:bg-slate-100 p-2 rounded-2xl transition-colors duration-300 hover:delay-150 cursor-pointer">
                <LuMessageSquarePlus size={20} onClick={openNewChatMenu} />
              </div>
            </div>
            <div className="rounded-4xl">
              <Input
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setQuery(e.target.value)
                }
                value={query}
                type="text"
                placeholder="search chat"
                className="rounded-4xl bg-slate-100 placeholder:text-slate-700 placeholder:text-[16px] focus:bg-white"
              />
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden border-t border-slate-300 p-2 scrollbar-hide max-w-sm">
            {rooms.references
              .filter((r) => matchsSearch(rooms.rooms[r], query))
              .map((reference) => (
                <div
                  key={reference}
                  onClick={() => selectRoomHandler(reference)}
                >
                  <RoomBlock
                    loggedInUser={user}
                    room={rooms.rooms[reference]}
                  />
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Rooms;
