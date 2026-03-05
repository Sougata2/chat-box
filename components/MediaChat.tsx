"use client";
import {
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenu,
} from "@/components/ui/dropdown-menu";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Form, FormControl, FormField, FormItem } from "./ui/form";
import { saveRoom, setMessage, setMessages } from "@/app/store/chatSlice";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/app/store/store";
import { MediaDispatchContext } from "@/app/contexts";
import { addRoom, unShiftRoom } from "@/app/store/roomSlice";
import { Message, Room, User } from "@/types/types";
import { Page, PageLocator } from "@/app/types/page";
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
// import MediaBubble from "./MediaBubble";
import GifPicker from "./GifPicker";
import React from "react";

const formSchema = z.object({
  message: z.string().nonempty(),
  room: z.object({
    referenceNumber: z.string(),
  }),
});

function MediaChat() {
  const setMediaFiles = useContext(MediaDispatchContext);
  const dispatch = useDispatch<AppDispatch>();
  const websocket = useWebsocket();

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const sendAudioRef = useRef<HTMLAudioElement | null>(null);
  const shouldPlaySendNoti = useRef(false);

  const { messageMap, participants, room } = useSelector(
    (state: RootState) => state.chat,
  );
  const user = useSelector((state: RootState) => state.user.user);

  const [gifOpen, setGifOpen] = useState(false);

  const fetchMessageMap = useCallback(async () => {
    try {
      const response = await message.get(
        `/messages/room/${room?.referenceNumber}`,
      );
      dispatch(setMessages(response.data));
    } catch (error) {
      toastError(error);
    }
  }, [dispatch, room]);

  useEffect(() => {
    if (room?.referenceNumber) {
      (async () => {
        await fetchMessageMap();
      })();
    }
  }, [fetchMessageMap, room?.referenceNumber]);

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
    sendAudioRef.current = new Audio("/sent.mp3");
  }, []);

  useEffect(() => {
    if (sendAudioRef.current && shouldPlaySendNoti.current) {
      sendAudioRef.current.currentTime = 0; // replay instantly
      sendAudioRef.current.play().catch(() => {});
      shouldPlaySendNoti.current = false;
    }
  }, []);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
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
      } as Message;

      shouldPlaySendNoti.current = true;
      // find the participant
      const recipient = participants.find((p) => p.id !== user?.id) as User;
      if (room && !room?.referenceNumber) {
        if (!recipient?.id || !user?.id) return;
        // create a new room payload
        const newRoom: Room = {
          referenceNumber: uuidv4(),
          name: `${recipient.firstName} ${recipient.lastName}`,
          type: "PRIVATE",
          participants: [recipient?.id],
          lastMessage: null,
          createdAt: null,
          updatedAt: null,
        };
        // save the new room.
        const newRoomResponse = await message.post(
          "/rooms/new-private",
          newRoom,
        );
        // update the current room
        dispatch(saveRoom(newRoomResponse.data));

        // add the new room in the room list.
        dispatch(addRoom(newRoomResponse.data));

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
        } as Message;
      }
      // put the message payload in the window
      dispatch(setMessage(messagePayload));

      // update the room list to register the new message.
      dispatch(unShiftRoom(messagePayload));

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
        {messageMap?.uuids.map((uuid: string, index: number) => {
          const msg = messageMap.messages[uuid];
          const isMe = msg.senderEmail === user?.email;

          let showDateBar: boolean = false;

          const currentUUID = messageMap?.uuids[index];
          const currentCreatedAt = messageMap.messages[currentUUID].createdAt;
          let currentDate = format(
            new Date(currentCreatedAt ?? new Date()),
            "dd-MM-yyyy",
          );

          const previouseUUID =
            messageMap.uuids[
              index === messageMap.uuids.length - 1 ? index : index + 1
            ];
          const previousCreatedAt =
            messageMap.messages[previouseUUID].createdAt;
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
              {msg.media === "TEXT" && <MessageBubble isMe={isMe} msg={msg} />}
              {/* {msg.media === "IMAGE" && (
                <MediaBubble isMe={isMe} media={msg.media} msg={msg} />
              )} */}
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
