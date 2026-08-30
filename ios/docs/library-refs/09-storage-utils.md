# 09 — Storage & Utils

## @react-native-async-storage/async-storage 2.2.0

**Expo docs:** https://docs.expo.dev/versions/v56.0.0/sdk/async-storage/  
- Consent once-ever, UI flags, non-secret cache
- Secrets → SecureStore (AsyncStorage şifrelemez)

## date-fns ^4.4.0

Takvim, randevu, expiry format. Timezone: cihaz local; sunucu UTC ise mapper’a dikkat (`row-mappers`).

## react-native-get-random-values ^1.11.0

Polyfill — crypto / uuid ihtiyaçlarında entry’de import sırası önemli (genelde en üstte).
