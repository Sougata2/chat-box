"use client";

import { useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "./store/store";
import { useRouter } from "next/navigation";

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
