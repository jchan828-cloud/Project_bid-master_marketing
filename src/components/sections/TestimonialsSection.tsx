export function TestimonialsSection() {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-16 text-slate-900">Trusted by Winners</h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-slate-50 p-8 rounded-lg">
            <p className="text-slate-700 italic mb-6">&quot;Bid-Master helped us double our proposal output without adding headcount. It&apos;s a game changer.&quot;</p>
            <div className="font-semibold text-slate-900">- Sarah J., VP of Sales</div>
            <div className="text-sm text-slate-500">Defense Prime Contractor</div>
          </div>
          <div className="bg-slate-50 p-8 rounded-lg">
            <p className="text-slate-700 italic mb-6">&quot;Finally, a tool that understands the nuances of 8(a) set-asides. The compliance checks saved us twice.&quot;</p>
            <div className="font-semibold text-slate-900">- Michael R., Founder</div>
            <div className="text-sm text-slate-500">Tech Solutions LLC</div>
          </div>
        </div>
      </div>
    </section>
  )
}
