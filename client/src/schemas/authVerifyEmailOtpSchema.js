import * as yup from 'yup';

export const authVerifyEmailOtpSchema = yup.object({
  otp: yup.string().trim().required()
});
