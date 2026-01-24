"use client";

import { unShiftMessageOrRefreshPendingChat } from "../store/chatSlice";
import { useCallback, useEffect, useRef } from "react";
import { addRoom, updateLatestMessage } from "../store/roomSlice";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../store/store";
import { toastError } from "@/components/toastError";
import { Message } from "../types/room";

import React from "react";

function Layout({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();
  const eventSourceRef = useRef<EventSource | null>(null);
  const receiveAudioRef = useRef<HTMLAudioElement | null>(null);
  const room = useSelector((state: RootState) => state.chat.room);
  const user = useSelector((state: RootState) => state.user.user);
  const { accessToken } = useSelector((state: RootState) => state.user);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js");
    }
  }, []);

  useEffect(() => {
    receiveAudioRef.current = new Audio("/received.mp3");
  }, []);

  const connect = useCallback(() => {
    try {
      if (eventSourceRef.current) return;

      const es = new EventSource(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/chat-service/users/stream`,
        {
          withCredentials: true,
        },
      );

      es.addEventListener("MESSAGE", (event) => {
        if (!event.data) return;
        let message: Message;
        try {
          message = JSON.parse(event.data) as Message;
        } catch {
          return;
        }
        dispatch(updateLatestMessage(message));
        if (
          message.room.referenceNumber === room?.referenceNumber ||
          room?.messages[message.uuid]
        ) {
          dispatch(unShiftMessageOrRefreshPendingChat(message));
        }

        if ((message?.sender?.email || message.senderEmail) !== user?.email) {
          if (receiveAudioRef.current) {
            receiveAudioRef.current.currentTime = 0; // replay instantly
            receiveAudioRef.current.play().catch(() => {});
          }
        }
      });

      es.addEventListener("NEW_CHAT", (event) => {
        if (!event.data) return;
        let message: Message;
        try {
          message = JSON.parse(event.data) as Message;
        } catch {
          return;
        }
        dispatch(updateLatestMessage(message));
        const isSameRoomOpen =
          (room?.referenceNumber === null || room?.referenceNumber === "") &&
          room.participants.find((p) => p.email === message.senderEmail);

        if (isSameRoomOpen) {
          dispatch(unShiftMessageOrRefreshPendingChat(message));
        }

        if ((message?.sender?.email || message.senderEmail) !== user?.email) {
          if (receiveAudioRef.current) {
            receiveAudioRef.current.currentTime = 0; // replay instantly
            receiveAudioRef.current.play().catch(() => {});
          }
        }
        console.log("After => ", room);
      });

      es.addEventListener("ROOM", (event) => {
        if (!event.data) return;
        try {
          const room = JSON.parse(event.data);
          dispatch(
            addRoom({
              ...room,
              uuids: room.uuids ? room.uuids : [],
              messages: room.messages ? room.messages : {},
            }),
          );
        } catch (error) {
          console.log("Failed to parse created Room", error);
          return;
        }
      });

      es.onerror = (error) => {
        console.log(error);
        // toast.error(`${error}`);
        // es.close();
        // eventSourceRef.current = null;
      };

      eventSourceRef.current = es;
    } catch (error) {
      toastError(error);
    }
  }, [dispatch, room, user]);

  const disconnect = useCallback(() => {
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
  }, []);

  useEffect(() => {
    disconnect();
    if (accessToken) connect();
  }, [accessToken, connect, disconnect]);

  return <div className="bg-slate-100 h-screen">{children}</div>;
}

export default Layout;
