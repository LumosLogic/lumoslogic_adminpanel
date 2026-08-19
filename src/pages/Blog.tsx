import { useState } from "react";
import { useQuery } from "convex/react";
import { useAuthMutation } from "../hooks/useAuthMutation";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Plus, Pencil, Trash2, Loader2, X, Star } from "lucide-react";
import ImageUpload from "../components/ImageUpload";

type BlogForm = {
  slug: string; title: string; excerpt: string; content: string;
  author: string; authorRole: string; date: string; readTime: string;
  category: string; tags: string;
  imageId?: Id<"_storage">; imageUrl: string;
  featured: boolean; isActive: boolean;
  cloudinaryPublicId?: string; cloudinarySecureUrl?: string;
};

const EMPTY: BlogForm = {
  slug: "", title: "", excerpt: "", content: "",
  author: "", authorRole: "", date: new Date().toISOString().split("T")[0],
  readTime: "5 min read", category: "", tags: "",
  imageUrl: "", featured: false, isActive: true,
  cloudinaryPublicId: undefined, cloudinarySecureUrl: undefined,
};

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button type="button" onClick={onChange}
    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-200 focus:outline-none ${checked ? "bg-green-500" : "bg-gray-300"}`}>
    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${checked ? "translate-x-8" : "translate-x-1"}`} />
  </button>
);

export default function Blog() {
  const posts = useQuery(api.blogPosts.listAll);
  const create = useAuthMutation(api.blogPosts.create);
  const update = useAuthMutation(api.blogPosts.update);
  const toggleActive = useAuthMutation(api.blogPosts.toggleActive);
  const remove = useAuthMutation(api.blogPosts.remove);

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<Id<"blogPosts"> | null>(null);
  const [form, setForm] = useState<BlogForm>(EMPTY);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [currentImageId, setCurrentImageId] = useState<Id<"_storage"> | undefined>();
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Id<"blogPosts"> | null>(null);

  const openCreate = () => {
    setEditId(null); setForm(EMPTY);
    setCurrentImageUrl(null); setCurrentImageId(undefined);
    setShowModal(true);
  };

  const openEdit = (post: any) => {
    setEditId(post._id);
    setCurrentImageUrl(post.resolvedImageUrl ?? null);
    setCurrentImageId(post.imageId);
    setForm({
      slug: post.slug, title: post.title, excerpt: post.excerpt, content: post.content,
      author: post.author, authorRole: post.authorRole, date: post.date,
      readTime: post.readTime, category: post.category,
      tags: post.tags.join(", "), imageId: post.imageId,
      imageUrl: post.imageUrl ?? "", featured: post.featured, isActive: post.isActive,
      cloudinaryPublicId: post.cloudinaryPublicId ?? undefined,
      cloudinarySecureUrl: post.cloudinarySecureUrl ?? undefined,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
        imageUrl: form.imageUrl || undefined,
        imageId: form.imageId,
      };
      if (editId) await update({ id: editId, ...payload });
      else await create(payload);
      setShowModal(false);
    } finally { setSaving(false); }
  };

  const set = (key: keyof BlogForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#211951]">Blog Posts</h1>
          <p className="text-gray-500 text-sm mt-1">{posts?.length ?? 0} posts</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-[#A7F515] text-[#211951] px-5 py-2.5 font-bold text-sm hover:opacity-90">
          <Plus className="w-4 h-4" /> New Post
        </button>
      </div>

      {posts === undefined ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#211951]" /></div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-200">
          <p className="text-gray-500 mb-4">No blog posts yet.</p>
          <button onClick={openCreate} className="text-[#211951] font-bold underline text-sm">Create your first post</button>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div key={post._id} className="bg-white border border-gray-200 p-5 flex items-start justify-between gap-4 hover:border-[#A7F515] transition-colors">
              <div className="flex gap-4 min-w-0">
                {post.resolvedImageUrl && <img src={post.resolvedImageUrl} alt={post.title} className="w-16 h-16 object-cover border border-gray-200 shrink-0" />}
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-bold text-[#211951] text-sm">{post.title}</h3>
                    {post.featured && <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />}
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">{post.category}</span>
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${post.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {post.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{post.author} · {post.date} · {post.readTime}</p>
                  <p className="text-xs text-gray-400 mt-1 truncate max-w-xl">{post.excerpt}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Toggle checked={post.isActive} onChange={() => toggleActive({ id: post._id })} />
                <button onClick={() => openEdit(post)} className="p-2 text-gray-400 hover:text-[#211951]"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => setConfirmDelete(post._id)} className="p-2 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-[#211951]">{editId ? "Edit Post" : "New Blog Post"}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-6">
              <section>
                <h3 className="text-xs font-bold text-[#211951] uppercase tracking-widest mb-3">Meta</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Title *</label>
                    <input required value={form.title} onChange={set("title")} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Slug *</label>
                    <input required value={form.slug} onChange={set("slug")} placeholder="my-post-slug" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                    <input value={form.category} onChange={set("category")} placeholder="Technology, AI…" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Author *</label>
                    <input required value={form.author} onChange={set("author")} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Author Role</label>
                    <input value={form.authorRole} onChange={set("authorRole")} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Date</label>
                    <input type="date" value={form.date} onChange={set("date")} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Read Time</label>
                    <input value={form.readTime} onChange={set("readTime")} placeholder="5 min read" className={inputCls} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Tags (comma-separated)</label>
                    <input value={form.tags} onChange={set("tags")} placeholder="AI, Web Dev, React" className={inputCls} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Excerpt</label>
                    <textarea rows={2} value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} className={inputCls} />
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xs font-bold text-[#211951] uppercase tracking-widest mb-3">Cover Image</h3>
                <ImageUpload
                  currentUrl={currentImageUrl}
                  currentId={currentImageId}
                  cloudinaryPublicId={form.cloudinaryPublicId}
                  onUpload={(sid, url, cloudinary) => {
                    setForm(f => ({
                      ...f,
                      imageId: sid ?? undefined,
                      imageUrl: "",
                      cloudinaryPublicId: cloudinary?.publicId,
                      cloudinarySecureUrl: cloudinary?.secureUrl,
                    }));
                    setCurrentImageId(sid ?? undefined);
                    setCurrentImageUrl(cloudinary?.secureUrl ?? url);
                  }}
                  onRemove={() => {
                    setForm(f => ({ ...f, imageId: undefined, cloudinaryPublicId: undefined, cloudinarySecureUrl: undefined }));
                    setCurrentImageUrl(null);
                    setCurrentImageId(undefined);
                  }}
                />
                <div className="mt-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">— or paste image URL</label>
                  <input value={form.imageUrl} onChange={(e) => { setForm(f => ({ ...f, imageUrl: e.target.value, imageId: undefined })); setCurrentImageUrl(e.target.value || null); setCurrentImageId(undefined); }} placeholder="https://…" className={inputCls} />
                </div>
              </section>

              <section>
                <h3 className="text-xs font-bold text-[#211951] uppercase tracking-widest mb-3">Content (Markdown)</h3>
                <textarea required rows={20} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} className={`${inputCls} font-mono text-xs`} placeholder="# Heading&#10;&#10;Content here…" />
              </section>

              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-gray-700">
                  <input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} className="w-4 h-4 accent-[#A7F515]" />
                  Featured post
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-gray-700">
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 accent-[#A7F515]" />
                  Active (show on website)
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 bg-[#A7F515] text-[#211951] py-3 font-bold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : editId ? "Save Changes" : "Publish Post"}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-white p-8 max-w-sm w-full shadow-2xl text-center">
            <Trash2 className="w-10 h-10 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-[#211951] mb-2">Delete this post?</h3>
            <p className="text-gray-500 text-sm mb-6">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={async () => { await remove({ id: confirmDelete }); setConfirmDelete(null); }} className="flex-1 bg-red-500 text-white py-2.5 font-bold hover:bg-red-600">Delete</button>
              <button onClick={() => setConfirmDelete(null)} className="flex-1 border-2 border-gray-200 text-gray-600 py-2.5 font-bold hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls = "w-full px-4 py-2.5 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#A7F515] text-gray-900 text-sm";
