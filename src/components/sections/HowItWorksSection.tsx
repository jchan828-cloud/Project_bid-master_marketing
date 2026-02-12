export function HowItWorksSection() {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-16 text-slate-900">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-12">
          {[
            {
              step: '01',
              title: 'Monitor Opportunities',
              description: 'AI scans thousands of government sources daily for relevant RFPs.'
            },
            {
              step: '02',
              title: 'Generate Content',
              description: 'Create compliant proposals and marketing content instantly with Gemini 3.0.'
            },
            {
              step: '03',
              title: 'Win Contracts',
              description: 'Submit faster and more accurately to increase your win rate.'
            }
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="text-primary-600 font-bold text-lg mb-4">{item.step}</div>
              <h3 className="text-xl font-bold mb-4 text-slate-900">{item.title}</h3>
              <p className="text-slate-600">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
