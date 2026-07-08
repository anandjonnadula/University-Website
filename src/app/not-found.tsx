import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="text-center">
        <p className="font-display text-7xl font-bold text-primary-300 dark:text-primary-800">404</p>
        <h1 className="mt-4 font-display text-2xl font-semibold">This page wandered off campus</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
          The page you're looking for doesn't exist or has moved. Try the home page or the programs catalogue.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/" className="rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700">
            Go home
          </Link>
          <Link href="/programs" className="rounded-xl border border-line px-5 py-2.5 text-sm font-medium hover:border-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
            Browse programs
          </Link>
        </div>
      </div>
    </div>
  );
}
