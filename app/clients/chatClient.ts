import axios from "axios";
import { requestPredicate } from "./predicates";

export const chat = axios.create({
  baseURL: "http://localhost:8080/chat-service",
});

chat.interceptors.request.use((config) => requestPredicate(config));
