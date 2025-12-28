"use client";

import { Form, FormControl, FormField, FormItem } from "./ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { AiOutlineSend } from "react-icons/ai";
import { useSelector } from "react-redux";
import { zodResolver } from "@hookform/resolvers/zod";
import { toastError } from "./toastError";
import { RootState } from "@/app/store/store";
import { useEffect } from "react";
import { Message } from "@/app/types/room";
import { useForm } from "react-hook-form";
import { Button } from "./ui/button";
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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await chat.post("/messages/send", values);
      form.setValue("message", "");
    } catch (error) {
      toastError(error);
    }
  }

  return (
    <div className="rounded-2xl h-full min-h-0 grid grid-rows-[auto_1fr_auto] gap-2">
      <div className="h-16 px-4 flex items-center gap-3 bg-white rounded-lg border border-slate-300">
        <Avatar className="h-10 w-10">
          <AvatarImage src="https://github.com/shadcn.png" />
          <AvatarFallback>
            {otherParticipant?.firstName?.[0]}
            {otherParticipant?.lastName?.[0]}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col">
          <span className="text-slate-700 font-medium capitalize">
            {otherParticipant?.firstName} {otherParticipant?.lastName}
          </span>
          <span className="text-xs text-slate-500">online</span>
        </div>
      </div>

      <div className="min-h-0 overflow-y-auto scrollbar-hide flex flex-col-reverse gap-5 py-2.5 px-5">
        {room?.messages.map((msg: Message) => {
          const isMe = msg.sender.email === user?.email;
          return (
            <div
              key={msg.id}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`${
                  isMe ? "bg-emerald-200 text-emerald-800" : "bg-white"
                } border border-slate-300 w-fit p-3 rounded-lg max-w-md`}
              >
                {msg.message}
              </div>
            </div>
          );
        })}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
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
                      className="
                                  h-12
                                  text-base!
                                  placeholder:font-medium
                                  border-none
                                  shadow-none
                                  focus-visible:ring-0
                                  focus-visible:ring-offset-0
                                  "
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
