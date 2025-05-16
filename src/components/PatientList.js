import React, { useState } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";

export function PatientList({ patients, onEdit, onDelete }) {
  const [editingPatient, setEditingPatient] = useState(null);

  const startEdit = (patient) => {
    if (!patient || !patient.patientID) {
      console.error("Hasta bilgisi eksik:", patient);
      alert("Düzenlenecek bir hasta seçilemedi.");
      return;
    }
    setEditingPatient({ ...patient });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditingPatient((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const saveEdit = async () => {
    if (!editingPatient || !editingPatient.patientID) {
      alert("Geçerli bir hasta seçilmedi.");
      return;
    }

    try {
      await onEdit(editingPatient.patientID, editingPatient);
      setEditingPatient(null);
    } catch (error) {
      console.error("Error updating patient:", error);
      alert("Hasta güncellenirken bir hata oluştu.");
    }
  };

  const cancelEdit = () => {
    setEditingPatient(null);
  };

  const handleDelete = (id) => {
    const isConfirmed = window.confirm("Bu hastayı silmek istediğinize emin misiniz?");
    if (isConfirmed) {
      onDelete(id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Düzenleme Formu */}
      {editingPatient && (
   <div className="flex justify-center items-center min-h-screen bg-gray-100">
   <div className="container max-w-xs mx-auto p-4 border rounded-lg shadow-md bg-white">
     <h2 className="text-lg font-bold mb-3 text-center">Hastayı Düzenle</h2>
 
     <div className="flex flex-col space-y-2 text-sm">
       <input type="text" name="name" value={editingPatient.name || ""} onChange={handleInputChange} 
         className="border rounded px-2 py-1 w-3/4 mx-auto text-sm" placeholder="Adı" />
         
       <input type="number" name="age" value={editingPatient.age || ""} onChange={handleInputChange} 
         className="border rounded px-2 py-1 w-3/4 mx-auto text-sm" placeholder="Yaşı" />
         
       <select name="gender" value={editingPatient.gender || ""} onChange={handleInputChange} 
         className="border rounded px-2 py-1 w-3/4 mx-auto text-sm">
         <option value="male">Erkek</option>
         <option value="female">Kadın</option>
         <option value="other">Diğer</option>
       </select>
         
       <input type="text" name="medicalHistory" value={editingPatient.medicalHistory || ""} onChange={handleInputChange} 
         className="border rounded px-2 py-1 w-1/4 mx-auto text-sm" placeholder="Tıbbi Geçmiş" />
         
       <input type="text" name="burnCause" value={editingPatient.burnCause || ""} onChange={handleInputChange} 
         className="border rounded px-2 py-1 w-1/4 mx-auto text-sm" placeholder="Yanık Nedeni" />
         
       <input type="date" name="admissionDate" value={editingPatient.admissionDate || ""} onChange={handleInputChange} 
         className="border rounded px-2 py-1 w-1/4 mx-auto text-sm" placeholder="Hastaneye Geliş Tarihi" />
         
       <input type="date" name="burnDate" value={editingPatient.burnDate || ""} onChange={handleInputChange} 
         className="border rounded px-2 py-1 w-1/4 mx-auto text-sm" placeholder="Yanık Oluş Tarihi" />
         
       <input type="text" name="photoPath" value={editingPatient.photoPath || ""} onChange={handleInputChange} 
         className="border rounded px-2 py-1 w-1/4 mx-auto text-sm" placeholder="Fotoğraf Yolu" />
         
       <input type="text" name="burnDepth" value={editingPatient.burnDepth || ""} onChange={handleInputChange} 
         className="border rounded px-2 py-1 w-1/4 mx-auto text-sm" placeholder="Yanık Derinliği" />
     </div>
 
     <div className="flex space-x-2 mt-3 justify-center">
       <button onClick={saveEdit} className="bg-green-500 text-white px-3 py-1 rounded text-sm">Kaydet</button>
       <button onClick={cancelEdit} className="bg-red-500 text-white px-3 py-1 rounded text-sm">İptal</button>
     </div>
   </div>
 </div>
 
 
      
      
      )}

      {/* Hasta Listesi */}
      <div className="overflow-x-auto">
        <table className="table-auto w-full text-center border-collapse border border-gray-300">
          <thead className="bg-gray-200">
            <tr>
              <th className="border border-gray-300 px-4 py-2">Adı</th>
              <th className="border border-gray-300 px-4 py-2">Yaş</th>
              <th className="border border-gray-300 px-4 py-2">Cinsiyet</th>
              <th className="border border-gray-300 px-4 py-2">Aksiyonlar</th>
            </tr>
          </thead>
          <tbody>
            {patients.length > 0 ? (
              patients.map((patient) => (
                <tr key={patient.patientID}>
                  <td className="border border-gray-300 px-4 py-2">{patient.name}</td>
                  <td className="border border-gray-300 px-4 py-2">{patient.age}</td>
                  <td className="border border-gray-300 px-4 py-2">{patient.gender}</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <div className="flex justify-center space-x-2">
                      <button onClick={() => startEdit(patient)} className="bg-blue-500 text-white px-2 py-1 rounded text-sm"><FaEdit /></button>
                      <button onClick={() => handleDelete(patient.patientID)} className="bg-red-500 text-white px-2 py-1 rounded text-sm"><FaTrash /></button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center px-4 py-2">Hiç hasta bulunamadı.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
