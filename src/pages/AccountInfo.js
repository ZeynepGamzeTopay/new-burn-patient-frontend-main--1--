import React, { useEffect, useState } from "react";

const AccountInfo = () => {
  const [doctorInfo, setDoctorInfo] = useState({
    name: "",
    email: "",
    password: "",  // Backend'den şifreyi boş alacağız
  });

  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchDoctorInfo = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("Token bulunamadı! Kullanıcı giriş yapmamış olabilir.");
        return;
      }
      try {
        const response = await fetch("http://localhost:5005/api/doctor/info", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
  
        if (!response.ok) {
          throw new Error(`HTTP hata! Durum: ${response.status}`);
        }
  
        const data = await response.json();
        setDoctorInfo({
          doctorID: data.doctorID, // ID'yi alıp kaydet
          name: data.name,
          email: data.email,
          password: "", // Şifre backend'den gelmeyecek, kullanıcı yeni şifre girecek
        });
      } catch (error) {
        console.error("Doktor bilgileri alınamadı:", error);
      }
    };
  
    fetchDoctorInfo();
  }, []);
  

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDoctorInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!doctorInfo.doctorID) {
      setMessage("Doktor kimliği bulunamadı.");
      return;
    }
  
    const updateData = {
      name: doctorInfo.name,
      email: doctorInfo.email,
    };
  
    if (doctorInfo.password.trim() !== "") {
      updateData.password = doctorInfo.password;
    }
  
    try {
      const response = await fetch(`http://localhost:5005/api/doctor/update/${doctorInfo.doctorID}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(updateData),
      });
  
      if (response.ok) {
        setMessage("Bilgileriniz başarıyla güncellendi.");
        setDoctorInfo((prev) => ({ ...prev, password: "" })); // Güncelleme sonrası şifreyi sıfırla
      } else {
        setMessage("Güncelleme başarısız.");
      }
    } catch (error) {
      console.error("Güncelleme hatası:", error);
      setMessage("Güncelleme sırasında bir hata oluştu.");
    }
  };
  
  return (
    <div>
      <h2>Hesap Bilgileri</h2>
      {message && <p>{message}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Ad:</label>
          <input type="text" name="name" value={doctorInfo.name} onChange={handleInputChange} required />
        </div>
        <div>
          <label>E-posta:</label>
          <input type="email" name="email" value={doctorInfo.email} onChange={handleInputChange} required />
        </div>
        <div>
          <label>Yeni Şifre (isteğe bağlı):</label>
          <input type="password" name="password" value={doctorInfo.password} onChange={handleInputChange} />
        </div>
        <button type="submit">Bilgileri Güncelle</button>
      </form>
    </div>
  );
};

export default AccountInfo;
