import * as yup from 'yup';

export const authVerifyOtpSchema = yup.object({
  otp: yup.string().trim().required()
});
