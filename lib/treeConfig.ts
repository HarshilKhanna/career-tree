export type EducationLevel = "school" | "undergraduate" | "masters";

/** Common countries for tree metadata (admin + home flows). */
export const COUNTRIES = [
  "India",
  "USA",
  "UK",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Japan",
  "Singapore",
  "UAE",
  "Netherlands",
  "Ireland",
  "Sweden",
  "South Korea",
  "Brazil",
  "Mexico",
  "South Africa",
  "New Zealand",
  "Spain",
  "Italy",
  "Other",
];

export const DEGREES: Record<EducationLevel, string[]> = {
  school: [
    "Class 10",
    "Class 11/12",
    "GCSE / IGCSE",
    "International Baccalaureate (IB)",
    "A-Levels",
    "High School Diploma",
  ],
  undergraduate: [
    "B.Tech",
    "B.E.",
    "B.Eng",
    "BS",
    "B.Sc",
    "BA",
    "BBA",
    "B.Com",
    "BCA",
    "B.Arch",
    "MBBS",
    "LLB",
    "B.Pharm",
    "B.Des",
    "Associate's Degree",
    "Diploma (undergraduate)",
  ],
  masters: [
    "M.Tech / M.E.",
    "MS",
    "M.Eng",
    "MBA",
    "M.Sc",
    "MA",
    "MCA",
    "M.Com",
    "LLM",
    "MD",
    "M.Arch",
    "M.Pharm",
    "PhD (coursework)",
    "Graduate Diploma",
  ],
};

/** When level is custom/unknown, show this combined list for degree picker. */
export const ALL_DEGREES_FALLBACK: string[] = [
  ...new Set([
    ...DEGREES.school,
    ...DEGREES.undergraduate,
    ...DEGREES.masters,
  ]),
];

/**
 * Degrees appropriate for a canonical education level (school / undergraduate / masters).
 * For non-standard level strings, returns the combined fallback list.
 */
export function degreesForLevel(level: string): string[] {
  const l = level.toLowerCase().trim();
  if (l === "school") return DEGREES.school;
  if (l === "undergraduate") return DEGREES.undergraduate;
  if (l === "masters") return DEGREES.masters;
  return ALL_DEGREES_FALLBACK;
}

/** User-facing label for education level (canonical values stay lowercase in data). */
export function formatLevelLabel(level: string): string {
  const t = level.trim();
  if (!t) return level;
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

/**
 * Known streams / specializations per degree. Custom degrees (typed under “Other”) use
 * {@link GENERIC_STREAM_SUGGESTIONS} via {@link streamsForDegree}.
 */
export const STREAMS: Record<string, string[]> = {
  "Class 10": [
    "General",
    "Science orientation",
    "Commerce orientation",
    "Humanities",
    "Vocational / Skills",
  ],
  "Class 11/12": ["PCM", "PCB", "PCMB", "Commerce", "Humanities", "Arts"],
  "GCSE / IGCSE": [
    "Sciences",
    "Mathematics focus",
    "Business & Economics",
    "Arts & Design",
    "Languages",
    "Combined / Balanced",
  ],
  "International Baccalaureate (IB)": [
    "Sciences HL",
    "Mathematics HL",
    "Economics & Business",
    "Arts & Film",
    "Languages & Literature",
    "Interdisciplinary",
  ],
  "A-Levels": [
    "STEM (Math + Sciences)",
    "Economics & Business",
    "Humanities",
    "Law / Politics",
    "Arts & Media",
  ],
  "High School Diploma": [
    "STEM",
    "General Studies",
    "CTE / Vocational",
    "Arts",
    "College-prep",
  ],
  "B.Tech": [
    "Computer Science",
    "Information Technology",
    "AI / Machine Learning",
    "Data Science",
    "Cybersecurity",
    "Mechanical",
    "Civil",
    "Electrical",
    "Electronics & Communication",
    "Chemical",
    "Aerospace",
    "Biotechnology",
  ],
  "B.E.": [
    "Computer Science",
    "Information Technology",
    "Mechanical",
    "Civil",
    "Electrical",
    "ECE",
    "Instrumentation",
    "Production / Manufacturing",
  ],
  "B.Eng": [
    "General",
    "Mechanical",
    "Electrical",
    "Civil",
    "Chemical",
    "Software-focused",
  ],
  "BS": [
    "Computer Science",
    "Physics",
    "Mathematics",
    "Economics",
    "Biology",
    "Statistics",
    "Environmental Science",
  ],
  "B.Sc": [
    "Physics",
    "Chemistry",
    "Mathematics",
    "Biology",
    "Computer Science",
    "Statistics",
    "Biotechnology",
    "Environmental Science",
  ],
  "BA": [
    "Economics",
    "Psychology",
    "Sociology",
    "English",
    "History",
    "Political Science",
    "International Relations",
    "Communications",
  ],
  "BBA": [
    "Finance",
    "Marketing",
    "HR & OB",
    "Operations",
    "International Business",
    "Entrepreneurship",
    "Business Analytics",
  ],
  "B.Com": ["General", "Honours", "Accounting & Finance", "Banking & Insurance", "Taxation"],
  "BCA": [
    "Software Development",
    "Data Science & AI",
    "Cybersecurity",
    "Cloud & DevOps",
    "General IT",
  ],
  "B.Arch": [
    "Architectural Design",
    "Urban & Regional Planning",
    "Sustainable / Green Building",
    "Interior Architecture",
    "Digital Design & BIM",
  ],
  "MBBS": [
    "General Medicine",
    "Surgery (interest)",
    "Community Medicine",
    "Research track",
    "Public Health",
  ],
  "LLB": [
    "Corporate & Commercial",
    "Criminal Law",
    "International Law",
    "IP & Technology",
    "Litigation",
    "Constitutional / Policy",
  ],
  "B.Pharm": [
    "Pharmaceutics",
    "Pharmacology",
    "Clinical Pharmacy",
    "Industrial Pharmacy",
    "Regulatory Affairs",
    "QA / QC",
  ],
  "B.Des": [
    "Product & Industrial",
    "UX / Interaction",
    "Graphic & Visual",
    "Fashion",
    "Interior & Spatial",
  ],
  "Associate's Degree": [
    "STEM transfer",
    "Business",
    "Health Sciences",
    "Liberal Arts",
    "Skilled Trades / Technical",
  ],
  "Diploma (undergraduate)": [
    "Engineering",
    "Information Technology",
    "Business & Management",
    "Design",
    "Healthcare support",
  ],
  "M.Tech / M.E.": [
    "Computer Science / AI",
    "Mechanical",
    "Civil",
    "VLSI",
    "Data Science",
    "Structural Engineering",
    "Thermal / Energy",
  ],
  "MS": [
    "Computer Science",
    "Data Science",
    "Physics",
    "Engineering",
    "Biomedical",
    "Management Science",
  ],
  "M.Eng": ["Mechanical", "Civil", "Electrical", "Chemical", "Software Systems"],
  "MBA": [
    "Finance",
    "Marketing",
    "HR",
    "Operations",
    "Consulting",
    "Entrepreneurship",
    "Product / Tech MBA",
  ],
  "M.Sc": [
    "Physics",
    "Chemistry",
    "Mathematics",
    "Data Science",
    "Biotechnology",
    "Environmental Science",
  ],
  "MA": [
    "Economics",
    "Psychology",
    "Sociology",
    "English",
    "History",
    "International Studies",
  ],
  "MCA": [
    "Software Engineering",
    "AI / Machine Learning",
    "Cloud Computing",
    "Cybersecurity",
    "Data Science",
    "Full-stack Development",
  ],
  "M.Com": ["Accounting", "Finance & Investments", "Taxation", "International Business", "Banking"],
  LLM: [
    "Corporate & M&A",
    "Technology & IP",
    "Human Rights & Public",
    "Tax Law",
    "Dispute Resolution & Arbitration",
  ],
  MD: [
    "General Medicine",
    "Pediatrics",
    "Internal Medicine",
    "Surgery (interest)",
    "Research / Academic",
  ],
  "M.Arch": [
    "Urban Design",
    "Sustainable Architecture",
    "Digital Fabrication",
    "Landscape integration",
    "Research",
  ],
  "M.Pharm": [
    "Pharmaceutics",
    "Pharmacology",
    "Clinical Trials",
    "Regulatory & Quality",
    "Industrial R&D",
  ],
  "PhD (coursework)": [
    "Discipline core",
    "Interdisciplinary",
    "Applied / Industry partnership",
    "Theoretical / Fundamental",
    "Teaching & research",
  ],
  "Graduate Diploma": [
    "Business & Management",
    "Data & Analytics",
    "Policy & Development",
    "Technical / Engineering bridge",
    "Pathway to Masters",
  ],
};

/** When the degree is custom or missing from {@link STREAMS}, still offer useful picks + Other in UI. */
export const GENERIC_STREAM_SUGGESTIONS: string[] = [
  "General",
  "Core / Major track",
  "Applied / Industry",
  "Research",
  "Interdisciplinary",
  "Data & Computing",
  "Design & Creative",
  "Policy & Social impact",
];

/** Streams for admin dropdowns and tooling — never empty for a non-empty degree. */
export function streamsForDegree(degree: string): string[] {
  const key = degree.trim();
  if (!key) return [];
  const list = STREAMS[key];
  if (Array.isArray(list) && list.length > 0) return list;
  return [...GENERIC_STREAM_SUGGESTIONS];
}

/** Landing + admin profile picker (in-school streams; distinct from degree {@link STREAMS}). */
export const INSCHOOL_STREAMS = ['PCM', 'PCMB', 'PCB', 'Commerce', 'Humanities'];

export const PROFILE_TYPES = [
  { id: 'inschool' as const, label: 'In-School' },
  { id: 'bachelors' as const, label: "Bachelor's Student / Fresh Graduate" },
  { id: 'bachelors_exp' as const, label: "Bachelor's + Under 2 Yrs Experience" },
  { id: 'masters' as const, label: "Master's Student / Fresh Graduate" },
  { id: 'masters_exp' as const, label: "Master's + Under 2 Yrs Experience" },
  { id: 'exp2plus' as const, label: 'More Than 2 Years Experience' },
];

export const UG_DEGREES = [
  'B.Tech / B.E.',
  'BBA',
  'B.Com',
  'B.Sc',
  'BA',
  'BCA',
  'B.Arch',
  'MBBS',
  'B.Pharm',
  'LLB',
];

export const MASTERS_DEGREES = [
  'M.Tech / M.E.',
  'MBA',
  'M.Sc',
  'MA',
  'MCA',
  'M.Com',
  'LLM',
  'MD',
  'M.Arch',
];

export const WORK_DOMAINS = [
  'Software',
  'Finance',
  'Consulting',
  'Marketing',
  'Operations',
  'Design',
  'Healthcare',
  'Education',
  'Research',
  'Manufacturing',
];

export const SENIOR_ROLES = [
  'Software Engineering',
  'Data & AI',
  'Product Management',
  'Finance & Banking',
  'Consulting',
  'Marketing',
  'Operations',
  'Design',
  'Research',
  'Entrepreneurship',
];

export const SPECIALISATIONS: Record<string, string[] | null> = {
  'B.Tech / B.E.': [
    'Computer Science',
    'Mechanical',
    'Civil',
    'Electrical',
    'Electronics & Communication',
    'Chemical',
    'Aerospace',
    'Biotechnology',
  ],
  BBA: null,
  'B.Com': ['General', 'Honours', 'Accounting & Finance'],
  'B.Sc': ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science', 'Statistics'],
  BA: ['Economics', 'Psychology', 'Sociology', 'English', 'History', 'Political Science'],
  BCA: null,
  'B.Arch': null,
  MBBS: null,
  'B.Pharm': null,
  LLB: null,
  'M.Tech / M.E.': [
    'Computer Science / AI',
    'Mechanical',
    'Civil',
    'VLSI',
    'Data Science',
  ],
  MBA: ['Finance', 'Marketing', 'HR', 'Operations', 'Consulting', 'Entrepreneurship'],
  'M.Sc': ['Physics', 'Chemistry', 'Mathematics', 'Data Science', 'Biotechnology'],
  MA: ['Economics', 'Psychology', 'Sociology', 'English', 'History'],
  MCA: null,
  'M.Com': null,
  LLM: null,
  MD: null,
  'M.Arch': null,
};

export function profileSpecialisations(degree: string): string[] | null {
  const list = SPECIALISATIONS[degree.trim()];
  if (list === undefined) return null;
  return list;
}
