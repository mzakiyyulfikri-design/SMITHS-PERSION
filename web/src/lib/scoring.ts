export type Complexity = "General" | "Moderate" | "Complex";
export type Urgency = "High" | "Medium" | "Low";
export type PatientType = "Adult" | "Pediatric" | "Neonate";
export type PatientClass = "Umum" | "VIP" | "Khusus";
export type InfectionStatus = "Infectious" | "Non-infectious";
export type WorkingHourFit = "FitMorning" | "FitWithBreak" | "Overrun";
export type MultiDisciplinary = "1" | "2" | ">2";

export type Priority = "High" | "Medium" | "Low";

export type ScoringInput = {
  durationMinutes: number;
  turnoverMinutes: number;
  complexity: Complexity;
  urgency: Urgency;
  multiDisciplinary: MultiDisciplinary;
  patientType: PatientType;
  patientClass: PatientClass;
  workingHourFit: WorkingHourFit;
  infection: InfectionStatus;
};

export type ScoreBreakdown = {
  turnoverScore: number;
  durationScore: number;
  complexityScore: number;
  urgencyScore: number;
  multiDisciplinaryScore: number;
  patientTypeScore: number;
  patientClassScore: number;
  workingHourFitScore: number;
  baseScore: number;
  infectionModifier: 1 | -1;
  finalScore: number;
  priority: Priority;
};

export function scoreTurnover(min: number): number {
  if (min > 60) return 1;
  if (min >= 31) return 2;
  return 3;
}

export function scoreDuration(min: number): number {
  if (min <= 120) return 3;
  if (min <= 240) return 2;
  return 1;
}

export function scoreComplexity(c: Complexity): number {
  return c === "General" ? 3 : c === "Moderate" ? 2 : 1;
}

export function scoreUrgency(u: Urgency): number {
  return u === "High" ? 3 : u === "Medium" ? 2 : 1;
}

export function scoreMultiDisciplinary(m: MultiDisciplinary): number {
  return m === "1" ? 1 : m === "2" ? 2 : 3;
}

export function scorePatientType(p: PatientType): number {
  // Pediatric & Neonate (Infant) = 2, Adult = 1
  return p === "Adult" ? 1 : 2;
}

export function scorePatientClass(c: PatientClass): number {
  return c === "Umum" ? 1 : c === "VIP" ? 2 : 3;
}

export function scoreWorkingHourFit(f: WorkingHourFit): number {
  return f === "FitMorning" ? 3 : f === "FitWithBreak" ? 2 : 1;
}

export function classifyPriority(finalScore: number): Priority {
  if (finalScore >= 17) return "High";
  if (finalScore >= 13) return "Medium";
  return "Low";
}

export function computeScore(input: ScoringInput): ScoreBreakdown {
  const turnoverScore = scoreTurnover(input.turnoverMinutes);
  const durationScore = scoreDuration(input.durationMinutes);
  const complexityScore = scoreComplexity(input.complexity);
  const urgencyScore = scoreUrgency(input.urgency);
  const multiDisciplinaryScore = scoreMultiDisciplinary(input.multiDisciplinary);
  const patientTypeScore = scorePatientType(input.patientType);
  const patientClassScore = scorePatientClass(input.patientClass);
  const workingHourFitScore = scoreWorkingHourFit(input.workingHourFit);

  const baseScore =
    turnoverScore +
    durationScore +
    complexityScore +
    urgencyScore +
    multiDisciplinaryScore +
    patientTypeScore +
    patientClassScore +
    workingHourFitScore;

  const infectionModifier: 1 | -1 =
    input.infection === "Non-infectious" ? 1 : -1;
  const finalScore = baseScore * infectionModifier;
  const priority = classifyPriority(finalScore);

  return {
    turnoverScore,
    durationScore,
    complexityScore,
    urgencyScore,
    multiDisciplinaryScore,
    patientTypeScore,
    patientClassScore,
    workingHourFitScore,
    baseScore,
    infectionModifier,
    finalScore,
    priority,
  };
}

export const priorityLabel = (p: Priority) =>
  p === "High" ? "High Priority" : p === "Medium" ? "Medium Priority" : "Low Priority";

export const priorityBadgeClass = (p: Priority) =>
  p === "High" ? "badge badge-high" : p === "Medium" ? "badge badge-medium" : "badge badge-low";
