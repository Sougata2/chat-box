"use client";

import { useDispatch, useSelector } from "react-redux";
import { useCallback, useEffect } from "react";
import { AppDispatch, RootState } from "@/app/store/store";
import { AxiosError } from "axios";
import { setRooms } from "@/app/store/roomSlice";
import { toast } from "sonner";
import { chat } from "@/app/clients/chatClient";

import Window from "@/components/Window";
import Rooms from "@/components/Rooms";

function Page() {
  const dispatch = useDispatch<AppDispatch>();
  const isRoomSelected =
    useSelector((state: RootState) => state.chat.room) !== null;

  const fetchRooms = useCallback(async () => {
    try {
      const response = await chat.get("/rooms/subscribed-rooms");
      dispatch(setRooms(response.data));
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast.error(axiosError.response?.data.message);
    }
  }, [dispatch]);

  useEffect(() => {
    (async () => {
      await fetchRooms();
    })();
  }, [fetchRooms]);

  return (
    <div className="grid grid-cols-[1fr_6fr_15fr] h-screen gap-4 py-2 px-3">
      <div className="bg-white border rounded-2xl border-slate-300 container">
        profile
      </div>
      <div className="bg-white border rounded-2xl border-slate-300">
        <Rooms />
      </div>
      <div className="rounded-2xl min-h-0">{isRoomSelected && <Window />}</div>
    </div>
  );
}

export default Page;
