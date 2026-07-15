import React, { useState, useEffect, useRef } from 'react';
import {
  View, TextInput, FlatList, Text, TouchableOpacity,
  StyleSheet, ActivityIndicator, Keyboard,
} from 'react-native';
import { TOP_CITIES } from '../data/topCities';

interface SuggestionItem {
  properties: {
    name: string;
    country?: string;
    countrycode?: string;
    source?: string;
  };
  geometry: {
    coordinates: [number, number];
  };
}

interface Props {
  onLocationSelect: (coordinates: [number, number], name: string) => void;
}

const CitySearch: React.FC<Props> = ({ onLocationSelect }) => {
  const [query, setQuery] = useState<string>('');
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showList, setShowList] = useState<boolean>(false);
  const [shouldSearch, setShouldSearch] = useState<boolean>(true);
  const shouldSearchRef = useRef<boolean>(shouldSearch);

  useEffect(() => {
    shouldSearchRef.current = shouldSearch;
  }, [shouldSearch]);

  const WESTERN_COUNTRIES = [
    'DE', 'AT', 'CH', 'NL', 'BE', 'LU', 'LI',
    'ES', 'FR', 'IT', 'PT', 'GB', 'IE', 'AD', 'MC', 'MT', 'SM', 'VA',
    'GR', 'CY', 'DK', 'SE', 'NO', 'FI', 'IS',
    'PL', 'CZ', 'SK', 'HU', 'EE', 'LV', 'LT',
    'RO', 'BG', 'MD', 'UA', 'BY', 'RU',
    'AL', 'HR', 'BA', 'RS', 'ME', 'MK', 'SI', 'XK',
    'US', 'CA', 'MX', 'AR', 'BR', 'CL', 'CO', 'PE', 'UY', 'EC', 'BO', 'PY', 'VE', 'CR', 'PA',
    'AU', 'NZ',
  ];

  useEffect(() => {
    if (!shouldSearch) return;

    if (query.length > 1) {
      const localResults = TOP_CITIES.filter(city =>
        city.name.toLowerCase().startsWith(query.toLowerCase()),
      ).map(city => ({
        properties: {
          name: city.name,
          country: city.country,
          countrycode: city.countryCode,
          source: 'local',
        },
        geometry: { coordinates: [city.lon, city.lat] as [number, number] },
      }));

      if (localResults.length > 0) {
        setSuggestions(localResults);
        setShowList(true);
      }
    }

    const delayDebounceFn = setTimeout(() => {
      if (query.length > 2) {
        fetchPlaces(query);
      } else if (query.length === 0) {
        setSuggestions([]);
        setShowList(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [query, shouldSearch]);

  const fetchPlaces = async (text: string): Promise<void> => {
    setLoading(true);
    try {
      const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(text)}&lang=en&limit=10`;
      const response = await fetch(url, { headers: { 'User-Agent': 'CastleApp/1.0' } });

      if (!response.ok) throw new Error('Fallo Photon');

      const json = await response.json();
      if (!shouldSearchRef.current) return;

      const features: any[] = json.features || [];
      const apiFiltered = features.filter(item => {
        const code = item?.properties?.countrycode?.toUpperCase();
        return code && WESTERN_COUNTRIES.includes(code);
      }) as SuggestionItem[];

      if (apiFiltered.length > 0) {
        setSuggestions(prev => {
          const existingNames = new Set(
            prev.filter(p => p.properties.source === 'local').map(p => p.properties.name),
          );
          const newFromApi = apiFiltered.filter(item => !existingNames.has(item.properties.name));
          return [...prev.filter(p => p.properties.source === 'local'), ...newFromApi];
        });
        setShowList(true);
      }
    } catch (error) {
      if (shouldSearchRef.current) fetchNominatimFallback(text);
    } finally {
      if (shouldSearchRef.current) setLoading(false);
    }
  };

  const fetchNominatimFallback = async (text: string): Promise<void> => {
    try {
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&addressdetails=1&limit=5&accept-language=en`;
      const res = await fetch(nominatimUrl, { headers: { 'User-Agent': 'CastleApp/1.0' } });
      if (!res.ok) throw new Error('Fallo Nominatim');
      const data: any[] = await res.json();

      if (!shouldSearchRef.current) return;

      const adaptedSuggestions: SuggestionItem[] = data
        .map(item => ({
          properties: {
            name: item.name || item.display_name.split(',')[0],
            country: item.address?.country,
            countrycode: item.address?.country_code?.toUpperCase(),
          },
          geometry: { coordinates: [parseFloat(item.lon), parseFloat(item.lat)] as [number, number] },
        }))
        .filter(
          item => item.properties.countrycode && WESTERN_COUNTRIES.includes(item.properties.countrycode),
        );

      if (adaptedSuggestions.length > 0) {
        setSuggestions(adaptedSuggestions);
        setShowList(true);
      }
    } catch (e) {
      // Silent
    } finally {
      if (shouldSearchRef.current) setLoading(false);
    }
  };

  const handleSelect = (item: SuggestionItem): void => {
    Keyboard.dismiss();
    setShouldSearch(false);

    const cityName = item?.properties?.name || 'Location';
    const countryName = item?.properties?.country || '';
    const fullName = countryName ? `${cityName}, ${countryName}` : cityName;

    setQuery(fullName);
    setSuggestions([]);
    setShowList(false);

    if (onLocationSelect && item?.geometry?.coordinates) {
      onLocationSelect(item.geometry.coordinates, fullName);
    }
  };

  const handleTextChange = (text: string): void => {
    setShouldSearch(true);
    setQuery(text);
    if (text.length === 0) setShowList(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Search City (e.g. Vienna, Salzburg)..."
          value={query}
          onChangeText={handleTextChange}
          placeholderTextColor="#666"
        />
        {loading && <ActivityIndicator style={{ marginLeft: 10 }} size="small" color="#38761D" />}
      </View>

      {showList && suggestions.length > 0 && (
        <View style={styles.listContainer}>
          <FlatList
            data={suggestions}
            keyExtractor={(item, index) => `${item.properties.name}-${index}`}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.item} onPress={() => handleSelect(item)}>
                <View>
                  <Text style={styles.cityText}>{item?.properties?.name}</Text>
                  <Text style={styles.countryText}>{item?.properties?.country}</Text>
                </View>
                {item?.properties?.source === 'local' && (
                  <Text style={{ fontSize: 10, color: '#38761D' }}>⚡</Text>
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: '100%', position: 'relative', zIndex: 9999 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 25, paddingHorizontal: 15, height: 50, elevation: 4,
    shadowColor: '#000', shadowOpacity: 0.2, shadowOffset: { width: 0, height: 2 },
  },
  input: { flex: 1, fontSize: 16, color: '#333' },
  listContainer: {
    position: 'absolute', top: 55, left: 10, right: 10,
    backgroundColor: '#fff', borderRadius: 15, maxHeight: 220,
    elevation: 10, zIndex: 9999, overflow: 'hidden',
  },
  item: {
    padding: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  cityText: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  countryText: { fontSize: 14, color: '#666' },
});

export default CitySearch;
