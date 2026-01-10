import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/app/store/store";
import { FaArrowLeft } from "react-icons/fa6";
import { MdGroupAdd } from "react-icons/md";
import { toastError } from "./toastError";
import { selectRoom } from "@/app/store/chatSlice";
import { Input } from "./ui/input";
import { User } from "@/app/types/user";
import { chat } from "@/app/clients/chatClient";
import { Room } from "@/app/types/room";

import NewGroup from "./NewGroupMemberSelector";

function NewChatMenu({ closeNewChatMenu }: { closeNewChatMenu: () => void }) {
  const dispatch = useDispatch<AppDispatch>();
  const loggedInUser = useSelector((state: RootState) => state.user.user);
  const rooms = useSelector((state: RootState) => state.rooms.rooms);
  const [contacts, setContacts] = useState<User[]>([]);
  const [isNewGroupWindowOpen, setIsNewGroupWindowOpen] =
    useState<boolean>(false);

  const openNewGroupWindow = () => setIsNewGroupWindowOpen(true);
  const closeNewGroupWindow = () => setIsNewGroupWindowOpen(false);

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

  async function handleStartPrivateChat(participant: User) {
    try {
      if (!loggedInUser?.email || !participant.email) return;
      const roomRef = [participant.email, loggedInUser?.email]
        .sort((a, b) => a?.localeCompare(b))
        .join("::");
      if (rooms[roomRef]) {
        const response = await chat.get(`/rooms/opt-room/${roomRef}`);
        dispatch(selectRoom(response.data));
      } else {
        const newRoom: Room = {
          id: null,
          referenceNumber: roomRef,
          participants: [{ ...loggedInUser }, { ...participant }],
          messages: {},
          uuids: [],
          createdAt: null,
          updatedAt: null,
        };
        dispatch(selectRoom(newRoom));
      }
    } catch (error) {
      toastError(error);
    }
  }

  return (
    <>
      {isNewGroupWindowOpen && (
        <NewGroup contacts={contacts} closeWindow={closeNewGroupWindow} />
      )}
      {!isNewGroupWindowOpen && (
        <div className="h-full flex flex-col min-h-0">
          <div className="py-4 px-4 flex gap-5 items-center shrink-0">
            <FaArrowLeft
              size={20}
              className="cursor-pointer"
              onClick={closeNewChatMenu}
            />
            <div className="text-lg font-semibold">New Chat</div>
          </div>

          <div className="px-4 shrink-0">
            <Input
              type="text"
              placeholder="Search contacts"
              className="rounded-4xl bg-slate-100 placeholder:text-slate-700 placeholder:text-[16px] focus:bg-white"
            />
          </div>

          <div className="px-2 mt-4 shrink-0">
            <button
              onClick={openNewGroupWindow}
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
              {contacts?.map((c) => (
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
      )}
    </>
  );
}

export default NewChatMenu;
