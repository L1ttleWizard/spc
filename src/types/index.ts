/**
 * Type definitions for the application
 */

// Library types
export type LibrarySortType = 'recents' | 'added' | 'alpha' | 'creator';
export type LibraryFilterType = 'playlist' | 'album';
export type ContentType = 'playlist' | 'album' | 'track';

// Library item interface
export interface LibraryItem {
  readonly id: string;
  readonly type: ContentType;
  readonly name: string;
  readonly imageUrl?: string;
  readonly subtitle: string;
  readonly creator: string;
  readonly dateAdded: Date | null;
  readonly lastPlayed: Date | null;
}

// Player state types
export interface PlayerState {
  readonly deviceId: string | null;
  readonly isActive: boolean;
  readonly isPlaying: boolean;
  readonly currentTrack: SimpleTrack | null;
  readonly volume: number;
  readonly position: number;
  readonly status: LoadingStatus;
}

// Simplified track interface
export interface SimpleTrack {
  readonly id: string;
  readonly uri: string;
  readonly name: string;
  readonly duration_ms: number;
  readonly artists: ReadonlyArray<SimpleArtist>;
  readonly album: SimpleAlbum;
}

export interface SimpleArtist {
  readonly name: string;
  readonly uri: string;
}

export interface SimpleAlbum {
  readonly name: string;
  readonly uri: string;
  readonly images: ReadonlyArray<SpotifyImage>;
}

export interface SpotifyImage {
  readonly url: string;
  readonly height?: number;
  readonly width?: number;
}

// User state types
export interface UserData {
  readonly uid: string;
  readonly email: string | null;
  readonly displayName: string | null;
}

export interface UserState {
  readonly user: UserData | null;
  readonly status: LoadingStatus;
  readonly error: string | null;
}

// Loading and error states
export type LoadingStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

// API response types
export interface ApiResponse<T> {
  readonly data: T | null;
  readonly error: string | null;
  readonly isLoading: boolean;
}

// Component props types
export interface BaseComponentProps {
  readonly className?: string;
  readonly children?: React.ReactNode;
}

export interface ContentProps {
  readonly playlists: ReadonlyArray<SpotifyApi.PlaylistObjectSimplified> | null;
  readonly albums: ReadonlyArray<SpotifyApi.SavedAlbumObject> | null;
  readonly newReleases: ReadonlyArray<SpotifyApi.AlbumObjectSimplified> | null;
}

// Cache types
export interface CacheEntry<T> {
  readonly data: T;
  readonly timestamp: number;
}

// Environment config
export interface SpotifyConfig {
  readonly clientId: string;
  readonly clientSecret: string;
  readonly redirectUri: string;
}
