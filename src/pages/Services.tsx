import { useState } from "react";
import { useQuery } from "convex/react";
import { useAuthMutation } from "../hooks/useAuthMutation";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Plus, Pencil, Trash2, Loader2, X, PlusCircle, MinusCircle } from "lucide-react";
import ImageUpload from "../components/ImageUpload";

type Tech = { name: string; icon: string };
type ProcessStep = { step: number; title: string; description: string };
type Faq = { question: string; answer: string };

type SvcForm = {
  serviceId: string; title: string; description: string; heroDescription: string;
  features: string; technologies: Tech[];
  startingPrice: string; deliveryTime: string;
  imageId?: Id<"_storage">; imageUrl: string;
  benefits: string;
  process: ProcessStep[];
  faqs: Faq[];
  teamMembers: string;
  isActive: boolean; order: number;
  cloudinaryPublicId?: string; cloudinarySecureUrl?: string;
};

const EMPTY: SvcForm = {
  serviceId: "", title: "", description: "", heroDescription: "",
  features: "", technologies: [],
  startingPrice: "", deliveryTime: "",
  imageUrl: "", benefits: "",
  process: [], faqs: [], teamMembers: "",
  isActive: true, order: 0,
  cloudinaryPublicId: undefined, cloudinarySecureUrl: undefined,
};

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button type="button" onClick={onChange}
    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-200 focus:outline-none ${checked ? "bg-green-500" : "bg-gray-300"}`}>
    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${checked ? "translate-x-8" : "translate-x-1"}`} />
  </button>
);

const lines = (s: string) => s.split("\n").map(l => l.trim()).filter(Boolean);
const toLines = (arr: string[]) => arr.join("\n");

export default function Services() {
  const services = useQuery(api.services.listAll);
  const create = useAuthMutation(api.services.create);
  const update = useAuthMutation(api.services.update);
  const toggleActive = useAuthMutation(api.services.toggleActive);
  const remove = useAuthMutation(api.services.remove);

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<Id<"services"> | null>(null);
  const [form, setForm] = useState<SvcForm>(EMPTY);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [currentImageId, setCurrentImageId] = useState<Id<"_storage"> | undefined>();
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Id<"services"> | null>(null);

  const openCreate = () => {
    setEditId(null); setForm(EMPTY);
    setCurrentImageUrl(null); setCurrentImageId(undefined);
    setShowModal(true);
  };

  const openEdit = (svc: any) => {
    setEditId(svc._id);
    setCurrentImageUrl(svc.resolvedImageUrl ?? null);
    setCurrentImageId(svc.imageId);
    setForm({
      serviceId: svc.serviceId, title: svc.title, description: svc.description,
      heroDescription: svc.heroDescription, features: toLines(svc.features),
      technologies: svc.technologies ?? [], startingPrice: svc.startingPrice,
      deliveryTime: svc.deliveryTime, imageId: svc.imageId,
      imageUrl: svc.imageUrl ?? "", benefits: toLines(svc.benefits),
      process: svc.process ?? [], faqs: svc.faqs ?? [],
      teamMembers: svc.teamMembers.join(", "),
      isActive: svc.isActive, order: svc.order,
      cloudinaryPublicId: svc.cloudinaryPublicId ?? undefined,
      cloudinarySecureUrl: svc.cloudinarySecureUrl ?? undefined,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        features: lines(form.features),
        benefits: lines(form.benefits),
        teamMembers: form.teamMembers.split(",").map(t => t.trim()).filter(Boolean),
        imageUrl: form.imageUrl || undefined,
        imageId: form.imageId,
      };
      if (editId) await update({ id: editId, ...payload });
      else await create(payload);
      setShowModal(false);
    } finally { setSaving(false); }
  };

  const set = (key: keyof SvcForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const addTech = () => setForm(f => ({ ...f, technologies: [...f.technologies, { name: "", icon: "" }] }));
  const removeTech = (i: number) => setForm(f => ({ ...f, technologies: f.technologies.filter((_, idx) => idx !== i) }));
  const setTech = (i: number, field: keyof Tech, val: string) =>
    setForm(f => ({ ...f, technologies: f.technologies.map((t, idx) => idx === i ? { ...t, [field]: val } : t) }));

  const addProcess = () => setForm(f => ({ ...f, process: [...f.process, { step: f.process.length + 1, title: "", description: "" }] }));
  const removeProcess = (i: number) => setForm(f => ({ ...f, process: f.process.filter((_, idx) => idx !== i) }));
  const setProcess = (i: number, field: keyof ProcessStep, val: string | number) =>
    setForm(f => ({ ...f, process: f.process.map((p, idx) => idx === i ? { ...p, [field]: val } : p) }));

  const addFaq = () => setForm(f => ({ ...f, faqs: [...f.faqs, { question: "", answer: "" }] }));
  const removeFaq = (i: number) => setForm(f => ({ ...f, faqs: f.faqs.filter((_, idx) => idx !== i) }));
  const setFaq = (i: number, field: keyof Faq, val: string) =>
    setForm(f => ({ ...f, faqs: f.faqs.map((q, idx) => idx === i ? { ...q, [field]: val } : q) }));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#211951]">Services</h1>
          <p className="text-gray-500 text-sm mt-1">{services?.length ?? 0} services</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-[#A7F515] text-[#211951] px-5 py-2.5 font-bold text-sm hover:opacity-90">
          <Plus className="w-4 h-4" /> Add Service
        </button>
      </div>

      {services === undefined ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#211951]" /></div>
      ) : services.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-200">
          <p className="text-gray-500 mb-4">No services yet.</p>
          <button onClick={openCreate} className="text-[#211951] font-bold underline text-sm">Add your first service</button>
        </div>
      ) : (
        <div className="space-y-3">
          {services.map((svc) => (
            <div key={svc._id} className="bg-white border border-gray-200 p-5 flex items-center justify-between gap-4 hover:border-[#A7F515] transition-colors">
              <div className="flex items-center gap-4 min-w-0">
                {svc.resolvedImageUrl && <img src={svc.resolvedImageUrl} alt={svc.title} className="w-14 h-14 object-cover border border-gray-200 shrink-0" />}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-[#211951] text-base">{svc.title}</h3>
                    <code className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">{svc.serviceId}</code>
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${svc.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {svc.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{svc.startingPrice} · {svc.deliveryTime}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Toggle checked={svc.isActive} onChange={() => toggleActive({ id: svc._id })} />
                <button onClick={() => openEdit(svc)} className="p-2 text-gray-400 hover:text-[#211951]"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => setConfirmDelete(svc._id)} className="p-2 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
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
              <h2 className="text-lg font-bold text-[#211951]">{editId ? "Edit Service" : "New Service"}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-6">
              {/* Basic */}
              <section>
                <h3 className="text-xs font-bold text-[#211951] uppercase tracking-widest mb-3">Basic Info</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Service ID (slug) *</label>
                    <input required value={form.serviceId} onChange={set("serviceId")} placeholder="web-development" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Title *</label>
                    <input required value={form.title} onChange={set("title")} className={inputCls} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Description *</label>
                    <textarea required rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inputCls} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Hero Description</label>
                    <textarea rows={2} value={form.heroDescription} onChange={e => setForm(f => ({ ...f, heroDescription: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Starting Price</label>
                    <input value={form.startingPrice} onChange={set("startingPrice")} placeholder="From $5,000" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Delivery Time</label>
                    <input value={form.deliveryTime} onChange={set("deliveryTime")} placeholder="4-12 weeks" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Order</label>
                    <input type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: Number(e.target.value) }))} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Team Members (comma-sep employee IDs)</label>
                    <input value={form.teamMembers} onChange={set("teamMembers")} placeholder="dhruv-shere, priyanshu-patel" className={inputCls} />
                  </div>
                </div>
              </section>

              {/* Image */}
              <section>
                <h3 className="text-xs font-bold text-[#211951] uppercase tracking-widest mb-3">Service Image</h3>
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

              {/* Features & Benefits */}
              <section>
                <h3 className="text-xs font-bold text-[#211951] uppercase tracking-widest mb-3">Features & Benefits</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Features (one per line)</label>
                    <textarea rows={4} value={form.features} onChange={e => setForm(f => ({ ...f, features: e.target.value }))} placeholder="Custom Web Applications&#10;E-commerce Solutions" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Benefits (one per line)</label>
                    <textarea rows={4} value={form.benefits} onChange={e => setForm(f => ({ ...f, benefits: e.target.value }))} placeholder="Increased online visibility&#10;Better user engagement" className={inputCls} />
                  </div>
                </div>
              </section>

              {/* Technologies */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-[#211951] uppercase tracking-widest">Technologies</h3>
                  <button type="button" onClick={addTech} className="flex items-center gap-1 text-xs font-bold text-[#211951] hover:text-[#A7F515]">
                    <PlusCircle className="w-4 h-4" /> Add
                  </button>
                </div>
                <div className="space-y-2">
                  {form.technologies.map((tech, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input placeholder="Name (e.g. React)" value={tech.name} onChange={e => setTech(i, "name", e.target.value)} className={`${inputCls} flex-1`} />
                      <input placeholder="Icon path (e.g. /technologies/react.webp)" value={tech.icon} onChange={e => setTech(i, "icon", e.target.value)} className={`${inputCls} flex-1`} />
                      <button type="button" onClick={() => removeTech(i)} className="text-red-400 hover:text-red-600 shrink-0"><MinusCircle className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </section>

              {/* Process */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-[#211951] uppercase tracking-widest">Process Steps</h3>
                  <button type="button" onClick={addProcess} className="flex items-center gap-1 text-xs font-bold text-[#211951] hover:text-[#A7F515]">
                    <PlusCircle className="w-4 h-4" /> Add Step
                  </button>
                </div>
                <div className="space-y-3">
                  {form.process.map((step, i) => (
                    <div key={i} className="border border-gray-200 p-4 bg-gray-50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-500">Step {step.step}</span>
                        <button type="button" onClick={() => removeProcess(i)} className="text-red-400 hover:text-red-600"><MinusCircle className="w-4 h-4" /></button>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        <input type="number" placeholder="#" value={step.step} onChange={e => setProcess(i, "step", Number(e.target.value))} className={`${inputCls} col-span-1`} />
                        <input placeholder="Title" value={step.title} onChange={e => setProcess(i, "title", e.target.value)} className={`${inputCls} col-span-3`} />
                      </div>
                      <textarea placeholder="Description" rows={2} value={step.description} onChange={e => setProcess(i, "description", e.target.value)} className={inputCls} />
                    </div>
                  ))}
                </div>
              </section>

              {/* FAQs */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-[#211951] uppercase tracking-widest">Service FAQs</h3>
                  <button type="button" onClick={addFaq} className="flex items-center gap-1 text-xs font-bold text-[#211951] hover:text-[#A7F515]">
                    <PlusCircle className="w-4 h-4" /> Add FAQ
                  </button>
                </div>
                <div className="space-y-3">
                  {form.faqs.map((faq, i) => (
                    <div key={i} className="border border-gray-200 p-4 bg-gray-50 space-y-2">
                      <div className="flex justify-end"><button type="button" onClick={() => removeFaq(i)} className="text-red-400 hover:text-red-600"><MinusCircle className="w-4 h-4" /></button></div>
                      <input placeholder="Question" value={faq.question} onChange={e => setFaq(i, "question", e.target.value)} className={inputCls} />
                      <textarea placeholder="Answer" rows={2} value={faq.answer} onChange={e => setFaq(i, "answer", e.target.value)} className={inputCls} />
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
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : editId ? "Save Changes" : "Create Service"}
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
            <h3 className="text-lg font-bold text-[#211951] mb-2">Delete this service?</h3>
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
