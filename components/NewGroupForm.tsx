import {
  FormDescription,
  FormMessage,
  FormControl,
  FormLabel,
  FormField,
  FormItem,
  Form,
} from "./ui/form";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/app/store/store";
import { resetStack, stackPage } from "@/app/store/pageSlice";
import { Page, PageLocator } from "@/app/types/page";
import { v4 as uuidv4 } from "uuid";
import { useWebsocket } from "@/hooks/useWebsocket";
import { zodResolver } from "@hookform/resolvers/zod";
import { Room, User } from "@/types/types";
import { toastError } from "./toastError";
import { saveRoom } from "@/app/store/chatSlice";
import { MdCheck } from "react-icons/md";
import { useForm } from "react-hook-form";
import { message } from "@/app/clients/messageClient";
import { addRoom } from "@/app/store/roomSlice";
import { Input } from "./ui/input";
import { z } from "zod";

const formSchema = z.object({
  name: z.string().nonempty({ message: "Group Name cannot be empty" }),
});

function NewGroupForm({ selectedContacts }: { selectedContacts: User[] }) {
  const websocket = useWebsocket();
  const dispatch = useDispatch<AppDispatch>();
  const loggedInUser = useSelector((state: RootState) => state.user.user);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const roomRef = uuidv4();

      const payload = {
        referenceNumber: roomRef,
        type: "GROUP",
        name: values.name,
        participants: [...selectedContacts, loggedInUser],
        createdAt: null,
        updatedAt: null,
        lastMessage: null,
      } as Room;

      // 1. create room
      const response = await message.post(`/rooms/new-group`, payload);
      const newRoom = response.data as Room;

      if (!newRoom.referenceNumber) return;

      // 2. add the new room
      dispatch(addRoom(newRoom));

      // 3. open the new room in the window.
      dispatch(saveRoom(newRoom));

      // 5. notify the participants about the new room.
      websocket.postGroup(newRoom);

      // 6. let the user subscribe to the new room (inside web socket provider).

      dispatch(
        resetStack({
          stack: "rooms",
          defaultPage: { name: "room", import: "@/component/Rooms" } as Page,
        } as PageLocator),
      );
      dispatch(
        stackPage({
          stack: "window",
          page: { name: "window", import: "@/components/Window" } as Page,
        } as PageLocator),
      );
    } catch (error) {
      toastError(error);
    }
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="container">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-10"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group Name</FormLabel>
                  <FormControl>
                    <Input
                      autoComplete="off"
                      placeholder="Group name"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    enter a name for your group chat.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-center">
              <button className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg hover:bg-emerald-600 active:scale-95 transition">
                <MdCheck size={30} />
              </button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}

export default NewGroupForm;
