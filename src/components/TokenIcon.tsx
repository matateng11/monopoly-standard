import React from 'react';
import { PlayerToken } from '../shared/types.ts';
import { Car, Crown, Disc, Dog, Anchor, Cat } from 'lucide-react';

interface TokenIconProps {
  token: PlayerToken;
  color?: string;
  className?: string;
  size?: number;
}

export const TokenIcon: React.FC<TokenIconProps> = ({ token, color, className = '', size = 20 }) => {
  const style = color ? { color } : undefined;

  switch (token) {
    case 'car':
      return <Car size={size} style={style} className={className} />;
    case 'hat':
      return <Crown size={size} style={style} className={className} />;
    case 'thimble':
      return <Disc size={size} style={style} className={className} />;
    case 'dog':
      return <Dog size={size} style={style} className={className} />;
    case 'ship':
      return <Anchor size={size} style={style} className={className} />;
    case 'cat':
      return <Cat size={size} style={style} className={className} />;
    default:
      return <Car size={size} style={style} className={className} />;
  }
};

export const TOKEN_NAMES: Record<PlayerToken, string> = {
  car: 'Mobil Balap',
  hat: 'Topi Tinggi',
  thimble: 'Bidal Emas',
  dog: 'Anjing Scottie',
  ship: 'Kapal Layar',
  cat: 'Kucing Lucu',
};
