import { useState, useRef } from "react";
import { useQuery, useMutation, useAction, useConvex } from "convex/react";
import { useAuthMutation } from "../hooks/useAuthMutation";
import { getToken } from "../lib/auth";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Plus, Pencil, Trash2, Loader2, X, PlusCircle, MinusCircle, Star, Upload } from "lucide-react";

type Result = { metric: string; description: string };

type CsForm = {
  caseId: string; title: string; client: string; category: string; type: string;
  description: string; fullDescription: string; technologies: string;
  results: Result[]; year: string; duration: string; link: string;
  featured: boolean; imageIds: Id<"_storage">[]; isActive: boolean; order: number;
  cloudinaryImages?: Array<{ publicId: string; secureUrl: string }>;
};

const EMPTY: CsForm = {
  caseId: "", title: "", client: "", category: "", type: "",
  description: "", fullDescription: "", technologies: "",
  results: [], year: "", duration: "", link: "",
  featured: false, imageIds: [], isActive: true, order: 0,
  cloudinaryImages: [],
};

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button type="button" onClick={onChange}
    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-200 focus:outline-none ${checked ? "bg-green-500" : "bg-gray-300"}`}>
    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${checked ? "translate-x-8" : "translate-x-1"}`} />
  </button>
);

function MultiImageUpload({ imageIds, imageUrls, cloudinaryImages, onAdd, onAddCloudinary, onRemove, onRemoveCloudinary }: {
  imageIds: Id<"_storage">[];
  imageUrls: (string | null)[];
  cloudinaryImages?: Array<{ publicId: string; secureUrl: string }>;
  onAdd: (id: Id<"_storage">, url: string | null) => void;
  onAddCloudinary: (publicId: string, secureUrl: string) => void;
  onRemove: (idx: number) => void;
  onRemoveCloudinary?: (idx: number) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const cloudinaryConfig = useQuery(api.cloudinaryConfig.get);
  const getSignedParams = useAction(api.cloudinary.getSignedUploadParams);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const convex = useConvex();
  const inputRef = useRef<HTMLInputElement>(null);

  const isCloudinaryConfigured = cloudinaryConfig?.isConfigured === true;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      if (isCloudinaryConfigured) {
        const folder = "Lumoslogic website";
        const params = await getSignedParams({ folder, token: getToken() ?? "" });
        const fd = new FormData();
        fd.append("file", file);
        fd.append("api_key", params.apiKey);
        fd.append("timestamp", String(params.timestamp));
        fd.append("signature", params.signature);
        fd.append("folder", params.folder);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${params.cloudName}/image/upload`, { method: "POST", body: fd });
        if (!res.ok) throw new Error("Cloudinary upload failed");
        const data = await res.json();
        onAddCloudinary(data.public_id, data.secure_url);
      } else {
        const postUrl = await generateUploadUrl();
        const result = await fetch(postUrl, { method: "POST", headers: { "Content-Type": file.type }, body: file });
        const { storageId } = await result.json();
        const previewUrl = await convex.query(api.files.getUrlForStorage, { storageId });
        onAdd(storageId, previewUrl);
      }
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed. Please try again.");
    } finally { setUploading(false); if (inputRef.current) inputRef.current.value = ""; }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-3">
        {imageIds.map((id, i) => (
          <div key={id} className="relative w-24 h-24 bg-gray-100 border border-gray-200">
            {imageUrls[i] && <img src={imageUrls[i]!} alt={`img-${i}`} className="w-full h-full object-cover" />}
            <button type="button" onClick={() => onRemove(i)} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600">
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        {(cloudinaryImages ?? []).map((ci, i) => (
          <div key={ci.publicId} className="relative w-24 h-24 bg-gray-100 border border-gray-200">
            <img src={ci.secureUrl} alt={`cloudinary-${i}`} className="w-full h-full object-cover" />
            {onRemoveCloudinary && (
              <button type="button" onClick={() => onRemoveCloudinary(i)} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
          className="w-24 h-24 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-[#A7F515] hover:text-[#211951] transition-colors disabled:opacity-50">
          {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Upload className="w-5 h-5" /><span className="text-xs">Add Image</span></>}
        </button>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

export default function CaseStudies() {
  const items = useQuery(api.caseStudies.listAll);
  const create = useAuthMutation(api.caseStudies.create);
  const update = useAuthMutation(api.caseStudies.update);
  const toggleActive = useAuthMutation(api.caseStudies.toggleActive);
  const remove = useAuthMutation(api.caseStudies.remove);
  const deleteFile = useAuthMutation(api.files.deleteFile);

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<Id<"caseStudies"> | null>(null);
  const [form, setForm] = useState<CsForm>(EMPTY);
  const [imageUrls, setImageUrls] = useState<(string | null)[]>([]);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Id<"caseStudies"> | null>(null);

  const openCreate = () => { setEditId(null); setForm(EMPTY); setImageUrls([]); setShowModal(true); };
  const openEdit = (cs: any) => {
    setEditId(cs._id);
    setImageUrls(cs.imageUrls ?? []);
    const existingCloudinary: Array<{ publicId: string; secureUrl: string }> = cs.cloudinaryImages ?? [];
    setForm({
      caseId: cs.caseId, title: cs.title, client: cs.client, category: cs.category,
      type: cs.type, description: cs.description, fullDescription: cs.fullDescription,
      technologies: (cs.technologies ?? []).join(", "),
      results: cs.results ?? [], year: cs.year, duration: cs.duration, link: cs.link ?? "",
      featured: cs.featured, imageIds: cs.imageIds ?? [], isActive: cs.isActive, order: cs.order,
      cloudinaryImages: existingCloudinary,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        technologies: form.technologies.split(",").map(t => t.trim()).filter(Boolean),
        link: form.link || undefined,
      };
      if (editId) await update({ id: editId, ...payload });
      else await create(payload);
      setShowModal(false);
    } finally { setSaving(false); }
  };

  const set = (key: keyof CsForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const addResult = () => setForm(f => ({ ...f, results: [...f.results, { metric: "", description: "" }] }));
  const removeResult = (i: number) => setForm(f => ({ ...f, results: f.results.filter((_, idx) => idx !== i) }));
  const setResult = (i: number, field: keyof Result, val: string) =>
    setForm(f => ({ ...f, results: f.results.map((r, idx) => idx === i ? { ...r, [field]: val } : r) }));

  const handleAddImage = (id: Id<"_storage">, url: string | null) => {
    setForm(f => ({ ...f, imageIds: [...f.imageIds, id] }));
    setImageUrls(u => [...u, url]);
  };

  const handleAddCloudinaryImage = (publicId: string, secureUrl: string) => {
    setForm(f => ({ ...f, cloudinaryImages: [...(f.cloudinaryImages ?? []), { publicId, secureUrl }] }));
  };

  const handleRemoveCloudinaryImage = (idx: number) => {
    setForm(f => ({ ...f, cloudinaryImages: (f.cloudinaryImages ?? []).filter((_, i) => i !== idx) }));
  };

  const handleRemoveImage = async (idx: number) => {
    const sid = form.imageIds[idx];
    await deleteFile({ storageId: sid });
    setForm(f => ({ ...f, imageIds: f.imageIds.filter((_, i) => i !== idx) }));
    setImageUrls(u => u.filter((_, i) => i !== idx));
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#211951]">Case Studies</h1>
          <p className="text-gray-500 text-sm mt-1">{items?.length ?? 0} case studies</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-[#A7F515] text-[#211951] px-5 py-2.5 font-bold text-sm hover:opacity-90">
          <Plus className="w-4 h-4" /> Add Case Study
        </button>
      </div>

      {items === undefined ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#211951]" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-200">
          <p className="text-gray-500 mb-4">No case studies yet.</p>
          <button onClick={openCreate} className="text-[#211951] font-bold underline text-sm">Add your first case study</button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((cs) => (
            <div key={cs._id} className="bg-white border border-gray-200 p-5 flex items-start justify-between gap-4 hover:border-[#A7F515] transition-colors">
              <div className="flex gap-4 min-w-0">
                {cs.imageUrls?.[0] && <img src={cs.imageUrls[0]} alt={cs.title} className="w-16 h-16 object-cover border border-gray-200 shrink-0" />}
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-bold text-[#211951] text-sm">{cs.title}</h3>
                    {cs.featured && <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />}
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">{cs.category}</span>
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${cs.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {cs.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{cs.client} · {cs.year} · {cs.duration} · {cs.imageIds.length} image(s)</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Toggle checked={cs.isActive} onChange={() => toggleActive({ id: cs._id })} />
                <button onClick={() => openEdit(cs)} className="p-2 text-gray-400 hover:text-[#211951]"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => setConfirmDelete(cs._id)} className="p-2 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
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
              <h2 className="text-lg font-bold text-[#211951]">{editId ? "Edit Case Study" : "New Case Study"}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-6">
              <section>
                <h3 className="text-xs font-bold text-[#211951] uppercase tracking-widest mb-3">Basic Info</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Case ID (slug) *</label>
                    <input required value={form.caseId} onChange={set("caseId")} placeholder="medcheck" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Title *</label>
                    <input required value={form.title} onChange={set("title")} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Client *</label>
                    <input required value={form.client} onChange={set("client")} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                    <input value={form.category} onChange={set("category")} placeholder="Web Development" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Type / Industry</label>
                    <input value={form.type} onChange={set("type")} placeholder="Healthcare" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Year</label>
                    <input value={form.year} onChange={set("year")} placeholder="2024" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Duration</label>
                    <input value={form.duration} onChange={set("duration")} placeholder="8 months" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Link (HTML file path)</label>
                    <input value={form.link} onChange={set("link")} placeholder="/casestudies/project.html" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Order</label>
                    <input type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: Number(e.target.value) }))} className={inputCls} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Technologies (comma-separated)</label>
                    <input value={form.technologies} onChange={set("technologies")} placeholder="React, Node.js, MongoDB" className={inputCls} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Short Description</label>
                    <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inputCls} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Full Description</label>
                    <textarea rows={4} value={form.fullDescription} onChange={e => setForm(f => ({ ...f, fullDescription: e.target.value }))} className={inputCls} />
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xs font-bold text-[#211951] uppercase tracking-widest mb-3">Images</h3>
                <MultiImageUpload imageIds={form.imageIds} imageUrls={imageUrls} cloudinaryImages={form.cloudinaryImages} onAdd={handleAddImage} onAddCloudinary={handleAddCloudinaryImage} onRemove={handleRemoveImage} onRemoveCloudinary={handleRemoveCloudinaryImage} />
              </section>

              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-[#211951] uppercase tracking-widest">Results / Metrics</h3>
                  <button type="button" onClick={addResult} className="flex items-center gap-1 text-xs font-bold text-[#211951] hover:text-[#A7F515]"><PlusCircle className="w-4 h-4" /> Add Result</button>
                </div>
                <div className="space-y-2">
                  {form.results.map((r, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input placeholder="Metric (e.g. 85%)" value={r.metric} onChange={e => setResult(i, "metric", e.target.value)} className={`${inputCls} w-32 shrink-0`} />
                      <input placeholder="Description" value={r.description} onChange={e => setResult(i, "description", e.target.value)} className={`${inputCls} flex-1`} />
                      <button type="button" onClick={() => removeResult(i)} className="text-red-400 hover:text-red-600"><MinusCircle className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </section>

              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-gray-700">
                  <input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} className="w-4 h-4 accent-[#A7F515]" />
                  Featured
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-gray-700">
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 accent-[#A7F515]" />
                  Active (show on website)
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 bg-[#A7F515] text-[#211951] py-3 font-bold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : editId ? "Save Changes" : "Create Case Study"}
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
            <h3 className="text-lg font-bold text-[#211951] mb-2">Delete this case study?</h3>
            <p className="text-gray-500 text-sm mb-6">All uploaded images will also be deleted. This cannot be undone.</p>
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
