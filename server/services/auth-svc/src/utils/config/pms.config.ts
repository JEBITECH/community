import { AuthType } from "@shared/entities";

// pms.config.ts
export interface PmsConfig {
  name: string;
  baseUrl: string;
  authType: AuthType;
  authUrl?: string;
  credentials?: Record<string, string>;
  endpoints: Record<string, string>;
  fields: Record<string, string[]>;
}

export const PMS_CONFIGS: Record<string, PmsConfig> = {
  guesty: {
    name: 'guesty',
    baseUrl: 'https://open-api.guesty.com',
    authType: AuthType.OAUTH,
    authUrl: 'https://open-api.guesty.com/oauth2/token',
    credentials: {
      client_id: '0oal48d3cgQ2a1lMt5d7',
      client_secret: 'PxdE99Lbc2NYD38APns-BtyM-cmbsDPUgK3wsKsYSMq9-bX8MnhLYTTCck4OhWa0',
    },
    endpoints: {
      reservations: '/v1/reservations',
      listings: '/v1/listings',
      guests: '/v1/guests',
    },
    fields: {
      reservation: [
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
        'nightsCount',
        'createdAt']
    }
  },
  dharma: {
    name: 'dharma',
    baseUrl: 'https://pms.losjitech.com/api',
    authType: AuthType.APIKEY,
    authUrl: 'https://pms.losjitech.com/auth/token',
    endpoints: {
      reservations: '/reservations/search',
    },
    fields: {}
  },

  mews: {
    name: 'mews',
    baseUrl: 'https://api.mews-demo.com/api/connector/v1',
    authType: AuthType.OAUTH,
    authUrl: 'https://api.mews-demo.com/api/connector/v1/configuration/get',
    endpoints: {
      reservations: '/reservations/getAll/2023-06-06',
      listings: '/resources/getAll',
      guests: '/customers/search'
    },
    fields: {}
  },

};
