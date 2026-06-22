import api from './client';

export const sendOtp = (phone: string) =>
  api.post('/api/auth/send-otp', { phone });

// Bridge while SMS/DLT is pending: code is delivered to email, owner still keyed by phone.
export const sendEmailOtp = (phone: string, email: string) =>
  api.post('/api/auth/email/send-otp', { phone, email });

export const verifyOtp = (phone: string, otp: string) =>
  api.post<{ token: string; ownerId: string; storeId: string | null; isNewOwner: boolean }>(
    '/api/auth/verify-otp', { phone, otp }
  );
