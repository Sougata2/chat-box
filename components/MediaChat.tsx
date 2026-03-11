"use client";
import {
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenu,
} from "@/components/ui/dropdown-menu";
import { useContext, useEffect, useRef, useState } from "react";
import { Form, FormControl, FormField, FormItem } from "./ui/form";
import { Media, Message, Room, User } from "@/types/types";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/app/store/store";
import { addRoom, refreshRooms } from "@/app/store/roomSlice";
import { setMessage, saveRoom } from "@/app/store/chatSlice";
import { FileDispatchContext } from "@/app/contexts";
import { Page, PageLocator } from "@/app/types/page";
import { messageSelectors } from "@/app/store/adapter/messageAdapter";
import { IoDocumentText } from "react-icons/io5";
import { AiOutlineSend } from "react-icons/ai";
import { useWebsocket } from "@/hooks/useWebsocket";
import { v4 as uuidv4 } from "uuid";
import { zodResolver } from "@hookform/resolvers/zod";
import { toastError } from "./toastError";
import { stackPage } from "@/app/store/pageSlice";
import { FaImages } from "react-icons/fa6";
import { Textarea } from "./ui/textarea";
import { MdGifBox } from "react-icons/md";
import { message } from "@/app/clients/messageClient";
import { useForm } from "react-hook-form";
import { Button } from "./ui/button";
import { FaPlus } from "react-icons/fa6";
import { format } from "date-fns";
import { Input } from "./ui/input";
import { toast } from "sonner";
import { z } from "zod";

import MessageBubble from "./ChatBubble";
import MediaBubble from "./MediaBubble";
import GifPicker from "./GifPicker";
import React from "react";

const formSchema = z.object({
  message: z.string().nonempty(),
  room: z.object({
    referenceNumber: z.string(),
  }),
});

function MediaChat() {
  const websocket = useWebsocket();
  const setFilesToContext = useContext(FileDispatchContext);
  const dispatch = useDispatch<AppDispatch>();

  const shouldAutoScroll = useRef(true);
  const shouldPlaySendNoti = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const sendAudioRef = useRef<HTMLAudioElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  const messages = useSelector(messageSelectors.selectAll);
  const user = useSelector((state: RootState) => state.user.user);
  const room = useSelector((state: RootState) => state.chat.room);
  const files = useSelector((state: RootState) => state.chat.files);

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

  const scrollToBottom = () => {
    const el = chatContainerRef.current;
    if (!el) return;

    el.scrollTop = el.scrollHeight;
  };

  const handleScroll = () => {
    const el = chatContainerRef.current;
    if (!el) return;

    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    shouldAutoScroll.current = nearBottom;
  };

  useEffect(() => {
    if (shouldAutoScroll.current) {
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    }
  }, [messages]);

  useEffect(() => {
    sendAudioRef.current = new Audio("/sent.mp3");
  }, []);

  useEffect(() => {
    if (sendAudioRef.current && shouldPlaySendNoti.current) {
      sendAudioRef.current.currentTime = 0; // replay instantly
      sendAudioRef.current.play().catch(() => {});
      shouldPlaySendNoti.current = false;
    }
  }, []);

  function fileInputOnChangeHandler(
    event: React.ChangeEvent<HTMLInputElement>,
    media: Media,
  ) {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length <= 0) {
      toast.warning("No File Uploaded");
      return;
    }

    const files = input.files as FileList;

    if (setFilesToContext) {
      setFilesToContext(files);
    }

    dispatch(
      stackPage({
        stack: "media",
        page: {
          name: "mediaUpload",
          closeable: true,
          import: "@/components/MediaUpload",
          props: {
            media,
          },
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

      if (setFilesToContext) {
        setFilesToContext(dt.files);
      }

      // open the Media upload.
      dispatch(
        stackPage({
          stack: "media",
          page: {
            name: "mediaUpload",
            closeable: true,
            import: "@/components/MediaUpload",
            props: { media: "IMAGE" },
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

    if (setFilesToContext) {
      setFilesToContext(files); // your existing uploader
    }
    // open the Media upload.
    dispatch(
      stackPage({
        stack: "media",
        page: {
          name: "mediaUpload",
          closeable: true,
          import: "@/components/MediaUpload",
          props: { media: "IMAGE" },
        } as Page,
      } as PageLocator),
    );
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      if (!room?.referenceNumber) return;

      let messagePayload = {
        message: values.message,
        uuid: uuidv4(),
        status: "NOT_SENT",
        media: "TEXT",
        roomRef: room?.referenceNumber,
        senderId: user?.id,
        senderEmail: user?.email,
        senderFirstName: user?.firstName,
        senderLastName: user?.lastName,
        createdAt: new Date().toISOString(),
      } as Message;

      shouldPlaySendNoti.current = true;

      if (room?.type === "GROUP") {
        // put the message payload in the window
        dispatch(setMessage(messagePayload));

        // update the room list to register the new message.
        dispatch(refreshRooms(messagePayload));

        websocket.sendGroupMessage(room.referenceNumber, messagePayload);

        form.setValue("message", "");
        requestAnimationFrame(() => {
          if (textareaRef.current) {
            textareaRef.current.style.height = "44px";
          }
        });
      } else {
        let recipient;

        if (room && !room?.referenceNumber) {
          // save the new room.
          const newRoomResponse = await message.post("/rooms/new-private", {
            ...room,
            referenceNumber: uuidv4(),
          });
          const newRoomData = newRoomResponse.data as Room;

          // update the current room
          dispatch(saveRoom(newRoomData));

          // add the new room in the room list.
          dispatch(addRoom(newRoomData));

          // set the recipient after room creation
          recipient = newRoomData.participants?.find((p) => p.id !== user?.id);

          // prepare the messsage payload
          messagePayload = {
            message: values.message,
            uuid: uuidv4(),
            status: "NOT_SENT",
            media: "TEXT",
            roomRef: newRoomResponse.data.referenceNumber,
            senderId: user?.id,
            senderEmail: user?.email,
            senderFirstName: user?.firstName,
            senderLastName: user?.lastName,
            createdAt: new Date().toISOString(),
          } as Message;
        }

        // put the message payload in the window
        dispatch(setMessage(messagePayload));

        // update the room list to register the new message.
        dispatch(refreshRooms(messagePayload));

        // set the recipient for existing room.
        if (!room?.participants) return;
        recipient = room?.participants.find((p) => p.id !== user?.id) as User;

        // send the message
        if (!recipient.email) return;
        websocket.sendPrivateMessage(recipient.email, messagePayload);
        // update the message (in the socket)

        form.setValue("message", "");
        requestAnimationFrame(() => {
          if (textareaRef.current) {
            textareaRef.current.style.height = "44px";
          }
        });
      }
    } catch (error) {
      toastError(error);
    }
  }

  return (
    <div
      className="
        grid grid-rows-[1fr_auto] h-full min-h-0 gap-2
      "
    >
      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="
          overflow-y-auto flex flex-col
          min-h-0
          py-2.5 px-5
          scrollbar-hide gap-5
        "
      >
        {messages.map((message: Message, index: number) => {
          const isMe = message.senderId === user?.id;

          let showDateBar: boolean = false;

          const currentCreatedAt = message.createdAt;
          let currentDate = format(
            new Date(currentCreatedAt ?? new Date()),
            "dd-MM-yyyy",
          );

          const previousMessage = messages[index - 1];
          let previousDate: string | null = null;

          if (previousMessage?.createdAt) {
            previousDate = format(
              new Date(previousMessage.createdAt),
              "dd-MM-yyyy",
            );
          }

          if (!previousDate || currentDate !== previousDate) {
            showDateBar = true;
          }

          currentDate =
            currentDate === format(new Date(), "dd-MM-yyyy")
              ? "Today"
              : currentDate;

          return (
            <div key={message.uuid}>
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
              {message.media === "TEXT" && (
                <MessageBubble isMe={isMe} msg={message} />
              )}
              {message.media === "IMAGE" && (
                <MediaBubble
                  isMe={isMe}
                  files={files[message.uuid]}
                  msg={message}
                />
                // <div>Image</div>
              )}
              {message.media === "DOCUMENT" && (
                // <MediaBubble isMe={isMe} media={} msg={msg} />
                <div>Document</div>
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
                    onChange={(e) => fileInputOnChangeHandler(e, "IMAGE")}
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
                    onChange={(e) => fileInputOnChangeHandler(e, "DOCUMENT")}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf,.odt"
                    className="
                      hidden
                    "
                  />
                </DropdownMenuLabel>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="relative flex items-center gap-2">
              <button onClick={() => setGifOpen(!gifOpen)} type="button">
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
