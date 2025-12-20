import { InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie";

export const requestPredicate = (config: InternalAxiosRequestConfig) => {
  const token = Cookies.get("Authorization");
  config.headers.set("Authorization", token);
  return config;
};
