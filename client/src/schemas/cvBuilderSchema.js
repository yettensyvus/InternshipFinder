import * as yup from 'yup';

export const createCvBuilderSchema = (t) => {
  const msgRequired = (fieldLabel) => t('cvBuilder.validation.required', { field: fieldLabel });
  const msgTooShort = (fieldLabel) => t('cvBuilder.validation.tooShort', { field: fieldLabel });
  const msgTooLong = (fieldLabel) => t('cvBuilder.validation.tooLong', { field: fieldLabel });
  const msgInvalid = (fieldLabel) => t('cvBuilder.validation.invalid', { field: fieldLabel });

  const educationItemSchema = yup.object({
    school: yup
      .string()
      .trim()
      .required(msgRequired(t('cvBuilder.fields.school')))
      .min(2, msgTooShort(t('cvBuilder.fields.school')))
      .max(120, msgTooLong(t('cvBuilder.fields.school'))),
    degree: yup
      .string()
      .trim()
      .required(msgRequired(t('cvBuilder.fields.degree')))
      .min(2, msgTooShort(t('cvBuilder.fields.degree')))
      .max(120, msgTooLong(t('cvBuilder.fields.degree'))),
    field: yup
      .string()
      .trim()
      .required(msgRequired(t('cvBuilder.fields.field')))
      .min(2, msgTooShort(t('cvBuilder.fields.field')))
      .max(120, msgTooLong(t('cvBuilder.fields.field'))),
    start: yup
      .string()
      .trim()
      .required(msgRequired(t('cvBuilder.fields.startYear')))
      .matches(/^\d{4}$/, msgInvalid(t('cvBuilder.fields.startYear'))),
    end: yup
      .string()
      .trim()
      .required(msgRequired(t('cvBuilder.fields.endYear')))
      .matches(/^\d{4}$/, msgInvalid(t('cvBuilder.fields.endYear'))),
    details: yup
      .string()
      .trim()
      .required(msgRequired(t('cvBuilder.fields.educationDetails')))
      .min(5, msgTooShort(t('cvBuilder.fields.educationDetails')))
      .max(1500, msgTooLong(t('cvBuilder.fields.educationDetails')))
  });

  const experienceItemSchema = yup.object({
    company: yup
      .string()
      .trim()
      .required(msgRequired(t('cvBuilder.fields.company')))
      .min(2, msgTooShort(t('cvBuilder.fields.company')))
      .max(120, msgTooLong(t('cvBuilder.fields.company'))),
    role: yup
      .string()
      .trim()
      .required(msgRequired(t('cvBuilder.fields.role')))
      .min(2, msgTooShort(t('cvBuilder.fields.role')))
      .max(120, msgTooLong(t('cvBuilder.fields.role'))),
    start: yup
      .string()
      .trim()
      .required(msgRequired(t('cvBuilder.fields.startYear')))
      .matches(/^\d{4}$/, msgInvalid(t('cvBuilder.fields.startYear'))),
    end: yup
      .string()
      .trim()
      .required(msgRequired(t('cvBuilder.fields.endYear')))
      .matches(/^\d{4}$/, msgInvalid(t('cvBuilder.fields.endYear'))),
    details: yup
      .string()
      .trim()
      .required(msgRequired(t('cvBuilder.fields.experienceDetails')))
      .min(5, msgTooShort(t('cvBuilder.fields.experienceDetails')))
      .max(1500, msgTooLong(t('cvBuilder.fields.experienceDetails')))
  });

  const experienceItemRelaxedSchema = yup.object({
    company: yup.string().trim(),
    role: yup.string().trim(),
    start: yup.string().trim(),
    end: yup.string().trim(),
    details: yup.string().trim()
  });

  return yup.object({
    personal: yup.object({
      fullName: yup
        .string()
        .trim()
        .required(msgRequired(t('cvBuilder.fields.fullName')))
        .min(2, msgTooShort(t('cvBuilder.fields.fullName')))
        .max(80, msgTooLong(t('cvBuilder.fields.fullName'))),
      title: yup
        .string()
        .trim()
        .required(msgRequired(t('cvBuilder.fields.title')))
        .min(2, msgTooShort(t('cvBuilder.fields.title')))
        .max(80, msgTooLong(t('cvBuilder.fields.title'))),
      email: yup
        .string()
        .trim()
        .required(msgRequired(t('cvBuilder.fields.email')))
        .min(5, msgTooShort(t('cvBuilder.fields.email')))
        .max(120, msgTooLong(t('cvBuilder.fields.email')))
        .email(msgInvalid(t('cvBuilder.fields.email'))),
      phone: yup
        .string()
        .trim()
        .required(msgRequired(t('cvBuilder.fields.phone')))
        .min(6, msgTooShort(t('cvBuilder.fields.phone')))
        .max(30, msgTooLong(t('cvBuilder.fields.phone')))
        .matches(/^[+()\d\s-]+$/, t('cvBuilder.validation.phoneInvalidChars')),
      location: yup
        .string()
        .trim()
        .required(msgRequired(t('cvBuilder.fields.location')))
        .min(2, msgTooShort(t('cvBuilder.fields.location')))
        .max(80, msgTooLong(t('cvBuilder.fields.location'))),
      website: yup
        .string()
        .trim()
        .required(msgRequired(t('cvBuilder.fields.website')))
        .test('website', msgInvalid(t('cvBuilder.fields.website')), (v) => {
          const raw = String(v || '').trim();
          if (!raw) return false;
          return /^https?:\/\//i.test(raw) || /^\w+[\w.-]*\.[a-z]{2,}/i.test(raw);
        })
    }),
    summary: yup
      .string()
      .trim()
      .required(msgRequired(t('cvBuilder.fields.summary')))
      .min(20, msgTooShort(t('cvBuilder.fields.summary')))
      .max(1500, msgTooLong(t('cvBuilder.fields.summary'))),
    education: yup
      .array()
      .of(educationItemSchema)
      .min(1, t('cvBuilder.validation.educationAtLeastOne')),
    experience: yup.array().when('$enabledSections', {
      is: (v) => Boolean(v?.experience),
      then: (s) => s.of(experienceItemSchema).min(1, t('cvBuilder.validation.experienceAtLeastOne')),
      otherwise: (s) => s.of(experienceItemRelaxedSchema).notRequired()
    }),
    skills: yup
      .string()
      .trim()
      .required(msgRequired(t('cvBuilder.sections.skills')))
      .test('skills', t('cvBuilder.validation.skillsAtLeastOne'), (v) => {
        const list = String(v || '')
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);
        if (list.length === 0) return false;
        if (list.some(s => s.length > 40)) return false;
        return true;
      })
      .test('skills-length', t('cvBuilder.validation.skillsOneTooLong'), (v) => {
        const list = String(v || '')
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);
        if (list.length === 0) return true;
        return !list.some(s => s.length > 40);
      }),
    projects: yup.string().trim().test('projects-enabled', msgInvalid(t('cvBuilder.sections.projects')), function (v) {
      const enabled = this?.options?.context?.enabledSections?.projects;
      if (!enabled) return true;
      const raw = String(v || '').trim();
      if (!raw) return true;
      if (raw.length < 10) return this.createError({ message: msgTooShort(t('cvBuilder.sections.projects')) });
      if (raw.length > 2000) return this.createError({ message: msgTooLong(t('cvBuilder.sections.projects')) });
      return true;
    }),
    honors: yup.string().trim().test('honors-enabled', msgInvalid(t('cvBuilder.sections.honors')), function (v) {
      const enabled = this?.options?.context?.enabledSections?.honors;
      if (!enabled) return true;
      const raw = String(v || '').trim();
      if (!raw) return true;
      if (raw.length > 2000) return this.createError({ message: msgTooLong(t('cvBuilder.sections.honors')) });
      return true;
    }),
    certifications: yup.string().trim().test('certifications-enabled', msgInvalid(t('cvBuilder.sections.certifications')), function (v) {
      const enabled = this?.options?.context?.enabledSections?.certifications;
      if (!enabled) return true;
      const raw = String(v || '').trim();
      if (!raw) return true;
      if (raw.length > 2000) return this.createError({ message: msgTooLong(t('cvBuilder.sections.certifications')) });
      return true;
    }),
    languages: yup.string().trim().test('languages-enabled', msgInvalid(t('cvBuilder.sections.languages')), function (v) {
      const enabled = this?.options?.context?.enabledSections?.languages;
      if (!enabled) return true;
      const raw = String(v || '').trim();
      if (!raw) return true;
      if (raw.length > 300) return this.createError({ message: msgTooLong(t('cvBuilder.sections.languages')) });
      return true;
    })
  });
};
