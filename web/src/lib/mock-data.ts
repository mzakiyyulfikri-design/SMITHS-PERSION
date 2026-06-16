import type {
  Complexity,
  InfectionStatus,
  MultiDisciplinary,
  PatientClass,
  PatientType,
  Priority,
  Urgency,
  WorkingHourFit,
} from "./scoring";

export type SurgicalMenuItem = {
  id: string;
  category: string;
  name: string;
  durationMin: number;
  turnoverMin: number;
};

export const surgicalMenu: SurgicalMenuItem[] = [
  { id: "appendectomy", category: "General Surgery", name: "Appendectomy", durationMin: 120, turnoverMin: 30 },
  { id: "cholecystectomy-lap", category: "General Surgery", name: "Cholecystectomy (Lap)", durationMin: 150, turnoverMin: 30 },
  { id: "hernia-repair", category: "General Surgery", name: "Hernia Repair", durationMin: 120, turnoverMin: 20 },
  { id: "laparotomy", category: "General Surgery", name: "Laparotomy", durationMin: 240, turnoverMin: 45 },
  { id: "cabg", category: "Cardiac Surgery", name: "CABG (Bypass Jantung)", durationMin: 360, turnoverMin: 60 },
  { id: "valve-replacement", category: "Cardiac Surgery", name: "Valve Replacement", durationMin: 300, turnoverMin: 60 },
  { id: "craniotomy", category: "Neurosurgery", name: "Craniotomy", durationMin: 360, turnoverMin: 60 },
  { id: "brain-tumor", category: "Neurosurgery", name: "Brain Tumor Removal", durationMin: 480, turnoverMin: 60 },
  { id: "tkr", category: "Orthopedic", name: "Total Knee Replacement", durationMin: 180, turnoverMin: 30 },
  { id: "hip-replacement", category: "Orthopedic", name: "Hip Replacement", durationMin: 150, turnoverMin: 30 },
  { id: "fracture-fixation", category: "Orthopedic", name: "Fracture Fixation", durationMin: 180, turnoverMin: 30 },
  { id: "cesarean", category: "Obstetric & Gynecology", name: "Cesarean Section", durationMin: 90, turnoverMin: 20 },
  { id: "hysterectomy", category: "Obstetric & Gynecology", name: "Hysterectomy", durationMin: 180, turnoverMin: 30 },
  { id: "cataract", category: "Ophthalmology", name: "Cataract Surgery", durationMin: 45, turnoverMin: 20 },
  { id: "skin-graft", category: "Plastic Surgery", name: "Skin Graft", durationMin: 120, turnoverMin: 30 },
  { id: "reconstruction", category: "Plastic Surgery", name: "Reconstruction", durationMin: 300, turnoverMin: 60 },
];

export type Staff = {
  id: string;
  name: string;
  role:
    | "Surgeon"
    | "AssistantSurgeon"
    | "Anesthesiologist"
    | "ScrubNurse"
    | "CirculatingNurse"
    | "Operator"
    | "Admin";
  specialist?: string;
  nipStr?: string;
  preferredDay?: string;
  surgeryAvailability?: string[];
};

export const staff: Staff[] = [
  { id: "s1", name: "dr. Aditya Wirawan, Sp.B", role: "Surgeon", specialist: "General Surgery", nipStr: "STR-001245" },
  { id: "s2", name: "dr. Bunga Saraswati, Sp.BTKV", role: "Surgeon", specialist: "Cardiac Surgery", nipStr: "STR-001789" },
  { id: "s3", name: "dr. Candra Pratama, Sp.BS", role: "Surgeon", specialist: "Neurosurgery", nipStr: "STR-002012" },
  { id: "s4", name: "dr. Damar Mahendra, Sp.OT", role: "Surgeon", specialist: "Orthopedic", nipStr: "STR-002340" },
  { id: "s5", name: "dr. Endah Pratiwi, Sp.OG", role: "Surgeon", specialist: "Obstetric & Gynecology", nipStr: "STR-002650" },
  { id: "as1", name: "dr. Farhan Rizki", role: "AssistantSurgeon", specialist: "General", nipStr: "STR-003100" },
  { id: "as2", name: "dr. Gita Larasati", role: "AssistantSurgeon", specialist: "Cardiac", nipStr: "STR-003290" },
  { id: "an1", name: "dr. Hilman Kurniawan, Sp.An", role: "Anesthesiologist", specialist: "Anesthesia", nipStr: "STR-004001" },
  { id: "an2", name: "dr. Indira Sukmawati, Sp.An", role: "Anesthesiologist", specialist: "Anesthesia", nipStr: "STR-004210" },
  { id: "sn1", name: "Ns. Joko Suryanto", role: "ScrubNurse", nipStr: "NIP-100123" },
  { id: "sn2", name: "Ns. Kartika Dewi", role: "ScrubNurse", nipStr: "NIP-100145" },
  { id: "cn1", name: "Ns. Laras Wulandari", role: "CirculatingNurse", nipStr: "NIP-100256" },
  { id: "cn2", name: "Ns. Mahesa Aji", role: "CirculatingNurse", nipStr: "NIP-100278" },
  { id: "op1", name: "Nurul Hidayah", role: "Operator", nipStr: "NIP-200015" },
  { id: "op2", name: "Oktavia Sari", role: "Operator", nipStr: "NIP-200042" },
];

export type OperatingRoom = {
  id: string;
  name: string;
  allowedSurgeries: string[];
  priority: Priority;
};

export const operatingRooms: OperatingRoom[] = [
  { id: "or1", name: "OR-1 General", allowedSurgeries: ["appendectomy", "hernia-repair", "laparotomy", "cholecystectomy-lap"], priority: "High" },
  { id: "or2", name: "OR-2 Cardiac", allowedSurgeries: ["cabg", "valve-replacement"], priority: "High" },
  { id: "or3", name: "OR-3 Neuro", allowedSurgeries: ["craniotomy", "brain-tumor"], priority: "High" },
  { id: "or4", name: "OR-4 Ortho", allowedSurgeries: ["tkr", "hip-replacement", "fracture-fixation"], priority: "Medium" },
  { id: "or5", name: "OR-5 OBGYN", allowedSurgeries: ["cesarean", "hysterectomy"], priority: "Medium" },
  { id: "or6", name: "OR-6 Day Care", allowedSurgeries: ["cataract", "skin-graft"], priority: "Low" },
];

export type ScheduledSurgery = {
  id: string;
  patientId: string;
  patientName: string;
  gender: "Male" | "Female";
  dob: string;
  age: number;
  height: number;
  weight: number;
  bloodType: string;
  patientType: PatientType;
  infection: InfectionStatus;
  patientClass: PatientClass;
  urgency: Urgency;
  preoperativeDiagnosis: string;
  preposeDiagnosis: string;
  surgeryIds: string[];
  complexity: Complexity;
  multiDisciplinary: MultiDisciplinary;
  workingHourFit: WorkingHourFit;
  surgeonId: string;
  assistantSurgeonId: string;
  anesthesiologistId: string;
  scrubNurseId: string;
  circulatingNurseId: string;
  operatorId: string;
  roomId: string;
  plannedStart: string; // ISO
  notes: string;
  accessCode: string;
  finalScore: number;
  priority: Priority;
  completedAt?: number;
};

const today = new Date();
const iso = (h: number, m = 0, dayOffset = 0) => {
  const d = new Date(today);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

export const scheduledSurgeries: ScheduledSurgery[] = [
  {
    id: "sg-001",
    patientId: "P-24001",
    patientName: "Ahmad Surya",
    gender: "Male",
    dob: "1972-03-14",
    age: 53,
    height: 170,
    weight: 75,
    bloodType: "O+",
    patientType: "Adult",
    infection: "Non-infectious",
    patientClass: "VIP",
    urgency: "High",
    preoperativeDiagnosis: "Coronary artery disease, triple vessel",
    preposeDiagnosis: "Coronary artery disease, triple vessel",
    surgeryIds: ["cabg"],
    complexity: "Complex",
    multiDisciplinary: "2",
    workingHourFit: "FitWithBreak",
    surgeonId: "s2",
    assistantSurgeonId: "as2",
    anesthesiologistId: "an1",
    scrubNurseId: "sn1",
    circulatingNurseId: "cn1",
    operatorId: "op1",
    roomId: "or2",
    plannedStart: iso(8, 0, 0),
    notes: "Priority case, pre-op echo done",
    accessCode: "8421",
    finalScore: 18,
    priority: "High",
  },
  {
    id: "sg-002",
    patientId: "P-24002",
    patientName: "Siti Rahmawati",
    gender: "Female",
    dob: "1988-07-22",
    age: 37,
    height: 158,
    weight: 62,
    bloodType: "A+",
    patientType: "Adult",
    infection: "Non-infectious",
    patientClass: "Umum",
    urgency: "Medium",
    preoperativeDiagnosis: "Symptomatic gallstones",
    preposeDiagnosis: "Cholelithiasis",
    surgeryIds: ["cholecystectomy-lap"],
    complexity: "Moderate",
    multiDisciplinary: "1",
    workingHourFit: "FitMorning",
    surgeonId: "s1",
    assistantSurgeonId: "as1",
    anesthesiologistId: "an2",
    scrubNurseId: "sn2",
    circulatingNurseId: "cn2",
    operatorId: "op2",
    roomId: "or1",
    plannedStart: iso(9, 30, 0),
    notes: "",
    accessCode: "5170",
    finalScore: 15,
    priority: "Medium",
  },
  {
    id: "sg-003",
    patientId: "P-24003",
    patientName: "Bagas Permana",
    gender: "Male",
    dob: "2018-11-05",
    age: 7,
    height: 122,
    weight: 24,
    bloodType: "B+",
    patientType: "Pediatric",
    infection: "Non-infectious",
    patientClass: "Khusus",
    urgency: "High",
    preoperativeDiagnosis: "Acute appendicitis",
    preposeDiagnosis: "Acute appendicitis",
    surgeryIds: ["appendectomy"],
    complexity: "General",
    multiDisciplinary: "1",
    workingHourFit: "FitMorning",
    surgeonId: "s1",
    assistantSurgeonId: "as1",
    anesthesiologistId: "an1",
    scrubNurseId: "sn1",
    circulatingNurseId: "cn1",
    operatorId: "op1",
    roomId: "or1",
    plannedStart: iso(12, 30, 0),
    notes: "Emergency pediatric case",
    accessCode: "9304",
    finalScore: 19,
    priority: "High",
  },
  {
    id: "sg-004",
    patientId: "P-24004",
    patientName: "Diah Anggraini",
    gender: "Female",
    dob: "1965-02-18",
    age: 60,
    height: 160,
    weight: 70,
    bloodType: "AB+",
    patientType: "Adult",
    infection: "Non-infectious",
    patientClass: "VIP",
    urgency: "Medium",
    preoperativeDiagnosis: "Osteoarthritis right knee",
    preposeDiagnosis: "Osteoarthritis right knee",
    surgeryIds: ["tkr"],
    complexity: "Moderate",
    multiDisciplinary: "1",
    workingHourFit: "FitWithBreak",
    surgeonId: "s4",
    assistantSurgeonId: "as1",
    anesthesiologistId: "an2",
    scrubNurseId: "sn2",
    circulatingNurseId: "cn2",
    operatorId: "op2",
    roomId: "or4",
    plannedStart: iso(11, 0, 0),
    notes: "Pre-op physiotherapy completed",
    accessCode: "3782",
    finalScore: 14,
    priority: "Medium",
  },
  {
    id: "sg-005",
    patientId: "P-24005",
    patientName: "Eko Nugroho",
    gender: "Male",
    dob: "1980-09-12",
    age: 45,
    height: 175,
    weight: 80,
    bloodType: "O+",
    patientType: "Adult",
    infection: "Infectious",
    patientClass: "Umum",
    urgency: "Low",
    preoperativeDiagnosis: "Inguinal hernia",
    preposeDiagnosis: "Inguinal hernia",
    surgeryIds: ["hernia-repair"],
    complexity: "General",
    multiDisciplinary: "1",
    workingHourFit: "FitMorning",
    surgeonId: "s1",
    assistantSurgeonId: "as1",
    anesthesiologistId: "an1",
    scrubNurseId: "sn1",
    circulatingNurseId: "cn1",
    operatorId: "op1",
    roomId: "or1",
    plannedStart: iso(14, 30, 0),
    notes: "Infection precaution: gown, mask, hepatitis screening",
    accessCode: "2109",
    finalScore: -14,
    priority: "Low",
  },
  {
    id: "sg-006",
    patientId: "P-24006",
    patientName: "Fitri Anjani",
    gender: "Female",
    dob: "1995-04-30",
    age: 30,
    height: 162,
    weight: 65,
    bloodType: "A-",
    patientType: "Adult",
    infection: "Non-infectious",
    patientClass: "VIP",
    urgency: "Medium",
    preoperativeDiagnosis: "Term pregnancy, planned cesarean",
    preposeDiagnosis: "Term pregnancy, planned cesarean",
    surgeryIds: ["cesarean"],
    complexity: "General",
    multiDisciplinary: "1",
    workingHourFit: "FitMorning",
    surgeonId: "s5",
    assistantSurgeonId: "as1",
    anesthesiologistId: "an2",
    scrubNurseId: "sn2",
    circulatingNurseId: "cn2",
    operatorId: "op2",
    roomId: "or5",
    plannedStart: iso(8, 30, 1),
    notes: "Planned next-day cesarean",
    accessCode: "6517",
    finalScore: 16,
    priority: "Medium",
  },
];

export type HospitalSettings = {
  name: string;
  address: string;
  logo: string;
  workingHours: {
    weekdayMorningStart: string;
    weekdayMorningBreak: string;
    weekdayAfternoonStart: string;
    weekdayAfternoonBreak: string;
    weekdayEnd: string;
    saturdayStart: string;
    saturdayBreak: string;
    saturdayEnd: string;
  };
};

export const hospitalSettings: HospitalSettings = {
  name: "RSU Multi Guna",
  address: "Jl. Cipta Sentosa No. 7, Jakarta",
  logo: "",
  workingHours: {
    weekdayMorningStart: "08:00",
    weekdayMorningBreak: "12:00",
    weekdayAfternoonStart: "14:00",
    weekdayAfternoonBreak: "17:00",
    weekdayEnd: "20:00",
    saturdayStart: "09:00",
    saturdayBreak: "12:00",
    saturdayEnd: "17:00",
  },
};

export function getStaffById(id: string) {
  return staff.find((s) => s.id === id);
}
export function getSurgeryById(id: string) {
  return surgicalMenu.find((s) => s.id === id);
}
export function getRoomById(id: string) {
  return operatingRooms.find((r) => r.id === id);
}
