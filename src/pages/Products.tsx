import { useState } from "react";
import { useQuery } from "convex/react";
import { useAuthMutation } from "../hooks/useAuthMutation";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Plus, Pencil, Trash2, Loader2, X, PlusCircle, MinusCircle, ExternalLink } from "lucide-react";
import ImageUpload from "../components/ImageUpload";

type Feature = { title: string; description: string };
type Screen = { name: string; desc: string; imageId?: Id<"_storage">; imageUrl?: string; cloudinaryPublicId?: string; cloudinarySecureUrl?: string };
type FAQ = { q: string; a: string };

type ProductForm = {
  slug: string; name: string; tagline: string; description: string; longDescription: string;
  what_it_does: string; purpose: string; summary: string;
  functionality: string;
  screens: Screen[];
  heroImageId?: Id<"_storage">; heroImageUrl: string; siteUrl: string;
  features: Feature[];
  benefits: string; useCases: string; techStack: string;
  faq: FAQ[];
  isActive: boolean; order: number;
  heroCloudinaryPublicId?: string; heroCloudinarySecureUrl?: string;
};

const EMPTY: ProductForm = {
  slug: "", name: "", tagline: "", description: "", longDescription: "",
  what_it_does: "", purpose: "", summary: "", functionality: "", screens: [],
  heroImageUrl: "", siteUrl: "", features: [],
  benefits: "", useCases: "", techStack: "", faq: [],
  isActive: true, order: 0,
  heroCloudinaryPublicId: undefined, heroCloudinarySecureUrl: undefined,
};

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button type="button" onClick={onChange}
    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-200 focus:outline-none ${checked ? "bg-green-500" : "bg-gray-300"}`}>
    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${checked ? "translate-x-8" : "translate-x-1"}`} />
  </button>
);

const lines = (s: string) => s.split("\n").map(l => l.trim()).filter(Boolean);
const toLines = (arr: string[]) => arr.join("\n");

export default function Products() {
  const products = useQuery(api.products.listAll);
  const create = useAuthMutation(api.products.create);
  const update = useAuthMutation(api.products.update);
  const toggleActive = useAuthMutation(api.products.toggleActive);
  const remove = useAuthMutation(api.products.remove);

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<Id<"products"> | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [currentImageId, setCurrentImageId] = useState<Id<"_storage"> | undefined>();
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Id<"products"> | null>(null);
  const [screenImageUrls, setScreenImageUrls] = useState<(string | null)[]>([]);

  const openCreate = () => {
    setEditId(null); setForm(EMPTY);
    setCurrentImageUrl(null); setCurrentImageId(undefined);
    setScreenImageUrls([]);
    setShowModal(true);
  };

  const openEdit = (p: any) => {
    setEditId(p._id);
    setCurrentImageUrl(p.resolvedHeroImageUrl ?? null);
    setCurrentImageId(p.heroImageId);
    const sc: Screen[] = (p.screens ?? []).map((s: any) => ({
      name: s.name,
      desc: s.desc,
      imageId: s.imageId,
      imageUrl: s.imageUrl ?? "",
      cloudinaryPublicId: s.cloudinaryPublicId ?? undefined,
      cloudinarySecureUrl: s.cloudinarySecureUrl ?? undefined,
    }));
    setScreenImageUrls((p.screens ?? []).map((s: any) => s.resolvedImageUrl ?? s.cloudinarySecureUrl ?? s.imageUrl ?? null));
    setForm({
      slug: p.slug, name: p.name, tagline: p.tagline, description: p.description,
      longDescription: p.longDescription, what_it_does: p.what_it_does ?? "",
      purpose: p.purpose ?? "", summary: p.summary ?? "",
      functionality: toLines(p.functionality ?? []),
      screens: sc,
      heroImageId: p.heroImageId, heroImageUrl: p.heroImageUrl ?? "",
      siteUrl: p.siteUrl ?? "", features: p.features ?? [],
      benefits: toLines(p.benefits), useCases: toLines(p.useCases),
      techStack: (p.techStack ?? []).join(", "), faq: p.faq ?? [],
      isActive: p.isActive, order: p.order,
      heroCloudinaryPublicId: p.cloudinaryPublicId ?? undefined,
      heroCloudinarySecureUrl: p.cloudinarySecureUrl ?? undefined,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { heroCloudinaryPublicId, heroCloudinarySecureUrl, ...rest } = form;
      const payload = {
        ...rest,
        cloudinaryPublicId: heroCloudinaryPublicId,
        cloudinarySecureUrl: heroCloudinarySecureUrl,
        functionality: lines(form.functionality) || undefined,
        screens: form.screens.length ? form.screens : undefined,
        heroImageId: form.heroImageId,
        heroImageUrl: form.heroImageUrl || undefined,
        siteUrl: form.siteUrl || undefined,
        what_it_does: form.what_it_does || undefined,
        purpose: form.purpose || undefined,
        summary: form.summary || undefined,
        benefits: lines(form.benefits),
        useCases: lines(form.useCases),
        techStack: form.techStack.split(",").map(t => t.trim()).filter(Boolean),
      };
      if (editId) await update({ id: editId, ...payload });
      else await create(payload);
      setShowModal(false);
    } finally { setSaving(false); }
  };

  const set = (key: keyof ProductForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const addFeature = () => setForm(f => ({ ...f, features: [...f.features, { title: "", description: "" }] }));
  const removeFeature = (i: number) => setForm(f => ({ ...f, features: f.features.filter((_, idx) => idx !== i) }));
  const setFeature = (i: number, field: keyof Feature, val: string) =>
    setForm(f => ({ ...f, features: f.features.map((ft, idx) => idx === i ? { ...ft, [field]: val } : ft) }));

  const addFaq = () => setForm(f => ({ ...f, faq: [...f.faq, { q: "", a: "" }] }));
  const removeFaq = (i: number) => setForm(f => ({ ...f, faq: f.faq.filter((_, idx) => idx !== i) }));
  const setFaq = (i: number, field: "q" | "a", val: string) =>
    setForm(f => ({ ...f, faq: f.faq.map((item, idx) => idx === i ? { ...item, [field]: val } : item) }));

  const addScreen = () => {
    setForm(f => ({ ...f, screens: [...f.screens, { name: "", desc: "", imageUrl: "" }] }));
    setScreenImageUrls(u => [...u, null]);
  };
  const removeScreen = (i: number) => {
    setForm(f => ({ ...f, screens: f.screens.filter((_, idx) => idx !== i) }));
    setScreenImageUrls(u => u.filter((_, idx) => idx !== i));
  };
  const setScreen = (i: number, field: "name" | "desc" | "imageUrl", val: string) =>
    setForm(f => ({ ...f, screens: f.screens.map((s, idx) => idx === i ? { ...s, [field]: val } : s) }));
  const setScreenImage = (i: number, id: Id<"_storage"> | null, url: string | null, cloudinary?: { publicId: string; secureUrl: string }) => {
    setForm(f => ({ ...f, screens: f.screens.map((s, idx) => idx === i ? { ...s, imageId: id ?? undefined, imageUrl: "", cloudinaryPublicId: cloudinary?.publicId, cloudinarySecureUrl: cloudinary?.secureUrl } : s) }));
    setScreenImageUrls(u => u.map((v, idx) => idx === i ? (cloudinary?.secureUrl ?? url) : v));
  };
  const clearScreenImage = (i: number) => {
    setForm(f => ({ ...f, screens: f.screens.map((s, idx) => idx === i ? { ...s, imageId: undefined, cloudinaryPublicId: undefined, cloudinarySecureUrl: undefined } : s) }));
    setScreenImageUrls(u => u.map((v, idx) => idx === i ? null : v));
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#211951]">Products</h1>
          <p className="text-gray-500 text-sm mt-1">{products?.length ?? 0} products</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-[#A7F515] text-[#211951] px-5 py-2.5 font-bold text-sm hover:opacity-90">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {products === undefined ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#211951]" /></div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-200">
          <p className="text-gray-500 mb-4">No products yet.</p>
          <button onClick={openCreate} className="text-[#211951] font-bold underline text-sm">Add your first product</button>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <div key={p._id} className="bg-white border border-gray-200 p-5 flex items-center justify-between gap-4 hover:border-[#A7F515] transition-colors">
              <div className="flex items-center gap-4 min-w-0">
                {p.resolvedHeroImageUrl && <img src={p.resolvedHeroImageUrl} alt={p.name} className="w-14 h-14 object-cover border border-gray-200 shrink-0" />}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-[#211951] text-base">{p.name}</h3>
                    <code className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">{p.slug}</code>
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${p.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {p.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{p.tagline}</p>
                  {p.siteUrl && <a href={p.siteUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-500 flex items-center gap-1 mt-1"><ExternalLink className="w-3 h-3" /> {p.siteUrl}</a>}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Toggle checked={p.isActive} onChange={() => toggleActive({ id: p._id })} />
                <button onClick={() => openEdit(p)} className="p-2 text-gray-400 hover:text-[#211951]"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => setConfirmDelete(p._id)} className="p-2 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
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
              <h2 className="text-lg font-bold text-[#211951]">{editId ? "Edit Product" : "New Product"}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-6">
              <section>
                <h3 className="text-xs font-bold text-[#211951] uppercase tracking-widest mb-3">Basic Info</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Slug *</label>
                    <input required value={form.slug} onChange={set("slug")} placeholder="leave-tracker" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Name *</label>
                    <input required value={form.name} onChange={set("name")} className={inputCls} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Tagline *</label>
                    <input required value={form.tagline} onChange={set("tagline")} className={inputCls} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Short Description *</label>
                    <textarea required rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inputCls} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Long Description</label>
                    <textarea rows={4} value={form.longDescription} onChange={e => setForm(f => ({ ...f, longDescription: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Site URL</label>
                    <input value={form.siteUrl} onChange={set("siteUrl")} placeholder="https://…" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Order</label>
                    <input type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: Number(e.target.value) }))} className={inputCls} />
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xs font-bold text-[#211951] uppercase tracking-widest mb-3">Hero Image</h3>
                <ImageUpload
                  currentUrl={currentImageUrl}
                  currentId={currentImageId}
                  cloudinaryPublicId={form.heroCloudinaryPublicId}
                  onUpload={(sid, url, cloudinary) => {
                    setForm(f => ({
                      ...f,
                      heroImageId: sid ?? undefined,
                      heroImageUrl: "",
                      heroCloudinaryPublicId: cloudinary?.publicId,
                      heroCloudinarySecureUrl: cloudinary?.secureUrl,
                    }));
                    setCurrentImageId(sid ?? undefined);
                    setCurrentImageUrl(cloudinary?.secureUrl ?? url);
                  }}
                  onRemove={() => {
                    setForm(f => ({ ...f, heroImageId: undefined, heroCloudinaryPublicId: undefined, heroCloudinarySecureUrl: undefined }));
                    setCurrentImageUrl(null);
                    setCurrentImageId(undefined);
                  }}
                />
                <div className="mt-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">— or paste image URL</label>
                  <input value={form.heroImageUrl} onChange={(e) => { setForm(f => ({ ...f, heroImageUrl: e.target.value, heroImageId: undefined })); setCurrentImageUrl(e.target.value || null); setCurrentImageId(undefined); }} placeholder="https://…" className={inputCls} />
                </div>
              </section>

              <section>
                <h3 className="text-xs font-bold text-[#211951] uppercase tracking-widest mb-3">Additional Details</h3>
                <div className="space-y-3">
                  {[
                    { key: "what_it_does" as const, label: "What it does" },
                    { key: "purpose" as const, label: "Purpose" },
                    { key: "summary" as const, label: "Summary" },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
                      <textarea rows={2} value={form[key] as string} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className={inputCls} />
                    </div>
                  ))}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Functionality (one per line)</label>
                    <textarea rows={4} value={form.functionality} onChange={e => setForm(f => ({ ...f, functionality: e.target.value }))} className={inputCls} />
                  </div>
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-[#211951] uppercase tracking-widest">Screens</h3>
                  <button type="button" onClick={addScreen} className="flex items-center gap-1 text-xs font-bold text-[#211951] hover:text-[#A7F515]"><PlusCircle className="w-4 h-4" /> Add Screen</button>
                </div>
                <div className="space-y-4">
                  {form.screens.map((s, i) => (
                    <div key={i} className="border border-gray-200 p-4 bg-gray-50 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-500">Screen {i + 1}</span>
                        <button type="button" onClick={() => removeScreen(i)} className="text-red-400 hover:text-red-600"><MinusCircle className="w-4 h-4" /></button>
                      </div>
                      <input placeholder="Screen name" value={s.name} onChange={e => setScreen(i, "name", e.target.value)} className={inputCls} />
                      <textarea placeholder="Description" rows={2} value={s.desc} onChange={e => setScreen(i, "desc", e.target.value)} className={inputCls} />
                      <div className="pt-1">
                        <ImageUpload
                          label="Screen Image"
                          currentUrl={screenImageUrls[i] ?? null}
                          currentId={s.imageId ?? null}
                          cloudinaryPublicId={s.cloudinaryPublicId}
                          onUpload={(sid, url, cloudinary) => setScreenImage(i, sid, url, cloudinary)}
                          onRemove={() => clearScreenImage(i)}
                        />
                        <div className="mt-2">
                          <label className="block text-xs font-semibold text-gray-500 mb-1">— or paste image URL</label>
                          <input
                            value={s.imageId ? "" : (s.imageUrl ?? "")}
                            disabled={!!s.imageId}
                            onChange={e => {
                              setScreen(i, "imageUrl", e.target.value);
                              setScreenImageUrls(u => u.map((v, idx) => idx === i ? (e.target.value || null) : v));
                            }}
                            placeholder="https://…"
                            className={`${inputCls} ${s.imageId ? "opacity-40 cursor-not-allowed" : ""}`}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-[#211951] uppercase tracking-widest">Features</h3>
                  <button type="button" onClick={addFeature} className="flex items-center gap-1 text-xs font-bold text-[#211951] hover:text-[#A7F515]"><PlusCircle className="w-4 h-4" /> Add</button>
                </div>
                <div className="space-y-3">
                  {form.features.map((ft, i) => (
                    <div key={i} className="border border-gray-200 p-3 bg-gray-50 space-y-2">
                      <div className="flex justify-end"><button type="button" onClick={() => removeFeature(i)} className="text-red-400"><MinusCircle className="w-4 h-4" /></button></div>
                      <input placeholder="Feature title" value={ft.title} onChange={e => setFeature(i, "title", e.target.value)} className={inputCls} />
                      <textarea placeholder="Feature description" rows={2} value={ft.description} onChange={e => setFeature(i, "description", e.target.value)} className={inputCls} />
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-xs font-bold text-[#211951] uppercase tracking-widest mb-3">Lists</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Benefits (one per line)</label>
                    <textarea rows={3} value={form.benefits} onChange={e => setForm(f => ({ ...f, benefits: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Use Cases (one per line)</label>
                    <textarea rows={3} value={form.useCases} onChange={e => setForm(f => ({ ...f, useCases: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Tech Stack (comma-separated)</label>
                    <input value={form.techStack} onChange={set("techStack")} placeholder="React, Node.js, Firebase" className={inputCls} />
                  </div>
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-[#211951] uppercase tracking-widest">FAQ</h3>
                  <button type="button" onClick={addFaq} className="flex items-center gap-1 text-xs font-bold text-[#211951] hover:text-[#A7F515]"><PlusCircle className="w-4 h-4" /> Add</button>
                </div>
                <div className="space-y-3">
                  {form.faq.map((item, i) => (
                    <div key={i} className="border border-gray-200 p-3 bg-gray-50 space-y-2">
                      <div className="flex justify-end"><button type="button" onClick={() => removeFaq(i)} className="text-red-400"><MinusCircle className="w-4 h-4" /></button></div>
                      <input placeholder="Question" value={item.q} onChange={e => setFaq(i, "q", e.target.value)} className={inputCls} />
                      <textarea placeholder="Answer" rows={2} value={item.a} onChange={e => setFaq(i, "a", e.target.value)} className={inputCls} />
                    </div>
                  ))}
                </div>
              </section>

              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 accent-[#A7F515]" />
                <span className="text-sm font-semibold text-gray-700">Active (show on website)</span>
              </label>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 bg-[#A7F515] text-[#211951] py-3 font-bold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : editId ? "Save Changes" : "Create Product"}
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
            <h3 className="text-lg font-bold text-[#211951] mb-2">Delete this product?</h3>
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
