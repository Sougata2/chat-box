import { createContext, useCallback, useEffect, useState, useRef } from "react";
import { Message, WebSocketContextType } from "@/types/types";
import { updateMessage } from "@/app/store/chatSlice";
import { AppDispatch } from "@/app/store/store";
import { useDispatch } from "react-redux";
import { toastError } from "@/components/toastError";
import { CsrfData } from "@/app/types/CsrfData";
import { Client } from "@stomp/stompjs";
import { chat } from "@/app/clients/chatClient";

import React from "react";
import { refreshRooms } from "@/app/store/roomSlice";

export const WebSocketContext = createContext<WebSocketContextType | null>(
  null,
);

const defaultCsrfData = {
  headerName: null,
  parameterName: null,
  token: null,
} as CsrfData;

function WebSocketProvider({
  token,
  children,
}: {
  token: string | null;
  children: React.ReactNode;
}) {
  const clientRef = useRef<Client | null>(null);
  const [csrfData, setCsrfData] = useState<CsrfData>(defaultCsrfData);
  const dispatch = useDispatch<AppDispatch>();

  const fetchCsrfToken = useCallback(async () => {
    try {
      const response = await chat.get("/csrf/token");
      setCsrfData({ ...response.data } as CsrfData);
    } catch (error) {
      toastError(error);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await fetchCsrfToken();
    })();
  }, [fetchCsrfToken]);

  useEffect(() => {
    if (!token) return;
    if (!csrfData?.headerName) return;
    if (!csrfData?.token) return;
    const stompClient = new Client({
      brokerURL: process.env.NEXT_PUBLIC_WEBSOCKET_URL,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
        [csrfData.headerName]: csrfData.token,
      },
      debug: (str) => console.log(str),
      reconnectDelay: 5000,
    });

    stompClient.onConnect = () => {
      stompClient.subscribe("/user/queue/messages", (message) => {
        const incoming = JSON.parse(message.body) as Message;
        dispatch(updateMessage(incoming));
        dispatch(refreshRooms(incoming));
      });
    };

    stompClient.activate();

    clientRef.current = stompClient;

    return () => {
      stompClient.deactivate();
    };
  }, [csrfData.headerName, csrfData.token, dispatch, token]);

  function sendPrivateMessage(recipient: string, message: Message) {
    clientRef.current?.publish({
      destination: "/app/private.send",
      body: JSON.stringify({ recipient, message }),
    });
  }

  return (
    <WebSocketContext.Provider
      value={{ socket: clientRef, sendPrivateMessage }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export default WebSocketProvider;
