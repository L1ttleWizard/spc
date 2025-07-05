import Link from 'next/link';

export default function PlaylistNotFound() {
  return (
    <main className="flex-1 overflow-y-auto p-8">
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h1 className="text-4xl font-bold mb-4">Плейлист не найден</h1>
        <p className="text-neutral-400 mb-8">
          Возможно, плейлист был удален или у вас нет к нему доступа.
        </p>
        <Link 
          href="/" 
          className="bg-green-500 text-black font-bold py-3 px-8 rounded-full text-lg hover:bg-green-600"
        >
          Вернуться на главную
        </Link>
      </div>
    </main>
  );
} 