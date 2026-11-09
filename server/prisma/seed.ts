import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Comprehensive LEXORA Database Seeding (Phase 5)...');

  // 1. Clean existing records in safe referential order
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.taskAssignment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.documentAccess.deleteMany();
  await prisma.documentVersion.deleteMany();
  await prisma.document.deleteMany();
  await prisma.caseDiary.deleteMany();
  await prisma.caseProceeding.deleteMany();
  await prisma.hearing.deleteMany();
  await prisma.caseLegalReference.deleteMany();
  await prisma.legalReference.deleteMany();
  await prisma.caseHistory.deleteMany();
  await prisma.caseStage.deleteMany();
  await prisma.caseAssignment.deleteMany();
  await prisma.caseParty.deleteMany();
  await prisma.case.deleteMany();
  await prisma.clientContact.deleteMany();
  await prisma.client.deleteMany();
  await prisma.judge.deleteMany();
  await prisma.court.deleteMany();
  await prisma.practiceArea.deleteMany();
  await prisma.userPermission.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.user.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.department.deleteMany();
  await prisma.workspaceSetting.deleteMany();
  await prisma.workspace.deleteMany();

  // 2. Create Workspace
  const workspace = await prisma.workspace.create({
    data: {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'LEXORA Law Chambers & Partners',
      legalName: 'Lexora Advocates & Legal Consultants LLP',
      registrationNo: 'LLP-2024-KHI-0982',
      email: 'contact@lexora.demo',
      phone: '+92 21 3582 9900',
      address: 'Suite 701-705, Executive Towers, Clifton Block 4',
      city: 'Karachi',
      country: 'Pakistan',
      currency: 'PKR',
      currencySymbol: 'Rs.',
      primaryColor: '#4F46E5'
    }
  });

  // 3. Departments
  const deptLitigation = await prisma.department.create({
    data: { name: 'Litigation & Dispute Resolution', description: 'Civil, Constitutional, and Criminal Trials & Appeals' }
  });
  const deptCorporate = await prisma.department.create({
    data: { name: 'Corporate & Commercial Advisory', description: 'Mergers, Contracts, and Regulatory Compliance' }
  });
  const deptTax = await prisma.department.create({
    data: { name: 'Taxation & Banking', description: 'Direct/Indirect Tax and Financial Recovery' }
  });
  const deptAdmin = await prisma.department.create({
    data: { name: 'Operations & Registry', description: 'Court filings, Registry, and Financials' }
  });

  // 4. Practice Areas (13 practice areas)
  const practiceAreasData = [
    { name: 'Constitutional', code: 'CONST', description: 'Writ petitions, Fundamental rights, Judicial review' },
    { name: 'Civil', code: 'CIVIL', description: 'Contracts, Recovery, Injunctions, Specific relief' },
    { name: 'Corporate', code: 'CORP', description: 'M&A, Company law, Securities, Due diligence' },
    { name: 'Criminal', code: 'CRIM', description: 'Bail matters, Trials, Criminal revisions, Appeals' },
    { name: 'Commercial', code: 'COMM', description: 'Arbitration, International trade, Partnership disputes' },
    { name: 'Property', code: 'PROP', description: 'Land revenue, Real estate, Title disputes, Tenancy' },
    { name: 'Tax', code: 'TAX', description: 'Income tax, Sales tax, Customs, Appellate tribunals' },
    { name: 'Banking', code: 'BANK', description: 'Financial recovery, Loan restructuring, Financial crimes' },
    { name: 'Family', code: 'FAM', description: 'Custody, Guardianship, Succession, Dissolution' },
    { name: 'Labour', code: 'LAB', description: 'Industrial relations, Employment contracts, NIRC matters' },
    { name: 'Intellectual Property', code: 'IP', description: 'Trademarks, Patents, Copyright infringements' },
    { name: 'Administrative', code: 'ADMIN', description: 'Service tribunals, Civil service appeals, Public law' },
    { name: 'Other', code: 'OTHER', description: 'Miscellaneous legal matters' }
  ];

  const practiceAreaMap = new Map<string, string>();
  for (const pa of practiceAreasData) {
    const created = await prisma.practiceArea.create({ data: pa });
    practiceAreaMap.set(pa.code, created.id);
  }

  // 5. 20 Court Records across Jurisdictions
  const courtsData = [
    { name: 'Supreme Court of Pakistan', type: 'Supreme Court', city: 'Islamabad', jurisdiction: 'Federal Apex Court', address: 'Constitution Avenue, Islamabad' },
    { name: 'High Court of Sindh (Principal Seat)', type: 'High Court', city: 'Karachi', jurisdiction: 'Sindh High Court', address: 'Court Road, Saddar, Karachi' },
    { name: 'Lahore High Court', type: 'High Court', city: 'Lahore', jurisdiction: 'Punjab High Court', address: 'The Mall, Lahore' },
    { name: 'Islamabad High Court', type: 'High Court', city: 'Islamabad', jurisdiction: 'Islamabad Capital Territory', address: 'Sector G-5, Islamabad' },
    { name: 'Peshawar High Court', type: 'High Court', city: 'Peshawar', jurisdiction: 'KPK High Court', address: 'Khyber Road, Peshawar' },
    { name: 'High Court of Balochistan', type: 'High Court', city: 'Quetta', jurisdiction: 'Balochistan High Court', address: 'Hali Road, Quetta' },
    { name: 'District & Sessions Court Karachi South', type: 'District Court', city: 'Karachi', jurisdiction: 'District South Karachi', address: 'City Courts, Karachi' },
    { name: 'District & Sessions Court Karachi East', type: 'District Court', city: 'Karachi', jurisdiction: 'District East Karachi', address: 'City Courts, Karachi' },
    { name: 'District & Sessions Court Lahore', type: 'District Court', city: 'Lahore', jurisdiction: 'District Lahore', address: 'Session Court Compound, Lahore' },
    { name: 'Banking Court No. 1 Karachi', type: 'Banking Court', city: 'Karachi', jurisdiction: 'Special Banking Court', address: 'Old Assembly Building, Karachi' },
    { name: 'Banking Court No. 2 Karachi', type: 'Banking Court', city: 'Karachi', jurisdiction: 'Special Banking Court', address: 'Old Assembly Building, Karachi' },
    { name: 'Customs, Taxation & Anti-Smuggling Court', type: 'Special Tribunal', city: 'Karachi', jurisdiction: 'Federal Customs Court', address: 'Customs House, Karachi' },
    { name: 'National Industrial Relations Commission (NIRC)', type: 'Labour Tribunal', city: 'Karachi', jurisdiction: 'Federal Labour Jurisdiction', address: 'Civic Centre, Karachi' },
    { name: 'Sindh Labour Court No. 1', type: 'Labour Court', city: 'Karachi', jurisdiction: 'Provincial Labour Jurisdiction', address: 'Labour Complex, Karachi' },
    { name: 'Family Court Karachi South', type: 'Family Court', city: 'Karachi', jurisdiction: 'Family Matters', address: 'City Courts, Karachi' },
    { name: 'Intellectual Property Tribunal', type: 'Special Tribunal', city: 'Karachi', jurisdiction: 'IPO Pakistan Jurisdiction', address: 'Sindh High Court Annexe' },
    { name: 'Federal Service Tribunal', type: 'Administrative Tribunal', city: 'Islamabad', jurisdiction: 'Civil Service Grievances', address: 'Ataturk Avenue, Islamabad' },
    { name: 'Appellate Tribunal Inland Revenue (ATIR)', type: 'Tax Tribunal', city: 'Karachi', jurisdiction: 'FBR Appellate Forum', address: 'Income Tax Building, Karachi' },
    { name: 'Accountability Court No. 1', type: 'Special Court', city: 'Karachi', jurisdiction: 'National Accountability Bureau', address: 'High Court Road, Karachi' },
    { name: 'Commercial Court Karachi', type: 'Commercial Court', city: 'Karachi', jurisdiction: 'Commercial Disputes', address: 'Sindh Judicial Academy Complex' }
  ];

  const courtList: any[] = [];
  for (const c of courtsData) {
    const created = await prisma.court.create({
      data: { workspaceId: workspace.id, ...c }
    });
    courtList.push(created);

    // Add 1 judge per court
    await prisma.judge.create({
      data: {
        courtId: created.id,
        name: `Justice / Judge ${c.name.split(' ')[0]} Presiding`,
        designation: c.type.includes('High') || c.type.includes('Supreme') ? 'Honourable Justice' : 'Presiding Officer',
        courtroom: `Courtroom ${Math.floor(Math.random() * 8) + 1}`
      }
    });
  }

  // 6. Roles & Granular Permissions
  const rolesList = [
    { name: 'Firm Admin', displayName: 'Firm Administrator', description: 'Full workspace authority and configurations', isSystem: true },
    { name: 'Senior Advocate', displayName: 'Senior Advocate / Partner', description: 'Supervises cases, leads litigation', isSystem: true },
    { name: 'Associate Advocate', displayName: 'Associate Advocate', description: 'Assigned case work and representation', isSystem: true },
    { name: 'Junior Advocate', displayName: 'Junior Advocate', description: 'Legal research and drafting', isSystem: true },
    { name: 'Clerk', displayName: 'Legal Clerk', description: 'Manages court schedules and filings', isSystem: true },
    { name: 'Accountant', displayName: 'Accountant / Finance Officer', description: 'Invoices and payments', isSystem: true },
    { name: 'Client', displayName: 'Client Portal User', description: 'Restricted personal client portal', isSystem: true }
  ];

  const roleMap = new Map<string, string>();
  for (const r of rolesList) {
    const createdRole = await prisma.role.create({ data: r });
    roleMap.set(r.name, createdRole.id);
  }

  const permissionsList = [
    { code: 'case.view', module: 'Cases', action: 'view', description: 'View assigned cases' },
    { code: 'case.view_all', module: 'Cases', action: 'view_all', description: 'View all cases' },
    { code: 'case.create', module: 'Cases', action: 'create', description: 'Create legal cases' },
    { code: 'case.edit', module: 'Cases', action: 'edit', description: 'Edit case details' },
    { code: 'case.delete', module: 'Cases', action: 'delete', description: 'Archive or delete cases' },
    { code: 'case.assign', module: 'Cases', action: 'assign', description: 'Assign advocates to cases' },
    { code: 'case.close', module: 'Cases', action: 'close', description: 'Close cases' },
    { code: 'client.view', module: 'Clients', action: 'view', description: 'View clients' },
    { code: 'client.create', module: 'Clients', action: 'create', description: 'Register clients' },
    { code: 'client.edit', module: 'Clients', action: 'edit', description: 'Edit client profiles' },
    { code: 'client.delete', module: 'Clients', action: 'delete', description: 'Archive clients' },
    { code: 'document.view', module: 'Documents', action: 'view', description: 'View documents' },
    { code: 'document.upload', module: 'Documents', action: 'upload', description: 'Upload documents' },
    { code: 'document.download', module: 'Documents', action: 'download', description: 'Download documents' },
    { code: 'document.delete', module: 'Documents', action: 'delete', description: 'Delete documents' },
    { code: 'document.manage_versions', module: 'Documents', action: 'manage_versions', description: 'Manage revisions' },
    { code: 'hearing.view', module: 'Hearings', action: 'view', description: 'View hearings' },
    { code: 'hearing.create', module: 'Hearings', action: 'create', description: 'Schedule hearings' },
    { code: 'hearing.edit', module: 'Hearings', action: 'edit', description: 'Record outcomes' },
    { code: 'task.view', module: 'Tasks', action: 'view', description: 'View tasks' },
    { code: 'task.create', module: 'Tasks', action: 'create', description: 'Create tasks' },
    { code: 'task.edit', module: 'Tasks', action: 'edit', description: 'Update task progress' },
    { code: 'billing.view', module: 'Finance', action: 'view', description: 'View invoices' },
    { code: 'billing.create', module: 'Finance', action: 'create', description: 'Create invoices' },
    { code: 'billing.edit', module: 'Finance', action: 'edit', description: 'Edit billing' },
    { code: 'billing.manage_payments', module: 'Finance', action: 'manage_payments', description: 'Record payments' },
    { code: 'billing.reports', module: 'Finance', action: 'reports', description: 'Financial reports' },
    { code: 'user.manage', module: 'Administration', action: 'user.manage', description: 'Manage users' },
    { code: 'role.manage', module: 'Administration', action: 'role.manage', description: 'Manage roles' },
    { code: 'permission.manage', module: 'Administration', action: 'permission.manage', description: 'Manage permissions' },
    { code: 'audit.view', module: 'Administration', action: 'audit.view', description: 'View audit logs' },
    { code: 'settings.manage', module: 'Administration', action: 'settings.manage', description: 'Manage settings' },
    { code: 'report.view', module: 'Reports', action: 'view', description: 'View reports' },
    { code: 'report.export', module: 'Reports', action: 'export', description: 'Export reports' }
  ];

  const permMap = new Map<string, string>();
  for (const p of permissionsList) {
    const createdPerm = await prisma.permission.create({ data: p });
    permMap.set(p.code, createdPerm.id);
  }

  const assignPermissionsToRole = async (roleName: string, codes: string[]) => {
    const roleId = roleMap.get(roleName);
    if (!roleId) return;
    for (const code of codes) {
      const permissionId = permMap.get(code);
      if (permissionId) {
        await prisma.rolePermission.create({ data: { roleId, permissionId } });
      }
    }
  };

  await assignPermissionsToRole('Firm Admin', permissionsList.map(p => p.code));
  await assignPermissionsToRole('Senior Advocate', [
    'case.view', 'case.view_all', 'case.create', 'case.edit', 'case.assign', 'case.close',
    'client.view', 'client.create', 'client.edit', 'document.view', 'document.upload', 'document.download',
    'hearing.view', 'hearing.create', 'hearing.edit', 'task.view', 'task.create', 'task.edit',
    'billing.view', 'billing.create', 'billing.reports', 'report.view', 'report.export', 'audit.view'
  ]);
  await assignPermissionsToRole('Associate Advocate', [
    'case.view', 'case.view_all', 'case.create', 'case.edit', 'client.view', 'client.create',
    'document.view', 'document.upload', 'document.download', 'hearing.view', 'hearing.create', 'hearing.edit',
    'task.view', 'task.create', 'task.edit', 'billing.view', 'report.view'
  ]);
  await assignPermissionsToRole('Junior Advocate', [
    'case.view', 'client.view', 'document.view', 'document.upload', 'document.download',
    'hearing.view', 'task.view', 'task.edit'
  ]);
  await assignPermissionsToRole('Clerk', [
    'case.view', 'client.view', 'document.view', 'document.upload', 'document.download',
    'hearing.view', 'hearing.create', 'hearing.edit', 'task.view', 'task.edit'
  ]);
  await assignPermissionsToRole('Accountant', [
    'client.view', 'case.view', 'billing.view', 'billing.create', 'billing.edit', 'billing.manage_payments', 'billing.reports',
    'report.view', 'report.export'
  ]);
  await assignPermissionsToRole('Client', ['case.view', 'document.view', 'document.download', 'billing.view']);

  // 7. 10 Advocates & Staff Users
  const passwordHash = await bcrypt.hash('Demo@123', 10);

  const usersData = [
    { email: 'admin@lexora.demo', firstName: 'Barrister Zafar', lastName: 'Iqbal', designation: 'Managing Partner', role: 'Firm Admin', dept: deptLitigation.id },
    { email: 'senior@lexora.demo', firstName: 'Aitzaz', lastName: 'Hussain', designation: 'Senior Advocate Supreme Court', role: 'Senior Advocate', dept: deptLitigation.id },
    { email: 'associate@lexora.demo', firstName: 'Mahnoor', lastName: 'Rehman', designation: 'Senior Associate Counsel', role: 'Associate Advocate', dept: deptCorporate.id },
    { email: 'junior@lexora.demo', firstName: 'Hamza', lastName: 'Tariq', designation: 'Junior Advocate', role: 'Junior Advocate', dept: deptLitigation.id },
    { email: 'clerk@lexora.demo', firstName: 'Muhammad', lastName: 'Rashid', designation: 'Head Court Clerk', role: 'Clerk', dept: deptAdmin.id },
    { email: 'accountant@lexora.demo', firstName: 'Fatima', lastName: 'Bilal', designation: 'Chief Finance Officer', role: 'Accountant', dept: deptAdmin.id },
    { email: 'client@lexora.demo', firstName: 'Kamran', lastName: 'Siddiqui', designation: 'Director Indus Retailers', role: 'Client', dept: null },
    { email: 'asif.partner@lexora.demo', firstName: 'Asif', lastName: 'Saeed', designation: 'Partner - Corporate Advisory', role: 'Senior Advocate', dept: deptCorporate.id },
    { email: 'sana.associate@lexora.demo', firstName: 'Sana', lastName: 'Mir', designation: 'Associate - Tax & Customs', role: 'Associate Advocate', dept: deptTax.id },
    { email: 'bilal.clerk@lexora.demo', firstName: 'Bilal', lastName: 'Akram', designation: 'Sessions Filing Clerk', role: 'Clerk', dept: deptAdmin.id }
  ];

  const userList: any[] = [];
  for (const u of usersData) {
    const user = await prisma.user.create({
      data: {
        workspaceId: workspace.id,
        email: u.email,
        passwordHash,
        firstName: u.firstName,
        lastName: u.lastName,
        designation: u.designation,
        departmentId: u.dept,
        phone: '+92 300 ' + Math.floor(1000000 + Math.random() * 9000000),
        themePreference: 'light'
      }
    });
    const roleId = roleMap.get(u.role)!;
    await prisma.userRole.create({ data: { userId: user.id, roleId } });
    userList.push(user);
  }

  const [adminUser, seniorUser, associateUser, juniorUser, clerkUser, accountantUser, clientUser] = userList;

  // 8. 30 Realistic Clients (Corporate & Individual)
  const corporateNames = [
    'Indus Retailers Pvt Ltd', 'Habib & Sons Logistics Ltd', 'NovaTech FinTech Solutions',
    'Lucky Cement & Building Supplies', 'Engro Agricultural Polymers', 'Fauji Fertilizer Consortium',
    'K-Electric Distribution Unit', 'Pakistan Telecommunication Corp', 'Systems Limited Digital',
    'Dawlance Electronics Pakistan', 'National Bank Commercial Unit', 'Standard Chartered Advisory',
    'Shan Foods Global Distribution', 'Aga Khan University Hospital', 'Al-Meezan Investment Fund'
  ];

  const individualNames = [
    'Dr. Shahida Parveen', 'Malik Jahangir Khan', 'Chaudhry Riaz Ahmed', 'Begum Nusrat Bhutto',
    'Naseeruddin Shah', 'Barrister Murtaza Wahab', 'Zubaida Tariq Khan', 'Sardar Usman Buzdar',
    'Captain Tariq Mehmood', 'Syeda Fatima Zahra', 'Qazi Faez Isa Associates', 'Dr. Abdul Qadeer Estate',
    'Advocate Salman Akram', 'Farooq Sattar Properties', 'Justice Retd. Mian Saqib'
  ];

  const clientList: any[] = [];
  let clientIndex = 1;

  for (const cName of corporateNames) {
    const clt = await prisma.client.create({
      data: {
        workspaceId: workspace.id,
        clientReference: `CLT-2026-${String(clientIndex++).padStart(4, '0')}`,
        type: 'corporate',
        name: cName,
        organization: cName.split(' ')[0] + ' Group',
        email: `counsel@${cName.toLowerCase().replace(/[^a-z0-9]/g, '')}.demo`,
        phone: '+92 21 ' + Math.floor(30000000 + Math.random() * 9000000),
        address: `Tower ${Math.floor(Math.random() * 10) + 1}, Clifton Block 4`,
        city: 'Karachi',
        jurisdiction: 'Sindh',
        nationalId: `${Math.floor(1000000 + Math.random() * 9000000)}-${Math.floor(Math.random() * 9)} (NTN)`,
        clientType: 'retained',
        status: 'active',
        assignedAdvocateId: seniorUser.id,
        portalUserId: cName.includes('Indus') ? clientUser.id : null,
        notes: 'Corporate client on general retained counsel agreement.'
      }
    });

    await prisma.clientContact.create({
      data: {
        clientId: clt.id,
        name: `Taimoor ${clt.name.split(' ')[0]}`,
        designation: 'Head of Legal & Compliance',
        email: `legal.${clt.email}`,
        phone: '+92 300 ' + Math.floor(1000000 + Math.random() * 9000000),
        isPrimary: true
      }
    });
    clientList.push(clt);
  }

  for (const iName of individualNames) {
    const clt = await prisma.client.create({
      data: {
        workspaceId: workspace.id,
        clientReference: `CLT-2026-${String(clientIndex++).padStart(4, '0')}`,
        type: 'individual',
        name: iName,
        email: `${iName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@gmail.demo`,
        phone: '+92 321 ' + Math.floor(1000000 + Math.random() * 9000000),
        address: `House ${Math.floor(Math.random() * 90) + 1}, Street 4, Phase VI, DHA`,
        city: 'Karachi',
        jurisdiction: 'Sindh',
        nationalId: `42201-${Math.floor(1000000 + Math.random() * 9000000)}-1`,
        clientType: Math.random() > 0.5 ? 'retained' : 'walk_in',
        status: 'active',
        assignedAdvocateId: Math.random() > 0.5 ? seniorUser.id : associateUser.id,
        notes: 'Individual private client matter.'
      }
    });
    clientList.push(clt);
  }

  // 9. 50 Realistic Legal Cases across Practice Areas
  const stages = [
    'Consultation', 'Client Onboarding', 'Preparation', 'Filing',
    'Notice / Summons', 'Written Statement / Response', 'Issues',
    'Evidence', 'Arguments', 'Judgment', 'Appeal', 'Execution', 'Closed'
  ];

  const caseTitles = [
    { title: 'Indus Retailers vs. Atlas Logistics & Cargo Ltd', type: 'Commercial Suit', pa: 'COMM', pr: 'high', stage: 'Evidence' },
    { title: 'Dr. Shahida Parveen vs. Karachi Cantonment Board', type: 'Civil Injunction', pa: 'CIVIL', pr: 'urgent', stage: 'Notice / Summons' },
    { title: 'Habib & Sons Logistics vs. Federal Board of Revenue', type: 'Writ Petition', pa: 'TAX', pr: 'high', stage: 'Arguments' },
    { title: 'Standard Chartered Bank vs. NovaTech FinTech Solutions', type: 'Banking Suit', pa: 'BANK', pr: 'medium', stage: 'Written Statement / Response' },
    { title: 'Lucky Cement Ltd vs. Competition Commission of Pakistan', type: 'Constitutional Appeal', pa: 'CONST', pr: 'urgent', stage: 'Arguments' },
    { title: 'Fauji Fertilizer vs. Sui Northern Gas Pipelines', type: 'Arbitration Petition', pa: 'COMM', pr: 'high', stage: 'Evidence' },
    { title: 'State Bank of Pakistan vs. Indus FinTech Holdings', type: 'Regulatory Review', pa: 'BANK', pr: 'high', stage: 'Consultation' },
    { title: 'K-Electric Distribution vs. Sindh Revenue Board', type: 'Sales Tax Reference', pa: 'TAX', pr: 'medium', stage: 'Filing' },
    { title: 'PTCL Labour Union vs. Pakistan Telecommunication Corp', type: 'Industrial Dispute', pa: 'LAB', pr: 'medium', stage: 'Issues' },
    { title: 'Systems Ltd vs. CyberTech Intellectual Infringement', type: 'Trademark Suit', pa: 'IP', pr: 'urgent', stage: 'Evidence' },
    { title: 'Malik Jahangir Khan vs. Land Acquisition Collector', type: 'Land Revenue Revision', pa: 'PROP', pr: 'high', stage: 'Arguments' },
    { title: 'Dawlance Electronics vs. Collector of Customs Appraisement', type: 'Customs Appeal', pa: 'TAX', pr: 'medium', stage: 'Written Statement / Response' },
    { title: 'Chaudhry Riaz Ahmed vs. LDA Housing Directorate', type: 'Specific Relief Suit', pa: 'PROP', pr: 'medium', stage: 'Preparation' },
    { title: 'Aga Khan University Hospital vs. Sindh Healthcare Commission', type: 'Constitutional Writ', pa: 'CONST', pr: 'high', stage: 'Notice / Summons' },
    { title: 'Shan Foods Global vs. Spice Valley Trademark Infringer', type: 'Copyright Injunction', pa: 'IP', pr: 'urgent', stage: 'Issues' },
    { title: 'The State vs. Tariq Mehmood & Others', type: 'Pre-Arrest Bail Petition', pa: 'CRIM', pr: 'urgent', stage: 'Arguments' },
    { title: 'Syeda Fatima Zahra vs. Ali Raza Succession Suit', type: 'Family Guardianship', pa: 'FAM', pr: 'medium', stage: 'Evidence' },
    { title: 'National Bank vs. Al-Karam Textile Mills Recovery', type: 'Recovery of Finance', pa: 'BANK', pr: 'high', stage: 'Judgment' },
    { title: 'Naseeruddin Shah vs. Defence Housing Authority Title', type: 'Declaration of Title', pa: 'PROP', pr: 'medium', stage: 'Notice / Summons' },
    { title: 'Engro Polymers vs. Environmental Protection Agency', type: 'Tribunal Appeal', pa: 'ADMIN', pr: 'medium', stage: 'Consultation' },
    { title: 'Begum Nusrat Bhutto vs. Evacuee Trust Property Board', type: 'Property Restitution', pa: 'PROP', pr: 'high', stage: 'Arguments' },
    { title: 'Captain Tariq Mehmood vs. Ministry of Defence Pension', type: 'Service Tribunal Appeal', pa: 'ADMIN', pr: 'medium', stage: 'Filing' },
    { title: 'Al-Meezan Investment vs. Securities & Exchange Commission', type: 'Company Law Petition', pa: 'CORP', pr: 'high', stage: 'Preparation' },
    { title: 'Farooq Sattar vs. Cantonment Board Municipal Tax', type: 'Civil Appeal', pa: 'CIVIL', pr: 'low', stage: 'Issues' },
    { title: 'Zubaida Tariq vs. K-Electric High Tension Wire Removal', type: 'Permanent Injunction', pa: 'CIVIL', pr: 'medium', stage: 'Evidence' }
  ];

  // Repeat/expand list up to 50
  while (caseTitles.length < 50) {
    const idx = caseTitles.length + 1;
    caseTitles.push({
      title: `Matter No. ${idx}: ${corporateNames[idx % corporateNames.length]} Legal Docket`,
      type: 'Commercial Suit',
      pa: ['COMM', 'CIVIL', 'TAX', 'BANK', 'CORP', 'CONST', 'CRIM'][idx % 7],
      pr: ['low', 'medium', 'high', 'urgent'][idx % 4],
      stage: stages[idx % stages.length]
    });
  }

  const caseList: any[] = [];
  for (let i = 0; i < caseTitles.length; i++) {
    const cMeta = caseTitles[i];
    const client = clientList[i % clientList.length];
    const court = courtList[i % courtList.length];
    const internalReference = `LEX-2026-${String(i + 1).padStart(4, '0')}`;

    const createdCase = await prisma.case.create({
      data: {
        workspaceId: workspace.id,
        clientId: client.id,
        practiceAreaId: practiceAreaMap.get(cMeta.pa) || practiceAreaMap.get('CIVIL')!,
        courtId: court.id,
        internalReference,
        courtCaseNumber: `Suit / W.P. No. ${100 + i}/2026`,
        title: cMeta.title,
        caseType: cMeta.type,
        jurisdiction: court.jurisdiction || 'High Court of Sindh',
        judgeName: `Presiding Judge ${court.city}`,
        plaintiffPetitioner: client.name,
        defendantRespondent: 'Opposing Party / Statutory Respondent',
        opposingCounsel: 'Advocate Mansoor Ali & Co.',
        opposingParties: 'Principal Defendant & Government Department',
        filingDate: new Date('2026-01-10'),
        currentStage: cMeta.stage,
        status: cMeta.stage === 'Closed' ? 'closed' : 'active',
        priority: cMeta.pr,
        description: `Formal legal matter regarding ${cMeta.type} pending before ${court.name}.`,
        financialAgreement: 'Fixed fee plus expenses',
        agreedFee: (Math.floor(Math.random() * 15) + 3) * 100000,
        importantNotes: 'Key statutory dates and pleadings verified by legal research associate.',
        stages: {
          create: stages.map((s, idx) => ({
            stageName: s,
            orderIndex: idx,
            status: s === cMeta.stage ? 'in_progress' : idx < stages.indexOf(cMeta.stage) ? 'completed' : 'pending',
            startedAt: idx <= stages.indexOf(cMeta.stage) ? new Date('2026-01-15') : null
          }))
        },
        assignments: {
          create: [
            { userId: seniorUser.id, roleInCase: 'Lead Supervising Partner' },
            { userId: associateUser.id, roleInCase: 'Associate Advocate' },
            { userId: clerkUser.id, roleInCase: 'Court Filing Clerk' }
          ]
        },
        history: {
          create: {
            action: 'Case Docket Registered',
            description: `Registered matter ${internalReference} before ${court.name}`,
            performedBy: adminUser.email
          }
        }
      }
    });

    caseList.push(createdCase);
  }

  // 10. 40 Court Hearing Records
  for (let i = 0; i < 40; i++) {
    const parentCase = caseList[i % caseList.length];
    const hearingDate = new Date();
    // Some in past, some upcoming tomorrow, some next week
    hearingDate.setDate(hearingDate.getDate() + (i - 10));
    hearingDate.setHours(9, (i % 4) * 15, 0, 0);

    const isPast = i < 10;
    await prisma.hearing.create({
      data: {
        caseId: parentCase.id,
        courtId: parentCase.courtId,
        hearingDate,
        hearingTime: `09:${String((i % 4) * 15).padStart(2, '0')} AM`,
        courtroom: `Courtroom ${(i % 6) + 1}`,
        assignedAdvocateId: i % 2 === 0 ? seniorUser.id : associateUser.id,
        purpose: ['Framing of Issues', 'Evidence of PW-1', 'Final Arguments', 'Notice Hearing', 'Stay Application'][i % 5],
        status: isPast ? 'completed' : 'scheduled',
        proceedingsSummary: isPast ? 'Arguments presented by counsel. Matter proceeded smoothly.' : null,
        bench: 'Single Bench'
      }
    });
  }

  // 11. 40 Tasks across Legal Teams
  for (let i = 0; i < 40; i++) {
    const parentCase = caseList[i % caseList.length];
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (i % 15) + 1);

    const task = await prisma.task.create({
      data: {
        workspaceId: workspace.id,
        caseId: parentCase.id,
        clientId: parentCase.clientId,
        title: [
          'Draft Written Statement and Counter-Affidavit',
          'Legal Research on High Court Precedents',
          'Prepare Exhibit Files and Pleading Bundles',
          'Client Witness Conference and Preparation',
          'Pay Court Fee Stamps and Registry Processing'
        ][i % 5] + ` (${parentCase.internalReference})`,
        description: 'Ensure compliance with High Court Rules and certify all attached annexures.',
        taskType: ['Drafting', 'Legal Research', 'Evidence Preparation', 'Client Meeting', 'Filing'][i % 5],
        priority: ['urgent', 'high', 'medium', 'low'][i % 4],
        status: ['todo', 'in_progress', 'review', 'completed'][i % 4],
        dueDate,
        createdById: seniorUser.id,
        assignments: {
          create: [{ userId: i % 2 === 0 ? associateUser.id : juniorUser.id }]
        }
      }
    });
  }

  // 12. 25 Invoices with Realized Payments & Expenses
  for (let i = 0; i < 25; i++) {
    const parentCase = caseList[i % caseList.length];
    const invTotal = (Math.floor(Math.random() * 8) + 2) * 100000;
    const isPaid = i % 3 === 0;
    const isPartial = i % 3 === 1;
    const amountPaid = isPaid ? invTotal : isPartial ? Math.floor(invTotal * 0.5) : 0;
    const balanceDue = invTotal - amountPaid;

    const invoice = await prisma.invoice.create({
      data: {
        workspaceId: workspace.id,
        clientId: parentCase.clientId,
        caseId: parentCase.id,
        invoiceNumber: `INV-2026-${String(i + 1).padStart(4, '0')}`,
        issueDate: new Date('2026-02-01'),
        dueDate: new Date('2026-03-15'),
        feeType: 'Fixed',
        subtotal: invTotal,
        totalAmount: invTotal,
        amountPaid,
        balanceDue,
        status: isPaid ? 'paid' : isPartial ? 'partial' : 'sent',
        notes: 'Professional legal fee statement for High Court litigation.',
        createdById: accountantUser.id,
        items: {
          create: [
            {
              description: 'Legal Representation, Pleadings Drafting & Court Appearances',
              quantity: 1,
              unitPrice: invTotal,
              amount: invTotal
            }
          ]
        }
      }
    });

    if (amountPaid > 0) {
      await prisma.payment.create({
        data: {
          invoiceId: invoice.id,
          paymentNumber: `REC-2026-${String(i + 1).padStart(4, '0')}`,
          amount: amountPaid,
          paymentMethod: 'Bank Transfer',
          referenceNo: `RTGS-TXN-${89000 + i}`,
          notes: 'Settlement credited to chambers operating account.',
          recordedById: accountantUser.id
        }
      });
    }

    // Litigation expense
    await prisma.expense.create({
      data: {
        workspaceId: workspace.id,
        caseId: parentCase.id,
        category: ['Court Fee', 'Filing Fee', 'Documentation', 'Travel'][i % 4],
        title: `Litigation Disbursement for ${parentCase.internalReference}`,
        amount: (Math.floor(Math.random() * 15) + 3) * 1000,
        paymentMethod: 'Cash',
        receiptNumber: `RCP-EXP-${500 + i}`,
        isBillable: true,
        recordedById: clerkUser.id
      }
    });
  }

  // 13. 50 Documents in Document Management Vault
  const docCategories = [
    'Plaint', 'Written Statement', 'Petition', 'Application',
    'Affidavit', 'Vakalatnama', 'Evidence', 'Court Order', 'Judgment'
  ];

  for (let i = 0; i < 50; i++) {
    const parentCase = caseList[i % caseList.length];
    const cat = docCategories[i % docCategories.length];
    await prisma.document.create({
      data: {
        workspaceId: workspace.id,
        caseId: parentCase.id,
        clientId: parentCase.clientId,
        title: `${cat} — ${parentCase.internalReference} (${parentCase.courtCaseNumber || 'Original Side'})`,
        originalName: `${cat.toLowerCase().replace(/[^a-z0-9]/g, '_')}_final.pdf`,
        storedFilename: `doc_seed_${i + 1}.pdf`,
        filePath: `storage/uploads/doc_seed_${i + 1}.pdf`,
        fileSize: (Math.floor(Math.random() * 4000) + 500) * 1024,
        mimeType: 'application/pdf',
        extension: 'pdf',
        category: cat,
        tags: 'Verified, Court Stamp, High Court',
        uploadedById: associateUser.id,
        versions: {
          create: {
            versionNumber: 1,
            storedFilename: `doc_seed_${i + 1}.pdf`,
            filePath: `storage/uploads/doc_seed_${i + 1}.pdf`,
            fileSize: 1024 * 1024,
            changesSummary: 'Official court certified copy',
            uploadedBy: associateUser.email
          }
        }
      }
    });
  }

  // 14. Notifications & Audit Logs
  await prisma.notification.createMany({
    data: [
      { userId: seniorUser.id, title: 'Upcoming Court Appearance', message: 'Hearing listed before High Court Room 3 tomorrow at 09:30 AM.', type: 'hearing', linkUrl: '/hearings' },
      { userId: associateUser.id, title: 'Drafting Task Assigned', message: 'Please prepare rejoinder in LEX-2026-0001.', type: 'task', linkUrl: '/tasks' },
      { userId: accountantUser.id, title: 'Payment Settlement Received', message: 'Rs. 500,000 received for INV-2026-0002.', type: 'billing', linkUrl: '/finance' }
    ]
  });

  await prisma.auditLog.createMany({
    data: [
      { workspaceId: workspace.id, userId: adminUser.id, action: 'CREATE', module: 'Cases', entityId: caseList[0].id, entityName: caseList[0].internalReference, ipAddress: '127.0.0.1' },
      { workspaceId: workspace.id, userId: accountantUser.id, action: 'CREATE', module: 'Finance', entityId: 'INV-2026-0001', entityName: 'Invoice Generated', ipAddress: '127.0.0.1' }
    ]
  });

  console.log('✅ Comprehensive LEXORA Database Seeding Completed!');
  console.log(`📊 Seed Summary:`);
  console.log(` - 30 Clients Registered`);
  console.log(` - 50 Legal Cases Initialized`);
  console.log(` - 20 Courts Configured`);
  console.log(` - 40 Court Hearing Records`);
  console.log(` - 50 Documents Uploaded to Vault`);
  console.log(` - 40 Tasks Assigned to Team`);
  console.log(` - 25 Fee Invoices & Payments Recorded`);
  console.log(` - 10 Advocates & Staff Accounts Ready`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
