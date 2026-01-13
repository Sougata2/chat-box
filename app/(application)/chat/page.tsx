"use client";

import { useDispatch, useSelector } from "react-redux";
import { useCallback, useEffect } from "react";
import { AppDispatch, RootState } from "@/app/store/store";
import { toastError } from "@/components/toastError";
import { setRooms } from "@/app/store/roomSlice";
import { chat } from "@/app/clients/chatClient";
import { Room } from "@/app/types/room";

import Profile from "@/components/Profile";
import Window from "@/components/Window";
import Rooms from "@/components/Rooms";

function Page() {
  const dispatch = useDispatch<AppDispatch>();
  const isRoomSelected =
    useSelector((state: RootState) => state.chat.room) !== null;

  const fetchRooms = useCallback(async () => {
    try {
      const response = await chat.get("/rooms/subscribed-rooms");

      response.data.references.forEach((ref: string) => {
        response.data.rooms[ref] = {
          ...response.data.rooms[ref],
          uuids: response.data.rooms[ref].messages[0]
            ? [response.data.rooms[ref].messages[0].uuid]
            : [],
          messages: {
            [response.data.rooms[ref].messages[0]?.uuid]:
              response.data.rooms[ref].messages[0],
          },
        } as Room;
      });
      dispatch(setRooms(response.data));
    } catch (error) {
      toastError(error);
    }
  }, [dispatch]);

  useEffect(() => {
    (async () => {
      await fetchRooms();
    })();
  }, [fetchRooms]);

  return (
    <div className="grid grid-cols-[70px_6fr_15fr] h-screen gap-4 py-2 px-3">
      <div className="bg-white border rounded-2xl border-slate-300">
        <Profile />
      </div>
      <div className="bg-white border rounded-2xl border-slate-300 min-h-0 pb-3">
        <Rooms />
      </div>
      <div className="rounded-2xl min-h-0">{isRoomSelected && <Window />}</div>
    </div>
  );
}

export default Page;
