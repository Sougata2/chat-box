/* eslint-disable @typescript-eslint/no-explicit-any */
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/app/store/store";
import { FaArrowLeft, FaXmark } from "react-icons/fa6";
import { PageLocator } from "@/app/types/page";
import { popPage } from "@/app/store/pageSlice";

import NewGroupMemberSelector from "./NewGroupMemberSelector";
import NewGroupForm from "./NewGroupForm";
import NewChatMenu from "./NewChatMenu";
import Profile from "./Profile";
import Window from "@/components/Window";
import Rooms from "@/components/Rooms";
import React from "react";

type RegistryObject<P = any> = {
  label?: string | null;
  component: React.ComponentType<P>;
};

export const pageRegistry: Record<string, RegistryObject | React.FC> = {
  room: Rooms,
  window: Window,
  profile: Profile,
  newChatMenu: { label: "New Chat", component: NewChatMenu },
  newGroupMemberSelector: {
    label: "Add Group Members",
    component: NewGroupMemberSelector,
  },
  newGroupForm: {
    label: "Create Group",
    component: NewGroupForm,
  },
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
          {pages.length > 2 ? (
            <>{page.closeable && <FaArrowLeft size={18} />}</>
          ) : (
            <>{page.closeable && <FaXmark size={18} />}</>
          )}
        </div>
        <div className="text-xl font-medium">{Component.label}</div>
      </div>
      <Component.component {...page.props} />
    </div>
  );
}

export default PageRenderer;
