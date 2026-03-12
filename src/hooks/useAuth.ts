/**
 * Auth hook — re-exports useAuth from auth store.
 * Exposes: user, login, verifyOtp, logout, isAuthenticated, loading, and profile actions:
 * updateProfile, changePassword, changeEmail, verifyEmail, changePhone, verifyPhone, deleteAccount.
 */
export { useAuth } from '../store/authStore';
export type { UserProfile } from '../store/authStore';
