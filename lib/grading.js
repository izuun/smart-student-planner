// Grade point tables for common Malaysian grading systems. These are the
// standard scales used across most polytechnics and public universities,
// but institutions vary slightly - the "Custom" system lets a student
// adjust individual grade points if their own campus differs.
export const GRADING_SYSTEMS = {
  politeknik: {
    label: "Politeknik Malaysia (JPPKK)",
    grades: {
      "A+": 4.0,
      A: 4.0,
      "A-": 3.67,
      "B+": 3.33,
      B: 3.0,
      "B-": 2.67,
      "C+": 2.33,
      C: 2.0,
      D: 1.0,
      F: 0.0,
    },
  },
  university: {
    label: "Public University Standard (4.00 Scale)",
    grades: {
      "A+": 4.0,
      A: 4.0,
      "A-": 3.67,
      "B+": 3.33,
      B: 3.0,
      "B-": 2.67,
      "C+": 2.33,
      C: 2.0,
      "C-": 1.67,
      "D+": 1.33,
      D: 1.0,
      F: 0.0,
    },
  },
};

export function getGradeOptions(systemKey) {
  const system = GRADING_SYSTEMS[systemKey] || GRADING_SYSTEMS.politeknik;
  return Object.keys(system.grades);
}

export function getGradePoint(systemKey, grade, customPoints) {
  if (systemKey === "custom" && customPoints && grade in customPoints) {
    return customPoints[grade];
  }
  const system = GRADING_SYSTEMS[systemKey] || GRADING_SYSTEMS.politeknik;
  return system.grades[grade] ?? 0;
}
