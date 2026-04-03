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

export const STREAMS: Record<string, string[] | null> = {
  "Class 10": null,
  "Class 11/12": ["PCM", "PCB", "PCMB", "Commerce", "Humanities"],
  "GCSE / IGCSE": null,
  "International Baccalaureate (IB)": null,
  "A-Levels": null,
  "High School Diploma": null,
  "B.Tech": [
    "Computer Science",
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
    "Mechanical",
    "Civil",
    "Electrical",
    "ECE",
  ],
  "B.Eng": ["General", "Mechanical", "Electrical", "Civil"],
  "BS": ["Computer Science", "Physics", "Mathematics", "Economics"],
  "B.Sc": [
    "Physics",
    "Chemistry",
    "Mathematics",
    "Biology",
    "Computer Science",
    "Statistics",
  ],
  "BA": [
    "Economics",
    "Psychology",
    "Sociology",
    "English",
    "History",
    "Political Science",
  ],
  "BBA": null,
  "B.Com": ["General", "Honours", "Accounting & Finance"],
  "BCA": null,
  "B.Arch": null,
  "MBBS": null,
  "LLB": null,
  "B.Pharm": null,
  "B.Des": null,
  "Associate's Degree": null,
  "Diploma (undergraduate)": null,
  "M.Tech / M.E.": [
    "Computer Science / AI",
    "Mechanical",
    "Civil",
    "VLSI",
    "Data Science",
  ],
  "MS": ["Computer Science", "Data Science", "Physics", "Engineering"],
  "M.Eng": ["Mechanical", "Civil", "Electrical"],
  "MBA": [
    "Finance",
    "Marketing",
    "HR",
    "Operations",
    "Consulting",
    "Entrepreneurship",
  ],
  "M.Sc": [
    "Physics",
    "Chemistry",
    "Mathematics",
    "Data Science",
    "Biotechnology",
  ],
  "MA": [
    "Economics",
    "Psychology",
    "Sociology",
    "English",
    "History",
  ],
  "MCA": null,
  "M.Com": null,
  LLM: null,
  MD: null,
  "M.Arch": null,
  "M.Pharm": null,
  "PhD (coursework)": null,
  "Graduate Diploma": null,
};
