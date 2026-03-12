"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
  photo_url?: string;
  author_email?: string;
  author_name?: string;
  author_photo_url?: string;
  author_id?: number;
  created_at: string;
  score?: number;
  user_vote?: number;
  link_url?: string;
  contributor_name?: string;
  contributor_company?: string;
  contributor_photo_url?: string;
  contributor_id?: number;
}

export default function BlogPostPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [score, setScore] = useState(0);
  const [userVote, setUserVote] = useState(0);

  useEffect(() => {
    if (params.slug) {
      api<BlogPost>(`/api/public/blog/${params.slug}`)
        .then((p) => {
          setPost(p);
          setScore(p.score || 0);
          setUserVote(p.user_vote || 0);
        })
        .catch(() => router.push("/blog"));
    }
  }, [params.slug, router]);

  const vote = async (dir: 1 | -1) => {
    if (!user) return;
    try {
      const d = await api<{ score: number; user_vote: number }>(`/api/blog/${post?.id}/vote`, {
        method: "POST",
        body: JSON.stringify({ vote: dir }),
      });
      setScore(d.score);
      setUserVote(d.user_vote);
    } catch { /* ignore */ }
  };

  if (!post) {
    return (
      <div>
        <Header />
        <div className="flex min-h-[50vh] items-center justify-center">
          <span className="spinner" style={{ width: 24, height: 24, borderWidth: 3, borderTopColor: "var(--c-navy)" }} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />

      <main className="mx-auto max-w-[800px] px-5 pb-[60px] pt-10">
        <button onClick={() => router.push("/blog")} className="mb-4 flex items-center gap-1.5 text-[13px] text-[var(--c-muted)] hover:text-[var(--c-navy)]">
          ← Back to Blog
        </button>

        <article className="mx-auto max-w-[700px]">
          {post.photo_url && (
            <img src={post.photo_url} alt="" className="mb-5 w-full rounded-[var(--r-lg)] object-cover" style={{ maxHeight: 400 }} />
          )}
          <h1 className="mb-2 text-2xl font-bold text-[var(--c-navy)]">{post.title}</h1>
          <div className="mb-5 flex items-center gap-2 text-xs text-[var(--c-muted)]">
            {post.author_photo_url && (
              <img src={post.author_photo_url} alt="" className="h-7 w-7 rounded-full object-cover" />
            )}
            <span>{post.author_name || post.author_email || "AskAServer.AI"}</span>
            <span>·</span>
            <span>{fmtDate(post.created_at)}</span>
          </div>
          <div className="text-sm leading-[1.8] text-[var(--c-text)] [&_p]:mb-3">
            {post.body.split("\n\n").map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          {post.link_url && (
            <a href={post.link_url} target="_blank" rel="noopener" className="mt-4 inline-block text-sm font-semibold text-[var(--c-navy)] hover:underline">
              Related Link →
            </a>
          )}

          {post.contributor_name && (
            <div className="mt-6 flex items-center gap-3 border-t border-[var(--c-divider)] pt-4">
              {post.contributor_photo_url ? (
                <img src={post.contributor_photo_url} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--c-surface2)] text-base font-semibold text-[var(--c-navy)]">
                  {post.contributor_name[0]?.toUpperCase()}
                </div>
              )}
              <div className="text-xs text-[var(--c-muted)]">
                <div className="text-sm font-semibold text-[var(--c-navy)]">{post.contributor_name}</div>
                {post.contributor_company && <div>{post.contributor_company}</div>}
              </div>
            </div>
          )}
        </article>

        <div className="mx-auto mt-6 flex max-w-[700px] items-center gap-4 border-t border-[var(--c-border)] pt-3">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => vote(1)}
              className={`flex h-7 w-7 items-center justify-center rounded-[var(--r-sm)] border text-sm transition-all ${
                userVote === 1
                  ? "border-[#16a34a] bg-[#dcfce7] text-[#16a34a]"
                  : "border-[var(--c-border)] text-[var(--c-muted)] hover:border-[var(--c-navy)] hover:text-[var(--c-navy)]"
              }`}
            >
              ▲
            </button>
            <span className="min-w-[24px] text-center text-sm font-semibold text-[var(--c-navy)]">{score}</span>
            <button
              onClick={() => vote(-1)}
              className={`flex h-7 w-7 items-center justify-center rounded-[var(--r-sm)] border text-sm transition-all ${
                userVote === -1
                  ? "border-[#dc2626] bg-[#fee2e2] text-[#dc2626]"
                  : "border-[var(--c-border)] text-[var(--c-muted)] hover:border-[var(--c-navy)] hover:text-[var(--c-navy)]"
              }`}
            >
              ▼
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
