import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Plus, Pencil, Trash2, Loader2, X } from "lucide-react";
import { useAuthMutation } from "../hooks/useAuthMutation";

type Form = { year: string; title: string; description: string; isActive: boolean; order: number };
const EMPTY: Form = { year: "", title: "", description: "", isActive: true, order: 0 };

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button type="button" onClick={onChange}
    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${checked ? "bg-green-500" : "bg-gray-300"}`}>
    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${checked ? "translate-x-8" : "translate-x-1"}`} />
  </button>
);

export default function Timeline() {
  const items = useQuery(api.timeline.listAll);
  const create = useAuthMutation(api.timeline.create);
  const update = useAuthMutation(api.timeline.update);
  const toggleActive = useAuthMutation(api.timeline.toggleActive);
  const remove = useAuthMutation(api.timeline.remove);

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<Id<"timeline"> | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Id<"timeline"> | null>(null);

  const openCreate = () => { setEditId(null); setForm(EMPTY); setShowModal(true); };
  const openEdit = (i: any) => {
    setEditId(i._id);
    setForm({ year: i.year, title: i.title, description: i.description, isActive: i.isActive, order: i.order });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editId) await update({ id: editId, ...form });
      else await create(form);
      setShowModal(false);
    } finally { setSaving(false); }
  };

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#211951]">Company Timeline</h1>
          <p className="text-gray-500 text-sm mt-1">{items?.length ?? 0} milestones</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-[#A7F515] text-[#211951] px-5 py-2.5 font-bold text-sm hover:opacity-90">
          <Plus className="w-4 h-4" /> Add Milestone
        </button>
      </div>

      {items === undefined ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#211951]" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-200">
          <p className="text-gray-500 mb-4">No milestones yet.</p>
          <button onClick={openCreate} className="text-[#211951] font-bold underline text-sm">Add first milestone</button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item._id} className="bg-white border border-gray-200 p-5 flex items-center justify-between gap-4 hover:border-[#A7F515] transition-colors">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-16 h-16 bg-[#211951] flex items-center justify-center shrink-0">
                  <span className="text-[#A7F515] font-bold text-sm">{item.year}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-[#211951]">{item.title}</span>
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${item.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {item.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-1">{item.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Toggle checked={item.isActive} onChange={() => toggleActive({ id: item._id })} />
                <button onClick={() => openEdit(item)} className="p-2 text-gray-400 hover:text-[#211951]"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => setConfirmDelete(item._id)} className="p-2 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-[#211951]">{editId ? "Edit Milestone" : "New Milestone"}</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className={lbl}>Year *</label><input required value={form.year} onChange={set("year")} placeholder="2019" className={inp} /></div>
                <div><label className={lbl}>Order</label><input type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: Number(e.target.value) }))} className={inp} /></div>
              </div>
              <div><label className={lbl}>Title *</label><input required value={form.title} onChange={set("title")} placeholder="The Genesis" className={inp} /></div>
              <div><label className={lbl}>Description *</label><textarea required rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inp} /></div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 accent-[#A7F515]" />
                <span className="text-sm font-semibold text-gray-700">Active (show on website)</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 bg-[#A7F515] text-[#211951] py-3 font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : editId ? "Save Changes" : "Add Milestone"}
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
            <h3 className="text-lg font-bold text-[#211951] mb-2">Delete this milestone?</h3>
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
