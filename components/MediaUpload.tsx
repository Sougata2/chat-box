import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Form, FormControl, FormField, FormItem } from "./ui/form";
import { unShiftMessageOrRefreshPendingChat } from "@/app/store/chatSlice";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/app/store/store";
import { updateLatestMessage } from "@/app/store/roomSlice";
import { AiOutlineSend } from "react-icons/ai";
import { MediaContext } from "@/app/contexts";
import { v4 as uuidv4 } from "uuid";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageLocator } from "@/app/types/page";
import { toastError } from "./toastError";
import { Textarea } from "./ui/textarea";
import { useForm } from "react-hook-form";
import { FaXmark } from "react-icons/fa6";
import { popPage } from "@/app/store/pageSlice";
import { Message } from "@/app/types/room";
import { Button } from "./ui/button";
import { chat } from "@/app/clients/chatClient";
import { z } from "zod";

import Image from "next/image";

type imageDimension = { width: number; height: number };

const formSchema = z.object({
  message: z.string(),
  room: z.object({
    referenceNumber: z.string(),
  }),
});

function MediaUpload() {
  const dispatch = useDispatch<AppDispatch>();
  const mediaFiles = useContext(MediaContext);

  const sendAudioRef = useRef<HTMLAudioElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const shouldPlaySendNoti = useRef(false);

  const room = useSelector((state: RootState) => state.chat.room);
  const user = useSelector((state: RootState) => state.user.user);

  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
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

  const makeMediaUrls = useCallback(() => {
    if (!mediaFiles) return [];
    setMediaUrls(Array.from(mediaFiles).map((m) => URL.createObjectURL(m)));
  }, [mediaFiles]);

  useEffect(() => {
    (() => {
      makeMediaUrls();
    })();
  }, [makeMediaUrls]);

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

      // dispatch(unShiftMessageOrRefreshPendingChat(payload));
      // dispatch(updateLatestMessage(payload));
      shouldPlaySendNoti.current = true;
      if (room && !room?.id) {
        const newRoomPayload = { ...room, messages: [payload] };
        // await chat.post("/rooms/new-chat", newRoomPayload);
      } else {
        // await chat.post("/messages/send", payload);
      }
      console.log(payload);

      form.setValue("message", "");
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = "44px";
        }
      });
      dispatch(popPage({ stack: "media" } as PageLocator));
    } catch (error) {
      toastError(error);
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
            justify-center
            items-center
          "
        >
          {mediaUrls.map((url) => {
            const dim = dimensions[url];
            return (
              <div
                key={url}
                style={
                  dim
                    ? { aspectRatio: `${dim.width} / ${dim.height}` }
                    : undefined
                }
              >
                <Image
                  alt="Media"
                  src={url}
                  width={dim?.width ?? 200}
                  height={dim?.height ?? 200}
                  onLoadingComplete={(img) => {
                    setDimension((prev) => ({
                      ...prev,
                      [url]: {
                        width: img.naturalWidth,
                        height: img.naturalHeight,
                      } as imageDimension,
                    }));
                  }}
                  className="
                    object-contain
                    max-h-80 h-auto w-full
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
                              form.handleSubmit(onSubmit)();
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
                    {mediaUrls.map((url) => {
                      return (
                        <div
                          key={url}
                          className="relative h-20 w-20 rounded-2xl overflow-auto border-3 border-emerald-600"
                        >
                          <Image alt="Media" src={url} fill />
                        </div>
                      );
                    })}
                  </div>
                  <div>
                    <Button
                      type="submit"
                      size="icon-lg"
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
