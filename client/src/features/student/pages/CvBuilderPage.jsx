import { useEffect, useMemo, useRef, useState } from 'react';
import jsPDF from 'jspdf';
import axios from '@/services/axios';
import { showLoadingToast, showToast } from '@/services/toast';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useTranslation } from 'react-i18next';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import StudentPageLayout from '../ui/templates/StudentPageLayout';

const emptyEducation = () => ({
  school: '',
  degree: '',
  field: '',
  start: '',
  end: '',
  details: ''
});

const emptyExperience = () => ({
  company: '',
  role: '',
  start: '',
  end: '',
  details: ''
});

function yearToDate(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  if (!/^\d{4}$/.test(raw)) return null;
  const y = Number(raw);
  if (!Number.isFinite(y)) return null;
  return new Date(y, 0, 1);
}

function dateToYear(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  return String(date.getFullYear());
}

function YearPicker({ value, onChange, placeholder, inputClassName }) {
  return (
    <DatePicker
      selected={yearToDate(value)}
      onChange={(date) => onChange(dateToYear(date))}
      showYearPicker
      dateFormat="yyyy"
      placeholderText={placeholder}
      openToDate={yearToDate(value) ?? new Date()}
      popperClassName="if-datepicker-popper"
      calendarClassName="if-datepicker"
      wrapperClassName="w-full"
      customInput={<input className={inputClassName} readOnly />}
    />
  );
}

export default function CvBuilder() {
  const { t } = useTranslation();

  const logoDataUrlRef = useRef(null);
  const pdfFontsReadyRef = useRef(false);
  const pdfFontDataRef = useRef({ regular: null, bold: null });
  const previewRef = useRef(null);
  const previewViewportRef = useRef(null);

  const [enabledSections, setEnabledSections] = useState({
    experience: true,
    projects: true,
    honors: false,
    certifications: false,
    languages: false
  });

  const schema = useMemo(() => {
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
  }, [t]);

  const {
    register,
    control,
    getValues,
    setValue,
    watch,
    trigger,
    formState: { errors }
  } = useForm({
    defaultValues: {
      personal: {
        fullName: '',
        title: '',
        email: '',
        phone: '',
        location: '',
        website: ''
      },
      summary: '',
      education: [emptyEducation()],
      experience: [emptyExperience()],
      skills: '',
      projects: '',
      honors: '',
      certifications: '',
      languages: ''
    },
    resolver: yupResolver(schema, { context: { enabledSections } }),
    mode: 'onSubmit'
  });

  const values = watch();
  const personal = values?.personal || {};
  const summary = values?.summary || '';
  const education = Array.isArray(values?.education) ? values.education : [];
  const experience = Array.isArray(values?.experience) ? values.experience : [];
  const skills = values?.skills || '';
  const projects = values?.projects || '';
  const honors = values?.honors || '';
  const certifications = values?.certifications || '';
  const languages = values?.languages || '';

  const educationArray = useFieldArray({ control, name: 'education' });
  const experienceArray = useFieldArray({ control, name: 'experience' });

  const [sectionOrder, setSectionOrder] = useState([
    'summary',
    'education',
    'experience',
    'skills',
    'projects'
  ]);

  const [previewScale, setPreviewScale] = useState(1);

  const [draggingSection, setDraggingSection] = useState(null);

  const [activeStepIndex, setActiveStepIndex] = useState(0);

  const skillsList = useMemo(() => {
    return skills
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  }, [skills]);

  const inputClass = 'w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/40 text-gray-900 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 transition';
  const textAreaClass = `${inputClass} min-h-[110px]`;
  const sectionCardClass = 'p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-900/30';
  const smallPrimaryBtn = 'inline-flex items-center justify-center px-3 py-2 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white text-sm font-semibold shadow hover:shadow-md transition';
  const smallGhostBtn = 'inline-flex items-center justify-center px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/30 text-gray-900 dark:text-gray-100 text-sm font-semibold hover:bg-white dark:hover:bg-gray-900 transition';
  const smallDangerBtn = 'inline-flex items-center justify-center px-3 py-2 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/70 dark:bg-red-900/20 text-red-700 dark:text-red-200 text-sm font-semibold hover:bg-red-100/80 dark:hover:bg-red-900/30 transition';
  const addBtn = 'inline-flex items-center justify-center px-4 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white text-sm font-semibold shadow hover:shadow-md transition';

  const getError = (path) => {
    const keys = String(path || '').split('.').filter(Boolean);
    let cur = errors;
    for (const k of keys) {
      if (!cur) return null;
      cur = cur?.[k];
    }
    return cur?.message || null;
  };

  const fieldError = (key) => Boolean(getError(key));
  const fieldClass = (base, key) => (fieldError(key)
    ? `${base} border-red-400 dark:border-red-700 focus:ring-red-500/40 focus:border-red-500`
    : base);

  const ErrorLine = ({ msg }) => (
    <div
      className={`mt-1 text-xs font-semibold ${msg ? 'text-red-600 dark:text-red-300' : 'text-transparent'}`}
      style={{ minHeight: '16px' }}
    >
      {msg || 'x'}
    </div>
  );

  const isSectionEnabled = (id) => {
    if (id === 'summary' || id === 'education' || id === 'skills') return true;
    return Boolean(enabledSections?.[id]);
  };

  const steps = useMemo(() => {
    const ids = ['personal', ...sectionOrder.filter(isSectionEnabled)];
    return ids;
  }, [sectionOrder, enabledSections]);

  const activeStepId = steps[Math.min(activeStepIndex, Math.max(0, steps.length - 1))] || 'personal';

  useEffect(() => {
    setActiveStepIndex((prev) => {
      if (steps.length === 0) return 0;
      return Math.min(prev, steps.length - 1);
    });
  }, [steps]);

  const enableSection = (id) => {
    setEnabledSections(prev => ({ ...prev, [id]: true }));
    setSectionOrder(prev => (prev.includes(id) ? prev : [...prev, id]));
  };

  const disableSection = (id) => {
    setEnabledSections(prev => ({ ...prev, [id]: false }));
    setSectionOrder(prev => prev.filter(x => x !== id));
    if (id === 'projects') setValue('projects', '');
    if (id === 'honors') setValue('honors', '');
    if (id === 'certifications') setValue('certifications', '');
    if (id === 'languages') setValue('languages', '');
    if (id === 'experience') {
      setValue('experience', [emptyExperience()]);
    }
  };

  const loadLogoDataUrl = async () => {
    if (logoDataUrlRef.current) return logoDataUrlRef.current;
    try {
      const res = await fetch('/favicon.png');
      const blob = await res.blob();
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      logoDataUrlRef.current = dataUrl;
      return dataUrl;
    } catch {
      return null;
    }
  };

  const arrayBufferToBase64 = (buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i += 1) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const ensurePdfUnicodeFonts = async (pdf) => {
    try {
      if (!pdfFontsReadyRef.current) {
        const [regularRes, boldRes] = await Promise.all([
          fetch('/fonts/NotoSans-Regular.ttf'),
          fetch('/fonts/NotoSans-Bold.ttf')
        ]);
        if (!regularRes.ok || !boldRes.ok) return false;

        const [regularBuf, boldBuf] = await Promise.all([
          regularRes.arrayBuffer(),
          boldRes.arrayBuffer()
        ]);

        pdfFontDataRef.current = {
          regular: arrayBufferToBase64(regularBuf),
          bold: arrayBufferToBase64(boldBuf)
        };
        pdfFontsReadyRef.current = true;
      }

      const { regular, bold } = pdfFontDataRef.current || {};
      if (!regular || !bold) return false;

      pdf.addFileToVFS('NotoSans-Regular.ttf', regular);
      pdf.addFileToVFS('NotoSans-Bold.ttf', bold);
      pdf.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal');
      pdf.addFont('NotoSans-Bold.ttf', 'NotoSans', 'bold');
      return true;
    } catch {
      // If fonts fail to load, fall back to default jsPDF fonts
      return false;
    }
  };

  const buildPdf = async (data) => {
    const safe = data || {};
    const personalData = safe.personal || {};
    const summaryData = safe.summary || '';
    const educationData = Array.isArray(safe.education) ? safe.education : [];
    const experienceData = Array.isArray(safe.experience) ? safe.experience : [];
    const skillsData = safe.skills || '';
    const projectsData = safe.projects || '';
    const honorsData = safe.honors || '';
    const certificationsData = safe.certifications || '';
    const languagesData = safe.languages || '';

    const skillsListPdf = String(skillsData || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const logoDataUrl = await loadLogoDataUrl();
    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

    const useUnicodeFonts = await ensurePdfUnicodeFonts(pdf);
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const marginX = 14;
    const marginTop = 34;
    const contentWidth = pageWidth - marginX * 2;
    const lineHeight = 5;
    const sectionGap = 5;

    const drawHeader = () => {
      pdf.setFillColor(79, 70, 229);
      pdf.rect(0, 0, pageWidth, 22, 'F');

      if (logoDataUrl) {
        try {
          pdf.addImage(logoDataUrl, 'PNG', marginX, 6, 10, 10);
        } catch {
        }
      }

      pdf.setTextColor(255);
      set(12, 'bold');
      pdf.text(t('common.appName'), logoDataUrl ? marginX + 14 : marginX, 12);
      set(9, 'normal');
      pdf.text(t('cvBuilder.title'), logoDataUrl ? marginX + 14 : marginX, 17);
      pdf.setTextColor(0);
    };

    let y = marginTop;

    const ensureSpace = (needed) => {
      if (y + needed <= pageHeight - 14) return;
      pdf.addPage();
      drawHeader();
      y = marginTop;
    };

    const text = (value) => String(value ?? '').trim();

    const set = (size, style = 'normal') => {
      if (useUnicodeFonts) {
        pdf.setFont('NotoSans', style);
      } else {
        pdf.setFont('helvetica', style);
      }
      pdf.setFontSize(size);
    };

    const addWrapped = (value, x, width, lh = lineHeight) => {
      const v = text(value);
      if (!v) return;
      const lines = pdf.splitTextToSize(v, width);
      ensureSpace(lines.length * lh);
      pdf.text(lines, x, y);
      y += lines.length * lh;
    };

    const addHeading = (value) => {
      ensureSpace(12);
      set(10, 'bold');
      const v = text(value).toUpperCase();
      pdf.setTextColor(60);
      pdf.text(v, marginX, y);
      y += 2;
      pdf.setDrawColor(230);
      pdf.line(marginX, y + 2, marginX + contentWidth, y + 2);
      y += 7;
      pdf.setTextColor(0);
    };

    const addBulletLines = (value, x, width) => {
      const raw = text(value);
      if (!raw) return;
      const chunks = raw.split('\n').map(s => s.trim()).filter(Boolean);
      for (const c of chunks) {
        const lines = pdf.splitTextToSize(c, width - 3);
        ensureSpace(lines.length * lineHeight);
        pdf.text('•', x, y);
        pdf.text(lines, x + 3, y);
        y += lines.length * lineHeight;
      }
    };

    const fullName = text(personalData.fullName) || t('cvBuilder.preview.yourName');
    const title = text(personalData.title);
    const email = text(personalData.email);
    const phone = text(personalData.phone);
    const location = text(personalData.location);
    const website = text(personalData.website);

    drawHeader();

    set(18, 'bold');
    ensureSpace(14);
    pdf.text(fullName, marginX, y);
    y += 7;

    if (title) {
      set(11, 'normal');
      pdf.setTextColor(70);
      pdf.text(title, marginX, y);
      pdf.setTextColor(0);
      y += 6;
    } else {
      y += 2;
    }

    const rightX = marginX + contentWidth;
    set(9, 'normal');
    pdf.setTextColor(80);
    const contactLines = [email, phone, location, website].filter(Boolean);
    if (contactLines.length > 0) {
      let cy = marginTop;
      for (const c of contactLines) {
        const lines = pdf.splitTextToSize(c, 60);
        pdf.text(lines, rightX, cy, { align: 'right' });
        cy += lines.length * 4.4;
      }
    }
    pdf.setTextColor(0);

    y += 2;

    const renderSection = (id) => {
      if (id === 'summary') {
        if (!text(summaryData)) return;
        addHeading(t('cvBuilder.sections.summary'));
        set(10, 'normal');
        addWrapped(summaryData, marginX, contentWidth, 5);
        y += sectionGap;
        return;
      }

      if (id === 'education') {
        const items = educationData.filter(ed => text(ed.school) || text(ed.degree) || text(ed.field) || text(ed.details) || text(ed.start) || text(ed.end));
        if (items.length === 0) return;
        addHeading(t('cvBuilder.sections.education'));
        for (const ed of items) {
          set(10, 'bold');
          const left = [text(ed.school), text(ed.degree), text(ed.field)].filter(Boolean).join(' · ');
          const right = [text(ed.start), text(ed.end)].filter(Boolean).join(' - ');
          ensureSpace(6);
          pdf.text(left || t('cvBuilder.sections.education'), marginX, y);
          if (right) {
            set(9, 'normal');
            pdf.setTextColor(90);
            pdf.text(right, rightX, y, { align: 'right' });
            pdf.setTextColor(0);
          }
          y += 5.5;
          set(10, 'normal');
          addBulletLines(ed.details, marginX, contentWidth);
          y += 3;
        }
        y += sectionGap;
        return;
      }

      if (id === 'experience') {
        const items = experienceData.filter(ex => text(ex.company) || text(ex.role) || text(ex.details) || text(ex.start) || text(ex.end));
        if (items.length === 0) return;
        addHeading(t('cvBuilder.sections.experience'));
        for (const ex of items) {
          set(10, 'bold');
          const left = [text(ex.company), text(ex.role)].filter(Boolean).join(' · ');
          const right = [text(ex.start), text(ex.end)].filter(Boolean).join(' - ');
          ensureSpace(6);
          pdf.text(left || t('cvBuilder.sections.experience'), marginX, y);
          if (right) {
            set(9, 'normal');
            pdf.setTextColor(90);
            pdf.text(right, rightX, y, { align: 'right' });
            pdf.setTextColor(0);
          }
          y += 5.5;
          set(10, 'normal');
          addBulletLines(ex.details, marginX, contentWidth);
          y += 3;
        }
        y += sectionGap;
        return;
      }

      if (id === 'skills') {
        if (skillsListPdf.length === 0) return;
        addHeading(t('cvBuilder.sections.skills'));
        set(10, 'normal');
        addBulletLines(skillsListPdf.join('\n'), marginX, contentWidth);
        y += sectionGap;
        return;
      }

      if (id === 'projects') {
        if (!enabledSections.projects) return;
        if (!text(projectsData)) return;
        addHeading(t('cvBuilder.sections.projects'));
        set(10, 'normal');
        addBulletLines(projectsData, marginX, contentWidth);
        y += sectionGap;
        return;
      }

      if (id === 'honors') {
        if (!enabledSections.honors) return;
        if (!text(honorsData)) return;
        addHeading(t('cvBuilder.sections.honors'));
        set(10, 'normal');
        addBulletLines(honorsData, marginX, contentWidth);
        y += sectionGap;
        return;
      }

      if (id === 'certifications') {
        if (!enabledSections.certifications) return;
        if (!text(certificationsData)) return;
        addHeading(t('cvBuilder.sections.certifications'));
        set(10, 'normal');
        addBulletLines(certificationsData, marginX, contentWidth);
        y += sectionGap;
        return;
      }

      if (id === 'languages') {
        if (!enabledSections.languages) return;
        if (!text(languagesData)) return;
        addHeading(t('cvBuilder.sections.languages'));
        set(10, 'normal');
        addWrapped(languagesData, marginX, contentWidth);
        y += sectionGap;
      }
    };

    for (const id of sectionOrder) {
      if (!isSectionEnabled(id)) continue;
      renderSection(id);
    }

    return pdf;
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await axios.get('/student/profile');
        if (cancelled) return;
        const p = res?.data || {};

        const current = getValues();
        const nextPersonal = {
          fullName: current?.personal?.fullName || p.name || '',
          title: current?.personal?.title || '',
          email: current?.personal?.email || p.email || '',
          phone: current?.personal?.phone || p.phone || '',
          location: current?.personal?.location || '',
          website: current?.personal?.website || ''
        };
        setValue('personal', nextPersonal, { shouldDirty: false });

        const ed = (current?.education || []).some(e => Object.values(e || {}).some(v => String(v || '').trim().length > 0));
        if (!ed && (p.college || p.branch || p.yearOfPassing)) {
          const next = emptyEducation();
          next.school = p.college || '';
          next.field = p.branch || '';
          next.end = p.yearOfPassing ? String(p.yearOfPassing) : '';
          setValue('education', [next], { shouldDirty: false });
        }
      } catch {
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const el = previewViewportRef.current;
    if (!el) return;

    const A4_MM_WIDTH = 210;
    const MM_TO_PX = 96 / 25.4;
    const A4_PX_WIDTH = A4_MM_WIDTH * MM_TO_PX;

    const compute = () => {
      const paddingPx = 0;
      const w = Math.max(0, el.clientWidth - paddingPx);
      if (!w) return;
      const next = Math.min(1, Math.max(0.35, w / A4_PX_WIDTH));
      setPreviewScale(next);
    };

    compute();

    const ro = new ResizeObserver(() => compute());
    ro.observe(el);
    window.addEventListener('resize', compute);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', compute);
    };
  }, []);

  const exportPdf = async () => {
    const toastId = 'cv-builder-validate';
    const ok = await trigger();
    if (!ok) {
      showToast(toastId, 'error', t('cvBuilder.toasts.fixHighlighted'));
      return;
    }
    const pdf = await buildPdf(getValues());
    const safeName = (personal.fullName || 'cv').replace(/[^a-z0-9\-\s]/gi, '').trim().replace(/\s+/g, '_');
    pdf.save(`${safeName || 'cv'}.pdf`);
  };

  const saveCv = async () => {
    const toastId = 'cv-builder-save';
    try {
      const ok = await trigger();
      if (!ok) {
        showToast(toastId, 'error', t('cvBuilder.toasts.fixHighlighted'), { autoClose: 2500 });
        return;
      }
      showLoadingToast(toastId, t('cvBuilder.toasts.saving'));
      const pdf = await buildPdf(getValues());
      const blob = pdf.output('blob');
      const file = new File([blob], 'cv.pdf', { type: 'application/pdf' });
      const formData = new FormData();
      formData.append('file', file);

      const res = await axios.post('/student/resume', formData);
      const url = res?.data;
      showToast(toastId, 'success', url ? t('cvBuilder.toasts.savedAsResume') : t('cvBuilder.toasts.saved'), { autoClose: 1800 });
    } catch (err) {
      showToast(toastId, 'error', err.response?.data || t('cvBuilder.toasts.saveFailed'), { autoClose: 2500 });
    }
  };

  const sectionLabel = (id) => {
    switch (id) {
      case 'summary':
        return t('cvBuilder.sections.summary');
      case 'education':
        return t('cvBuilder.sections.education');
      case 'experience':
        return t('cvBuilder.sections.experience');
      case 'skills':
        return t('cvBuilder.sections.skills');
      case 'projects':
        return t('cvBuilder.sections.projects');
      case 'honors':
        return t('cvBuilder.sections.honors');
      case 'certifications':
        return t('cvBuilder.sections.certifications');
      case 'languages':
        return t('cvBuilder.sections.languages');
      default:
        return id;
    }
  };

  const stepLabel = (id) => {
    if (id === 'personal') return t('cvBuilder.sections.personal');
    return sectionLabel(id);
  };

  const onSectionDragStart = (id) => {
    setDraggingSection(id);
  };

  const onSectionDragOver = (e, overId) => {
    e.preventDefault();
    if (!draggingSection || draggingSection === overId) return;
    setSectionOrder(prev => {
      const from = prev.indexOf(draggingSection);
      const to = prev.indexOf(overId);
      if (from === -1 || to === -1) return prev;
      const next = [...prev];
      next.splice(from, 1);
      next.splice(to, 0, draggingSection);
      return next;
    });
  };

  const onSectionDrop = (e) => {
    e.preventDefault();
    setDraggingSection(null);
  };

  return (
    <StudentPageLayout
      header={
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 dark:from-violet-400 dark:via-indigo-400 dark:to-blue-400">
              {t('cvBuilder.title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2 max-w-2xl">
              {t('cvBuilder.subtitle')}
            </p>
          </div>
        </div>
      }
      headerClassName="bg-transparent"
      className="py-20"
      maxWidthClassName="max-w-7xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white/70 dark:bg-gray-800/60 border border-gray-200/70 dark:border-gray-700/70 backdrop-blur-md rounded-3xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{t('cvBuilder.contentTitle')}</h2>

            <div className="mb-6">
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">{t('cvBuilder.reorderTitle')}</div>
              <div className="flex flex-wrap gap-2">
                {sectionOrder.filter(isSectionEnabled).map((id) => (
                  <div
                    key={id}
                    role="button"
                    tabIndex={0}
                    draggable
                    onDragStart={() => onSectionDragStart(id)}
                    onDragOver={(e) => onSectionDragOver(e, id)}
                    onDrop={onSectionDrop}
                    className={`select-none px-3 py-2 rounded-2xl border text-sm font-semibold transition ${draggingSection === id ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-200 shadow-sm' : 'border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-900/40'}`}
                  >
                    {sectionLabel(id)}
                  </div>
                ))}
              </div>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">{t('cvBuilder.reorderHint')}</div>
            </div>

            <div className="mb-6">
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">{t('cvBuilder.optionalTitle')}</div>
              <div className="flex flex-wrap gap-2">
                {!enabledSections.experience ? (
                  <button type="button" onClick={() => enableSection('experience')} className={smallGhostBtn}>{t('cvBuilder.optional.add', { section: t('cvBuilder.sections.experience') })}</button>
                ) : (
                  <button type="button" onClick={() => disableSection('experience')} className={smallDangerBtn}>{t('cvBuilder.optional.remove', { section: t('cvBuilder.sections.experience') })}</button>
                )}
                {!enabledSections.projects ? (
                  <button type="button" onClick={() => enableSection('projects')} className={smallGhostBtn}>{t('cvBuilder.optional.add', { section: t('cvBuilder.sections.projects') })}</button>
                ) : (
                  <button type="button" onClick={() => disableSection('projects')} className={smallDangerBtn}>{t('cvBuilder.optional.remove', { section: t('cvBuilder.sections.projects') })}</button>
                )}
                {!enabledSections.honors ? (
                  <button type="button" onClick={() => enableSection('honors')} className={smallGhostBtn}>{t('cvBuilder.optional.add', { section: t('cvBuilder.sections.honors') })}</button>
                ) : (
                  <button type="button" onClick={() => disableSection('honors')} className={smallDangerBtn}>{t('cvBuilder.optional.remove', { section: t('cvBuilder.sections.honors') })}</button>
                )}
                {!enabledSections.certifications ? (
                  <button type="button" onClick={() => enableSection('certifications')} className={smallGhostBtn}>{t('cvBuilder.optional.add', { section: t('cvBuilder.sections.certifications') })}</button>
                ) : (
                  <button type="button" onClick={() => disableSection('certifications')} className={smallDangerBtn}>{t('cvBuilder.optional.remove', { section: t('cvBuilder.sections.certifications') })}</button>
                )}
                {!enabledSections.languages ? (
                  <button type="button" onClick={() => enableSection('languages')} className={smallGhostBtn}>{t('cvBuilder.optional.add', { section: t('cvBuilder.sections.languages') })}</button>
                ) : (
                  <button type="button" onClick={() => disableSection('languages')} className={smallDangerBtn}>{t('cvBuilder.optional.remove', { section: t('cvBuilder.sections.languages') })}</button>
                )}
              </div>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">{t('cvBuilder.optionalHint')}</div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">{stepLabel(activeStepId)}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {t('cvBuilder.stepLabel', { current: activeStepIndex + 1, total: steps.length })}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {steps.map((id, idx) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveStepIndex(idx)}
                    className={`select-none px-3 py-2 rounded-2xl border text-sm font-semibold transition ${idx === activeStepIndex ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-200 shadow-sm' : 'border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-900/40'}`}
                  >
                    {stepLabel(id)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              {activeStepId === 'personal' ? (
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t('cvBuilder.sections.personal')}</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <input
                        {...register('personal.fullName')}
                        className={fieldClass(inputClass, 'personal.fullName')}
                        placeholder={t('cvBuilder.placeholders.fullName')}
                      />
                      <ErrorLine msg={getError('personal.fullName')} />
                    </div>
                    <div>
                      <input
                        {...register('personal.title')}
                        className={fieldClass(inputClass, 'personal.title')}
                        placeholder={t('cvBuilder.placeholders.title')}
                      />
                      <ErrorLine msg={getError('personal.title')} />
                    </div>
                    <div>
                      <input
                        {...register('personal.email')}
                        className={fieldClass(inputClass, 'personal.email')}
                        placeholder={t('cvBuilder.placeholders.email')}
                      />
                      <ErrorLine msg={getError('personal.email')} />
                    </div>
                    <div>
                      <input
                        {...register('personal.phone')}
                        className={fieldClass(inputClass, 'personal.phone')}
                        placeholder={t('cvBuilder.placeholders.phone')}
                      />
                      <ErrorLine msg={getError('personal.phone')} />
                    </div>
                    <div>
                      <input
                        {...register('personal.location')}
                        className={fieldClass(inputClass, 'personal.location')}
                        placeholder={t('cvBuilder.placeholders.location')}
                      />
                      <ErrorLine msg={getError('personal.location')} />
                    </div>
                    <div>
                      <input
                        {...register('personal.website')}
                        className={fieldClass(inputClass, 'personal.website')}
                        placeholder={t('cvBuilder.placeholders.website')}
                      />
                      <ErrorLine msg={getError('personal.website')} />
                    </div>
                  </div>
                </section>
              ) : null}

              {activeStepId === 'summary' ? (
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t('cvBuilder.sections.summary')}</h3>
                  <textarea
                    {...register('summary')}
                    rows={4}
                    className={fieldClass(textAreaClass, 'summary')}
                    placeholder={t('cvBuilder.placeholders.summary')}
                  />
                  <ErrorLine msg={getError('summary')} />
                </section>
              ) : null}

              {activeStepId === 'education' ? (
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t('cvBuilder.sections.education')}</h3>
                    <button
                      type="button"
                      onClick={() => educationArray.append(emptyEducation())}
                      className={addBtn}
                    >
                      {t('cvBuilder.actions.add')}
                    </button>
                  </div>

                  <div className="space-y-4">
                    {educationArray.fields.map((field, idx) => (
                      <div key={field.id} className={sectionCardClass}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t('cvBuilder.itemLabel', { index: idx + 1 })}</div>
                          {educationArray.fields.length > 1 && (
                            <button
                              type="button"
                              onClick={() => educationArray.remove(idx)}
                              className={smallDangerBtn}
                            >
                              {t('cvBuilder.actions.remove')}
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <input
                              {...register(`education.${idx}.school`)}
                              className={fieldClass(inputClass, `education.${idx}.school`)}
                              placeholder={t('cvBuilder.placeholders.school')}
                            />
                            <ErrorLine msg={getError(`education.${idx}.school`)} />
                          </div>
                          <div>
                            <input
                              {...register(`education.${idx}.degree`)}
                              className={fieldClass(inputClass, `education.${idx}.degree`)}
                              placeholder={t('cvBuilder.placeholders.degree')}
                            />
                            <ErrorLine msg={getError(`education.${idx}.degree`)} />
                          </div>
                          <div>
                            <input
                              {...register(`education.${idx}.field`)}
                              className={fieldClass(inputClass, `education.${idx}.field`)}
                              placeholder={t('cvBuilder.placeholders.field')}
                            />
                            <ErrorLine msg={getError(`education.${idx}.field`)} />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Controller
                                control={control}
                                name={`education.${idx}.start`}
                                render={({ field: f }) => (
                                  <YearPicker
                                    value={f.value}
                                    onChange={f.onChange}
                                    inputClassName={fieldClass(inputClass, `education.${idx}.start`)}
                                    placeholder={t('cvBuilder.placeholders.startYear')}
                                  />
                                )}
                              />
                              <ErrorLine msg={getError(`education.${idx}.start`)} />
                            </div>
                            <div>
                              <Controller
                                control={control}
                                name={`education.${idx}.end`}
                                render={({ field: f }) => (
                                  <YearPicker
                                    value={f.value}
                                    onChange={f.onChange}
                                    inputClassName={fieldClass(inputClass, `education.${idx}.end`)}
                                    placeholder={t('cvBuilder.placeholders.endYear')}
                                  />
                                )}
                              />
                              <ErrorLine msg={getError(`education.${idx}.end`)} />
                            </div>
                          </div>
                        </div>

                        <textarea
                          {...register(`education.${idx}.details`)}
                          rows={3}
                          className={fieldClass(`${textAreaClass} mt-3`, `education.${idx}.details`)}
                          placeholder={t('cvBuilder.placeholders.educationDetails')}
                        />
                        <ErrorLine msg={getError(`education.${idx}.details`)} />
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {activeStepId === 'experience' && enabledSections.experience ? (
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t('cvBuilder.sections.experience')}</h3>
                    <button
                      type="button"
                      onClick={() => experienceArray.append(emptyExperience())}
                      className={addBtn}
                    >
                      {t('cvBuilder.actions.add')}
                    </button>
                  </div>

                  <div className="space-y-4">
                    {experienceArray.fields.map((field, idx) => (
                      <div key={field.id} className={sectionCardClass}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t('cvBuilder.itemLabel', { index: idx + 1 })}</div>
                          {experienceArray.fields.length > 1 && (
                            <button
                              type="button"
                              onClick={() => experienceArray.remove(idx)}
                              className={smallDangerBtn}
                            >
                              {t('cvBuilder.actions.remove')}
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <input
                              {...register(`experience.${idx}.company`)}
                              className={fieldClass(inputClass, `experience.${idx}.company`)}
                              placeholder={t('cvBuilder.placeholders.company')}
                            />
                            <ErrorLine msg={getError(`experience.${idx}.company`)} />
                          </div>
                          <div>
                            <input
                              {...register(`experience.${idx}.role`)}
                              className={fieldClass(inputClass, `experience.${idx}.role`)}
                              placeholder={t('cvBuilder.placeholders.role')}
                            />
                            <ErrorLine msg={getError(`experience.${idx}.role`)} />
                          </div>
                          <div className="grid grid-cols-2 gap-3 sm:col-span-2">
                            <div>
                              <Controller
                                control={control}
                                name={`experience.${idx}.start`}
                                render={({ field: f }) => (
                                  <YearPicker
                                    value={f.value}
                                    onChange={f.onChange}
                                    inputClassName={fieldClass(inputClass, `experience.${idx}.start`)}
                                    placeholder={t('cvBuilder.placeholders.startYear')}
                                  />
                                )}
                              />
                              <ErrorLine msg={getError(`experience.${idx}.start`)} />
                            </div>
                            <div>
                              <Controller
                                control={control}
                                name={`experience.${idx}.end`}
                                render={({ field: f }) => (
                                  <YearPicker
                                    value={f.value}
                                    onChange={f.onChange}
                                    inputClassName={fieldClass(inputClass, `experience.${idx}.end`)}
                                    placeholder={t('cvBuilder.placeholders.endYear')}
                                  />
                                )}
                              />
                              <ErrorLine msg={getError(`experience.${idx}.end`)} />
                            </div>
                          </div>
                        </div>

                        <textarea
                          {...register(`experience.${idx}.details`)}
                          rows={3}
                          className={fieldClass(`${textAreaClass} mt-3`, `experience.${idx}.details`)}
                          placeholder={t('cvBuilder.placeholders.experienceDetails')}
                        />
                        <ErrorLine msg={getError(`experience.${idx}.details`)} />
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {activeStepId === 'skills' ? (
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t('cvBuilder.sections.skills')}</h3>
                  <input
                    {...register('skills')}
                    className={fieldClass(inputClass, 'skills')}
                    placeholder={t('cvBuilder.placeholders.skills')}
                  />
                  <ErrorLine msg={getError('skills')} />
                </section>
              ) : null}

              {activeStepId === 'projects' && enabledSections.projects ? (
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t('cvBuilder.sections.projects')}</h3>
                  <textarea
                    {...register('projects')}
                    rows={4}
                    className={fieldClass(textAreaClass, 'projects')}
                    placeholder={t('cvBuilder.placeholders.projects')}
                  />
                  <ErrorLine msg={getError('projects')} />
                </section>
              ) : null}

              {activeStepId === 'honors' && enabledSections.honors ? (
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t('cvBuilder.sections.honors')}</h3>
                  <textarea
                    {...register('honors')}
                    rows={4}
                    className={fieldClass(textAreaClass, 'honors')}
                    placeholder={t('cvBuilder.placeholders.honors')}
                  />
                  <ErrorLine msg={getError('honors')} />
                </section>
              ) : null}

              {activeStepId === 'certifications' && enabledSections.certifications ? (
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t('cvBuilder.sections.certifications')}</h3>
                  <textarea
                    {...register('certifications')}
                    rows={4}
                    className={fieldClass(textAreaClass, 'certifications')}
                    placeholder={t('cvBuilder.placeholders.certifications')}
                  />
                  <ErrorLine msg={getError('certifications')} />
                </section>
              ) : null}

              {activeStepId === 'languages' && enabledSections.languages ? (
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t('cvBuilder.sections.languages')}</h3>
                  <input
                    {...register('languages')}
                    className={fieldClass(inputClass, 'languages')}
                    placeholder={t('cvBuilder.placeholders.languages')}
                  />
                  <ErrorLine msg={getError('languages')} />
                </section>
              ) : null}
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setActiveStepIndex((i) => Math.max(0, i - 1))}
                className={smallGhostBtn}
                disabled={activeStepIndex === 0}
                style={activeStepIndex === 0 ? { opacity: 0.5, pointerEvents: 'none' } : undefined}
              >
                {t('cvBuilder.actions.back')}
              </button>

              <button
                type="button"
                onClick={() => setActiveStepIndex((i) => Math.min(steps.length - 1, i + 1))}
                className={smallPrimaryBtn}
                disabled={activeStepIndex >= steps.length - 1}
                style={activeStepIndex >= steps.length - 1 ? { opacity: 0.5, pointerEvents: 'none' } : undefined}
              >
                {t('cvBuilder.actions.next')}
              </button>
            </div>
          </div>

          <div className="lg:sticky lg:top-24 self-start">
            <div className="bg-white/70 dark:bg-gray-800/60 border border-gray-200/70 dark:border-gray-700/70 backdrop-blur-md rounded-3xl shadow-lg p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('cvBuilder.preview.title')}</h2>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{t('cvBuilder.preview.paperSize')}</div>
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <button
                    type="button"
                    onClick={saveCv}
                    className={smallGhostBtn}
                  >
                    {t('cvBuilder.actions.saveCv')}
                  </button>
                  <button
                    type="button"
                    onClick={exportPdf}
                    className={smallPrimaryBtn}
                  >
                    {t('cvBuilder.actions.exportPdf')}
                  </button>
                </div>
              </div>

              <div className="flex justify-center">
                <div ref={previewViewportRef} className="overflow-auto w-full" style={{ maxHeight: '75vh' }}>
                  <div
                    className="origin-top-left"
                    style={{ transform: `scale(${previewScale})`, width: `calc(210mm * ${previewScale})`, minHeight: `calc(297mm * ${previewScale})` }}
                  >
                    <div
                      ref={previewRef}
                      className="bg-white text-gray-900 shadow-2xl border border-gray-200"
                      style={{ width: '210mm', minHeight: '297mm', wordBreak: 'break-word' }}
                    >
                      <div
                        className="flex items-center justify-between"
                        style={{ height: '22mm', backgroundColor: 'rgb(79, 70, 229)', paddingLeft: '14mm', paddingRight: '14mm' }}
                      >
                        <div className="flex items-center gap-3" style={{ color: '#fff' }}>
                          <img src="/favicon.png" alt={t('common.appName')} style={{ width: '10mm', height: '10mm' }} />
                          <div>
                            <div className="font-extrabold" style={{ fontSize: '12pt', lineHeight: 1.1 }}>{t('common.appName')}</div>
                            <div style={{ fontSize: '9pt', opacity: 0.95 }}>{t('cvBuilder.title')}</div>
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          paddingLeft: '14mm',
                          paddingRight: '14mm',
                          paddingTop: '12mm',
                          paddingBottom: '10mm',
                          fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Noto Sans, sans-serif'
                        }}
                      >
                        <div className="flex items-start justify-between gap-6">
                          <div>
                            <div className="text-3xl font-extrabold">{personal.fullName || t('cvBuilder.preview.yourName')}</div>
                            {personal.title && <div className="text-sm text-gray-700 mt-1">{personal.title}</div>}
                          </div>
                          <div className="text-xs text-right text-gray-700" style={{ maxWidth: '70mm' }}>
                            {personal.email && <div className="break-words">{personal.email}</div>}
                            {personal.phone && <div className="break-words">{personal.phone}</div>}
                            {personal.location && <div className="break-words">{personal.location}</div>}
                            {personal.website && <div className="break-words">{personal.website}</div>}
                          </div>
                        </div>

                        <div className="mt-6 space-y-6">
                          {sectionOrder.filter(isSectionEnabled).map((id) => {
                            if (id === 'summary') {
                              if (!summary) return null;
                              return (
                                <div key={id}>
                                  <div className="text-[10px] font-bold tracking-widest border-b pb-2" style={{ color: 'rgb(60, 60, 60)', borderColor: 'rgb(230,230,230)' }}>{t('cvBuilder.preview.sectionHeading.summary')}</div>
                                  <div className="mt-2 text-sm leading-relaxed whitespace-pre-wrap break-words">{summary}</div>
                                </div>
                              );
                            }

                            if (id === 'education') {
                              const items = education.filter(ed => ed.school || ed.degree || ed.field || ed.details || ed.start || ed.end);
                              if (items.length === 0) return null;
                              return (
                                <div key={id}>
                                  <div className="text-[10px] font-bold tracking-widest border-b pb-2" style={{ color: 'rgb(60, 60, 60)', borderColor: 'rgb(230,230,230)' }}>{t('cvBuilder.preview.sectionHeading.education')}</div>
                                  <div className="mt-3 space-y-3">
                                    {items.map((ed, idx) => (
                                      <div key={idx} className="text-sm">
                                        <div className="flex justify-between gap-4">
                                          <div className="font-semibold break-words">
                                            {[ed.school, ed.degree, ed.field].filter(Boolean).join(' · ') || t('cvBuilder.sections.education')}
                                          </div>
                                          <div className="text-gray-600 text-xs whitespace-nowrap">
                                            {[ed.start, ed.end].filter(Boolean).join(' - ')}
                                          </div>
                                        </div>
                                        {ed.details && <div className="mt-1 text-gray-700 whitespace-pre-wrap break-words">{ed.details}</div>}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            }

                            if (id === 'experience') {
                              const items = experience.filter(ex => ex.company || ex.role || ex.details || ex.start || ex.end);
                              if (items.length === 0) return null;
                              return (
                                <div key={id}>
                                  <div className="text-[10px] font-bold tracking-widest border-b pb-2" style={{ color: 'rgb(60, 60, 60)', borderColor: 'rgb(230,230,230)' }}>{t('cvBuilder.preview.sectionHeading.experience')}</div>
                                  <div className="mt-3 space-y-3">
                                    {items.map((ex, idx) => (
                                      <div key={idx} className="text-sm">
                                        <div className="flex justify-between gap-4">
                                          <div className="font-semibold break-words">
                                            {[ex.role, ex.company].filter(Boolean).join(' · ') || t('cvBuilder.sections.experience')}
                                          </div>
                                          <div className="text-gray-600 text-xs whitespace-nowrap">
                                            {[ex.start, ex.end].filter(Boolean).join(' - ')}
                                          </div>
                                        </div>
                                        {ex.details && <div className="mt-1 text-gray-700 whitespace-pre-wrap break-words">{ex.details}</div>}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            }

                            if (id === 'skills') {
                              if (skillsList.length === 0) return null;
                              return (
                                <div key={id}>
                                  <div className="text-[10px] font-bold tracking-widest border-b pb-2" style={{ color: 'rgb(60, 60, 60)', borderColor: 'rgb(230,230,230)' }}>{t('cvBuilder.preview.sectionHeading.skills')}</div>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {skillsList.map((s) => (
                                      <span
                                        key={s}
                                        className="text-xs px-2 py-1 rounded-full border border-gray-200 bg-gray-50"
                                      >
                                        {s}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              );
                            }

                            if (id === 'projects') {
                              if (!enabledSections.projects) return null;
                              if (!projects) return null;
                              return (
                                <div key={id}>
                                  <div className="text-[10px] font-bold tracking-widest border-b pb-2" style={{ color: 'rgb(60, 60, 60)', borderColor: 'rgb(230,230,230)' }}>{t('cvBuilder.preview.sectionHeading.projects')}</div>
                                  <div className="mt-2 text-sm leading-relaxed whitespace-pre-wrap break-words">{projects}</div>
                                </div>
                              );
                            }

                            if (id === 'honors') {
                              if (!enabledSections.honors) return null;
                              if (!honors) return null;
                              return (
                                <div key={id}>
                                  <div className="text-[10px] font-bold tracking-widest border-b pb-2" style={{ color: 'rgb(60, 60, 60)', borderColor: 'rgb(230,230,230)' }}>{t('cvBuilder.preview.sectionHeading.honors')}</div>
                                  <div className="mt-2 text-sm leading-relaxed whitespace-pre-wrap break-words">{honors}</div>
                                </div>
                              );
                            }

                            if (id === 'certifications') {
                              if (!enabledSections.certifications) return null;
                              if (!certifications) return null;
                              return (
                                <div key={id}>
                                  <div className="text-[10px] font-bold tracking-widest border-b pb-2" style={{ color: 'rgb(60, 60, 60)', borderColor: 'rgb(230,230,230)' }}>{t('cvBuilder.preview.sectionHeading.certifications')}</div>
                                  <div className="mt-2 text-sm leading-relaxed whitespace-pre-wrap break-words">{certifications}</div>
                                </div>
                              );
                            }

                            if (id === 'languages') {
                              if (!enabledSections.languages) return null;
                              if (!languages) return null;
                              return (
                                <div key={id}>
                                  <div className="text-[10px] font-bold tracking-widest border-b pb-2" style={{ color: 'rgb(60, 60, 60)', borderColor: 'rgb(230,230,230)' }}>{t('cvBuilder.preview.sectionHeading.languages')}</div>
                                  <div className="mt-2 text-sm leading-relaxed whitespace-pre-wrap break-words">{languages}</div>
                                </div>
                              );
                            }

                            return null;
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                {t('cvBuilder.tip')}
              </div>
            </div>
          </div>
      </div>
    </StudentPageLayout>
  );
}
