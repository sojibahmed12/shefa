import Link from 'next/link';
import { Heart } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-shefa-50 to-white px-4">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-shefa-100">
          <Heart className="h-10 w-10 text-shefa-500" />
        </div>
        <h1 className="font-display text-4xl font-bold text-shefa-900">404</h1>
        <p className="mt-2 text-lg text-shefa-600">Page not found</p>
        <p className="mt-1 text-sm text-shefa-400">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="btn-primary mt-6 inline-flex"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
