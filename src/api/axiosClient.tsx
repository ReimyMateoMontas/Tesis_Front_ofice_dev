import axios from "axios";
import { isTokenExpired } from "../utils/tokenUtils";

export const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "https://localhost:7290/api",
  headers: { "Content-Type": "application/json" },
});

axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      if (isTokenExpired(token)) {
        localStorage.removeItem("token");
        localStorage.removeItem("auth-user");
        window.location.href = "/login";
        return Promise.reject(new Error("Token expirado"));
      }
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const url: string = error.config?.url ?? "";

    const esRutaAuthPublica =
      /\/auth\/(login|recuperar-password|restablecer-password|verificar-reset|activar)/i.test(
        url,
      );

    if (error.response?.status === 401 && !esRutaAuthPublica) {
      localStorage.removeItem("token");
      localStorage.removeItem("auth-user");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  },
);
