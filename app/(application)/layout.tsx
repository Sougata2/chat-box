"use client";

import { useCallback, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../store/store";
import { addStreamedMessage } from "../store/roomSlice";
import { unShiftMessage } from "../store/chatSlice";
import { AxiosError } from "axios";
import { toastError } from "@/components/toastError";
import { useRouter } from "next/navigation";
import { setUser } from "../store/userSlice";
import { Message } from "../types/room";
import { toast } from "sonner";
import { auth } from "../clients/authClient";

import Cookies from "js-cookie";
import React from "react";

function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const eventSourceRef = useRef<EventSource | null>(null);
  const receiveAudioRef = useRef<HTMLAudioElement | null>(null);
  const sendAudioRef = useRef<HTMLAudioElement | null>(null);
  const room = useSelector((state: RootState) => state.chat.room);
  const user = useSelector((state: RootState) => state.user.user);

  useEffect(() => {
    receiveAudioRef.current = new Audio("/received.mp3");
  }, []);

  useEffect(() => {
    sendAudioRef.current = new Audio("/sent.mp3");
  }, []);

  const connect = useCallback(() => {
    try {
      if (eventSourceRef.current) return;

      const es = new EventSource(
        "http://localhost:8080/chat-service/users/stream",
        {
          withCredentials: true,
        }
      );

      es.onmessage = (event) => {
        const message = JSON.parse(event.data) as Message;
        dispatch(addStreamedMessage(message));
        if (message.room.referenceNumber === room?.referenceNumber) {
          dispatch(unShiftMessage(message));
        }

        if (message?.sender?.email !== user?.email) {
          if (receiveAudioRef.current) {
            receiveAudioRef.current.currentTime = 0; // replay instantly
            receiveAudioRef.current.play().catch(() => {});
          }
        } else {
          if (sendAudioRef.current) {
            sendAudioRef.current.currentTime = 0; // replay instantly
            sendAudioRef.current.play().catch(() => {});
          }
        }
      };

      es.onerror = (error) => {
        console.log(error);
        // toast.error(`${error}`);
        es.close();
        eventSourceRef.current = null;
      };

      eventSourceRef.current = es;
    } catch (error) {
      toastError(error);
    }
  }, [dispatch, room?.referenceNumber, user?.email]);

  const disconnect = useCallback(() => {
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
  }, []);

  useEffect(() => {
    connect();
    return disconnect;
  }, [connect, disconnect]);

  const fetchUser = useCallback(async () => {
    try {
      const response = await auth.post("/auth/validate", {
        token: Cookies.get("Authorization"),
      });
      dispatch(setUser(response.data));
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast.error(axiosError.response?.data.message || axiosError.message);
    }
  }, [dispatch]);

  useEffect(() => {
    if (Cookies.get("Authorization")) {
      (async () => {
        await fetchUser();
      })();
    } else {
      router.push("/sign-in");
    }
  }, [fetchUser, router]);

  return <div className="bg-slate-100 h-screen">{children}</div>;
}

export default Layout;
