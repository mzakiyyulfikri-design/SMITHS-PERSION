import { getRoomById, getStaffById, getSurgeryById, scheduledSurgeries } from "./mock-data";

export type ActionLogEntry = {
  phase: string;
  step: string;
  start: string;
  end: string;
  note: string;
};

export type HistoricalSurgery = {
  id: string;
  date: string;
  patientId: string;
  patientName: string;
  patientType: string;
  age: number;
  gender: string;
  weight: number;
  bloodType: string;
  urgency: string;
  surgeonId: string;
  assistantSurgeonId: string;
  anesthesiologistId: string;
  scrubNurseId: string;
  circulatingNurseId: string;
  operatorId: string;
  roomId: string;
  surgeryId: string;
  complexity: string;
  preoperativeDiagnosis: string;
  preposeDiagnosis: string;
  notes: string;
  log: ActionLogEntry[];
};

function genLog(baseHour: number, dayOffset: number) {
  const make = (h: number, m: number) => {
    const d = new Date();
    d.setDate(d.getDate() - dayOffset);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  };
  return [
    { phase: "Pre-operative", step: "Persiapan area operasi", start: make(baseHour, 0), end: make(baseHour, 15), note: "Area sterilized, draping completed" },
    { phase: "Pre-operative", step: "Identifikasi pasien", start: make(baseHour, 15), end: make(baseHour, 20), note: "ID confirmed (2-source)" },
    { phase: "Pre-operative", step: "Pemeriksaan penunjang", start: make(baseHour, 20), end: make(baseHour, 30), note: "Pre-op labs reviewed" },
    { phase: "Anesthesia", step: "Anesthesia delivery", start: make(baseHour, 30), end: make(baseHour, 45), note: "GA induced uneventfully" },
    { phase: "Anesthesia", step: "Intubasi / ventilation", start: make(baseHour, 45), end: make(baseHour, 55), note: "ETT #7.5, easy intubation" },
    { phase: "Anesthesia", step: "Vital sign monitoring", start: make(baseHour, 55), end: make(baseHour + 1, 0), note: "Stable throughout" },
    { phase: "Intra-operative", step: "Intra-operative procedure", start: make(baseHour + 1, 0), end: make(baseHour + 3, 0), note: "Procedure uneventful" },
    { phase: "Post-operative", step: "Recovery Room delivery", start: make(baseHour + 3, 0), end: make(baseHour + 3, 30), note: "Transferred to PACU, stable" },
  ];
}

export const historicalSurgeries: HistoricalSurgery[] = [
  {
    id: "h-001",
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    patientId: "P-23045",
    patientName: "Putri Andini",
    patientType: "Adult",
    age: 42,
    gender: "Female",
    weight: 58,
    bloodType: "B+",
    urgency: "Medium",
    surgeonId: "s1",
    assistantSurgeonId: "as1",
    anesthesiologistId: "an1",
    scrubNurseId: "sn1",
    circulatingNurseId: "cn1",
    operatorId: "op1",
    roomId: "or1",
    surgeryId: "cholecystectomy-lap",
    complexity: "Moderate",
    preoperativeDiagnosis: "Symptomatic cholelithiasis",
    preposeDiagnosis: "Cholelithiasis",
    notes: "No complications",
    log: genLog(8, 2),
  },
  {
    id: "h-002",
    date: new Date(Date.now() - 86400000 * 3).toISOString(),
    patientId: "P-23044",
    patientName: "Rifki Maulana",
    patientType: "Adult",
    age: 55,
    gender: "Male",
    weight: 72,
    bloodType: "A+",
    urgency: "High",
    surgeonId: "s2",
    assistantSurgeonId: "as2",
    anesthesiologistId: "an2",
    scrubNurseId: "sn2",
    circulatingNurseId: "cn2",
    operatorId: "op2",
    roomId: "or2",
    surgeryId: "cabg",
    complexity: "Complex",
    preoperativeDiagnosis: "Triple vessel CAD",
    preposeDiagnosis: "Triple vessel CAD",
    notes: "On-pump CABG, weaned without inotropes",
    log: genLog(8, 3),
  },
  {
    id: "h-003",
    date: new Date(Date.now() - 86400000 * 5).toISOString(),
    patientId: "P-23040",
    patientName: "Sinta Wahyuni",
    patientType: "Adult",
    age: 68,
    gender: "Female",
    weight: 60,
    bloodType: "O+",
    urgency: "Low",
    surgeonId: "s4",
    assistantSurgeonId: "as1",
    anesthesiologistId: "an1",
    scrubNurseId: "sn1",
    circulatingNurseId: "cn1",
    operatorId: "op1",
    roomId: "or4",
    surgeryId: "hip-replacement",
    complexity: "Moderate",
    preoperativeDiagnosis: "Osteoarthritis left hip",
    preposeDiagnosis: "Osteoarthritis left hip",
    notes: "Cemented hemiarthroplasty",
    log: genLog(10, 5),
  },
];

export function historyDetail(id: string) {
  return historicalSurgeries.find((h) => h.id === id);
}

export function _ref() {
  // keep imports referenced for tree-shaking awareness
  void getSurgeryById;
  void getStaffById;
  void getRoomById;
  void scheduledSurgeries;
}
