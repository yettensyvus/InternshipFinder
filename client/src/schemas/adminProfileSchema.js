import * as yup from 'yup';

export const adminProfileSchema = yup.object({
  username: yup.string().trim().required().min(2)
});
