import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";

const PatientView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [patient, setPatient] = useState(null);
    const [visits, setVisits] = useState([]);
    const [doctorName, setDoctorName] = useState("");
    const [recording, setRecording] = useState(false);
    const [audioURL, setAudioURL] = useState(null);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const audioRef = useRef(null);
    const [audioSource, setAudioSource] = useState(null);

    const [supportedMimeType, setSupportedMimeType] = useState(null);

    useEffect(() => {
        const checkSupportedMimeTypes = () => {
            const mimeTypes = [
                'audio/mp4',
                'audio/webm',
                'audio/ogg',
            ];

            for (const mimeType of mimeTypes) {
                if (MediaRecorder.isTypeSupported(mimeType)) {
                    setSupportedMimeType(mimeType);
                    console.log(`${mimeType} destekleniyor.`);
                    return;
                }
            }

            console.error('Tarayıcıda hiçbir ses formatı desteklenmiyor!');
            alert('Tarayıcıda ses kaydı için uygun bir format desteklenmiyor.');
        };

        checkSupportedMimeTypes();
    }, []);

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
                    throw new Error("HTTP hata! Durum: " + response.status);
                }

                const data = await response.json();
                setDoctorName(data.name);
            } catch (error) {
                console.error("Doktor bilgileri alınamadı:", error);
            }
        };

        fetchDoctorInfo();
    }, []);

    const fetchPatientData = async () => {
        try {
            const patientResponse = await fetch(`http://localhost:5005/api/patient/${id}`);
            if (!patientResponse.ok) throw new Error("Failed to fetch patient data.");
            const patientData = await patientResponse.json();
            setPatient(patientData);

            if (patientData && patientData.audioPath) {
                setAudioSource(`http://localhost:5005/${patientData.audioPath}`);
            }

            const visitsResponse = await fetch(`http://localhost:5005/api/visit/patient/${id}`);
            if (!visitsResponse.ok) throw new Error("Failed to fetch visit data.");
            const visitsData = await visitsResponse.json();
            setVisits(visitsData);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    useEffect(() => {
        fetchPatientData();
    }, [id]);

    const handleMouseDown = async () => {
        if (!recording && supportedMimeType) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const recorder = new MediaRecorder(stream, { mimeType: supportedMimeType });
                setMediaRecorder(recorder);

                const chunks = [];
                recorder.ondataavailable = e => chunks.push(e.data);
                recorder.onstop = async () => {
                    let fileExtension = '';
                    switch (supportedMimeType) {
                        case 'audio/mp4':
                            fileExtension = 'mp4';
                            break;
                        case 'audio/webm':
                            fileExtension = 'webm';
                            break;
                        case 'audio/ogg':
                            fileExtension = 'ogg';
                            break;
                        default:
                            console.error('Bilinmeyen MIME türü:', supportedMimeType);
                            alert('Bilinmeyen MIME türü. Kayıt yapılamadı.');
                            return;
                    }

                    const blob = new Blob(chunks, { type: supportedMimeType });
                    const url = URL.createObjectURL(blob);
                    setAudioURL(url);
                    await uploadAudio(blob, fileExtension);
                };

                recorder.start();
                setRecording(true);
            } catch (err) {
                console.error("Mikrofon erişim hatası:", err);
                alert("Mikrofon erişim hatası: " + err.message);
            }
        }
    };

    const handleMouseUp = () => {
        if (recording) {
            mediaRecorder.stop();
            setRecording(false);
        }
    };
    
    const uploadAudio = async (blob, fileExtension) => {
        const formData = new FormData();
        formData.append('audio', blob, `hasta_notu.${fileExtension}`);

        try {
            const response = await fetch(`http://localhost:5005/api/patient/upload-audio/${id}`, {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Ses kaydı başarıyla yüklendi:', data);
                alert('Ses kaydı başarıyla yüklendi!');
                await fetchPatientData();
            } else {
                console.error('Ses kaydı yüklenirken hata oluştu.');
                alert('Ses kaydı yüklenirken hata oluştu!');
            }
        } catch (error) {
            console.error('Ses kaydı yükleme hatası:', error);
            alert('Ses kaydı yüklenirken hata oluştu!');
        }
    };

    const handleDeleteAudio = async () => {
        try {
            const response = await fetch(`http://localhost:5005/api/patient/delete-audio/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                console.log('Ses kaydı başarıyla silindi.');
                alert('Ses kaydı başarıyla silindi!');
                setAudioSource(null);
                await fetchPatientData();
            } else {
                console.error('Ses kaydı silinirken hata oluştu.');
                alert('Ses kaydı silinirken hata oluştu!');
            }
        } catch (error) {
            console.error('Ses kaydı silme hatası:', error);
            alert('Ses kaydı silinirken hata oluştu!');
        }
    };
    

    const handleForum = async () => {
        if (!patient) {
            console.error("Hasta bilgisi bulunamadı!");
            return;
        }

        try {
            const response = await fetch("http://localhost:5005/api/forum/addPost", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    patientID: patient.patientID,
                    patient: patient,
                    doctorName: doctorName,
                    description: `Hasta Adı: ${patient.name}, Yaş: ${patient.age}, Yanık Nedeni: ${patient.burnCause}`,
                    photoPath: patient.photoPath || null,
                }),
            });

            const responseText = await response.text();
            if (!response.ok) {
                console.error("Forum post eklenemedi:", responseText);
                return;
            }

            let result;
            try {
                result = JSON.parse(responseText);
            } catch (jsonError) {
                console.error("Yanıt JSON formatında değil:", responseText);
                return;
            }

            console.log("Forum post eklendi:", result);
            navigate("/doctorForum");

        } catch (error) {
            console.error("Hata:", error);
        }
    };

    const handleBack = () => {
        navigate("/doctor-dashboard");
    };

    const handleAddVisit = () => {
        navigate(`/add-visit/${id}`);
    };

    const handleAiConsult = () => {
        console.log("Sending patient to AI Consult:", patient);
        navigate(`/ai-consult`, { state: { patient: patient } });
    };

    if (!patient || !doctorName) return <div>Yükleniyor...</div>;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <span style={styles.backArrow} onClick={handleBack}>
                    ← Geri
                </span>
            </div>

            <h1>Hasta Detayları</h1>
            <p><strong>Doktor Adı:</strong> {doctorName}</p>
            <div style={styles.content}>
                <div style={styles.firstVisitCard}>
                    <div style={styles.firstVisitHeader}>
                        <h2>İlk Geliş</h2>
                        <button style={styles.addButton} onClick={handleAddVisit}>+</button>
                    </div>
                    <p><strong>Ad Soyad:</strong> {patient.name}</p>
                    <p><strong>Yaş:</strong> {patient.age}</p>
                    <p><strong>Cinsiyet:</strong> {patient.gender}</p>
                    <p><strong>Email:</strong> {patient.email}</p>
                    <p><strong>Tıbbi Geçmiş:</strong> {patient.medicalHistory || "Bilgi bulunamadı"}</p>
                    <p><strong>Yanık Nedeni:</strong> {patient.burnCause || "Bilgi bulunamadı"}</p>
                    <p><strong>Yanık Bölgesi:</strong> {patient.burnArea}</p>
                    <p><strong>Hastaneye Geliş Tarihi:</strong> {patient.hospitalArrivalDate ? new Date(patient.hospitalArrivalDate).toLocaleDateString() : "Bilgi bulunamadı"}</p>
                    <p><strong>Yanık Oluş Tarihi:</strong> {patient.burnOccurrenceDate ? new Date(patient.burnOccurrenceDate).toLocaleDateString() : "Bilgi bulunamadı"}</p>

                    <div style={styles.imageContainer}>
                        {patient.photoPath ? (
                            <img src={`http://localhost:5005${patient.photoPath}`} alt="Patient" style={styles.image} />
                        ) : (
                            <p>Fotoğraf bulunamadı</p>
                        )}
                    </div>

                    {/* Ses Kaydı Butonu ve Alanı */}
                    <div style={styles.recordContainer}>
                        <button 
                            onMouseDown={handleMouseDown} 
                            onMouseUp={handleMouseUp} 
                            disabled={!patient || !supportedMimeType}
                            style={styles.recordButton}
                        >
                            <i className="fas fa-microphone"></i>
                        </button>
                        <span style={styles.recordInstruction}>Kaydetmek için basılı tutun</span>
                    </div>
                    {audioSource && (
                        <div style={styles.audioContainer}>
                            <audio controls>
                                <source src={audioSource} type="audio/webm" />
                                Tarayıcınız bu ses formatını desteklemiyor.
                            </audio>
                            <button onClick={handleDeleteAudio} style={styles.deleteButton}>X</button>
                        </div>
                    )}

                    {/* Forum ve Yapay Zeka Butonları */}
                    <div style={styles.buttonsContainer}>
                        <button style={styles.button} onClick={handleForum}>Foruma Sor</button>
                        <button style={styles.button} onClick={handleAiConsult}>Yapay Zekaya Danış</button>
                    </div>
                </div>

                <div style={styles.visitsContainer}>
                    {visits.length > 0 ? (
                        visits.map((visit) => (
                            <div key={visit.visitID} style={styles.visitCard}>
                                <p><strong>Ziyaret Tarihi:</strong> {new Date(visit.visitDate).toLocaleDateString()}</p>
                                <p><strong>Yazılan İlaçlar:</strong> {visit.prescribedMedications || "Bilgi yok"}</p>
                                <p><strong>Notlar:</strong> {visit.notes || "Bilgi yok"}</p>

                                {visit.photoPath && (
                                    <div style={styles.imageContainer}>
                                        <img src={`http://localhost:5005${visit.photoPath}`} alt="Visit" style={styles.image} />
                                    </div>
                                )}

                                {visit.labResultsFilePath && (
                                    <a
                                        href={`http://localhost:5005${visit.labResultsFilePath}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={styles.labResultsButton}
                                    >
                                        Laboratuvar Sonuçlarını Görüntüle
                                    </a>
                                )}
                            </div>
                        ))
                    ) : (
                        <p>Ziyaret geçmişi bulunmamaktadır.</p>
                    )}
                </div>
            </div>
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
    header: {
        width: "100%",
        display: "flex",
        justifyContent: "flex-start",
        padding: "10px 20px",
        position: "absolute",
        top: "10px",
        left: "10px",
    },
    backArrow: {
        padding: "10px 20px",
        backgroundColor: "#007bff",
        color: "white",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
        fontWeight: "bold",
    },
    content: {
        display: "flex",
        flexDirection: "row",
        justifyContent: "start",
        gap: "20px",
        width: "90%",
        marginTop: "20px",
    },
    firstVisitCard: {
        width: "350px",
        border: "1px solid #ccc",
        padding: "15px",
        borderRadius: "8px",
        backgroundColor: "#f9f9f9",
        textAlign: "left",
        position: "relative",
    },
    firstVisitHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },
    addButton: {
        backgroundColor: "#28a745",
        color: "white",
        fontSize: "24px",
        fontWeight: "bold",
        border: "none",
        borderRadius: "100%",
        width: "40px",
        height: "40px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    visitsContainer: {
        display: "flex",
        flexWrap: "wrap",
        gap: "15px",
    },
    visitCard: {
        width: "250px",
        border: "1px solid #ccc",
        padding: "10px",
        borderRadius: "8px",
        backgroundColor: "#f9f9f9",
        textAlign: "left",
    },
    imageContainer: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        marginTop: "10px",
    },
    image: {
        width: "200px",
        height: "200px",
        objectFit: "cover",
        borderRadius: "8px",
    },
    labResultsButton: {
        display: "block",
        marginTop: "10px",
        padding: "8px",
        backgroundColor: "#007bff",
        color: "white",
        textAlign: "center",
        textDecoration: "none",
        borderRadius: "5px",
        fontWeight: "bold",
    },
    buttonsContainer: {
        marginTop: "15px",
        display: "flex",
        gap: "10px",
        justifyContent: "space-between",
    },
    button: {
        padding: "10px 20px",
        backgroundColor: "#007bff",
        color: "white",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
        fontWeight: "bold",
    },
    audioContainer: {
        display: "flex",
        alignItems: "center",
    },
    deleteButton: {
        padding: "0px 3px",
        backgroundColor: "#dc3545",
        color: "white",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontWeight: "bold",
        marginLeft: "4px",
        fontSize: "12px",
        lineHeight: "1",
        width: "30px",
        height: "30px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    recordButton: {
        padding: "10px",
        backgroundColor: "#007bff",
        color: "white",
        border: "none",
        borderRadius: "50%",
        cursor: "pointer",
        fontSize: "20px",
        width: "50px",
        height: "50px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    recordInstruction: {
        fontSize: '0.8em',
        marginLeft: '5px',
        color: '#555',
    },
    recordContainer: {
        display: 'flex',
        alignItems: 'center',
    }
};

export default PatientView;