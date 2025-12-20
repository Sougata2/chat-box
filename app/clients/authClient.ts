import axios from "axios";

export const auth = axios.create({
  baseURL: "http://localhost:8080/auth-service",
});
