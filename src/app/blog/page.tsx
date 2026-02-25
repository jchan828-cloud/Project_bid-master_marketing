import Link from 'next/link'
import { client } from '@/sanity/lib/client'

// Fetch all published posts from Sanity
async function getPosts() {
  const query = `*[_type == "post"] | order(publishedAt desc) {
    _id,
    title,
    slug,
    excerpt,
    tier,
    publishedAt,
    readingTime,
    "author": author->name,
    "categories": categories[]->title
  }`
  
  return client.fetch(query)
}

export default async function BlogPage() {
  const posts = await getPosts()

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-blue-400 hover:text-blue-300 mb-8 inline-block">
          ← Back to Home
        </Link>
        
        <h1 className="text-4xl font-bold mb-4">Blog</h1>
        <p className="text-slate-400 mb-8">
          GovCon insights, compliance updates, and proposal best practices.
        </p>
        
        {posts.length === 0 ? (
          <div className="p-6 bg-slate-900 rounded-xl border border-slate-800">
            <p className="text-slate-400">
              No posts yet. Create your first post in the{' '}
              <Link href="/studio" className="text-blue-400 hover:text-blue-300">
                Sanity Studio
              </Link>
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {posts.map((post: any) => (
              <article 
                key={post._id} 
                className="p-6 bg-slate-900 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className={`text-xs font-medium uppercase tracking-wider px-2 py-1 rounded ${
                    post.tier === 'enterprise' ? 'bg-blue-900/50 text-blue-400' :
                    post.tier === 'smb' ? 'bg-emerald-900/50 text-emerald-400' :
                    'bg-amber-900/50 text-amber-400'
                  }`}>
                    {post.tier || 'General'}
                  </span>
                  {post.categories?.map((cat: string) => (
                    <span key={cat} className="text-xs text-slate-500">
                      {cat}
                    </span>
                  ))}
                </div>
                
                <h2 className="text-xl font-semibold mb-2">
                  {post.title}
                </h2>
                
                {post.excerpt && (
                  <p className="text-slate-400 mb-4">
                    {post.excerpt}
                  </p>
                )}
                
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  {post.author && <span>By {post.author}</span>}
                  {post.publishedAt && (
                    <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                  )}
                  {post.readingTime && <span>{post.readingTime} min read</span>}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
