import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { File as ChatFile, Media, Message, Room, User } from "@/types/types";
import { Form, FormControl, FormField, FormItem } from "./ui/form";
import { addFiles, saveRoom, setMessage } from "@/app/store/chatSlice";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/app/store/store";
import { addRoom, refreshRooms } from "@/app/store/roomSlice";
import { AiOutlineSend } from "react-icons/ai";
import { useWebsocket } from "@/hooks/useWebsocket";
import { v4 as uuidv4 } from "uuid";
import { FileContext } from "@/app/contexts";
import { PageLocator } from "@/app/types/page";
import { zodResolver } from "@hookform/resolvers/zod";
import { PendingFile } from "@/types/Pendingfile";
import { toastError } from "./toastError";
import { Textarea } from "./ui/textarea";
import { FaXmark } from "react-icons/fa6";
import { message } from "@/app/clients/messageClient";
import { popPage } from "@/app/store/pageSlice";
import { useForm } from "react-hook-form";
import { Button } from "./ui/button";
import { z } from "zod";

import Image from "next/image";

type imageDimension = { width: number; height: number };

const formSchema = z.object({
  message: z.string(),
  room: z.object({
    referenceNumber: z.string(),
  }),
});

function MediaUpload({ media }: { media: Media }) {
  const websocket = useWebsocket();
  const dispatch = useDispatch<AppDispatch>();
  const files = useContext(FileContext);

  // const sendAudioRef = useRef<HTMLAudioElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const shouldPlaySendNoti = useRef(false);

  const room = useSelector((state: RootState) => state.chat.room);
  const user = useSelector((state: RootState) => state.user.user);

  const [pendingFiles, setPendingFile] = useState<PendingFile[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [dimensions, setDimension] = useState<Record<string, imageDimension>>(
    {},
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

  const initializePendingFile = useCallback(() => {
    if (!files) return;

    const list = Array.from(files).map(
      (file) =>
        ({ file, previewUrl: URL.createObjectURL(file) }) as PendingFile,
    );
    setPendingFile(list);
    return () => {
      list.forEach((m) => URL.revokeObjectURL(m.previewUrl));
    };
  }, [files]);

  useEffect(() => {
    (() => {
      initializePendingFile();
    })();
  }, [initializePendingFile]);

  // useEffect(() => {
  //   if (sendAudioRef.current && shouldPlaySendNoti.current) {
  //     sendAudioRef.current.currentTime = 0; // replay instantly
  //     sendAudioRef.current.play().catch(() => {});
  //     shouldPlaySendNoti.current = false;
  //   }
  // }, [room?.uuids.length]);

  async function uploadAllMedia(): Promise<ChatFile[]> {
    const formData = new FormData();
    pendingFiles.forEach((m) => formData.append("files", m.file));
    setIsUploading(true);

    const response = await message.post("/files/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return response.data;
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      let uploadedFiles: ChatFile[] = [];
      if (pendingFiles.length > 0) {
        uploadedFiles = await uploadAllMedia();
      }

      const fileIds = uploadedFiles.map((file) => file.id);

      let messagePayload = {
        message: values.message,
        uuid: uuidv4(),
        status: "NOT_SENT",
        media: media,
        roomRef: room?.referenceNumber,
        senderId: user?.id,
        senderEmail: user?.email,
        senderFirstName: user?.firstName,
        senderLastName: user?.lastName,
        createdAt: new Date().toISOString(),
        fileIds,
      } as Message;

      shouldPlaySendNoti.current = true;

      if (room?.type === "GROUP") {
        // put the message payload in the window
        dispatch(setMessage(messagePayload));

        // update the room list to register the new message.
        dispatch(refreshRooms(messagePayload));

        if (!room?.referenceNumber) return;

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
            media: media,
            roomRef: newRoomResponse.data.referenceNumber,
            senderId: user?.id,
            senderEmail: user?.email,
            senderFirstName: user?.firstName,
            senderLastName: user?.lastName,
            createdAt: new Date().toISOString(),
            fileIds,
          } as Message;
        }

        // place the uploaded files in the map.
        dispatch(addFiles({ [messagePayload.uuid]: uploadedFiles }));

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
      dispatch(popPage({ stack: "media" } as PageLocator));
    } catch (error) {
      toastError(error);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div
      className="
        flex flex-col
        bg-white
        border rounded-2xl border-slate-300
        justify-between
      "
    >
      <div
        onClick={() => {
          dispatch(popPage({ stack: "media" } as PageLocator));
        }}
        className="
          w-fit
          mt-3
          mx-4
          p-2
          rounded-full
          hover:bg-slate-100
        "
      >
        <FaXmark size={18} />
      </div>
      <div
        className="
          flex
          justify-center items-center
        "
      >
        <div
          className="
            flex
            w-full
            px-3
            justify-center
            items-center
          "
        >
          {pendingFiles.map((pm) => {
            const dim = dimensions[pm.previewUrl];
            return (
              <div
                key={pm.previewUrl}
                style={
                  dim
                    ? { aspectRatio: `${dim.width} / ${dim.height}` }
                    : undefined
                }
              >
                <Image
                  alt="Media"
                  src={pm.previewUrl}
                  width={dim?.width ?? 200}
                  height={dim?.height ?? 200}
                  onLoadingComplete={(img) => {
                    setDimension((prev) => ({
                      ...prev,
                      [pm.previewUrl]: {
                        width: img.naturalWidth,
                        height: img.naturalHeight,
                      } as imageDimension,
                    }));
                  }}
                  className="
                    object-contain
                    max-h-72 h-auto w-full
                    rounded-md border border-slate-200
                    shadow-md
                  "
                />
              </div>
            );
          })}
        </div>
      </div>
      <div>
        <Form {...form}>
          <form
            onSubmit={(e) => form.handleSubmit(onSubmit)(e)}
            className="
              grid grid-rows-[1fr_1fr]
            "
          >
            <div
              className="
                my-auto
                mx-4 px-2
                bg-slate-100
                rounded-2xl border border-slate-200
                h-fit
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
                          {...rest}
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
                            el.style.height = `${Math.min(el.scrollHeight, 80)}px`;
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              // form.handleSubmit(onSubmit)();
                            }
                          }}
                          className="
                            overflow-y-auto
                            min-h-11 max-h-20
                            px-3 py-2.5
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
            <div
              className="
                border-t border-t-slate-200
              "
            >
              <div
                className="
                  p-3
                "
              >
                <div className="flex gap-3.5 justify-between items-center">
                  <div className="flex gap-2 min-w-[80%] justify-center items-center">
                    {pendingFiles.map((pm) => {
                      return (
                        <div
                          key={pm.previewUrl}
                          className="relative h-20 w-20 rounded-2xl overflow-auto border-3 border-emerald-600"
                        >
                          <Image alt="Media" src={pm.previewUrl} fill />
                        </div>
                      );
                    })}
                  </div>
                  <div>
                    <Button
                      type="submit"
                      size="icon-lg"
                      disabled={isUploading}
                      className="
                        w-15! h-15!
                        bg-emerald-500
                        rounded-full
                        shrink-0 self-end hover:bg-emerald-600
                      "
                    >
                      <AiOutlineSend
                        size={100}
                        className="
                          text-white
                        "
                      />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}

export default MediaUpload;
