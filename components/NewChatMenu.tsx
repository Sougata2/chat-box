import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useCallback, useEffect, useState } from "react";
import { FaArrowLeft } from "react-icons/fa6";
import { MdGroupAdd } from "react-icons/md";
import { toastError } from "./toastError";
import { Input } from "./ui/input";
import { User } from "@/app/types/user";
import { chat } from "@/app/clients/chatClient";

function NewChatMenu({ closeNewChatMenu }: { closeNewChatMenu: () => void }) {
  const [contacts, setContacts] = useState<User[]>();

  const fetchContacts = useCallback(async () => {
    try {
      const response = await chat.get("/users/contacts");
      setContacts(response.data);
    } catch (error) {
      toastError(error);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await fetchContacts();
    })();
  }, [fetchContacts]);

  return (
    <div className="">
      <div className="py-4 px-4 flex gap-5 items-center">
        <div>
          <FaArrowLeft
            size={20}
            className="cursor-pointer"
            onClick={closeNewChatMenu}
          />
        </div>
        <div className="text-lg font-semibold">New Chat</div>
      </div>
      <div className="flex flex-col gap-6">
        <div className="px-4 rounded-4xl">
          <Input
            type="text"
            placeholder="search contacts"
            className="rounded-4xl bg-slate-100 placeholder:text-slate-700 placeholder:text-[16px] focus:bg-white"
          />
        </div>
        <div className="px-2">
          <button className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-slate-100 transition-colors">
            <div className="flex items-center justify-center size-12 rounded-full bg-emerald-500 text-white">
              <MdGroupAdd size={22} />
            </div>

            <span className="text-[16px] font-medium text-slate-600">
              New Group
            </span>
          </button>
        </div>
        <div className="px-4 flex flex-col gap-3.5">
          <div className="font-semibold text-lg text-slate-600">Contacts</div>
          {contacts?.map((c) => (
            <div
              key={c.id}
              className="flex flex-col gap-2 px-2 py-4 hover:rounded-xl hover:bg-slate-100 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage
                    src="https://github.com/shadcn.png"
                    alt="@shadcn"
                  />
                  <AvatarFallback className="capitalize">
                    <span>{c.firstName}</span>
                    <span>{c.lastName}</span>
                  </AvatarFallback>
                </Avatar>
                <div>
                  {c.firstName} {c.lastName}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default NewChatMenu;
