import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { ChangeEvent, useState } from "react";
import { MdArrowForward } from "react-icons/md";
import { FaArrowLeft } from "react-icons/fa6";
import { HiMiniXMark } from "react-icons/hi2";
import { User } from "@/app/types/user";

function NewGroup({
  contacts,
  closeWindow,
}: {
  contacts: User[];
  closeWindow: () => void;
}) {
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [query, setQuery] = useState<string>("");

  function selectContact(id: number) {
    setSelectedContacts((prevState) => [...prevState, id]);
    setQuery("");
  }

  function unSelectContact(id: number) {
    setSelectedContacts((prevState) => [...prevState.filter((c) => c !== id)]);
  }

  function matchesSearch(user: User, query: string) {
    if (!query) return true;
    const text =
      `${user.firstName} ${user.lastName} ${user.email}`.toLowerCase();
    return text.includes(query.toLowerCase());
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex flex-col gap-8">
        <div className="py-4 px-4 flex gap-5 items-center shrink-0">
          <FaArrowLeft
            size={20}
            className="cursor-pointer"
            onClick={closeWindow}
          />
          <div className="text-lg font-semibold">Add Group Members</div>
        </div>
        <div className="px-4 flex gap-2.5 flex-wrap">
          {contacts
            .filter((c) => selectedContacts.includes(c.id))
            .map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-2 bg-slate-100 rounded-full px-1 py-1 text-sm w-fit"
              >
                <Avatar className="size-6">
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback className="capitalize">
                    {c.firstName[0]}
                    {c.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="max-w-30 truncate">
                  {c.firstName} {c.lastName}
                </span>
                <div className="hover:rounded-full hover:bg-slate-200 p-1">
                  <HiMiniXMark onClick={() => unSelectContact(c.id)} />
                </div>
              </div>
            ))}
        </div>
        <div className="px-4">
          <input
            className="w-full text-lg border-b-2 focus:border-b-slate-300 focus:border-t-0 focus:outline-none"
            placeholder="Search name or email"
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setQuery(e.target.value)
            }
            value={query}
          />
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto px-4 mt-4 scrollbar-hide">
        <div className="flex flex-col gap-2.5">
          {contacts
            ?.filter((c) => !selectedContacts.includes(c.id))
            .filter((c) => matchesSearch(c, query))
            .map((c) => (
              <div
                key={c.id}
                onClick={() => selectContact(c.id)}
                className="flex items-center gap-3 px-2 py-4 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <Avatar>
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback className="capitalize">
                    {c.firstName[0]}
                    {c.lastName[0]}
                  </AvatarFallback>
                </Avatar>

                <div>
                  {c.firstName} {c.lastName}
                </div>
              </div>
            ))}
        </div>
      </div>
      {selectedContacts.length > 0 && (
        <div className="mx-auto sticky bottom-4 z-10 w-[95%] bg-white rounded-xl flex justify-center py-3">
          <button className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg hover:bg-emerald-600 active:scale-95 transition">
            <MdArrowForward size={22} />
          </button>
        </div>
      )}
    </div>
  );
}

export default NewGroup;
