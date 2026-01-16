import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// IMPORTANTE: Si usas emulador Android, usa 10.0.2.2. Si es físico, tu IP real.
const API_URL = 'http://10.0.2.2:8080/auth'; 

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [userToken, setUserToken] = useState(null);
    const [userInfo, setUserInfo] = useState(null);

    // 1. Al abrir la App, verificar si ya hay un token guardado
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

    // 2. Función de LOGIN (Email/Pass)
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
                alert(data.message || 'Error en login');
            }
        } catch (error) {
            console.error(error);
            alert("No se pudo conectar con el servidor");
        } finally {
            setIsLoading(false);
        }
    };

    // 3. Función de REGISTRO
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
                alert(data.message || 'Error en registro');
            }
        } catch (error) {
            console.error(error);
            alert("Error al intentar registrarse");
        } finally {
            setIsLoading(false);
        }
    };

    // 4. NUEVA FUNCIÓN: LOGIN CON GOOGLE
    const loginWithGoogle = async (googleToken) => {
        setIsLoading(true);
        try {
            console.log("🌍 Token de Google recibido en Context:", googleToken);
            
            // --- OPCIÓN A: ENVIAR AL BACKEND (Lo ideal) ---
            /* const response = await fetch(`${API_URL}/google-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: googleToken })
            });
            const data = await response.json();
            // ... guardar data.token y data.user ...
            */

            // --- OPCIÓN B: LOGIN DIRECTO (Para probar ahora) ---
            // Asumimos que si Google validó, dejamos pasar al usuario.
            const fakeUser = { username: "Usuario Google", email: "google@gmail.com" };
            
            setUserToken(googleToken);
            setUserInfo(fakeUser);
            
            await AsyncStorage.setItem('userToken', googleToken);
            await AsyncStorage.setItem('userInfo', JSON.stringify(fakeUser));
            
            console.log("✅ Sesión iniciada con Google (Local)");

        } catch (e) {
            console.log("Error en login Google:", e);
        } finally {
            setIsLoading(false);
        }
    };

    // 5. Función de LOGOUT
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
            loginWithGoogle, // <--- ¡AQUÍ ESTABA EL ERROR! Faltaba agregar esto
            isLoading, 
            userToken, 
            userInfo 
        }}>
            {children}
        </AuthContext.Provider>
    );
};