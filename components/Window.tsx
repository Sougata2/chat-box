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
import { v4 as uuidv4 } from "uuid";
import { GroupAvatar } from "./GroupAvatar";
import { zodResolver } from "@hookform/resolvers/zod";
import { toastError } from "./toastError";
import { TbChecks } from "react-icons/tb";
import { Textarea } from "./ui/textarea";
import { Message } from "@/app/types/room";
import { useForm } from "react-hook-form";
import { FiClock } from "react-icons/fi";
import { Button } from "./ui/button";
import { format } from "date-fns";
import { chat } from "@/app/clients/chatClient";
import { User } from "@/app/types/user";
import { z } from "zod";
import { PlusIcon } from "lucide-react";

const formSchema = z.object({
  message: z.string().nonempty(),
  room: z.object({
    referenceNumber: z.string(),
  }),
});

function Window() {
  const dispatch = useDispatch<AppDispatch>();
  const shouldPlaySendNoti = useRef(false);
  const sendAudioRef = useRef<HTMLAudioElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const room = useSelector((state: RootState) => state.chat.room);
  const user = useSelector((state: RootState) => state.user.user);

  const otherParticipant = room?.participants.find(
    (u: User) => u.email !== user?.email,
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
    } else {
      form.setValue("room.referenceNumber", "");
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
        uuid: uuidv4(),
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
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = "44px";
        }
      });
    } catch (error) {
      toastError(error);
    }
  }

  return (
    <div
      className="
        grid grid-rows-[auto_1fr_auto]
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

      <div
        className="
          overflow-y-auto flex flex-col-reverse
          min-h-0
          py-2.5 px-5
          scrollbar-hide gap-5
        "
      >
        {room?.uuids.map((uuid: string, index: number) => {
          const msg = room.messages[uuid];
          const isMe = msg.sender.email === user?.email;

          let showDateBar: boolean = false;

          const currentUUID = room?.uuids[index];
          const currentCreatedAt = room.messages[currentUUID].createdAt;
          let currentDate = format(
            new Date(currentCreatedAt ?? new Date()),
            "dd-MM-yyyy",
          );

          const previouseUUID =
            room.uuids[index === room.uuids.length - 1 ? index : index + 1];
          const previousCreatedAt = room.messages[previouseUUID].createdAt;
          const previousDate = format(
            new Date(previousCreatedAt ?? new Date()),
            "dd-MM-yyyy",
          );

          if (currentDate !== previousDate) {
            showDateBar = true;
          }

          currentDate =
            currentDate === format(new Date(), "dd-MM-yyyy")
              ? "Today"
              : currentDate;

          return (
            <div key={msg.uuid}>
              {showDateBar && (
                <div
                  className="
                    flex
                    py-8
                    justify-center
                  "
                >
                  <div
                    className="
                      w-fit
                      px-3
                      font-bold text-slate-500
                      bg-white
                      rounded-2xl border border-slate-100
                      shadow-md
                    "
                  >
                    {currentDate}
                  </div>
                </div>
              )}
              <div
                className={`
                  flex
                  ${isMe ? "justify-end" : "justify-start"}
                `}
              >
                <div
                  className={`
                    grid grid-cols-[minmax(0,1fr)_auto]
                    min-w-0 max-w-md
                    p-2
                    rounded-lg border
                    items-end gap-x-2 wrap-anywhere [word-break:break-word]
                    ${isMe ? "bg-emerald-200 text-emerald-800" : "bg-white"}
                  `}
                >
                  <div
                    className="
                      flex flex-col
                    "
                  >
                    {!isMe && (
                      <div
                        className={`
                          h-3
                          text-xs font-semibold
                          -translate-y-1 capitalize
                          ${getNameColor(msg.sender.firstName.toLowerCase())}
                        `}
                      >
                        {msg.sender.firstName} {msg.sender.lastName}
                      </div>
                    )}
                    <div
                      className="
                        max-w-full
                        whitespace-pre-wrap
                      "
                    >
                      {msg.message}
                    </div>

                    <div
                      className="
                        flex
                        h-2.5
                        justify-end
                      "
                    >
                      <div
                        className="
                          flex
                          text-[11px] text-slate-600
                          items-center gap-1 translate-y-1 translate-x-2
                        "
                      >
                        {format(
                          msg?.createdAt
                            ? new Date(msg?.createdAt)
                            : new Date(),
                          "hh:mm aaa",
                        )}
                        {!msg?.createdAt && <FiClock size={11} />}
                        {isMe && msg?.createdAt && (
                          <TbChecks
                            size={20}
                            className="
                              text-emerald-700
                            "
                          />
                        )}
                      </div>
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
          <div
            className="
              flex
              px-3 pb-2
              bg-white
              rounded-2xl border border-slate-300
              items-end gap-2
            "
          >
            {/* TEXTAREA WRAPPER */}
            <div
              className="
                flex-1 flex
                items-end
              "
            >
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => {
                  const { ref, ...rest } = field;
                  return (
                    <FormItem
                      className="
                        w-full
                      "
                    >
                      <FormControl>
                        <Textarea
                          ref={(el) => {
                            ref(el);
                            textareaRef.current = el;
                          }}
                          placeholder="Type a message"
                          rows={1}
                          onInput={(e) => {
                            const el = e.currentTarget;
                            el.style.height = "44px";
                            if (Number(el.style.height) > 44) {
                              el.style.marginTop = "0px";
                            }
                            el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              form.handleSubmit(onSubmit)();
                            }
                          }}
                          className="
                            overflow-y-auto
                            min-h-11 max-h-40
                            mt-1! px-3 py-2.5
                            text-[17px]! font-medium! leading-6 whitespace-pre-wrap
                            border-none
                            resize-none shadow-none
                            focus-visible:ring-0 focus-visible:ring-offset-0 wrap-break-word placeholder:font-semibold placeholder:text-md
                          "
                          {...rest}
                        />
                      </FormControl>
                    </FormItem>
                  );
                }}
              />
            </div>

            {/* SEND BUTTON */}
            <Button
              type="submit"
              size="icon-lg"
              className="
                bg-emerald-500
                rounded-full
                shrink-0 self-end hover:bg-emerald-600
              "
            >
              <AiOutlineSend
                size={20}
                className="
                  text-white
                "
              />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default Window;
