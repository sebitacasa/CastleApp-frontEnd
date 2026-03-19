 
import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// 👇 CONFIGURACIÓN DE IP
// 🏠 MODO LOCAL (Emulador):
const BASE_URL = 'https://castleapp-backend-production.up.railway.app'; 
// 🚀 MODO RAILWAY (Cuando ya subas todo):
// const BASE_URL = 'https://castleapp-backend-production.up.railway.app';

const API_URL = `${BASE_URL}/auth`; 

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [userToken, setUserToken] = useState(null);
    const [userInfo, setUserInfo] = useState(null);

    // 1. Verificar sesión al inicio
    const isLoggedIn = async () => {
        try {
            setIsLoading(true);
            let token = await AsyncStorage.getItem('userToken');
            let user = await AsyncStorage.getItem('userInfo');

            if (token) {
                setUserToken(token);
                if (user) setUserInfo(JSON.parse(user));
            }
            setIsLoading(false);
        } catch (e) {
            console.log("Error al leer token:", e);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        isLoggedIn();
    }, []);

    // 2. Login Normal
    const login = async (email, password) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                setUserToken(data.token);
                setUserInfo(data.user);
                await AsyncStorage.setItem('userToken', data.token);
                await AsyncStorage.setItem('userInfo', JSON.stringify(data.user));
            } else {
                Alert.alert("Error", data.message || 'Error en login');
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "No se pudo conectar con el servidor");
        } finally {
            setIsLoading(false);
        }
    };

    // 3. Registro Normal
    const register = async (username, email, password) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                setUserToken(data.token);
                setUserInfo(data.user);
                await AsyncStorage.setItem('userToken', data.token);
                await AsyncStorage.setItem('userInfo', JSON.stringify(data.user));
            } else {
                Alert.alert("Error", data.message || 'Error en registro');
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Error al intentar registrarse");
        } finally {
            setIsLoading(false);
        }
    };

    // 4. 🔥 LOGIN CON GOOGLE (CONECTADO AL BACKEND Y CON LOGS)
    const loginWithGoogle = async (googleToken) => { 
        setIsLoading(true);
        try {
            // LOG 1: Ver si llegamos aquí
            console.log("\n🔵 1. [AuthContext] Enviando Token de Google al Backend...");
            console.log("📨 Token enviado:", googleToken.substring(0, 20) + "..."); // Solo mostramos el principio para no ensuciar

            const response = await fetch(`${API_URL}/google`, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: googleToken }) 
            });

            const data = await response.json();
            
            // LOG 2: Ver qué respondió el servidor
            console.log("🔙 2. [AuthContext] Respuesta COMPLETA del Backend:", JSON.stringify(data, null, 2));

            if (response.ok) {
                const backendUser = data.user;
                const appToken = data.token;

                if (!backendUser || !backendUser.id) {
                    throw new Error("El backend no devolvió un usuario válido");
                }

                // LOG 3: Confirmación de éxito
                console.log(`✅ 3. [AuthContext] Login Exitoso. Guardando Usuario ID: ${backendUser.id}`);

                setUserToken(appToken);
                setUserInfo(backendUser); 
                
                await AsyncStorage.setItem('userToken', appToken);
                await AsyncStorage.setItem('userInfo', JSON.stringify(backendUser));
            } else {
                console.log("❌ [AuthContext] El Backend rechazó el login:", data.message);
                Alert.alert("Error de Login", data.message || 'Falló validación con Google');
            }

        } catch (e) {
            console.log("🔥 [AuthContext] Error CRÍTICO en login Google:", e);
            Alert.alert("Error", "Fallo al conectar con el servidor.");
        } finally {
            setIsLoading(false);
        }
    };

    // 5. Logout
    const logout = async () => {
        setIsLoading(true);
        setUserToken(null);
        setUserInfo(null);
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userInfo');
        setIsLoading(false);
    };

    return (
        <AuthContext.Provider value={{ 
            login, 
            register, 
            logout, 
            loginWithGoogle, 
            isLoading, 
            userToken, 
            userInfo 
        }}>
            {children}
        </AuthContext.Provider>
    );
};