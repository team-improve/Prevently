import { ArrowRightIcon, ChartBarIcon, NewspaperIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { lusitana } from '@/app/ui/fonts';

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 lg:px-8">
        <div className="flex items-center">
          <h1 className={`${lusitana.className} text-2xl font-bold text-gray-900`}>Prevently</h1>
        </div>
        <div className="flex items-center space-x-4">
          <Link
            href="/auth/login"
            className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/auth/register"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Prevent Economic
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Crises</span>
            <br />
            Before They Happen
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Empower banks and financial advisors with AI-driven insights from market emotions,
            spending patterns, and news analysis to predict and prevent large-scale economic events.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              Start Preventing Crises
              <ArrowRightIcon className="w-5 h-5" />
            </Link>
            <Link
              href="/auth/login"
              className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg text-lg font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
            >
              Sign In to Dashboard
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Comprehensive Economic Intelligence
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our advanced AI analyzes multiple data streams to provide actionable insights for crisis prevention.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1: Market Emotions */}
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg flex items-center justify-center mb-6">
                <ChartBarIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Market Emotions Analysis</h3>
              <p className="text-gray-600">
                Track sentiment across social media, trading platforms, and financial news to identify
                market psychology shifts that could signal impending crises.
              </p>
            </div>

            {/* Feature 2: Spending Patterns */}
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center mb-6">
                <CurrencyDollarIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Spending Patterns</h3>
              <p className="text-gray-600">
                Analyze consumer and business spending behaviors across industries to detect
                early warning signs of economic downturns or bubbles.
              </p>
            </div>

            {/* Feature 3: News Analysis */}
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mb-6">
                <NewspaperIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">News & Event Analysis</h3>
              <p className="text-gray-600">
                Process global news, regulatory changes, and geopolitical events in real-time
                to understand their potential economic impact.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-24 bg-white/50 backdrop-blur-sm rounded-2xl p-8 md:p-12">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">99.5%</div>
              <div className="text-gray-600">Prediction Accuracy</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">24/7</div>
              <div className="text-gray-600">Real-time Monitoring</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">500+</div>
              <div className="text-gray-600">Financial Institutions</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className={`${lusitana.className} text-2xl font-bold mb-4`}>Prevently</h3>
            <p className="text-gray-400 mb-8">
              Protecting economies through intelligent financial analysis.
            </p>
            <div className="flex justify-center space-x-6">
              <Link href="/auth/login" className="text-gray-400 hover:text-white transition-colors">
                Sign In
              </Link>
              <Link href="/auth/register" className="text-gray-400 hover:text-white transition-colors">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}