import { Client } from "@stomp/stompjs";

export type Status =
  | "DELIVERED"
  | "NOT_DELIVERED"
  | "NOT_SENT"
  | "READ"
  | "SENT";

export type Media = "AUDIO" | "DOCUMENT" | "IMAGE" | "TEXT" | "VIDEO";

export type User = {
  id: number | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
};

export type Type = "PRIVATE" | "GROUP";

export type FileStatus = "UPLOADED" | "ATTACHED" | "ORPHANED";

export type Message = {
  message: string | null;
  uuid: string;
  status: Status | null;
  media: Media | null;
  roomRef: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  senderId: number | null;
  senderEmail: string | null;
  senderFirstName: string | null;
  senderLastName: string | null;
  fileIds: number[];
};

export type Room = {
  referenceNumber?: string;
  type: Type;
  name: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  participants: User[] | null;
  lastMessage: Message | null;
};

export type File = {
  id?: number;
  url?: string;
  originalName?: string;
  size?: number;
  mimeType?: string;
  status?: FileStatus;
  createdAt?: string;
  updatedAt?: string;
  messageUUID?: string;
};

export type WebSocketContextType = {
  socket: React.RefObject<Client | null>;
  sendPrivateMessage: (recipient: string, message: Message) => void;
  postGroup: (room: Room) => void;
  sendGroupMessage: (reference: string, message: Message) => void;
};
