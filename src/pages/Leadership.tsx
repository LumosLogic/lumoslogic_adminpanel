import { useState } from "react";
import { useQuery } from "convex/react";
import { useAuthMutation } from "../hooks/useAuthMutation";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Plus, Pencil, Trash2, Loader2, X } from "lucide-react";
import ImageUpload from "../components/ImageUpload";

type LeaderForm = {
  name: string; role: string; initials: string; experience: string;
  specialization: string; vision: string; message: string;
  profileImageId?: Id<"_storage">; profileImageUrl: string;
  profileSlug: string; linkedinUrl: string;
  isActive: boolean; order: number;
  cloudinaryPublicId?: string; cloudinarySecureUrl?: string;
};

const EMPTY: LeaderForm = {
  name: "", role: "", initials: "", experience: "", specialization: "",
  vision: "", message: "", profileImageUrl: "", profileSlug: "", linkedinUrl: "",
  isActive: true, order: 0,
  cloudinaryPublicId: undefined, cloudinarySecureUrl: undefined,
};

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button type="button" onClick={onChange}
    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-200 ${checked ? "bg-green-500" : "bg-gray-300"}`}>
    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${checked ? "translate-x-8" : "translate-x-1"}`} />
  </button>
);

export default function Leadership() {
  const leaders = useQuery(api.leadership.listAll);
  const create = useAuthMutation(api.leadership.create);
  const update = useAuthMutation(api.leadership.update);
  const toggleActive = useAuthMutation(api.leadership.toggleActive);
  const remove = useAuthMutation(api.leadership.remove);

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<Id<"leadership"> | null>(null);
  const [form, setForm] = useState<LeaderForm>(EMPTY);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [imgId, setImgId] = useState<Id<"_storage"> | undefined>();
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Id<"leadership"> | null>(null);

  const openCreate = () => {
    setEditId(null); setForm(EMPTY); setImgUrl(null); setImgId(undefined); setShowModal(true);
  };

  const openEdit = (l: any) => {
    setEditId(l._id);
    setImgUrl(l.resolvedImageUrl ?? null);
    setImgId(l.profileImageId);
    setForm({
      name: l.name, role: l.role, initials: l.initials, experience: l.experience,
      specialization: l.specialization, vision: l.vision, message: l.message,
      profileImageId: l.profileImageId, profileImageUrl: l.profileImageUrl ?? "",
      profileSlug: l.profileSlug ?? "", linkedinUrl: l.linkedinUrl ?? "",
      isActive: l.isActive, order: l.order,
      cloudinaryPublicId: l.cloudinaryPublicId ?? undefined,
      cloudinarySecureUrl: l.cloudinarySecureUrl ?? undefined,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        profileImageId: imgId,
        profileImageUrl: imgId ? "" : (form.profileImageUrl || undefined),
        profileSlug: form.profileSlug || undefined,
        linkedinUrl: form.linkedinUrl || undefined,
      };
      if (editId) await update({ id: editId, ...payload });
      else await create(payload);
      setShowModal(false);
    } finally { setSaving(false); }
  };

  const set = (k: keyof LeaderForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#211951]">Leadership</h1>
          <p className="text-gray-500 text-sm mt-1">{leaders?.length ?? 0} members</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-[#A7F515] text-[#211951] px-5 py-2.5 font-bold text-sm hover:opacity-90">
          <Plus className="w-4 h-4" /> Add Leader
        </button>
      </div>

      {leaders === undefined ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#211951]" /></div>
      ) : leaders.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-200">
          <p className="text-gray-500 mb-4">No leadership members yet.</p>
          <button onClick={openCreate} className="text-[#211951] font-bold underline text-sm">Add first leader</button>
        </div>
      ) : (
        <div className="space-y-3">
          {leaders.map((l) => (
            <div key={l._id} className="bg-white border border-gray-200 p-5 flex items-center justify-between gap-4 hover:border-[#A7F515] transition-colors">
              <div className="flex items-center gap-4 min-w-0">
                {l.resolvedImageUrl
                  ? <img src={l.resolvedImageUrl} alt={l.name} className="w-12 h-12 rounded-full object-cover border border-gray-200 shrink-0" />
                  : <div className="w-12 h-12 rounded-full bg-[#211951] flex items-center justify-center text-white font-bold text-sm shrink-0">{l.initials}</div>
                }
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-[#211951]">{l.name}</span>
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${l.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {l.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-sm text-[#A7F515] font-semibold">{l.role}</p>
                  <p className="text-xs text-gray-400">{l.specialization} · {l.experience}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Toggle checked={l.isActive} onChange={() => toggleActive({ id: l._id })} />
                <button onClick={() => openEdit(l)} className="p-2 text-gray-400 hover:text-[#211951]"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => setConfirmDelete(l._id)} className="p-2 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-[#211951]">{editId ? "Edit Leader" : "New Leader"}</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className={lbl}>Name *</label><input required value={form.name} onChange={set("name")} className={inp} /></div>
                <div><label className={lbl}>Initials *</label><input required value={form.initials} onChange={set("initials")} placeholder="SS" className={inp} /></div>
                <div className="col-span-2"><label className={lbl}>Role *</label><input required value={form.role} onChange={set("role")} placeholder="Founder & CEO" className={inp} /></div>
                <div><label className={lbl}>Experience *</label><input required value={form.experience} onChange={set("experience")} placeholder="8+ years" className={inp} /></div>
                <div><label className={lbl}>Order</label><input type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: Number(e.target.value) }))} className={inp} /></div>
                <div className="col-span-2"><label className={lbl}>Specialization *</label><input required value={form.specialization} onChange={set("specialization")} className={inp} /></div>
                <div className="col-span-2"><label className={lbl}>Vision *</label><input required value={form.vision} onChange={set("vision")} className={inp} /></div>
                <div className="col-span-2"><label className={lbl}>Message / Quote *</label><textarea required rows={3} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} className={inp} /></div>
                <div><label className={lbl}>Profile Slug (for link)</label><input value={form.profileSlug} onChange={set("profileSlug")} placeholder="sagar-shah" className={inp} /></div>
                <div><label className={lbl}>LinkedIn URL</label><input value={form.linkedinUrl} onChange={set("linkedinUrl")} placeholder="https://linkedin.com/in/…" className={inp} /></div>
              </div>

              <div>
                <p className="text-xs font-bold text-[#211951] uppercase tracking-widest mb-3">Profile Photo</p>
                <ImageUpload
                  label="Photo"
                  currentUrl={imgUrl}
                  currentId={imgId ?? null}
                  cloudinaryPublicId={form.cloudinaryPublicId}
                  onUpload={(sid, url, cloudinary) => {
                    setImgId(sid ?? undefined);
                    setImgUrl(cloudinary?.secureUrl ?? url);
                    setForm(f => ({
                      ...f,
                      profileImageUrl: "",
                      cloudinaryPublicId: cloudinary?.publicId,
                      cloudinarySecureUrl: cloudinary?.secureUrl,
                    }));
                  }}
                  onRemove={() => {
                    setImgId(undefined);
                    setImgUrl(null);
                    setForm(f => ({ ...f, cloudinaryPublicId: undefined, cloudinarySecureUrl: undefined }));
                  }}
                />
                <div className="mt-2">
                  <label className={lbl}>— or paste image URL</label>
                  <input value={imgId ? "" : form.profileImageUrl} disabled={!!imgId}
                    onChange={e => { setForm(f => ({ ...f, profileImageUrl: e.target.value })); setImgUrl(e.target.value || null); }}
                    placeholder="https://…" className={`${inp} ${imgId ? "opacity-40 cursor-not-allowed" : ""}`} />
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 accent-[#A7F515]" />
                <span className="text-sm font-semibold text-gray-700">Active (show on website)</span>
              </label>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 bg-[#A7F515] text-[#211951] py-3 font-bold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : editId ? "Save Changes" : "Add Leader"}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 border-2 border-gray-200 text-gray-600 font-bold">Cancel</button>
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
            <h3 className="text-lg font-bold text-[#211951] mb-2">Delete this leader?</h3>
            <p className="text-gray-500 text-sm mb-6">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={async () => { await remove({ id: confirmDelete }); setConfirmDelete(null); }} className="flex-1 bg-red-500 text-white py-2.5 font-bold">Delete</button>
              <button onClick={() => setConfirmDelete(null)} className="flex-1 border-2 border-gray-200 text-gray-600 py-2.5 font-bold">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const lbl = "block text-sm font-semibold text-gray-700 mb-1";
const inp = "w-full px-4 py-2.5 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#A7F515] text-gray-900 text-sm";
