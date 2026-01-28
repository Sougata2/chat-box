import { RootState } from "@/app/store/store";
import { useSelector } from "react-redux";

import Window from "@/components/Window";
import Rooms from "@/components/Rooms";

const pageRegistry: Record<string, React.FC> = {
  room: Rooms,
  window: Window,
};

type StackKey = "rooms" | "window";

function PageRenderer({ stack }: { stack: StackKey }) {
  const pages = useSelector((state: RootState) => state.page[stack]);

  if (pages.length <= 0) return null;

  const page = pages[0];

  const Component = pageRegistry[page.name];

  if (!Component) return null;

  return <Component />;
}

export default PageRenderer;
