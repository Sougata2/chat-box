"use client";

import { useCallback, useEffect } from "react";
import { initializePages } from "@/app/store/pageSlice";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/app/store/store";
import { toastError } from "@/components/toastError";
import { setRooms } from "@/app/store/roomSlice";
import { chat } from "@/app/clients/chatClient";
import { Room } from "@/app/types/room";

import PageRenderer from "@/components/PageRenderer";

function Page() {
  const dispatch = useDispatch<AppDispatch>();

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

  useEffect(() => {
    dispatch(initializePages());
  }, [dispatch]);

  return (
    <div className="grid grid-cols-[70px_minmax(100,28%)_1fr] h-screen gap-4 py-2 px-3">
      <div className="bg-white border rounded-2xl border-slate-300">
        <PageRenderer stack="profile" />
      </div>
      <div className="bg-white border rounded-2xl border-slate-300 min-h-0 pb-3">
        <PageRenderer stack="rooms" />
      </div>
      <div className="rounded-2xl min-h-0">
        <PageRenderer stack="window" />
      </div>
    </div>
  );
}

export default Page;
