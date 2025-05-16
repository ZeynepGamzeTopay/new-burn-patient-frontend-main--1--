import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faBell, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import moment from 'moment';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate(); // Initialize useNavigate

    useEffect(() => {
        const fetchNotifications = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                console.error("Token bulunamadı! Kullanıcı giriş yapmamış olabilir.");
                return;
            }
            try {
                const response = await fetch("http://localhost:5005/api/notifications", {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });
                if (!response.ok) throw new Error(`HTTP hata! Durum: ${response.status}`);
                const data = await response.json();
                setNotifications(data);
            } catch (error) {
                console.error("Bildirimler alınamadı:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchNotifications();
    }, []);

    const markAsRead = async (notificationId) => {
        try {
            const response = await fetch(
                `http://localhost:5005/api/notifications/${notificationId}/read`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            if (response.ok) {
                setNotifications((prev) =>
                    prev.map((notif) =>
                        notif.notificationID === notificationId ? { ...notif, isRead: true } : notif
                    )
                );
            } else {
                console.error("Bildirim güncellenemedi.");
            }
        } catch (error) {
            console.error("Güncelleme hatası:", error);
        }
    };

    // Function to navigate to DoctorForum
    const goToPost = (postId) => {
        if (!postId) {
            console.error("Post ID bulunamadı!");
            return;
        }
        navigate(`/doctorForum/${postId}`); // İlgili post sayfasına yönlendir
    };

    if (loading) return <div className="text-center p-4">Yükleniyor...</div>;

    return (
        <div className="container mx-auto py-8">
            <style jsx>{`
                .postCard {
                    border: 1px solid #ccc;
                    border-radius: 8px;
                    padding: 15px;
                    margin-bottom: 15px;
                    background-color: #f9f9f9;
                    text-align: left;
                    position: relative;
                    overflow: hidden;
                    width: 100%;
                    max-width: 700px;
                    transition: opacity 0.3s ease;
                }

                .postCard.read {
                    opacity: 0.6;
                }

                .editButton,
                .goToPostButton {
                    padding: 3px;
                    background-color: #28a745;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    width: 25px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: absolute;
                    bottom: 5px;
                    right: 5px;
                    font-size: 0.8em;
                }

                 .goToPostButton {
                    right: 40px; /* editButton'dan sola kaydır */
                    background-color: #007bff; /* Mavi renk */
                 }

                .timestamp {
                    font-size: 0.7em;
                    color: #777;
                    position: absolute;
                    top: 5px;
                    right: 5px;
                }
            `}</style>
            <div className="flex items-center justify-start mb-6">
                <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
                    <FontAwesomeIcon icon={faBell} className="mr-2 text-gray-500" />
                    Bildirimler
                </h2>
            </div>
            {notifications.length === 0 ? (
                <div className="text-center p-8 text-gray-600 bg-gray-100 rounded-lg">
                    Hiç bildiriminiz yok.
                </div>
            ) : (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-1 lg:grid-cols-2">
                    {notifications.map((notif) => (
                        <div
                            key={notif.notificationID}
                            className={`postCard ${notif.isRead ? 'read' : ''}`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg text-gray-800">{notif.title}</h3>
                                    <p className="text-gray-700">{notif.message}</p>
                                </div>
                                <span className="timestamp">
                                    {moment(notif.createdAt).format('DD.MM.YYYY HH:mm')}
                                </span>
                                {!notif.isRead && (
                                    <button
                                        className="editButton"
                                        onClick={() => markAsRead(notif.notificationID)}
                                    >
                                        <FontAwesomeIcon icon={faCheck} />
                                    </button>
                                )}
                                <button 
                                    className="goToPostButton"
                                    onClick={() => goToPost(notif.forumPostID)} // Burada postId'yi alıyoruz
                                >
                                    <FontAwesomeIcon icon={faExternalLinkAlt} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Notifications;