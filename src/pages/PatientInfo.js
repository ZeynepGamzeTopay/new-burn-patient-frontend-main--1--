import React, { useState } from "react";
import axios from "axios";
import "./BurnForm.css";

const BurnForm = () => {
  const [formData, setFormData] = useState({
    patientName: "",
    email: "",
    age: "",
    gender: "",
    burnCause: "",
    burnArea: "",
    hospitalArrivalDate: "",
    burnOccurrenceDate: "",
    burnOccurrenceTime: "",
  });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const burnCauses = [
    "Isı ile",
    "Işın ile",
    "Elektrik nedeniyle",
    "Sürtünmeye bağlı",
    "Donma sonucu oluşan",
    "Asit ve alkali madde teması",
  ];

  const burnAreas = [
    "Baş",
    "Boyun",
    "Göğüs",
    "Kalça",
    "Genital",
    "Ayak",
    "El",
    "Kol",
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    setPhoto(file);

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      const formPayload = new FormData();
      formPayload.append("PatientName", formData.patientName);
      formPayload.append("Email", formData.email);
      formPayload.append("Age", formData.age);
      formPayload.append("Gender", formData.gender);
      formPayload.append("BurnCause", formData.burnCause);
      formPayload.append("BurnArea", formData.burnArea);
      formPayload.append("HospitalArrivalDate", new Date(formData.hospitalArrivalDate).toISOString());
      formPayload.append("BurnOccurrenceDate", new Date(formData.burnOccurrenceDate).toISOString());
      formPayload.append("BurnOccurrenceTime", formData.burnOccurrenceTime);

      if (photo) {
        formPayload.append("Photo", photo);
      }

      const response = await axios.post("http://localhost:5005/api/burnform", formPayload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessage({ type: "success", text: "Kayıt başarılı!" });

      setFormData({
        patientName: "",
        email: "",
        age: "",
        gender: "",
        burnCause: "",
        burnArea: "",
        hospitalArrivalDate: "",
        burnOccurrenceDate: "",
        burnOccurrenceTime: "",
      });
      setPhoto(null);
      setPhotoPreview(null);
    } catch (error) {
      console.error("Form gönderimi sırasında hata:", error);
      setMessage({ type: "error", text: "Form gönderimi başarısız oldu. Lütfen tekrar deneyin." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="burn-form-container">
      <h2>Yanık Formu</h2>
      {message.text && <div className={`message ${message.type}`}>{message.text}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Hastanın Adı:</label>
          <input type="text" name="patientName" value={formData.patientName} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Hastanın E-posta Adresi:</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Yaşı:</label>
          <input type="number" name="age" value={formData.age} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Cinsiyeti:</label>
          <select name="gender" value={formData.gender} onChange={handleChange} required>
            <option value="">Seçiniz</option>
            <option value="Erkek">Erkek</option>
            <option value="Kadın">Kadın</option>
          </select>
        </div>
        <div className="form-group">
          <label>Yanık Nedeni:</label>
          <select name="burnCause" value={formData.burnCause} onChange={handleChange} required>
            <option value="">Seçiniz</option>
            {burnCauses.map((cause, index) => (
              <option key={index} value={cause}>{cause}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Yanık Bölgesi:</label>
          <select name="burnArea" value={formData.burnArea} onChange={handleChange} required>
            <option value="">Seçiniz</option>
            {burnAreas.map((area, index) => (
              <option key={index} value={area}>{area}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Hastaneye Gelme Tarihi:</label>
          <input type="date" name="hospitalArrivalDate" value={formData.hospitalArrivalDate} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Yanık Oluşma Tarihi ve Saati:</label>
          <input type="date" name="burnOccurrenceDate" value={formData.burnOccurrenceDate} onChange={handleChange} required />
          <input type="time" name="burnOccurrenceTime" value={formData.burnOccurrenceTime} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Yanık Fotoğrafı:</label>
          <input type="file" accept="image/*" onChange={handlePhotoChange} />
        </div>
        {photoPreview && <div className="photo-preview"><img src={photoPreview} alt="Önizleme" /></div>}
        <div className="form-group">
          <button type="submit" disabled={isSubmitting}>{isSubmitting ? "Gönderiliyor..." : "Kaydet"}</button>
        </div>
      </form>
    </div>
  );
};

export default BurnForm;
