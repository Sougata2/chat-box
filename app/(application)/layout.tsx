"use client";

import {
  registerPresence,
  presencePayload,
  updatePresence,
  PresenceDto,
} from "../store/presenceSlice";
import { unShiftMessageOrRefreshPendingChat } from "../store/chatSlice";
import { useCallback, useEffect, useRef } from "react";
import { addRoom, updateLatestMessage } from "../store/roomSlice";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../store/store";
import { toastError } from "@/components/toastError";
import { Message } from "../types/room";
import { chat } from "../clients/chatClient";

import React from "react";
import { useChatSocket } from "@/hooks/useChatSocket";
import { Client } from "@stomp/stompjs";
import { Button } from "@/components/ui/button";

function Layout({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();
  const eventSourceRef = useRef<EventSource | null>(null);
  const receiveAudioRef = useRef<HTMLAudioElement | null>(null);
  const room = useSelector((state: RootState) => state.chat.room);
  const user = useSelector((state: RootState) => state.user.user);
  const { accessToken } = useSelector((state: RootState) => state.user);

  const socketRef = useChatSocket(accessToken);

  const sendMessage = () => {
    socketRef.current?.publish({
      destination: "/app/send",
      body: "HELLO",
    });
  };

  return (
    <div className="bg-slate-100 h-screen">
      {/* {children} */}
      <div className="text-center">
        <Button onClick={sendMessage}>Test</Button>
      </div>
    </div>
  );
}

export default Layout;
