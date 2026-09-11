# Office tool entry permissions

Generated from the current route registry and default role policy by `node scripts/review-permission-matrix.mjs`. Actual session resolution uses persisted role permissions; this table describes defaults. Page entry does not grant every mutation API. `any` means one permission; `all` means all listed.

| Group / route | Permission requirement | Lawyer | Office Admin | Secretary | Marketing Staff | Super Admin |
|---|---|---|---|---|---|---|
| office-operations / /admin |  staff fallback | yes | yes | yes | yes | yes |
| office-operations / /admin/consultation-availability | any: appointment.manage.any, settings.manage.any | no | yes | yes | no | yes |
| office-operations / /admin/consultations | any: consultation.review.any, consultation.review.assigned | yes | yes | yes | no | yes |
| office-operations / /admin/clients | any: client.read.any, client.read.assigned | yes | yes | yes | no | yes |
| office-operations / /admin/messages | any: conversation.read.any, conversation.manage.any | no | yes | yes | no | yes |
| office-operations / /admin/cases | any: case.read.any, case.read.assigned | yes | yes | yes | no | yes |
| office-operations / /admin/cases/new | any: case.create.any | no | yes | yes | no | yes |
| office-operations / /admin/calendar | any: appointment.manage.any, appointment.read.assigned | yes | yes | yes | no | yes |
| office-operations / /admin/tasks | any: task.manage.any, task.manage.assigned, task.read.assigned | yes | yes | yes | no | yes |
| files-finance / /admin/documents | any: document.manage.any, document.read.assigned | yes | yes | yes | no | yes |
| files-finance / /admin/finance | any: finance.read.any, finance.manage.any | no | yes | yes | no | yes |
| files-finance / /admin/reports | any: report.read.any | no | yes | yes | no | yes |
| administration / /admin/content | any: content.create.any, content.approve.any, caseStudy.create.any, caseStudy.approve.any, socialDraft.create.any, socialDraft.approve.any | no | no | no | yes | yes |
| office-operations / /admin/contact-messages | any: contact.read.any, contact.manage.any | no | yes | yes | no | yes |
| office-operations / /admin/notifications | any: notification.read.self | yes | yes | yes | yes | yes |
| administration / /admin/users | any: user.manage.any | no | no | no | no | yes |
| administration / /admin/roles |  all: role.manage.any, permission.manage.any exact role: Super Admin | no | no | no | no | yes |
| administration / /admin/settings | any: settings.manage.any | no | no | no | no | yes |
| administration / /admin/audit-log | any: audit.read.any | no | no | no | no | yes |

Guest and Client are denied entry to every listed admin route. File download adds per-document ownership/assignment checks in `src/server/storage/document-service.ts`; see BATCH-3.md for the real HTTP matrix.
