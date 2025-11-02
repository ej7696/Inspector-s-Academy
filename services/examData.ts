interface ExamData {
  effectivitySheet: string;
  bodyOfKnowledge: string;
}

export const examSourceData: { [key: string]: ExamData } = {
  // API Certs
  "API 510 - Pressure Vessel Inspector": {
    effectivitySheet: `FOR: September 2025, January 2026, and May 2026
- API 510, Pressure Vessel Inspection Code: In-service Inspection, Rating, Repair, and Alteration, 11th Edition, October 2022, Errata 1 (March 2023)
- API Recommended Practice 571, Damage Mechanisms Affecting Fixed Equipment in the Refining Industry, 3rd edition, March 2020 (Sections: 2, 3.3, 3.8, 3.9, 3.11, 3.14, 3.15, 3.17, 3.22, 3.27, 3.35, 3.36, 3.37, 3.46, 3.61, 3.67)
- API Recommended Practice 572, Inspection Practices for Pressure Vessels, 5th Edition, November 2023.
- API Recommended Practice 576, Inspection of Pressure-relieving Devices, 5th Edition, September 2024
- API Recommended Practice 577, Welding Processes, Inspection, and Metallurgy, 3rd Edition, October 2020.
- API Recommended Practice 578, Material Verification Program for New and Existing Assets, 4th edition, February 2023
- ASME, Boiler and Pressure Vessel Code, 2023 Edition:
  - Section V, Nondestructive Examination, Articles 1, 2, 6, 7 and 23 (Section SE-797 only)
  - Section VIII, Rules for Construction of Pressure Vessels, Division 1; Introduction (U), UG, UW, UCS, Appendices 1-4, 6, 8, and 12
  - Section IX, Qualification Standard for Welding, Brazing, and Fusing Procedures; (Welding only)
- ASME PCC-2, Repair of Pressure Equipment and Piping, 2022 (Articles: 101, 201, 202, 209, 210, 211, 212, 215, 216, 304, 305, 312, 501, 502)`,
    bodyOfKnowledge: `API Authorized Pressure Vessel Inspectors must have a broad knowledge base relating to maintenance, inspection, repair, and alteration of pressure vessels. The examination is designed to determine if individuals have such knowledge.
I. THICKNESS MEASUREMENTS, INSPECTION INTERVALS AND VESSEL INTEGRITY: Corrosion Rates and Inspection Intervals, Joint Efficiencies, Static Head, Internal Pressure, External Pressure, Pressure Testing, Impact Testing, Weld Size for Attachment Welds at Openings, Nozzle Reinforcement.
II. WELDING PROCEDURE AND QUALIFICATION EVALUATION: Based on ASME Section IX, including Weld Procedure Review (WPS, PQR, WPQ) and general welding requirements from ASME Section VIII, Div. 1 and API 510. Welding processes limited to SMAW, GTAW, GMAW, SAW. Base metals limited to P-No. 1, 3, 4, 5, and 8.
III. NONDESTRUCTIVE EXAMINATION: Based on ASME Section V, including Article 1 (General), Article 2 (Radiography), Article 6 (Liquid Penetrant), Article 7 (Magnetic Particle - Yoke and Prod only), Article 23 (Ultrasonic Thickness - SE-797 only).
IV. PRACTICAL KNOWLEDGE - GENERAL & SPECIFIC: Requirements from API 510, API RP 571 (specified sections), API RP 572, API RP 576, API RP 577, API RP 578, and ASME PCC-2 (specified articles).`,
  },
  "API 570 - Piping Inspector": {
    effectivitySheet: `FOR: 2026
- API 570, Piping Inspection Code: In-service Inspection, Rating, Repair, and Alteration of Piping Systems, 5th Edition, February 2024
- API Recommended Practice 571, Damage Mechanisms Affecting Fixed Equipment in the Refining Industry, 3rd Edition, March 2020 (Sections: 2, 3.3, 3.8, 3.9, 3.14, 3.15, 3.17, 3.22, 3.27, 3.31, 3.37, 3.43, 3.45, 3.57, 3.58, 3.61)
- API Recommended Practice 574, Inspection Practices for Piping System Components, 5th edition, February 2024, Addendum 1 (March 2025)
- API Recommended Practice 576, Inspection of Pressure-relieving Devices, 5th Edition, September 2024 (Sections 5, 6.1-6.5 and 7)
- API Recommended Practice 577, Welding Processes, Inspection, and Metallurgy, 3rd Edition, October 2020
- API Recommended Practice 578, Material Verification Program for New and Existing Assets, 4th Edition, February 2023
- ASME, Boiler and Pressure Vessel Code, 2023 Edition:
  - Section V, Nondestructive Examination, Articles 1, 2, 6, 7, 9, 10, and 23 (Section SE-797 only)
  - Section IX, Qualification Standard for Welding, Brazing, and Fusing Procedures; (Welding only)
- ASME B16.5, Pipe Flanges and Flanged Fittings, 2020 Edition
- ASME B31.3, Process Piping, 2024 Edition
- ASME PCC-2, Repair of Pressure Equipment and Piping, 2022 (Articles: 101, 201, 206, 209, 210, 211, 212, 304, 305, 306, 501, 502)`,
    bodyOfKnowledge: `API Authorized Piping Inspectors must have a broad knowledge base relating to maintenance, inspection, alteration, and repair of in-service metallic piping systems.
I. CALCULATIONS FOR EVALUATING THICKNESS MEASUREMENTS, INSPECTION INTERVALS, AND PIPING INTEGRITY: Corrosion Rates and Inspection Intervals, Weld Joint Quality Factors, Internal Pressure / Minimum Thickness of Pipe, Pressure Testing, Impact Testing, Preheating and Heat Treatment, Thermal Expansion, Flanges, and Blanks. Excludes specific ASME B31.3 requirements like external pressure, branch connections, flexibility analysis etc.
II. WELDING PROCEDURE AND QUALIFICATION EVALUATION: Based on ASME Section IX for procedures (WPS), qualifications (PQR), and welder performance (WPQ). Limited to SMAW, GTAW, GMAW, or SAW and P-No. 1, 3, 4, 5, 8 base metals. General welding rules from ASME B31.3 and API 570.
III. NONDESTRUCTIVE EXAMINATION: Based on ASME Section V, including Article 1 (General), Article 2 (Radiography), Article 6 (Liquid Penetrant), Article 7 (Magnetic Particle - Yoke/Prod only), Article 9 (Visual), Article 10 (Leak Testing), and Article 23 (Ultrasonic Thickness - SE-797). General NDE rules from ASME B31.3 and API 570.
IV. PRACTICAL KNOWLEDGE - GENERAL & SPECIFIC: Organization and Certification, Inspection Types, Welding, Corrosion, Remaining Life, Inspection Intervals, Safety, Records, Repairs/Alterations/Reratings, Pressure Testing, and Positive Material Identification. Knowledge from API 570, API RP 571 (specified sections), API RP 574, API RP 576 (specified sections), API RP 577, API RP 578, ASME B16.5, and ASME PCC-2 (specified articles).`,
  },
  "API 653 - Aboveground Storage Tank Inspector": {
    effectivitySheet: `FOR: March 2026, July 2026, and November 2026
- API Recommended Practice 571, Damage Mechanisms Affecting Fixed Equipment in the Refining Industry, 3rd Edition, March 2020 (Sections: 2, 3.8, 3.11, 3.14, 3.15, 3.19, 3.22, 3.28, 3.45, 3.57, 3.62)
- API Recommended Practice 575, Inspection Practices for Atmospheric and Low-Pressure Storage Tanks, 5th Edition, September 2024
- API Recommended Practice 576, Inspection of Pressure-relieving Devices, 5th Edition, September 2024 (Sections 4.3.2 and 6.7 only)
- API Recommended Practice 577 – Welding Processes, Inspection, and Metallurgy, 3rd Edition, October 2020
- API Standard 650, Welded Tanks for Oil Storage, 13th Edition, March 2020 with Errata 1 (January 2021)
- API Recommended Practice 651, Cathodic Protection of Aboveground Petroleum Storage Tanks, 5th Edition, August 2024.
- API Recommended Practice 652, Lining of Aboveground Petroleum Storage Tank Bottoms, 5th Edition, May 2020
- API Standard 653, Tank Inspection, Repair, Alteration, and Reconstruction, 5th Edition, November 2014, with Addenda 1, 2, 3 and Errata 1, 2.
- ASME, Boiler and Pressure Vessel Code, 2023 Edition:
  - Section V, Nondestructive Examination, Articles 1, 2, 6, 7 and 23 (section SE-797 only)
  - Section IX, Qualification Standard for Welding, Brazing, and Fusing Operators, (Welding Only)`,
    bodyOfKnowledge: `API Authorized Aboveground Storage Tank Inspectors must have a broad knowledge base relating to tank inspection and repair of aboveground storage tanks.
I. CALCULATIONS & TABULAR EVALUATIONS: Corrosion Rates and Inspection Intervals, Joint Efficiencies, Maximum Fill Height, Weld Sizes, Hot Tapping, Settlement Evaluation, Number of Settlement Points, Impact Testing, Minimum Thickness of Tank Shell (existing and reconstructed), Corroded Area Evaluation, Pitting Evaluation, Bottom Plate Minimum Thickness, Replacement Plates, and Lap Welded Patch Plates.
II. WELDING: Review of Welding Procedure Specification (WPS), Procedure Qualification Record (PQR), and Welder Performance Qualification (WPQ) based on ASME IX. General welding requirements from API 650 and API 653. Welding processes are limited to SMAW or GMAW.
III. NONDESTRUCTIVE EXAMINATION: Based on ASME Section V, including Article 1 (General), Article 2 (Radiography), Article 6 (Liquid Penetrant), Article 7 (Magnetic Particle - Yoke/Prod only), and Article 23 (Ultrasonic Thickness - SE-797). General NDE rules from API 650 and API 653.
IV. PRACTICAL KNOWLEDGE: General topics include certification requirements, inspection types, corrosion, welding, NDE, repairs, alterations, and testing. Specific knowledge from API RP 571 (specified mechanisms), API RP 575, API RP 576 (specified sections), API 653, API RP 651 (Sections 1-6, 8, 11), and API RP 652.`,
  },
  "API 1169 - Pipeline Construction Inspector": {
    effectivitySheet: `Effective for December 2025 - August 2026 exams
- API Recommend Practice 1169, Pipeline Construction Inspection, 2nd Edition, March 2020
- API Recommended Practice 1110, Pressure Testing of Steel Pipelines, 7th Edition, December 2022
- API Specification Q1, Quality Management System Requirements, 10th Edition, September 2023 (Sections 3-5 only)
- CGA, Best Practices, Current Edition
- CS-S-9 Pressure Testing (Hydrostatic/Pneumatic) Safety Guidelines, December 2018
- API Standard 1104, Welding of Pipelines and Related Facilities, 22nd Edition, July 2021 (Sections 3-11) OR CSA Z662:23, Oil and Gas Pipeline Systems, 2023 (Chapters 1, 2, 4, 6, 7, 8, 9 and 10)
- US Regulations: 49 CFR 192, 49 CFR 195, 29 CFR 1910, 29 CFR 1926, FERC Wetland and Waterbody Procedures, 50 CFR 21.`,
    bodyOfKnowledge: `API 1169 Pipeline Construction Inspectors must have a broad knowledge base relating to construction of new onshore pipeline construction.
1. Pipeline Construction Inspection/Management Knowledge Areas: Quality assurance, Safety, Environmental, Training and Qualifications.
2. Front-end Construction: Survey & Staking, Line Locating, ROW Clearing/Grading.
3. Installation Construction: Stringing, Bending, Welding/NDE, Trenching, Crossings/Drills, Coating, Padding/Lowering in, Tie-ins.
4. Back-end Construction: Cathodic Protection, As-built Survey, Backfill, ROW Clean-up/Restoration, Hydrostatic Testing, Pigging.
5. Post-Construction: Line List close out, Final completion assessment/Punch out, Turn over to Operations.
The exam will also cover knowledge from Reference Publications including API 1110, API Q1, CGA Best Practices, INGAA guidelines, API 1104 (or CSA Z662), and various US and Canadian federal regulations regarding pipeline safety, occupational safety, and environmental protection.`,
  },
  "API 936 - Refractory Personnel": {
    effectivitySheet: `Effective April 2025, August 2025, December 2025, April 2026, August 2026, December 2026
- API Standard 936, Refractory Installation Quality Control Guidelines – Inspection and Testing Monolithic Refractory Linings and Materials, 5th Edition, March 2024
- API Standard 975, Refractory Installation Quality Control – Inspection and Testing of Refractory Brick Systems and Materials, 1st Edition, November 2021
- API Standard 976, Refractory Installation Quality Control – Inspection and Testing of AES/RCF Fiber Linings and Materials, 1st Edition, March 2018
- ASTM C113-14 (2019) – Standard Test Method for Reheat Change of Refractory Brick
- ASTM C133-97 (2021) – Standard Test Methods for Cold Crushing Strength and Modulus of Rupture of Refractories
- ASTM C181-11 (2018) – Standard Test Method for Workability Index of Fireclay and High-Alumina Plastic Refractories
- ASTM C704-15 - Standard Test Method for Abrasion Resistance of Refractory Materials at Room Temperatures`,
    bodyOfKnowledge: `API certified 936 refractory personnel must have knowledge of installation, inspection, testing and repair of refractory linings.
Candidates are expected to demonstrate knowledge in the following categories:
- Roles and Responsibilities: Understand the different roles (owner, inspector, contractor, manufacturer) and their responsibilities (API 936, Section 5, Section 6).
- Laboratory Testing Procedures: Understand test method selection, execution, interpretation of acceptance levels, and documentation of results (API 936, Section 8).
- Materials and Installation Requirements: Identify different types of refractories, packaging, storage, and installation techniques (gunning, casting, ramming/hand packing) (API 936, Sections 9.6, 9.7, 9.8). Interpret lining design requirements including anchors, sampling, water/activator/fiber additions (API 936, Sections 7.4, 9.4, 8.4, 9, 9.10).
- Installation Inspection and Quality Control: Read and interpret material specifications and installation requirements, including data collection, acceptance criteria, and test panel/mockup requirements (API 936 Section 8.2 and 8.3). Monitor installation quality, understand repair procedures, and resolution of defects (API 936, Section 9.14). Understand curing and dry out requirements (API 936, Section 9.13 and Section 10).`,
  },
  // SIFE/SIRE/SIEE
  "SIFE - Source Inspector Fixed Equipment": {
    effectivitySheet: `Effective for November 2025 – July 2027 exams
- API Recommended Practice 588, Source Inspection and Quality Surveillance of Fixed Equipment, 1st Edition, July 2019
- API Recommended Practice 572, Inspection of Pressure Vessels, 5th Edition, December 2023, Sections 3 and 4
- API Recommended Practice 577, Welding Inspection and Metallurgy, 3rd edition, October 2020
- API Recommended Practice 578, Material Verification Program for Alloy Piping Systems, 4th Edition, February 2023
- API Standard 598, Valve Inspection and Testing, 11th Edition, February 2023
- AWS D1.1, Structural Welding Code- Steel, 2025 Edition
- ASNT SNT TC-1A Personal Qualification and Certification in Nondestructive Testing Personnel, 2024 Edition
- ASME BPVC (2023): Section II Parts A,B,C,D; Section V (specified articles); Section VIII Div 1 & 2 (specified sections); Section IX (welding only)
- ASME B31.3, Process Piping, 2024 Edition
- ASME B16.5 Pipe Flanges and Flanged Fittings, 2020 Edition
- SSPC-PA 2 and SSPC Surface Preparation Guide (SP1, SP3, SP5, SP6, SP7, SP10, SP11)`,
    bodyOfKnowledge: `Focuses on pressure containing equipment and structural equipment (vessels, columns, heat exchangers, piping, valves, etc.).
Candidates are expected to demonstrate knowledge in the following categories:
1. Definitions, Abbreviations and Acronyms
2. Trainings
3. Source Inspection Management Program
4. Project Specific Source Inspection Planning
5. Development of a Source Inspection Project Plan
6. Source Inspection Performance (Industry Codes, Welding Procedures, Report Writing)
7. Examination Methods, Tools and Equipment
8. Final Acceptance
9. Manufacturing and Fabrication (M&F) Processes
10. Pressure Vessels
11. Piping`,
  },
  "SIRE - Source Inspector Rotating Equipment": {
    effectivitySheet: `Effective for November 2025 – July 2027 exams
- Guide for Source Inspection and Quality Surveillance of Rotating Equipment, October 2018
- API RP 578, Material Verification Programs, 4th Edition, February 2023
- API Standard 610, Centrifugal Pumps, 12th edition, January 2021
- API Standard 614, Lubrication, Shaft-sealing and Oil-control Systems, 6th edition, February 2022
- API Standard 617, Axial and Centrifugal Compressors, 9th edition, April 2022
- API Standard 618, Reciprocating Compressors, 6th Edition, May 2024
- API Standard 677, General-purpose Gear Units, 4th Edition, September 2021
- ASME BPVC, 2023 Edition: Section II, V, VIII, IX
- ASNT SNT-TC-1A, 2024
- ASTM A703, Standard Specifications for Steel Castings
- MSS-SP-55, Quality Standard for Steel Castings`,
    bodyOfKnowledge: `Covers primarily rotating equipment, including pumps, gears, compressors, turbines, and associated appurtenances.
Candidates are expected to demonstrate knowledge in the following categories:
1. Terms and Definitions
2. Source Inspection Management Program
3. Equipment Risk Assessment
4. Source Inspection Performance
5. Examination Methods, Tools and Equipment
6. Manufacturing and Fabrication Processes (Welding, Casting, Forging, Machining)
7. Centrifugal Pumps
8. Drivers (Electrical Motors)
9. Gears
10. Steam Turbines
11. Lube Oil Systems
12. Reciprocating Compressors
13. Rotary- (Screw) Type Compressors
14. Testing of Axial/Centrifugal Compressors`,
  },
  "SIEE - Source Inspector Electrical Equipment": {
    effectivitySheet: `Effective through August 2026 exams
- API Guide for Source Inspection and Quality Surveillance of Electrical Equipment
- API RP 540, Electrical Installations in Petroleum Processing Plants, 4th Ed.
- API Std 541, Form-wound Squirrel Cage Induction Motors, 5th Ed.
- API RP 14F & 14FZ for Offshore Electrical Systems
- IEEE 141, 841, C37.20.1a, C37.20.3, C57.12.00
- NEMA ICS 1, 2, 3, 19; NEMA MG-1
- NETA ATS
- NFPA 70 (NEC), 2020 Edition
- NFPA 70E, 2021 Edition`,
    bodyOfKnowledge: `Covers inspection of electrical material and equipment, such as: Junction Boxes, Control Panels, Electrical Systems, Transformers, Switchgears, Motor Control Centers, Electric Motors (over 500 HP).
Candidates are expected to demonstrate knowledge in the following categories:
1. Terms and Definitions
2. Source Inspection Management Program
3. Equipment Risk Assessment
4. Source Inspection Performance
5. Examination Methods, Tools and Equipment
6. Electrical Skid Mounted Equipment
7. Liquid-Immersed Transformers
8. Switchgear (Low & Medium Voltage)
9. Motor Control Centers (Low to Medium Voltage)
10. Electrical Induction Motors
11. Electrical Inspection Tools and Test Equipment`,
  },
  // AWS
  "CWI - Certified Welding Inspector": {
    effectivitySheet: `AWS D1.1, Structural Welding Code — Steel.
AWS B5.1, Specification for the Qualification of Welding Inspectors.
AWS A2.4, Standard Symbols for Welding, Brazing, and Nondestructive Examination.
AWS A3.0, Standard Welding Terms and Definitions.`,
    bodyOfKnowledge: `Welding processes (SMAW, GMAW, FCAW, GTAW).
Welding symbols and joint design.
Welder qualification and procedure qualification records (WPS/PQR).
Visual inspection of welds and acceptance criteria.
Destructive testing methods (bend, tensile, nick-break).
Nondestructive Examination (NDE) methods (VT, PT, MT, UT, RT).
Welding metallurgy and heat treatment.
Welding safety.
Duties and responsibilities of a CWI.`,
  },
};