import { Message } from "./room";

export type PendingMedia = {
  file: File;
  previewUrl: string;
  uploaded: {
    id: number;
    url: string;
    mimeType: string;
  };
};

export type Media = {
  id?: number;
  url?: string;
  originalName?: string;
  size?: number;
  status?: string;
  message?: Message;
  mimeType?: string;
  createdAt: string;
  updatedAt: string;
};
