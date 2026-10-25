import { BoardTile, ColorGroup } from './types.ts';

export const BOARD_TILES: BoardTile[] = [
  {
    id: 0,
    name: 'MULAI',
    subName: 'Dapat $200 tiap lewat',
    type: 'go',
    colorGroup: 'special',
  },
  {
    id: 1,
    name: 'Monas',
    subName: 'Mediterania',
    type: 'property',
    colorGroup: 'brown',
    price: 60,
    rent: [2, 10, 30, 90, 160, 250],
    mortgageValue: 30,
    houseCost: 50,
  },
  {
    id: 2,
    name: 'Dana Umum',
    subName: 'Community Chest',
    type: 'community_chest',
    colorGroup: 'special',
  },
  {
    id: 3,
    name: 'Pasar Senen',
    subName: 'Baltik',
    type: 'property',
    colorGroup: 'brown',
    price: 60,
    rent: [4, 20, 60, 180, 320, 450],
    mortgageValue: 30,
    houseCost: 50,
  },
  {
    id: 4,
    name: 'Pajak Penghasilan',
    subName: 'Bayar $200',
    type: 'tax',
    colorGroup: 'special',
    taxAmount: 200,
  },
  {
    id: 5,
    name: 'Stasiun Gambir',
    subName: 'Kereta Api',
    type: 'railroad',
    colorGroup: 'railroad',
    price: 200,
    rent: [25, 50, 100, 200],
    mortgageValue: 100,
  },
  {
    id: 6,
    name: 'Kota Tua',
    subName: 'Oriental',
    type: 'property',
    colorGroup: 'light_blue',
    price: 100,
    rent: [6, 30, 90, 270, 400, 550],
    mortgageValue: 50,
    houseCost: 50,
  },
  {
    id: 7,
    name: 'Kesempatan',
    subName: 'Chance',
    type: 'chance',
    colorGroup: 'special',
  },
  {
    id: 8,
    name: 'Kramat Raya',
    subName: 'Vermont',
    type: 'property',
    colorGroup: 'light_blue',
    price: 100,
    rent: [6, 30, 90, 270, 400, 550],
    mortgageValue: 50,
    houseCost: 50,
  },
  {
    id: 9,
    name: 'Salemba',
    subName: 'Connecticut',
    type: 'property',
    colorGroup: 'light_blue',
    price: 120,
    rent: [8, 40, 100, 300, 450, 600],
    mortgageValue: 60,
    houseCost: 50,
  },
  {
    id: 10,
    name: 'Penjara',
    subName: 'Hanya Berkunjung',
    type: 'jail',
    colorGroup: 'special',
  },
  {
    id: 11,
    name: 'Menteng',
    subName: 'St. Charles',
    type: 'property',
    colorGroup: 'pink',
    price: 140,
    rent: [10, 50, 150, 450, 625, 750],
    mortgageValue: 70,
    houseCost: 100,
  },
  {
    id: 12,
    name: 'PLN Listrik',
    subName: 'Perusahaan Listrik',
    type: 'utility',
    colorGroup: 'utility',
    price: 150,
    mortgageValue: 75,
  },
  {
    id: 13,
    name: 'Cikini',
    subName: 'States Ave',
    type: 'property',
    colorGroup: 'pink',
    price: 140,
    rent: [10, 50, 150, 450, 625, 750],
    mortgageValue: 70,
    houseCost: 100,
  },
  {
    id: 14,
    name: 'Matraman',
    subName: 'Virginia Ave',
    type: 'property',
    colorGroup: 'pink',
    price: 160,
    rent: [12, 60, 180, 500, 700, 900],
    mortgageValue: 80,
    houseCost: 100,
  },
  {
    id: 15,
    name: 'Stasiun Jatinegara',
    subName: 'Kereta Api',
    type: 'railroad',
    colorGroup: 'railroad',
    price: 200,
    rent: [25, 50, 100, 200],
    mortgageValue: 100,
  },
  {
    id: 16,
    name: 'Harmoni',
    subName: 'St. James',
    type: 'property',
    colorGroup: 'orange',
    price: 180,
    rent: [14, 70, 200, 550, 750, 950],
    mortgageValue: 90,
    houseCost: 100,
  },
  {
    id: 17,
    name: 'Dana Umum',
    subName: 'Community Chest',
    type: 'community_chest',
    colorGroup: 'special',
  },
  {
    id: 18,
    name: 'Gajah Mada',
    subName: 'Tennessee Ave',
    type: 'property',
    colorGroup: 'orange',
    price: 180,
    rent: [14, 70, 200, 550, 750, 950],
    mortgageValue: 90,
    houseCost: 100,
  },
  {
    id: 19,
    name: 'Hayam Wuruk',
    subName: 'New York Ave',
    type: 'property',
    colorGroup: 'orange',
    price: 200,
    rent: [16, 80, 220, 600, 800, 1000],
    mortgageValue: 100,
    houseCost: 100,
  },
  {
    id: 20,
    name: 'Parkir Bebas',
    subName: 'Free Parking',
    type: 'free_parking',
    colorGroup: 'special',
  },
  {
    id: 21,
    name: 'Blok M',
    subName: 'Kentucky Ave',
    type: 'property',
    colorGroup: 'red',
    price: 220,
    rent: [18, 90, 250, 700, 875, 1050],
    mortgageValue: 110,
    houseCost: 150,
  },
  {
    id: 22,
    name: 'Kesempatan',
    subName: 'Chance',
    type: 'chance',
    colorGroup: 'special',
  },
  {
    id: 23,
    name: 'MH Thamrin',
    subName: 'Indiana Ave',
    type: 'property',
    colorGroup: 'red',
    price: 220,
    rent: [18, 90, 250, 700, 875, 1050],
    mortgageValue: 110,
    houseCost: 150,
  },
  {
    id: 24,
    name: 'Jenderal Sudirman',
    subName: 'Illinois Ave',
    type: 'property',
    colorGroup: 'red',
    price: 240,
    rent: [20, 100, 300, 750, 925, 1100],
    mortgageValue: 120,
    houseCost: 150,
  },
  {
    id: 25,
    name: 'Stasiun Manggarai',
    subName: 'Kereta Api',
    type: 'railroad',
    colorGroup: 'railroad',
    price: 200,
    rent: [25, 50, 100, 200],
    mortgageValue: 100,
  },
  {
    id: 26,
    name: 'Gatot Subroto',
    subName: 'Atlantic Ave',
    type: 'property',
    colorGroup: 'yellow',
    price: 260,
    rent: [22, 110, 330, 800, 975, 1150],
    mortgageValue: 130,
    houseCost: 150,
  },
  {
    id: 27,
    name: 'Rasuna Said',
    subName: 'Ventnor Ave',
    type: 'property',
    colorGroup: 'yellow',
    price: 260,
    rent: [22, 110, 330, 800, 975, 1150],
    mortgageValue: 130,
    houseCost: 150,
  },
  {
    id: 28,
    name: 'PAM Air Bersih',
    subName: 'Water Works',
    type: 'utility',
    colorGroup: 'utility',
    price: 150,
    mortgageValue: 75,
  },
  {
    id: 29,
    name: 'Mega Kuningan',
    subName: 'Marvin Gardens',
    type: 'property',
    colorGroup: 'yellow',
    price: 280,
    rent: [24, 120, 360, 850, 1025, 1200],
    mortgageValue: 140,
    houseCost: 150,
  },
  {
    id: 30,
    name: 'Masuk Penjara',
    subName: 'Pergi Ke Penjara!',
    type: 'go_to_jail',
    colorGroup: 'special',
  },
  {
    id: 31,
    name: 'Kemang',
    subName: 'Pacific Ave',
    type: 'property',
    colorGroup: 'green',
    price: 300,
    rent: [26, 130, 390, 900, 1100, 1275],
    mortgageValue: 150,
    houseCost: 200,
  },
  {
    id: 32,
    name: 'Senopati',
    subName: 'North Carolina',
    type: 'property',
    colorGroup: 'green',
    price: 300,
    rent: [26, 130, 390, 900, 1100, 1275],
    mortgageValue: 150,
    houseCost: 200,
  },
  {
    id: 33,
    name: 'Dana Umum',
    subName: 'Community Chest',
    type: 'community_chest',
    colorGroup: 'special',
  },
  {
    id: 34,
    name: 'Pondok Indah',
    subName: 'Pennsylvania',
    type: 'property',
    colorGroup: 'green',
    price: 320,
    rent: [28, 150, 450, 1000, 1200, 1400],
    mortgageValue: 160,
    houseCost: 200,
  },
  {
    id: 35,
    name: 'MRT Bundaran HI',
    subName: 'Stasiun Kereta',
    type: 'railroad',
    colorGroup: 'railroad',
    price: 200,
    rent: [25, 50, 100, 200],
    mortgageValue: 100,
  },
  {
    id: 36,
    name: 'Kesempatan',
    subName: 'Chance',
    type: 'chance',
    colorGroup: 'special',
  },
  {
    id: 37,
    name: 'Senayan City',
    subName: 'Park Place',
    type: 'property',
    colorGroup: 'dark_blue',
    price: 350,
    rent: [35, 175, 500, 1100, 1300, 1500],
    mortgageValue: 175,
    houseCost: 200,
  },
  {
    id: 38,
    name: 'Pajak Mewah',
    subName: 'Bayar $100',
    type: 'tax',
    colorGroup: 'special',
    taxAmount: 100,
  },
  {
    id: 39,
    name: 'SCBD Sudirman',
    subName: 'Boardwalk',
    type: 'property',
    colorGroup: 'dark_blue',
    price: 400,
    rent: [50, 200, 600, 1400, 1700, 2000],
    mortgageValue: 200,
    houseCost: 200,
  },
];

export const COLOR_GROUP_DEFINITIONS: Record<ColorGroup, { name: string; hex: string; tileIds: number[] }> = {
  brown: { name: 'Cokelat', hex: '#8B4513', tileIds: [1, 3] },
  light_blue: { name: 'Biru Muda', hex: '#87CEEB', tileIds: [6, 8, 9] },
  pink: { name: 'Merah Muda', hex: '#FF69B4', tileIds: [11, 13, 14] },
  orange: { name: 'Oranye', hex: '#FFA500', tileIds: [16, 18, 19] },
  red: { name: 'Merah', hex: '#DC2626', tileIds: [21, 23, 24] },
  yellow: { name: 'Kuning', hex: '#EAB308', tileIds: [26, 27, 29] },
  green: { name: 'Hijau', hex: '#16A34A', tileIds: [31, 32, 34] },
  dark_blue: { name: 'Biru Tua', hex: '#1E40AF', tileIds: [37, 39] },
  railroad: { name: 'Stasiun Kereta', hex: '#4B5563', tileIds: [5, 15, 25, 35] },
  utility: { name: 'Fasilitas Umum', hex: '#0D9488', tileIds: [12, 28] },
  special: { name: 'Spesial', hex: '#64748B', tileIds: [0, 2, 4, 7, 10, 17, 20, 22, 30, 33, 36, 38] },
};

export function getTile(id: number): BoardTile {
  return BOARD_TILES[id % 40];
}

// Calculate rent based on current state and ownership
export function calculateRent(
  tile: BoardTile,
  ownershipRecord: Record<number, { ownerId: string | null; houses: number; isMortgaged: boolean }>,
  diceSum: number
): number {
  const current = ownershipRecord[tile.id];
  if (!current || !current.ownerId || current.isMortgaged) return 0;

  const ownerId = current.ownerId;

  if (tile.type === 'railroad') {
    const railroadIds = COLOR_GROUP_DEFINITIONS.railroad.tileIds;
    const ownedCount = railroadIds.filter(id => ownershipRecord[id]?.ownerId === ownerId).length;
    // Standard railroad rent: $25 for 1, $50 for 2, $100 for 3, $200 for 4
    const rents = [0, 25, 50, 100, 200];
    return rents[ownedCount] || 0;
  }

  if (tile.type === 'utility') {
    const utilityIds = COLOR_GROUP_DEFINITIONS.utility.tileIds;
    const ownedCount = utilityIds.filter(id => ownershipRecord[id]?.ownerId === ownerId).length;
    // 4x dice roll if 1 utility, 10x if both
    const multiplier = ownedCount === 2 ? 10 : 4;
    return diceSum * multiplier;
  }

  if (tile.type === 'property' && tile.rent && tile.colorGroup) {
    const groupDef = COLOR_GROUP_DEFINITIONS[tile.colorGroup];
    const ownsAllInGroup = groupDef.tileIds.every(id => ownershipRecord[id]?.ownerId === ownerId);

    // If houses are built
    if (current.houses > 0) {
      return tile.rent[current.houses] || 0;
    }

    // Unimproved: double rent if whole color group owned (and no properties in group mortgaged)
    const baseRent = tile.rent[0];
    const anyMortgaged = groupDef.tileIds.some(id => ownershipRecord[id]?.isMortgaged);
    if (ownsAllInGroup && !anyMortgaged) {
      return baseRent * 2;
    }
    return baseRent;
  }

  return 0;
}
