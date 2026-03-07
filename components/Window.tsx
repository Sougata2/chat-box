"use client";

import { Page, PageLocator } from "@/app/types/page";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/app/store/store";
import { useEffect } from "react";
import { stackPage } from "@/app/store/pageSlice";

import PageRenderer from "./PageRenderer";
import RoomDetails from "./RoomDetails";

function Window() {
  const dispatch = useDispatch<AppDispatch>();

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
