import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getDoctors, updateDoctor } from '../services/doctorService';
import { FaEdit, FaTrash } from 'react-icons/fa';

const DoctorList = ({ onDelete, onEdit }) => {
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [isTableVisible, setIsTableVisible] = useState(false);

  // Admin ID'yi oturumdan al
  const adminID = localStorage.getItem("adminID") || "defaultAdminID";

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await getDoctors(adminID); // API çağrısında adminID'yi ekleyerek sadece ilgili doktorları getir
        setDoctors(response.data);
      } catch (error) {
        console.error('Doktorlar alınırken hata oluştu:', error);
      }
    };

    fetchDoctors();
  }, [adminID]); // Admin ID değişirse doktor listesini yeniden al

  const showApprovedDoctors = () => {
    setFilteredDoctors(doctors.filter(doctor => doctor.verified === true));
    setIsTableVisible(true);
  };

  const showPendingDoctors = () => {
    setFilteredDoctors(doctors.filter(doctor => doctor.verified === false));
    setIsTableVisible(true);
  };

  const handleEdit = async (updatedDoctor) => {
    try {
      await updateDoctor(updatedDoctor.doctorID, updatedDoctor);
      setDoctors((prevDoctors) =>
        prevDoctors.map((doc) =>
          doc.doctorID === updatedDoctor.doctorID ? updatedDoctor : doc
        )
      );
      toast.success('Doktor başarıyla güncellendi!');
    } catch (error) {
      console.error('Doktor güncellenirken hata oluştu:', error);
      toast.error('Güncelleme sırasında bir hata oluştu.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Filtreleme Butonları */}
      <div className="mb-4">
        <button style={{ width: "400px", margin: "0 auto", marginBottom: "20px" }} 
          onClick={showApprovedDoctors} className="bg-blue-500 text-white px-4 py-2 rounded mr-2">
          Onaylı Doktorlar
        </button>
        <button style={{ width: "400px", margin: "0 auto" }} 
          onClick={showPendingDoctors} className="bg-orange-500 text-white px-4 py-2 rounded">
          Onay Bekleyen Doktorlar
        </button>
      </div>

      {/* Doktor Tablosu */}
      {isTableVisible && (
        <div className="overflow-x-auto">
          <table className="table-auto w-full text-center border-collapse border border-gray-300">
            <thead className="bg-gray-200">
              <tr>
                <th className="border border-gray-300 px-4 py-2 w-1/4">Adı</th>
                <th className="border border-gray-300 px-4 py-2 w-1/4">E-posta</th>
                <th className="border border-gray-300 px-4 py-2 w-1/4">Onay Durumu</th>
                <th className="border border-gray-300 px-4 py-2 w-1/4">Aksiyonlar</th>
              </tr>
            </thead>
            <tbody>
              {filteredDoctors.length > 0 ? (
                filteredDoctors.map((doctor) => (
                  <tr key={doctor.doctorID}>
                    <td className="border border-gray-300 px-4 py-2">{doctor.name}</td>
                    <td className="border border-gray-300 px-4 py-2">{doctor.email}</td>
                    <td className="border border-gray-300 px-4 py-2">{doctor.verified ? 'Onaylı' : 'Onay Bekliyor'}</td>
                    <td className="border border-gray-300 px-4 py-2">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => onEdit(doctor)}
                          className="bg-blue-500 text-white px-3 py-1 rounded"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => onDelete(doctor.doctorID)}
                          className="bg-red-500 text-white px-3 py-1 rounded"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center px-4 py-2">Hiç doktor bulunamadı.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DoctorList;
