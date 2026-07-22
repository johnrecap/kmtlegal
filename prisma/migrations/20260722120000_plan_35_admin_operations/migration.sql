-- PLAN-35 adds authorization catalog data without changing the Prisma schema.
-- Capture the pre-migration state before inserting any PLAN-35 grants. This keeps
-- a fresh pre-seed database unmarked so its first seed can install all defaults.
DO $$
DECLARE
    had_existing_assignments BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM "role_permissions" LIMIT 1
    ) INTO had_existing_assignments;

    INSERT INTO "permissions" ("id", "key", "description", "createdAt")
    VALUES
      (
          '7ac3e93d-859f-4e2e-9ca3-35a000000001'::uuid,
          'case.create.any',
          'Allows case.create.any',
          CURRENT_TIMESTAMP
      ),
      (
          '7ac3e93d-859f-4e2e-9ca3-35a000000002'::uuid,
          'notification.read.self',
          'Allows notification.read.self',
          CURRENT_TIMESTAMP
      )
    ON CONFLICT ("key") DO UPDATE
    SET "description" = EXCLUDED."description";

    INSERT INTO "role_permissions" ("roleId", "permissionId", "createdAt")
    SELECT role_row."id", permission_row."id", CURRENT_TIMESTAMP
    FROM "roles" AS role_row
    CROSS JOIN "permissions" AS permission_row
    WHERE permission_row."key" = 'case.create.any'
      AND role_row."name" IN ('Secretary', 'Office Admin')
    ON CONFLICT ("roleId", "permissionId") DO NOTHING;

    INSERT INTO "role_permissions" ("roleId", "permissionId", "createdAt")
    SELECT role_row."id", permission_row."id", CURRENT_TIMESTAMP
    FROM "roles" AS role_row
    CROSS JOIN "permissions" AS permission_row
    WHERE permission_row."key" = 'notification.read.self'
      AND role_row."name" IN ('Lawyer', 'Secretary', 'Office Admin', 'Marketing Staff')
    ON CONFLICT ("roleId", "permissionId") DO NOTHING;

    IF had_existing_assignments THEN
        INSERT INTO "system_settings" ("id", "key", "value", "updatedAt")
        VALUES (
            '7ac3e93d-859f-4e2e-9ca3-35a000000003'::uuid,
            'auth.rbac_assignments_bootstrap',
            '{"version": 1, "source": "plan-35-migration"}'::jsonb,
            CURRENT_TIMESTAMP
        )
        ON CONFLICT ("key") DO NOTHING;
    END IF;
END $$;
