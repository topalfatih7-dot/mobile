# Contract — POST /api/auth (LOCK)

Base: `{API_BASE}/api/auth`  
Method: POST  
Header: `Content-Type: application/json`  
Optional: `Authorization: Bearer <access_token>`

## MOBILE DIFF — client

Native Expo app must send:

1. Body: `"client": "yeniform-mobile"`
2. Header: `x-yeniform-mobile-key: <EXPO_PUBLIC_YENIFORM_MOBILE_API_SECRET>`  
   (Vercel `YENIFORM_MOBILE_API_SECRET` ile birebir)

Both required — `api/auth.js` `isVerifiedMobileClient`. Missing/wrong → **Bot doğrulaması gerekli.** Rate limits remain. Web browsers must still send Turnstile.

## password-login

### Request

```json
{
  "action": "password-login",
  "email": "user@example.com",
  "password": "Secret1!",
  "client": "yeniform-mobile",
  "turnstileToken": ""
}
```

### Success

```json
{
  "ok": true,
  "session": {
    "access_token": "<jwt>",
    "refresh_token": "<refresh>"
  }
}
```

Client MUST `supabase.auth.setSession` with both tokens.

### Failure examples

```json
{ "error": "E-posta veya şifre hatalı." }
```

```json
{ "error": "Çok fazla deneme. Lütfen sonra tekrar deneyin." }
```

Status 429 for rate limit. Bot errors pass through API message.

---

## signup

### Request

```json
{
  "action": "signup",
  "email": "user@example.com",
  "password": "Secret1!",
  "name": "Ayşe Yılmaz",
  "client": "yeniform-mobile",
  "turnstileToken": ""
}
```

### Success

```json
{
  "ok": true,
  "authSessionToken": "<optional form session for unlock>"
}
```

### Known errors

| error / status | UX |
|----------------|-----|
| already_registered / 409 | Sign-in fallback; else “Bu e-posta adresi zaten kayıtlı…” |
| other error string | Show as-is |

After ok: `signInAfterSignup` / unlock path (web `ensureAuthForRegistration`).

---

## exercise-video-url

Auth required.

```json
{ "action": "exercise-video-url", "path": "gym100-0001.mp4" }
```

Success: `{ "url": "https://...signed...", "expiresIn": 900 }` or web’s actual fields — **verify response keys in `api/auth.js` before coding; do not invent**. Path must match `^[\w.-]+$`.

## exercise-video-urls

```json
{ "action": "exercise-video-urls", "paths": ["a.mp4", "b.mp4"] }
```

## book-session

See [api-book-session.md](api-book-session.md) (full LOCK).

## email-send

Auth required (`Authorization: Bearer <access_token>`).

```json
{ "action": "email-send" }
```

Success:

```json
{
  "ok": true,
  "message": "E-postanıza doğrulama bağlantısı gönderildi. Bağlantıya bir kez tıklayın."
}
```

Server stores `members.data.pendingEmailVerification` and emails a link with `evt` token. Client: `src/services/authVerification.ts` → `sendEmailVerification`.

## email-confirm

Optional bearer. Completes profile email verification via `evt` from the link (also handled on web AuthCallback).

```json
{ "action": "email-confirm", "evt": "<token>" }
```

Success: `{ "ok": true, "emailVerifiedAt": "<iso>" }` — sets `members.data.emailVerifiedAt`.

Optional alternate on profile UI: user pastes 6-digit OTP → client `supabase.auth.verifyOtp({ type: 'email' })` then patches `emailVerifiedAt` locally (`confirmEmailVerification`).

## password-reset

Follow ForgotPasswordPage + AuthCallbackPage; do not invent alternate recovery API.

## Mobile PROD rule

No fallback to raw `signInWithPassword` when API unreachable (web only allows fallback in non-PROD).
