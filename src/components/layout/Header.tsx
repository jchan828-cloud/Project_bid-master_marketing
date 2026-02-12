export function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="text-xl font-bold text-slate-900">Bid-Master</div>
        <nav className="hidden md:flex gap-6 text-slate-600">
          <a href="#" className="hover:text-slate-900">Features</a>
          <a href="#" className="hover:text-slate-900">Pricing</a>
          <a href="#" className="hover:text-slate-900">Blog</a>
        </nav>
        <button className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700">
          Sign In
        </button>
      </div>
    </header>
  )
}
