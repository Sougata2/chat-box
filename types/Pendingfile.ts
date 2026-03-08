export type PendingFile = {
  file: File;
  previewUrl: string;
  uploaded: {
    id: number;
    url: string;
    mimeType: string;
  };
};
