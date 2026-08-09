import { axiosClient } from "./axiosClient";
import type { LoginCredentials, LoginResponse } from "../types";

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const { data } = await axiosClient.post<LoginResponse>(
      "/Auth/Login", 
      credentials,
    );
    return data;
  },
};
