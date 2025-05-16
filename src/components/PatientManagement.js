import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Sayfa yönlendirme için
import { FaArrowLeft } from "react-icons/fa"; // Geri dön ikonu
import { PatientList } from "./PatientList";
import axios from "axios";

export function PatientManagement() {
  const [patients, setPatients] = useState([]);
  const navigate = useNavigate(); // Kullanıcıyı yönlendirmek için

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await axios.get("http://localhost:5005/api/Patient");
      setPatients(response.data);
    } catch (error) {
      console.error("Error fetching patients:", error);
      alert("Hastalar yüklenirken bir hata oluştu.");
    }
  };

  const handleEdit = async (id, updatedData) => {
    if (!id) {
      alert("Hasta ID'si eksik.");
      return;
    }

    try {
      await axios.put(`http://localhost:5005/api/Patient/${id}`, updatedData);
      alert("Hasta başarıyla güncellendi.");
      fetchPatients(); // Listeyi yenile
    } catch (error) {
      console.error("Error updating patient:", error);
      alert("Hasta güncellenirken bir hata oluştu.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5005/api/Patient/${id}`);
      alert("Hasta başarıyla silindi.");
      setPatients((prev) => prev.filter((patient) => patient.PatientID !== id));
    } catch (error) {
      console.error("Error deleting patient:", error);
      alert("Hasta silinirken bir hata oluştu.");
    }
  };

  return (
    <div className="container mx-auto p-6">
      <button className="back-button" onClick={() => navigate(-1)}>
        <FaArrowLeft /> Geri Dön
      </button>

      <h1 className="text-2xl font-bold mb-4">Hasta Yönetimi</h1>

      <PatientList patients={patients} onEdit={handleEdit} onDelete={handleDelete} />
    </div>
  );
}
