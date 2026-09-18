import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <h1 className="text-6xl font-extrabold text-red-600 mb-2">404</h1>
      <h2 className="text-2xl font-bold mb-4">Ajej! Tuhle stránku jsme nenašli.</h2>
      <p className="text-gray-600 mb-6 max-w-md">
        Požadovaná adresa neexistuje, nebo byla přesunuta na jinou cestu.
      </p>
      
      <Link
        href="/"
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
      >
        Vrátit se zpět na hlavní stranu
      </Link>
    </main>
  )
}