# Contract — Client Row Mappers (LOCK)

Port these shapes from `supabaseDb.js` / chatDb — do not invent field names.

## Member (`rowToMember`)

Columns + `data` merge; then `syncMemberPackages`:

- id, email, name, phone
- membership, membershipStatus
- assignedCoachId, assignedDietitianId, assignedDoctorId
- role
- plus all `data` keys except nested assigned* duplicates: healthTest, packageConfig, activePackages, notifications, completedActivities, progress, availability, coachSessions, dietitianSessions, doctorSessions, healthAck, disclaimer, healthAnalysis, tasks, settings, photo, city, district, birthDate, gender, age, weight, height, waist, goals, fitnessLevel, nutritionPrefs, phoneCountry, emailVerifiedAt, phoneVerifiedAt, pendingEmailVerification, pendingPhoneVerify, streak, supportSchedule, premium* fields, etc.

## Staff (`rowToStaff`)

id, email, name, role, active + `normalizeStaffProfile(data)` (availability, bio, tempPasswordIssued, …)

## Plan (`rowToPlan`)

Web `supabaseDb.rowToPlan`: id, name, price, period, isActive, isSellable, billingType, entitlements (`normalizeEntitlements`), pricingTiers, badge, features, limits, color, icon, emoji, sortOrder.

`{ ...data, id, memberId, staffId }`

## Post

`{ ...data, id, published }`

## Ticket

`{ ...data, id, memberId, status }` — data has subject, category, messages[], memberName

## Exercise (`rowToExercise`)

Include videoUrl path, videoPending, locations[], requires_machine → requiresMachine, taxonomy fields — copy function body from supabaseDb.

## Chat

See `domains/chat-model.md`.
