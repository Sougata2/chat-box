import axios from "axios";

export const auth = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_SERVER_URL}/auth-service`,
});
