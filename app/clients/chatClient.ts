import axios from "axios";
import { requestPredicate, responsePredicate } from "./predicates";

export const chat = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_SERVER_URL}/chat-service`,
});

chat.interceptors.request.use(
  (config) => requestPredicate(config),
  Promise.reject,
);

chat.interceptors.response.use((response) => response, responsePredicate);
