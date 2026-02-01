"use client";

import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/app/store/store";
import { Page, PageLocator } from "@/app/types/page";
import { GroupAvatar } from "./GroupAvatar";
import { stackPage } from "@/app/store/pageSlice";
import { useEffect } from "react";
import { User } from "@/app/types/user";

import PageRenderer from "./PageRenderer";

function Window() {
  const dispatch = useDispatch<AppDispatch>();

  const room = useSelector((state: RootState) => state.chat.room);
  const user = useSelector((state: RootState) => state.user.user);

  const otherParticipant = room?.participants.find(
    (u: User) => u.email !== user?.email,
  );

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
      <div
        className="
          flex
          h-16
          px-4
          bg-white
          rounded-lg border border-slate-300
          items-center gap-3
        "
      >
        {room?.groupName && <GroupAvatar />}
        {!room?.groupName && (
          <Avatar
            className="
              h-10 w-10
            "
          >
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>
              {otherParticipant?.firstName?.[0]}
              {otherParticipant?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
        )}

        <div
          className="
            flex flex-col
          "
        >
          {room?.groupName && (
            <span
              className="
                text-slate-700 font-medium
                capitalize
              "
            >
              {room?.groupName}
            </span>
          )}
          {!room?.groupName && (
            <span
              className="
                text-slate-700 font-medium
                capitalize
              "
            >
              {otherParticipant?.firstName} {otherParticipant?.lastName}
            </span>
          )}
          {room?.groupName && (
            <span
              className="
                text-xs text-slate-500
              "
            >
              {room?.participants
                .map((p) => `${p.firstName} ${p.lastName}`)
                .join(", ")}
            </span>
          )}
          {!room?.groupName && (
            <span
              className="
                text-xs text-slate-500
              "
            >
              online
            </span>
          )}
        </div>
      </div>

      <PageRenderer stack="media" />
    </div>
  );
}

export default Window;
