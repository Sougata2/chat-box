import { AxiosError, InternalAxiosRequestConfig } from "axios";
import { resetUser, setAuth } from "../store/userSlice";
import { store } from "../store/store";
import { auth } from "./authClient";
import { User } from "../types/user";

import axios from "axios";

let isRefreshing: boolean = false;
let failedQueue: {
  resolve: (token: string) => void;
  reject: (error: AxiosError) => void;
}[] = [];

const processQueue = (error: AxiosError | null, token: string | null) => {
  failedQueue.forEach((p) => {
    if (error) {
      p.reject(error);
    } else {
      p.resolve(token!);
    }
  });
  failedQueue = [];
};

export const requestPredicate = (config: InternalAxiosRequestConfig) => {
  const token = store.getState().user.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.withCredentials = true;
  return config;
};

export const responsePredicate = async (error: AxiosError) => {
  const originalRequest = error.config as InternalAxiosRequestConfig & {
    _retry?: boolean;
  };

  if (error.response?.status === 401 && !originalRequest._retry) {
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(axios(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const response = await auth.post("/auth/refresh");

      const { token, expiration, email, firstName, lastName } = response.data;

      store.dispatch(
        setAuth({
          accessToken: token,
          expireAt: expiration,
          user: { email, firstName, lastName } as User,
        }),
      );

      processQueue(null, token);

      originalRequest.headers.Authorization = `Bearer ${token}`;
      return axios(originalRequest);
    } catch (err) {
      processQueue(err as AxiosError, null);
      store.dispatch(resetUser());
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }

  return Promise.reject(error);
};
