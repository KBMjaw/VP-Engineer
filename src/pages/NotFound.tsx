import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SITE } from '../config/site';

export default function NotFound() {
  useEffect(() => {
    document.title = `Page not found · ${SITE.name}`;
  }, []);
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center font-body">
      <img src="/img/vp-logo-96.png" alt={`${SITE.name} logo`} className="h-16 w-auto" />
      <p className="mt-8 font-mono text-sm font-semibold tracking-[.2em] text-muted">ERROR 404</p>
      <h1 className="mt-3 font-head text-4xl font-bold tracking-tight sm:text-5xl">This page isn’t on the drawing.</h1>
      <p className="mt-4 max-w-md text-muted">The page you’re looking for doesn’t exist or has moved.</p>
      <Link to="/" className="btn btn--dark mt-8">
        Back to home
      </Link>
    </main>
  );
}
