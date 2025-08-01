export const MARKETPLACE_IDS = {
  'NA': {
    'CA': 'A2EUQ1WTGCTBG2',  // Canada
    'US': 'ATVPDKIKX0DER',   // United States
    'MX': 'A1AM78C64UM0Y8',  // Mexico
    'BR': 'A2Q3Y263D00KWC'   // Brazil
  },
  'EU': {
    'ES': 'A1RKKUPIHCS9HS',  // Spain
    'GB': 'A1F83G8C2ARO7P',  // UK
    'FR': 'A13V1IB3VIYZZH',  // France
    'NL': 'A1805IZSGTT6HS',  // Netherlands
    'DE': 'A1PA6795UKMFR9',  // Germany
    'IT': 'APJ6JRA9NG5V4',   // Italy
    'SE': 'A2NODRKZP88ZB9',  // Sweden
    'PL': 'A1C3SOZRARQ6R3',  // Poland
    'EG': 'ARBP9OOSHTCHU',   // Egypt
    'TR': 'A33AVAJ2PDY3EV',  // Turkey
    'SA': 'A17E79C6D8DWNP',  // Saudi Arabia
    'AE': 'A2VIGQ35RCS4UG',  // United Arab Emirates
    'IN': 'A21TJRUUN4KGV'    // India
  },
  'FE': {
    'SG': 'A19VAU5U5O7RUS',  // Singapore
    'AU': 'A39IBJ37TRP1C6',  // Australia
    'JP': 'A1VC38T7YXB528'   // Japan
  }
} as const;

export type Region = keyof typeof MARKETPLACE_IDS;
export type MarketplaceCode = 
  | keyof typeof MARKETPLACE_IDS['NA']
  | keyof typeof MARKETPLACE_IDS['EU']
  | keyof typeof MARKETPLACE_IDS['FE'];

export const MARKETPLACE_NAMES = {
  'CA': 'Canada',
  'US': 'United States',
  'MX': 'Mexico',
  'BR': 'Brazil',
  'ES': 'Spain',
  'GB': 'United Kingdom',
  'FR': 'France',
  'NL': 'Netherlands',
  'DE': 'Germany',
  'IT': 'Italy',
  'SE': 'Sweden',
  'PL': 'Poland',
  'EG': 'Egypt',
  'TR': 'Turkey',
  'SA': 'Saudi Arabia',
  'AE': 'United Arab Emirates',
  'IN': 'India',
  'SG': 'Singapore',
  'AU': 'Australia',
  'JP': 'Japan'
} as const;

// Country to marketplace code mapping for simplified dialog
export const COUNTRY_TO_MARKETPLACE: Record<string, MarketplaceCode> = {
  'Canada': 'CA',
  'United States': 'US',
  'Mexico': 'MX',
  'Brazil': 'BR',
  'Spain': 'ES',
  'United Kingdom': 'GB',
  'France': 'FR',
  'Netherlands': 'NL',
  'Germany': 'DE',
  'Italy': 'IT',
  'Sweden': 'SE',
  'Poland': 'PL',
  'Egypt': 'EG',
  'Turkey': 'TR',
  'Saudi Arabia': 'SA',
  'United Arab Emirates': 'AE',
  'India': 'IN',
  'Singapore': 'SG',
  'Australia': 'AU',
  'Japan': 'JP'
};

// Country to region mapping
export const COUNTRY_TO_REGION: Record<string, Region> = {
  'Canada': 'NA',
  'United States': 'NA',
  'Mexico': 'NA',
  'Brazil': 'NA',
  'Spain': 'EU',
  'United Kingdom': 'EU',
  'France': 'EU',
  'Netherlands': 'EU',
  'Germany': 'EU',
  'Italy': 'EU',
  'Sweden': 'EU',
  'Poland': 'EU',
  'Egypt': 'EU',
  'Turkey': 'EU',
  'Saudi Arabia': 'EU',
  'United Arab Emirates': 'EU',
  'India': 'EU',
  'Singapore': 'FE',
  'Australia': 'FE',
  'Japan': 'FE'
};

// Get all available countries sorted alphabetically
export const AVAILABLE_COUNTRIES = Object.keys(COUNTRY_TO_MARKETPLACE).sort();
