'use client';

interface MaterialIconProps {
  name: string;
  className?: string;
  filled?: boolean;
}

export default function MaterialIcon({ name, className = '', filled = false }: MaterialIconProps) {
  return (
    <span 
      className={`material-symbols-outlined ${filled ? 'material-symbols-filled' : ''} ${className}`}
      style={{ fontVariationSettings: filled ? '"FILL" 1' : '"FILL" 0' }}
    >
      {name}
    </span>
  );
}

