import React, { useState } from 'react';
import './assets/LoginPage.css';
import toast from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';
export default function LoginPage({ onCreateRoom, onJoinRoom }) {
    const [username, setUsername] = useState('');
    const [joinCode, setJoinCode] = useState('');

    const handleCreate = () => {
        if (!username.trim()) return toast.error("İsim gir.");
        const user = {
            username: username.trim(),
            id: Date.now()
        }
        onCreateRoom(user);
    };

    const handleJoin = () => {
        if (!username.trim() || !joinCode.trim()) return toast.error('İsim ve oda kodu gerekli');
        const user = {
            username: username.trim(),
            id: Date.now()
        }
        onJoinRoom(user, joinCode.trim());
    };

    return (
        <div className="login-page d-flex align-items-center justify-content-center">
            <div className="card p-4 shadow-sm w-100" style={{ maxWidth: '400px' }}>
                <h2 className="text-center mb-4">XOX Oyunu’na Hoşgeldin</h2>

                <div className="mb-4">
                    <label htmlFor="username" className="form-label">
                        İsim
                    </label>
                    <input
                        id="username"
                        type="text"
                        className="form-control"
                        placeholder="Adını yaz…"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoComplete="off"
                    />
                </div>

                <div className="row g-2">
                    {/* Oda Oluştur */}
                    <div className="col-6">
                        <button
                            className="btn btn-primary w-100"
                            onClick={handleCreate}
                        >
                            Oda Oluştur
                        </button>
                    </div>

                    {/* Odaya Katıl */}
                    <div className="col-6">
                        <div className="input-group">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Oda Kodu"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value)}
                                autoComplete="off"
                            />
                            <button
                                className="btn btn-success"
                                onClick={handleJoin}
                            >
                                Katıl
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
