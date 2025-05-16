import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5005",
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);


export const loginAdmin = (url, data) => api.post(url, data);
export const loginDoctor = (url, data) => api.post(url, data);

export default api;
