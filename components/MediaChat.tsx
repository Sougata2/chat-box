"use client";
import {
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenu,
} from "@/components/ui/dropdown-menu";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Form, FormControl, FormField, FormItem } from "./ui/form";
import { setMessage, saveRoom, updateMessage } from "@/app/store/chatSlice";
import { Media, Message, Receipt, Room, User } from "@/types/types";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/app/store/store";
import { addRoom, refreshRooms } from "@/app/store/roomSlice";
import { FileDispatchContext } from "@/app/contexts";
import { Page, PageLocator } from "@/app/types/page";
import { messageSelectors } from "@/app/store/adapter/messageAdapter";
import { FaImages, FaLock } from "react-icons/fa6";
import { IoDocumentText } from "react-icons/io5";
import { AiOutlineSend } from "react-icons/ai";
import { useWebsocket } from "@/hooks/useWebsocket";
import { v4 as uuidv4 } from "uuid";
import { zodResolver } from "@hookform/resolvers/zod";
import { toastError } from "./toastError";
import { stackPage } from "@/app/store/pageSlice";
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

import TypingIndicator from "./TypingIndicator";
import MessageBubble from "./ChatBubble";
import MediaBubble from "./MediaBubble";
import GifPicker from "./GifPicker";
import React from "react";
import { pendingMessageActions } from "@/app/store/pendingMessageSlice";
import { readReceiptActions } from "@/app/store/readReceiptSlice";

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
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingMessages = useRef<Map<string, Message>>(new Map());
  const pendingMsgTimeout = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);
  const isUserAtBottom = useRef(true);
  const unreadStampRef = useRef<HTMLDivElement | null>(null);
  const hasScrolledToUnread = useRef(false);

  const messages = useSelector(messageSelectors.selectAll);
  const messageEntities = useSelector(
    (state: RootState) => state.chat.messages.entities,
  );
  const user = useSelector((state: RootState) => state.user.user);
  const room = useSelector((state: RootState) => state.chat.room);
  const roomMap = useSelector((state: RootState) => state.rooms.entities);
  const files = useSelector((state: RootState) => state.chat.files);
  const readReceiptMap = useSelector(
    (state: RootState) => state.readReceipt.receiptMap,
  );
  const typing = useSelector((state: RootState) => state.typing.typingMap);
  const pendingMessageRoomMap = useSelector(
    (state: RootState) => state.pendingMessages.roomMessageMap,
  );

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

    const threshold = 80;

    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;

    const atBottom = distance <= threshold;

    shouldAutoScroll.current = atBottom;
    isUserAtBottom.current = atBottom;

    if (room?.referenceNumber) {
      if (atBottom) {
        dispatch(readReceiptActions.setAtBottom(room));
      } else {
        dispatch(readReceiptActions.setNotAtBottom(room));
      }
    }
  };

  const flushPendingChat = useCallback(
    (message: Message) => {
      try {
        pendingMessages.current.set(message.uuid, message);
        if (pendingMsgTimeout.current) {
          clearTimeout(pendingMsgTimeout.current);
        }

        pendingMsgTimeout.current = setTimeout(() => {
          const flushableMessages = Array.from(pendingMessages.current.keys());
          pendingMessages.current.clear();
          dispatch(pendingMessageActions.removeAll(flushableMessages));
          pendingMsgTimeout.current = null;
        }, 1000);
      } catch (error) {
        toastError(error);
      }
    },
    [dispatch],
  );

  const resolveLastSeen = useCallback(async () => {
    if (room && room.referenceNumber) {
      const revisedRoom = roomMap[room.referenceNumber];
      const pndingMsgs = pendingMessageRoomMap[room.referenceNumber];
      if (pndingMsgs && pndingMsgs.length > 0) {
        const response = await message.get(
          `/messages/read-receipt/${revisedRoom.referenceNumber}`,
        );
        const receipt = response.data as Receipt;
        if (receipt.lastSeen) {
          dispatch(
            readReceiptActions.setLastSeen({
              lastSeen: receipt.lastSeen,
              count: pndingMsgs.length,
              roomRef: room.referenceNumber,
            }),
          );
        }
      } else {
        // clear the counter.
        dispatch(readReceiptActions.clearCount(revisedRoom));
      }
    }
  }, [dispatch, pendingMessageRoomMap, room, roomMap]);

  useEffect(() => {
    const handleVisibility = () => {
      if (room && room.referenceNumber) {
        const revisedRoom = roomMap[room.referenceNumber];

        if (document.visibilityState === "visible") {
          dispatch(readReceiptActions.setActive(revisedRoom));
        }
        if (document.visibilityState === "hidden") {
          resolveLastSeen();
          dispatch(readReceiptActions.setInactive(revisedRoom));
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [dispatch, resolveLastSeen, room, roomMap]);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    if (messages.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageId = entry.target.getAttribute("data-id");
            if (messageId) {
              const pendingMsg = messageEntities[messageId];

              if (!pendingMsg) return;
              if (pendingMsg.status === "READ") return;
              if (pendingMsg.senderEmail !== user?.email)
                websocket.sendAcknowledgement(pendingMsg, "READ");
              flushPendingChat(pendingMsg);
            }
          }
        });
      },
      {
        root: container,
        threshold: 0.6,
      },
    );

    const element = container.querySelectorAll("[data-id]");
    element.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, [dispatch, flushPendingChat, messageEntities, messages, user, websocket]);

  useEffect(() => {
    requestAnimationFrame(() => {
      if (!room?.referenceNumber) return;
      const readReceipt = readReceiptMap[room.referenceNumber];

      const shouldScrollToUnread =
        readReceipt?.count !== undefined &&
        readReceipt.count > 0 &&
        unreadStampRef.current &&
        !hasScrolledToUnread.current;

      // PRIORITY 1 = unread stamp
      if (shouldScrollToUnread && unreadStampRef.current) {
        unreadStampRef.current.scrollIntoView({
          behavior: "instant",
          block: "center",
        });

        shouldAutoScroll.current = false;
        hasScrolledToUnread.current = true;
        return;
      }

      // PRIORITY 2 = normal bottom scroll
      if (shouldAutoScroll.current) {
        scrollToBottom();
      }
    });
  }, [messages, readReceiptMap, room]);

  useEffect(() => {
    hasScrolledToUnread.current = false;
  }, [room?.referenceNumber]);

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

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!room?.referenceNumber) return;

    const typingUsers = typing[room.referenceNumber];
    if (!typingUsers || typingUsers.length === 0) return;

    if (shouldAutoScroll.current) {
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    }
  }, [room?.referenceNumber, typing]);

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

  function handleTyping(e: React.ChangeEvent<HTMLTextAreaElement>) {
    if (!room?.referenceNumber) return;
    if (!user?.email) return;
    if (!websocket.socket.current?.connected) return;

    if (e.target.value.trim().length === 0) return;

    if (!isTypingRef.current) {
      websocket.sendTyping(room.referenceNumber, user.email, "START");
      isTypingRef.current = true;
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    const currentRoomRef = room.referenceNumber;
    const currentUserEmail = user.email;

    typingTimeoutRef.current = setTimeout(() => {
      websocket.sendTyping(currentRoomRef, currentUserEmail, "STOP");
      isTypingRef.current = false;
    }, 1000);
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      if (!room) return;
      let targetRoom = { ...room };

      // create new private room if not exits
      if (room.type === "PRIVATE" && !room.referenceNumber) {
        // save the new room.
        const newRoomResponse = await message.post("/rooms/new-private", {
          ...targetRoom,
          referenceNumber: uuidv4(),
        });
        const newRoomData = newRoomResponse.data as Room;

        // update the current room
        dispatch(saveRoom(newRoomData));

        // add the new room in the room list.
        dispatch(addRoom(newRoomData));

        targetRoom = { ...newRoomData };
      }

      // prepare the message payload
      const messagePayload = {
        message: values.message,
        uuid: uuidv4(),
        status: "NOT_SENT",
        media: "TEXT",
        roomRef: targetRoom.referenceNumber,
        senderId: user?.id,
        senderEmail: user?.email,
        senderFirstName: user?.firstName,
        senderLastName: user?.lastName,
        createdAt: new Date().toISOString(),
      } as Message;

      // put the message payload in the window
      dispatch(setMessage(messagePayload));

      // update the room list to register the new message.
      dispatch(refreshRooms(messagePayload));

      // save the message
      const messageResponse = await message.post("/messages", messagePayload);
      const messageResponseData = messageResponse.data;

      // update the room list to register saved message.
      dispatch(refreshRooms(messageResponseData));

      // update the the message with the saved one
      dispatch(updateMessage(messageResponseData));

      if (room.type === "PRIVATE") {
        if (!room?.participants) return;
        const recipient = room?.participants.find(
          (p) => p.id !== user?.id,
        ) as User;
        if (!recipient.email) return;
        websocket.sendPrivateMessage(recipient.email, messageResponseData);
      } else {
        if (!room?.referenceNumber) return;
        websocket.sendGroupMessage(room.referenceNumber, messageResponseData);
      }

      form.setValue("message", "");
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = "44px";
        }
      });
      resolveLastSeen();
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

          let readReceipt = null;
          if (message.roomRef) readReceipt = readReceiptMap[message.roomRef];

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
              {message.type === "SYSTEM" ? (
                <div
                  data-id={message.uuid}
                  className={`flex items-center gap-1 mx-auto my-2 px-3 py-1 text-xs text-gray-600 bg-yellow-100 rounded-lg shadow-sm w-fit max-w-[70%] text-center`}
                >
                  <span>
                    <FaLock size={12} className="text-slate-800" />
                  </span>
                  {message.message}
                </div>
              ) : (
                <div data-id={message.uuid}>
                  {message.media === "TEXT" && (
                    <MessageBubble isMe={isMe} msg={message} />
                  )}
                  {message.media === "IMAGE" && (
                    <MediaBubble
                      isMe={isMe}
                      files={files[message.uuid]}
                      msg={message}
                      type="IMAGE"
                    />
                  )}
                  {message.media === "DOCUMENT" && (
                    <MediaBubble
                      isMe={isMe}
                      files={files[message.uuid]}
                      msg={message}
                      type="DOCUMENT"
                    />
                  )}
                  {readReceipt?.count !== undefined &&
                    readReceipt.count > 0 &&
                    readReceipt?.lastSeen === message.uuid && (
                      <div
                        ref={unreadStampRef}
                        data-id="unread-stamp"
                        className="flex justify-center bg-white/20 backdrop-blur-lg border border-white/20 py-1 rounded-3xl font-semibold mt-3"
                      >
                        <div className="bg-white px-3 py-0.5 rounded-2xl">
                          {readReceipt.count} Unread Message
                          {readReceipt.count > 1 ? "s" : ""}
                        </div>
                      </div>
                    )}
                </div>
              )}
            </div>
          );
        })}
        {room?.referenceNumber && (
          <TypingIndicator roomRef={room?.referenceNumber} type="INDICATOR" />
        )}
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
                  const { ref, onChange, ...rest } = field;
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
                          onChange={(e) => {
                            onChange(e); // react-hook-form update
                            handleTyping(e); // websocket typing event
                          }}
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
