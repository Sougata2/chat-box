import { FaArrowLeft } from "react-icons/fa6";
import { MdGroupAdd } from "react-icons/md";
import { Input } from "./ui/input";

function NewChatMenu({ closeNewChatMenu }: { closeNewChatMenu: () => void }) {
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
        <div className="px-4">
          <div className="font-semibold text-lg text-slate-600">Contacts</div>
        </div>
      </div>
    </div>
  );
}

export default NewChatMenu;
