"use client";

import { RootState } from "./store/store";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

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
