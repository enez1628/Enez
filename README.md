# Bir Hamle Daha

Mobil ekrana uygun, oynanabilir hybrid-casual puzzle prototipi.

## Ozellikler

- 30 seviyelik ilk prototip akisi
- Sinirli hamle ve hedef temizleme sistemi
- Puan, altin, can ve gunluk odul
- Ipucu, karistir ve geri al guclendirmeleri
- Kaybedince "Reklam Izle +5 Hamle" simule odullu reklam akisi
- Sade, buyuk dokunma alanli mobil arayuz
- PWA, Android ve iOS paketleme altyapisi

## Calistirma

```bash
npm start
```

Tarayicida `http://localhost:4173` adresini ac.

## Test

```bash
npm test
```

## Mobil build mantigi

Bu proje su anda web tabanli mobil prototip olarak calisir ve Capacitor ile native mobil uygulamaya paketlenir.

- Android icin hedef dosya: APK veya AAB
- iPhone icin hedef dosya: IPA / TestFlight build
- iPhone'da hemen deneme yolu: Safari ile acip "Ana Ekrana Ekle"

## Web/PWA build

```bash
npm run build
```

Bu komut `dist/` klasorune paketlenebilir web dosyalarini uretir.

Test etmek icin:

```bash
npm run serve:dist
```

Sonra tarayicida `http://localhost:4174` adresini ac.

## Android APK hazirlama

Android proje dosyalari `android/` klasorundedir.

Web dosyalarini Android projesine aktarmak icin:

```bash
npm run android:sync
```

Debug APK uretmek icin:

```bash
npm run android:debug
```

APK olusursa yol su olur:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

Not: Bu komut icin Android SDK ve Java/Gradle ortami gerekir.

## iPhone'da deneme

Hemen denemek icin:

1. Oyunu bir web adresinde yayinla.
2. iPhone'da Safari ile ac.
3. Paylas butonuna bas.
4. "Ana Ekrana Ekle" sec.

Bu yol App Store gerektirmez.

## iOS / TestFlight hazirlama

iOS proje dosyalari `ios/` klasorundedir.

iOS build almak icin Mac gerekir:

```bash
npm run mobile:sync
npx cap open ios
```

Sonra Xcode ile:

1. Apple Developer hesabi baglanir.
2. Bundle id kontrol edilir: `com.birhamledaha.game`
3. Signing ayarlanir.
4. Archive alinir.
5. TestFlight'a yuklenir.

## Sira sonraki adim

Gercek yayin asamasinda:

- AdMob reklam kimlikleri eklenecek
- Google Play Billing / Apple In-App Purchase baglanacak
- Uygulama ikonlari PNG store setine cevrilecek
- Gizlilik politikasi ve store ekran goruntuleri hazirlanacak
