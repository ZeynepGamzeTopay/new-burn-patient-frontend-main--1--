import React from 'react';

const DoctorCard = ({ doctor, onEdit, onDelete }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center">
      <div>
        <h3 className="text-lg font-bold">{doctor.name}</h3>
        <p>{doctor.email}</p>
        <p>{doctor.verified ? 'Onaylı' : 'Onay Bekliyor'}</p>
      </div>
      <div className="flex space-x-2">
        <button
          onClick={onEdit}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Düzenle
        </button>
        <button
          onClick={onDelete}
          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Sil
        </button>
      </div>
    </div>
  );
};

export default DoctorCard;