import { InternalAxiosRequestConfig } from "axios";
import { store } from "../store/store";

export const requestPredicate = (config: InternalAxiosRequestConfig) => {
  const token = store.getState().user.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.withCredentials = true;
  return config;
};
