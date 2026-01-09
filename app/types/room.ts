import { User } from "./user";

export interface Room {
  id: number | null;
  referenceNumber: string;
  participants: User[];
  uuids: string[];
  messages: Record<string, Message>;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface Message {
  id: number | null;
  uuid: string;
  message: string;
  sender: User;
  room: Room;
  createdAt: Date | null;
  updatedAt: Date | null;
  senderEmail: string | null;
}
