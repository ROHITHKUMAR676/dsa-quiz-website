// Reads the department and year of study from a college email like
//   kaviarasi.m.2024.cse@rajalakshmi.edu.in   ->  Computer Science and Engineering, joined 2024
// Labels must match the options in the Department dropdown (ProfileSetup.tsx) exactly.

const DEPARTMENT_BY_CODE: Record<string, string> = {
  aero: "Aeronautical Engineering",
  auto: "Automobile Engineering",
  bme: "Biomedical Engineering",
  civil: "Civil Engineering",
  ce: "Civil Engineering",
  cse: "Computer Science and Engineering",
  cs: "Computer Science and Engineering",
  cys: "CSE(Cyber Security)",
  cybersecurity: "CSE(Cyber Security)",
  csd: "Computer Science and Design",
  eee: "Electrical and Electronics Engineering",
  ece: "Electronics and Communication Engineering",
  mech: "Mechanical Engineering",
  me: "Mechanical Engineering",
  mtrs: "Mechatronics Engineering",
  mct: "Mechatronics Engineering",
  rae: "Robotics and Automation",
  ra: "Robotics and Automation",
  aids: "AI & Data Science",
  ads: "AI & Data Science",
  aiml: "AI & Machine Learning",
  bt: "Biotechnoloy",
  chem: "Chemical Engineering",
  csbs: "Computer Science and Business Systems",
  ft: "Food Technology",
  it: "Information Technology",
};

const YEAR_LABELS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

export interface EmailProfile {
  department?: string;
  year?: string;
}

export function parseCollegeEmail(email: string | null | undefined, now: Date = new Date()): EmailProfile {
  if (!email) return {};
  const local = email.split("@")[0]?.toLowerCase() ?? "";
  const parts = local.split(".");
  const result: EmailProfile = {};

  // joining year: a 4-digit token such as 2024
  const joinToken = parts.find((p) => /^20\d{2}$/.test(p));
  if (joinToken) {
    const joinYear = Number(joinToken);
    // academic year starts around June
    const academicStart = now.getMonth() >= 5 ? now.getFullYear() : now.getFullYear() - 1;
    const yearOfStudy = academicStart - joinYear + 1;
    if (yearOfStudy >= 1 && yearOfStudy <= 4) result.year = YEAR_LABELS[yearOfStudy - 1];
  }

  // department: the part right after the joining year, or any part that matches a known code
  const afterYear = joinToken ? parts[parts.indexOf(joinToken) + 1] : undefined;
  const code = [afterYear, ...parts].find((p) => p && DEPARTMENT_BY_CODE[p]);
  if (code) result.department = DEPARTMENT_BY_CODE[code];

  return result;
}
