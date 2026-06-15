# Variable Scoring

## Base Score
- Surgical Name & Duration (Contoh)
  - General Surgery
    - Appendectomy
      - Duration : 120 menit
      - Turnover : 30 menit
    - Cholecystectomy (Lap)
      - Duration : 150 menit
      - Turnover : 30 menit
    - Hernia Repair
      - Duration : 120 menit
      - Turnover : 20 menit
    - Laparotomy
      - Duration : 240 menit
      - Turnover : 45 menit
  - Cardiac Surgery
    - CABG (Bypass Jantung)
      - Duration : 360 menit
      - Turnover : 60 menit
    - Valve Replacement
      - Duration : 300 menit
      - Turnover : 60 menit
  -Neurosurgery
    - Craniotomy
      - Duration : 360 menit
      - Turnover : 60 menit
    - Brain Tumor Removal
      - Duration : 480 menit
      - Turnover : 60 menit
  - Orthopedic
    - Total Knee Replacement
      - Duration : 180 menit
      - Turnover : 30 menit
    - Hip Replacement
      - Duration : 150 menit
      - Turnover : 30 menit
    - Fracture Fixation
      - Duration : 180 menit
      - Turnover : 30 menit
  - Obsetric & Gynecology
    - Cesarean Section
      - Duration : 90 menit
      - Turnover : 20 menit
    - Hysterectomy
      - Duration : 180 menit
      - Turnover : 30 menit
  - Opthalmology
    - Cataract Surgery
      - Duration : 45 menit
      - Turnover : 20 menit
  - Plastic Surgery
    - Skin Graft
      - Duration : 120 menit
      - Turnover : 30 menit
    - Reconstruction
      - Duration : 300 menit
      - Turnover : 60 menit

- Turnover
  - >60 menit     : Skor 1
  - 31 - 60 menit : Skor 2
  - ≤30 menit     : Skor 3

- Duration Score
  - ≤120 menit      : Skor 3
  - 121–240 menit   : Skor 2
  - >240 menit      : Skor 1

- Kompleksitas Operasi
  - General    : Skor 3
  - Moderate   : Skor 2
  - Complex    : Skor 1

- Urgency Level
  - High    : Skor 3
  - Medium  : Skor 2
  - Low     : Skor 1
    
- Multi-disciplinary Surgical Procedures
  - 1 SMF/KSM	: Skor 1
  - 2 SMF/KSM	: Skor 2
  - >2 SMF/KSM	: Skor 3

- Patient Type
  - Adult      : Skor 1
  - Pediatric  : Skor 2
  - Infant     : Skor 2
    
- Patient Class
  - Umum    : Skor 1
  - VIP     : Skor 2
  - Khusus  : Skor 3
    
- Operating Working Hour
  - Monday to Friday (08:00 - 20:00) 
    - Morning Shift        : 08:00 - 14:00 
    - Break Time 1st Stage : 12:00 - 13:00 
    - Afternoon Shift      : 14:00 - 20:00
    - Break Time 2nd Stage : 17:00 - 18:00
  - Saturday (09:00 - 17:00)
    - Morning Shift    : 09:00 - 13:00
    - Break Time       : 12:00 - 13:00 
    - Afternoon Shift  : 13:00 - 17:00
  - Sunday (Off Day)

- Working Hour Fit (Durasi + Turnover = Sisa Waktu Shift)
  - Fit di shift morning tanpa break    : Skor 3
  - Fit tapi kena break/pindah shift    : Skor 2
  - Tidak fit (Overrun)                 : Skor 1
 
## Infection Status
  - Non-infeksius : (Base Score) x 1
  - Infeksius     : (Base Score) x (-1)

## Final Scoring for Operating Room Priority 
  - Final Score = Base Score × Infection Status

## Operating Room Priority
  - Base Score × Infection Status = High/Medium/Low Priority Operating Room
    - High Priority Operating Room     : Skor ≥17
    - Medium Priority Operating Room   : Skor 13 - 16
    - Low Priority Operating Room      : Skor ≤12
