import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center p-8">
        <h1 className="text-6xl font-bold text-white mb-4">404</h1>
        <h2 className="text-2xl font-bold text-white mb-4">
          Page Not Found
        </h2>
        <p className="text-gray-300 mb-6 max-w-md">
          The page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL.
        </p>
        <div className="space-x-4">
          <Link 
            href="/"
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full font-medium transition-colors"
          >
            Go Home
          </Link>
          <Link 
            href="/search"
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-full font-medium transition-colors"
          >
            Search
          </Link>
        </div>
      </div>
    </div>
  );
} 