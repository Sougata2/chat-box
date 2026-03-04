import { useContext } from "react";
import { WebSocketContextType } from "@/types/types";
import { WebSocketContext } from "@/provider/WebSocketProvider";

export function useWebsocket(): WebSocketContextType {
  const context = useContext(WebSocketContext);

  if (!context) {
    throw new Error("useWebsocket must be used within WebSocketProvider");
  }

  return context;
}
