"use client";

import { useDispatch, useSelector } from "react-redux";
import { useCallback, useEffect } from "react";
import { AppDispatch, RootState } from "@/app/store/store";
import { setFiles, setMessages } from "@/app/store/chatSlice";
import { Page, PageLocator } from "@/app/types/page";
import { File as ChatFile } from "@/types/types";
import { toastError } from "./toastError";
import { stackPage } from "@/app/store/pageSlice";
import { message } from "@/app/clients/messageClient";

import PageRenderer from "./PageRenderer";
import RoomDetails from "./RoomDetails";

function Window() {
  const dispatch = useDispatch<AppDispatch>();

  const room = useSelector((state: RootState) => state.chat.room);

  const fetchMessages = useCallback(async () => {
    try {
      const response = await message.get(
        `/messages/room/${room?.referenceNumber}`,
      );
      dispatch(setMessages(response.data));
    } catch (error) {
      toastError(error);
    }
  }, [dispatch, room]);

  const fetchFiles = useCallback(async () => {
    try {
      const response = await message.get(
        `/files/room/${room?.referenceNumber}`,
      );
      const files = response.data as ChatFile[];
      dispatch(setFiles(files));
    } catch (error) {
      toastError(error);
    }
  }, [dispatch, room]);

  useEffect(() => {
    if (room?.referenceNumber) {
      (async () => {
        await fetchMessages();
        await fetchFiles();
      })();
    }
  }, [fetchFiles, fetchMessages, room?.referenceNumber]);

  useEffect(() => {
    dispatch(
      stackPage({
        stack: "media",
        page: { name: "mediaChat", import: "@/component/MediaChat" } as Page,
      } as PageLocator),
    );
  }, [dispatch]);

  return (
    <div
      className="
        grid grid-rows-[auto_1fr]
        h-full min-h-0
        rounded-2xl
        gap-2
      "
    >
      <RoomDetails />
      <PageRenderer stack="media" />
    </div>
  );
}

export default Window;
