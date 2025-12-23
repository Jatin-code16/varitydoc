import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

api.interceptors.request.use(
  (config) => {
    // 🔑 DO NOT attach token for login
    if (config.url === "/login") {
      return config;
    }

    const auth = localStorage.getItem("docvault.auth");
    if (auth) {
      const parsed = JSON.parse(auth);
      if (parsed?.access_token) {
        config.headers.Authorization = `Bearer ${parsed.access_token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
