"use client";

import { RootState, store } from "./store/store";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Page } from "./types/page";

export default function Home() {
  const router = useRouter();
  const accessToken = useSelector((state: RootState) => state.user.accessToken);
  const user = useSelector((state: RootState) => state.user.user);

  useEffect(() => {
    if (!accessToken || !user) {
      router.replace("/sign-in");
    } else {
      router.replace("/chat");
    }
  }, [accessToken, router, user]);

  return null;
}

export function peekWindow(): Page | null {
  return store.getState().page.window[0];
}

export function getWindowStackSize(): number {
  return store.getState().page.window.length;
}

export function peekRoom(): Page | null {
  return store.getState().page.rooms[0];
}

export function getRoomStackSize(): number {
  return store.getState().page.rooms.length;
}
