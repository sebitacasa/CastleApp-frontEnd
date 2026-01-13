import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// IMPORTANTE: Si usas emulador Android, usa 10.0.2.2. Si es físico, tu IP real.
const API_URL = 'http://10.0.2.2:8080/auth'; 
//const API_URL = 'http://192.168.1.33:8080/auth';

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
                setUserInfo(JSON.parse(user));
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

    // 2. Función de LOGIN
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
                
                // Guardar en el almacenamiento del celular
                await AsyncStorage.setItem('userToken', data.token);
                await AsyncStorage.setItem('userInfo', JSON.stringify(data.user));
                console.log("Login exitoso:", data.user.username);
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
                console.log("Registro exitoso:", data.user.username);
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

    // 4. Función de LOGOUT
    const logout = async () => {
        setIsLoading(true);
        setUserToken(null);
        setUserInfo(null);
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userInfo');
        setIsLoading(false);
    };

    return (
        <AuthContext.Provider value={{ login, register, logout, isLoading, userToken, userInfo }}>
            {children}
        </AuthContext.Provider>
    );
};