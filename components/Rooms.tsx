import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/app/store/store";
import { ChangeEvent, useCallback, useState } from "react";
import { resetStack, stackPage } from "@/app/store/pageSlice";
import { LuMessageSquarePlus } from "react-icons/lu";
import { Page, PageLocator } from "@/app/types/page";
import { roomSelectors } from "@/app/store/adapter/roomAdapter";
import { toastError } from "./toastError";
import { saveRoom } from "@/app/store/chatSlice";
import { message } from "@/app/clients/messageClient";
import { Input } from "./ui/input";
import { Room } from "@/types/types";

import RoomBlock from "./RoomBlock";
import { pendingMessageActions } from "@/app/store/pendingMessageSlice";

function Rooms() {
  const dispatch = useDispatch<AppDispatch>();
  const rooms = useSelector(roomSelectors.selectAll);
  const user = useSelector((state: RootState) => state.user.user);
  const pendingMessages = useSelector(
    (state: RootState) => state.pendingMessages.roomMessageMap,
  );
  const messageViewMap = useSelector(
    (state: RootState) => state.pendingMessages.messageViewMap,
  );
  const currentRoom = useSelector((state: RootState) => state.chat.room);

  const [query, setQuery] = useState<string>("");

  const clearPendingMessages = useCallback(() => {
    if (!currentRoom?.referenceNumber) return;
    if (!pendingMessages[currentRoom.referenceNumber]) return;
    dispatch(
      pendingMessageActions.clearPendingMessages(currentRoom.referenceNumber),
    );
  }, [currentRoom, dispatch, pendingMessages]);

  function matchsSearch(room: Room, query: string) {
    if (!query) return true;
    if (!room.name) return;
    return room.name.toLowerCase().includes(query.toLowerCase());
  }

  async function selectRoomHandler(reference: string) {
    try {
      const response = await message.get(`/rooms/reference/${reference}`);
      dispatch(saveRoom(response.data));
      clearPendingMessages();
      dispatch(
        stackPage({
          stack: "window",
          page: {
            name: "window",
            import: "@/components/Window",
            closeable: false,
          } as Page,
        } as PageLocator),
      );
      dispatch(
        resetStack({
          stack: "media",
          defaultPage: {
            name: "mediaChat",
            import: "@/components/MediaChat",
          } as Page,
        } as PageLocator),
      );
    } catch (error) {
      toastError(error);
    }
  }

  return (
    <div className="h-full min-h-0 flex flex-col w-full max-w-full overflow-hidden">
      <div className="flex flex-col flex-1 min-h-0">
        <div className="container flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <div className="font-semibold text-2xl">Chats</div>
            <div className="hover:bg-slate-100 p-2 rounded-2xl transition-colors duration-300 hover:delay-150 cursor-pointer">
              <LuMessageSquarePlus
                size={20}
                onClick={() => {
                  dispatch(
                    stackPage({
                      stack: "rooms",
                      page: {
                        name: "newChatMenu",
                        import: "@/component/NewChatMenu",
                        closeable: true,
                      } as Page,
                    } as PageLocator),
                  );
                }}
              />
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
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden border-t border-slate-300 p-2 scrollbar-hide max-w-full">
          {rooms
            .filter((room) => matchsSearch(room, query))
            .map((room) => {
              if (!room.referenceNumber) return;
              return (
                <div
                  key={room.referenceNumber}
                  onClick={() => {
                    if (!room.referenceNumber) return;
                    selectRoomHandler(room.referenceNumber);
                  }}
                >
                  <RoomBlock
                    loggedInUser={user}
                    room={room}
                    pendingMessageCount={
                      pendingMessages[room?.referenceNumber]?.filter(
                        (p) => !messageViewMap[p.uuid],
                      )?.length ?? 0
                    }
                  />
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

export default Rooms;
