import 'dotenv/config';

export default {
  "expo": {
    "name": "CastleApp",
    "slug": "castleapp-dev",
    "owner": "sebita1495",
    "scheme": "castleapp-dev",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.sebit.castleapp"
    },
    "android": {
      "package": "com.sebit.castleapp",
      "versionCode": 1, // ⚠️ CRÍTICO: Necesario para subir a Google Play. Súbelo a 2, 3... en futuras actualizaciones.
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "permissions": [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION"
      ],
      "config": {
        "googleMaps": {
          "apiKey": process.env.GOOGLE_MAPS_API_KEY
        }
      }
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-web-browser",
      "@react-native-google-signin/google-signin"
    ],
    "extra": {
      "eas": {
        "projectId": "f89970b0-4070-454b-9287-d8f5ea4fd943"
      }
    },
    "runtimeVersion": {
      "policy": "appVersion"
    },
    "updates": {
      "url": "https://u.expo.dev/f89970b0-4070-454b-9287-d8f5ea4fd943"
    }
  }
};