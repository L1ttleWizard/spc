// src/app/api/auth/callback/spotify/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { setCookie } from 'cookies-next';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://127.0.0.1:3000';
  
  const redirectWithError = (errorType: string) => NextResponse.redirect(`${baseUrl}/?error=${errorType}`);

  if (error) {
    console.error('Callback error:', error);
    return redirectWithError('spotify_login_failed');
  }
  if (!code) {
    return redirectWithError('spotify_no_code');
  }

  // --- НАЧАЛО РУЧНОГО ОБМЕНА ТОКЕНОВ ---
  try {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const redirectUri = process.env.SPOTIFY_REDIRECT_URI || `${baseUrl}/api/auth/callback/spotify`;

    if (!clientId || !clientSecret) {
      throw new Error('Spotify Client ID или Secret не определены');
    }

    // Готовим тело запроса в формате x-www-form-urlencoded
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
    });

    // Делаем POST-запрос к эндпоинту токенов Spotify
    const spotifyResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        // Кодируем client_id:client_secret в Base64, как того требует Spotify
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body,
    });

    const data = await spotifyResponse.json();

    // Если Spotify вернул ошибку, выбрасываем ее, чтобы попасть в catch
    if (!spotifyResponse.ok) {
      console.error('Spotify API Error:', data);
      throw new Error(data.error_description || 'Не удалось получить токены');
    }

    const { access_token, refresh_token, expires_in } = data;

    // --- КОНЕЦ РУЧНОГО ОБМЕНА ТОКЕНОВ ---

    console.log('Токены успешно получены вручную!');

    const response = NextResponse.redirect(baseUrl);

    setCookie('spotify_access_token', access_token, {
      req: request, res: response, httpOnly: true,
      secure: process.env.NODE_ENV === 'production', maxAge: expires_in, path: '/',
    });
    setCookie('spotify_refresh_token', refresh_token, {
      req: request, res: response, httpOnly: true,
      secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 30, path: '/',
    });

    return response;

  } catch (err) {
    console.error('Ошибка при ручном получении токенов:', err);
    return redirectWithError('spotify_token_exchange_failed');
  }
}