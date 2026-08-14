import { apiRequest } from '@/lib/queryClient';

export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    // Check if token is expired
    return payload.exp < currentTime;
  } catch (error) {
    return true; // If we can't parse the token, consider it expired
  }
}

export function shouldRefreshToken(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    const timeUntilExpiry = payload.exp - currentTime;
    
    // Production: Refresh if token expires in less than 10 minutes (600 seconds)
    // This ensures token is refreshed before it expires
    return timeUntilExpiry < 600;
  } catch (error) {
    return true;
  }
}

export async function refreshAccessToken(): Promise<string | null> {
  try {
    const response = await apiRequest('POST', '/auth/refresh');

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    return data.accessToken;
  } catch (error) {
    return null;
  }
}