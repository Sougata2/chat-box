import { RootState } from "@/app/store/store";
import { useSelector } from "react-redux";
import { User } from "@/app/types/user";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { AiOutlineSend } from "react-icons/ai";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Message } from "@/app/types/room";
function Window() {
  const room = useSelector((state: RootState) => state.chat.room);
  const user = useSelector((state: RootState) => state.user.user);

  const otherParticipant = room?.participants.find(
    (u: User) => u.email !== user?.email
  );

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
          <span className="text-base font-medium">
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

      <div className="bg-white rounded-lg border border-slate-300 flex gap-3.5 items-center px-4">
        <Input
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
        />
        <Button variant="outline" className="w-14">
          <AiOutlineSend size={20} className="text-emerald-500" />
        </Button>
      </div>
    </div>
  );
}

export default Window;
