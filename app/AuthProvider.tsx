"use client";

import { useCallback, useEffect, useState } from "react";
import { resetUser, setAuth } from "./store/userSlice";
import { useDispatch } from "react-redux";
import { AppDispatch } from "./store/store";
import { AuthLoader } from "@/components/AuthLoader";
import { useRouter } from "next/navigation";
import { auth } from "./clients/authClient";
import { User } from "./types/user";

import React from "react";

function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [ready, setReady] = useState<boolean>(false);
  const [showLoader, setShowLoader] = useState<boolean>(true);

  const restoreSession = useCallback(async () => {
    try {
      const response = await auth.post("/auth/refresh");

      dispatch(
        setAuth({
          user: {
            email: response.data.email,
            firstName: response.data.firstName,
            lastName: response.data.lastName,
          } as User,
          accessToken: response.data.token,
          expireAt: response.data.expiration,
        }),
      );
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      dispatch(resetUser());
      router.push("/sign-in");
    } finally {
      setReady(true);
    }
  }, [dispatch, router]);

  useEffect(() => {
    (async () => {
      await restoreSession();
    })();
  }, [restoreSession]);

  if (showLoader) {
    return <AuthLoader ready={ready} onComplete={() => setShowLoader(false)} />;
  }

  return <>{children}</>;
}

export default AuthProvider;
