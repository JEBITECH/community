import { Request, Response, NextFunction } from 'express';

// Simple mock implementations without node-mocks-http
export const createMockRequest = (options: Partial<Request> = {}): Partial<Request> => {
  return {
    method: 'GET',
    url: '/',
    headers: {},
    body: {},
    params: {},
    query: {},
    ...options
  } as any;
};

export const createMockResponse = (): Partial<Response> => {
  const res: any = {};
  
  res.json = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.sendStatus = jest.fn().mockReturnValue(res);
  
  return res;
};

export const createMockNext = (): NextFunction => {
  return jest.fn();
};

// Test data factories
export const createTestUser = (overrides = {}) => ({
  id: 1,
  email: 'test@example.com',
  password: 'hashedpassword',
  firstName: 'Test',
  lastName: 'User',
  phone: '1234567890',
  role: 'user' as const,
  isActive: true,
  organization_id: 1,
  roleId: 1,
  emailVerificationToken: 'verification-token',
  refreshToken: 'refresh-token',
  resetPasswordToken: null,
  resetPasswordExpires: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  validatePassword: jest.fn().mockResolvedValue(true),
  ...overrides
});

export const createTestRegisterDto = (overrides = {}) => ({
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  phone: '1234567890',
  password: 'password123',
  role: 'user' as const,
  ...overrides
});

export const createTestLoginDto = (overrides = {}) => ({
  email: 'test@example.com',
  password: 'password123',
  ...overrides
});

export const createTestAuthResponse = (overrides = {}) => ({
  user: createTestUser(),
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  ...overrides
});

export const createTestModuleResDto = (overrides = {}) => ({
  id: 1,
  name: 'Test Module',
  actions: [],
  ...overrides
});