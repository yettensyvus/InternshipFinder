import * as yup from 'yup';

export const authForgotPasswordSchema = yup.object({
  email: yup.string().trim().required(),
  otp: yup.string().trim(),
  newPassword: yup.string().trim()
});
