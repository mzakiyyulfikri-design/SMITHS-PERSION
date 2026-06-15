# PRODUCT REQUIREMENT DOCUMENT (PRD)

## SMITHS – PERSION (Perioperative Anesthesia Workstation)

---

## 1. Overview

### 1.1 Product Name

SMITHS – PERSION

### 1.2 Product Description

SMITHS-PERSION adalah sistem manajemen dan optimasi penjadwalan ruang operasi berbasis scoring yang membantu rumah sakit dalam menentukan prioritas operasi secara otomatis, terukur, dan transparan.

Sistem ini mengintegrasikan:

* Data pasien
* Parameter klinis & operasional
* Resource tenaga medis
* Waktu kerja ruang operasi

Dengan output utama:

* **Prioritas ruang operasi (High / Medium / Low)**
* **Optimized surgery scheduling**
* **Real-time monitoring workflow operasi**

---

## 2. Objectives

### 2.1 Business Objectives

* Mengurangi bottleneck ruang operasi
* Meningkatkan utilisasi OR
* Meminimalisir delay & overrun
* Meningkatkan patient safety & outcome

### 2.2 Product Objectives

* Menghasilkan scoring otomatis berbasis parameter klinis
* Menyediakan sistem scheduling berbasis prioritas
* Monitoring end-to-end proses operasi (pre → intra → post)

---

## 3. Users & Roles

### 3.1 User Types

* Operator
* Surgeon
* Assistant Surgeon
* Anesthesiologist
* Nurse (Scrub & Circulating)
* Admin

---

## 4. Core Features

### 4.1 Authentication

* Login (username & password)
* Error handling (invalid credentials)
* Forgot password

---

### 4.2 Patient & Surgery Input (Application Module)

#### Input Fields:

* Patient Identity (ID, Name, Gender, DOB, Age)
* Physical Data (Height, Weight, Blood Type)
* Patient Type (Adult / Pediatric / Neonate)
* Infection Status (Infectious / Non-infectious)
* Patient Class (Umum / VIP / Khusus)
* Urgency Level (High / Medium / Low)
* Diagnosis (Preoperative & Prepose)
* Surgery Selection (multi-select)
* Complexity Level
* Multi-disciplinary involvement

#### Auto-generated:

* Medical team assignment
* Planned surgery time
* Accumulated scoring

#### Actions:

* Save & Assign
* Cancel

---

### 4.3 Scoring Engine (CORE LOGIC)

#### 4.3.1 Base Score Components

1. **Turnover Score**

* > 60 min → 1
* 31–60 min → 2
* ≤30 min → 3

2. **Duration Score**

* ≤120 min → 3
* 121–240 min → 2
* > 240 min → 1

3. **Complexity**

* General → 3
* Moderate → 2
* Complex → 1

4. **Urgency Level**

* High → 3
* Medium → 2
* Low → 1

5. **Multi-disciplinary**

* 1 SMF → 1
* 2 SMF → 2
* > 2 SMF → 3

6. **Patient Type**

* Adult → 1
* Pediatric / Infant → 2

7. **Patient Class**

* Umum → 1
* VIP → 2
* Khusus → 3

8. **Working Hour Fit**

* Fit (no break) → 3
* Fit (with break) → 2
* Overrun → 1

---

#### 4.3.2 Infection Modifier

* Non-infectious → ×1
* Infectious → ×(-1)

---

#### 4.3.3 Final Formula

Final Score = Base Score × Infection Status

---

#### 4.3.4 Priority Classification

* ≥17 → High Priority
* 13–16 → Medium Priority
* ≤12 → Low Priority

---

### 4.4 Scheduling System

#### Features:

* Sorting (patient, surgeon, urgency, etc.)
* Filter timeline:

  * Today
  * Next Day
  * Weekly / Monthly

#### Views:

1. List View
2. Detail View
3. Timeline View (Gantt Chart)

---

### 4.5 Surgery Timeline (Gantt)

* Visual block per surgery
* Represent:

  * Duration
  * Turnover
  * OR usage
* Clickable for detail view

---

### 4.6 Surgery Execution Module

#### Phases:

1. Pre-operative
2. Anesthesia
3. Intra-operative
4. Post-operative

#### Features:

* Start/End timer
* Notes input
* Real-time tracking

---

### 4.7 Surgical History

* Historical records
* Full audit trail
* Detail per procedure:

  * Timeline
  * Notes
  * Staff involved

---

### 4.8 Configuration Module

#### 4.8.1 User Management

* Add/Edit users
* Role-based access

#### 4.8.2 Operating Room Setup

* OR name
* Assigned surgery list
* Priority mapping

#### 4.8.3 Surgical Menu

* Surgery name
* Duration
* Turnover

#### 4.8.4 Hospital Settings

* Hospital info
* Logo upload
* Working hours configuration

---

## 5. Workflow

1. Input patient & surgery data
2. System calculate scoring
3. System assign priority
4. Scheduler assign OR & time
5. Surgery executed (tracking)
6. Data stored in history

---

## 6. Non-Functional Requirements

### 6.1 Performance

* Real-time scoring (<1 sec)
* Fast timeline rendering

### 6.2 Security

* Role-based access
* Encrypted credentials
* Access code for surgery entry

### 6.3 Reliability

* 99.9% uptime
* Data consistency

### 6.4 Scalability

* Multi-OR support
* Multi-department support

---

## 7. Success Metrics

* OR utilization rate ↑
* Surgery delay ↓
* Overrun cases ↓
* Scheduling accuracy ↑

---

## 8. Future Enhancements

* AI-based prediction (duration & delay)
* Integration HIS / EMR / PACS
* Mobile app for monitoring
* Real-time integration (MONERT)

---

## 9. Conclusion

SMITHS-PERSION berfungsi sebagai **decision support system berbasis scoring** untuk optimalisasi ruang operasi dengan pendekatan terstruktur, terukur, dan real-time.

Sistem ini menjadi fondasi untuk:

* Smart hospital operation
* Data-driven surgical management
* Integrated perioperative ecosystem

---
