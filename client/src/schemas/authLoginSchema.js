import * as yup from 'yup';

export const authLoginSchema = yup.object({
  email: yup.string().trim().required(),
  password: yup.string().trim().required()
});
