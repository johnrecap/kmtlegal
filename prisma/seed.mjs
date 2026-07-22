import fs from "node:fs";
import path from "node:path";
import { createCipheriv, createHash, randomBytes, scryptSync } from "node:crypto";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const policy = JSON.parse(fs.readFileSync(path.join(root, "src", "server", "auth", "policy-data.json"), "utf8"));

const LOCAL_DATABASE_URL = "postgresql://kmt_legal:kmt_legal_dev_password@localhost:5432/kmt_legal";
const appEnv = process.env.APP_ENV ?? "local";
const isProduction = appEnv === "production" || process.env.NODE_ENV === "production";
const databaseUrl = process.env.DATABASE_URL ?? localDatabaseUrl();
const adapter = new PrismaPg(databaseUrl);
const prisma = new PrismaClient({ adapter });

const demoPassword = process.env.KMT_DEMO_PASSWORD || "KmtLocalDev!2026";
const demoTotpSecret = process.env.KMT_DEMO_TOTP_SECRET || "JBSWY3DPEHPK3PXP";
const authSecret = process.env.AUTH_SECRET ?? "local-dev-only-auth-secret-do-not-use-in-production";
const RBAC_ASSIGNMENTS_BOOTSTRAP_KEY = "auth.rbac_assignments_bootstrap";
const seedDocumentFileKey = "seed/kmt-2024-089/contract-final.pdf";
const seedPdfBytes = Buffer.from("%PDF-1.4\n% KMT Legal local demo document\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n");

if (isProduction && !process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required for production seed.");
}

if (isProduction && (process.env.KMT_DEMO_PASSWORD || process.env.KMT_DEMO_TOTP_SECRET)) {
  throw new Error("Production seed must not receive demo credentials.");
}

function localDatabaseUrl() {
  if (isProduction) {
    throw new Error("DATABASE_URL is required for production seed.");
  }

  return LOCAL_DATABASE_URL;
}

function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${salt.toString("base64url")}$${hash.toString("base64url")}`;
}

function sealSecret(value) {
  const key = createHash("sha256").update(authSecret).digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64url")}:${tag.toString("base64url")}:${ciphertext.toString("base64url")}`;
}

async function upsertRole(name) {
  return prisma.role.upsert({
    where: { name },
    create: { name, description: `${name} role`, status: "ACTIVE" },
    update: { description: `${name} role` }
  });
}

async function upsertPermission(key) {
  return prisma.permission.upsert({
    where: { key },
    create: { key, description: `Allows ${key}` },
    update: { description: `Allows ${key}` }
  });
}

async function findOrCreate(model, where, create, update = {}) {
  const existing = await model.findFirst({ where });
  if (existing) {
    return model.update({ where: { id: existing.id }, data: update });
  }
  return model.create({ data: create });
}

async function seedAccessControl() {
  const bootstrapMarker = await prisma.systemSetting.findUnique({
    where: { key: RBAC_ASSIGNMENTS_BOOTSTRAP_KEY },
    select: { id: true }
  });
  const shouldInstallDefaultAssignments = !bootstrapMarker;

  const permissionRows = new Map();
  for (const key of policy.permissions) {
    permissionRows.set(key, await upsertPermission(key));
  }

  const roleRows = new Map();
  for (const name of Object.values(policy.roles)) {
    roleRows.set(name, await upsertRole(name));
  }

  if (shouldInstallDefaultAssignments) {
    for (const [roleName, rolePermissions] of Object.entries(policy.rolePermissions)) {
      const role = roleRows.get(roleName);
      const keys = rolePermissions.includes("*") ? policy.permissions : rolePermissions;
      for (const key of keys) {
        const permission = permissionRows.get(key);
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permission.id
            }
          },
          create: {
            roleId: role.id,
            permissionId: permission.id
          },
          update: {}
        });
      }
    }

    await prisma.systemSetting.upsert({
      where: { key: RBAC_ASSIGNMENTS_BOOTSTRAP_KEY },
      create: {
        key: RBAC_ASSIGNMENTS_BOOTSTRAP_KEY,
        value: { version: 1, source: "seed" }
      },
      update: {}
    });
  }

  return roleRows;
}

async function seedProductionBootstrap() {
  await prisma.systemSetting.upsert({
    where: { key: "storage.driver" },
    create: {
      key: "storage.driver",
      value: {
        driver: "vps-filesystem",
        uploadsDir: process.env.UPLOADS_DIR ?? "/var/lib/kmt-legal/uploads",
        maxUploadMb: 5
      }
    },
    update: {
      value: {
        driver: "vps-filesystem",
        uploadsDir: process.env.UPLOADS_DIR ?? "/var/lib/kmt-legal/uploads",
        maxUploadMb: 5
      }
    }
  });

  await prisma.systemSetting.upsert({
    where: { key: "ai.provider" },
    create: {
      key: "ai.provider",
      value: {
        provider: process.env.AI_PROVIDER ?? "mock",
        model: process.env.AI_MODEL ?? null,
        productionEnabled: false
      }
    },
    update: {
      value: {
        provider: process.env.AI_PROVIDER ?? "mock",
        model: process.env.AI_MODEL ?? null,
        productionEnabled: false
      }
    }
  });

  await prisma.systemSetting.upsert({
    where: { key: "payment.gateway" },
    create: {
      key: "payment.gateway",
      value: {
        activeProvider: process.env.PAYMENT_PROVIDER ?? "paymob"
      }
    },
    update: {}
  });
}

async function upsertUser({ email, name, phone, roleName, status = "ACTIVE" }, roleRows) {
  const role = roleRows.get(roleName);
  return prisma.user.upsert({
    where: { email },
    create: {
      email,
      name,
      phone,
      passwordHash: hashPassword(demoPassword),
      roleId: role.id,
      status,
      locale: "ar"
    },
    update: {
      name,
      phone,
      roleId: role.id,
      status,
      locale: "ar"
    }
  });
}

async function seedUsers(roleRows) {
  const users = {
    superAdmin: await upsertUser(
      { email: "superadmin@kmt.local", name: "مدير النظام التجريبي", phone: "+201000000001", roleName: policy.roles.superAdmin },
      roleRows
    ),
    officeAdmin: await upsertUser(
      { email: "office.admin@kmt.local", name: "مدير المكتب التجريبي", phone: "+201000000002", roleName: policy.roles.officeAdmin },
      roleRows
    ),
    lawyer: await upsertUser(
      { email: "lawyer@kmt.local", name: "مريم خالد", phone: "+201000000003", roleName: policy.roles.lawyer },
      roleRows
    ),
    marketing: await upsertUser(
      { email: "marketing@kmt.local", name: "مسؤول التسويق التجريبي", phone: "+201000000004", roleName: policy.roles.marketingStaff },
      roleRows
    ),
    client: await upsertUser(
      { email: "client@kmt.local", name: "عميل تجريبي", phone: "+201000000005", roleName: policy.roles.client },
      roleRows
    )
  };

  const sealedTotp = sealSecret(demoTotpSecret);
  for (const staffUser of [users.superAdmin, users.officeAdmin, users.lawyer, users.marketing]) {
    await prisma.staffTwoFactorCredential.upsert({
      where: { userId: staffUser.id },
      create: {
        userId: staffUser.id,
        totpSecretEncrypted: sealedTotp,
        enabledAt: new Date(),
        recoveryState: "ENABLED"
      },
      update: {
        totpSecretEncrypted: sealedTotp,
        enabledAt: new Date(),
        recoveryState: "ENABLED"
      }
    });
  }

  return users;
}

async function seedPublicData(users) {
  await prisma.lawyerProfile.upsert({
    where: { publicSlug: "maryam-khaled" },
    create: {
      userId: users.lawyer.id,
      publicSlug: "maryam-khaled",
      title: "محامية عقود وشركات",
      bio: "تركز على صياغة العقود التجارية وحوكمة الشركات وتنظيم ملفات التفاوض قبل التوقيع.",
      specialties: ["صياغة العقود", "حوكمة الشركات", "المنازعات التجارية"],
      languages: ["ar", "en"],
      isPublic: true,
      bookingEnabled: true
    },
    update: {
      title: "محامية عقود وشركات",
      bio: "تركز على صياغة العقود التجارية وحوكمة الشركات وتنظيم ملفات التفاوض قبل التوقيع.",
      specialties: ["صياغة العقود", "حوكمة الشركات", "المنازعات التجارية"],
      languages: ["ar", "en"],
      isPublic: true,
      bookingEnabled: true
    }
  });

  const services = [
    {
      title: "استشارات حسب المجال",
      slug: "legal-consultation",
      category: "legal-consultation",
      description: "استشارات جنائية ومدنية وتجارية وأسرية وعمالية يتم تنظيمها لمراجعة محامٍ من الفريق.",
      content: "تشمل الخدمة: استشارات جنائية، استشارات مدنية، استشارات تجارية، استشارات أسرية، واستشارات عمالية. يتم جمع الوقائع وبيانات التواصل وملخص الطلب ثم يراجع المكتب الملف قبل أي توجيه قانوني.",
      requiredDocuments: ["ملخص الوقائع", "التواريخ والأطراف المهمة", "أي مستندات يطلبها الفريق لاحقًا"]
    },
    {
      title: "الشركات والعقود التجارية",
      slug: "corporate-business-services",
      category: "corporate-business-services",
      description: "تأسيس الشركات وصياغة العقود ومراجعتها والحوكمة والامتثال والاستشارات المتعلقة بالمنازعات التجارية.",
      content: "تشمل الخدمة: تأسيس الشركات، صياغة العقود، مراجعة العقود، الحوكمة والامتثال، والاستشارات المتعلقة بالمنازعات التجارية. يتم تنظيم ملف الأعمال قبل مراجعته وتعيين المحامي المناسب.",
      requiredDocuments: ["بيانات الشركة أو الأطراف", "مسودات العقود أو المراسلات", "السجل التجاري أو مستندات التأسيس عند توفرها"]
    },
    {
      title: "مراجعة قانونية عقارية",
      slug: "real-estate-legal-support",
      category: "real-estate-legal-support",
      description: "عقود البيع والشراء والفحص القانوني للعقارات وعقود الإيجار والاستشارات العقارية.",
      content: "تشمل الخدمة: عقود البيع والشراء، الفحص القانوني للعقارات، عقود الإيجار، والاستشارات العقارية. يتم تجهيز مستندات الملكية والتصرفات والمراسلات للمراجعة قبل التوقيع أو المتابعة.",
      requiredDocuments: ["مستندات الملكية أو الإيجار", "مسودة البيع أو الشراء أو الإيجار", "الإيصالات أو المراسلات أو بيانات التصرفات السابقة"]
    },
    {
      title: "المطالبات المالية والتسويات",
      slug: "claims-collections",
      category: "claims-collections",
      description: "تحصيل المديونيات والإنذارات القانونية والشيكات والإيصالات والتفاوض والتسويات.",
      content: "تشمل الخدمة: تحصيل المديونيات، الإنذارات القانونية، الشيكات والإيصالات، والتفاوض والتسويات. يتم ترتيب مصدر الدين والمستندات المؤيدة ومحاولات السداد قبل تحديد الخطوة التالية.",
      requiredDocuments: ["الفواتير أو الشيكات أو الإيصالات أو مستندات الدين", "المراسلات والإنذارات", "سجل السداد أو محاولات التسوية"]
    }
  ];

  await prisma.legalService.updateMany({
    where: {
      slug: {
        in: ["contract-drafting", "real-estate-consultation", "commercial-collection"]
      }
    },
    data: { isPublished: false }
  });

  for (const service of services) {
    await prisma.legalService.upsert({
      where: { slug: service.slug },
      create: { ...service, isPublished: true },
      update: { ...service, isPublished: true }
    });
  }

  await prisma.article.upsert({
    where: { slug: "contract-risk-basics" },
    create: {
      title: "أساسيات تقليل مخاطر العقود",
      slug: "contract-risk-basics",
      excerpt: "نقاط عملية تساعد على مراجعة بنود المسؤولية والجزاءات قبل توقيع عقد تجاري.",
      content: "تبدأ مراجعة العقد من فهم الالتزامات الأساسية ومواعيد التنفيذ والجزاءات وحدود المسؤولية. لا تكفي قراءة العنوان أو قيمة التعاقد؛ المهم هو أثر كل بند عند التعثر أو التأخير أو إنهاء العلاقة.",
      authorId: users.marketing.id,
      category: "contracts",
      status: "PUBLISHED",
      publishedAt: new Date("2026-06-01T09:00:00.000Z")
    },
    update: {
      excerpt: "نقاط عملية تساعد على مراجعة بنود المسؤولية والجزاءات قبل توقيع عقد تجاري.",
      content: "تبدأ مراجعة العقد من فهم الالتزامات الأساسية ومواعيد التنفيذ والجزاءات وحدود المسؤولية. لا تكفي قراءة العنوان أو قيمة التعاقد؛ المهم هو أثر كل بند عند التعثر أو التأخير أو إنهاء العلاقة.",
      status: "PUBLISHED",
      publishedAt: new Date("2026-06-01T09:00:00.000Z")
    }
  });

  await prisma.caseStudy.upsert({
    where: { slug: "anonymous-commercial-dispute" },
    create: {
      title: "نزاع تجاري مجهول الهوية",
      slug: "anonymous-commercial-dispute",
      category: "commercial",
      challenge: "تأخر مستحقات تعاقدية مع نقص في توثيق بعض المراسلات.",
      approach: "مراجعة المستندات وتنظيم جدول بالمطالبات والمخاطر قبل بدء التفاوض.",
      generalOutcome: "نتيجة عامة مجهولة بدون وعود أو كشف بيانات أطراف حقيقية.",
      lessons: "توثيق المراسلات والقبول والاستلام يقلل مساحة النزاع لاحقًا.",
      status: "PUBLISHED",
      isAnonymized: true,
      approvedById: users.superAdmin.id,
      publishedAt: new Date("2026-06-05T09:00:00.000Z")
    },
    update: {
      status: "PUBLISHED",
      isAnonymized: true,
      approvedById: users.superAdmin.id,
      publishedAt: new Date("2026-06-05T09:00:00.000Z")
    }
  });
}

async function seedOperationalData(users) {
  const portalClient = await prisma.client.upsert({
    where: { userId: users.client.id },
    create: {
      userId: users.client.id,
      fullName: "عميل تجريبي",
      phone: "+201000000005",
      email: "client@kmt.local",
      city: "القاهرة",
      source: "seed",
      status: "ACTIVE",
      assignedLawyerId: users.lawyer.id
    },
    update: {
      fullName: "عميل تجريبي",
      phone: "+201000000005",
      email: "client@kmt.local",
      city: "القاهرة",
      status: "ACTIVE",
      assignedLawyerId: users.lawyer.id
    }
  });

  const companyClient = await findOrCreate(
    prisma.client,
    { phone: "+201000000010" },
    {
      fullName: "شركة النهضة التجارية",
      phone: "+201000000010",
      email: "legal@nahda.example",
      city: "القاهرة",
      source: "seed",
      status: "ACTIVE",
      assignedLawyerId: users.lawyer.id
    },
    {
      fullName: "شركة النهضة التجارية",
      email: "legal@nahda.example",
      city: "القاهرة",
      status: "ACTIVE",
      assignedLawyerId: users.lawyer.id
    }
  );

  await findOrCreate(
    prisma.consultationRequest,
    { phone: "+201000000011", serviceCategory: "corporate" },
    {
      clientId: companyClient.id,
      fullName: "أحمد منصور",
      phone: "+201000000011",
      email: "ahmed.mansour@example.local",
      city: "القاهرة",
      serviceCategory: "corporate",
      summary: "طلب مراجعة عقد توريد تجريبي قبل التوقيع.",
      urgency: "HIGH",
      preferredMode: "ONLINE",
      status: "REVIEWING",
      aiClassification: { category: "contracts", confidence: 0.91, reviewRequired: true },
      aiSummary: "ملخص تجريبي يحتاج مراجعة محام قبل أي إجراء.",
      assignedLawyerId: users.lawyer.id
    },
    {
      status: "REVIEWING",
      assignedLawyerId: users.lawyer.id,
      aiSummary: "ملخص تجريبي يحتاج مراجعة محام قبل أي إجراء."
    }
  );

  const legalCase = await prisma.legalCase.upsert({
    where: { internalFileNumber: "KMT-2024-089" },
    create: {
      internalFileNumber: "KMT-2024-089",
      clientId: companyClient.id,
      assignedLawyerId: users.lawyer.id,
      title: "مراجعة عقد توريد",
      caseType: "contracts",
      courtName: "محكمة القاهرة الاقتصادية",
      status: "ACTIVE",
      priority: "HIGH",
      summary: "ملف تجريبي لعرض نموذج بيانات القضايا داخل النظام.",
      nextSessionAt: new Date("2026-07-02T10:30:00.000Z")
    },
    update: {
      clientId: companyClient.id,
      assignedLawyerId: users.lawyer.id,
      title: "مراجعة عقد توريد",
      caseType: "contracts",
      courtName: "محكمة القاهرة الاقتصادية",
      status: "ACTIVE",
      priority: "HIGH",
      summary: "ملف تجريبي لعرض نموذج بيانات القضايا داخل النظام.",
      nextSessionAt: new Date("2026-07-02T10:30:00.000Z")
    }
  });

  await findOrCreate(
    prisma.caseParty,
    { caseId: legalCase.id, name: "شركة النهضة التجارية" },
    {
      caseId: legalCase.id,
      name: "شركة النهضة التجارية",
      partyType: "CLIENT",
      notes: "طرف تجريبي."
    },
    {
      partyType: "CLIENT",
      notes: "طرف تجريبي."
    }
  );

  await findOrCreate(
    prisma.appointment,
    { title: "جلسة KMT-2024-089", caseId: legalCase.id },
    {
      clientId: companyClient.id,
      lawyerId: users.lawyer.id,
      caseId: legalCase.id,
      title: "جلسة KMT-2024-089",
      type: "COURT_SESSION",
      mode: "COURT",
      location: "محكمة القاهرة الاقتصادية",
      startsAt: new Date("2026-07-02T10:30:00.000Z"),
      endsAt: new Date("2026-07-02T11:30:00.000Z"),
      status: "SCHEDULED"
    },
    {
      startsAt: new Date("2026-07-02T10:30:00.000Z"),
      endsAt: new Date("2026-07-02T11:30:00.000Z"),
      status: "SCHEDULED"
    }
  );

  await findOrCreate(
    prisma.caseSession,
    { caseId: legalCase.id, sessionDate: new Date("2026-06-20T09:00:00.000Z") },
    {
      caseId: legalCase.id,
      courtName: "محكمة القاهرة الاقتصادية",
      sessionDate: new Date("2026-06-20T09:00:00.000Z"),
      decision: "تأجيل لتقديم مستندات.",
      nextAction: "رفع مذكرة مختصرة.",
      nextSessionDate: new Date("2026-07-02T10:30:00.000Z"),
      createdById: users.lawyer.id
    },
    {
      decision: "تأجيل لتقديم مستندات.",
      nextAction: "رفع مذكرة مختصرة.",
      nextSessionDate: new Date("2026-07-02T10:30:00.000Z")
    }
  );

  ensureSeedDocumentFile(seedDocumentFileKey, seedPdfBytes);

  await prisma.document.upsert({
    where: { fileKey: seedDocumentFileKey },
    create: {
      ownerClientId: companyClient.id,
      caseId: legalCase.id,
      uploadedById: users.officeAdmin.id,
      fileName: "contract-final.pdf",
      fileKey: seedDocumentFileKey,
      fileType: "application/pdf",
      fileSize: seedPdfBytes.length,
      category: "CONTRACT",
      status: "UNDER_REVIEW",
      visibility: "STAFF_ONLY"
    },
    update: {
      ownerClientId: companyClient.id,
      caseId: legalCase.id,
      uploadedById: users.officeAdmin.id,
      fileSize: seedPdfBytes.length,
      status: "UNDER_REVIEW",
      visibility: "STAFF_ONLY"
    }
  });

  await findOrCreate(
    prisma.task,
    { caseId: legalCase.id, title: "مراجعة بند التعويضات" },
    {
      caseId: legalCase.id,
      title: "مراجعة بند التعويضات",
      description: "مهمة تجريبية مرتبطة بالقضية.",
      status: "IN_PROGRESS",
      priority: "URGENT",
      assignedToId: users.lawyer.id,
      createdById: users.officeAdmin.id,
      dueDate: new Date("2026-06-25T08:00:00.000Z")
    },
    {
      description: "مهمة تجريبية مرتبطة بالقضية.",
      status: "IN_PROGRESS",
      priority: "URGENT",
      assignedToId: users.lawyer.id,
      dueDate: new Date("2026-06-25T08:00:00.000Z")
    }
  );

  await prisma.payment.upsert({
    where: { invoiceNumber: "INV-2026-0001" },
    create: {
      invoiceNumber: "INV-2026-0001",
      clientId: portalClient.id,
      issueDate: new Date("2026-06-01T00:00:00.000Z"),
      dueDate: new Date("2026-06-30T00:00:00.000Z"),
      amount: "4500.00",
      currency: "EGP",
      status: "ISSUED",
      createdById: users.officeAdmin.id,
      notes: "فاتورة تجريبية بدون بوابة دفع."
    },
    update: {
      clientId: portalClient.id,
      status: "ISSUED",
      amount: "4500.00",
      createdById: users.officeAdmin.id,
      notes: "فاتورة تجريبية بدون بوابة دفع."
    }
  });

  await prisma.systemSetting.upsert({
    where: { key: "storage.driver" },
    create: {
      key: "storage.driver",
      value: { driver: "vps-filesystem", uploadsDir: "/var/lib/kmt-legal/uploads" },
      updatedById: users.superAdmin.id
    },
    update: {
      value: { driver: "vps-filesystem", uploadsDir: "/var/lib/kmt-legal/uploads" },
      updatedById: users.superAdmin.id
    }
  });

  await prisma.systemSetting.upsert({
    where: { key: "payment.gateway" },
    create: {
      key: "payment.gateway",
      value: { activeProvider: process.env.PAYMENT_PROVIDER ?? "paymob" },
      updatedById: users.superAdmin.id
    },
    update: {}
  });
}

function ensureSeedDocumentFile(fileKey, bytes) {
  const uploadsRoot = path.resolve(process.env.UPLOADS_DIR ?? path.join(root, "_workspace", "uploads"));
  const fullPath = path.resolve(uploadsRoot, fileKey);

  if (!fullPath.startsWith(`${uploadsRoot}${path.sep}`)) {
    throw new Error(`Unsafe seed document path: ${fileKey}`);
  }

  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, bytes);
}

async function main() {
  const roleRows = await seedAccessControl();
  await seedProductionBootstrap();

  if (isProduction) {
    console.log("Production bootstrap completed: roles, permissions, and system settings.");
    return;
  }

  const users = await seedUsers(roleRows);
  await seedPublicData(users);
  await seedOperationalData(users);

  console.log("Seed completed: roles, permissions, demo users, public data, and operational demo records.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
