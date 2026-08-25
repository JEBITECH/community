// src/async-local-storage/async-storage-helper.ts

import { asyncLocalStorage } from './context';

export const setUserIdInContext = (user_id: string) => {
  const store = asyncLocalStorage.getStore();
  if (store) {
    store.set('user_id', user_id);
  }
};

export const getUserIdFromContext = (): string | undefined => {
  const store = asyncLocalStorage.getStore();
  return store?.get('user_id');
}

export const setOrganizationIdInContext = (organization_id: string) => {
  const store = asyncLocalStorage.getStore();
  if (store) {
    store.set('organization_id', organization_id);
  }
};

export const getOrganizationIdFromContext = (): string | undefined => {
  const store = asyncLocalStorage.getStore();
  return store?.get('organization_id');
}

export const setErpTokenInContext = (erp_token: string) => {
  const store = asyncLocalStorage.getStore();
  if (store) {
    store.set('erp_token', erp_token);
  }
};

export const getErpTokenFromContext = (): string | undefined => {
  const store = asyncLocalStorage.getStore();
  return store?.get('erp_token');
}