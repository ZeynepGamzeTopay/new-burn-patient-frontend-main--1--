import axios from 'axios';

const API_BASE_URL = 'http://localhost:5005/api'; // Backend API'nin temel URL'si

// Doktorları getirme
export const getDoctors = async () => {
  return await axios.get(`${API_BASE_URL}/doctor`); // adminID parametresi gerekmiyor!
};



// Doktorları status'e göre getirme (yeni fonksiyon)
export const getDoctorsByStatus = async (status) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/doctor/status`, { params: { status } });
    return response.data; 
  } catch (error) {
    console.error("Error fetching doctors by status:", error);
    return [];
  }
};
// Doktor bilgilerini güncelleme
export const updateDoctor = async (doctorID, doctorData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/doctor/${doctorID}`, doctorData);
    console.log("Update Response:", response); // API yanıtını kontrol et

    if (response.status === 200 || response.status === 204) {
      return { success: true, data: response.data };
    } else {
      return { success: false, message: "Güncelleme başarısız!" };
    }
  } catch (error) {
    console.error("Update Error:", error);
    return { success: false, message: "Sunucu hatası!" };
  }
};

export const getDoctorsByAdmin = async (adminId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/doctor/assigned/${adminId}`);
    return response.data; 
  } catch (error) {
    console.error("Error fetching doctors by admin:", error);
    return [];
  }
};


// Doktoru silme
export const deleteDoctor = async (doctorID) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/doctor/${doctorID}`);
    return response.status === 204 
      ? { success: true } 
      : { success: false, message: "Delete failed!" };
  } catch (error) {
    console.error("Delete Error:", error);
    return { success: false, message: "Server error!" };
  }
};