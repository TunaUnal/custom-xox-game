import React, { useEffect, useState } from 'react';
import './assets/GamePage.css';

export default function GamePage({ user, room, socket, setUser, setRoom }) {
    const [rakip, setRakip] = useState('');
    const [game, setGame] = useState(room.game)
    const [removed, setRemoved] = useState(null)
    const [restartBtn, setRestartBtn] = useState(false)
    const [gameHistory, setGameHistory] = useState(null)

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
        socket.emit('restartGame', { userID: user.sid, roomCode: room.id });
        setRestartBtn(true)
    }

    const quitRoomHandle = () => {
        socket.emit('quitRoom')
    }

    const kickRoomHandle = () => {
        socket.emit('kickUser')
    }

    useEffect(() => {
        socket.on('boardUpdate', getGame => {
            setGame(getGame)
            console.log(getGame)
            if (getGame.moveHistory.length >= 6) {
                setRemoved(getGame.moveHistory[0].index);
            }

        })

        socket.on('gameOver', (getGame, getGameHistory) => {
            setGame(getGame)
            setGameHistory(getGameHistory)
        })

        socket.on('gameRestart', getRoom => {
            setUser(() => getRoom.users.find(u => u.sid == user.sid));
            setGame(getRoom.game)
            setGameHistory(getRoom.gameHistory)
            setRemoved(null)
            setRestartBtn(false)
            setRakip(() => getRoom.users.find(usr => usr.id !== user.id))
        })

        socket.on('updateRoles', getUser => {
            setUser(getUser)
            console.log(getUser)
        })

    }, [])


    return (
        <div className="game-page d-flex align-items-center justify-content-center flex-column">
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
                        <button className='btn btn-primary w-100 btn-large' onClick={() => restartHandle()}>{restartBtn ? "Karşı Taraf Bekleniyor..." : "Yeniden Başlat"}</button>
                    </div>
                )}
            </div>
            {
                gameHistory &&
                <div
                    className={`
                            alert info d-flex justify-content-between w-100 mt-2
                            ${(gameHistory.total[user.sid] || 0) > (gameHistory.total[rakip.sid] || 0) ? "alert-success" : ''} 
                            ${(gameHistory.total[user.sid] || 0) == (gameHistory.total[rakip.sid] || 0) ? "alert-warning" : ''} 
                            ${(gameHistory.total[user.sid] || 0) < (gameHistory.total[rakip.sid] || 0) ? "alert-danger" : ''} 
                            `}
                >
                    <h3 className='w-100 text-center' >Sen : {(gameHistory.total[user.sid] || 0)}</h3>
                    -
                    <h3 className='text-center w-100' > {rakip.username} : {(gameHistory.total[rakip.sid] || 0)}</h3>
                </div>
            }
            <div className='info w-100' >
                <hr />
                <h3 className='text-center' >İşlemler</h3>
                <button className='btn btn-danger btn-sm w-100' onClick={()=>quitRoomHandle()} >Odadan Çık</button>
                {(room.owner == user.sid && room.users.length == 2) && <button className='btn btn-warning btn-sm w-100 mt-2' onClick={()=>kickRoomHandle()}  > {rakip.username}'i odadan çıkar</button>}

            </div>
        </div>
    );
}
