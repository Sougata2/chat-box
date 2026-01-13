"use client";

import { Form, FormControl, FormField, FormItem } from "./ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { unShiftMessageOrRefreshPendingChat } from "@/app/store/chatSlice";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/app/store/store";
import { updateLatestMessage } from "@/app/store/roomSlice";
import { useEffect, useRef } from "react";
import { AiOutlineSend } from "react-icons/ai";
import { getNameColor } from "@/lib/utils";
import { GroupAvatar } from "./GroupAvatar";
import { zodResolver } from "@hookform/resolvers/zod";
import { toastError } from "./toastError";
import { TbChecks } from "react-icons/tb";
import { Message } from "@/app/types/room";
import { useForm } from "react-hook-form";
import { FiClock } from "react-icons/fi";
import { Button } from "./ui/button";
import { format } from "date-fns";
import { Input } from "./ui/input";
import { chat } from "@/app/clients/chatClient";
import { User } from "@/app/types/user";
import { z } from "zod";

const formSchema = z.object({
  message: z.string(),
  room: z.object({
    referenceNumber: z.string(),
  }),
});

function Window() {
  const dispatch = useDispatch<AppDispatch>();
  const shouldPlaySendNoti = useRef(false);
  const sendAudioRef = useRef<HTMLAudioElement | null>(null);
  const room = useSelector((state: RootState) => state.chat.room);
  const user = useSelector((state: RootState) => state.user.user);

  const otherParticipant = room?.participants.find(
    (u: User) => u.email !== user?.email
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: "",
      room: {
        referenceNumber: "",
      },
    },
  });

  useEffect(() => {
    if (room?.referenceNumber) {
      form.setValue("room.referenceNumber", room.referenceNumber);
    }
  }, [form, room?.referenceNumber]);

  useEffect(() => {
    sendAudioRef.current = new Audio("/sent.mp3");
  }, []);

  useEffect(() => {
    if (sendAudioRef.current && shouldPlaySendNoti.current) {
      sendAudioRef.current.currentTime = 0; // replay instantly
      sendAudioRef.current.play().catch(() => {});
      shouldPlaySendNoti.current = false;
    }
  }, [room?.uuids.length]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const payload = {
        ...values,
        uuid: user?.id + Number(new Date()).toString(),
        sender: {
          email: user?.email,
        },
        senderEmail: user?.email,
      } as Message;

      dispatch(unShiftMessageOrRefreshPendingChat(payload));
      dispatch(updateLatestMessage(payload));
      shouldPlaySendNoti.current = true;
      if (room && !room?.id) {
        const newRoomPayload = { ...room, messages: [payload] };
        await chat.post("/rooms/new-chat", newRoomPayload);
      } else {
        await chat.post("/messages/send", payload);
      }
      form.setValue("message", "");
    } catch (error) {
      toastError(error);
    }
  }

  return (
    <div className="rounded-2xl h-full min-h-0 grid grid-rows-[auto_1fr_auto] gap-2">
      <div className="h-16 px-4 flex items-center gap-3 bg-white rounded-lg border border-slate-300">
        {room?.groupName && <GroupAvatar />}
        {!room?.groupName && (
          <Avatar className="h-10 w-10">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>
              {otherParticipant?.firstName?.[0]}
              {otherParticipant?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
        )}

        <div className="flex flex-col">
          {room?.groupName && (
            <span className="text-slate-700 font-medium capitalize">
              {room?.groupName}
            </span>
          )}
          {!room?.groupName && (
            <span className="text-slate-700 font-medium capitalize">
              {otherParticipant?.firstName} {otherParticipant?.lastName}
            </span>
          )}
          {room?.groupName && (
            <span className="text-xs text-slate-500">
              {room?.participants
                .map((p) => `${p.firstName} ${p.lastName}`)
                .join(", ")}
            </span>
          )}
          {!room?.groupName && (
            <span className="text-xs text-slate-500">online</span>
          )}
        </div>
      </div>

      <div className="min-h-0 overflow-y-auto scrollbar-hide flex flex-col-reverse gap-5 py-2.5 px-5">
        {room?.uuids.map((uuid: string) => {
          const msg = room.messages[uuid];
          const isMe = msg.sender.email === user?.email;
          return (
            <div
              key={msg.uuid}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`inline-grid shrink-0 min-w-30 max-w-md rounded-lg border p-2 grid-cols-[1fr_auto] items-end gap-x-2 
                  ${isMe ? "bg-emerald-200 text-emerald-800" : "bg-white"}
                  `}
              >
                <div className="flex flex-col">
                  {!isMe && (
                    <div
                      className={`text-xs font-semibold ${getNameColor(
                        msg.sender.firstName.toLowerCase()
                      )} h-3 -translate-y-1 capitalize`}
                    >
                      {msg.sender.firstName} {msg.sender.lastName}
                    </div>
                  )}
                  <div className="wrap-break-word">{msg.message}</div>

                  <div className="flex justify-end h-2.5">
                    <div className="flex items-center gap-1 text-[11px] text-slate-600 translate-y-1 translate-x-2">
                      {format(
                        msg?.createdAt ? new Date(msg?.createdAt) : new Date(),
                        "hh:mm aaa"
                      )}
                      {!msg?.createdAt && <FiClock size={11} />}
                      {isMe && msg?.createdAt && (
                        <TbChecks className="text-emerald-700" size={20} />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Form {...form}>
        <form onSubmit={(e) => form.handleSubmit(onSubmit)(e)}>
          <div className="bg-white rounded-lg border border-slate-300 grid grid-cols-[1fr_auto] gap-3.5 items-center px-4">
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      autoComplete="off"
                      placeholder="Type a message"
                      className="h-12 text-base! placeholder:font-medium border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button variant="outline" className="w-14">
              <AiOutlineSend size={20} className="text-emerald-500" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default Window;
