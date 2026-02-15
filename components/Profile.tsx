import {
  DropdownMenuSeparator,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenu,
} from "./ui/dropdown-menu";
import {
  IconNotification,
  IconCreditCard,
  IconUserCircle,
  IconLogout,
} from "@tabler/icons-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/app/store/store";
import { LuMessageSquareText } from "react-icons/lu";
import { PageLocator } from "@/app/types/page";
import { toastError } from "./toastError";
import { resetRooms } from "@/app/store/roomSlice";
import { resetStack } from "@/app/store/pageSlice";
import { resetChat } from "@/app/store/chatSlice";
import { resetUser } from "@/app/store/userSlice";
import { useRouter } from "next/navigation";
import { auth } from "@/app/clients/authClient";

function Profile() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const loggedInUser = useSelector((state: RootState) => state.user.user);

  async function logout() {
    try {
      dispatch(resetUser());
      dispatch(resetRooms());
      dispatch(resetChat());
      dispatch(resetStack({ stack: "window" } as PageLocator));
      await auth.post("/auth/logout");
      router.replace("/sign-in");
    } catch (error) {
      toastError(error);
    }
  }

  return (
    <div className="flex flex-col items-center justify-between py-4 h-full">
      {/* TOP SECTION */}
      <div>
        <div className="hover:bg-slate-100 p-2 rounded-full">
          <LuMessageSquareText size={23} />
        </div>
      </div>
      {/* BOTTOM SECTION */}
      <div className="hover:bg-slate-200 p-1 rounded-full">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="size-9">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback className="capitalize">
                <span>{loggedInUser?.firstName?.[0]}</span>
                <span>{loggedInUser?.lastName?.[0]}</span>
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side="right"
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="size-8 rounded-lg">
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback className="capitalize">
                    <span>{loggedInUser?.firstName?.[0]}</span>
                    <span>{loggedInUser?.lastName?.[0]}</span>
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium capitalize">
                    {loggedInUser?.firstName} {loggedInUser?.lastName}
                  </span>
                  <span className="text-muted-foreground truncate text-xs">
                    {loggedInUser?.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <IconUserCircle />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <IconCreditCard />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <IconNotification />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <IconLogout />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export default Profile;
