export function TierFeaturesSection() {
  return (
    <section className="py-24 bg-slate-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-16 text-slate-900">Tailored for Every Contractor</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
            <div className="text-primary-600 font-bold mb-2">ENTERPRISE</div>
            <h3 className="text-2xl font-bold mb-4 text-slate-900">Proposal Managers</h3>
            <p className="text-slate-600 mb-6">Reduce risk and shred compliance matrices in seconds.</p>
            <ul className="space-y-3 text-sm text-slate-700">
              <li>✓ FAR/DFARS Compliance Checks</li>
              <li>✓ Automated Risk Analysis</li>
              <li>✓ Team Collaboration</li>
            </ul>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-md border-2 border-primary-100 transform md:-translate-y-4">
            <div className="text-primary-600 font-bold mb-2">SMB</div>
            <h3 className="text-2xl font-bold mb-4 text-slate-900">Founders & VPs</h3>
            <p className="text-slate-600 mb-6">Scale proposal capacity without hiring more staff.</p>
            <ul className="space-y-3 text-sm text-slate-700">
              <li>✓ AI Proposal Drafting</li>
              <li>✓ ROI Calculators</li>
              <li>✓ Competitor Analysis</li>
            </ul>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
            <div className="text-primary-600 font-bold mb-2">SET-ASIDE</div>
            <h3 className="text-2xl font-bold mb-4 text-slate-900">Niche Consultants</h3>
            <p className="text-slate-600 mb-6">Navigate certifications and find partner opportunities.</p>
            <ul className="space-y-3 text-sm text-slate-700">
              <li>✓ 8(a) / PSIB Guidance</li>
              <li>✓ Teaming Partner Search</li>
              <li>✓ Grant Database Access</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
