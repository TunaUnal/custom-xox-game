import React from 'react';

export default function TurnIndicator({ current, winner }) {
  if (winner) return <div className="turn">🏆 {winner.player} kazandı!</div>;
  return (
    <div className="turn">
      {current === 'X' ? '👉 Sıra sende (X)' : '👉 Rakip oynuyor (O)'}
    </div>
  );
}
