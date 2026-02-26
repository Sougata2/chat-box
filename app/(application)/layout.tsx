"use client";

import {
  registerPresence,
  presencePayload,
  updatePresence,
  PresenceDto,
} from "../store/presenceSlice";
import { unShiftMessageOrRefreshPendingChat } from "../store/chatSlice";
import { useCallback, useEffect, useRef, useState } from "react";
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
import { CsrfData } from "../types/CsrfData";

const defaultCsrfData = {
  headerName: null,
  parameterName: null,
  token: null,
} as CsrfData;

function Layout({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();
  const eventSourceRef = useRef<EventSource | null>(null);
  const receiveAudioRef = useRef<HTMLAudioElement | null>(null);
  const room = useSelector((state: RootState) => state.chat.room);
  const user = useSelector((state: RootState) => state.user.user);
  const { accessToken } = useSelector((state: RootState) => state.user);
  const [csrfTokenDetails, setCsrfTokenDetails] =
    useState<CsrfData>(defaultCsrfData);

  const socketRef = useChatSocket(accessToken, csrfTokenDetails);

  const fetchCsrfToken = useCallback(async () => {
    try {
      const response = await chat.get("/csrf/token");
      setCsrfTokenDetails({ ...response.data } as CsrfData);
    } catch (error) {
      toastError(error);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await fetchCsrfToken();
    })();
  }, [fetchCsrfToken]);

  const sendMessage = () => {
    if (!csrfTokenDetails?.headerName) return;
    if (!csrfTokenDetails?.token) return;
    socketRef.current?.publish({
      destination: "/app/send",
      body: "HELLO",
      headers: {
        [csrfTokenDetails.headerName]: csrfTokenDetails.token,
      },
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
