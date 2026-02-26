import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-all duration-500 flex items-center justify-center px-4 py-24 relative overflow-hidden">

      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-50/50 via-transparent to-blue-50/50 dark:from-violet-900/20 dark:to-blue-900/20"></div>
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-violet-200 dark:bg-violet-700 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-blue-200 dark:bg-blue-700 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
      </div>

      <div className="relative max-w-2xl w-full text-center transition-all duration-1000 animate-fadeIn">
        
        {/* 404 Text */}
        <h1 className="text-6xl md:text-7xl lg:text-8xl font-black mb-8 leading-tight">
          <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 dark:from-violet-400 dark:via-indigo-400 dark:to-blue-400 bg-clip-text text-transparent">
            404
          </span>
        </h1>

        {/* Message */}
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
          {t('notFound.title')}
        </h2>
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-xl mx-auto leading-relaxed font-light">
          {t('notFound.description')}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-6">
          <Link 
            to="/" 
            className="group px-10 py-4 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white font-semibold text-lg hover:from-violet-700 hover:via-indigo-700 hover:to-blue-700 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 transform"
          >
            <span className="flex items-center justify-center gap-2">
              <Home size={20} />
              {t('notFound.goHome')}
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </span>
          </Link>

          <button 
            onClick={() => window.history.back()}
            className="px-10 py-4 rounded-2xl border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-semibold text-lg hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-violet-300 dark:hover:border-violet-600 transition-all duration-300"
          >
            <span className="flex items-center justify-center gap-2">
              <ArrowLeft size={20} />
              {t('notFound.goBack')}
            </span>
          </button>
        </div>

        {/* Decorative Dots */}
        <div className="mt-12 flex justify-center space-x-2">
          <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
}
