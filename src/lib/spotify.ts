// src/lib/spotify.ts

import SpotifyWebApi from 'spotify-web-api-node';

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const redirectUri = process.env.SPOTIFY_REDIRECT_URI || 'http://127.0.0.1:3000/api/auth/callback/spotify';

if (!clientId || !clientSecret) {
  throw new Error(
    'Одна или несколько переменных окружения для Spotify не определены. Проверьте .env.local файл.'
  );
}

const scopes = [
  'user-read-email',
  'user-read-private',
  'playlist-read-private',
  'playlist-read-collaborative',
  'streaming',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-library-read',
  'user-read-recently-played'
].join(',');

const params = {
  response_type: 'code',
  client_id: clientId, 
  scope: scopes,
  redirect_uri: redirectUri, 
};

const queryParamString = new URLSearchParams(params).toString();

export const LOGIN_URL = `https://accounts.spotify.com/authorize?${queryParamString}`;

const spotifyApi = new SpotifyWebApi({
  clientId: clientId, 
  clientSecret: clientSecret,
  redirectUri:redirectUri,
});

export default spotifyApi;