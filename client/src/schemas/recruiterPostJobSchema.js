import * as yup from 'yup';

export const recruiterPostJobSchema = yup.object({
  title: yup.string().trim().required().min(3),
  company: yup.string().trim().required(),
  location: yup.string().trim().required(),
  type: yup.string().required().oneOf(['JOB', 'INTERNSHIP']),
  payment: yup.string().trim(),
  paid: yup.boolean(),
  duration: yup.string().trim().required().min(2),
  compensation: yup.string().trim(),
  description: yup.string().trim().required().min(20).max(5000),
  deadline: yup.mixed().required()
});
