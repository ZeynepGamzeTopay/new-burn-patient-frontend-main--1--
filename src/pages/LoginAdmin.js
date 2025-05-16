import React, { useState, useEffect } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { loginAdmin } from "../api/axiosConfig"; // API call
import "./LoginAdmin.css";

const hashPassword = async (password) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  
  //  Uint8Array'den Base64'e doğru çeviri yapalım
  return btoa(String.fromCharCode(...new Uint8Array(hashBuffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};



const LoginAdmin = ({ onLogin }) => {
  const [formData, setFormData] = useState({ Email: "", Password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("isAdminLoggedIn") === "true") {
      navigate("/admin-dashboard");
    }
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
  
    if (!formData.Email || !formData.Password) {
      setError("Email ve Şifre alanları doldurulmalıdır.");
      return;
    }
  
    try {
      const hashedPassword = await hashPassword(formData.Password);
  
      const response = await loginAdmin("/api/admin/login", {
        Email: formData.Email,
        Password: hashedPassword,
      });
  
      if (response.data.success) {
        setError("");
        localStorage.setItem("isAdminLoggedIn", "true");
        localStorage.setItem("token", response.data.token); // Token'ı sakla
  
        setTimeout(() => {
          navigate("/admin-dashboard");
        }, 100);
      } else {
        setError(response.data.message || "Geçersiz giriş bilgileri.");
      }
    } catch (error) {
      console.error("Admin giriş hatası:", error);
      setError("Admin girişinde bir hata oluştu.");
    }
  };
  

  const handleGoBack = () => {
    navigate("/");
  };

  return (
    <div className="login-container">
      <div className="back-button" onClick={handleGoBack}>
        <FaArrowLeft size={24} color="#1E2A47" /> Ana Sayfaya Dön
      </div>
      <h2>Admin Girişi</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="email"
            name="Email"
            placeholder="E-posta"
            value={formData.Email}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="form-group">
          <input
            type="password"
            name="Password"
            placeholder="Şifre"
            value={formData.Password}
            onChange={handleInputChange}
            required
          />
        </div>
        <button type="submit">Giriş Yap</button>
      </form>
    </div>
  );
};

export default LoginAdmin;
