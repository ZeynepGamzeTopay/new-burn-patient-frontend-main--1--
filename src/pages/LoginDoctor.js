import React, { useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { loginDoctor } from "../api/axiosConfig";
import "./LoginDoctor.css";

const LoginDoctor = ({ onLogin }) => {
  const [formData, setFormData] = useState({ Email: "", Password: "" });
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  // Input alanındaki değişiklikleri handle eden fonksiyon
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  // Giriş işlemini handle eden fonksiyon
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
  
    if (!formData.Email || !formData.Password) {
      setError("Email ve Şifre alanları doldurulmalıdır.");
      return;
    }
  
    try {
      const response = await loginDoctor("/api/doctor/login", formData);
  
      if (response.data?.success) {
        const token = response.data?.token;
        localStorage.setItem("token", token);
        localStorage.setItem("isDoctorLoggedIn", "true");
  
        setSuccessMessage("Giriş başarılı! Doktor paneline yönlendiriliyorsunuz.");
        setTimeout(() => {
          navigate("/doctor-dashboard");
        }, 2000);
      } else {
        setError(response.data?.message || "Geçersiz giriş bilgileri.");
      }
    } catch (error) {
      setError(error.response?.data?.message || "Bağlantı hatası oluştu.");
    }
  };
  

  // Geri dönme fonksiyonu
  const handleGoBack = () => {
    navigate("/"); // Home.js'ye yönlendirme
  };

  return (
    <div className="login-container">
      <div className="back-button" onClick={handleGoBack}>
        <FaArrowLeft size={24} color="#1E2A47" /> Geri Dön
      </div>
      <h2>Doktor Girişi</h2>
      {error && <div className="error">{error}</div>}
      {successMessage && <div className="success">{successMessage}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="email"
            name="Email"
            placeholder="Email"
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

export default LoginDoctor;