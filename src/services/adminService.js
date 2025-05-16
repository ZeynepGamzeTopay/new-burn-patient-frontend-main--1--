import axios from "axios";

export const getAdminInfo = async () => {
  const token = localStorage.getItem("token"); // Admin giriş token'ı
  return await axios.get("http://localhost:5005/api/admin/info", {
    headers: { Authorization: `Bearer ${token}` },
  });
};
