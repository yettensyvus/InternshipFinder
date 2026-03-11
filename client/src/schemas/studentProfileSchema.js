import * as yup from 'yup';

export const studentProfileSchema = yup.object({
  name: yup.string().trim().required().min(2),
  phone: yup.string().trim(),
  yearOfPassing: yup.string().trim()
});
