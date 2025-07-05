# 🎵 Spotify Player Clone (SPC)

A modern, responsive web application that provides a Spotify-like music streaming experience. Built with Next.js 15, TypeScript, and Tailwind CSS, this application allows users to browse their Spotify library, play music, and discover new releases.

![SPC Screenshot](https://via.placeholder.com/800x400/1DB954/FFFFFF?text=Spotify+Player+Clone)

## ✨ Features

- **🎧 Music Playback**: Full integration with Spotify Web Playback SDK
- **📚 Library Management**: Browse your playlists, saved albums, and recent tracks
- **🆕 New Releases**: Discover the latest music releases
- **🎨 Modern UI**: Beautiful, responsive design with smooth animations
- **🔐 Authentication**: Secure Spotify OAuth integration
- **📱 Responsive Design**: Works seamlessly on desktop and mobile devices
- **⚡ Real-time Updates**: Live playback controls and progress tracking
- **🎯 Search & Filter**: Sort and filter your music library

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: [Redux Toolkit](https://redux-toolkit.js.org/)
- **UI Components**: [Headless UI](https://headlessui.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Authentication**: [Firebase](https://firebase.google.com/)
- **Music API**: [Spotify Web API](https://developer.spotify.com/documentation/web-api/)
- **Playback**: [Spotify Web Playback SDK](https://developer.spotify.com/documentation/web-playback-sdk/)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun
- Spotify Premium account (required for playback functionality)
- Spotify Developer account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/spc.git
   cd spc
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   SPOTIFY_REDIRECT_URI=http://localhost:3000/api/auth/callback
   FIREBASE_API_KEY=your_firebase_api_key
   FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   FIREBASE_PROJECT_ID=your_firebase_project_id
   ```

4. **Set up Spotify Developer App**
   
   - Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Create a new app
   - Add `http://localhost:3000/api/auth/callback` to Redirect URIs
   - Copy Client ID and Client Secret to your `.env.local`

5. **Run the development server**
   ```bash
   npm run dev
  

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.



## 🎮 Usage

1. **Authentication**: Click "Connect Spotify" to authenticate with your Spotify account
2. **Browse Library**: Navigate through your playlists, saved albums, and recent tracks
3. **Play Music**: Click on any track or album to start playback
4. **Control Playback**: Use the player controls at the bottom of the screen
5. **Discover**: Check out new releases in the "New Releases" section

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🌐 Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

### Environment Variables for Production

Make sure to update your environment variables with production URLs:

```env
SPOTIFY_REDIRECT_URI=https://yourdomain.com/api/auth/callback
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
