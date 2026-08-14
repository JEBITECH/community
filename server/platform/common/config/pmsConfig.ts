// pms.config.ts
export interface PmsConfig {
  id: number;
  name: string;
  baseUrl: string;
  authType: 'oauth' | 'apikey';
  authUrl?: string;
  organization_id: number;
  bearerToken: string;
  bearerTokenExpiry: Date;
  credentials: Record<string, string>;
  endpoints: Record<string,string>;
  fields: Record<string,string[]>;
}

export const PMS_CONFIGS: Record<string, PmsConfig> = {
  guesty: {
    id: 0,
    name: 'guesty',
    baseUrl: 'https://open-api.guesty.com',
    authType: 'oauth',
    authUrl: 'https://open-api.guesty.com/oauth2/token',
    organization_id: 0,
    credentials: {
      client_id: '0oal48d3cgQ2a1lMt5d7',
      client_secret: 'PxdE99Lbc2NYD38APns-BtyM-cmbsDPUgK3wsKsYSMq9-bX8MnhLYTTCck4OhWa0',
    },
    bearerToken: '',
    bearerTokenExpiry: new Date(0),
    endpoints: {
      reservations: '/v1/reservations',
      listings: '/v1/listings',
      guests: '/v1/guests',
    },
    fields: {
      reservation : [
        'guest',
        'checkIn',
        'checkOut',
        'status',
        'listingId',
        'confirmationCode',
        'money',
        'nightsCount',
        'reservation',
        'creationInfo',
        'source', 
        'listing', 
        'cancellationPolicy', 
        'guestsCount', 
        'numberOfGuests', 
        'nightsCount']
      }
  },
};
