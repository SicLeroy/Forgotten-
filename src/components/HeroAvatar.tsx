import React, { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';

interface HeroAvatarProps {
  src: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}

export const HeroAvatar: React.FC<HeroAvatarProps> = ({
  src,
  alt,
  className = 'h-16 w-16 rounded-md object-cover',
  fallbackLabel,
}) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (failed || !src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-[#1b2029] border border-amber-700/40 text-amber-300 ${className}`}
      >
        <Shield className="h-5 w-5" aria-hidden="true" />
        {fallbackLabel && (
          <span className="mt-1 text-[10px] font-display font-bold truncate max-w-full px-1">
            {fallbackLabel}
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};
