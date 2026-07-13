# Mobil Google OAuth — web sitesine yönlenme (kök neden + düzeltme)

Web kurulum: `Serenova-F-t/docs/setup/OAUTH_SETUP.md`  
Mobil kod: `src/services/oauthAuth.ts`

## Neden web sitesi açılıyor?

1. Uygulama `signInWithOAuth` çağırırken `redirectTo` olarak **mobil deep link** gönderir  
   (ör. `yeniform://auth/callback` veya Expo Go’da `exp://192.168.x.x:8081/--/auth/callback`).
2. Supabase, bu URL’yi **Authentication → URL Configuration → Redirect URLs** listesinde bulamazsa  
   `redirect_to`’yu **Site URL** ile değiştirir: `https://www.yeniform.com`.
3. OAuth bitince tarayıcı / AuthSession **web sitesine** düşer; native callback hiç çalışmaz.

Web dokümanındaki Redirect URLs yalnızca site callback’lerini listeler (`https://www.yeniform.com/auth/callback` vb.).  
Mobil şemalar orada yoktu → bu semptom.

## Senin yapman gereken (Dashboard — zorunlu)

[URL Configuration](https://supabase.com/dashboard/project/rvzksmyhsgxgrxgeabmi/auth/url-configuration)

**Site URL** aynı kalsın: `https://www.yeniform.com` (web bozulmasın).

**Redirect URLs** listesine ekle (mevcut web satırlarını silme):

| URL | Ne için |
|-----|---------|
| `yeniform://**` | Native / development build (wildcard) |
| `yeniform://auth/callback` | Tam eşleşme (önerilir) |
| `exp://**` | Expo Go (IP değişince de çalışsın) |
| `http://localhost:8081/auth/callback` | Expo web lokal |
| `http://127.0.0.1:8081/auth/callback` | Expo web lokal |

Kaydet → uygulamayı kapatıp Google ile tekrar dene.

## Google Cloud tarafı

Değişmez: Authorized redirect URI hâlâ **Supabase** callback’i:

`https://rvzksmyhsgxgrxgeabmi.supabase.co/auth/v1/callback`

Mobil deep link Google Console’a eklenmez.

## Kodda ne yaptık?

- `makeRedirectUri({ scheme: 'yeniform', path: 'auth/callback' })` — platforma göre doğru callback
- Allow-list kaçırılırsa `redirectMisconfigured` + Dashboard link’li uyarı (web’e sessizce düşmez)
- `app/auth/callback.tsx` → oturum kurma rotasına yönlendirir
- `app.json` scheme: `yeniform`

## Test checklist

1. Redirect URLs güncellendi mi?
2. Expo Go / cihaz: Google → hesap seç → **uygulama geri açılmalı**, yeniform.com değil
3. Hâlâ site açılıyorsa: Alert’teki “beklenen URL”yi Dashboard’a birebir ekle
