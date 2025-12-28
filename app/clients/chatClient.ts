import axios from "axios";
import { requestPredicate } from "./predicates";

export const chat = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_SERVER_URL}/chat-service`,
});

chat.interceptors.request.use((config) => requestPredicate(config));
