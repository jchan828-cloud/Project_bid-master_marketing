export function HeroSection() {
  return (
    <section className="bg-gradient-to-r from-slate-900 to-slate-800 text-white py-24">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Win More Government Contracts <span className="text-primary-400">Faster</span>.
        </h1>
        <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto text-slate-300">
          The AI-powered growth engine for Bid-Master. Generate compliant proposals in minutes, not weeks.
        </p>
        <div className="flex justify-center gap-4">
          <button className="bg-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-primary-500 transition-colors">
            Start Free Trial
          </button>
          <button className="border border-white/20 px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors">
            Watch Demo
          </button>
        </div>
      </div>
    </section>
  )
}
