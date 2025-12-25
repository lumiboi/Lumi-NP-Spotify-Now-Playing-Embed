# Spotify Now Playing Widget - Kurulum

## Genel Bakış
Bu proje Vercel'e deploy edilecek ve canlı Spotify "Now Playing" widget'ı sağlayacak.

---

## 1. Spotify Developer Hesabı Kurulumu

1. **https://developer.spotify.com/dashboard** adresine git
2. **"Create App"** butonuna tıkla
3. Bilgileri doldur:
   - **App name:** `Now Playing Widget`
   - **App description:** `Personal now playing widget`
   - **Redirect URI:** `http://localhost:3000/callback`
   - **APIs used:** `Web API`
4. Kaydettikten sonra **Settings** bölümünden şunları not al:
   - `Client ID`
   - `Client Secret`

---

## 2. Refresh Token Alma

Tarayıcıda şu URL'yi aç (CLIENT_ID'yi değiştir):

```
https://accounts.spotify.com/authorize?client_id=CLIENT_ID_BURAYA&response_type=code&redirect_uri=http://localhost:3000/callback&scope=user-read-currently-playing%20user-read-recently-played
```

Yönlendirme URL'sinden `code` parametresini kopyala.

Sonra terminal'de şu komutu çalıştır (değerleri değiştir):

```bash
curl -X POST https://accounts.spotify.com/api/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "Authorization: Basic BASE64_ENCODED_CLIENT_ID_SECRET" \
  -d "grant_type=authorization_code" \
  -d "code=AUTHORIZATION_CODE" \
  -d "redirect_uri=http://localhost:3000/callback"
```

`BASE64_ENCODED_CLIENT_ID_SECRET` = Base64 encode of `client_id:client_secret`

Yanıttan `refresh_token` değerini kaydet.

---

## 3. Vercel'e Deploy

1. Bu `spotify` klasörünü GitHub'a push et
2. Vercel'de "Import Project" yap
3. Environment Variables ekle:
   - `SPOTIFY_CLIENT_ID`
   - `SPOTIFY_CLIENT_SECRET`  
   - `SPOTIFY_REFRESH_TOKEN`
4. Deploy et

---

## 4. Embed Kodu

Deploy sonrası URL'ni al ve şu şekilde embed et:

```html
<img src="https://YOUR-VERCEL-URL.vercel.app/api/spotify" alt="Spotify Now Playing" />
```

veya iframe olarak:

```html
<iframe src="https://YOUR-VERCEL-URL.vercel.app/api/spotify-widget" width="400" height="150" frameborder="0"></iframe>
```
