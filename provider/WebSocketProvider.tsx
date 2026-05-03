/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Room,
  Status,
  Message,
  TypingDto,
  PresenceDto,
  TypingStatus,
  IncomingMessage,
  WebSocketContextType,
} from "@/types/types";
import { createContext, useCallback, useEffect, useState, useRef } from "react";
import {
  addFiles,
  saveRoom,
  updateMessage,
  updateMessages,
} from "@/app/store/chatSlice";
import { AppDispatch, RootState, store } from "@/app/store/store";
import { addPresence, updatePresence } from "@/app/store/presenceSlice";
import { useDispatch, useSelector } from "react-redux";
import { addTyping, removeTyping } from "@/app/store/typingSlice";
import { addRoom, refreshRooms } from "@/app/store/roomSlice";
import { pendingMessageActions } from "@/app/store/pendingMessageSlice";
import { message as msgClient } from "@/app/clients/messageClient";
import type { DebouncedFunc } from "lodash";
import { setParticipants } from "@/app/store/participantSlice";
import { toastError } from "@/components/toastError";
import { CsrfData } from "@/app/types/CsrfData";
import { Client } from "@stomp/stompjs";
import { chat } from "@/app/clients/chatClient";

import debounce from "lodash.debounce";
import React from "react";
import { readReceiptActions } from "@/app/store/readReceiptSlice";

export const WebSocketContext = createContext<WebSocketContextType | null>(
  null,
);

const defaultCsrfData = {
  headerName: null,
  parameterName: null,
  token: null,
} as CsrfData;

const statusPriority: Record<Status, number> = {
  NOT_SENT: 0,
  SENT: 1,
  DELIVERED: 2,
  READ: 3,
};

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
  const pendingAcks = useRef<Map<string, Message>>(new Map());
  const ackTimeout = useRef<NodeJS.Timeout | null>(null);

  const rooms = useSelector((state: RootState) => state.rooms.entities);

  const [csrfData, setCsrfData] = useState<CsrfData>(defaultCsrfData);

  const sendAcknowledgement = useCallback(
    (message: Message, acknowledgedStatus: Status = "DELIVERED") => {
      if (!message.roomRef) return;

      const existing = pendingAcks.current.get(message.uuid);
      if (
        existing &&
        existing.status &&
        statusPriority[existing.status] >= statusPriority[acknowledgedStatus]
      ) {
        return;
      }

      const acknowledgedMessage = {
        ...message,
        status: acknowledgedStatus,
      } as Message;

      if (acknowledgedStatus === "DELIVERED")
        dispatch(pendingMessageActions.addOne(acknowledgedMessage));

      pendingAcks.current.set(message.uuid, acknowledgedMessage);

      if (ackTimeout.current) {
        clearTimeout(ackTimeout.current);
      }

      const timeout = setTimeout(() => {
        const payload = Array.from(pendingAcks.current.values()) as Message[];
        pendingAcks.current.clear();

        clientRef.current?.publish({
          destination: "/app/post.acknowledge",
          body: JSON.stringify({ acknowledgeableMessages: payload }),
        });

        ackTimeout.current = null;
      }, 2000);

      ackTimeout.current = timeout;
    },
    [dispatch],
  );

  const sendAcknowledgementImmediately = useCallback(
    (messages: Message[]) => {
      if (messages && messages.length === 0) return;
      const acknowledgedMessages = [] as Message[];
      const payload = messages.map((m) => {
        acknowledgedMessages.push({ ...m, status: "DELIVERED" });
        return {
          ...m,
          status: "DELIVERED",
        };
      }) as Message[];

      dispatch(pendingMessageActions.addMany(acknowledgedMessages));

      clientRef.current?.publish({
        destination: "/app/post.acknowledge",
        body: JSON.stringify({ acknowledgeableMessages: payload }),
      });
    },
    [dispatch],
  );

  const fetchCsrfToken = useCallback(async () => {
    try {
      const response = await chat.get("/csrf/token");
      setCsrfData({ ...response.data } as CsrfData);
    } catch (error) {
      toastError(error);
    }
  }, []);

  const fetchUnreadMessages = useCallback(async () => {
    try {
      const response = await msgClient.get("/messages/unread-messages");
      return response.data;
    } catch (error) {
      toastError(error);
    }
  }, []);
  const fetchUnDeliveredMessages = useCallback(async () => {
    try {
      const response = await msgClient.get("/messages//undelivered-messages");
      return response.data;
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
    const handleVisibilityChange = () => {
      const client = clientRef.current;
      if (!client?.connected) return;

      client.publish({
        destination: "/app/activity",
        body: JSON.stringify({
          active: document.visibilityState === "visible",
        }),
      });
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

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
      (async () => {
        const undeliveredMessages =
          (await fetchUnDeliveredMessages()) as Message[];
        const unreadMessages = (await fetchUnreadMessages()) as Message[];
        dispatch(pendingMessageActions.addMany(unreadMessages));
        sendAcknowledgementImmediately(undeliveredMessages);
      })();

      stompClient.subscribe("/user/queue/messages", (message) => {
        const incoming = JSON.parse(message.body) as IncomingMessage;
        if (!incoming.message.roomRef) return;
        const state = store.getState();
        const rooms = state.rooms.entities;
        const currentRoom = state.chat.room;

        if (rooms[incoming.message.roomRef]) {
          dispatch(refreshRooms(incoming.message));
        } else {
          msgClient
            .get(`/rooms/reference/${incoming.message.roomRef}`)
            .then((response) => {
              const newRoom = response.data as Room;
              dispatch(addRoom(newRoom));
              if (!newRoom.participants) return;
              dispatch(setParticipants(newRoom.participants));

              if (currentRoom?.referenceNumber === null) {
                // if same room open ,use it.
                const currentRoomParticipants = currentRoom.participants?.map(
                  (p) => p.email,
                );
                const newRoomParticipants = newRoom.participants?.map(
                  (p) => p.email,
                );
                const isSameRoom = newRoomParticipants?.some((p) =>
                  currentRoomParticipants?.includes(p),
                );
                if (isSameRoom) {
                  dispatch(saveRoom(newRoom));
                }
              }
            });
        }
        if (incoming.files) {
          dispatch(addFiles({ [incoming.message.uuid]: incoming.files }));
        }
        dispatch(updateMessage(incoming.message));

        if (incoming.message.status !== "READ") {
          dispatch(readReceiptActions.incrementCount(incoming.message));
          sendAcknowledgement(incoming.message);
        }
      });

      stompClient.subscribe("/user/queue/rooms", (message) => {
        // 1. get the new room information
        const room = JSON.parse(message.body) as Room;

        // 2. add the new room.
        dispatch(addRoom(room));

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

              if (incoming.message.status !== "READ") {
                sendAcknowledgement(incoming.message);
              }
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

        // send acknowledgement of the last message of the room
        if (!room.lastMessage) return;
        if (room.lastMessage?.senderEmail === signedUser?.email) return;
        if (room.lastMessage?.status !== "READ")
          sendAcknowledgement(room.lastMessage);
      });

      stompClient.subscribe("/user/queue/acknowledge", (message) => {
        const acknowledgedMessages = JSON.parse(message.body) as Message[];

        if (!acknowledgedMessages) return;
        if (acknowledgedMessages.length === 0) return;

        const currentRoom = store.getState().chat.room;
        const roomEntites = store.getState().rooms.entities;

        // update the rooms list
        acknowledgedMessages.forEach((ackmsg) => {
          if (!ackmsg.roomRef) return;
          const roomToUpdate = roomEntites[ackmsg.roomRef];
          const isLastMessage = roomToUpdate.lastMessage?.uuid === ackmsg.uuid;
          if (isLastMessage) {
            dispatch(refreshRooms(ackmsg));
          }
        });

        // create map of room -> message[]
        const map = acknowledgedMessages.reduce(
          (acc, curr) => {
            if (!curr.roomRef) return acc;
            if (!acc[curr.roomRef]) {
              acc[curr.roomRef] = [];
            }
            acc[curr.roomRef].push(curr);
            return acc;
          },
          {} as Record<string, Message[]>,
        );

        if (currentRoom?.referenceNumber && map[currentRoom.referenceNumber]) {
          const roomEntities = store.getState().rooms.entities;
          const lastMessage =
            roomEntities[currentRoom.referenceNumber].lastMessage;
          console.log(lastMessage);

          const currentRoomAcknowledgedMessages =
            map[currentRoom.referenceNumber];

          console.log(currentRoomAcknowledgedMessages);

          dispatch(updateMessages(currentRoomAcknowledgedMessages));
        }
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

              if (incoming.message.status !== "READ") {
                dispatch(readReceiptActions.incrementCount(incoming.message));
                sendAcknowledgement(incoming.message);
              }
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

      const activityInterval = setInterval(() => {
        if (!clientRef.current?.connected) return;
        console.log("Activity", document.visibilityState === "visible");
        clientRef.current.publish({
          destination: "/app/activity",
          body: JSON.stringify({
            active: document.visibilityState === "visible",
          }),
        });
      }, 30000);

      (stompClient as any).hbInterval = interval;
      (stompClient as any).activityInterval = activityInterval;
    };

    stompClient.activate();

    clientRef.current = stompClient;

    return () => {
      if ((stompClient as any).hbInterval) {
        clearInterval((stompClient as any).hbInterval);
      }
      if ((stompClient as any).activityInterval) {
        clearInterval((stompClient as any).activityInterval);
      }
      stompClient.deactivate();
    };
  }, [
    csrfData,
    dispatch,
    fetchUnreadMessages,
    sendAcknowledgement,
    fetchUnDeliveredMessages,
    sendAcknowledgementImmediately,
    token,
  ]);

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
        sendAcknowledgement,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export default WebSocketProvider;
