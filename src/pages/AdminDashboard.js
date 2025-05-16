import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaSignOutAlt } from "react-icons/fa";
import DoctorList from "../components/DoctorList";
import { deleteDoctor, getDoctorsByStatus } from "../services/doctorService";
import { getAdminInfo } from "../services/adminService"; // Yeni API fonksiyonu
import "./AdminDashboard.css";

const AdminDashboard = ({ onLogout }) => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [doctorStatus, setDoctorStatus] = useState("all");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");

  useEffect(() => {
    // Admin bilgilerini backend'den al
    const fetchAdminInfo = async () => {
      try {
        const response = await getAdminInfo(); // Yeni API çağrısı
        if (response.data) {
          setAdminName(response.data.name);
          setAdminEmail(response.data.email);
        }
      } catch (error) {
        console.error("Admin bilgisi alınırken hata oluştu:", error);
      }
    };

    fetchAdminInfo();

    // Doktorları listeleme fonksiyonu
    const fetchDoctors = async () => {
      try {
        const response = await getDoctorsByStatus(doctorStatus);
        setDoctors(response.data || []);
      } catch (error) {
        alert("Doktorlar alınırken bir hata oluştu");
        console.error("Error:", error);
      }
    };

    fetchDoctors();
  }, [doctorStatus]);

  const handleLogout = () => {
    localStorage.removeItem("adminInfo"); // Çıkış yaparken admin bilgilerini temizle
    onLogout();
    navigate("/login/admin");
  };

  return (
    <div className="doctor-dashboard">
      <header className="dashboard-header">
        <div className="admin-info">
          <p><strong>Admin:</strong> {adminName || "Bilinmiyor"}</p>
          <p><strong>Email:</strong> {adminEmail || "Bilinmiyor"}</p>
        </div>

        <div className="header-title-container">
          <h1>Admin Dashboard</h1>
        </div>

        <button className="logout-button" onClick={handleLogout}>
          <FaSignOutAlt /> Çıkış Yap
        </button>
      </header>

      <div className="dashboard-content">
        <div className="tab-content">
          <button onClick={() => navigate("/patients")} className="patients-button">
            Hastalar
          </button>

          <DoctorList
            doctors={doctors}
            onEdit={(doctor) => navigate(`/edit-doctor/${doctor.doctorID}`, { state: { doctor } })}
            onDelete={async (doctorId) => {
              if (window.confirm("Bu doktoru silmek istediğinizden emin misiniz?")) {
                try {
                  await deleteDoctor(doctorId);
                  setDoctors(doctors.filter((doctor) => doctor.doctorID !== doctorId));
                  alert("Doktor başarıyla silindi!");
                } catch (error) {
                  alert("Doktor silinirken bir hata oluştu!");
                  console.error("Error:", error);
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
