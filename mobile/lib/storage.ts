import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEYS = {
    ACCESS_TOKEN: 'auth_access_token',
    REFRESH_TOKEN: 'auth_refresh_token',
    USER: 'auth_user',
    HAS_VISITED_ONBOARDING: 'has_visited_onboarding',
} as const;

// Web fallback: SecureStore doesn't work on web, use localStorage
const isWeb = Platform.OS === 'web';

async function setItem(key: string, value: string): Promise<void> {
    if (isWeb) {
        localStorage.setItem(key, value);
    } else {
        await SecureStore.setItemAsync(key, value);
    }
}

async function getItem(key: string): Promise<string | null> {
    if (isWeb) {
        return localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
}

async function deleteItem(key: string): Promise<void> {
    try {
        if (isWeb) {
            localStorage.removeItem(key);
        } else {
            await SecureStore.deleteItemAsync(key);
        }
    } catch (error) {
        console.warn(`Failed to delete key ${key} from storage:`, error);
    }
}

// ─── Token Management ───
export async function saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    await setItem(KEYS.ACCESS_TOKEN, accessToken);
    await setItem(KEYS.REFRESH_TOKEN, refreshToken);
}

export async function getAccessToken(): Promise<string | null> {
    return getItem(KEYS.ACCESS_TOKEN);
}

export async function getRefreshToken(): Promise<string | null> {
    return getItem(KEYS.REFRESH_TOKEN);
}

export async function hasTokens(): Promise<boolean> {
    const access = await getItem(KEYS.ACCESS_TOKEN);
    const refresh = await getItem(KEYS.REFRESH_TOKEN);
    return !!(access || refresh);
}

export async function clearTokens(): Promise<void> {
    await deleteItem(KEYS.ACCESS_TOKEN);
    await deleteItem(KEYS.REFRESH_TOKEN);
}

// ─── User Cache ───
export async function saveUser(user: object): Promise<void> {
    await setItem(KEYS.USER, JSON.stringify(user));
}

export async function getUser(): Promise<any | null> {
    try {
        const data = await getItem(KEYS.USER);
        return data ? JSON.parse(data) : null;
    } catch {
        return null;
    }
}

export async function clearUser(): Promise<void> {
    await deleteItem(KEYS.USER);
}

// ─── Onboarding State ───
export async function setVisitedOnboarding(): Promise<void> {
    await setItem(KEYS.HAS_VISITED_ONBOARDING, 'true');
}

export async function getVisitedOnboarding(): Promise<boolean> {
    const value = await getItem(KEYS.HAS_VISITED_ONBOARDING);
    return value === 'true';
}

// ─── Clear All ───
export async function clearAll(): Promise<void> {
    await clearTokens();
    await clearUser();
}
