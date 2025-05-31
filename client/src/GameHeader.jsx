import React from 'react';

export default function GameHeader({ roomCode, players }) {
  return (
    <div className="game-header">
      <div className="room-code">Room: {roomCode}</div>
      <div className="players">
        {players.map(p => (
          <div key={p.symbol} className="player">
            <span className={`symbol ${p.symbol.toLowerCase()}`}>{p.symbol}</span> {p.name}
          </div>
        ))}
      </div>
    </div>
  );
}
