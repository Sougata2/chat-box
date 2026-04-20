import axios from "axios";
import { requestPredicate, responsePredicate } from "./predicates";

export const notification = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_SERVER_URL}/notification-service`,
});

notification.interceptors.request.use(
  (config) => requestPredicate(config),
  Promise.reject,
);

notification.interceptors.response.use(
  (response) => response,
  responsePredicate,
);
