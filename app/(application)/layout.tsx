"use client";

import { useCallback, useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../store/store";
import { AxiosError } from "axios";
import { setUser } from "../store/userSlice";
import { toast } from "sonner";
import { auth } from "../clients/authClient";

import Cookies from "js-cookie";
import React from "react";

function Layout({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();
  const fetchUser = useCallback(async () => {
    try {
      const response = await auth.post("/auth/validate", {
        token: Cookies.get("Authorization"),
      });
      dispatch(setUser(response.data));
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast.error(axiosError.response?.data.message);
    }
  }, [dispatch]);

  useEffect(() => {
    (async () => {
      await fetchUser();
    })();
  }, [fetchUser]);

  return <div className="bg-slate-50 h-screen">{children}</div>;
}

export default Layout;
