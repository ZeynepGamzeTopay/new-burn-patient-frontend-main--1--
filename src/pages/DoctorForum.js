import React, { useState, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faPencilAlt, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import moment from 'moment';
import "./DoctorForum.css";

const DoctorForum = () => {
    const location = useLocation();
    const patient = location.state?.patient;
    const { postId } = useParams();

    const [currentDoctor, setCurrentDoctor] = useState("");
    const [posts, setPosts] = useState([]);
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);

    const [recording, setRecording] = useState(false);
    const [audioURL, setAudioURL] = useState(null);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [supportedMimeType, setSupportedMimeType] = useState(null);
    const [currentPostId, setCurrentPostId] = useState(null);

    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editedCommentContent, setEditedCommentContent] = useState("");
    const [showError, setShowError] = useState(false);

    useEffect(() => {
        const checkSupportedMimeTypes = () => {
            const mimeTypes = ["audio/webm", "audio/ogg", "audio/mp4"];
            for (const mimeType of mimeTypes) {
                if (MediaRecorder.isTypeSupported(mimeType)) {
                    setSupportedMimeType(mimeType);
                    return;
                }
            }
            console.error("Tarayıcıda hiçbir ses formatı desteklenmiyor!");
            alert("Tarayıcıda ses kaydı için uygun bir format desteklenmiyor.");
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
                    throw new Error(`HTTP hata! Durum: ${response.status}`);
                }
                const data = await response.json();
                setCurrentDoctor(data.name);
            } catch (error) {
                console.error("Doktor bilgileri alınamadı:", error);
            }
        };
        fetchDoctorInfo();
    }, []);

    // Tek bir postu çekmek için fonksiyon
    const fetchPost = async (postId) => {
        try {
            const response = await fetch(`http://localhost:5005/api/forum/getPost/${postId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setPost(data);
        } catch (error) {
            console.error("Gönderi yüklenirken hata:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (postId) {
            fetchPost(postId);
        }
    }, [postId]);

    const fetchPosts = async () => {
        try {
            const response = await fetch("http://localhost:5005/api/forum/getAll");
            const data = await response.json();

            const postsWithRecordings = await Promise.all(
                data.map(async (post) => {
                    try {
                        const recordingsResponse = await fetch(
                            `http://localhost:5005/api/forum/getVoiceRecordings/${post.forumPostID}`
                        );
                        if (recordingsResponse.ok) {
                            const recordingsData = await recordingsResponse.json();
                            return { ...post, voiceRecordings: recordingsData };
                        } else {
                            console.error(
                                `Ses kayıtları çekilirken hata oluştu ${post.forumPostID}:`,
                                recordingsResponse.status
                            );
                            return { ...post, voiceRecordings: [] };
                        }
                    } catch (error) {
                        console.error("Ses kayıtları çekilirken bir hata oluştu:", error);
                        return { ...post, voiceRecordings: [] };
                    }
                })
            );

            setPosts(postsWithRecordings);
        } catch (error) {
            console.error("Forum gönderileri çekilirken bir hata oluştu:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // postId varsa fetchPost'u çağır, yoksa fetchPosts'u
        if (postId) {
            setLoading(true); // Yükleme durumunu başlat
            fetchPost(postId);
        } else {
            fetchPosts();
        }
    }, [postId]);

    const handleAddComment = async (postId, newComment) => {
        console.log("Yorum eklenirken postId:", postId);
        const token = localStorage.getItem('token');

        try {
            const response = await fetch(
                `http://localhost:5005/api/forum/addComment/${postId}`,
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        forumPostID: postId,
                        doctorName: currentDoctor,
                        content: newComment
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response.text();
                console.error("Yorum API hatası:", errorData);
                return;
            }

            const addedComment = await response.json();
            console.log("API'den dönen yorum:", addedComment);

            setPosts((prevPosts) =>
                prevPosts.map((post) =>
                    post.forumPostID === postId
                        ? { ...post, comments: [...(post.comments || []), addedComment] }
                        : post
                )
            );
        } catch (error) {
            console.error("Yorum eklenirken hata:", error);
        }
    };

    const toggleRecording = async (postId) => {
        if (recording && currentPostId === postId) {
            mediaRecorder.stop();
            setRecording(false);
        } else {
            if (supportedMimeType) {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({
                        audio: true,
                    });
                    const recorder = new MediaRecorder(stream, {
                        mimeType: supportedMimeType,
                    });
                    setMediaRecorder(recorder);
                    setCurrentPostId(postId);

                    const chunks = [];
                    recorder.ondataavailable = (e) => chunks.push(e.data);
                    recorder.onstop = async () => {
                        let fileExtension = "";
                        switch (supportedMimeType) {
                            case "audio/mp4":
                                fileExtension = "mp4";
                                break;
                            case "audio/webm":
                                fileExtension = "webm";
                                break;
                            case "audio/ogg":
                                fileExtension = "ogg";
                                break;
                            default:
                                console.error("Bilinmeyen MIME türü:", supportedMimeType);
                                alert("Bilinmeyen MIME türü. Kayıt yapılamadı.");
                                return;
                        }

                        const blob = new Blob(chunks, { type: supportedMimeType });
                        const url = URL.createObjectURL(blob);
                        setAudioURL(url);
                        await uploadAudio(postId, blob, fileExtension);
                    };

                    recorder.start();
                    setRecording(true);
                } catch (err) {
                    console.error("Mikrofon erişim hatası:", err);
                    alert("Mikrofon erişim hatası: " + err.message);
                }
            }
        }
    };

    const uploadAudio = async (postId, blob, fileExtension) => {
        const formData = new FormData();
        const token = localStorage.getItem('token');
        formData.append("file", blob, `hasta_notu.${fileExtension}`);
        formData.append("doctorName", currentDoctor);

        if (!currentDoctor) {
            console.error("Doktor adı alınamadı! Lütfen giriş yapın.");
            alert("Doktor adı alınamadı! Lütfen giriş yapın.");
            return;
        }

        try {
            const response = await fetch(
                `http://localhost:5005/api/forum/addVoiceRecording/${postId}`,
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                    },
                    body: formData,
                }
            );

            if (!response.ok) {
                const errorData = await response.text();
                console.error("Ses kaydı yüklenirken hata oluştu:", errorData);
                alert(`Ses kaydı yüklenirken hata oluştu: ${errorData}`);
                return;
            }

            const addedRecording = await response.json();
            setPosts((prevPosts) => {
                return prevPosts.map((post) => {
                    if (post.forumPostID === postId) {
                        return {
                            ...post,
                            voiceRecordings: [
                                ...(post.voiceRecordings || []),
                                addedRecording,
                            ],
                        };
                    }
                    return post;
                });
            });
            await fetchPosts();
            alert("Ses kaydı başarıyla yüklendi!");

            setRecording(false);
            setCurrentPostId(null);
        } catch (error) {
            console.error("Ses kaydı yükleme hatası:", error);
            alert("Ses kaydı yüklenirken hata oluştu!");
        } finally {
            setAudioURL(null);
        }
    };

    const deleteRecording = async (postId, recordingId) => {
        const token = localStorage.getItem('token');

        try {
            const response = await fetch(
                `http://localhost:5005/api/forum/deleteVoiceRecording/${recordingId}`,
                {
                    method: "DELETE",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                    },
                }
            );

            if (response.status === 403) {
                setShowError(true);
                return;
            }

            if (!response.ok) {
                const errorData = await response.text();
                console.error("Ses kaydı silinirken hata oluştu:", errorData);
                alert(`Ses kaydı silinirken hata oluştu: ${errorData}`);
                return;
            }

            setPosts((prevPosts) => {
                return prevPosts.map((post) => {
                    if (post.forumPostID === postId) {
                        return {
                            ...post,
                            voiceRecordings: post.voiceRecordings.filter(
                                (recording) => recording.voiceRecordingID !== recordingId
                            ),
                        };
                    }
                    return post;
                });
            });
            alert("Ses kaydı başarıyla silindi!");
        } catch (error) {
            console.error("Ses kaydı silme hatası:", error);
            alert("Ses kaydı silinirken hata oluştu!");
        }
    };
    const handleUpdateComment = async (commentId, updatedContent) => {
        const token = localStorage.getItem('token');

        try {
            const response = await fetch(
                `http://localhost:5005/api/forum/updateComment/${commentId}`,
                {
                    method: "PUT",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        commentID: commentId,
                        content: updatedContent,
                    }),
                }
            );

            if (response.status === 403) {
                setShowError(true);
                return;
            }

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Yorum güncellenirken hata oluştu: ${errorText}`);
            }

            const updatedComment = await response.json();

            setPosts((prevPosts) =>
                prevPosts.map((post) => ({
                    ...post,
                    comments: post.comments.map((comment) =>
                        comment.commentID === commentId
                            ? { ...comment, content: updatedComment.content }
                            : comment
                    ),
                }))
            );

            console.log("Yorum başarıyla güncellendi:", updatedComment);
            setEditingCommentId(null);
        } catch (error) {
            console.error("Yorum güncellenirken hata:", error);
            alert(`Yorum güncellenirken hata oluştu: ${error.message}`);
        }
    };

    const handleDeleteComment = async (commentId) => {
        const token = localStorage.getItem('token');

        try {
            const response = await fetch(
                `http://localhost:5005/api/forum/deleteComment/${commentId}`,
                {
                    method: "DELETE",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                    },
                }
            );
            if (response.status === 403) {
                setShowError(true);
                return;
            }

            if (!response.ok) {
                const errorData = await response.text();
                console.error("Yorum silinirken hata oluştu:", errorData);
                alert(`Yorum silinirken hata oluştu: ${errorData}`);
                return;
            }

            setPosts((prevPosts) =>
                prevPosts.map((post) => ({
                    ...post,
                    comments: post.comments.filter(
                        (comment) => comment.commentID !== commentId
                    ),
                }))
            );
        } catch (error) {
            console.error("Yorum silinirken hata:", error);
            setShowError(true);
        }
    };

    return (
        <div className="container">
            <h2>📢 Doktor Forumu</h2>
            {showError && (
                <div className="errorMessageBox">
                    Bu içeriği düzenleme veya silme izniniz yok.
                </div>
            )}

            {loading ? (
                <p>Yükleniyor...</p>
            ) : (
                <div className="feed">
                    {postId && post ? (  // Tek bir post varsa onu göster
                        <div key={post.forumPostID} className="postCard">
                            <div className="postHeader">
                                <p className="doctorName">
                                    {post.doctorName ? post.doctorName : "Bilinmeyen Doktor"}
                                </p>
                                {post.createdAt && (
                                    <p className="timestamp">
                                        {moment(post.createdAt).format('DD.MM.YYYY HH:mm')}
                                    </p>
                                )}
                            </div>

                            {post.photoPath && (
                                <img
                                    src={`http://localhost:5005${post.photoPath}`}
                                    alt="Yanık Fotoğrafı"
                                    className="image"
                                />
                            )}

                            <div className="textContainer">
                                {post.patient?.name && (
                                    <p style={{ fontSize: '0.85em' }}>
                                        <strong>👤 Hasta Adı:</strong> {post.patient?.name}
                                    </p>
                                )}
                                {post.patient?.age && (
                                    <p style={{ fontSize: '0.85em' }}>
                                        <strong>📅 Yaş:</strong> {post.patient?.age}
                                    </p>
                                )}
                                {post.patient?.gender && (
                                    <p style={{ fontSize: '0.85em' }}>
                                        <strong>⚧ Cinsiyet:</strong> {post.patient?.gender}
                                    </p>
                                )}
                                {post.patient?.medicalHistory && (
                                    <p style={{ fontSize: '0.85em' }}>
                                        <strong>🏥 Tıbbi Geçmiş:</strong>{" "}
                                        {post.patient?.medicalHistory}
                                    </p>
                                )}
                                {post.patient?.burnCause && (
                                    <p style={{ fontSize: '0.85em' }}>
                                        <strong>🔥 Yanık Nedeni:</strong> {post.patient?.burnCause}
                                    </p>
                                )}
                            </div>

                            {/* Ses Kayıtları */}
                            <div className="voiceRecordingsSection">
                                <h4>🎤 Ses Kayıtları</h4>
                                {post.voiceRecordings && post.voiceRecordings.length > 0 ? (
                                    post.voiceRecordings.map((recording, index) => (
                                        <div key={index} className="voiceRecording">
                                            <span>{recording.doctorName}:</span>
                                            {recording.createdAt && (
                                                <span className="timestamp">
                                                    {moment(recording.createdAt).format('DD.MM.YYYY HH:mm')}
                                                </span>
                                            )}
                                            <audio
                                                controls
                                                src={`http://localhost:5005/${recording.filePath}`}
                                                onError={(e) => console.error("Oynatma hatası:", e)}
                                            />
                                            {currentDoctor === recording.doctorName && (
                                                <button
                                                    onClick={() => deleteRecording(post.forumPostID, recording.voiceRecordingID)}
                                                    className="deleteButton"
                                                >
                                                    X
                                                </button>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <p>Henüz ses kaydı yok.</p>
                                )}

                                {/* Ses Kaydı Butonu */}
                                <div className="recordContainer">
                                    <button
                                        onClick={() => toggleRecording(post.forumPostID)}
                                        disabled={!supportedMimeType}
                                        className="recordButton"
                                    >
                                        {recording && currentPostId === post.forumPostID ? (
                                            <i className="fas fa-spinner fa-spin"></i>
                                        ) : (
                                            <i className="fas fa-microphone"></i>
                                        )}
                                    </button>
                                    <span className="recordInstruction">
                                        {recording && currentPostId === post.forumPostID
                                            ? "Kaydediliyor..."
                                            : "Kaydet/Oynat"}
                                    </span>
                                </div>
                            </div>

                            <div className="commentsSection">
                                <h4>💬 Yorumlar</h4>
                                {post.comments && post.comments.length > 0 ? (
                                    post.comments.map((comment) => (
                                        <div key={comment.commentID} className="commentContainer">
                                            <div className="commentText">
                                                <p className="comment" style={{ fontSize: '0.9em' }}>
                                                    <strong>{comment.doctorName}:</strong> {comment.content}
                                                </p>
                                                {comment.createdAt && (
                                                    <span className="timestamp">
                                                        {moment(comment.createdAt).format('DD.MM.YYYY HH:mm')}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="commentActions">

                                                {currentDoctor === comment.doctorName && (
                                                    editingCommentId === comment.commentID ? (
                                                        <input
                                                            type="text"
                                                            value={editedCommentContent}
                                                            onChange={(e) =>
                                                                setEditedCommentContent(e.target.value)
                                                            }
                                                            className="commentInput"
                                                        />
                                                    ) : null
                                                )}

                                                {currentDoctor === comment.doctorName && (
                                                    editingCommentId === comment.commentID ? (
                                                        <button
                                                            onClick={() =>
                                                                handleUpdateComment(comment.commentID, editedCommentContent)
                                                            }
                                                            className="saveButton"
                                                        >
                                                            <FontAwesomeIcon icon={faCheck} />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => {
                                                                setEditingCommentId(comment.commentID);
                                                                setEditedCommentContent(comment.content);
                                                            }}
                                                            className="editButton" style={{ backgroundColor: '#4CAF50' }}
                                                        >
                                                            <FontAwesomeIcon icon={faPencilAlt} />
                                                        </button>
                                                    )
                                                )}
                                                {currentDoctor === comment.doctorName && (
                                                    <button
                                                        onClick={() => handleDeleteComment(comment.commentID)}
                                                        className="deleteButton" style={{ backgroundColor: '#f44336' }}
                                                    >
                                                        <FontAwesomeIcon icon={faTrashAlt} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p>Henüz yorum yok.</p>
                                )}
                                <div style={{ width: '100%' }}>
                                    <CommentInput postId={post.forumPostID} onAddComment={handleAddComment} />
                                </div>
                            </div>
                        </div>
                    ) : (  // Tek bir post yoksa tüm postları göster
                        posts.map((post) => (
                            <div key={post.forumPostID} className="postCard">
                                <div className="postHeader">
                                    <p className="doctorName">
                                        {post.doctorName ? post.doctorName : "Bilinmeyen Doktor"}
                                    </p>
                                    {post.createdAt && (
                                        <p className="timestamp">
                                            {moment(post.createdAt).format('DD.MM.YYYY HH:mm')}
                                        </p>
                                    )}
                                </div>

                                {post.photoPath && (
                                    <img
                                        src={`http://localhost:5005${post.photoPath}`}
                                        alt="Yanık Fotoğrafı"
                                        className="image"
                                    />
                                )}

                                <div className="textContainer">
                                    {post.patient?.name && (
                                        <p style={{ fontSize: '0.85em' }}>
                                            <strong>👤 Hasta Adı:</strong> {post.patient?.name}
                                        </p>
                                    )}
                                    {post.patient?.age && (
                                        <p style={{ fontSize: '0.85em' }}>
                                            <strong>📅 Yaş:</strong> {post.patient?.age}
                                        </p>
                                    )}
                                    {post.patient?.gender && (
                                        <p style={{ fontSize: '0.85em' }}>
                                            <strong>⚧ Cinsiyet:</strong> {post.patient?.gender}
                                        </p>
                                    )}
                                    {post.patient?.medicalHistory && (
                                        <p style={{ fontSize: '0.85em' }}>
                                            <strong>🏥 Tıbbi Geçmiş:</strong>{" "}
                                            {post.patient?.medicalHistory}
                                        </p>
                                    )}
                                    {post.patient?.burnCause && (
                                        <p style={{ fontSize: '0.85em' }}>
                                            <strong>🔥 Yanık Nedeni:</strong> {post.patient?.burnCause}
                                        </p>
                                    )}
                                </div>

                                {/* Ses Kayıtları */}
                                <div className="voiceRecordingsSection">
                                    <h4>🎤 Ses Kayıtları</h4>
                                    {post.voiceRecordings && post.voiceRecordings.length > 0 ? (
                                        post.voiceRecordings.map((recording, index) => (
                                            <div key={index} className="voiceRecording">
                                                <span>{recording.doctorName}:</span>
                                                {recording.createdAt && (
                                                    <span className="timestamp">
                                                        {moment(recording.createdAt).format('DD.MM.YYYY HH:mm')}
                                                    </span>
                                                )}
                                                <audio
                                                    controls
                                                    src={`http://localhost:5005/${recording.filePath}`}
                                                    onError={(e) => console.error("Oynatma hatası:", e)}
                                                />
                                                {currentDoctor === recording.doctorName && (
                                                    <button
                                                        onClick={() => deleteRecording(post.forumPostID, recording.voiceRecordingID)}
                                                        className="deleteButton"
                                                    >
                                                        X
                                                    </button>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <p>Henüz ses kaydı yok.</p>
                                    )}

                                    {/* Ses Kaydı Butonu */}
                                    <div className="recordContainer">
                                        <button
                                            onClick={() => toggleRecording(post.forumPostID)}
                                            disabled={!supportedMimeType}
                                            className="recordButton"
                                        >
                                            {recording && currentPostId === post.forumPostID ? (
                                                <i className="fas fa-spinner fa-spin"></i>
                                            ) : (
                                                <i className="fas fa-microphone"></i>
                                            )}
                                        </button>
                                        <span className="recordInstruction">
                                            {recording && currentPostId === post.forumPostID
                                                ? "Kaydediliyor..."
                                                : "Kaydet/Oynat"}
                                    </span>
                                    </div>
                                </div>

                                <div className="commentsSection">
                                    <h4>💬 Yorumlar</h4>
                                    {post.comments && post.comments.length > 0 ? (
                                        post.comments.map((comment) => (
                                            <div key={comment.commentID} className="commentContainer">
                                                <div className="commentText">
                                                    <p className="comment" style={{ fontSize: '0.9em' }}>
                                                        <strong>{comment.doctorName}:</strong> {comment.content}
                                                    </p>
                                                    {comment.createdAt && (
                                                        <span className="timestamp">
                                                            {moment(comment.createdAt).format('DD.MM.YYYY HH:mm')}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="commentActions">

                                                    {currentDoctor === comment.doctorName && (
                                                        editingCommentId === comment.commentID ? (
                                                            <input
                                                                type="text"
                                                                value={editedCommentContent}
                                                                onChange={(e) =>
                                                                    setEditedCommentContent(e.target.value)
                                                                }
                                                                className="commentInput"
                                                            />
                                                        ) : null
                                                    )}

                                                    {currentDoctor === comment.doctorName && (
                                                        editingCommentId === comment.commentID ? (
                                                            <button
                                                                onClick={() =>
                                                                    handleUpdateComment(comment.commentID, editedCommentContent)
                                                                }
                                                                className="saveButton"
                                                            >
                                                                <FontAwesomeIcon icon={faCheck} />
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => {
                                                                    setEditingCommentId(comment.commentID);
                                                                    setEditedCommentContent(comment.content);
                                                                }}
                                                                className="editButton" style={{ backgroundColor: '#4CAF50' }}
                                                            >
                                                                <FontAwesomeIcon icon={faPencilAlt} />
                                                            </button>
                                                        )
                                                    )}
                                                    {currentDoctor === comment.doctorName && (
                                                        <button
                                                            onClick={() => handleDeleteComment(comment.commentID)}
                                                            className="deleteButton" style={{ backgroundColor: '#f44336' }}
                                                        >
                                                            <FontAwesomeIcon icon={faTrashAlt} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p>Henüz yorum yok.</p>
                                    )}
                                    <div style={{ width: '100%' }}>
                                        <CommentInput postId={post.forumPostID} onAddComment={handleAddComment} />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

const CommentInput = ({ postId, onAddComment }) => {
    const [comment, setComment] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Yorum eklenirken postId:", postId);
        onAddComment(postId, comment);
        setComment("");
    };

    return (
        <form onSubmit={handleSubmit} className="commentForm">
            <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Yorum ekleyin..."
                required
                className="commentInput"
            />
            <button type="submit" className="commentButton">
                Gönder
            </button>
        </form>
    );
};

export default DoctorForum;