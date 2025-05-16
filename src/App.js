import axios from "axios";
import React, { useEffect, useState } from "react";
import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { loginAdmin, loginDoctor } from "./api/axiosConfig";
import "./App.css";
import AccountInfo from "./pages/AccountInfo";
import { jwtDecode } from "jwt-decode";

// Sayfa bileşenleri
import AdminDashboard from "./pages/AdminDashboard";
import DoctorForum from "./pages/DoctorForum";
import Home from "./pages/Home";
import LoginAdmin from "./pages/LoginAdmin";
import LoginDoctor from "./pages/LoginDoctor";
import Notifications from "./pages/Notifications";
import PatientEdit from "./pages/PatientEdit";
import PatientInfo from "./pages/PatientInfo";
import PatientSearch from "./pages/PatientSearch";
import PatientView from "./pages/PatientView";
import Register from "./pages/Register";
import { PatientManagement } from "./components/PatientManagement";
import EditDoctorPage from "./pages/EditDoctorPage";
import AddVisit from "./pages/AddVisit";
import AIConsult from './pages/AIConsult';

const App = () => {
  const [activeTab, setActiveTab] = useState(1);
  const [userInfo, setUserInfo] = useState({ name: "", email: "" });
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isDoctorLoggedIn, setIsDoctorLoggedIn] = useState(false);

  useEffect(() => {
    // Giriş bilgilerini kontrol et
    setIsAdminLoggedIn(localStorage.getItem("isAdminLoggedIn") === "true");
    setIsDoctorLoggedIn(localStorage.getItem("isDoctorLoggedIn") === "true");

    if (isDoctorLoggedIn) {
      fetchDoctorInfo();
    }
  }, [isDoctorLoggedIn]);

  const fetchDoctorInfo = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.error("Token bulunamadı, giriş yapılmamış!");
      return;
    }

    let doctorId = null;

    try {
      const decodedToken = jwtDecode(token);
      doctorId = decodedToken.sub;
    } catch (error) {
      console.error("Token çözümlenemedi:", error);
      return;
    }

    if (!doctorId) {
      console.error("Geçersiz doctorId, API isteği yapılmayacak.");
      return;
    }

    try {
      const response = await axios.get("http://localhost:5005/api/doctor/info", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUserInfo({
        name: response.data.name || "No Name",
        email: response.data.email || "No Email",
      });

      console.log("Doktor Bilgisi:", response.data);
    } catch (error) {
      console.error("Doktor bilgileri alınamadı:", error);
    }
  };

  const handleLogin = async (role, email, password) => {
    try {
      const loginFunction = role === "admin" ? loginAdmin : loginDoctor;
      const response = await loginFunction(`/api/${role}/login`, { Email: email, Password: password });

      if (response.data.success) {
        if (role === "admin") {
          setIsAdminLoggedIn(true);
          localStorage.setItem("isAdminLoggedIn", "true");
        } else {
          setIsDoctorLoggedIn(true);
          localStorage.setItem("isDoctorLoggedIn", "true");
        }
        alert(`${role === "admin" ? "Admin" : "Doctor"} Login Successful`);
      } else {
        alert(response.data.message || "Invalid login details.");
      }
    } catch (error) {
      console.error(`${role} login error:`, error);
      alert(`${role === "admin" ? "Admin" : "Doctor"} login error.`);
    }
  };

  const handleLogout = (role) => {
    if (role === "admin") {
      setIsAdminLoggedIn(false);
      localStorage.setItem("isAdminLoggedIn", "false");
    } else {
      setIsDoctorLoggedIn(false);
      localStorage.setItem("isDoctorLoggedIn", "false");
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 1:
        return <PatientInfo />;
      case 2:
        return <PatientSearch />;
      case 3:
        return <DoctorForum />;
      case 4:
        return <AccountInfo />;
      case 5:
        return <Notifications />;
      default:
        return <PatientInfo />;
    }
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />

        {/* Doktor Girişi */}
        <Route
          path="/login/doctor"
          element={<LoginDoctor onLogin={(email, password) => handleLogin("doctor", email, password)} />}
        />

        {/* Hasta Yönetimi */}
        <Route path="/patients" element={<PatientManagement />} />

        {/* Hasta Düzenleme ve Görüntüleme */}
        <Route path="/view-patient/:id" element={<PatientView />} />
        <Route path="/add-visit/:id" element={<AddVisit />} />
        <Route path="/edit-patient/:id" element={<PatientEdit />} />
        <Route path="/ai-consult" element={<AIConsult />} />
        <Route path="/patient/:id" element={<PatientView />} />
        <Route path="/doctorForum" element={<DoctorForum />} />

        {/* Doktor Forum Tekil Post */}
        <Route path="/doctorForum/:postId" element={<DoctorForum />} />  {/*  BURAYA EKLEDİM */}

        <Route path="/notifications" element={<Notifications />} />

        {/* Doktor Paneli */}
        <Route
          path="/doctor-dashboard"
          element={isDoctorLoggedIn ? (
            <div>
              <header className="dashboard-header">
                <h1>Doktor Paneli</h1>
                <div className="user-info-box">
                  <span>{userInfo.name}</span>
                  <span>{userInfo.email}</span>
                </div>
                <button className="logout-button" onClick={() => handleLogout("doctor")}>
                  Çıkış Yap
                </button>
              </header>

              <div className="dashboard-content">
                <div className="tab-container">
                  <button onClick={() => setActiveTab(1)} className={activeTab === 1 ? "active" : ""}>Hasta Ekle</button>
                  <button onClick={() => setActiveTab(2)} className={activeTab === 2 ? "active" : ""}>Hasta Kayıtları</button>
                  <button onClick={() => setActiveTab(3)} className={activeTab === 3 ? "active" : ""}>Doktor Forumu</button>
                  <button onClick={() => setActiveTab(4)} className={activeTab === 4 ? "active" : ""}>Hesap Bilgileri</button>
                  <button onClick={() => setActiveTab(5)} className={activeTab === 5 ? "active" : ""}>Bildirimler</button>
                </div>
                <div className="tab-content">{renderTabContent()}</div>
              </div>
            </div>
          ) : (
            <Navigate to="/login/doctor" />
          )}
        />

        {/* Admin Girişi */}
        <Route
          path="/login/admin"
          element={<LoginAdmin onLogin={(email, password) => handleLogin("admin", email, password)} />}
        />

        {/* Admin Paneli */}
        <Route
          path="/admin"
          element={isAdminLoggedIn ? <Navigate to="/admin-dashboard" /> : <Navigate to="/login/admin" />}
        />
        <Route
          path="/admin-dashboard"
          element={isAdminLoggedIn ? <AdminDashboard onLogout={() => handleLogout("admin")} /> : <Navigate to="/login/admin" />}
        />
        <Route path="/edit-doctor/:doctorId" element={<EditDoctorPage />} />

        {/* Kayıt Sayfası */}
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  );
};

export default App;