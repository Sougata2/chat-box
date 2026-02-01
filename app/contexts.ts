import { createContext } from "react";

/*
Every time mediaFiles changes:
setMediaFiles(...)
➡ the entire context value object changes
➡ ALL consumers re-render
➡ even components that only need setFiles
*/

export const MediaContext = createContext<FileList | null>(null);
export const MediaDispatchContext = createContext<
  ((files: FileList | null) => void) | null
>(null);
