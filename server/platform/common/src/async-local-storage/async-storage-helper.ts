// src/async-local-storage/async-storage-helper.ts

import { PmsConfig } from "@shared/entities";
import { asyncLocalStorage } from './context';

export interface FranchiseStoreContext {
  franchisee_id: number;
  franchisor_id?: number;
}

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

export function getConfigMap(): Record<string, PmsConfig> | null {
  const store = asyncLocalStorage.getStore();
  if (store) {
    if (!store.has('config')) {
      store.set('config', {});
    }

    return store.get('config');
  }

  return null;
}

export function setFranchiseContext(
  pms_id: string,
  context: FranchiseStoreContext,
) {

  const store = asyncLocalStorage.getStore();

  if (!store) {
    return;
  }
  store.set(pms_id, context);

}

export function getFranchiseContext(
  pms_id: string,
): FranchiseStoreContext | undefined {

  const store = asyncLocalStorage.getStore();

  if (!store) {
    return undefined;
  }

  return store.get(pms_id);
}