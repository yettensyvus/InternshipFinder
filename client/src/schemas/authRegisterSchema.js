import * as yup from 'yup';

export const authRegisterSchema = yup.object({
  username: yup.string().trim().required().min(2),
  email: yup.string().trim().required(),
  password: yup.string().trim().required().min(6),
  role: yup.string().required().oneOf(['STUDENT', 'RECRUITER'])
});
