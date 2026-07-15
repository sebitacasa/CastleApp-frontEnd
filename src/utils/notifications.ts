import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import axios from 'axios';

const API = 'https://castleapp-backend-production.up.railway.app';
const PROJECT_ID = 'f89970b0-4070-454b-9287-d8f5ea4fd943';

export async function registerPushToken(userToken: string): Promise<string | null> {
    // Push tokens only work on real devices; emulators will skip silently
    if (!Device.isDevice) return null;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'Default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#C9A84C',
            sound: 'default',
        });
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;

    try {
        const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId: PROJECT_ID });
        if (token && userToken) {
            await axios.put(
                `${API}/api/push-token`,
                { token },
                { headers: { Authorization: `Bearer ${userToken}` } },
            );
        }
        return token;
    } catch (e: any) {
        console.error('[push] token registration failed:', e.message);
        return null;
    }
}
