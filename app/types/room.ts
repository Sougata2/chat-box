import { User } from "./user";

export interface Room {
  id: number | null;
  referenceNumber: string | null;
  participants: User[];
  messages: Message[] | null;
  createAt: Date;
  updateAt: Date;
  latestMessage: string | null;
  latestMessageSenderEmail: string | null;
  otherParticipantFirstName: string | null;
  otherParticipantLastName: string | null;
  latestMessageSentAt: Date | null;
  latestMessageUpdatedAt: Date | null;
}

export interface Message {
  id: number;
  message: string;
  sender: User;
  room: Room;
  createAt: Date;
  updateAt: Date;
}
