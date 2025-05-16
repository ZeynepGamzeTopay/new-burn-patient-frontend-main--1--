import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const AIConsult = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const patient = location.state?.patient;
    const [photo, setPhoto] = useState(null);
    const [results, setResults] = useState({ burnDepth: 'Hesaplanıyor...', burnPercentage: 'Hesaplanıyor...' });
    const [isLoading, setIsLoading] = useState(false);
    const [showVerificationButtons, setShowVerificationButtons] = useState(false);
    const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
    const [verifiedStatus, setVerifiedStatus] = useState(null);

    useEffect(() => {
        const loadImage = async () => {
            if (patient?.photoPath) {
                try {
                    const response = await fetch(`http://localhost:5005/${patient.photoPath}`);
                    if (!response.ok) throw new Error(`Fotoğraf yüklenirken hata: ${response.status}`);
                    setPhoto(await response.blob());
                } catch (error) {
                    console.error("Fotoğraf yüklenirken hata:", error);
                }
            }
        };

        const checkVerifiedStatus = async () => {
            try {
                const response = await fetch(`http://localhost:5005/api/Patient/${patient.patientID}`);
                if (!response.ok) throw new Error('Veri alınamadı');
                const data = await response.json();
                setVerifiedStatus(data.verified);

                // Eğer hasta daha önce tahmin edilmişse, burnDepth'i state'e yaz
                if (data.burnDepth) {
                    setResults({
                        burnDepth: data.burnDepth,
                        burnPercentage: 'Daha önce tahmin edildi'
                    });
                }
            } catch (error) {
                console.error("Verified bilgisi alınamadı:", error);
            }
        };

        loadImage();
        checkVerifiedStatus();
    }, [patient]);


    const handleBack = () => {
        navigate(-1, { state: { patient: patient } });
    };

    const handleSendToAI = async () => {
        if (!photo) return console.error("Fotoğraf yüklenmedi.");
        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append('image', photo);

            const response = await fetch('http://localhost:5000/predict', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error(`AI Foto Analiz isteği başarısız oldu: ${response.status}`);

            const data = await response.json();
            const burnDepth = data.burn_depth || 'Belirsiz';
            const burnPercentage = data.confidence ? `%${(data.confidence * 100).toFixed(2)}` : 'Belirsiz';

            setResults({ burnDepth, burnPercentage });

            await fetch(`http://localhost:5005/api/Patient/update-burn-depth/${patient.patientID}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ BurnDepth: burnDepth })
            });

            setShowVerificationButtons(true);
        } catch (error) {
            console.error("Fotoğraf analizi sırasında hata:", error);
            setResults({ burnDepth: 'Hata', burnPercentage: 'Hata' });
        } finally {
            setIsLoading(false);
        }
    };

    const confirmVerification = async () => {
        try {
            const response = await fetch(`http://localhost:5005/api/Patient/update-verified/${patient.patientID}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ verified: true })
            });
            if (!response.ok) throw new Error("Veritabanı güncellenemedi");
            setVerifiedStatus(true);
            setShowVerificationButtons(false);
            setShowConfirmationDialog(false);
        } catch (error) {
            console.error("Onay işlemi başarısız:", error);
        }
    };

    const rejectVerification = async () => {
        try {
            await fetch(`http://localhost:5005/api/Patient/update-verified/${patient.patientID}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ verified: false })
            });
            setVerifiedStatus(false);
            setShowVerificationButtons(false);
        } catch (error) {
            console.error("Reddetme işlemi başarısız:", error);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <span style={styles.backArrow} onClick={handleBack}>← Geri</span>
            </div>
            <h1>Yapay Zeka Konsültasyonu</h1>

            <div style={styles.contentContainer}>
                <div style={styles.imageContainer}>
                    {photo ? (
                        <img src={URL.createObjectURL(photo)} alt="Yanık Fotoğrafı" style={styles.image} />
                    ) : (
                        <p>Fotoğraf Yok</p>
                    )}
                </div>

                <div style={styles.resultsContainer}>
                    <h2>Sonuçlar</h2>
                    {isLoading ? <p>Yükleniyor...</p> : (
                        <>
                            <p><strong>Yanık Derinliği:</strong> {results.burnDepth}</p>
                            
                        </>
                    )}

                    {!verifiedStatus && (
                        <button style={styles.aiButton} onClick={handleSendToAI} disabled={isLoading || !photo}>
                            {isLoading ? 'Yükleniyor...' : 'Yapay Zekaya Sor'}
                        </button>
                    )}

                    {verifiedStatus && (
                        <p style={{ color: 'green', marginTop: '20px', fontWeight: 'bold' }}>Bu sonuç doktor tarafından onaylandı!</p>
                    )}

                    {showVerificationButtons && !verifiedStatus && (
                        <div style={{ marginTop: '20px' }}>
                            <p>Yapay zeka sonucunu onaylıyor musunuz?</p>
                            <button style={styles.confirmButton} onClick={() => setShowConfirmationDialog(true)}>Onaylıyorum</button>
                            <button style={styles.rejectButton} onClick={rejectVerification}>Onaylamıyorum</button>
                        </div>
                    )}

                    {showConfirmationDialog && (
                        <div style={{ marginTop: '20px', backgroundColor: '#eee', padding: '10px', borderRadius: '5px' }}>
                            <p>Onaylanan sonuçlar geri alınamaz! Yine de onaylamak istiyor musunuz?</p>
                            <button style={styles.confirmButton} onClick={confirmVerification}>Evet</button>
                            <button style={styles.rejectButton} onClick={() => setShowConfirmationDialog(false)}>Hayır</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' },
    header: { width: '100%', display: 'flex', justifyContent: 'flex-start', padding: '10px 20px' },
    backArrow: { padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
    contentContainer: { display: 'flex', width: '100%', maxWidth: '800px', margin: '20px 0' },
    imageContainer: { flex: 1, padding: '10px' },
    image: { maxWidth: '100%', height: 'auto', borderRadius: '8px' },
    resultsContainer: { flex: 1, padding: '15px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#f9f9f9', textAlign: 'left' },
    aiButton: { padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '10px' },
    confirmButton: { padding: '8px 16px', margin: '5px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
    rejectButton: { padding: '8px 16px', margin: '5px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }
};

export default AIConsult;



// import React, { useState, useEffect } from 'react';
// import { useLocation, useNavigate } from 'react-router-dom';

// const AIConsult = () => {
//     const location = useLocation();
//     const navigate = useNavigate();
//     const patient = location.state?.patient;
//     const [photo, setPhoto] = useState(null);
//     const [results, setResults] = useState({ burnDepth: 'Hesaplanıyor...', burnPercentage: 'Hesaplanıyor...' });
//     const [isLoading, setIsLoading] = useState(false);
//     const [showApproval, setShowApproval] = useState(false);
//     const [confirmed, setConfirmed] = useState(false);
//     const [showConfirmDialog, setShowConfirmDialog] = useState(false);

//     useEffect(() => {
//         const loadImage = async () => {
//             if (patient?.photoPath) {
//                 try {
//                     const response = await fetch(`http://localhost:5005/${patient.photoPath}`);
//                     if (!response.ok) throw new Error(`Fotoğraf yüklenirken hata: ${response.status}`);
//                     setPhoto(await response.blob());
//                 } catch (error) {
//                     console.error("Fotoğraf yüklenirken hata:", error);
//                 }
//             }
//         };
//         loadImage();
//     }, [patient]);

//     const handleBack = () => {
//         navigate(-1, { state: { patient: patient } });
//     };

//     const handleSendToAI = async () => {
//         if (!photo) return console.error("Fotoğraf yüklenmedi.");
//         setIsLoading(true);
//         try {
//             const formData = new FormData();
//             formData.append('image', photo);

//             const response = await fetch('http://localhost:5000/predict', {
//                 method: 'POST',
//                 body: formData
//             });

//             if (!response.ok) throw new Error(`AI Foto Analiz isteği başarısız oldu: ${response.status}`);

//             const data = await response.json();
//             const burnDepth = data.burn_depth || 'Belirsiz';
//             const burnPercentage = data.confidence ? `%${(data.confidence * 100).toFixed(2)}` : 'Belirsiz';

//             setResults({ burnDepth, burnPercentage });
//             setShowApproval(true);

//             await fetch(`http://localhost:5005/api/Patient/update-burn-depth/${patient.patientID}`, {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ BurnDepth: burnDepth })
//             });

//         } catch (error) {
//             console.error("Fotoğraf analizi sırasında hata:", error);
//             setResults({ burnDepth: 'Hata', burnPercentage: 'Hata' });
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     const handleApprove = () => {
//         setShowConfirmDialog(true);
//     };

//     const handleConfirmApproval = async () => {
//         setShowConfirmDialog(false);
//         setConfirmed(true);

//         await fetch(`http://localhost:5005/api/Patient/update-verified/${patient.patientID}`, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ verified: true })
//         });
//     };

//     const handleReject = async () => {
//         setShowApproval(false);
//         await fetch(`http://localhost:5005/api/Patient/update-verified/${patient.patientID}`, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ verified: false })
//         });
//     };

//     return (
//         <div style={styles.container}>
//             <div style={styles.header}>
//                 <span style={styles.backArrow} onClick={handleBack}>← Geri</span>
//             </div>
//             <h1>Yapay Zeka Konsültasyonu</h1>

//             <div style={styles.contentContainer}>
//                 <div style={styles.imageContainer}>
//                     {photo ? (
//                         <img src={URL.createObjectURL(photo)} alt="Yanık Fotoğrafı" style={styles.image} />
//                     ) : (
//                         <p>Fotoğraf Yok</p>
//                     )}
//                 </div>

//                 <div style={styles.resultsContainer}>
//                     <h2>Sonuçlar</h2>
//                     {isLoading ? <p>Yükleniyor...</p> : (
//                         <>
//                             <p><strong>Yanık Derinliği:</strong> {results.burnDepth}</p>
//                             <p><strong>Yanık Yüzdesi (Tahmini):</strong> {results.burnPercentage}</p>
//                         </>
//                     )}
//                     <button style={styles.aiButton} onClick={handleSendToAI} disabled={isLoading || !photo}>
//                         {isLoading ? 'Yükleniyor...' : 'Yapay Zekaya Sor'}
//                     </button>

//                     {showApproval && !confirmed && (
//                         <>
//                             <p style={{ marginTop: '20px' }}>Yapay zeka sonucunu onaylıyor musunuz?</p>
//                             <button style={styles.confirmButton} onClick={handleApprove}>Onaylıyorum</button>
//                             <button style={styles.rejectButton} onClick={handleReject}>Onaylamıyorum</button>
//                         </>
//                     )}

//                     {confirmed && <p style={{ marginTop: '20px', color: 'green' }}>Bu sonuç doktor tarafından onaylandı!</p>}

//                     {showConfirmDialog && (
//                         <div style={styles.dialogBox}>
//                             <p>Onaylanan sonuçlar geri alınamaz! Yine de onaylamak istiyor musunuz?</p>
//                             <button style={styles.confirmButton} onClick={handleConfirmApproval}>Evet</button>
//                             <button style={styles.rejectButton} onClick={() => setShowConfirmDialog(false)}>Hayır</button>
//                         </div>
//                     )}
//                 </div>
//             </div>
//         </div>
//     );
// };

// const styles = {
//     container: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' },
//     header: { width: '100%', display: 'flex', justifyContent: 'flex-start', padding: '10px 20px' },
//     backArrow: { padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
//     contentContainer: { display: 'flex', width: '100%', maxWidth: '800px', margin: '20px 0' },
//     imageContainer: { flex: 1, padding: '10px' },
//     image: { maxWidth: '100%', height: 'auto', borderRadius: '8px' },
//     resultsContainer: { flex: 1, padding: '15px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#f9f9f9', textAlign: 'left' },
//     aiButton: { padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '10px' },
//     confirmButton: { padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', marginRight: '10px', cursor: 'pointer' },
//     rejectButton: { padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
//     dialogBox: { border: '1px solid #ccc', padding: '15px', borderRadius: '8px', backgroundColor: '#fff', marginTop: '20px' }
// };

// export default AIConsult;




// // import React, { useState, useEffect } from 'react';
// // import { useLocation, useNavigate } from 'react-router-dom';

// // const AIConsult = () => {   
// //     const location = useLocation();
// //     const navigate = useNavigate();
// //     const patient = location.state?.patient;
// //     const [photo, setPhoto] = useState(null);
// //     const [results, setResults] = useState({ burnDepth: 'Hesaplanıyor...', burnPercentage: 'Hesaplanıyor...' });
// //     const [isLoading, setIsLoading] = useState(false);

// //     useEffect(() => {
// //         const loadImage = async () => {
// //             if (patient?.photoPath) {
// //                 try {
// //                     const response = await fetch(`http://localhost:5005/${patient.photoPath}`);
// //                     if (!response.ok) throw new Error(`Fotoğraf yüklenirken hata: ${response.status}`);
// //                     setPhoto(await response.blob());
// //                 } catch (error) {
// //                     console.error("Fotoğraf yüklenirken hata:", error);
// //                 }
// //             }
// //         };
// //         loadImage();
// //     }, [patient]);

// //     const handleBack = () => {
// //         navigate(-1, { state: { patient: patient } });
// //     };

// //     const handleSendToAI = async () => {
// //         if (!photo) return console.error("Fotoğraf yüklenmedi.");
// //         setIsLoading(true);
// //         try {
// //             const formData = new FormData();
// //             formData.append('image', photo);
    
// //             const response = await fetch('http://localhost:5000/predict', {
// //                 method: 'POST',
// //                 body: formData
// //             });
    
// //             if (!response.ok) throw new Error(`AI Foto Analiz isteği başarısız oldu: ${response.status}`);
    
// //             const data = await response.json();
// //             const burnDepth = data.burn_depth || 'Belirsiz';
// //             const burnPercentage = data.confidence ? `%${(data.confidence * 100).toFixed(2)}` : 'Belirsiz';
    
// //             setResults({ burnDepth, burnPercentage });
    
// //             //  AI sonucunu backend'e gönder (örnek hasta ID: 1)
// //             await fetch(`http://localhost:5005/api/Patient/update-burn-depth/${patient.patientID}`, {  
// //                 method: 'POST',
// //                 headers: { 'Content-Type': 'application/json' },
// //                 body: JSON.stringify({ BurnDepth: burnDepth })
// //             });

// //         } catch (error) {
// //             console.error("Fotoğraf analizi sırasında hata:", error);
// //             setResults({ burnDepth: 'Hata', burnPercentage: 'Hata' });
// //         } finally {
// //             setIsLoading(false);
// //         }
// //     };

// //     return (
// //         <div style={styles.container}>
// //             <div style={styles.header}>
// //                 <span style={styles.backArrow} onClick={handleBack}>
// //                     ← Geri
// //                 </span>
// //             </div>
// //             <h1>Yapay Zeka Konsültasyonu</h1>

// //             <div style={styles.contentContainer}>
// //                 <div style={styles.imageContainer}>
// //                     {photo ? (
// //                         <img src={URL.createObjectURL(photo)} alt="Yanık Fotoğrafı" style={styles.image} />
// //                     ) : (
// //                         <p>Fotoğraf Yok</p>
// //                     )}
// //                 </div>

// //                 <div style={styles.resultsContainer}>
// //                     <h2>Sonuçlar</h2>
// //                     {isLoading ? <p>Yükleniyor...</p> : (
// //                         <>
// //                             <p><strong>Yanık Derinliği:</strong> {results.burnDepth}</p>
// //                             {/* <p><strong>Yanık Güvenilirliği:</strong> {results.burnPercentage}</p> */}
// //                         </>
// //                     )}
// //                     <button style={styles.aiButton} onClick={handleSendToAI} disabled={isLoading || !photo}>
// //                         {isLoading ? 'Yükleniyor...' : 'Yapay Zekaya Sor'}
// //                     </button>
// //                 </div>
// //             </div>
// //         </div>
// //     );
// // };

// // const styles = {
// //     container: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' },
// //     header: { width: '100%', display: 'flex', justifyContent: 'flex-start', padding: '10px 20px' },
// //     backArrow: { padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
// //     contentContainer: { display: 'flex', width: '100%', maxWidth: '800px', margin: '20px 0' },
// //     imageContainer: { flex: 1, padding: '10px' },
// //     image: { maxWidth: '100%', height: 'auto', borderRadius: '8px' },
// //     resultsContainer: { flex: 1, padding: '15px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#f9f9f9', textAlign: 'left' },
// //     aiButton: { padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '10px' }
// // };

// // export default AIConsult;


// // // import React, { useState, useEffect } from 'react';
// // // import { useLocation, useNavigate } from 'react-router-dom';

// // // const AIConsult = () => {   
// // //     const location = useLocation();
// // //     const navigate = useNavigate();
// // //     const patient = location.state?.patient;
// // //     const [photo, setPhoto] = useState(null);
// // //     const [results, setResults] = useState({ burnDepth: 'Hesaplanıyor...', burnPercentage: 'Hesaplanıyor...' });
// // //     const [isLoading, setIsLoading] = useState(false);

// // //     useEffect(() => {
// // //         const fetchAiResults = async () => {
// // //             if (!patient) return;
// // //             setIsLoading(true);
// // //             try {
// // //                 const response = await fetch('http://localhost:5000/predict', {
// // //                     method: 'POST',
// // //                     headers: { 'Content-Type': 'application/json' },
// // //                     body: JSON.stringify({
// // //                         burnArea: patient.burnArea,
// // //                         age: patient.age,
// // //                         gender: patient.gender,
// // //                         medicalHistory: patient.medicalHistory,
// // //                         burnCause: patient.burnCause
// // //                     })
// // //                 });

// // //                 if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

// // //                 const data = await response.json();
// // //                 setResults({
// // //                     burnDepth: data.burnDepth || 'Belirsiz',
// // //                     burnPercentage: data.burnPercentage || 'Belirsiz'
// // //                 });
// // //             } catch (error) {
// // //                 console.error("AI sonuçları alınırken hata:", error);
// // //                 setResults({ burnDepth: ' ', burnPercentage: ' ' });
// // //             } finally {
// // //                 setIsLoading(false);
// // //             }
// // //         };

// // //         const loadImage = async () => {
// // //             if (patient?.photoPath) {
// // //                 try {
// // //                     const response = await fetch(`http://localhost:5005/${patient.photoPath}`);
// // //                     if (!response.ok) throw new Error(`Fotoğraf yüklenirken hata: ${response.status}`);
// // //                     setPhoto(await response.blob());
// // //                 } catch (error) {
// // //                     console.error("Fotoğraf yüklenirken hata:", error);
// // //                 }
// // //             }
// // //         };

// // //         fetchAiResults();
// // //         loadImage();
// // //     }, [patient]);

// // //     const handleBack = () => {
// // //         navigate(-1, { state: { patient: patient } });
// // //     };


// // //     const handleSendToAI = async () => {
// // //         if (!photo) return console.error("Fotoğraf yüklenmedi.");
// // //         setIsLoading(true);
// // //         try {
// // //             const formData = new FormData();
// // //             formData.append('image', photo);
    
// // //             const response = await fetch('http://localhost:5000/predict', {
// // //                 method: 'POST',
// // //                 body: formData
// // //             });
    
// // //             if (!response.ok) throw new Error(`AI Foto Analiz isteği başarısız oldu: ${response.status}`);
    
// // //             const data = await response.json();
// // //             const burnDepth = data.burn_depth || 'Belirsiz';
// // //             const burnPercentage = data.confidence ? `%${(data.confidence * 100).toFixed(2)}` : 'Belirsiz';
    
// // //             setResults({ burnDepth, burnPercentage });
    
// // //             //  AI sonucunu backend'e gönder (örnek hasta ID: 1)
// // //             await fetch(`http://localhost:5005/api/Patient/update-burn-depth/${patient.patientID}`, {  
// // //                 method: 'POST',
// // //                 headers: { 'Content-Type': 'application/json' },
// // //                 body: JSON.stringify({ BurnDepth: burnDepth })
// // //             });

// // //         } catch (error) {
// // //             console.error("Fotoğraf analizi sırasında hata:", error);
// // //             setResults({ burnDepth: 'Hata ', burnPercentage: 'Hata ' });
// // //         } finally {
// // //             setIsLoading(false);
// // //         }
// // //     };

// // //     return (
// // //             <div style={styles.container}>
// // //             <div style={styles.header}>
// // //                 <span style={styles.backArrow} onClick={handleBack}>
// // //                     ← Geri
// // //                 </span>
// // //             </div>
// // //             <h1>Yapay Zeka Konsültasyonu</h1>

// // //             <div style={styles.contentContainer}>
// // //                 <div style={styles.imageContainer}>
// // //                     {photo ? (
// // //                         <img src={URL.createObjectURL(photo)} alt="Yanık Fotoğrafı" style={styles.image} />
// // //                     ) : (
// // //                         <p>Fotoğraf Yok</p>
// // //                     )}
// // //                 </div>

// // //                 <div style={styles.resultsContainer}>
// // //                     <h2>Sonuçlar</h2>
// // //                     {isLoading ? <p>Yükleniyor...</p> : (
// // //                         <>
// // //                             <p><strong>Yanık Derinliği:</strong> {results.burnDepth}</p>
// // //                             <p><strong>Yanık Güvenilirliği:</strong> {results.burnPercentage}</p>
// // //                         </>
// // //                     )}
// // //                     <button style={styles.aiButton} onClick={handleSendToAI} disabled={isLoading || !photo}>
// // //                         {isLoading ? 'Yükleniyor...' : 'Yapay Zekaya Sor'}
// // //                     </button>
// // //                 </div>
// // //             </div>
// // //         </div>
// // //     );
// // // };

// // // const styles = {
// // //     container: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' },
// // //     header: { width: '100%', display: 'flex', justifyContent: 'flex-start', padding: '10px 20px' },
// // //     backArrow: { padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
// // //     contentContainer: { display: 'flex', width: '100%', maxWidth: '800px', margin: '20px 0' },
// // //     imageContainer: { flex: 1, padding: '10px' },
// // //     image: { maxWidth: '100%', height: 'auto', borderRadius: '8px' },
// // //     resultsContainer: { flex: 1, padding: '15px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#f9f9f9', textAlign: 'left' },
// // //     aiButton: { padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '10px' }
// // // };

// // // export default AIConsult;
