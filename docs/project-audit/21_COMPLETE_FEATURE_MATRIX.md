# 21 — Complete Feature Matrix

| Area | Feature | User | UI | Backend/API | DB | Permission | Tests | Status | Confidence | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Public | Home page | public | `public-pages.tsx:HomePageView` | static + CMS reads | `LegalService/LawyerProfile` | none | smoke, visual | WORKING | HIGH | EN+AR 200 |
| Public | Services list | public | `ServicesPageView` | `GET /api/public/services` | `LegalService` | none | smoke | WORKING | MEDIUM | — |
| Public | Service detail | public | service detail view | `GET …/services/[slug]` | `LegalService` | none | smoke | WORKING | MEDIUM | unknown → 404 |
| Public | Team list | public | `TeamPageView` | `GET /api/public/lawyers` | `LawyerProfile` | none | smoke | WORKING | MEDIUM | `isPublic` only |
| Public | Team detail + lawyer booking link | public | team detail view | `GET …/lawyers/[slug]` | `LawyerProfile` | none | smoke | WORKING | MEDIUM | `?lawyer=` entry |
| Public | Contact form + inbox entry | public | `contact-form.tsx` | `POST /api/public/contact` | `ContactMessage` | none (rate-limited) | server | WORKING | MEDIUM | ref `MSG-<8>` |
| Public | Booking chat intake | public | `consultation-booking-chat.tsx` | `POST …/consultations/assistant` | `ConsultationRequest` (on confirm) | none (rate-limited) | server+e2e | PARTIAL | MEDIUM | needs slots/pay env |
| Public | Slot listing | public | `SlotChoicePanel` | `GET …/slots` | `Appointment` | none | server+e2e | PARTIAL | MEDIUM | TZ Africa/Cairo |
| Public | Checkout → provider | public | `PaymentReviewPanel` | `POST …/checkout` | `PaymentAttempt` | none | server+e2e | PARTIAL | MEDIUM | Paymob live only |
| Public | Payment return page | public | return page + poller | `GET /api/public/payments/status` (token) | `PaymentAttempt` | HMAC token | ui | PARTIAL | MEDIUM | live PAID env-gated |
| Public | Payment receipt | public | receipt document | receipt service (token) | `Payment+Attempt` | HMAC v2 | ui | PARTIAL | MEDIUM | reversals excluded |
| Public | Client-account setup | public | setup form | `POST …/client-account/setup` | `User+Client` | HMAC token | server | PARTIAL | MEDIUM | needs SCHEDULED |
| Public | Privacy / Terms | public | static views | static | none | none | smoke | WORKING | HIGH | — |
| Public | Sitemap / metadata | crawler | `sitemap.ts` | static (+ empty DB hook) | none effective | none | build | WORKING | HIGH | leaks nothing |
| Public | Theme toggle | public | `ThemeToggle` | none | none | none | ui | WORKING | HIGH | dark+light verified |
| Public | Language switch | public | `public-language-switch` | none / preference API (client) | `User.locale` | self | ui | WORKING | HIGH | EN/AR shells |
| Public | Login page | public | `(login)/login/page.tsx` | `POST /api/auth/login` | `User/Session` | rate-limited | server+e2e | WORKING | HIGH | `next` sanitized |
| Public | Installer | ops | `(install-ar)/install` | `/api/install/*` | `User/SystemSetting` | token | server | ADMIN ONLY | MEDIUM | notFound when off |
| Public | Articles pages | public | views exist, ungated out | `GET /api/public/articles*` live | `Article` | none | — | PUBLIC HIDDEN | HIGH | API leak (P1) |
| Public | Case-study pages | public | views exist, ungated out | `GET /api/public/case-studies*` live | `CaseStudy` | none | — | PUBLIC HIDDEN | HIGH | API leak (P1) |
| Public | Media | — | none | none | none | — | retired-routes spec | PUBLIC HIDDEN | HIGH | deleted |
| Public | Preview routes | staff | `preview/*` | none | none | flag | e2e batch16 | DISABLED | HIGH | prod notFound |
| Client | Dashboard | Client | dashboard view | `getPortalDashboard` | multi | `client.read.self` | server | PARTIAL | MEDIUM | no live session proof |
| Client | Cases list | Client | cases table | `listPortalCases` | `LegalCase` | own scope | server | PARTIAL | MEDIUM | read-only |
| Client | Case detail | Client | detail groups | `getPortalCaseDetail` | case+sessions+docs | own scope | server | PARTIAL | MEDIUM | sessions+docs+pay |
| Client | AI organizer | Client | `ClientAssistantPanel` | `POST /api/client/assistant` | scoped listers | portal+rate-limit | server | PARTIAL | MEDIUM | deterministic, no LLM |
| Client | Team chat | Client | `ClientTeamChatPanel` | `/api/client/messages*` | threads | own thread | integration+e2e | PARTIAL | MEDIUM | 5s poll, no attach |
| Client | Files download | Client | files table | `GET /api/files/[id]/download` | `Document` | `read.own` | e2e batch3/9 | PARTIAL | MEDIUM | authorized links |
| Client | File upload | Client | `DocumentUploadForm` | `POST /api/files/upload` | `Document` | `upload.self` | e2e | PARTIAL | MEDIUM | ClamAV env-gated |
| Client | Court-dates list | Client | court-dates view | `listPortalAppointments` | `Appointment` | own scope | server | PARTIAL | MEDIUM | mislabeled route |
| Client | Payments + receipts | Client | payments view | portal payments + receipt URL | `Payment/Attempt` | own scope | server | PARTIAL | MEDIUM | gateway-paid only |
| Client | Profile edit | Client | `ProfileForm` | `PATCH /api/client/profile` | `Client+User` | self (404 else) | server | PARTIAL | MEDIUM | no password change |
| Client | Locale preference | Client | `ClientLanguageSwitch` | `PATCH /api/client/preferences` | `Client` | self | lib tests | WORKING | MEDIUM | `ar\|en` |
| Client | Appointment self-service | Client | none | none | — | — | — | DEFERRED | HIGH | expected, absent |
| Client | In-portal payment creation | Client | none (continue only) | none | — | — | — | DEFERRED | HIGH | external checkout |
| Admin | Dashboard | staff | command center | `GET /api/admin/dashboard` | multi | scope-aware | server | PARTIAL | MEDIUM | queues limit 6 |
| Admin | Cases list | staff | filters | `GET /api/admin/cases` | `LegalCase` | `case.read.*` | server+e2e | PARTIAL | MEDIUM | — |
| Admin | Case create | staff | `ManualCaseForm` | `POST /api/admin/cases` | `LegalCase` | `case.create.*` | server | PARTIAL | MEDIUM | no dup guard |
| Admin | Case detail + sessions | staff | detail tabs | `PATCH …/status`, `POST …/sessions` | `LegalCase/Session` | scoped | server+e2e | PARTIAL | MEDIUM | — |
| Admin | Clients list/detail | staff | CRM views | `/api/admin/clients*` | `Client` | `client.read.*` | server | PARTIAL | MEDIUM | 403 out-of-scope |
| Admin | Client create (UI) | staff | "add unavailable" | `createAdminClient` exists | `Client` | — | — | NOT WIRED | HIGH | UI/service mismatch |
| Admin | Assign lawyer | staff | CRM form | `POST …/assign` | `assignedLawyerId` | staff | server | PARTIAL | MEDIUM | — |
| Admin | Archive/status | staff | CRM form | `POST …/archive` | `ClientStatus` | staff | server | PARTIAL | MEDIUM | 5-state |
| Admin | Portal account link | staff | CRM form | `POST …/account` | `User+Client` | `client.account.manage` | server | PARTIAL | MEDIUM | audited |
| Admin | Client password reset | staff | CRM form | `POST …/account/password` | `User` | `client.account.manage` | server | ADMIN ONLY | MEDIUM | +revoke option |
| Admin | Consultations queue | staff | review views | `GET /api/admin/consultations` | `ConsultationRequest` | `consultation.*` | server+e2e | PARTIAL | MEDIUM | 8 views |
| Admin | Review actions | staff | action panel | `…/assign\|review\|reject` | `ConsultationRequest` | reviewer | server | PARTIAL | MEDIUM | typed reasons |
| Admin | Schedule consultation | staff | schedule form | `POST …/schedule` | `Appointment` | reviewer | server | PARTIAL | MEDIUM | conflict-checked |
| Admin | Convert to case | staff | action | `POST …/convert` | `LegalCase` | reviewer | server | PARTIAL | MEDIUM | unique link |
| Admin | Outcome / reopen | staff | outcome forms | `POST …/outcome\|reopen` | outcome + version | reviewer | server+e2e | PARTIAL | MEDIUM | version-locked |
| Admin | Availability editor | staff | availability form | `GET\|PUT …/consultation-availability` | `SystemSetting` | staff | server | PARTIAL | MEDIUM | no blackouts |
| Admin | Calendar + reschedule | staff | calendar view | `/api/admin/calendar*` | `Appointment` | scoped | server | PARTIAL | MEDIUM | no cancel UI |
| Admin | Tasks | staff | board/list + forms | `/api/admin/tasks*` | `Task` | scoped | server | WORKING | MEDIUM | CAS 409; no recur |
| Admin | Documents review/delete | staff | doc forms | `/api/admin/documents*` | `Document` | `document.manage.any` | e2e batch9 | PARTIAL | MEDIUM | soft-delete only |
| Admin | Finance invoices | staff | finance tabs | `/api/admin/finance*` | `Payment` | `finance.*` | server | PARTIAL | MEDIUM | +CSV export |
| Admin | Pricing rules | staff | pricing form | `/api/admin/payments/pricing*` | `PricingRule` | `finance.*` | server | PARTIAL | MEDIUM | versioned |
| Admin | Gateway settings | Super | settings form | `…/payments/settings` | `SystemSetting` | `finance.*` | server | ADMIN ONLY | MEDIUM | opaque KV risk |
| Admin | Attempts/webhooks/replay | staff | ops tabs | `…/attempts\|webhooks*` | attempt/tx/event | `finance.*` | server | PARTIAL | MEDIUM | replay audited |
| Admin | Message threads | staff | thread panel | `/api/admin/messages*` | threads | `conversation.*` | integration+e2e | PARTIAL | MEDIUM | 5s poll |
| Admin | Contact inbox | staff | inbox | `/api/admin/contact-messages*` | `ContactMessage` | `contact.*` | server | PARTIAL | MEDIUM | forward-only |
| Admin | Notifications | staff | center + bell | `/api/admin/notifications*` | `Notification` | self | ui | PARTIAL | MEDIUM | 3 trigger families |
| Admin | Reports | staff | reports view | `GET /api/admin/reports` | aggregates | `report.read.any` | server | PARTIAL | MEDIUM | no export |
| Admin | Settings KV | Super | settings view | `/api/admin/settings*` | `SystemSetting` | `settings.*` | server | ADMIN ONLY | MEDIUM | — |
| Admin | Users mgmt | Super | users views | `/api/admin/users*` | `User` | `user.*` | e2e batch12 | ADMIN ONLY | MEDIUM | ceremony tested |
| Admin | Staff password change | Super | password form | `POST …/[userId]/password` | `User` | exact Super + live session | e2e | ADMIN ONLY | MEDIUM | TX-revalidated |
| Admin | Roles editor | Super | matrix form | `/api/admin/roles*` | role tables | dual perm + exact Super | server | ADMIN ONLY | HIGH | strongest gate |
| Admin | Content hub + articles | staff | hub + `ArticleForm` | `/api/admin/content*` | `Article` | `content.*` | integration+e2e | ADMIN ONLY | MEDIUM | no delete API |
| Admin | Case studies | staff | `CaseStudyForm` | `…/case-studies*` | `CaseStudy` | `content.*` | integration | ADMIN ONLY | MEDIUM | anon gate |
| Admin | Social + AI draft | staff | draft forms | `…/social-drafts*` | `SocialPostDraft` | `content.*` | integration | ADMIN ONLY | MEDIUM | no auto-poster |
| Admin | Audit log | Super | log view | `GET /api/admin/audit-log` | `AuditLog` | `audit.read.any` | server | ADMIN ONLY | MEDIUM | no export |
| Auth | Login | all | login form | `POST /api/auth/login` | `Session` | rate-limit | server+e2e | WORKING | HIGH | audited |
| Auth | Logout | authed | — | `POST /api/auth/logout` | `Session` revoked | session | server | WORKING | HIGH | 303 for HTML |
| Auth | Session resolve | authed | layouts/guards | `session-store` | `Session+User` | — | server | WORKING | HIGH | fails closed |
| Auth | Password hashing | — | — | `password.ts` scrypt | `User` | — | server | WORKING | HIGH | timing-safe |
| Auth | Rate limiting | — | 429s | memory+PG counters | `RateLimitCounter` | — | server | WORKING | MEDIUM | per-scope keys |
| Auth | 2FA | staff | none (notFound/503) | `503 FEATURE_DISABLED` | cred/OTP tables | — | — | DISABLED | HIGH | enable pre-launch |
| Auth | Self-service reset | — | none | none | — | — | — | DEFERRED | HIGH | admin-mediated |
| Auth | Page guards | all | `PermissionBlocked` | `page-guards.tsx` | `User/Role` | role-based | e2e | WORKING | HIGH | login gates green |
| Auth | API enforcement | all | — | services `assertPermission` | — | per-action | server+e2e | WORKING | MEDIUM | sampled clean |
| Safety | Double-booking guard | system | — | conflict TX Serializable | `Appointment` | — | server+e2e | WORKING | MEDIUM | P2034 retry |
| Safety | Price equality guard | system | — | checkout check | `PricingRule` | — | server | WORKING | MEDIUM | 409 on drift |
| Safety | Expiry sweeper | system | — | `expireOpen…Attempts` | attempt+appt | — | server | WORKING | MEDIUM | slot-list trigger |
| Safety | Legacy manual booking | — | none | always 409 | — | — | — | DISABLED | HIGH | intentional |
| Finance | Refund execution | — | none | none (record-only) | status markers | — | — | DEFERRED | HIGH | manual ops |
| Finance | Settlement flow | — | none | none | `settlementStatus` col | — | — | NOT WIRED | HIGH | column only |
| Finance | Manual attempt path | — | none | none | `manualMethod` col | — | — | NOT WIRED | HIGH | dead field |
| Work | Recurring tasks | — | none | none | — | — | — | DEFERRED | HIGH | no RRULE/cron |
| Work | Reminders scheduler | — | none | templates only | — | — | — | DEFERRED | HIGH | SMTP+sched off |
| Work | Assignment notifications | — | none | no triggers | `NotificationType` | — | — | NOT WIRED | MEDIUM | types unused |
| Comms | Chat attachments | — | none | none | no columns | — | — | DEFERRED | HIGH | schema lacks |
| Comms | Read receipts | — | none | inferred only | no columns | — | — | DEFERRED | HIGH | via WAITING_* |
| Comms | Realtime transport | — | 5s/30s polls | none | — | — | — | DEFERRED | HIGH | design choice |
| Comms | Client push/email/SMS | — | none | no triggers | — | — | — | DEFERRED | HIGH | SMTP off |
| CMS | Social auto-poster | — | none | none | `SCHEDULED` state | — | — | NOT WIRED | HIGH | dead-end state |
| CMS | Scheduled publishing | — | none | none (no cron) | `scheduledAt` | — | — | NOT WIRED | HIGH | no publisher |
| CMS | Content delete API | — | none | none | — | — | — | NOT WIRED | HIGH | GAP |
| CMS | SEO fields | — | none | none | no columns | — | — | DEFERRED | MEDIUM | no meta/OG |
| Admin | Calendar cancel/delete UI | staff | none | states exist | `Appointment` | — | — | NOT WIRED | MEDIUM | service supports |
| Admin | Reports export | staff | none | finance-only CSV | — | — | — | DEFERRED | MEDIUM | — |
| Admin | Bulk operations | staff | none | none | — | — | — | DEFERRED | MEDIUM | nowhere |
| Ops | AI live provider | system | — | gateway `fetch` | `AiProviderRun` | env keys | — | UNKNOWN | LOW | needs keys+red-team |
| Ops | ClamAV prod path | system | — | `malware-scan.ts` | — | env | unit only | UNKNOWN | LOW | needs daemon test |
| Ops | SMTP sending | — | disabled UI | `nodemailer` off | `EmailMessage` | flag | — | DISABLED | HIGH | intentional |
| Ops | PayTabs live charge | — | template | template checkout | — | flag | — | DISABLED | HIGH | standby |
| Ops | Mock AI default | system | — | `mock.ts` | run rows | — | server | MOCK / STUB | HIGH | intentional |
| Ops | Analytics pipeline | system | beacon client | `POST /api/analytics/events` | `AnalyticsEvent` | rate-limit | — | PARTIAL | LOW | untested E2E |
| Ops | Health endpoint | ops | — | readiness checks | — | open | deploy verify | WORKING | MEDIUM | gates deploy |
| Ops | Backup flow | ops | — | deploy script pg_dump | dump file | server fs | — | PARTIAL | MEDIUM | no fs backup |
| Ops | Rollback | ops | — | manual restore | dump file | server fs | — | DEFERRED | MEDIUM | no script/drill |
| Ops | Payment worker liveness | ops | — | PM2 external | — | — | — | UNKNOWN | LOW | needs monitoring |
| Ops | WhatsApp integration | public | deep-link | none | — | — | — | NOT WIRED | HIGH | link only, no API |

## Counts

- WORKING: 24
- PARTIAL: 41
- BROKEN: 0
- NOT WIRED: 9
- MOCK/STUB: 1
- DISABLED: 5
- DEFERRED: 14
- ADMIN ONLY: 11
- PUBLIC HIDDEN: 3
- UNKNOWN — NEEDS RUNTIME/ENVIRONMENT: 3
- TOTAL: 111
