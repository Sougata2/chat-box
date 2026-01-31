import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/app/store/store";
import { Page, PageLocator } from "@/app/types/page";
import { MdGroupAdd } from "react-icons/md";
import { toastError } from "./toastError";
import { selectRoom } from "@/app/store/chatSlice";
import { AxiosError } from "axios";
import { stackPage } from "@/app/store/pageSlice";
import { Input } from "./ui/input";
import { User } from "@/app/types/user";
import { chat } from "@/app/clients/chatClient";
import { Room } from "@/app/types/room";

function NewChatMenu() {
  const dispatch = useDispatch<AppDispatch>();
  const loggedInUser = useSelector((state: RootState) => state.user.user);
  const [contacts, setContacts] = useState<User[]>([]);
  const [query, setQuery] = useState<string>("");

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

  function matchesSearch(contact: User, query: string) {
    if (!query) return true;
    const text =
      `${contact.email} ${contact.firstName} ${contact.lastName}`.toLowerCase();
    return text.includes(query.toLowerCase());
  }

  async function handleStartPrivateChat(participant: User) {
    if (!loggedInUser?.email || !participant.email) return;
    try {
      const response = await chat.get(
        `/rooms/find-and-get-room-opt/${participant.email}`,
      );
      dispatch(selectRoom(response.data));
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      if (axiosError.status === 404) {
        const newRoom: Room = {
          id: null,
          referenceNumber: null,
          participants: [{ ...loggedInUser }, { ...participant }],
          messages: {},
          uuids: [],
          roomType: null,
          groupName: null,
          createdAt: null,
          updatedAt: null,
        };
        dispatch(selectRoom(newRoom));
        return;
      }
      toastError(error);
    }
  }

  return (
    <>
      <div className="h-screen min-h-0 flex flex-col w-full max-w-full overflow-hidden">
        <div className="px-4 shrink-0">
          <Input
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setQuery(e.target.value)
            }
            value={query}
            type="text"
            placeholder="Search contacts"
            className="rounded-4xl bg-slate-100 placeholder:text-slate-700 placeholder:text-[16px] focus:bg-white"
          />
        </div>

        <div className="px-2 mt-4 shrink-0">
          <button
            onClick={() => {
              dispatch(
                stackPage({
                  stack: "rooms",
                  page: {
                    name: "newGroupMemberSelector",
                    import: "@/components/NewGroupMemberSelection",
                    closeable: true,
                    props: {
                      contacts,
                    },
                  } as Page,
                } as PageLocator),
              );
            }}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <div className="flex items-center justify-center size-12 rounded-full bg-emerald-500 text-white">
              <MdGroupAdd size={22} />
            </div>
            <span className="text-[16px] font-medium text-slate-600">
              New Group
            </span>
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 mt-4 scrollbar-hide">
          <div className="sticky top-0 z-10 bg-white py-2 font-semibold text-lg text-slate-600">
            Contacts
          </div>

          <div className="flex flex-col gap-2.5">
            {contacts
              .filter((c) => matchesSearch(c, query))
              ?.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 px-2 py-4 rounded-xl hover:bg-slate-100 cursor-pointer"
                  onClick={() => handleStartPrivateChat(c)}
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
      </div>
    </>
  );
}

export default NewChatMenu;
