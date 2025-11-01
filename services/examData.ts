// This service stores the official source material information for each exam.
// In a real application, this might be fetched from a database or a CMS.

interface ExamData {
  effectivitySheet: string;
  bodyOfKnowledge: string;
}

// Key: The exact exam name from HomePage.tsx
export const examSourceData: Record<string, ExamData> = {
  "API 653 - Aboveground Storage Tank Inspector": {
    effectivitySheet: `
      **API Standard 653:** Tank Inspection, Repair, Alteration, and Reconstruction, **5th Edition, November 2014**, with **Addendum 1 (April 2018)** and **Addendum 2 (May 2020)**.
      **API Recommended Practice 571:** Damage Mechanisms Affecting Fixed Equipment in the Refining Industry, **3rd Edition, March 2020**.
      **API Recommended Practice 575:** Inspection of Atmospheric and Low-Pressure Storage Tanks, **4th Edition, May 2020**.
      **API Recommended Practice 577:** Welding Inspection and Metallurgy, **3rd Edition, October 2020**.
      **ASME Boiler and Pressure Vessel Code, Section V:** Nondestructive Examination, **2021 Edition**.
      **ASME Boiler and Pressure Vessel Code, Section IX:** Welding, Brazing, and Fusing Qualifications, **2021 Edition**.
    `,
    bodyOfKnowledge: `
      The exam questions will cover the following domains:
      1.  **Scope and General Application of API 653:** Tank inspection, repair, alteration, and reconstruction.
      2.  **Damage Mechanisms:** Corrosion, cracking, and metallurgical issues from API 571.
      3.  **Inspection and Testing Practices:** NDE procedures from ASME V, internal/external inspection from API 653 and API 575.
      4.  **Repairs and Alterations:** Welding qualifications from ASME IX, specific repair procedures from API 653.
      5.  **Rerating and Hydrostatic Testing:** Calculations and procedures for tank integrity assessment.
      6.  **Safety Precautions:** Confined space entry, tank cleaning, and hot work.
    `
  },
  "API 570 - Piping Inspector": {
     effectivitySheet: `API 570, 5th Ed.; API 571, 3rd Ed.; API 574, 4th Ed.; API 577, 3rd Ed.; API 578, 4th Ed.; ASME V, 2021 Ed.; ASME IX, 2021 Ed.; ASME B16.5, 2020 Ed.; ASME B31.3, 2020 Ed.`,
     bodyOfKnowledge: `Inspection, repair, alteration, and rerating of in-service piping systems. Damage mechanisms, NDE, welding, and code calculations.`
  },
   "API 510 - Pressure Vessel Inspector": {
     effectivitySheet: `
**API 510, Pressure Vessel Inspection Code:** In-service Inspection, Rating, Repair, and Alteration, 11th Edition, October 2022, Errata 1 (March 2023)
**API Recommended Practice 571, Damage Mechanisms Affecting Fixed Equipment in the Refining Industry,** 3rd edition, March 2020 (Sections: 2, 3.3, 3.8, 3.9, 3.11, 3.14, 3.15, 3.17, 3.22, 3.27, 3.35, 3.36, 3.37, 3.46, 3.61, 3.67)
**API Recommended Practice 572, Inspection Practices for Pressure Vessels,** 5th Edition, November 2023.
**API Recommended Practice 576, Inspection of Pressure-relieving Devices,** 5th Edition, September 2024
**API Recommended Practice 577, Welding Processes, Inspection, and Metallurgy,** 3rd Edition, October 2020.
**API Recommended Practice 578, Material Verification Program for New and Existing Assets,** 4th edition, February 2023
**ASME Boiler and Pressure Vessel Code, 2023 Edition:**
  - Section V, Nondestructive Examination, Articles 1, 2, 6, 7 and 23 (Section SE-797 only)
  - Section VIII, Rules for Construction of Pressure Vessels, Division 1; Introduction (U), UG, UW, UCS, Appendices 1-4, 6, 8, and 12
  - Section IX, Qualification Standard for Welding... (Welding only)
**ASME PCC-2, Repair of Pressure Equipment and Piping, 2022:**
  - Articles: 101, 201, 202, 209, 210, 211, 212, 215, 216, 304, 305, 312, 501, 502
     `,
     bodyOfKnowledge: `
API Authorized Pressure Vessel Inspectors must have a broad knowledge base relating to maintenance, inspection, repair, and alteration of pressure vessels.
Questions may be taken from anywhere within each document in this BOK, unless specifically excluded.

I. THICKNESS MEASUREMENTS, INSPECTION INTERVALS AND VESSEL INTEGRITY
A. Code calculation questions will be oriented toward existing pressure vessels, not new pressure vessels.
1. CORROSION RATES AND INSPECTION INTERVALS: Calculate Metal Loss (API 510, 7.4), Corrosion Rates (API 510, 7.1), Remaining Corrosion Allowance (API 510, 7.1), Remaining Service Life (API 510, 7.2), Inspection Interval (API 510, Section 6).
2. JOINT EFFICIENCIES: Determine joint efficiency "E" from Weld Joint Categories (ASME VIII, UW-3), type of radiography (UW-11), Table UW-12, seamless heads (UW-12(d)), and welded pipe (UW-12(e)).
3. STATIC HEAD: Calculate static head pressure on any vessel part (0.433 psi/ft), and total pressure (MAWP + static head).
4. INTERNAL PRESSURE: Determine required thickness or MAWP for cylindrical shells (UG-27(c)(1)) and heads (ellipsoidal, hemispherical) (UG-32).
5. EXTERNAL PRESSURE: Understand rules for design of shells and tubes under external pressure (UG-28). No calculations required.
6. PRESSURE TESTING: Calculate test pressure compensating for temperature (UG-99, UG-100), understand hydrotest (UG-99) and pneumatic test (UG-100) procedures and precautions.
7. IMPACT TESTING: Understand impact testing requirements and procedure (UG-84), and determine MDMT exemptions (UG-20(f), UCS-66, UCS-68(c)).
8. WELD SIZE FOR ATTACHMENT WELDS AT OPENINGS: Determine if weld sizes meet Code requirements (UW-16).
9. NOZZLE REINFORCEMENT: Understand key concepts of reinforcement.

II. WELDING PROCEDURE AND QUALIFICATION EVALUATION (ASME IX)
A. WELD PROCEDURE REVIEW (WPS, PQR, WPQ): Determine compliance with ASME IX and API 510, check essential and non-essential variables, verify mechanical tests, and confirm welder qualification. Limited to SMAW, GTAW, GMAW, SAW with P-No. 1, 3, 4, 5, 8 base metals.
B. GENERAL WELDING REQUIREMENTS (ASME VIII, Div. 1 & API 510): Rules for welding in Parts UW and UCS (joints, weld sizes, restrictions, reinforcement, inspection, heat treatment). API 510 rules take precedence.
C. API RP 577: Be familiar with all requirements.

III. NONDESTRUCTIVE EXAMINATION
A. ASME Section V:
1. Article 1, General Requirements: Scope, responsibilities, calibration, definitions, records.
2. Article 2, Radiographic Examination: Required marking, IQI selection/placement, density, backscatter, location markers, records.
3. Article 6, Liquid Penetrant Examination: Procedures, contaminants, techniques, examination, interpretation, documentation.
4. Article 7, Magnetic Particle Examination (Yoke and Prod only): Procedures, techniques, calibration, examination, interpretation, documentation.
5. Article 23, SE-797: Ultrasonic thickness measurement procedures.
B. ASME VIII & API 510 NDE Requirements: Understand general rules for NDE in both documents.

IV. PRACTICAL KNOWLEDGE - SPECIFIC
A. API 510: All sections applicable except Section 9 and Appendix E.
B. API RP 571: Section 2 (Definitions) and specific damage mechanisms: Amine SCC, Atmospheric Corrosion, Boiler Water Corrosion, Brittle Fracture, Caustic Corrosion, Caustic SCC, Chloride SCC, CUI, Erosion, High-temp H2/H2S Corrosion, HTHA, HCl Corrosion, Naphthenic Acid Corrosion, Sulfidation, Wet H2S Damage.
C. API RP-572: Entire document, including Annex A and B. Annex C is excluded.
D. API RP 576: Entire document, except for annexes.
E. API RP 577: Entire document.
F. API RP 578: Entire document.
G. ASME PCC-2: Articles 101, 201, 202, 209, 210, 211, 212, 215, 216, 304, 305, 312, 501, 502.
`
  }
  // ... and so on for other exams.
};