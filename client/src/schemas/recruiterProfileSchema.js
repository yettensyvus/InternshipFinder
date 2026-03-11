import * as yup from 'yup';

export const recruiterProfileSchema = yup.object({
  companyName: yup.string().trim().required().min(2),
  companyWebsite: yup.string().trim()
});
