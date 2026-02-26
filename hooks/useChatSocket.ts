"use client";

import { useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import { CsrfData } from "@/app/types/CsrfData";

export function useChatSocket(token: string | null, csrfData: CsrfData) {
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    if (!token) return;
    if (!csrfData?.headerName) return;
    if (!csrfData?.token) return;
    const stompClient = new Client({
      brokerURL: "ws://localhost:8080/ws/chat",
      connectHeaders: {
        Authorization: `Bearer ${token}`,
        [csrfData.headerName]: csrfData.token,
      },
      debug: (str) => console.log(str),
      reconnectDelay: 5000,
    });

    stompClient.onConnect = () => {
      console.log("Connected to WebSocket");
      stompClient.subscribe("/topic/messages", (message) => {
        console.log("Received " + message.body);
      });
    };

    stompClient.activate();

    clientRef.current = stompClient;

    return () => {
      stompClient.deactivate();
    };
  }, [csrfData?.headerName, csrfData?.token, token]);

  return clientRef;
}
