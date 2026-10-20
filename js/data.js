// Starting data: labs, equipment inventory, contingency log entries and staff accounts.
// Used the first time the portal runs; after that, the saved copy (Firebase or the browser) is used.
// ================= 2. INITIAL COMPLETE PDF DATASET (50 SYSTEMS + 38 SUB-COMPONENTS) =================
export const INITIAL_LABS = [
  { code: 'CM-01-158', name: 'Respiratory Therapy Skills Lab (A)', college: 'Applied Medical Science - Male', region: 'Central Region' },
  { code: 'CM-01-162', name: 'Respiratory Therapy Skills Lab (B)', college: 'Applied Medical Science - Male', region: 'Central Region' }
];

export const INITIAL_INVENTORY = [
  // ==================== LAB CM-01-158 (29 PARENT SYSTEMS) ====================
  { id: '158-1', lab: 'CM-01-158', sn: 1, desc: 'Oximeters, Pulse', htms: '108872', ku: '84957', model: 'Radical 7', mfg: 'Masimo', serial: 'Q09397', status: 'Operational', subs: [] },
  { id: '158-2', lab: 'CM-01-158', sn: 2, desc: 'Oxygen Delivery Units, Controlled', htms: '108875', ku: '84955', model: 'III-STA with Quick Nav', mfg: 'ResMed', serial: '20122463954', status: 'Operational', subs: [] },
  { id: '158-3', lab: 'CM-01-158', sn: 3, desc: 'Oxygen Delivery Units, Controlled', htms: '111323', ku: '84939', model: 'III-STA with Quick Nav', mfg: 'ResMed', serial: '20122463939', status: 'Operational', subs: [] },
  { id: '158-4', lab: 'CM-01-158', sn: 4, desc: 'Ventilators', htms: '111315', ku: '84937', model: 'Covidien 840+', mfg: 'Puritan Bennett', serial: '3512130579', status: 'Operational', subs: [] },
  { id: '158-5', lab: 'CM-01-158', sn: 5, desc: 'Ventilators', htms: '111318', ku: '84931', model: 'Covidien 840+', mfg: 'Puritan Bennett', serial: '3512130465', status: 'Operational', subs: [] },
  { id: '158-6', lab: 'CM-01-158', sn: 6, desc: 'Ventilators', htms: '112097', ku: '106285', model: 'Covidien 840+', mfg: 'Puritan Bennett', serial: '3512151947', status: 'Operational', subs: [] },
  { id: '158-7', lab: 'CM-01-158', sn: 7, desc: 'Ventilators', htms: '111319', ku: '84936', model: 'Servo-i', mfg: 'MAQUET', serial: '70367', status: 'Operational', subs: [] },
  { id: '158-8', lab: 'CM-01-158', sn: 8, desc: 'Ventilators', htms: '111320', ku: '84933', model: 'Servo-i', mfg: 'MAQUET', serial: '70366', status: 'Operational', subs: [] },
  { id: '158-9', lab: 'CM-01-158', sn: 9, desc: 'Exercisers, Wrist', htms: '118002', ku: '94248', model: 'M99', mfg: 'KYOTO KAGAKU', serial: 'NA', status: 'Operational', subs: [
    { desc: 'Circulation pump', ku: '94247', model: 'NA', mfg: 'KYOTO KAGAKU', serial: 'AMSR64/3a' }
  ]},
  { id: '158-10', lab: 'CM-01-158', sn: 10, desc: 'Circulation pump & Wrist Exerciser Set', htms: '112099', ku: '107080', model: 'M99', mfg: 'KYOTO KAGAKU', serial: 'AMSR64/1a', status: 'Operational', subs: [
    { desc: 'Exercisers, Wrist', ku: '107080', model: 'M99', mfg: 'KYOTO KAGAKU', serial: 'NA' },
    { desc: 'Circulation pump', ku: 'NA', model: 'NA', mfg: 'KYOTO KAGAKU', serial: 'AMSR64/1a' }
  ]},
  { id: '158-11', lab: 'CM-01-158', sn: 11, desc: 'Oximeters, Pulse', htms: '111321', ku: '84942', model: 'Radical 7', mfg: 'Masimo', serial: 'Q09420', status: 'Operational', subs: [] },
  { id: '158-12', lab: 'CM-01-158', sn: 12, desc: 'Monitoring Systems, Physiologic (Rack & Module)', htms: '111326', ku: '84945', model: 'MX600', mfg: 'Philips', serial: 'DE12502077', status: 'Operational', subs: [
    { desc: 'Rack', ku: 'NA', model: 'NA', mfg: 'Philips', serial: 'DE12319100' },
    { desc: 'Module', ku: 'NA', model: 'M3004', mfg: 'Philips', serial: 'DE9070CBPF' }
  ]},
  { id: '158-13', lab: 'CM-01-158', sn: 13, desc: 'Monitoring Systems, Physiologic (Rack & Module)', htms: '111328', ku: '84935', model: 'MX600', mfg: 'Philips', serial: 'DE12502069', status: 'Operational', subs: [
    { desc: 'Rack', ku: 'NA', model: 'NA', mfg: 'Philips', serial: 'DE12319076' },
    { desc: 'Module', ku: 'NA', model: 'M3004', mfg: 'Philips', serial: 'DE9070B69P' }
  ]},
  { id: '158-14', lab: 'CM-01-158', sn: 14, desc: 'Monitoring Systems, Physiologic (Rack & Module)', htms: '111329', ku: '84934', model: 'MX600', mfg: 'Philips', serial: 'DE12502075', status: 'Operational', subs: [
    { desc: 'Rack', ku: 'NA', model: 'NA', mfg: 'Philips', serial: 'DE12319093' },
    { desc: 'Module', ku: 'NA', model: 'M3004', mfg: 'Philips', serial: 'DE9070B69L' }
  ]},
  { id: '158-15', lab: 'CM-01-158', sn: 15, desc: 'Spirometer', htms: '111869', ku: '84954', model: 'KoKo Legend', mfg: 'nSpire', serial: '2013LC0134', status: 'Operational', subs: [
    { desc: 'Calibration syringe', ku: 'NA', model: 'NA', mfg: 'nSpire', serial: '553-40281' }
  ]},
  { id: '158-16', lab: 'CM-01-158', sn: 16, desc: 'Spirometer', htms: '111889', ku: '84953', model: 'KoKo Legend', mfg: 'nSpire', serial: '2013LC0135', status: 'Operational', subs: [
    { desc: 'Calibration syringe', ku: 'NA', model: 'NA', mfg: 'nSpire', serial: '553-40267' }
  ]},
  { id: '158-17', lab: 'CM-01-158', sn: 17, desc: 'Ventilators', htms: '111908', ku: '84938', model: 'Babylog 8000+', mfg: 'Draeger', serial: 'ASEM0011', status: 'Operational', subs: [] },
  { id: '158-18', lab: 'CM-01-158', sn: 18, desc: 'Ventilators', htms: '112011', ku: '84932', model: 'Babylog 8000+', mfg: 'Draeger', serial: 'ASEM0008', status: 'Operational', subs: [] },
  { id: '158-19', lab: 'CM-01-158', sn: 19, desc: 'Portable Ventilators', htms: '112096', ku: '106284', model: 'HT70', mfg: 'Newport Medical Instruments Inc', serial: 'N13HT721112780', status: 'Maintenance', subs: [
    { desc: 'Oxygen cylinder', ku: 'NA', model: 'NA', mfg: 'NA', serial: 'NA' }
  ]},
  { id: '158-20', lab: 'CM-01-158', sn: 20, desc: 'Capnographs', htms: '108873', ku: '84958', model: 'Respsense', mfg: 'Nonin Medical', serial: '501380579', status: 'Operational', subs: [] },
  { id: '158-21', lab: 'CM-01-158', sn: 21, desc: 'Capnographs', htms: '108874', ku: '84959', model: 'Respsense', mfg: 'Nonin Medical', serial: '501380594', status: 'Operational', subs: [] },
  { id: '158-22', lab: 'CM-01-158', sn: 22, desc: 'Capnographs', htms: '111324', ku: '84941', model: 'Respsense', mfg: 'Nonin Medical', serial: '501380590', status: 'Operational', subs: [] },
  { id: '158-23', lab: 'CM-01-158', sn: 23, desc: 'Physiologic Monitor Modules, Cardiac Output', htms: '112538', ku: '94319', model: 'PICCO', mfg: 'Philips', serial: '3805643702', status: 'Operational', subs: [] },
  { id: '158-24', lab: 'CM-01-158', sn: 24, desc: 'Simulators, Training, Airway Management/Intubation', htms: '118022', ku: '94220', model: '25 00 00 33', mfg: 'Laerdal', serial: 'AMSR18.2', status: 'Operational', subs: [] },
  { id: '158-25', lab: 'CM-01-158', sn: 25, desc: 'Simlink Adult Manikin Simulation System', htms: '118015', ku: '94333', model: '200-30250', mfg: 'Laerdal', serial: 'TSBC05013701', status: 'Operational', subs: [
    { desc: 'Manikins, Adult', ku: '94216', model: '205-05050', mfg: 'Laerdal', serial: '205M08130001' },
    { desc: 'Simpad', ku: '94217', model: '200-30150', mfg: 'Laerdal', serial: 'ZW1290001038' },
    { desc: 'Battery', ku: '94334', model: '200-30350', mfg: 'Laerdal', serial: 'NA' }
  ]},
  { id: '158-26', lab: 'CM-01-158', sn: 26, desc: 'Simlink Newborn Manikin Simulation System', htms: '118025', ku: '94349', model: '200-30250', mfg: 'Laerdal', serial: 'TSBC08004317', status: 'Operational', subs: [
    { desc: 'Newborn Manikins', ku: '94231', model: '226-05050', mfg: 'Laerdal', serial: '226M45120013' },
    { desc: 'Simpad', ku: '94232', model: '200-30150', mfg: 'Laerdal', serial: 'ZW1280000110' },
    { desc: 'Battery', ku: '94350', model: '200-30350', mfg: 'Laerdal', serial: 'NA' },
    { desc: 'Compressor', ku: '94370', model: 'NA', mfg: 'Laerdal', serial: 'NA' }
  ]},
  { id: '158-27', lab: 'CM-01-158', sn: 27, desc: 'Simlink Newborn Manikin Simulation System II', htms: '117993', ku: '94343', model: '200-30250', mfg: 'Laerdal', serial: 'TSBC06003675', status: 'Operational', subs: [
    { desc: 'Newborn Manikins', ku: '94280', model: '226-05050', mfg: 'Laerdal', serial: '226M45120012' },
    { desc: 'Simpad', ku: '94281', model: '200-30150', mfg: 'Laerdal', serial: 'ZW1270011768' },
    { desc: 'Battery', ku: '94344', model: '200-30350', mfg: 'Laerdal', serial: 'NA' },
    { desc: 'Compressor', ku: '94360', model: 'NA', mfg: 'Laerdal', serial: 'NA' }
  ]},
  { id: '158-28', lab: 'CM-01-158', sn: 28, desc: 'Simlink Training Manikin System', htms: '118012', ku: '94379', model: '200-30250', mfg: 'Laerdal', serial: 'TSBC06003835', status: 'Operational', subs: [
    { desc: 'Training Manikins', ku: '94263', model: '231-05050', mfg: 'Laerdal', serial: '231M45120012' },
    { desc: 'Simpad', ku: '94264', model: '200-30150', mfg: 'Laerdal', serial: 'ZW1270011805' },
    { desc: 'Battery', ku: '94380', model: '200-30350', mfg: 'Laerdal', serial: 'NA' }
  ]},
  { id: '158-29', lab: 'CM-01-158', sn: 29, desc: 'Simlink Adult Manikin Simulation System II', htms: '117998', ku: '94383', model: '200-30250', mfg: 'Laerdal', serial: 'TSBC06004450', status: 'Operational', subs: [
    { desc: 'Manikins, Adult', ku: '94261', model: '205-05050', mfg: 'Laerdal', serial: '205M08130004' },
    { desc: 'Simpad', ku: '94262', model: '200-30150', mfg: 'Laerdal', serial: 'AMSR61/1a' },
    { desc: 'Battery', ku: '94381', model: '200-30350', mfg: 'Laerdal', serial: 'NA' }
  ]},

  // ==================== LAB CM-01-162 (21 PARENT SYSTEMS) ====================
  { id: '162-1', lab: 'CM-01-162', sn: 1, desc: 'Sphygmomanometers, Aneroid', htms: '110417', ku: '84946', model: '7670-10', mfg: 'Welch Allyn Inc', serial: '121029151776', status: 'Operational', subs: [] },
  { id: '162-2', lab: 'CM-01-162', sn: 2, desc: 'Sphygmomanometers, Aneroid', htms: '110418', ku: '84949', model: '7670-10', mfg: 'Welch Allyn Inc', serial: '121114161816', status: 'Operational', subs: [] },
  { id: '162-3', lab: 'CM-01-162', sn: 3, desc: 'Sphygmomanometers, Aneroid', htms: '110419', ku: '84950', model: '7670-10', mfg: 'Welch Allyn Inc', serial: '121029065866', status: 'Operational', subs: [] },
  { id: '162-4', lab: 'CM-01-162', sn: 4, desc: 'Sphygmomanometers, Aneroid', htms: '110420', ku: '84952', model: '7670-10', mfg: 'Welch Allyn Inc', serial: '121114193256', status: 'Operational', subs: [] },
  { id: '162-5', lab: 'CM-01-162', sn: 5, desc: 'Monitoring Systems, Physiologic', htms: '111127', ku: '73361', model: 'VS2 Plus', mfg: 'Philips', serial: 'cn21207768', status: 'Operational', subs: [] },
  { id: '162-6', lab: 'CM-01-162', sn: 6, desc: 'Monitoring Systems, Physiologic', htms: '111128', ku: '78364', model: 'VS2 Plus', mfg: 'Philips', serial: 'cn21207749', status: 'Operational', subs: [] },
  { id: '162-7', lab: 'CM-01-162', sn: 7, desc: 'Monitoring Systems, Physiologic (Rack & Module)', htms: '111327', ku: '84947', model: 'MX600', mfg: 'Philips', serial: 'DE12502102', status: 'Operational', subs: [
    { desc: 'Rack', ku: 'NA', model: 'NA', mfg: 'Philips', serial: 'DE12319102' },
    { desc: 'Module', ku: 'NA', model: 'M3004', mfg: 'Philips', serial: 'DE9070CB59' }
  ]},
  { id: '162-8', lab: 'CM-01-162', sn: 8, desc: 'Ultrasound Therapy Systems', htms: '111317', ku: '84940', model: 'G5 Digital Experience', mfg: 'General Physiotherapy, Inc.', serial: 'VBM0134', status: 'Operational', subs: [] },
  { id: '162-9', lab: 'CM-01-162', sn: 9, desc: 'Ultrasound Therapy Systems', htms: '111330', ku: '84948', model: 'G5 Digital Experience', mfg: 'General Physiotherapy, Inc.', serial: 'VBM0136', status: 'Operational', subs: [] },
  { id: '162-10', lab: 'CM-01-162', sn: 10, desc: 'Ultrasound Therapy Systems', htms: '111331', ku: '84951', model: 'G5 Digital Experience', mfg: 'General Physiotherapy, Inc.', serial: 'VBM0130', status: 'Operational', subs: [] },
  { id: '162-11', lab: 'CM-01-162', sn: 11, desc: 'Simulators, Respiration, Lung & Audio-Visual Station (M81-S)', htms: '112012', ku: '94257', model: 'AB623 / M81-S', mfg: 'KYOTO KAGAKU / Mitsubishi', serial: '27218053U', status: 'Contingency / Fault', subs: [
    { desc: 'Simulators, Respiration, Lung', ku: '94256', model: 'M81-S', mfg: 'KYOTO KAGAKU', serial: '256' },
    { desc: 'PC', ku: '94255', model: 'OPTIPLEX 580', mfg: 'Dell', serial: 'JF88BYBX' },
    { desc: 'Speaker 1', ku: '94258', model: 'NA', mfg: 'TANNOY', serial: '810401' },
    { desc: 'Speaker 2', ku: '94259', model: 'NA', mfg: 'TANNOY', serial: '807859' },
    { desc: 'Amplifier for external speakers', ku: '94260', model: 'HST-2SCE', mfg: 'KYOTO KAGAKU', serial: 'AMSR60/1a' }
  ]},
  { id: '162-12', lab: 'CM-01-162', sn: 12, desc: 'Oximeters, Pulse', htms: '111322', ku: '84943', model: 'Radical 7', mfg: 'Masimo', serial: 'Q08463', status: 'Operational', subs: [] },
  { id: '162-13', lab: 'CM-01-162', sn: 13, desc: 'Exercisers, Wrist & Circulation Pump', htms: '118003', ku: '94249', model: 'M99', mfg: 'KYOTO KAGAKU', serial: 'AMSR56', status: 'Operational', subs: [
    { desc: 'Circulation pump', ku: '94250', model: 'NA', mfg: 'KYOTO KAGAKU', serial: 'AMSR56/1a' }
  ]},
  { id: '162-14', lab: 'CM-01-162', sn: 14, desc: 'Circulation Pump & Wrist Exerciser Set II', htms: '118004', ku: '94251', model: 'M99', mfg: 'KYOTO KAGAKU', serial: 'AMSR64/2a', status: 'Operational', subs: [
    { desc: 'Exercisers, Wrist', ku: '94252', model: 'M99', mfg: 'KYOTO KAGAKU', serial: 'AMSR64.2' }
  ]},
  { id: '162-15', lab: 'CM-01-162', sn: 15, desc: 'Circulation Pump & Wrist Exerciser Set III', htms: '118005', ku: '94253', model: 'M99', mfg: 'KYOTO KAGAKU', serial: 'AMSR64/1a', status: 'Operational', subs: [
    { desc: 'Exercisers, Wrist', ku: '94254', model: 'M99', mfg: 'KYOTO KAGAKU', serial: 'AMSR64.1' }
  ]},
  { id: '162-16', lab: 'CM-01-162', sn: 16, desc: 'Simulators, Training, Airway Management/Intubation', htms: '117992', ku: '94272', model: '25 00 00 33', mfg: 'Laerdal', serial: 'AMSR43', status: 'Operational', subs: [] },
  { id: '162-17', lab: 'CM-01-162', sn: 17, desc: 'Monitoring Systems, Physiologic', htms: '111126', ku: '73362', model: 'VS2 Plus', mfg: 'Philips', serial: 'cn21207755', status: 'Operational', subs: [] },
  { id: '162-18', lab: 'CM-01-162', sn: 18, desc: 'Oximeters, Pulse', htms: '108871', ku: '84956', model: 'Radical 7', mfg: 'Masimo', serial: 'Q08481', status: 'Operational', subs: [] },
  { id: '162-19', lab: 'CM-01-162', sn: 19, desc: 'Ultrasound Therapy Systems', htms: '111316', ku: '84930', model: 'G5 Digital Experience', mfg: 'General Physiotherapy, Inc.', serial: 'VBM0139', status: 'Operational', subs: [] },
  { id: '162-20', lab: 'CM-01-162', sn: 20, desc: 'Electrodes', htms: '118021', ku: '94228', model: '260-20001', mfg: 'Laerdal', serial: '260M08130001', status: 'Operational', subs: [] },
  { id: '162-21', lab: 'CM-01-162', sn: 21, desc: 'Simulators, Training, Airway Management/Intubation', htms: '118024', ku: '94221', model: '25 00 00 33', mfg: 'Laerdal', serial: 'AMSR18.1', status: 'Operational', subs: [] }
];

// Contingency log entries start empty; they're added in the portal.
export const INITIAL_LOGS = [];

// ---------------- Access ----------------
// The portal is for the skills laboratory custodian and selected faculty members only.
// The master administrator is the only account that can create or remove staff accounts,
// and it can't be deleted. Passwords are stored as SHA-256 hashes, never as plain text.
export const MASTER_ADMIN = {
  username: 'amufti',
  passwordHash: '1f18cb513d4c08be1532fc6b5d39cac03fe1bdae6879303accc64f175365a715',
  name: 'Abdulrahman Mufti',
  badge: '919670',
  role: 'Master Administrator',
  position: 'Skills Laboratory Custodian, Respiratory Therapy Program',
  recoveryHash: '7364991689beaa1476ec8b6eec89c8f0e4fd44f1eab652be90ddd7f4a706fe0c',
  perms: { editEq: true, logIssue: true, manageLabs: true, manageUsers: true }
};

export const INITIAL_USERS = [MASTER_ADMIN];

// Accounts removed automatically whenever the portal loads (former HTMS engineer access).
// Any account whose name or title mentions "Engineer", "Eng." or "HTMS" is removed as well.
export const REMOVED_USERNAMES = ['admin'];

// Contingency log entries recorded under these badge numbers are removed whenever the portal loads
// (the former HTMS engineer's sign-offs).
export const REMOVED_LOG_BADGES = ['68459'];

// Device statuses used by the portal. Calibration and preventive maintenance are handled by HTMS,
// so they aren't tracked here.
export const STATUSES = ['Operational', 'Maintenance', 'Contingency / Fault'];
