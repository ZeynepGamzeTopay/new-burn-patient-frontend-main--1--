import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const AddVisit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        visitDate: "",
        photoPath: "",
        labResultsFilePath: "",
        prescribedMedications: "",
        notes: "",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleFileUpload = async (e, fieldName) => {
        const file = e.target.files[0];
        if (!file) return;

        const fileFormData = new FormData();
        fileFormData.append("file", file);

        try {
            const response = await fetch("http://localhost:5005/api/visit/upload", {
                method: "POST",
                body: fileFormData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Dosya yükleme başarısız.");
            }

            const result = await response.json();
            setFormData({
                ...formData,
                [fieldName]: result.filePath,
            });
        } catch (error) {
            console.error("Dosya yükleme hatası:", error.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {

            const requestBody = {
                patientID: parseInt(id),
                visitDate: new Date(formData.visitDate).toISOString(),
                photoPath: formData.photoPath,
                labResultsFilePath: formData.labResultsFilePath,
                prescribedMedications: formData.prescribedMedications,
                notes: formData.notes,
            };

            console.log("Gönderilen Veri:", requestBody); // İstek verisini konsola yazdır

            const response = await fetch(`http://localhost:5005/api/visit/patient/${id}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Ziyaret eklenemedi.");
            }

            const result = await response.json();
            console.log("API Yanıtı:", result); // API yanıtını konsola yazdır

            navigate(`/patient/${id}`);
        } catch (error) {
            console.error("Ziyaret ekleme hatası:", error.message);
        }
    };

    const handleCancel = () => {
        navigate(`/view-patient/${id}`);
    };

    return (
        <div style={styles.container}>
            <h1>Yeni Ziyaret Ekle</h1>
            <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.formGroup}>
                    <label>Ziyaret Tarihi:</label>
                    <input
                        type="date"
                        name="visitDate"
                        value={formData.visitDate}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div style={styles.formGroup}>
                    <label>Fotoğraf:</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, "photoPath")}
                    />
                    {formData.photoPath && (
                        <p>Yüklenen Dosya: {formData.photoPath}</p>
                    )}
                </div>
                <div style={styles.formGroup}>
                    <label>Laboratuvar Sonuçları:</label>
                    <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload(e, "labResultsFilePath")}
                    />
                    {formData.labResultsFilePath && (
                        <p>Yüklenen Dosya: {formData.labResultsFilePath}</p>
                    )}
                </div>
                <div style={{ ...styles.formGroup, ...styles.textAreaGroup }}>
                    <label>Yazılan İlaçlar:</label>
                    <textarea
                        name="prescribedMedications"
                        value={formData.prescribedMedications}
                        onChange={handleChange}
                        style={styles.textArea}
                    />
                </div>
                <div style={{ ...styles.formGroup, ...styles.textAreaGroup }}>
                    <label>Notlar:</label>
                    <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        style={styles.textArea}
                    />
                </div>
                <div style={styles.buttonContainer}>
                    <button type="submit" style={styles.submitButton}>
                        Kaydet
                    </button>
                    <button
                        type="button"
                        style={styles.cancelButton}
                        onClick={handleCancel}
                    >
                        İptal
                    </button>
                </div>
            </form>
        </div>
    );
};

const styles = {
    container: {
        padding: "20px",
        maxWidth: "600px",
        margin: "0 auto",
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: "20px",
    },
    formGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "5px",
    },
    submitButton: {
        padding: "10px",
        backgroundColor: "#28a745",
        color: "white",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
    },
    cancelButton: {
        padding: "10px",
        backgroundColor: "#dc3545",
        color: "white",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
    },
    buttonContainer: {
        display: "flex",
        justifyContent: "space-between",
    },
    textArea: { // textarea'lar için ortak stil
        padding: '8px',
        borderRadius: '5px',
        border: '1px solid #ccc',
        fontSize: '16px',
        lineHeight: '1.5',
        resize: 'vertical', // isteğe bağlı olarak sadece dikeyde büyütülebilir
        minHeight: '100px', // minimum yükseklik
    },
    textAreaGroup: {
        /* formGroup stillerini geçersiz kılmak veya eklemek için */
    }
};

export default AddVisit;