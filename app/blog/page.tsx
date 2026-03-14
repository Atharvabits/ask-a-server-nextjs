"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { fmtDate } from "@/lib/utils";

interface BlogPost {
  id: number;
  title: string;
  body: string;
  slug: string;
  status: string;
  photo_url?: string;
  author_email?: string;
  author_name?: string;
  author_company?: string;
  author_photo_url?: string;
  created_at: string;
  published_at?: string;
  score?: number;
  upvotes?: number;
  downvotes?: number;
  is_pinned?: boolean;
  is_admin_post?: boolean;
}

export default function BlogPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    api<BlogPost[]>("/api/public/blog")
      .then(setPosts)
      .catch(() => {});
  }, []);

  return (
    <div>
      <Header activeNav="/blog" />

      <main className="mx-auto max-w-[900px] px-5 pb-[60px]">
        <div className="py-10 text-center">
          <h1 className="mb-1 text-[28px] font-bold text-[var(--c-navy)]">Blog</h1>
          <p className="text-sm text-[var(--c-muted)]">Expert insights on service of process law and procedure</p>
          {user && (
            <button
              onClick={() => router.push("/settings?tab=my-blog")}
              className="mt-4 inline-flex items-center gap-1.5 rounded-[var(--r-md)] bg-[var(--c-navy)] px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-[var(--c-navy-l)]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Become a Contributor — Start Writing
            </button>
          )}
        </div>

        {(() => {
          const pinnedPosts = posts.filter((p) => p.is_pinned);
          const communityPosts = posts.filter((p) => !p.is_pinned && !p.is_admin_post);
          const adminPosts = posts.filter((p) => !p.is_pinned && p.is_admin_post);

          const renderCard = (post: BlogPost) => (
            <article
              key={post.id}
              onClick={() => router.push(`/blog/${post.slug || post.id}`)}
              className="cursor-pointer overflow-hidden rounded-[var(--r-lg)] border border-[var(--c-border)] bg-[var(--c-surface)] transition-all hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
            >
              {post.photo_url && (
                <img src={post.photo_url} alt="" className="h-[180px] w-full bg-[var(--c-surface2)] object-cover" />
              )}
              <div className="p-4">
                <h2 className="mb-1.5 text-base font-semibold leading-snug text-[var(--c-navy)]">{post.title}</h2>
                <p className="mb-2.5 line-clamp-2 text-[13px] leading-relaxed text-[var(--c-muted)]">
                  {post.body?.substring(0, 200)}...
                </p>
                <div className="flex items-center justify-between text-[11px] text-[var(--c-faint)]">
                  <div className="flex items-center gap-1.5">
                    {post.author_photo_url && (
                      <img src={post.author_photo_url} alt="" className="h-5 w-5 rounded-full object-cover" />
                    )}
                    <span>{post.author_name || post.author_company || post.author_email || "AskAServer.AI"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {post.is_pinned && (
                      <span className="rounded-full bg-[#dcfce7] px-2 py-0.5 text-[9px] font-bold text-[#16a34a]">PINNED</span>
                    )}
                    <span>{fmtDate(post.published_at || post.created_at)}</span>
                    {(post.upvotes !== undefined && post.upvotes > 0) && (
                      <span className="flex items-center gap-1 font-semibold">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" /></svg>
                        {post.upvotes}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </article>
          );

          return (
            <>
              {pinnedPosts.length > 0 && (
                <section className="mb-10">
                  <div className="mb-4 flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--c-navy)]">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    <h2 className="text-lg font-bold text-[var(--c-navy)]">Featured Posts</h2>
                  </div>
                  <div className="grid gap-5">{pinnedPosts.map(renderCard)}</div>
                </section>
              )}

              {communityPosts.length > 0 && (
                <section className="mb-10">
                  <div className="mb-1 flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--c-navy)]">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <h2 className="text-lg font-bold text-[var(--c-navy)]">Community Contributions</h2>
                  </div>
                  <p className="mb-4 text-xs text-[var(--c-muted)]">
                    Blog posts submitted by community members and approved by our editorial team.
                  </p>
                  <div className="grid gap-5">{communityPosts.map(renderCard)}</div>
                </section>
              )}

              {adminPosts.length > 0 && (
                <section className="mb-10">
                  <div className="mb-4 flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--c-navy)]">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    <h2 className="text-lg font-bold text-[var(--c-navy)]">From AskAServer.AI</h2>
                  </div>
                  <div className="grid gap-5">{adminPosts.map(renderCard)}</div>
                </section>
              )}

              {!posts.length && (
                <p className="py-12 text-center text-sm italic text-[var(--c-faint)]">No blog posts yet.</p>
              )}
            </>
          );
        })()}
      </main>

      <Footer />
    </div>
  );
}
