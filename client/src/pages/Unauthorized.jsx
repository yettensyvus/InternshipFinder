import { Link } from 'react-router-dom';

export default function Unauthorized() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4 py-24">
      <div className="max-w-lg w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur border border-gray-200/60 dark:border-gray-700/60 rounded-3xl shadow-xl p-8 text-center">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Unauthorized</h1>
        <p className="mt-3 text-gray-600 dark:text-gray-300">You don’t have permission to access this page.</p>
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
          <Link
            to="/"
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white font-semibold hover:from-violet-700 hover:via-indigo-700 hover:to-blue-700 transition-all duration-300 shadow-md"
          >
            Go home
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-6 py-3 rounded-2xl border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300"
          >
            Go back
          </button>
        </div>
      </div>
    </div>
  );
}
