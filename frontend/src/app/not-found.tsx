import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container-page text-center py-20">
      <h1 className="text-6xl font-heading font-bold text-primary mb-4">404</h1>
      <p className="text-xl text-gray-400 mb-8">Pagina non trovata</p>
      <Link href="/" className="btn-primary">Torna alla Home</Link>
    </div>
  );
}
