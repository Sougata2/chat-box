"use client";

import { useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";

export function useChatSocket(token: string | null) {
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    if (!token) return;
    const stompClient = new Client({
      brokerURL: "ws://localhost:8080/ws/chat",
      connectHeaders: {
        Authorization: `Bearer ${token}`,
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
  }, [token]);

  return clientRef;
}
