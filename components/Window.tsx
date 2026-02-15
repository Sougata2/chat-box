"use client";

import {
  DropdownMenuRadioGroup,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenu,
} from "@/components/ui/dropdown-menu";
import {
  CalendarPlusIcon,
  MoreVerticalIcon,
  ListFilterIcon,
  MailCheckIcon,
  ArchiveIcon,
  Trash2Icon,
  BellOff,
  TagIcon,
  Bell,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/app/store/store";
import { Page, PageLocator } from "@/app/types/page";
import { GroupAvatar } from "./GroupAvatar";
import { toastError } from "./toastError";
import { updateRoom } from "@/app/store/chatSlice";
import { stackPage } from "@/app/store/pageSlice";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { chat } from "@/app/clients/chatClient";
import { Room } from "@/app/types/room";
import { User } from "@/app/types/user";

import PageRenderer from "./PageRenderer";

function Window() {
  const dispatch = useDispatch<AppDispatch>();

  const room = useSelector((state: RootState) => state.chat.room);
  const user = useSelector((state: RootState) => state.user.user);
  const { presenceMap } = useSelector((state: RootState) => state.presence);

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

  async function muteRoom() {
    if (!user?.email) return;
    if (!room?.mutedParticipants) return;
    const mutedParticipants = [...room?.mutedParticipants];
    if (mutedParticipants?.includes(user?.email)) return;
    mutedParticipants?.push(user.email);
    const updatedRoom = { ...room, mutedParticipants } as Room;
    dispatch(updateRoom({ ...updatedRoom } as Room));
    try {
      chat.post(`/rooms/mute-room/${room.referenceNumber}`);
    } catch (error) {
      toastError(error);
    }
  }

  async function unmuteRoom() {
    if (!user?.email) return;
    if (!room?.mutedParticipants) return;
    const mutedParticipants = [...room?.mutedParticipants];
    const index = mutedParticipants?.indexOf(user.email);
    console.log(index);
    mutedParticipants?.splice(index, 1);
    const updatedRoom = { ...room, mutedParticipants };
    dispatch(updateRoom({ ...updatedRoom } as Room));
    try {
      chat.post(`/rooms/unmute-room/${room.referenceNumber}`);
    } catch (error) {
      toastError(error);
    }
  }

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
        className="flex justify-between px-4 items-center bg-white
          rounded-lg border border-slate-300"
      >
        <div
          className="
        flex
        h-16
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
                text-xs text-slate-500 lowercase
              "
              >
                {presenceMap[otherParticipant?.email ?? ""]?.status ===
                  "ONLINE" && <span className="text-emerald-500">● </span>}
                {presenceMap[otherParticipant?.email ?? ""]?.status ===
                "OFFLINE"
                  ? `last seen • ${format(
                      new Date(
                        presenceMap[otherParticipant?.email ?? ""]?.lastSeen,
                      ),
                      "hh:mm aaa (dd-MM-yy)",
                    )}`
                  : presenceMap[otherParticipant?.email ?? ""]?.status}
              </span>
            )}
          </div>
        </div>
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="More Options"
                className="rounded-full focus:ring-0 focus-visible:ring-0 focus:outline-none"
              >
                <MoreVerticalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <MailCheckIcon />
                  Mark as Read
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <ArchiveIcon />
                  Archive
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {user?.email && (
                  <>
                    {room?.mutedParticipants.includes(user?.email) ? (
                      <DropdownMenuItem onClick={unmuteRoom}>
                        <Bell />
                        Unmute Notification
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={muteRoom}>
                        <BellOff />
                        Mute Notification
                      </DropdownMenuItem>
                    )}
                  </>
                )}
                <DropdownMenuItem>
                  <CalendarPlusIcon />
                  Add to Calendar
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <ListFilterIcon />
                  Add to List
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <TagIcon />
                    Label As...
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup value={"label"}>
                      <DropdownMenuRadioItem value="personal">
                        Personal
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="work">
                        Work
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="other">
                        Other
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem variant="destructive">
                  <Trash2Icon />
                  Trash
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <PageRenderer stack="media" />
    </div>
  );
}

export default Window;
