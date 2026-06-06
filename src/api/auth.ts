import api from './client';

export const sendOtp = (phone: string) =>
  api.post('/api/auth/send-otp', { phone });

export const verifyOtp = (phone: string, otp: string) =>
  api.post<{ token: string; ownerId: string; storeId: string | null; isNewOwner: boolean }>(
    '/api/auth/verify-otp', { phone, otp }
  );
