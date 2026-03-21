import { getNameColor } from "@/lib/utils";
import { useSelector } from "react-redux";
import { RootState } from "@/app/store/store";

function TypingIndicator() {
  const room = useSelector((state: RootState) => state.chat.room);
  const typingMap = useSelector((state: RootState) => state.typing.typingMap);
  const chatPartners = useSelector(
    (state: RootState) => state.participants.entities,
  );

  if (!room?.referenceNumber) return null;
  if (!typingMap[room?.referenceNumber]) return null;
  if (typingMap[room.referenceNumber].length === 0) return null;
  if (!chatPartners[typingMap[room.referenceNumber][0]]) return null;
  const typer = chatPartners[typingMap[room.referenceNumber][0]];
  if (!typer.firstName) return null;

  return (
    <div className={`flex flex-col bg-white w-fit px-2 shadow-lg rounded-lg`}>
      <span
        className={`text-xs font-semibold capitalize ${getNameColor(typer.firstName.toLowerCase())}`}
      >
        {typer.firstName}
      </span>
      {/* Dots */}
      <div className="flex items-center gap-1 my-2">
        <span className="dot delay-0"></span>
        <span className="dot delay-200"></span>
        <span className="dot delay-400"></span>
      </div>
    </div>
  );
}

export default TypingIndicator;
