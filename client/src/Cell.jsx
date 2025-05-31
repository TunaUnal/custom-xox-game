import React from 'react';

export default function Cell({ value, onClick, isWinning }) {
  const cls = ['cell'];
  if (value) cls.push(value.toLowerCase());
  if (isWinning) cls.push('winning');
  return (
    <div className={cls.join(' ')} onClick={onClick}>
      {value}
    </div>
  );
}
