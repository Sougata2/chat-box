import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function Home() {
  const token = (await cookies()).get("Authorization")?.value;
  if (!token) {
    return redirect("/sign-in");
  }
  return redirect("/chat");
}
