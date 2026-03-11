import * as yup from 'yup';

export const studentResumeUploadSchema = yup.object({
  file: yup
    .mixed()
    .required()
});
