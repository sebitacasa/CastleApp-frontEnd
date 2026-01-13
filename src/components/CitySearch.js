import React, { useState, useEffect } from 'react';
import { 
  View, TextInput, FlatList, Text, TouchableOpacity, 
  StyleSheet, ActivityIndicator, Keyboard 
} from 'react-native';

const CitySearch = ({ onLocationSelect }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showList, setShowList] = useState(false);
  
  // NUEVO ESTADO: Controla si debemos buscar o no
  const [shouldSearch, setShouldSearch] = useState(true); // <--- CAMBIO IMPORTANTE

 // Lista de países permitidos
  // Lista de países permitidos (Códigos ISO de 2 letras en MAYÚSCULAS)
  const WESTERN_COUNTRIES = [
      // Europa Central y Norte
      'DE', 'AT', 'CH', 'NL', 'BE', 'LU', 'LI', // Alemania, Austria, Suiza, etc.
      // Europa Sur/Oeste
      'ES', 'FR', 'IT', 'PT', 'GB', 'IE', 'AD', 'MC', 'MT', 'SM', 'VA', 
    'GR', 'CY', // Grecia, Chipre

    // Europa Central y Norte (DACH, Benelux, Escandinavia)
    'DE', 'AT', 'CH', 'LI', // Alemania, Austria, Suiza, Liechtenstein
    'NL', 'BE', 'LU',       // Países Bajos, Bélgica, Luxemburgo
    'DK', 'SE', 'NO', 'FI', 'IS', // Dinamarca, Suecia, Noruega, Finlandia, Islandia

    // Europa del Este y Bálticos
    'PL', 'CZ', 'SK', 'HU', // Polonia, Chequia, Eslovaquia, Hungría
    'EE', 'LV', 'LT',       // Estonia, Letonia, Lituania
    'RO', 'BG', 'MD',       // Rumania, Bulgaria, Moldavia
    'UA', 'BY', 'RU',       // Ucrania, Bielorrusia, Rusia

    // Balcanes
    'AL', 'HR', 'BA', 'RS', 'ME', 'MK', 'SI', 'XK' /
      // Escandinavia
      'DK', 'SE', 'NO', 'FI', 'IS',
      // Europa Este (Opcional, según tu alcance)
      'PL', 'CZ', 'HU', 'SK', 'SI', 'HR', 'GR',
      // Américas
      'US', 'CA', 'MX', 
      'AR', 'BR', 'CL', 'CO', 'PE', 'UY', 'EC', 'BO', 'PY', 'VE', 'CR', 'PA'
      
  ];

  useEffect(() => {
    // Si la bandera dice que NO busquemos (porque acabamos de seleccionar), no hacemos nada.
    if (!shouldSearch) return; // <--- CAMBIO: Bloqueo de búsqueda indeseada

    const delayDebounceFn = setTimeout(() => {
      if (query.length > 2) {
        fetchPlaces(query);
      } else {
        setSuggestions([]); 
        setShowList(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query, shouldSearch]); // <--- Agregamos shouldSearch a las dependencias

  // --- INTENTO 1: PHOTON ---
  const fetchPlaces = async (text) => {
    setLoading(true);
    try {
      const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(text)}&lang=es&limit=10`;
      const response = await fetch(url, { headers: { 'User-Agent': 'CastleApp/1.0' } });

      if (!response.ok) throw new Error("Fallo Photon");

      const json = await response.json();
      const features = json.features || [];
      
     const filtered = features.filter(item => {
        // Normalizamos a mayúsculas para evitar errores
        const code = item?.properties?.countrycode?.toUpperCase();
        
        // LOG PARA DEPURAR (Míralo en la terminal)
        // console.log(`Ciudad: ${item.properties.name} | País: ${code} | ¿Pasa?: ${WESTERN_COUNTRIES.includes(code)}`);
        
        return code && WESTERN_COUNTRIES.includes(code);
      });
      if (filtered.length > 0) {
          setSuggestions(filtered);
          setShowList(true);
          setLoading(false);
      } else {
          throw new Error("Sin resultados");
      }

    } catch (error) {
      fetchNominatimFallback(text);
    }
  };

  // --- INTENTO 2: NOMINATIM ---
  const fetchNominatimFallback = async (text) => {
    try {
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&addressdetails=1&limit=5&accept-language=es`;
        const res = await fetch(nominatimUrl, { headers: { 'User-Agent': 'CastleApp/1.0' } });

        if (!res.ok) throw new Error("Fallo Nominatim");

        const data = await res.json();
        
        const adaptedSuggestions = data.map(item => ({
            properties: {
                name: item.name || item.display_name.split(',')[0],
                city: item.address?.city || item.address?.town || item.address?.state,
                country: item.address?.country,
                countrycode: item.address?.country_code?.toUpperCase()
            },
            geometry: { coordinates: [parseFloat(item.lon), parseFloat(item.lat)] }
        })).filter(item => item.properties.countrycode && WESTERN_COUNTRIES.includes(item.properties.countrycode));

        setSuggestions(adaptedSuggestions);
        setShowList(adaptedSuggestions.length > 0);

    } catch (e) {
        setSuggestions([]);
    } finally {
        setLoading(false);
    }
  };

 const handleSelect = (item) => {
    Keyboard.dismiss();
    setShouldSearch(false); 

    const cityName = item?.properties?.name || "Ubicación";
    const countryName = item?.properties?.country || "";
    const fullName = `${cityName}, ${countryName}`; // <--- Creamos el nombre completo
    
    setQuery(fullName);
    setSuggestions([]);
    setShowList(false);

    if (onLocationSelect && item?.geometry?.coordinates) {
      // CAMBIO: Enviamos coordenadas Y el nombre
      onLocationSelect(item.geometry.coordinates, fullName); 
    }
  };

  const handleTextChange = (text) => {
      // Si el usuario escribe, reactivamos la búsqueda
      setShouldSearch(true); // <--- CAMBIO: Volvemos a permitir buscar
      setQuery(text);
      if (text.length === 0) setShowList(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Buscar ciudad (ej: Roma)..."
          value={query}
          onChangeText={handleTextChange} // <--- Usamos la nueva función
          placeholderTextColor="#666"
        />
        {loading && <ActivityIndicator style={{marginLeft: 10}} size="small" color="#38761D" />}
      </View>

      {showList && suggestions.length > 0 && (
        <View style={styles.listContainer}>
          <FlatList
            data={suggestions}
            keyExtractor={(item, index) => index.toString()}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.item} onPress={() => handleSelect(item)}>
                <Text style={styles.cityText}>{item?.properties?.name}</Text>
                <Text style={styles.countryText}>{item?.properties?.country}</Text>
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
    shadowColor: '#000', shadowOpacity: 0.2, shadowOffset: {width:0, height:2}
  },
  input: { flex: 1, fontSize: 16, color: '#333' },
  listContainer: {
    position: 'absolute', top: 55, left: 10, right: 10,
    backgroundColor: '#fff', borderRadius: 15, maxHeight: 220,
    elevation: 10, zIndex: 9999, overflow: 'hidden'
  },
  item: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  cityText: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  countryText: { fontSize: 14, color: '#666' }
});

export default CitySearch;