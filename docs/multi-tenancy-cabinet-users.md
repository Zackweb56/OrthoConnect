# Multi-tenancy: cabinet users and access

**Scope:** This document describes the tenant and cabinet-user setup that exists in this repository. It is an implementation inventory and production-readiness review, not a proposal to redesign the current setup. No tenant model, membership, or migration behavior was changed for this document.

**Repository review date:** 2026-11-14  
**Verification boundary:** Based on the checked-in/local source and Prisma migrations. No production database, deployment environment, or real multi-cabinet data was available for verification.

## 1. Current tenant model

The current tenant is a `Clinic` row. A `User` is a platform-level account, and `ClinicUser` links that account to one or more clinics:

- `User.id` is the account identity. `email` and `phone` are globally unique, not unique per clinic.
- `Clinic.id` is the stable tenant key. `Clinic.slug` is unique and is used in cabinet URLs; it is not an authorization secret.
- `ClinicUser` has the composite primary key `(clinicId, userId)`, so one user can have at most one membership per clinic. It stores that membership's `role`, `isActive`, and timestamps.
- The `clinic_users` foreign keys use `ON DELETE RESTRICT`; clinics have a `deletedAt` soft-delete field. Normal cabinet access excludes soft-deleted clinics.
- `User.isPlatformOwner` is a platform-wide flag. Platform owners are not given a cabinet membership by the current owner-admin creation flow.

The actual schema is in [`schema.prisma`](../prisma/schema.prisma). The MySQL migrations are under [`prisma/migrations`](../prisma/migrations), and the Prisma datasource uses `DATABASE_URL`. The application Prisma client is constructed with the TiDB Cloud Prisma adapter in [`prisma.js`](../src/lib/db/prisma.js); the migration lock identifies the provider as MySQL.

The current schema contains clinic, account, membership, role/permission, plan, subscription, and payment models. It does **not** yet contain patient, guardian/family-account, appointment, activity, or clinical-record models. The family-login page currently has a disabled submit button. Accordingly, the `responsable` role is a seeded cabinet role, not a working family identity or patient relationship.

## 2. Authentication and choosing a clinic

1. Professional sign-in uses a global email/password credential. Email is trimmed and lower-cased for lookup; passwords are checked with bcrypt.
2. NextAuth uses JWT sessions. The token carries the user ID and platform-owner flag. The session callback reads the current account profile and selects the earliest active, non-deleted clinic membership ordered by `joinedAt`, then `clinicId`.
3. Cabinet workspace URLs use `/{clinicSlug}/...`. The workspace layout checks that the signed-in user has an active membership for that slug, then checks that the slug matches the clinic selected for the session. A different valid membership is redirected to the selected clinic; there is no clinic switcher or persisted active-clinic selection yet.
4. The workspace layout also checks the clinic's `isActive` flag and subscription access before rendering the workspace. It loads permissions after those checks.

Relevant implementation: [`auth.js`](../auth.js), [`access.js`](../src/features/subscriptions/access.js), and the cabinet [`layout.js`](<../src/app/(cabinet)/[clinicSlug]/(workspace)/layout.js>).

## 3. Cabinet authorization and tenant scoping

Cabinet APIs use `cabinetRoute` in [`cabinet-api.js`](../src/lib/cabinet-api.js). It:

- requires a signed-in user and a session `clinicId`;
- rechecks an active membership for that user and clinic, and excludes soft-deleted clinics;
- checks the named permission through the user's resolved role; and
- passes the checked `clinicId` to the handler.

The users, roles, and cabinet-profile handlers use that `clinicId` for membership, role, count, and clinic queries. Role-management mutations and user membership mutations lock the clinic row inside a transaction. The new self-profile API uses the same active-membership check but does not require a clinic permission, because it only reads or updates the signed-in user's own global account.

The main authorization code is in [`permissions.js`](../src/lib/permissions.js); current user and role API handlers are in [`src/app/api/cabinet`](../src/app/api/cabinet).

## 4. Roles and permissions as currently stored

- `Permission.name` is global and unique. Permissions are attached to role rows through `RolePermission`.
- A system role has `isSystem = true` and `clinicId = null`. A custom role has a clinic ID and belongs to that clinic.
- `ClinicUser.role` is stored as a **string role name**, not as a foreign key to `Role`. Permission resolution first looks for a clinic-specific role with that name and then falls back to a system role.
- The seed currently creates system roles `clinic_admin` and `responsable`. `clinic_admin` receives every seeded permission; `responsable` receives none. The role-management table omits `responsable`, while membership/user views can still resolve and display the assigned role.
- Custom roles can only be created, assigned, changed, or deleted through permission-checked cabinet APIs. The delete API rejects roles that are still assigned. The main `clinic_admin` membership is protected from user-side demotion, deactivation, and removal.

The role and permission schema and current seed behavior are in [`schema.prisma`](../prisma/schema.prisma) and [`seed.js`](../prisma/seed.js).

## 5. Cabinet-user lifecycle and account profile

- The owner-admin endpoint creates a global `User` and a `clinic_admin` membership for the target clinic.
- The cabinet user-create endpoint creates a new global account and a membership for the current clinic. It accepts a password directly; despite the UI's “invite” wording, the current code does not send an invitation email.
- Deleting a cabinet user removes that clinic's membership, not the global account. That account can still be used in other clinics where it has a membership.
- A user's name, email, and password belong to the global `User` record. The self-profile form updates that record and requires the current password to change the password. Therefore a profile change applies to the same account in every clinic membership.
- Cabinet logo settings store a public URL or local path in `Clinic.logoPath`; no file-storage or upload service is configured here.
- The email uniqueness constraint is global. A cabinet cannot have two account rows using the same email, even if they belong to different clinics.
- `emailVerifiedAt` exists, but credential sign-in does not currently require it. No email verification or password-reset flow is present in the inspected authentication path.

The self-profile endpoint is [`route.js`](../src/app/api/cabinet/account/profile/route.js); cabinet profile fields are handled by [`settings/profile/route.js`](../src/app/api/cabinet/settings/profile/route.js).

## 6. Important production risks and behavior to verify

These are observations about the current implementation, not changes made by this document.

| Priority | Current behavior | Why it matters / production check |
| --- | --- | --- |
| **High** | Workspace pages enforce clinic suspension and subscription access in the layout. `cabinetRoute` checks membership and soft deletion, but does not check `Clinic.isActive` or subscription access. | A direct request to a cabinet API may still read or mutate data while the UI workspace is blocked for suspension or an expired subscription. Before production, test every cabinet API directly for suspended clinics and inactive/expired subscriptions, and decide whether the API boundary must enforce the same policy. |
| **High** | The seed migrates memberships whose role is `therapist` or `secretary` to `responsable`, and removes obsolete role rows. | Re-running `npm run seed` against a populated database is not merely additive: it changes existing membership role names and can remove clinic role rows. Review the data impact and take a backup before running it against production data. |
| **High** | `ClinicUser.role` is a free-form string with no database foreign key to a role. | Direct database edits, incomplete migrations, or future role changes can leave memberships referring to missing roles. Permission resolution then returns no role permissions. Test missing/renamed roles and consider operational checks before release. |
| **Medium** | MySQL permits multiple `NULL` values in a composite unique index, so `@@unique([clinicId, name])` does not guarantee one global row for each system-role name. The seed uses `findFirst` followed by create. | Concurrent or repeated setup processes can produce duplicate global system roles; `findFirst` may then resolve an unexpected row. Check existing data for duplicates and ensure only one seed process runs at a time. |
| **Medium** | A user's session selects the earliest active membership; there is no active-clinic switcher. | Users with memberships in multiple clinics cannot deliberately switch between them in the current flow. Verify expected behavior for shared accounts and avoid assuming the URL alone changes the active tenant. |
| **Medium** | `Payment` stores both `clinicId` and `subscriptionId`, each with independent relations. The schema does not enforce that the referenced subscription belongs to the same clinic as the payment. | Current owner handlers normally create matching values, but inconsistent data could be introduced by another writer or a future bug. Test mismatched clinic/subscription data and billing reads before relying on database constraints as tenant isolation. |
| **Medium** | Account email is global, and profile edits apply to the global account rather than to one clinic membership. | This is consistent with the current schema, but should be made explicit to users managing multiple clinics. Test that changing a profile does not accidentally imply a per-clinic change. |
| **Product gap** | There are no patient/guardian data models or tenant-scoped patient APIs yet; the family sign-in page is a static screen with a disabled button. | The `responsable` role does not currently implement a parent/guardian portal. Do not treat family users or patient records as tenant-isolated until those models and authorization paths exist and have dedicated tests. |
| **Operational security** | Credential sign-in has no rate-limiting or MFA mechanism in the inspected code. Email verification is not required by sign-in. | Validate the deployment's abuse controls and account-recovery policy before using real user accounts. |

## 7. Suggested pre-production isolation checks

Use two test clinics, distinct clinic admins, and at least one test user with memberships in both clinics. Verify that:

1. Clinic A cannot list, edit, delete, or count Clinic B's users, roles, or cabinet profile by changing a URL, request body, or query parameter.
2. A user with an inactive membership, or no membership, receives no cabinet data even when they know the clinic slug.
3. A custom role created in A is not visible or assignable in B; role counts and deletion checks only consider the current clinic.
4. Removing a user's membership from A leaves the account and its membership in B intact.
5. A soft-deleted clinic cannot be entered through a page or cabinet API.
6. Suspension and subscription-expiry behavior is consistent between rendered pages and direct API calls (see the high-priority finding above).
7. Re-running the seed on a copied production-like database has understood and reviewed effects on existing role assignments.
8. A user with two active memberships can identify which clinic the current session selected, and the lack of a switcher is acceptable for the release.
9. A payment cannot be associated with another clinic's subscription through supported owner actions, and the database is checked for any existing mismatches.
10. Updating an account's name, email, or password affects the intended global account and does not alter the user's memberships or roles.

These checks should run against a disposable staging database with representative memberships; this repository review does not certify production data or deployment configuration.
