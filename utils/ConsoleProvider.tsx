"use client";

import "@/utils/consoleOverride";

export default function ConsoleProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
