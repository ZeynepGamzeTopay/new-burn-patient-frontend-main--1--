import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { updateDoctor } from "../services/doctorService";
import "./EditDoctorPage.css"; // CSS dosyasını ekledik

const EditDoctorPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(state?.doctor || {});

  useEffect(() => {
    if (!state?.doctor) {
      navigate("/admin-dashboard");
    }
  }, [state, navigate]);

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      const response = await updateDoctor(doctor.doctorID, doctor);
      console.log("API Yanıtı:", response);

      if (response.success) {
        alert("Doktor başarıyla güncellendi!");
        setTimeout(() => {
          navigate("/admin-dashboard");
        }, 2000);
      } else {
        alert(response.message || "Bir hata oluştu!");
      }
    } catch (error) {
      alert("Doktor güncellenirken bir hata oluştu!");
      console.error("Hata:", error);
    }
  };

  return (
    <div className="edit-doctor-container">
      <button className="back-button" onClick={() => navigate(-1)}>Geri Dön</button>
      <div className="edit-doctor-page">
        <h1>Doktor Düzenle</h1>
        <form onSubmit={handleSave}>
          <input
            type="text"
            value={doctor.name}
            onChange={(e) => setDoctor({ ...doctor, name: e.target.value })}
            placeholder="Doktor Adı"
          />
          <input
            type="email"
            value={doctor.email}
            onChange={(e) => setDoctor({ ...doctor, email: e.target.value })}
            placeholder="Doktor E-posta"
          />
          <select
            value={doctor.verified}
            onChange={(e) =>
              setDoctor({
                ...doctor,
                verified: e.target.value === "true",
              })
            }
          >
            <option value="true">Onaylı</option>
            <option value="false">Onay Bekleyen</option>
          </select>
          <button type="submit">Kaydet</button>
        </form>
      </div>
    </div>
  );
};

export default EditDoctorPage;
