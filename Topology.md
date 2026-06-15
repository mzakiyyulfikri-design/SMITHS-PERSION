#Application Flow
                                    

                                                    [Input Data]
                                                          │
                                                          ▼
                                            ┌────────────────────────────┐
                                            │  Persion Application Form  │
                                            └────────────┬───────────────┘
                                                         ▼
                                            ┌────────────────────────────┐
                                            │      Validation Layer      │
                                            └────────────┬───────────────┘
                                                         ▼
                                            ┌────────────────────────────┐
                                            │       Scoring Engine       │
                                            └────────────┬───────────────┘
                                                         ▼
                                            ┌────────────────────────────┐
                                            │   Priority Classification  │
                                            └────────────┬───────────────┘
                                                         ▼
                                            ┌────────────────────────────┐
                                            │      Schedulling Engine    │
                                            └────────────┬───────────────┘
                                                         ▼
                                            ┌────────────────────────────┐
                                            │         Database           │
                                            └────────────┬───────────────┘
                                                         ▼
                                            ┌─────────────────────────────┐
                                            │          Output             │
                                            │ - Dashboard                 │
                                            │ - Surgery Schedule List     │
                                            │ - Gantt Timeline            │
                                            │ - Surgery Excecution Medule │
                                            └─────────────────────────────┘

#System Architecture (Logical)

                                               ┌──────────────────────┐
                                               │   FRONTEND (WEB)     │
                                               │  - Dashboard         │
                                               │  - Input Form        │
                                               │  - Timeline (Gantt)  │
                                               │  - Surgery Action    │
                                               └─────────┬────────────┘
                                                         │ API CALL
                                                         ▼
                                               ┌──────────────────────┐
                                               │     API GATEWAY      │
                                               └─────────┬────────────┘
                                                         │
                                   ┌─────────────────────┼─────────────────────┐
                                   ▼                     ▼                     ▼
                           ┌───────────────┐   ┌──────────────────┐   ┌──────────────────┐
                           │ Auth Service  │   │ Scheduling Core  │   │ User Management  │
                           │ - Login       │   │ - Scoring Engine │   │ - Roles          │
                           │ - Access Code │   │ - Priority Calc  │   │ - Staff Data     │
                           └───────────────┘   │ - Time Fitting   │   └──────────────────┘
                                               │ - OR Assignment  │
                                               └─────────┬────────┘
                                                         ▼
                                               ┌──────────────────────┐
                                               │ Surgery Execution    │
                                               │ - Timer Tracking     │
                                               │ - Workflow Logging   │
                                               └─────────┬────────────┘
                                                         ▼
                                               ┌──────────────────────┐
                                               │     DATABASE         │
                                               │ - Patient            │
                                               │ - Surgery            │
                                               │ - Schedule           │
                                               │ - Scoring            │
                                               │ - Logs               │
                                               └──────────────────────┘


#Scoring Engine (Core)

                                                    [Input Data]
                                                          │
                                                          ▼
                                            ┌────────────────────────────┐
                                            │   Base Score Calculator    │
                                            │                            │
                                            │ - Duration Score           │
                                            │ - Turnover Score           │
                                            │ - Complexity               │
                                            │ - Urgency                  │
                                            │ - Multi-disciplinary       │
                                            │ - Patient Type             │
                                            │ - Patient Class            │
                                            │ - Working Hour Fit         │
                                            └────────────┬───────────────┘
                                                         ▼
                                                [Base Score Total]
                                                         ▼
                                            ┌────────────────────────────┐
                                            │ Infection Modifier         │
                                            │ - Infectious (-1)          │
                                            │ - Non-infectious (+1)      │
                                            └────────────┬───────────────┘
                                                         ▼
                                                  [Final Score]
                                                         ▼
                                            ┌────────────────────────────┐
                                            │ Priority Classifier        │
                                            │ - High ≥17                 │
                                            │ - Medium 13–16             │
                                            │ - Low ≤12                  │
                                            └────────────────────────────┘


# Scheduling Engine

                                          [Final Score + Duration + Turnover]
                                                          │
                                                          ▼
                                               ┌───────────────────────┐
                                               │ Shift Validator       │
                                               │ - Morning Fit         │
                                               │ - Break Conflict      │
                                               │ - Overrun Detection   │
                                               └─────────┬─────────────┘
                                                         ▼
                                               ┌───────────────────────┐
                                               │ OR Allocation Engine  │
                                               │ - Priority-based      │
                                               │ - Resource matching   │
                                               └─────────┬─────────────┘
                                                         ▼
                                               ┌───────────────────────┐
                                               │ Timeline Generator    │
                                               │ (Gantt Chart Data)    │
                                               └───────────────────────┘


   
