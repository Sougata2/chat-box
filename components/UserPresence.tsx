import { PresenceStatus, User } from "@/types/types";
import { useSelector } from "react-redux";
import { RootState } from "@/app/store/store";
import { format } from "date-fns";

function UserPresence({ user }: { user: User }) {
  const presence = useSelector((state: RootState) => state.presence);
  const participants = useSelector((state: RootState) => state.participants);

  if (!user.email) return null;

  const presenceUser = presence.entities[user.email];
  const participantUser = participants.entities[user.email];

  const lastSeen = presenceUser?.lastSeen ?? participantUser?.lastSeen ?? null;

  const status: PresenceStatus = presenceUser?.status || "OFFLINE";

  switch (status) {
    case "OFFLINE":
      return (
        <span className="text-xs text-slate-500 lowercase">
          last seen •{" "}
          {lastSeen && !isNaN(Number(lastSeen))
            ? format(new Date(Number(lastSeen)), "hh:mm aaa (dd-MM-yy)")
            : "unknown"}
        </span>
      );

    case "ONLINE":
      return (
        <span className="text-xs text-slate-500 lowercase">
          <span className="text-emerald-500">● </span> online
        </span>
      );

    default:
      return <div></div>;
  }
}

export default UserPresence;
