import { InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie";

export const requestPredicate = (config: InternalAxiosRequestConfig) => {
  const token = Cookies.get("Authorization");
  if (!token) {
    throw new Error("Login Required");
  }
  config.headers.set("Authorization", `Bearer ${token}`);
  return config;
};
