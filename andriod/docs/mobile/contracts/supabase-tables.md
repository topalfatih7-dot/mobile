# Contract — Supabase Tables (core)

| Table | Role |
|-------|------|
| members | id=auth.uid, email, name, phone, role, membership, membership_status, assigned_*_id, data JSONB |
| staff | id, email, name, role coach\|dietitian\|doctor, active, data JSONB — ham SELECT RLS: yalnızca admin veya kendi e-posta kaydı |
| staff_directory / staff_public | Güvenli kadro görünümü (id, name, role, active, data without contact). Üye tarafı koç/diyetisyen isimleri buradan |
| programs | member_id, staff_id, data JSONB |
| posts | published, data JSONB |
| tickets | member_id, status, data JSONB |
| activities | member_id, data JSONB |
| payments | member_id, data JSONB |
| site_content | kind, sort, data |
| exercises | metadata + video_url path, locations[], requires_machine |
| plans | `pricing_tiers`, `entitlements` jsonb, `is_sellable`, `billing_type` |
| staff_applications / corporate_applications / contact_inquiries | intake |
| chat_threads / chat_messages | member-staff chat |
| admin_staff_* / staff_collab_* | other chats |
| staff_earnings | staff_id, amount_try, period_key, overlap_minutes, session_type, member_name, session_started_at |
| staff_payout_accounts | staff_id PK, iban, bank_code, account_holder_name — personel yazar, admin okur; kadro JSONB’de tutulmaz |

RLS enabled; mobile uses user JWT only. Details in `supabase/setup.sql` + migrations.

## members.data (important keys)

- Profile: `photo`, `city`, `district`, `birthDate`, `gender`, `age`, `weight`, `height`, `waist`, `goals[]`, `fitnessLevel`, `nutritionPrefs[]`, `phoneCountry`
- Packages: `packageConfig`, `activePackages` (`stripeSubscriptionId`, `cancelAtPeriodEnd`, `currentPeriodEnd`, `expiresAt`, `provider`), `premiumExpiresAt`, `stripeSubscriptionId` (legacy tek id)
- Health / progress: `healthTest`, `completedActivities`, `progress`, `healthAnalysis`, `waterTracking` (`dailyGoalMl`, `goalUpdatedBy`)
- Water logs table: `member_water_logs` (not JSONB). RPC `set_member_water_goal`. Domain: [`water-tracking.md`](../domains/water-tracking.md)
- Sessions: `coachSessions`, `dietitianSessions`, `doctorSessions` (or mapper equivalents)
- Settings: `settings` — `emailNotifs`, `pushNotifs`, `soundNotifs`, `reminderNotifs`
- Verification: `emailVerifiedAt`, `phoneVerifiedAt`, `pendingEmailVerification`, `pendingPhoneVerify`
- Other: `notifications[]`, `availability`, `streak`, `supportSchedule`, `healthAck`, `disclaimer`, `tasks`
