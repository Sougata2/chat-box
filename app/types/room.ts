import { Media } from "./media";
import { User } from "./user";

export interface Room {
  id: number | null;
  roomType: string | null;
  referenceNumber: string | null;
  groupName: string | null;
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
  media: Media[];
  createdAt: Date | null;
  updatedAt: Date | null;
  senderEmail: string | null;
  senderFirstName: string | null;
  senderLastName: string | null;
}
