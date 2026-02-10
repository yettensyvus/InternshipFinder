import { useEffect, useMemo, useRef, useState } from 'react';
import jsPDF from 'jspdf';
import axios from '../../services/axios';
import { showLoadingToast, showToast } from '../../services/toast';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useTranslation } from 'react-i18next';

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

  const [personal, setPersonal] = useState({
    fullName: '',
    title: '',
    email: '',
    phone: '',
    location: '',
    website: ''
  });

  const [summary, setSummary] = useState('');
  const [education, setEducation] = useState([emptyEducation()]);
  const [experience, setExperience] = useState([emptyExperience()]);
  const [skills, setSkills] = useState('');
  const [projects, setProjects] = useState('');
  const [honors, setHonors] = useState('');
  const [certifications, setCertifications] = useState('');
  const [languages, setLanguages] = useState('');

  const [errors, setErrors] = useState({});

  const [sectionOrder, setSectionOrder] = useState([
    'summary',
    'education',
    'experience',
    'skills',
    'projects'
  ]);

  const [enabledSections, setEnabledSections] = useState({
    experience: true,
    projects: true,
    honors: false,
    certifications: false,
    languages: false
  });

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

  const fieldError = (key) => errors?.[key];
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

  const validate = () => {
    const next = {};
    const nowYear = new Date().getFullYear();
    const trim = (v) => String(v ?? '').trim();

    const msgRequired = (field) => t('cvBuilder.validation.required', { field });
    const msgTooShort = (field) => t('cvBuilder.validation.tooShort', { field });
    const msgTooLong = (field) => t('cvBuilder.validation.tooLong', { field });
    const msgInvalid = (field) => t('cvBuilder.validation.invalid', { field });

    const hasAny = (obj) => {
      if (!obj) return false;
      return Object.values(obj).some(v => String(v ?? '').trim().length > 0);
    };

    const requireText = (key, value, label, minLen = 2, maxLen = 120) => {
      const v = trim(value);
      if (!v) {
        next[key] = msgRequired(label);
        return null;
      }
      if (v.length < minLen) {
        next[key] = msgTooShort(label);
        return null;
      }
      if (v.length > maxLen) {
        next[key] = msgTooLong(label);
        return null;
      }
      return v;
    };

    const parseYear = (raw) => {
      const v = trim(raw);
      if (!v) return null;
      if (!/^\d{4}$/.test(v)) return NaN;
      return Number(v);
    };

    const validateYearRange = (startKey, endKey, startRaw, endRaw, opts) => {
      const {
        allowFutureEnd,
        disallowFutureStart,
        disallowFutureEnd,
        requireEnd
      } = opts;

      const start = parseYear(startRaw);
      const end = parseYear(endRaw);

      if (start === null) {
        next[startKey] = msgRequired(t('cvBuilder.fields.startYear'));
      } else if (Number.isNaN(start)) {
        next[startKey] = msgInvalid(t('cvBuilder.fields.startYear'));
      } else if (disallowFutureStart && start > nowYear) {
        next[startKey] = t('cvBuilder.validation.startYearNoFuture');
      }

      if (requireEnd) {
        if (end === null) {
          next[endKey] = msgRequired(t('cvBuilder.fields.endYear'));
        } else if (Number.isNaN(end)) {
          next[endKey] = msgInvalid(t('cvBuilder.fields.endYear'));
        }
      } else if (end !== null && Number.isNaN(end)) {
        next[endKey] = msgInvalid(t('cvBuilder.fields.endYear'));
      }

      if (end !== null && !Number.isNaN(end)) {
        if (!allowFutureEnd && disallowFutureEnd && end > nowYear) {
          next[endKey] = t('cvBuilder.validation.endYearNoFuture');
        }
      }

      if (start != null && end != null && !Number.isNaN(start) && !Number.isNaN(end)) {
        if (end < start) {
          next[endKey] = t('cvBuilder.validation.endAfterStart');
        }
      }
    };

    // Personal
    requireText('personal.fullName', personal.fullName, t('cvBuilder.fields.fullName'), 2, 80);
    requireText('personal.title', personal.title, t('cvBuilder.fields.title'), 2, 80);
    const email = requireText('personal.email', personal.email, t('cvBuilder.fields.email'), 5, 120);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next['personal.email'] = msgInvalid(t('cvBuilder.fields.email'));
    }
    const phone = requireText('personal.phone', personal.phone, t('cvBuilder.fields.phone'), 6, 30);
    if (phone && !/^[+()\d\s-]+$/.test(phone)) {
      next['personal.phone'] = t('cvBuilder.validation.phoneInvalidChars');
    }
    requireText('personal.location', personal.location, t('cvBuilder.fields.location'), 2, 80);
    const website = trim(personal.website);
    if (!website) {
      next['personal.website'] = msgRequired(t('cvBuilder.fields.website'));
    } else if (!/^https?:\/\//i.test(website) && !/^\w+[\w.-]*\.[a-z]{2,}/i.test(website)) {
      next['personal.website'] = msgInvalid(t('cvBuilder.fields.website'));
    }

    // Summary
    const sum = trim(summary);
    if (!sum) {
      next.summary = msgRequired(t('cvBuilder.fields.summary'));
    } else if (sum.length < 20) {
      next.summary = msgTooShort(t('cvBuilder.fields.summary'));
    } else if (sum.length > 1500) {
      next.summary = msgTooLong(t('cvBuilder.fields.summary'));
    }

    // Education (validate only items that are filled; if none filled, validate first item)
    if (!Array.isArray(education) || education.length === 0) {
      next.education = t('cvBuilder.validation.educationAtLeastOne');
    } else {
      const filledIdx = education
        .map((ed, idx) => ({ ed, idx }))
        .filter(({ ed }) => hasAny(ed))
        .map(({ idx }) => idx);

      const toValidate = filledIdx.length > 0 ? filledIdx : [0];
      toValidate.forEach((idx) => {
        const ed = education[idx] || {};
        requireText(`education.${idx}.school`, ed.school, t('cvBuilder.fields.school'), 2, 120);
        requireText(`education.${idx}.degree`, ed.degree, t('cvBuilder.fields.degree'), 2, 120);
        requireText(`education.${idx}.field`, ed.field, t('cvBuilder.fields.field'), 2, 120);
        requireText(`education.${idx}.details`, ed.details, t('cvBuilder.fields.educationDetails'), 5, 1500);

        validateYearRange(
          `education.${idx}.start`,
          `education.${idx}.end`,
          ed.start,
          ed.end,
          {
            allowFutureEnd: true,
            disallowFutureStart: true,
            disallowFutureEnd: false,
            requireEnd: true
          }
        );
      });
    }

    // Experience (optional)
    if (enabledSections.experience) {
      // validate only items that are filled; if none filled, validate first item
      if (!Array.isArray(experience) || experience.length === 0) {
        next.experience = t('cvBuilder.validation.experienceAtLeastOne');
      } else {
        const filledIdx = experience
          .map((ex, idx) => ({ ex, idx }))
          .filter(({ ex }) => hasAny(ex))
          .map(({ idx }) => idx);

        const toValidate = filledIdx.length > 0 ? filledIdx : [0];
        toValidate.forEach((idx) => {
          const ex = experience[idx] || {};
          requireText(`experience.${idx}.company`, ex.company, t('cvBuilder.fields.company'), 2, 120);
          requireText(`experience.${idx}.role`, ex.role, t('cvBuilder.fields.role'), 2, 120);
          requireText(`experience.${idx}.details`, ex.details, t('cvBuilder.fields.experienceDetails'), 5, 1500);

          validateYearRange(
            `experience.${idx}.start`,
            `experience.${idx}.end`,
            ex.start,
            ex.end,
            {
              allowFutureEnd: false,
              disallowFutureStart: true,
              disallowFutureEnd: true,
              requireEnd: true
            }
          );
        });
      }
    }

    // Skills
    if (skillsList.length === 0) {
      next.skills = t('cvBuilder.validation.skillsAtLeastOne');
    } else if (skillsList.some(s => s.length > 40)) {
      next.skills = t('cvBuilder.validation.skillsOneTooLong');
    }

    // Projects
    if (enabledSections.projects) {
      const proj = trim(projects);
      if (proj && proj.length < 10) {
        next.projects = msgTooShort(t('cvBuilder.sections.projects'));
      } else if (proj && proj.length > 2000) {
        next.projects = msgTooLong(t('cvBuilder.sections.projects'));
      }
    }

    if (enabledSections.honors) {
      const v = trim(honors);
      if (v && v.length > 2000) {
        next.honors = msgTooLong(t('cvBuilder.sections.honors'));
      }
    }

    if (enabledSections.certifications) {
      const v = trim(certifications);
      if (v && v.length > 2000) {
        next.certifications = msgTooLong(t('cvBuilder.sections.certifications'));
      }
    }

    if (enabledSections.languages) {
      const v = trim(languages);
      if (v && v.length > 300) {
        next.languages = msgTooLong(t('cvBuilder.sections.languages'));
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

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
    setErrors(prev => {
      const next = { ...(prev || {}) };
      Object.keys(next).forEach((k) => {
        if (k === id || k.startsWith(`${id}.`)) delete next[k];
      });
      return next;
    });
    if (id === 'projects') setProjects('');
    if (id === 'honors') setHonors('');
    if (id === 'certifications') setCertifications('');
    if (id === 'languages') setLanguages('');
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

  const buildPdf = async () => {
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

    const fullName = text(personal.fullName) || t('cvBuilder.preview.yourName');
    const title = text(personal.title);
    const email = text(personal.email);
    const phone = text(personal.phone);
    const location = text(personal.location);
    const website = text(personal.website);

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
        if (!text(summary)) return;
        addHeading(t('cvBuilder.sections.summary'));
        set(10, 'normal');
        addWrapped(summary, marginX, contentWidth, 5);
        y += sectionGap;
        return;
      }

      if (id === 'education') {
        const items = education.filter(ed => text(ed.school) || text(ed.degree) || text(ed.field) || text(ed.details) || text(ed.start) || text(ed.end));
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
        const items = experience.filter(ex => text(ex.company) || text(ex.role) || text(ex.details) || text(ex.start) || text(ex.end));
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
        if (skillsList.length === 0) return;
        addHeading(t('cvBuilder.sections.skills'));
        set(10, 'normal');
        addBulletLines(skillsList.join('\n'), marginX, contentWidth);
        y += sectionGap;
        return;
      }

      if (id === 'projects') {
        if (!enabledSections.projects) return;
        if (!text(projects)) return;
        addHeading(t('cvBuilder.sections.projects'));
        set(10, 'normal');
        addBulletLines(projects, marginX, contentWidth);
        y += sectionGap;
        return;
      }

      if (id === 'honors') {
        if (!enabledSections.honors) return;
        if (!text(honors)) return;
        addHeading(t('cvBuilder.sections.honors'));
        set(10, 'normal');
        addBulletLines(honors, marginX, contentWidth);
        y += sectionGap;
        return;
      }

      if (id === 'certifications') {
        if (!enabledSections.certifications) return;
        if (!text(certifications)) return;
        addHeading(t('cvBuilder.sections.certifications'));
        set(10, 'normal');
        addBulletLines(certifications, marginX, contentWidth);
        y += sectionGap;
        return;
      }

      if (id === 'languages') {
        if (!enabledSections.languages) return;
        if (!text(languages)) return;
        addHeading(t('cvBuilder.sections.languages'));
        set(10, 'normal');
        addWrapped(languages, marginX, contentWidth);
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

        setPersonal(prev => ({
          ...prev,
          fullName: prev.fullName || p.name || '',
          email: prev.email || p.email || '',
          phone: prev.phone || p.phone || ''
        }));

        setEducation(prev => {
          const hasUserInput = prev.some(e => Object.values(e).some(v => String(v || '').trim().length > 0));
          if (hasUserInput) return prev;
          if (!p.college && !p.branch && !p.yearOfPassing) return prev;
          const next = emptyEducation();
          next.school = p.college || '';
          next.field = p.branch || '';
          next.end = p.yearOfPassing ? String(p.yearOfPassing) : '';
          return [next];
        });
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
    if (!validate()) {
      showToast(toastId, 'error', t('cvBuilder.toasts.fixHighlighted'));
      return;
    }
    const pdf = await buildPdf();
    const safeName = (personal.fullName || 'cv').replace(/[^a-z0-9\-\s]/gi, '').trim().replace(/\s+/g, '_');
    pdf.save(`${safeName || 'cv'}.pdf`);
  };

  const saveCv = async () => {
    const toastId = 'cv-builder-save';
    try {
      if (!validate()) {
        showToast(toastId, 'error', t('cvBuilder.toasts.fixHighlighted'), { autoClose: 2500 });
        return;
      }
      showLoadingToast(toastId, t('cvBuilder.toasts.saving'));
      const pdf = await buildPdf();
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

  const updatePersonal = (key, value) => {
    setPersonal(prev => ({ ...prev, [key]: value }));
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
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 py-20">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 dark:from-violet-400 dark:via-indigo-400 dark:to-blue-400">
              {t('cvBuilder.title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2 max-w-2xl">
              {t('cvBuilder.subtitle')}
            </p>
          </div>
        </div>

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
                        value={personal.fullName}
                        onChange={(e) => updatePersonal('fullName', e.target.value)}
                        className={fieldClass(inputClass, 'personal.fullName')}
                        placeholder={t('cvBuilder.placeholders.fullName')}
                      />
                      <ErrorLine msg={fieldError('personal.fullName')} />
                    </div>
                    <div>
                      <input
                        value={personal.title}
                        onChange={(e) => updatePersonal('title', e.target.value)}
                        className={fieldClass(inputClass, 'personal.title')}
                        placeholder={t('cvBuilder.placeholders.title')}
                      />
                      <ErrorLine msg={fieldError('personal.title')} />
                    </div>
                    <div>
                      <input
                        value={personal.email}
                        onChange={(e) => updatePersonal('email', e.target.value)}
                        className={fieldClass(inputClass, 'personal.email')}
                        placeholder={t('cvBuilder.placeholders.email')}
                      />
                      <ErrorLine msg={fieldError('personal.email')} />
                    </div>
                    <div>
                      <input
                        value={personal.phone}
                        onChange={(e) => updatePersonal('phone', e.target.value)}
                        className={fieldClass(inputClass, 'personal.phone')}
                        placeholder={t('cvBuilder.placeholders.phone')}
                      />
                      <ErrorLine msg={fieldError('personal.phone')} />
                    </div>
                    <div>
                      <input
                        value={personal.location}
                        onChange={(e) => updatePersonal('location', e.target.value)}
                        className={fieldClass(inputClass, 'personal.location')}
                        placeholder={t('cvBuilder.placeholders.location')}
                      />
                      <ErrorLine msg={fieldError('personal.location')} />
                    </div>
                    <div>
                      <input
                        value={personal.website}
                        onChange={(e) => updatePersonal('website', e.target.value)}
                        className={fieldClass(inputClass, 'personal.website')}
                        placeholder={t('cvBuilder.placeholders.website')}
                      />
                      <ErrorLine msg={fieldError('personal.website')} />
                    </div>
                  </div>
                </section>
              ) : null}

              {activeStepId === 'summary' ? (
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t('cvBuilder.sections.summary')}</h3>
                  <textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    rows={4}
                    className={fieldClass(textAreaClass, 'summary')}
                    placeholder={t('cvBuilder.placeholders.summary')}
                  />
                  <ErrorLine msg={fieldError('summary')} />
                </section>
              ) : null}

              {activeStepId === 'education' ? (
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t('cvBuilder.sections.education')}</h3>
                    <button
                      type="button"
                      onClick={() => setEducation(prev => [...prev, emptyEducation()])}
                      className={addBtn}
                    >
                      {t('cvBuilder.actions.add')}
                    </button>
                  </div>

                  <div className="space-y-4">
                    {education.map((ed, idx) => (
                      <div key={idx} className={sectionCardClass}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t('cvBuilder.itemLabel', { index: idx + 1 })}</div>
                          {education.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setEducation(prev => prev.filter((_, i) => i !== idx))}
                              className={smallDangerBtn}
                            >
                              {t('cvBuilder.actions.remove')}
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <input
                              value={ed.school}
                              onChange={(e) => setEducation(prev => prev.map((x, i) => i === idx ? { ...x, school: e.target.value } : x))}
                              className={fieldClass(inputClass, `education.${idx}.school`)}
                              placeholder={t('cvBuilder.placeholders.school')}
                            />
                            <ErrorLine msg={fieldError(`education.${idx}.school`)} />
                          </div>
                          <div>
                            <input
                              value={ed.degree}
                              onChange={(e) => setEducation(prev => prev.map((x, i) => i === idx ? { ...x, degree: e.target.value } : x))}
                              className={fieldClass(inputClass, `education.${idx}.degree`)}
                              placeholder={t('cvBuilder.placeholders.degree')}
                            />
                            <ErrorLine msg={fieldError(`education.${idx}.degree`)} />
                          </div>
                          <div>
                            <input
                              value={ed.field}
                              onChange={(e) => setEducation(prev => prev.map((x, i) => i === idx ? { ...x, field: e.target.value } : x))}
                              className={fieldClass(inputClass, `education.${idx}.field`)}
                              placeholder={t('cvBuilder.placeholders.field')}
                            />
                            <ErrorLine msg={fieldError(`education.${idx}.field`)} />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <YearPicker
                                value={ed.start}
                                onChange={(value) => setEducation(prev => prev.map((x, i) => i === idx ? { ...x, start: value } : x))}
                                inputClassName={fieldClass(inputClass, `education.${idx}.start`)}
                                placeholder={t('cvBuilder.placeholders.startYear')}
                              />
                              <ErrorLine msg={fieldError(`education.${idx}.start`)} />
                            </div>
                            <div>
                              <YearPicker
                                value={ed.end}
                                onChange={(value) => setEducation(prev => prev.map((x, i) => i === idx ? { ...x, end: value } : x))}
                                inputClassName={fieldClass(inputClass, `education.${idx}.end`)}
                                placeholder={t('cvBuilder.placeholders.endYear')}
                              />
                              <ErrorLine msg={fieldError(`education.${idx}.end`)} />
                            </div>
                          </div>
                        </div>

                        <textarea
                          value={ed.details}
                          onChange={(e) => setEducation(prev => prev.map((x, i) => i === idx ? { ...x, details: e.target.value } : x))}
                          rows={3}
                          className={fieldClass(`${textAreaClass} mt-3`, `education.${idx}.details`)}
                          placeholder={t('cvBuilder.placeholders.educationDetails')}
                        />
                        <ErrorLine msg={fieldError(`education.${idx}.details`)} />
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
                      onClick={() => setExperience(prev => [...prev, emptyExperience()])}
                      className={addBtn}
                    >
                      {t('cvBuilder.actions.add')}
                    </button>
                  </div>

                  <div className="space-y-4">
                    {experience.map((ex, idx) => (
                      <div key={idx} className={sectionCardClass}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t('cvBuilder.itemLabel', { index: idx + 1 })}</div>
                          {experience.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setExperience(prev => prev.filter((_, i) => i !== idx))}
                              className={smallDangerBtn}
                            >
                              {t('cvBuilder.actions.remove')}
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <input
                              value={ex.company}
                              onChange={(e) => setExperience(prev => prev.map((x, i) => i === idx ? { ...x, company: e.target.value } : x))}
                              className={fieldClass(inputClass, `experience.${idx}.company`)}
                              placeholder={t('cvBuilder.placeholders.company')}
                            />
                            <ErrorLine msg={fieldError(`experience.${idx}.company`)} />
                          </div>
                          <div>
                            <input
                              value={ex.role}
                              onChange={(e) => setExperience(prev => prev.map((x, i) => i === idx ? { ...x, role: e.target.value } : x))}
                              className={fieldClass(inputClass, `experience.${idx}.role`)}
                              placeholder={t('cvBuilder.placeholders.role')}
                            />
                            <ErrorLine msg={fieldError(`experience.${idx}.role`)} />
                          </div>
                          <div className="grid grid-cols-2 gap-3 sm:col-span-2">
                            <div>
                              <YearPicker
                                value={ex.start}
                                onChange={(value) => setExperience(prev => prev.map((x, i) => i === idx ? { ...x, start: value } : x))}
                                inputClassName={fieldClass(inputClass, `experience.${idx}.start`)}
                                placeholder={t('cvBuilder.placeholders.startYear')}
                              />
                              <ErrorLine msg={fieldError(`experience.${idx}.start`)} />
                            </div>
                            <div>
                              <YearPicker
                                value={ex.end}
                                onChange={(value) => setExperience(prev => prev.map((x, i) => i === idx ? { ...x, end: value } : x))}
                                inputClassName={fieldClass(inputClass, `experience.${idx}.end`)}
                                placeholder={t('cvBuilder.placeholders.endYear')}
                              />
                              <ErrorLine msg={fieldError(`experience.${idx}.end`)} />
                            </div>
                          </div>
                        </div>

                        <textarea
                          value={ex.details}
                          onChange={(e) => setExperience(prev => prev.map((x, i) => i === idx ? { ...x, details: e.target.value } : x))}
                          rows={3}
                          className={fieldClass(`${textAreaClass} mt-3`, `experience.${idx}.details`)}
                          placeholder={t('cvBuilder.placeholders.experienceDetails')}
                        />
                        <ErrorLine msg={fieldError(`experience.${idx}.details`)} />
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {activeStepId === 'skills' ? (
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t('cvBuilder.sections.skills')}</h3>
                  <input
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    className={fieldClass(inputClass, 'skills')}
                    placeholder={t('cvBuilder.placeholders.skills')}
                  />
                  <ErrorLine msg={fieldError('skills')} />
                </section>
              ) : null}

              {activeStepId === 'projects' && enabledSections.projects ? (
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t('cvBuilder.sections.projects')}</h3>
                  <textarea
                    value={projects}
                    onChange={(e) => setProjects(e.target.value)}
                    rows={4}
                    className={fieldClass(textAreaClass, 'projects')}
                    placeholder={t('cvBuilder.placeholders.projects')}
                  />
                  <ErrorLine msg={fieldError('projects')} />
                </section>
              ) : null}

              {activeStepId === 'honors' && enabledSections.honors ? (
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t('cvBuilder.sections.honors')}</h3>
                  <textarea
                    value={honors}
                    onChange={(e) => setHonors(e.target.value)}
                    rows={4}
                    className={fieldClass(textAreaClass, 'honors')}
                    placeholder={t('cvBuilder.placeholders.honors')}
                  />
                  <ErrorLine msg={fieldError('honors')} />
                </section>
              ) : null}

              {activeStepId === 'certifications' && enabledSections.certifications ? (
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t('cvBuilder.sections.certifications')}</h3>
                  <textarea
                    value={certifications}
                    onChange={(e) => setCertifications(e.target.value)}
                    rows={4}
                    className={fieldClass(textAreaClass, 'certifications')}
                    placeholder={t('cvBuilder.placeholders.certifications')}
                  />
                  <ErrorLine msg={fieldError('certifications')} />
                </section>
              ) : null}

              {activeStepId === 'languages' && enabledSections.languages ? (
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t('cvBuilder.sections.languages')}</h3>
                  <input
                    value={languages}
                    onChange={(e) => setLanguages(e.target.value)}
                    className={fieldClass(inputClass, 'languages')}
                    placeholder={t('cvBuilder.placeholders.languages')}
                  />
                  <ErrorLine msg={fieldError('languages')} />
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
      </div>
    </div>
  );
}
