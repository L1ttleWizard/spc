# Настройка Spotify Clone

## Проблемы с плеером и их решения

### 1. Создание файла .env.local

Создайте файл `.env.local` в корне проекта со следующими переменными:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Spotify Configuration
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/api/auth/callback/spotify
NEXT_PUBLIC_BASE_URL=http://127.0.0.1:3000
```

### 2. Настройка Spotify App

1. Перейдите на [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Создайте новое приложение
3. В настройках приложения добавьте Redirect URI: `http://127.0.0.1:3000/api/auth/callback/spotify`
4. Скопируйте Client ID и Client Secret в `.env.local`

### 3. Настройка Firebase

1. Создайте проект в [Firebase Console](https://console.firebase.google.com/)
2. Включите Authentication с Email/Password
3. Скопируйте конфигурацию в `.env.local`

### 4. Запуск приложения

```bash
npm run dev
```

### 5. Отладка плеера

В приложении добавлен компонент отладки `PlayerDebug`, который показывает:
- Наличие access token
- Device ID
- Состояние плеера (активен/неактивен)
- Текущий трек
- Громкость и позицию

### 6. Возможные проблемы

1. **Плеер не инициализируется**: Проверьте консоль браузера на ошибки
2. **Нет access token**: Убедитесь, что аутентификация Spotify работает
3. **Device ID отсутствует**: Плеер может не подключаться к Spotify
4. **Ошибки CORS**: Убедитесь, что redirect URI правильно настроен

### 7. Проверка работы

1. Откройте приложение в браузере
2. Войдите через Spotify
3. Проверьте компонент отладки
4. Откройте консоль браузера для просмотра логов
5. Попробуйте воспроизвести музыку

### 8. Логи для отладки

В консоли браузера вы должны увидеть:
- "Spotify SDK готов"
- "Плеер готов с ID устройства: [device_id]"
- "Состояние плеера изменилось: активно"

Если этих логов нет, проверьте:
- Правильность переменных окружения
- Настройки Spotify App
- Сетевые запросы в DevTools 