import * as yup from 'yup';

export const recruiterJobManageSchema = yup.object({
  title: yup.string().trim().required(),
  company: yup.string().trim().required(),
  location: yup.string().trim().required(),
  type: yup.string().required().oneOf(['JOB', 'INTERNSHIP']),
  paid: yup.boolean(),
  duration: yup.string().trim().required().min(2),
  compensation: yup.string().trim(),
  deadline: yup.mixed().required(),
  description: yup.string().trim().required().min(20).max(5000),
  active: yup.boolean()
});
