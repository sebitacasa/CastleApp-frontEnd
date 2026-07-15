import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import type { AuthContextType, UserInfo } from '../types';

const BASE_URL = 'https://castleapp-backend-production.up.railway.app';
const API_URL = `${BASE_URL}/auth`;

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [userToken, setUserToken] = useState<string | null>(null);
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

    const isLoggedIn = async () => {
        try {
            setIsLoading(true);
            const token = await AsyncStorage.getItem('userToken');
            const user = await AsyncStorage.getItem('userInfo');

            if (token) {
                setUserToken(token);
                if (user) setUserInfo(JSON.parse(user) as UserInfo);
            }
            setIsLoading(false);
        } catch (e) {
            console.log('Error al leer token:', e);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        isLoggedIn();
    }, []);

    const login = async (email: string, password: string): Promise<void> => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                setUserToken(data.token);
                setUserInfo(data.user);
                await AsyncStorage.setItem('userToken', data.token);
                await AsyncStorage.setItem('userInfo', JSON.stringify(data.user));
            } else {
                Alert.alert('Error', data.message || 'Error en login');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'No se pudo conectar con el servidor');
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (username: string, email: string, password: string): Promise<void> => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                setUserToken(data.token);
                setUserInfo(data.user);
                await AsyncStorage.setItem('userToken', data.token);
                await AsyncStorage.setItem('userInfo', JSON.stringify(data.user));
            } else {
                Alert.alert('Error', data.message || 'Error en registro');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Error al intentar registrarse');
        } finally {
            setIsLoading(false);
        }
    };

    const loginWithGoogle = async (googleToken: string, normalizedUser?: any): Promise<void> => {
        setIsLoading(true);
        try {
            console.log('\n1. [AuthContext] Enviando Token de Google al Backend...');

            const response = await fetch(`${API_URL}/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: googleToken }),
            });

            const data = await response.json();
            console.log('2. [AuthContext] Respuesta del Backend:', JSON.stringify(data, null, 2));

            if (response.ok) {
                const backendUser: UserInfo = data.user;
                const appToken: string = data.token;

                if (!backendUser || !backendUser.id) {
                    throw new Error('El backend no devolvió un usuario válido');
                }

                console.log(`3. [AuthContext] Login Exitoso. Usuario ID: ${backendUser.id}`);

                setUserToken(appToken);
                setUserInfo(backendUser);

                await AsyncStorage.setItem('userToken', appToken);
                await AsyncStorage.setItem('userInfo', JSON.stringify(backendUser));
            } else {
                console.log('[AuthContext] Backend rechazó el login:', data.message);
                Alert.alert('Error de Login', data.message || 'Falló validación con Google');
            }
        } catch (e) {
            console.log('[AuthContext] Error en login Google:', e);
            Alert.alert('Error', 'Fallo al conectar con el servidor.');
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async (): Promise<void> => {
        setIsLoading(true);
        setUserToken(null);
        setUserInfo(null);
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userInfo');
        setIsLoading(false);
    };

    return (
        <AuthContext.Provider value={{ login, register, logout, loginWithGoogle, isLoading, userToken, userInfo }}>
            {children}
        </AuthContext.Provider>
    );
};
