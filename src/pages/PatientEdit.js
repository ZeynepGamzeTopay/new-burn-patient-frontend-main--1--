import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const PatientEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const response = await fetch(`http://localhost:5005/api/Patient/${id}`);
        if (!response.ok) throw new Error("Hasta bilgileri alınırken hata oluştu.");
        const data = await response.json();
        setPatient(data);
      } catch (error) {
        console.error("Bilgi alınırken hata:", error);
      }
    };

    fetchPatient();
  }, [id]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5005/api/Patient/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patient),
      });
      if (!response.ok) throw new Error("Hasta bilgileri güncellemede hata.");
      alert("Hasta bilgileri başarıyla güncellendi.");
      navigate("/doctor-dashboard");
    } catch (error) {
      console.error("Hasta bilgilerini kaydederken hata:", error);
    }
  };

  const handleCancel = () => {
    navigate("/doctor-dashboard");
  };

  if (!patient) return <div>Yükleniyor...</div>;

  return (
    <div style={styles.container}>
      <h2>Hasta Bilgilerini Düzenle</h2>
      <form onSubmit={handleSave} style={styles.form}>
        <label style={styles.label}>Ad:</label>
        <input
          type="text"
          value={patient.name}
          onChange={(e) => setPatient({ ...patient, name: e.target.value })}
          style={styles.input}
        />
        <label style={styles.label}>Age:</label>
        <input
          type="number"
          value={patient.age}
          onChange={(e) => setPatient({ ...patient, age: e.target.value })}
          style={styles.input}
        />
        <label style={styles.label}>Cinsiyet:</label>
        <input
          type="text"
          value={patient.gender}
          onChange={(e) => setPatient({ ...patient, gender: e.target.value })}
          style={styles.input}
        />
        <label style={styles.label}>Tıbbi Geçmiş:</label>
        <textarea
          value={patient.medicalHistory}
          onChange={(e) =>
            setPatient({ ...patient, medicalHistory: e.target.value })
          }
          style={styles.textarea}
        />
        <div style={styles.buttonContainer}>
          <button type="submit" style={styles.saveButton}>
            Değişiklikleri Kaydet
          </button>
          <button type="button" onClick={handleCancel} style={styles.cancelButton}>
            İptal
          </button>
        </div>
      </form>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    marginTop: "20px",
    padding: "10px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    width: "80%",
    maxWidth: "500px",
  },
  label: {
    fontSize: "16px",
    fontWeight: "bold",
    marginBottom: "5px",
  },
  input: {
    padding: "8px",
    fontSize: "14px",
    borderRadius: "4px",
    border: "1px solid #ddd",
  },
  textarea: {
    padding: "8px",
    fontSize: "14px",
    borderRadius: "4px",
    border: "1px solid #ddd",
    minHeight: "100px",
    width: "100%", // Make it occupy the full width of the form
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "15px",
  },
  saveButton: {
    backgroundColor: "#007bff",
    color: "white",
    padding: "10px 20px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  cancelButton: {
    backgroundColor: "#dc3545",
    color: "white",
    padding: "10px 20px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
};

export default PatientEdit;
