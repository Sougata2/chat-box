"use client";

import { FileContext, FileDispatchContext } from "@/app/contexts";
import { useCallback, useEffect, useState } from "react";
import { initializePages } from "@/app/store/pageSlice";
import { setParticipants } from "@/app/store/participantSlice";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/app/store/store";
import { setPresence } from "@/app/store/presenceSlice";
import { toastError } from "@/components/toastError";
import { setRooms } from "@/app/store/roomSlice";
import { message } from "@/app/clients/messageClient";
import { chat } from "@/app/clients/chatClient";

import PageRenderer from "@/components/PageRenderer";

function Page() {
  const dispatch = useDispatch<AppDispatch>();
  const [files, setFiles] = useState<FileList | null>(null);

  const fetchRooms = useCallback(async () => {
    try {
      const response = await message.get("/rooms/subscribed-rooms");
      dispatch(setRooms(response.data));
    } catch (error) {
      toastError(error);
    }
  }, [dispatch]);

  const fetchParticipants = useCallback(async () => {
    try {
      const response = await message.get("/rooms/chat-partners");
      dispatch(setParticipants(response.data));
    } catch (error) {
      toastError(error);
    }
  }, [dispatch]);

  const fetchOnlineUsers = useCallback(async () => {
    try {
      const response = await chat.get("/presence/online-users");
      dispatch(setPresence(response.data));
    } catch (error) {
      toastError(error);
    }
  }, [dispatch]);

  useEffect(() => {
    (async () => {
      await fetchRooms();
      await fetchParticipants();
      await fetchOnlineUsers();
    })();
  }, [fetchOnlineUsers, fetchParticipants, fetchRooms]);

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
        <FileDispatchContext.Provider value={setFiles}>
          <FileContext.Provider value={files}>
            <PageRenderer stack="window" />
          </FileContext.Provider>
        </FileDispatchContext.Provider>
      </div>
    </div>
  );
}

export default Page;
