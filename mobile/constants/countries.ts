export interface Country {
    code: string;
    name: string;
    callingCode: string;
    flag: string;
}

export const COUNTRIES: Country[] = [
    { code: 'IN', name: 'India', callingCode: '91', flag: '🇮🇳' },
    { code: 'US', name: 'United States', callingCode: '1', flag: '🇺🇸' },
    { code: 'GB', name: 'United Kingdom', callingCode: '44', flag: '🇬🇧' },
    { code: 'AE', name: 'United Arab Emirates', callingCode: '971', flag: '🇦🇪' },
    { code: 'SA', name: 'Saudi Arabia', callingCode: '966', flag: '🇸🇦' },
    { code: 'SG', name: 'Singapore', callingCode: '65', flag: '🇸🇬' },
    { code: 'AU', name: 'Australia', callingCode: '61', flag: '🇦🇺' },
    { code: 'CA', name: 'Canada', callingCode: '1', flag: '🇨🇦' },
    { code: 'DE', name: 'Germany', callingCode: '49', flag: '🇩🇪' },
    { code: 'FR', name: 'France', callingCode: '33', flag: '🇫🇷' },
    { code: 'MY', name: 'Malaysia', callingCode: '60', flag: '🇲🇾' },
    { code: 'ID', name: 'Indonesia', callingCode: '62', flag: '🇮🇩' },
    { code: 'TH', name: 'Thailand', callingCode: '66', flag: '🇹🇭' },
    { code: 'VN', name: 'Vietnam', callingCode: '84', flag: '🇻🇳' },
    { code: 'PH', name: 'Philippines', callingCode: '63', flag: '🇵🇭' },
];
