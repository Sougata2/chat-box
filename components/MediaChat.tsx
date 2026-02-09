"use client";
import {
  DropdownMenu,
  DropdownMenuLabel,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem } from "./ui/form";
import { unShiftMessageOrRefreshPendingChat } from "@/app/store/chatSlice";
import React, { useContext, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/app/store/store";
import { MediaDispatchContext } from "@/app/contexts";
import { updateLatestMessage } from "@/app/store/roomSlice";
import { Page, PageLocator } from "@/app/types/page";
import { IoDocumentText } from "react-icons/io5";
import { AiOutlineSend } from "react-icons/ai";
import { v4 as uuidv4 } from "uuid";
import { zodResolver } from "@hookform/resolvers/zod";
import { toastError } from "./toastError";
import { stackPage } from "@/app/store/pageSlice";
import { FaImages } from "react-icons/fa6";
import { Textarea } from "./ui/textarea";
import { Message } from "@/app/types/room";
import { useForm } from "react-hook-form";
import { Button } from "./ui/button";
import { FaPlus } from "react-icons/fa6";
import { format } from "date-fns";
import { Input } from "./ui/input";
import { toast } from "sonner";
import { chat } from "@/app/clients/chatClient";
import { z } from "zod";

import MessageBubble from "./ChatBubble";
import MediaBubble from "./MediaBubble";
import GifPicker from "./GifPicker";
import { MdGifBox } from "react-icons/md";

const formSchema = z.object({
  message: z.string().nonempty(),
  room: z.object({
    referenceNumber: z.string(),
  }),
});

function MediaChat() {
  const dispatch = useDispatch<AppDispatch>();
  const setMediaFiles = useContext(MediaDispatchContext);

  const sendAudioRef = useRef<HTMLAudioElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const shouldPlaySendNoti = useRef(false);

  const room = useSelector((state: RootState) => state.chat.room);
  const user = useSelector((state: RootState) => state.user.user);

  const [gifOpen, setGifOpen] = useState(false);

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
        type: "MESSAGE",
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

  function fileInputOnChangeHandler(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length <= 0) {
      toast.warning("No File Uploaded");
      return;
    }

    const files = input.files as FileList;

    if (setMediaFiles) {
      setMediaFiles(files);
    }

    dispatch(
      stackPage({
        stack: "media",
        page: {
          name: "mediaUpload",
          closeable: true,
          import: "@/components/MediaUpload",
        } as Page,
      } as PageLocator),
    );
  }

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = e.clipboardData?.items;
    if (!items) return;

    const files: File[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      // check for images
      if (item.type.startsWith("image")) {
        const file = item.getAsFile();
        if (file) files.push(file);
      }

      if (files.length === 0) return;

      // stop image from being pasted as base64 text
      e.preventDefault();

      // convert to FileList-like structure
      const dt = new DataTransfer();
      files.forEach((f) => dt.items.add(f));

      if (setMediaFiles) {
        setMediaFiles(dt.files);
      }

      // open the Media upload.
      dispatch(
        stackPage({
          stack: "media",
          page: {
            name: "mediaUpload",
            closeable: true,
            import: "@/components/MediaUpload",
          } as Page,
        } as PageLocator),
      );
    }
  }

  const handleGifSend = async (file: File) => {
    setGifOpen(false);

    // 👇 SAME as image/video upload in your system
    const dt = new DataTransfer();
    dt.items.add(file);
    const files = dt.files;

    if (setMediaFiles) {
      setMediaFiles(files); // your existing uploader
    }
    // open the Media upload.
    dispatch(
      stackPage({
        stack: "media",
        page: {
          name: "mediaUpload",
          closeable: true,
          import: "@/components/MediaUpload",
        } as Page,
      } as PageLocator),
    );
  };

  return (
    <div
      className="
        grid grid-rows-[1fr_auto] h-full min-h-0 gap-2
      "
    >
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
              {/* DATE-BAR */}
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
              {/* MESSAGE-BLOCK */}
              {msg.type === "MESSAGE" && (
                <MessageBubble isMe={isMe} msg={msg} />
              )}
              {msg.type === "MEDIA" && (
                <MediaBubble isMe={isMe} media={msg.media} msg={msg} />
              )}
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
              items-end gap-1
            "
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  size="icon-lg"
                  className="
                    bg-white
                    rounded-full
                    shrink-0 self-end hover:bg-slate-200 focus-visible:ring-0 focus-visible:ring-offset-0
                  "
                >
                  <FaPlus
                    size={20}
                    className="
                      text-slate-900
                    "
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>
                  <label
                    htmlFor="image-upload"
                    className="
                      flex
                      px-3 py-2
                      text-sm text-slate-800
                      rounded-md
                      cursor-pointer
                      items-center gap-2 hover:bg-slate-200
                    "
                  >
                    <FaImages
                      className="
                        w-4 h-4
                      "
                    />
                    <span>Image & Photos</span>
                  </label>
                  <Input
                    type="file"
                    id="image-upload"
                    onChange={fileInputOnChangeHandler}
                    accept=".jpg,.jpeg,.png,.gif,.webp,.bmp"
                    className="
                      hidden
                    "
                  />
                </DropdownMenuLabel>
                <DropdownMenuLabel>
                  <label
                    htmlFor="document-upload"
                    className="
                      flex
                      px-3 py-2
                      text-sm text-slate-800
                      rounded-md
                      cursor-pointer
                      items-center gap-2 hover:bg-slate-200
                    "
                  >
                    <IoDocumentText
                      className="
                        w-4 h-4
                      "
                    />
                    <span>Document</span>
                  </label>
                  <Input
                    type="file"
                    id="document-upload"
                    onChange={fileInputOnChangeHandler}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf,.odt"
                    className="
                      hidden
                    "
                  />
                </DropdownMenuLabel>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="relative flex items-center gap-2">
              <button onClick={() => setGifOpen(!gifOpen)}>
                <MdGifBox size={40} className="text-slate-400" />
              </button>

              {gifOpen && (
                <div className="absolute bottom-14 left-0 z-50">
                  <GifPicker onSelect={handleGifSend} />
                </div>
              )}
            </div>
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
                          onPaste={handlePaste}
                          {...rest}
                          className="
                            overflow-y-auto
                            min-h-11 max-h-40
                            mt-1! px-3 py-2.5
                            text-[17px]! font-medium! leading-6 whitespace-pre-wrap
                            border-none
                            resize-none shadow-none
                            focus-visible:ring-0 focus-visible:ring-offset-0 wrap-break-word placeholder:font-semibold placeholder:text-md
                          "
                        />
                      </FormControl>
                    </FormItem>
                  );
                }}
              />
            </div>

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

export default MediaChat;
