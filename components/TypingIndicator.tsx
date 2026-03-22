import { getNameColor } from "@/lib/utils";
import { useSelector } from "react-redux";
import { RootState } from "@/app/store/store";

function TypingIndicator({
  roomRef,
  type,
}: {
  roomRef: string;
  type: "TEXT" | "INDICATOR";
}) {
  const typingMap = useSelector((state: RootState) => state.typing.typingMap);
  const chatPartners = useSelector(
    (state: RootState) => state.participants.entities,
  );

  if (!typingMap[roomRef]) return null;
  if (typingMap[roomRef].length === 0) return null;
  if (!chatPartners[typingMap[roomRef][0]]) return null;
  const typersSize = typingMap[roomRef].length;
  const typer = chatPartners[typingMap[roomRef][0]];
  if (!typer.firstName) return null;

  if (type === "TEXT") {
    return <div>{typer.firstName} is typing...</div>;
  }

  return (
    <div className={`flex flex-col bg-white w-fit px-2 shadow-lg rounded-lg`}>
      <span
        className={`text-xs font-semibold capitalize ${getNameColor(typer.firstName.toLowerCase())}`}
      >
        {typer.firstName}{" "}
        {typersSize > 1 && (
          <span>{`+ ${typersSize} other${typersSize > 2 ? "s" : ""}`}</span>
        )}
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
