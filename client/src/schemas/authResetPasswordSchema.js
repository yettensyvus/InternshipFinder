import * as yup from 'yup';

export const authResetPasswordSchema = yup.object({
  newPassword: yup.string().trim().required()
});
