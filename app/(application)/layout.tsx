"use client";

import { useSelector } from "react-redux";
import { RootState } from "../store/store";

import WebSocketProvider from "@/provider/WebSocketProvider";
import React from "react";

function Layout({ children }: { children: React.ReactNode }) {
  const { accessToken } = useSelector((state: RootState) => state.user);

  return (
    <WebSocketProvider token={accessToken}>
      <div
        className="h-screen bg-repeat bg-size-[350px] bg-slate-400 dark:bg-slate-900"
        style={{ backgroundImage: "url('/whats-doodles.png')" }}
      >
        <div className="h-full bg-white/75 dark:bg-slate-900/70">
          {children}
        </div>
      </div>
    </WebSocketProvider>
  );
}

export default Layout;
