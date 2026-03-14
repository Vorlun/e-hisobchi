/**
 * User profile hook — re-exports useUser from user store.
 */
export { useUser } from '../store/userStore';
export type {
  User,
  UpdateProfileRequest,
  ChangeEmailRequest,
  VerifyEmailRequest,
  ChangePhoneRequest,
  VerifyPhoneRequest,
  ChangePasswordRequest,
} from '../types/user.types';
