import React from 'react';
import { SealType } from '../types/game';

export const OrnamentalDivider: React.FC<{ darkInk?: boolean }> = ({ darkInk = false }) => {
  const stroke = darkInk ? '#7a5c2e' : '#b48c4a';
  return (
    <div className="flex items-center gap-2 my-2" aria-hidden="true">
      <div className="h-px flex-1 opacity-40" style={{ backgroundColor: stroke }} />
      <svg width="20" height="12" viewBox="0 0 20 12" fill="none">
        <path
          d="M10 1L14 6L10 11L6 6L10 1Z"
          stroke={stroke}
          strokeWidth="1.2"
        />
        <circle cx="2" cy="6" r="1.2" fill={stroke} />
        <circle cx="18" cy="6" r="1.2" fill={stroke} />
      </svg>
      <div className="h-px flex-1 opacity-40" style={{ backgroundColor: stroke }} />
    </div>
  );
};

export const SealSigil: React.FC<{ seal: SealType; active: boolean }> = ({ seal, active }) => {
  const color = active ? '#f59e0b' : '#57534e';
  if (seal === 'seal_power') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <polygon points="8,1 15,8 8,15 1,8" stroke={color} strokeWidth="1.4" />
        <path d="M8 4V12M5 8H11" stroke={color} strokeWidth="1.4" />
      </svg>
    );
  }
  if (seal === 'seal_wisdom') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="6" stroke={color} strokeWidth="1.4" />
        <polygon points="8,3 12,11 4,11" stroke={color} strokeWidth="1.2" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6" stroke={color} strokeWidth="1.4" />
      <path d="M8 2L9.8 6.2L14 8L9.8 9.8L8 14L6.2 9.8L2 8L6.2 6.2L8 2Z" stroke={color} strokeWidth="1.1" />
    </svg>
  );
};
