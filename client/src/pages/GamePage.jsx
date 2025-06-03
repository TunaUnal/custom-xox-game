import React, { useEffect, useState } from 'react';
import './assets/GamePage.css';

export default function GamePage({ user, room, socket }) {
    const [rakip, setRakip] = useState('');
    const [game, setGame] = useState(room.game)
    const [removed, setRemoved] = useState(null)

    useEffect(() => {
        if (room.users.length !== 1) {
            setRakip(() => room.users.find(usr => usr.id !== user.id))
        }
    }, [room])


    const handleCellClick = (idx) => {
        // 1) Eğer oyun bitti veya o hücre doluysa tıklamayı yoksay
        if (game.board[idx] !== null) return;

        // 2) Sadece eğer kendi sıramdaysa hamleyi server’a yolla
        if (game.turn !== user.userRole) return;

        if (game.win.isWin) return;

        // Server'a makeMove yolla: { index, roomCode }
        socket.emit('makeMove', { index: idx, roomCode: room.id });
        // Oda bilgisini client tarafında göndermek güvenlik zaafiyeti olabilir. Buna karşılık servser'da önlemimizi aldık.
        // Eğer kullanıcı gönderdiği odada değilse 'makeMove' isteği boş dönecek.
        // İleriki versiyonlarda farklı odalara istek atmaya çalışan kullanıcıların banlanması yapılabilir.
    };

    const restartHandle = () => {
        if (!game.win.isWin) return;
        // Eğer oyun henüz kazanılmamışsa işlem yapma.

        socket.emit('restartGame', {userID:user.sid, roomCode:room.id});
    }
    useEffect(() => {
        socket.on('boardUpdate', getGame => {
            setGame(getGame)
            console.log(getGame)
            if (getGame.moveHistory.length >= 6) {
                setRemoved(getGame.moveHistory[0].index);
            }

        })

        socket.on('gameOver', getGame => {
            setGame(getGame)
        })

        socket.on('gameRestart', getGame => {
            setGame(getGame)
        })

    }, [])


    return (
        <div className="game-page d-flex align-items-center justify-content-center">
            <div className="card game-card p-4 shadow-sm text-center">
                {/* ÜST BAR */}
                <h4 className="mb-0">Oda: <span className="fw-bold">{room.id}</span></h4>
                <p className="mb-0">{room.users.length == 1 ? "Rakip Bekleniyor..." : `Rakip : ${rakip.username}`}</p>
                <div className="players d-flex justify-content-center mb-3">
                    <div className="me-player me-2">
                        <span className="badge bg-primary me-1">{user.userRole}</span> Sen
                    </div>
                    <div className="opp-player">
                        <span className="badge bg-danger me-1">{rakip.userRole}</span> Rakip
                    </div>
                </div>

                {/* OYUN TAHTASI */}
                <div className="board mb-3">
                    {console.log("game objesini veriom")}
                    {console.log(game)}
                    {game.board.map((val, idx) => (
                        <div
                            key={idx}
                            className={`
                cell 
                ${val == user.userRole ? "userColor" : 'otherColor'} 
                ${idx == removed ? "oldest" : val == null ? "clickable" : ""} 
                ${game.win.isWin && game.win.line.includes(idx) ? 'winning' : ''}
              `}
                            onClick={() => handleCellClick(idx)}
                        >
                            {val}
                        </div>
                    ))}
                </div>

                {/* SIRA GÖSTERGESİ */}
                <div className="turn-indicator">
                    <span>
                        {game.win.isWin
                            ? `🏆 ${game.win.winner.username} kazandı!`
                            : game.turn === user.userRole
                                ? '👉 Sıra sende'
                                : '⌛ Rakip oynuyor...'}
                    </span>
                </div>
                {game.win.isWin && (

                    <div className="remake">
                        <button className='btn btn-primary w-100 btn-large' onClick={() => restartHandle()}>Yeniden Başlat</button>
                    </div>
                )}
            </div>
            </div>
            );
}
