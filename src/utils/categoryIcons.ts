// Color del pin por categoría, para que los pines del mapa se distingan de
// un vistazo. Se usa el pin nativo de Google Maps (pinColor) con estos colores.
const CATEGORY_COLORS: Record<string, string> = {
    Castles: '#8B5E3C',
    Museums: '#3B82F6',
    'Historic Site': '#F59E0B',
    Ruins: '#78716C',
    Religious: '#7C3AED',
    Statues: '#059669',
};

const DEFAULT_COLOR = '#EF4444';

export const getCategoryColor = (category?: string): string =>
    (category ? CATEGORY_COLORS[category] : undefined) ?? DEFAULT_COLOR;
