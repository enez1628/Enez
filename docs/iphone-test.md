# iPhone'da Deneme

Bu prototip iPhone'da iki sekilde denenebilir.

## 1. Hemen deneme: PWA / Safari

PR main branch'e merge edildikten ve GitHub Pages workflow'u tamamlandiktan sonra su adres acilir:

```text
https://enez1628.github.io/Enez/
```

iPhone'da:

1. Safari'yi ac.
2. Linke git: `https://enez1628.github.io/Enez/`
3. Alt kisimdaki Paylas butonuna bas.
4. `Ana Ekrana Ekle` sec.
5. `Ekle` butonuna bas.
6. Ana ekrandaki `Bir Hamle Daha` ikonundan oyunu ac.

Bu yontem App Store gerektirmez.

## 2. Gercek iOS uygulamasi: TestFlight

TestFlight icin gerekenler:

- Apple Developer hesabi
- Mac bilgisayar
- Xcode
- App Store Connect erisimi

Bu repoda iOS proje iskeleti hazirdir:

```text
ios/
```

Mac uzerinde:

```bash
npm ci
npm run ios:sync
npx cap open ios
```

Sonra Xcode'da:

1. Signing ayarlanir.
2. Bundle id kontrol edilir: `com.birhamledaha.game`
3. Archive alinir.
4. App Store Connect'e yuklenir.
5. TestFlight test kullanicisi eklenir.

## Not

APK sadece Android icindir. iPhone APK kuramaz.
