"use client";

import { useCallback, useEffect } from "react";
import { AppDispatch } from "@/app/store/store";
import { useDispatch } from "react-redux";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { chat } from "@/app/clients/chatClient";

import Rooms from "@/components/Rooms";
import { setRooms } from "@/app/store/roomSlice";

function Page() {
  const dispatch = useDispatch<AppDispatch>();

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
    <div className="grid grid-cols-[1fr_6fr_15fr] h-full gap-4 py-2 px-3">
      <div className="bg-white border rounded-2xl border-slate-300 container">
        profile
      </div>
      <div className="bg-white border rounded-2xl border-slate-300">
        <Rooms />
      </div>
      <div className="bg-white border rounded-2xl border-slate-300 container">
        window
      </div>
    </div>
  );
}

export default Page;
