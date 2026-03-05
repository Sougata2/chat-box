import { Client } from "@stomp/stompjs";

export type Status =
  | "DELIVERED"
  | "NOT_DELIVERED"
  | "NOT_SENT"
  | "READ"
  | "SENT";

export type Media = "AUDIO" | "FILE" | "IMAGE" | "TEXT" | "VIDEO";

export type User = {
  id: number | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
};

export type Type = "PRIVATE" | "GROUP";

export type Message = {
  message: string | null;
  uuid: string | null;
  status: Status | null;
  media: Media | null;
  roomRef: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  senderId: number | null;
  senderEmail: string | null;
  senderFirstName: string | null;
  senderLastName: string | null;
};

export type Room = {
  referenceNumber: string;
  type: Type;
  name: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  participants: number[] | null;
  lastMessage: Message | null;
};

export type RoomMap = {
  uuids: string[];
  rooms: Record<string, Room>;
};

export type MessageMap = {
  uuids: string[];
  messages: Record<string, Message>;
};

export type WebSocketContextType = {
  socket: React.RefObject<Client | null>;
  sendPrivateMessage: (recipient: string, message: Message) => void;
};
