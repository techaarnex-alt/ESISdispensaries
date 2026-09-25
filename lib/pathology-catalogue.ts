export type PathologyCatalogueTest = {
  name: string;
  category: string;
  referenceRange: string;
};

// Transcribed from the ESIS pathology report sheet. These are inserted only
// when absent, so a dispensary's locally maintained catalogue is never
// overwritten.
export const PATHOLOGY_CATALOGUE: PathologyCatalogueTest[] = [
  {
    name: 'CBC',
    category: 'Hematology',
    referenceRange: 'Hemoglobin, TLC, RBC differential and platelets',
  },
  { name: 'Hemoglobin', category: 'Hematology', referenceRange: 'g/dL' },
  {
    name: 'Total Leukocyte Count (TLC)',
    category: 'Hematology',
    referenceRange: '4,000-11,000 /cmm',
  },
  {
    name: 'RBC Count',
    category: 'Hematology',
    referenceRange: '4.0-4.5 million/mm3',
  },
  { name: 'Neutrophils', category: 'Hematology', referenceRange: '45-75%' },
  { name: 'Lymphocytes', category: 'Hematology', referenceRange: '25-45%' },
  { name: 'Monocytes', category: 'Hematology', referenceRange: '2-8%' },
  { name: 'Eosinophils', category: 'Hematology', referenceRange: '1-6%' },
  { name: 'Basophils', category: 'Hematology', referenceRange: '0-1%' },
  {
    name: 'Platelet Count',
    category: 'Hematology',
    referenceRange: '1.5-4.5 lakh/mm3',
  },
  { name: 'ESR', category: 'Hematology', referenceRange: '0-20 mm/hr' },
  { name: 'Bleeding Time', category: 'Hematology', referenceRange: '2-7 min' },
  { name: 'Clotting Time', category: 'Hematology', referenceRange: '5-15 min' },

  {
    name: 'Blood Sugar (Fasting)',
    category: 'Biochemistry',
    referenceRange: '70-110 mg/dL',
  },
  {
    name: 'Blood Sugar (Postprandial)',
    category: 'Biochemistry',
    referenceRange: '100-180 mg/dL',
  },
  {
    name: 'Blood Sugar (Random)',
    category: 'Biochemistry',
    referenceRange: '70-140 mg/dL',
  },
  {
    name: 'Serum Calcium',
    category: 'Biochemistry',
    referenceRange: '8.5-10.5 mg/dL',
  },
  { name: 'CRP Test', category: 'Biochemistry', referenceRange: '' },

  {
    name: 'KFT',
    category: 'Kidney Function',
    referenceRange: 'Blood urea, serum creatinine and serum uric acid',
  },
  {
    name: 'Blood Urea',
    category: 'Kidney Function',
    referenceRange: '7-20 mg/dL',
  },
  {
    name: 'Serum Creatinine',
    category: 'Kidney Function',
    referenceRange: '0.7-1.3 mg/dL',
  },
  {
    name: 'Serum Uric Acid',
    category: 'Kidney Function',
    referenceRange: '3.4-7.0 mg/dL',
  },

  {
    name: 'LFT',
    category: 'Liver Function',
    referenceRange:
      'Bilirubin, transaminases, alkaline phosphatase and proteins',
  },
  {
    name: 'Serum Bilirubin (Total)',
    category: 'Liver Function',
    referenceRange: '0.2-1.0 mg/dL',
  },
  {
    name: 'Serum Bilirubin (Direct)',
    category: 'Liver Function',
    referenceRange: '0.0-0.2 mg/dL',
  },
  {
    name: 'Serum Bilirubin (Indirect)',
    category: 'Liver Function',
    referenceRange: '0.2-0.8 mg/dL',
  },
  {
    name: 'SGPT (ALT)',
    category: 'Liver Function',
    referenceRange: '6-40 U/L',
  },
  {
    name: 'SGOT (AST)',
    category: 'Liver Function',
    referenceRange: '8-37 U/L',
  },
  {
    name: 'Serum Alkaline Phosphatase',
    category: 'Liver Function',
    referenceRange: '45-129 U/L',
  },
  {
    name: 'Serum Protein',
    category: 'Liver Function',
    referenceRange: '6.0-8.3 g/dL',
  },
  {
    name: 'Serum Albumin',
    category: 'Liver Function',
    referenceRange: '3.2-4.8 g/dL',
  },
  {
    name: 'Serum Globulin',
    category: 'Liver Function',
    referenceRange: '2.5-3.4 g/dL',
  },
  { name: 'A/G Ratio', category: 'Liver Function', referenceRange: '1.1-2.5' },

  {
    name: 'Lipid Profile',
    category: 'Lipid Profile',
    referenceRange: 'Cholesterol, HDL, LDL, VLDL and triglycerides',
  },
  {
    name: 'Serum Cholesterol',
    category: 'Lipid Profile',
    referenceRange: '<200 mg/dL',
  },
  {
    name: 'HDL Cholesterol',
    category: 'Lipid Profile',
    referenceRange: '40-60 mg/dL',
  },
  {
    name: 'LDL Cholesterol',
    category: 'Lipid Profile',
    referenceRange: '<100 mg/dL',
  },
  {
    name: 'VLDL Cholesterol',
    category: 'Lipid Profile',
    referenceRange: '5-40 mg/dL',
  },
  {
    name: 'Serum Triglycerides',
    category: 'Lipid Profile',
    referenceRange: '<150 mg/dL',
  },

  {
    name: 'MP Antigen Test',
    category: 'Serology & Infectious Disease',
    referenceRange: '',
  },
  {
    name: 'Widal Test',
    category: 'Serology & Infectious Disease',
    referenceRange: '',
  },
  {
    name: 'HIV Card Test',
    category: 'Serology & Infectious Disease',
    referenceRange: '',
  },
  {
    name: 'HBsAg Card Test',
    category: 'Serology & Infectious Disease',
    referenceRange: '',
  },
  {
    name: 'HCV Card Test',
    category: 'Serology & Infectious Disease',
    referenceRange: '',
  },

  {
    name: 'Urine Examination',
    category: 'Urine Examination',
    referenceRange: 'Physical, chemical and microscopic examination',
  },
  {
    name: 'Urine Colour',
    category: 'Urine Examination',
    referenceRange: 'Pale yellow',
  },
  {
    name: 'Urine pH',
    category: 'Urine Examination',
    referenceRange: '5.0-7.5',
  },
  {
    name: 'Urine Specific Gravity',
    category: 'Urine Examination',
    referenceRange: '1.005-1.030',
  },
  { name: 'Urine Sediment', category: 'Urine Examination', referenceRange: '' },
  {
    name: 'Urine Turbidity',
    category: 'Urine Examination',
    referenceRange: '',
  },
  {
    name: 'Urine Protein',
    category: 'Urine Examination',
    referenceRange: 'Nil',
  },
  { name: 'Urine Sugar', category: 'Urine Examination', referenceRange: 'Nil' },
  {
    name: 'Urine Bile Salts',
    category: 'Urine Examination',
    referenceRange: 'Absent',
  },
  {
    name: 'Urine Bile Pigment',
    category: 'Urine Examination',
    referenceRange: 'Nil',
  },
  {
    name: 'Urine Epithelial Cells',
    category: 'Urine Examination',
    referenceRange: '0-5 /HPF',
  },
  {
    name: 'Urine Pus Cells',
    category: 'Urine Examination',
    referenceRange: '0-5 /HPF',
  },
  {
    name: 'Urine RBCs',
    category: 'Urine Examination',
    referenceRange: '0-2 /HPF',
  },
  { name: 'Urine Casts', category: 'Urine Examination', referenceRange: 'Nil' },
  {
    name: 'Urine Crystals',
    category: 'Urine Examination',
    referenceRange: 'Nil',
  },
  {
    name: 'Urine Others',
    category: 'Urine Examination',
    referenceRange: 'NAD',
  },

  {
    name: 'Urine Pregnancy Card Test',
    category: 'Pregnancy Testing',
    referenceRange: '',
  },
];
