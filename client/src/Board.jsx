import React from 'react';
import Cell from './Cell';

export default function Board({ cells, onClick, winningCells }) {
  return (
    <div className="board">
      {cells.map((v, i) => (
        <Cell 
          key={i}
          value={v}
          onClick={() => onClick(i)}
          isWinning={winningCells.includes(i)}
        />
      ))}
    </div>
  );
}
