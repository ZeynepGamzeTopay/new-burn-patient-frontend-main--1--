import React from "react";
import { Link } from "react-router-dom";
import "./Home.css";

const Home = () => {
  return (
    <div className="home-container">
      <h1>Hoş Geldiniz</h1>
      <p>Yanık tedavi ve tanı sistemine giriş yapın!</p>
      <div className="button-group">
        <button onClick={() => window.location.href = "/login/doctor"}>
          Doktor Girişi
        </button>
        <button onClick={() => window.location.href = "/login/admin"}>
          Admin Girişi
        </button>
      </div>
      <p>
        Hesabınız yok mu? <Link to="/register">Kayıt olun</Link>
      </p>
    </div>
  );
};

export default Home;
