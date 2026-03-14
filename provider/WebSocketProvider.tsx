import {
  WebSocketContextType,
  IncomingMessage,
  Message,
  Room,
} from "@/types/types";
import { createContext, useCallback, useEffect, useState, useRef } from "react";
import { addFiles, updateMessage } from "@/app/store/chatSlice";
import { addRoom, refreshRooms } from "@/app/store/roomSlice";
import { message as msgClient } from "@/app/clients/messageClient";
import { AppDispatch, store } from "@/app/store/store";
import { useDispatch } from "react-redux";
import { toastError } from "@/components/toastError";
import { CsrfData } from "@/app/types/CsrfData";
import { Client } from "@stomp/stompjs";
import { chat } from "@/app/clients/chatClient";

import React from "react";

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
  const dispatch = useDispatch<AppDispatch>();
  const clientRef = useRef<Client | null>(null);

  const [csrfData, setCsrfData] = useState<CsrfData>(defaultCsrfData);

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
        const incoming = JSON.parse(message.body) as IncomingMessage;
        if (!incoming.message.roomRef) return;
        const state = store.getState();
        const rooms = state.rooms.entities;

        if (rooms[incoming.message.roomRef]) {
          dispatch(refreshRooms(incoming.message));
        } else {
          msgClient
            .get(`/rooms/reference/${incoming.message.roomRef}`)
            .then((response) => {
              dispatch(addRoom(response.data));
            });
        }
        if (incoming.files) {
          dispatch(addFiles({ [incoming.message.uuid]: incoming.files }));
        }
        dispatch(updateMessage(incoming.message));
      });

      stompClient.subscribe("/user/queue/rooms", (message) => {
        // 1. get the new room information
        const room = JSON.parse(message.body) as Room;

        // 2. add the new room.
        dispatch(addRoom(room));

        // 3. subscribe the new room
        stompClient.subscribe(
          `/topic/room/${room.referenceNumber}`,
          (message) => {
            const incoming = JSON.parse(message.body) as IncomingMessage;
            dispatch(refreshRooms(incoming.message));
            if (incoming.files) {
              dispatch(addFiles({ [incoming.message.uuid]: incoming.files }));
            }
            dispatch(updateMessage(incoming.message));
          },
        );
      });

      // subscribe to groups
      const state = store.getState();
      const rooms = state.rooms.entities;

      Object.values(rooms).forEach((room) => {
        if (room.type === "GROUP" && room.referenceNumber) {
          stompClient.subscribe(
            `/topic/room/${room.referenceNumber}`,
            (message) => {
              const incoming = JSON.parse(message.body);

              dispatch(refreshRooms(incoming.message));

              if (incoming.files) {
                dispatch(addFiles({ [incoming.message.uuid]: incoming.files }));
              }

              dispatch(updateMessage(incoming.message));
            },
          );
        }
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

  function postGroup(room: Room) {
    clientRef.current?.publish({
      destination: "/app/group.post",
      body: JSON.stringify(room),
    });
  }

  function sendGroupMessage(reference: string, message: Message) {
    clientRef.current?.publish({
      destination: "/app/group.send",
      body: JSON.stringify({ referenceNumber: reference, message }),
    });
  }

  return (
    <WebSocketContext.Provider
      value={{
        socket: clientRef,
        sendPrivateMessage,
        postGroup,
        sendGroupMessage,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export default WebSocketProvider;
