"use client";

import { useSelector } from "react-redux";
import { RootState } from "../store/store";

import React from "react";
import WebSocketProvider from "@/provider/WebSocketProvider";

function Layout({ children }: { children: React.ReactNode }) {
  const { accessToken } = useSelector((state: RootState) => state.user);

  return (
    <WebSocketProvider token={accessToken}>
      <div className="bg-slate-100 h-screen">{children}</div>
    </WebSocketProvider>
  );
}

export default Layout;
