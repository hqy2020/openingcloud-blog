import axios from "axios";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api",
  timeout: 10000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

function readCookie(name: string) {
  const pair = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));
  return pair ? decodeURIComponent(pair.split("=")[1]) : "";
}

apiClient.interceptors.request.use((config) => {
  const method = (config.method ?? "get").toLowerCase();
  if ([ "post", "put", "patch", "delete" ].includes(method)) {
    const csrfToken = readCookie("csrftoken");
    if (csrfToken) {
      config.headers["X-CSRFToken"] = csrfToken;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || "Request failed";
    return Promise.reject(new Error(message));
  },
);
