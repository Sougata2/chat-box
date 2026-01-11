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
import { v4 as uuidv4 } from "uuid";
import { FaArrowLeft } from "react-icons/fa6";
import { zodResolver } from "@hookform/resolvers/zod";
import { toastError } from "./toastError";
import { selectRoom } from "@/app/store/chatSlice";
import { MdCheck } from "react-icons/md";
import { useForm } from "react-hook-form";
import { Input } from "./ui/input";
import { chat } from "@/app/clients/chatClient";
import { User } from "@/app/types/user";
import { z } from "zod";

const formSchema = z.object({
  groupName: z.string().nonempty({ message: "Group Name cannot be empty" }),
});

function NewGroupForm({
  selectedContacts,
  closeWindow,
}: {
  selectedContacts: User[];
  closeWindow: () => void;
}) {
  const dispatch = useDispatch<AppDispatch>();
  const loggedInUser = useSelector((state: RootState) => state.user.user);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      groupName: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      if (!loggedInUser) return;
      const participants = selectedContacts.map((sc) => ({ email: sc.email }));
      participants.push({ email: loggedInUser?.email });
      const payload = { ...values, referenceNumber: uuidv4(), participants };
      const response = await chat.post("/rooms/new-group", payload);
      dispatch(selectRoom({ ...response.data, uuids: [], messages: {} }));
    } catch (error) {
      toastError(error);
    }
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="py-4 px-4 flex gap-5 items-center shrink-0">
        <FaArrowLeft
          size={20}
          className="cursor-pointer"
          onClick={closeWindow}
        />
        <div className="text-lg font-semibold">New Group</div>
      </div>
      <div className="container">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-10"
          >
            <FormField
              control={form.control}
              name="groupName"
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
