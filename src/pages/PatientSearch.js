import React, { useEffect, useState } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./PatientSearch.css";

const PatientSearch = () => {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPatients = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("http://localhost:5005/api/Patient");
        if (!response.ok) {
          throw new Error("Hastalar alınırken bir hata oluştu.");
        }
        const data = await response.json();
        console.log("Gelen Hastalar:", data);
        setPatients(data);
        setFilteredPatients(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  useEffect(() => {
    const filtered = patients.filter((patient) =>
      patient.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPatients(filtered);
    setCurrentPage(1);
  }, [searchTerm, patients]);

  const indexOfLastPatient = currentPage * recordsPerPage;
  const indexOfFirstPatient = indexOfLastPatient - recordsPerPage;
  const currentPatients = filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient);

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);
 
  const handleView = (patientId) => navigate(`/view-patient/${patientId}`);

  const handleDelete = async (patientId) => {
    if (window.confirm("Silmek istediğinize emin misiniz?")) {
      try {
        const response = await fetch(`http://localhost:5005/api/Patient/${patientId}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          throw new Error("Hasta silinirken bir hata oluştu.");
        }
        // Silme başarılıysa hastayı listeden kaldır
        setPatients(patients.filter((patient) => patient.patientID !== patientId));
        setFilteredPatients(filteredPatients.filter((patient) => patient.patientID !== patientId));
      } catch (error) {
        setError(error.message);
      }
    }
  };

  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(filteredPatients.length / recordsPerPage); i++) {
    pageNumbers.push(i);
  }

  return (
    <div>
      <h2>Hasta Kayıtları</h2>
      {loading && <p>Yükleniyor...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      <div className="search-container">
        <input
          type="text"
          placeholder="Hasta adına göre ara"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <table>
        <thead>
          <tr>
            <th>Hasta Adı</th>
            <th>Yaş</th>
            <th>Cinsiyet</th>
            <th>Yanık Nedeni</th>
            <th>Hastaneye Geliş Tarihi</th>
            <th>Yanık Oluşma Tarihi</th>
            <th>İşlemler</th>
          </tr>
        </thead>
        <tbody>
          {currentPatients.length > 0 ? (
            currentPatients.map((patient) => (
              <tr key={patient.patientID}>
                <td>{patient.name}</td>
                <td>{patient.age}</td>
                <td>{patient.gender}</td>
                <td>{patient.burnCause}</td>
                <td>{patient.hospitalArrivalDate}</td>
                <td>{patient.burnOccurrenceDate}</td>
                <td>
                  <div className="button-group">
                    <button onClick={() => handleView(patient.patientID)}>Görüntüle</button>
                    <button onClick={() => handleDelete(patient.patientID)}>Sil</button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7">Hasta bulunamadı.</td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="pagination">
        <span>Sayfa Başına Kayıt Sayısı:</span>
        <select
          value={recordsPerPage}
          onChange={(e) => setRecordsPerPage(parseInt(e.target.value))}
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={15}>15</option>
          <option value={20}>20</option>
        </select>
        <div className="page-navigation">
          <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
            <FaChevronLeft />
          </button>
          <span>Sayfa {currentPage} / {pageNumbers.length}</span>
          <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pageNumbers.length))} disabled={currentPage === pageNumbers.length}>
            <FaChevronRight />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientSearch;
