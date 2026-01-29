import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/app/store/store";
import { PageLocator } from "@/app/types/page";
import { popPage } from "@/app/store/pageSlice";
import { FaXmark } from "react-icons/fa6";

import NewChatMenu from "./NewChatMenu";
import Profile from "./Profile";
import Window from "@/components/Window";
import Rooms from "@/components/Rooms";
import React from "react";

interface RegistryObject {
  label: string | null;
  component: React.FC;
}

export const pageRegistry: Record<string, RegistryObject | React.FC> = {
  room: Rooms,
  window: Window,
  profile: Profile,
  newChatMenu: { label: "New Chat", component: NewChatMenu },
};

export type StackKey = "rooms" | "window" | "profile";

function PageRenderer({ stack }: { stack: StackKey }) {
  const dispatch = useDispatch<AppDispatch>();
  const pages = useSelector((state: RootState) => state.page[stack]);

  if (pages.length <= 0) return null;

  const page = pages[0];

  const Component = pageRegistry[page.name];

  if (typeof Component === "function") {
    return <Component />;
  }

  if (!Component) return null;

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden">
      <div className="flex gap-3.5 items-center px-4 py-4">
        <div
          className="translate-y-0.5 rounded-full p-1 hover:bg-slate-100"
          onClick={() => {
            dispatch(popPage({ stack } as PageLocator));
          }}
        >
          {page.closeable && <FaXmark size={18} />}
        </div>
        <div className="text-2xl font-medium">{Component.label}</div>
      </div>
      <Component.component />
    </div>
  );
}

export default PageRenderer;
