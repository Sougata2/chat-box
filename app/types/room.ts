import { User } from "./user";

export interface Room {
  id: number | null;
  referenceNumber: string | null;
  participants: User[];
  messages: Message[];
  createAt: Date;
  updateAt: Date;
}

export interface Message {
  id: number;
  uuid: string;
  message: string;
  sender: User;
  room: Room;
  createAt: Date;
  updateAt: Date;
  senderEmail: string | null;
}
