/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Room,
  Message,
  TypingDto,
  PresenceDto,
  TypingStatus,
  IncomingMessage,
  WebSocketContextType,
  AcknowledgementDto,
  AcknowledgeableMessage,
  Status,
} from "@/types/types";
import { createContext, useCallback, useEffect, useState, useRef } from "react";
import { AppDispatch, RootState, store } from "@/app/store/store";
import { addPresence, updatePresence } from "@/app/store/presenceSlice";
import { useDispatch, useSelector } from "react-redux";
import { addFiles, updateMessage } from "@/app/store/chatSlice";
import { addTyping, removeTyping } from "@/app/store/typingSlice";
import { addRoom, refreshRooms } from "@/app/store/roomSlice";
import { message as msgClient } from "@/app/clients/messageClient";
import type { DebouncedFunc } from "lodash";
import { toastError } from "@/components/toastError";
import { CsrfData } from "@/app/types/CsrfData";
import { Client } from "@stomp/stompjs";
import { chat } from "@/app/clients/chatClient";

import debounce from "lodash.debounce";
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
  const typingTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const subscriptions = useRef<Set<string>>(new Set());
  const debouncedTypingRef = useRef<DebouncedFunc<
    (reference: string, username: string, status: TypingStatus) => void
  > | null>(null);
  const pendingAcks = useRef<Map<string, AcknowledgeableMessage[]>>(new Map());
  const ackTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const rooms = useSelector((state: RootState) => state.rooms.entities);

  const [csrfData, setCsrfData] = useState<CsrfData>(defaultCsrfData);

  const sendAcknowledgement = useCallback((message: Message) => {
    if (!message.roomRef) return;
    let pendingAckMsgs = pendingAcks.current.get(message.roomRef) as
      | AcknowledgeableMessage[]
      | undefined;

    if (!pendingAckMsgs) pendingAckMsgs = [] as AcknowledgeableMessage[];
    pendingAckMsgs.push({
      id: message.id,
      senderEmail: message.senderEmail,
      uuid: message.uuid,
    } as AcknowledgeableMessage);
    pendingAcks.current.set(message.roomRef, pendingAckMsgs);

    // if timer exists -> clear it
    if (ackTimeouts.current.has(message.roomRef)) {
      clearTimeout(ackTimeouts.current.get(message.roomRef));
    }

    const timeout = setTimeout(() => {
      const roomStatusMap = new Map<string, Status>();
      const activeRoomRef = store.getState().chat.room?.referenceNumber;

      for (const [roomRef] of pendingAcks.current) {
        const isInView = document.visibilityState === "visible";
        const isRoomActive = activeRoomRef
          ? roomRef === activeRoomRef && isInView
          : false;
        roomStatusMap.set(roomRef, isRoomActive ? "READ" : "DELIVERED");
      }

      const payload = {
        roomMessageMap: pendingAcks.current,
        statusMap: roomStatusMap,
      } as AcknowledgementDto;

      clientRef.current?.publish({
        destination: "/app/post.acknowledge",
        body: JSON.stringify(payload),
      });

      // clean up
      ackTimeouts.current.clear();
      pendingAcks.current.clear();
    }, 2000);

    ackTimeouts.current.set(message.roomRef, timeout);
  }, []);

  const fetchCsrfToken = useCallback(async () => {
    try {
      const response = await chat.get("/csrf/token");
      setCsrfData({ ...response.data } as CsrfData);
    } catch (error) {
      toastError(error);
    }
  }, []);

  useEffect(() => {
    debouncedTypingRef.current = debounce(
      (reference: string, username: string, status: TypingStatus) => {
        const client = clientRef.current;
        if (!client?.publish) return;

        client?.publish({
          destination: "/app/chat.typing",
          body: JSON.stringify({ roomRef: reference, username, status }),
        });
      },
      500,
    );

    return () => {
      debouncedTypingRef.current?.cancel();
    };
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
      debug: (str) => console.info(str),
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

        sendAcknowledgement(incoming.message);
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

      // prevents reconnection
      const stateRooms = store.getState().rooms.entities;
      // subscribe to groups and typing
      subscriptions.current.clear();

      // prevent signed to receive his own message
      const signedUser = store.getState().user.user;

      Object.values(stateRooms).forEach((room) => {
        if (!room.referenceNumber) return;

        if (room.type === "GROUP") {
          stompClient.subscribe(
            `/topic/room/${room.referenceNumber}`,
            (message) => {
              const incoming = JSON.parse(message.body) as IncomingMessage;

              if (signedUser?.email === incoming.message.senderEmail) return;

              dispatch(refreshRooms(incoming.message));

              if (incoming.files) {
                dispatch(addFiles({ [incoming.message.uuid]: incoming.files }));
              }

              dispatch(updateMessage(incoming.message));

              sendAcknowledgement(incoming.message);
            },
          );
        }

        // subscribe to typing
        stompClient.subscribe(
          `/topic/typing/${room.referenceNumber}`,
          (message) => {
            const signedUser = store.getState().user;
            if (!signedUser) return;
            if (!signedUser.user?.email) return;
            const typing = JSON.parse(message.body) as TypingDto;
            console.log("Typing", typing);
            const { roomRef, status, username } = typing;
            if (signedUser.user.email === username) return;

            const key = `${roomRef}-${username}`;
            if (status === "START") {
              dispatch(addTyping(typing));
            } else {
              dispatch(removeTyping(typing));
            }

            if (typingTimeouts.current.has(key)) {
              clearTimeout(typingTimeouts.current.get(key));
            }

            const timeout = setTimeout(() => {
              dispatch(removeTyping(typing));
              typingTimeouts.current.delete(key);
            }, 10000);

            typingTimeouts.current.set(key, timeout);
          },
        );
        subscriptions.current.add(room.referenceNumber);
      });

      // subscribe to presence
      stompClient.subscribe("/topic/presence", (message) => {
        const presence = JSON.parse(message.body) as PresenceDto;
        const presenceSlice = store.getState().presence;
        console.log("Presence : ", presence);
        if (presenceSlice.entities[presence.username])
          dispatch(updatePresence(presence));
        else dispatch(addPresence(presence));
      });

      const interval = setInterval(() => {
        if (!clientRef.current?.connected) return;
        console.log("heart-beat");
        clientRef.current?.publish({
          destination: "/app/heartbeat",
          body: JSON.stringify({}),
        });
      }, 60000); // store it for cleanup

      (stompClient as any).hbInterval = interval;
    };

    stompClient.activate();

    clientRef.current = stompClient;

    return () => {
      if ((stompClient as any).hbInterval) {
        clearInterval((stompClient as any).hbInterval);
      }
      stompClient.deactivate();
    };
  }, [csrfData, dispatch, sendAcknowledgement, token]);

  useEffect(() => {
    const stompClient = clientRef.current;
    if (!stompClient?.connected) return;

    Object.values(rooms).forEach((room) => {
      if (!room.referenceNumber) return;
      if (subscriptions.current.has(room.referenceNumber)) return;
      if (room.type === "GROUP") {
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

      // subscribe to typing
      stompClient.subscribe(
        `/topic/typing/${room.referenceNumber}`,
        (message) => {
          const signedUser = store.getState().user;
          if (!signedUser) return;
          if (!signedUser.user?.email) return;
          const typing = JSON.parse(message.body) as TypingDto;
          console.log("Typing", typing);
          const { roomRef, status, username } = typing;
          if (signedUser.user.email === username) return;

          const key = `${roomRef}-${username}`;
          if (status === "START") {
            dispatch(addTyping(typing));
          } else {
            dispatch(removeTyping(typing));
          }

          if (typingTimeouts.current.has(key)) {
            clearTimeout(typingTimeouts.current.get(key));
          }

          const timeout = setTimeout(() => {
            dispatch(removeTyping(typing));
            typingTimeouts.current.delete(key);
          }, 10000);

          typingTimeouts.current.set(key, timeout);
        },
      );
    });
  }, [dispatch, rooms]);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        if (clientRef.current && clientRef.current.connected) return;

        console.warn("Reconnecting WebSocket");

        await fetchCsrfToken();

        if (clientRef.current) {
          clientRef.current.deactivate().then(() => {
            clientRef.current?.activate();
          });
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchCsrfToken]);

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

  function sendTyping(
    reference: string,
    username: string,
    status: TypingStatus,
  ) {
    if (status === "START") {
      debouncedTypingRef.current?.(reference, username, status);
    } else {
      // STOP should be instant
      const client = clientRef.current;
      if (!client) return;

      client?.publish({
        destination: "/app/chat.typing",
        body: JSON.stringify({ roomRef: reference, username, status }),
      });
    }
  }

  return (
    <WebSocketContext.Provider
      value={{
        socket: clientRef,
        sendPrivateMessage,
        postGroup,
        sendGroupMessage,
        sendTyping,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export default WebSocketProvider;
