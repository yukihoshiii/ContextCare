import { patientSchema, type Patient } from './schema';
export const patients: Patient[] = [
  { id: 'P001', name: 'Emma Korhonen', initials: 'EK', age: 64, visitReason: 'Persistent dizziness', appointment: '09:30 · Follow-up', records: [
    { id: 'EK-01', date: '2026-06-18', type: 'visit', title: 'Chronic condition review', author: 'Dr. A. Niemi', text: 'Hypertension and type 2 diabetes documented. Medication list: metformin 500 mg twice daily and amlodipine 5 mg daily.' },
    { id: 'EK-02', date: '2026-09-12', type: 'medication', title: 'Antihypertensive medication adjusted', author: 'Dr. A. Niemi', text: 'Amlodipine increased from 5 mg to 10 mg daily. Follow-up blood pressure readings requested.' },
    { id: 'EK-03', date: '2026-09-20', type: 'visit', title: 'Dizziness reported', author: 'Nurse S. Laine', text: 'Patient reports intermittent dizziness when standing. Exact symptom onset was not recorded. No home blood pressure readings available at this contact.' },
    { id: 'EK-04', date: '2026-09-24', type: 'social', title: 'Home support check-in', author: 'Social worker M. Aalto', text: 'Patient lives alone. Daughter visits weekly. Patient reports difficulty arranging transport to appointments. A transport support assessment has been requested.' },
    { id: 'EK-05', date: '2026-10-08', type: 'visit', title: 'Follow-up appointment booked', author: 'Nurse S. Laine', text: 'Follow-up booked for persistent dizziness. Patient asked to bring an up-to-date medication list and any home measurements.' },
  ] },
  { id: 'P002', name: 'Matti Lahtinen', initials: 'ML', age: 72, visitReason: 'Reduced mobility after discharge', appointment: '10:15 · Care review', records: [
    { id: 'ML-01', date: '2026-08-28', type: 'visit', title: 'Discharge summary', author: 'Dr. E. Salmi', text: 'Patient discharged following hip surgery. Uses a walking aid. Physiotherapy follow-up recommended.' },
    { id: 'ML-02', date: '2026-09-15', type: 'measurement', title: 'Home care observation', author: 'Nurse T. Virtanen', text: 'Patient reports difficulty climbing stairs. Pain reported as 4 out of 10 during movement. Attendance at physiotherapy has not been confirmed.' },
    { id: 'ML-03', date: '2026-10-02', type: 'social', title: 'Home accessibility assessment', author: 'Social worker M. Aalto', text: 'Patient lives with spouse in a second-floor apartment without a lift. Home support assessment is pending.' },
  ] },
  { id: 'P003', name: 'Anna Mäkinen', initials: 'AM', age: 38, visitReason: 'Fatigue and care coordination', appointment: '11:00 · First consultation', records: [
    { id: 'AM-01', date: '2026-09-02', type: 'visit', title: 'Fatigue consultation', author: 'Dr. L. Koski', text: 'Patient reports fatigue over the past month. Follow-up laboratory tests requested. Results are not present in the available records.' },
    { id: 'AM-02', date: '2026-09-18', type: 'social', title: 'Family support discussion', author: 'Social worker J. Lehto', text: 'Patient is caring for two children and an elderly parent. Patient reports limited time for rest. Family support options were discussed; follow-up is pending.' },
    { id: 'AM-03', date: '2026-10-05', type: 'visit', title: 'Care coordination call', author: 'Nurse P. Ranta', text: 'Patient requests a coordinated follow-up for ongoing fatigue. Current medication list was not documented during the call.' },
  ] },
].map(p => patientSchema.parse(p));
