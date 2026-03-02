import axios from "axios";
import { requestPredicate, responsePredicate } from "./predicates";

export const message = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_SERVER_URL}/message-service`,
});

message.interceptors.request.use(
  (config) => requestPredicate(config),
  Promise.reject,
);

message.interceptors.response.use((response) => response, responsePredicate);
