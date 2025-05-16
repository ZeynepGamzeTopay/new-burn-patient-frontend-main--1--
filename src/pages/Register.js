import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import "./Register.css";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.password) {
      setError("Ad, E-posta ve Şifre alanları zorunludur.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5005/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Kayıt başarısız.");
      }

      // Token'ı localStorage'a kaydet
      if (result.token) {
        localStorage.setItem("token", result.token);
      }

      alert("Kayıt başarılı! Admin onayını bekleyin.");
      navigate("/"); 
    } catch (error) {
      console.error("Kayıt işlemi sırasında bir hata oluştu:", error);
      setError(error.message);
    }
  };

  return (
    <div className="register-container">
      <div className="back-button" onClick={() => navigate(-1)}>
        <FaArrowLeft size={24} color="#1E2A47" /> Geri Dön
      </div>
      <h2>Kayıt Ol</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Ad"
          value={formData.name}
          onChange={handleInputChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="E-posta"
          value={formData.email}
          onChange={handleInputChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Şifre"
          value={formData.password}
          onChange={handleInputChange}
          required
        />
        <button type="submit">Kayıt Ol</button>
      </form>
    </div>
  );
};

export default Register;
