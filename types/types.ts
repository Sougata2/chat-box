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
  id: number | null;
  message: string | null;
  uuid: string | null;
  status: Status | null;
  media: Media | null;
  room: string | null;
  createdAt: Room | null;
  updatedAt: string | null;
  senderId: number | null;
  senderEmail: string | null;
  senderFirstName: string | null;
  senderLastName: string | null;
};

export type Room = {
  id: number | null;
  referenceNumber: string | null;
  type: Type;
  groupName: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  participants: number[] | null;
  lastMessage: Message | null;
};
