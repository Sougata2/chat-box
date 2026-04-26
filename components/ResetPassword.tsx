"use client";

import {
  FormControl,
  FormMessage,
  FormField,
  FormLabel,
  FormItem,
  Form,
} from "@/components/ui/form";
import {
  FieldDescription,
  FieldSeparator,
  FieldGroup,
  Field,
} from "@/components/ui/field";
import { zodResolver } from "@hookform/resolvers/zod";
import { toastError } from "./toastError";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { auth } from "@/app/clients/authClient";
import { cn } from "@/lib/utils";
import { z } from "zod";

import Link from "next/link";

function ResetPassword({ className, ...props }: React.ComponentProps<"form">) {
  const router = useRouter();
  const formSchema = z
    .object({
      email: z.email().nonempty("Email cannot be empty"),
      currentPassword: z.string().nonempty("Current Password cannot be empty!"),
      newPassword: z.string().nonempty("New Password cannot be empty!"),
      confirmPassword: z.string().nonempty("Confirm password cannot be empty"),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "Password do not match",
      path: ["confirmPassword"],
    });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await auth.post("/auth/reset-password", values);
      toast.success(`Password has been Reset`);

      router.push("/chat/sign-in");
    } catch (error) {
      toastError(error);
    }
  }
  return (
    <Form {...form}>
      <form
        className={cn("flex flex-col gap-6", className)}
        {...props}
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <FieldGroup>
          <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="text-2xl font-bold">Reset your Password</h1>
            <p className="text-muted-foreground text-sm">
              Enter your credentials below to reset your password
            </p>
          </div>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="Email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="currentPassword"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                </div>

                <FormControl>
                  <Input placeholder="Password" {...field} type="password" />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />
          <FieldSeparator></FieldSeparator>
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>New Password</FormLabel>
                </div>

                <FormControl>
                  <Input placeholder="Password" {...field} type="password" />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Confirm Password</FormLabel>
                </div>

                <FormControl>
                  <Input placeholder="Password" {...field} type="password" />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />

          <Field>
            <Button type="submit">Reset Password</Button>
          </Field>
          <FieldSeparator>Or Login to you Account</FieldSeparator>
          <Field>
            <FieldDescription className="text-center">
              <Link href="/sign-in" className="underline underline-offset-4">
                Back to Login
              </Link>
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>
    </Form>
  );
}

export default ResetPassword;
