import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

type BlogPostDraft = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  status: "draft" | "published";
  coverImage: string;
  publishedAt: string;
  seoTitle: string;
  seoDescription: string;
  keywords: string;
  author: string;
  category: string;
};

const initialDrafts: BlogPostDraft[] = [
  {
    id: "1",
    title: "How Buruj Skyport is redefining student admissions and digital visibility",
    slug: "buruj-skyport-student-admissions-digital-visibility",
    excerpt:
      "Modern institutions need strong digital storytelling, search visibility, and publication workflows that work across mobile and desktop.",
    status: "published",
    coverImage:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "2026-10-18",
    seoTitle: "Buruj Skyport admissions and digital media strategy",
    seoDescription:
      "A modern admissions and news publishing workflow designed to improve SEO visibility and engagement across devices.",
    keywords: "admissions, news, SEO, digital publishing, Buruj Skyport",
    author: "Editorial Team",
    category: "School News",
  },
  {
    id: "2",
    title: "Why structured news metadata matters for rankings and social sharing",
    slug: "structured-news-metadata-rankings-social-sharing",
    excerpt:
      "Search engines and social platforms reward clear metadata, consistent thumbnails, and accessible article structures.",
    status: "published",
    coverImage:
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "2026-10-12",
    seoTitle: "Structured metadata in news publishing and SEO",
    seoDescription:
      "Learn how metadata, article summaries, and clean page structure improve social previews and search visibility.",
    keywords: "SEO, metadata, open graph, social sharing, blog strategy",
    author: "Content Team",
    category: "SEO",
  },
  {
    id: "3",
    title: "Designing a responsive school blog experience for mobile, tablet and desktop",
    slug: "responsive-school-blog-mobile-tablet-desktop",
    excerpt:
      "A clearer layout system makes editorial content easier to read, improve conversion, and maintain a polished newsroom experience.",
    status: "draft",
    coverImage:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "2026-10-05",
    seoTitle: "Responsive school blog design for mobile and tablet",
    seoDescription:
      "Responsive layouts, content hierarchy, and optimized spacing for a polished school blog experience on every device.",
    keywords: "responsive blog, school website, mobile layout, tablet layout, content design",
    author: "Creative Team",
    category: "Design",
  },
];

export const Route = createFileRoute("/_authenticated/content")({
  component: ContentAdminPage,
});

function ContentAdminPage() {
  const [posts, setPosts] = useState<BlogPostDraft[]>(initialDrafts);
  const [selectedId, setSelectedId] = useState(initialDrafts[0]?.id ?? "");

  const selectedPost = useMemo(
    () => posts.find((post) => post.id === selectedId) ?? posts[0],
    [posts, selectedId],
  );

  const updateSelectedPost = <K extends keyof BlogPostDraft>(key: K, value: BlogPostDraft[K]) => {
    if (!selectedPost) return;

    setPosts((current) =>
      current.map((post) => (post.id === selectedPost.id ? { ...post, [key]: value } : post)),
    );
  };

  const publishedCount = posts.filter((post) => post.status === "published").length;
  const draftCount = posts.filter((post) => post.status === "draft").length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-5 lg:px-8 lg:py-8">
        <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Content management</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">News & blog admin</h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
              {publishedCount} published
            </span>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
              {draftCount} drafts
            </span>
          </div>
        </header>

        <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <AdminStatCard label="SEO ready" value="WP-style" tone="emerald" />
          <AdminStatCard label="Social preview" value="OG + Twitter" tone="blue" />
          <AdminStatCard label="Content health" value="Responsive" tone="violet" />
        </section>

        <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold">Posts</h2>
              <button
                type="button"
                className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700"
                onClick={() => {
                  const newPost: BlogPostDraft = {
                    id: `${Date.now()}`,
                    title: "New article",
                    slug: `new-article-${Date.now()}`,
                    excerpt: "Write a concise article summary here.",
                    status: "draft",
                    coverImage:
                      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80",
                    publishedAt: new Date().toISOString(),
                    seoTitle: "New article title",
                    seoDescription: "Write a search-friendly summary for this article.",
                    keywords: "news, school, admissions",
                    author: "Admin",
                    category: "News",
                  };

                  setPosts((current) => [newPost, ...current]);
                  setSelectedId(newPost.id);
                }}
              >
                + New post
              </button>
            </div>

            <div className="space-y-3">
              {posts.map((post) => (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => setSelectedId(post.id)}
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    selectedPost?.id === post.id
                      ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="line-clamp-2 text-sm font-semibold">{post.title}</p>
                      <p className={`mt-1 text-[11px] ${selectedPost?.id === post.id ? "text-slate-300" : "text-slate-500"}`}>
                        {post.category}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        post.status === "published"
                          ? selectedPost?.id === post.id
                            ? "bg-emerald-500/20 text-emerald-200"
                            : "bg-emerald-100 text-emerald-700"
                          : selectedPost?.id === post.id
                            ? "bg-amber-500/20 text-amber-200"
                            : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {post.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <main className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:p-6">
            {selectedPost ? (
              <div className="space-y-6">
                <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Editing</p>
                    <h2 className="mt-1 text-xl font-bold sm:text-2xl">{selectedPost.title}</h2>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateSelectedPost("status", "draft")}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                      Save as draft
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSelectedPost("status", "published")}
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
                    >
                      Publish article
                    </button>
                  </div>
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Article title
                    <input
                      value={selectedPost.title}
                      onChange={(event) => updateSelectedPost("title", event.target.value)}
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white"
                    />
                  </label>

                  <label className="block text-sm font-medium text-slate-700">
                    Category
                    <input
                      value={selectedPost.category}
                      onChange={(event) => updateSelectedPost("category", event.target.value)}
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white"
                    />
                  </label>
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Slug
                    <input
                      value={selectedPost.slug}
                      onChange={(event) => updateSelectedPost("slug", event.target.value)}
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white"
                    />
                  </label>

                  <label className="block text-sm font-medium text-slate-700">
                    Author
                    <input
                      value={selectedPost.author}
                      onChange={(event) => updateSelectedPost("author", event.target.value)}
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white"
                    />
                  </label>
                </div>

                <label className="block text-sm font-medium text-slate-700">
                  Thumbnail image URL
                  <input
                    value={selectedPost.coverImage}
                    onChange={(event) => updateSelectedPost("coverImage", event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white"
                  />
                </label>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  <img
                    src={selectedPost.coverImage}
                    alt={selectedPost.title}
                    className="h-48 w-full object-cover sm:h-56 lg:h-64"
                  />
                </div>

                <label className="block text-sm font-medium text-slate-700">
                  Short summary
                  <textarea
                    value={selectedPost.excerpt}
                    onChange={(event) => updateSelectedPost("excerpt", event.target.value)}
                    rows={4}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white"
                  />
                </label>

                <div className="grid gap-5 lg:grid-cols-2">
                  <label className="block text-sm font-medium text-slate-700">
                    SEO title
                    <input
                      value={selectedPost.seoTitle}
                      onChange={(event) => updateSelectedPost("seoTitle", event.target.value)}
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white"
                    />
                  </label>

                  <label className="block text-sm font-medium text-slate-700">
                    Published date
                    <input
                      type="date"
                      value={selectedPost.publishedAt.slice(0, 10)}
                      onChange={(event) => updateSelectedPost("publishedAt", new Date(`${event.target.value}T00:00:00`).toISOString())}
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white"
                    />
                  </label>
                </div>

                <label className="block text-sm font-medium text-slate-700">
                  Meta description
                  <textarea
                    value={selectedPost.seoDescription}
                    onChange={(event) => updateSelectedPost("seoDescription", event.target.value)}
                    rows={3}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white"
                  />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Keywords
                  <input
                    value={selectedPost.keywords}
                    onChange={(event) => updateSelectedPost("keywords", event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white"
                  />
                </label>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Preview for social sharing</p>
                  <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <img src={selectedPost.coverImage} alt={selectedPost.title} className="h-36 w-full object-cover" />
                    <div className="space-y-1 p-3">
                      <p className="text-sm font-semibold text-slate-900">{selectedPost.seoTitle}</p>
                      <p className="text-xs text-slate-600">{selectedPost.seoDescription}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-slate-500">
                Select or create a post to continue.
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function AdminStatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "emerald" | "blue" | "violet";
}) {
  const tones = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    blue: "border-sky-200 bg-sky-50 text-sky-700",
    violet: "border-violet-200 bg-violet-50 text-violet-700",
  };

  return (
    <div className={`rounded-2xl border p-4 ${tones[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.2em]">{label}</p>
      <p className="mt-2 text-lg font-bold">{value}</p>
    </div>
  );
}
