import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Plus, Pencil, Trash2, Loader2, X } from "lucide-react";
import { useAuthMutation } from "../hooks/useAuthMutation";

type FaqForm = {
  question: string;
  answer: string;
  category: string;
  isActive: boolean;
  order: number;
};

const EMPTY: FaqForm = {
  question: "",
  answer: "",
  category: "",
  isActive: true,
  order: 0,
};

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button
    type="button"
    onClick={onChange}
    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-200 focus:outline-none ${checked ? "bg-green-500" : "bg-gray-300"}`}
  >
    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${checked ? "translate-x-8" : "translate-x-1"}`} />
  </button>
);

export default function FAQAdmin() {
  const items = useQuery(api.faq.listAll);
  const create = useAuthMutation(api.faq.create);
  const update = useAuthMutation(api.faq.update);
  const toggle = useAuthMutation(api.faq.toggleActive);
  const remove = useAuthMutation(api.faq.remove);

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<Id<"faq"> | null>(null);
  const [form, setForm] = useState<FaqForm>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Id<"faq"> | null>(null);

  const openCreate = () => { setEditId(null); setForm(EMPTY); setShowModal(true); };
  const openEdit = (item: any) => {
    setEditId(item._id);
    setForm({ question: item.question, answer: item.answer, category: item.category ?? "", isActive: item.isActive, order: item.order });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, category: form.category || undefined };
      if (editId) await update({ id: editId, ...payload, category: form.category || undefined });
      else await create({ ...payload, category: form.category || undefined });
      setShowModal(false);
    } finally { setSaving(false); }
  };

  const set = (key: keyof FaqForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#211951]">FAQ</h1>
          <p className="text-gray-500 text-sm mt-1">{items?.length ?? 0} questions</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-[#A7F515] text-[#211951] px-5 py-2.5 font-bold text-sm hover:opacity-90">
          <Plus className="w-4 h-4" /> Add Question
        </button>
      </div>

      {items === undefined ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#211951]" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-200">
          <p className="text-gray-500 mb-4">No FAQ items yet.</p>
          <button onClick={openCreate} className="text-[#211951] font-bold underline text-sm">Add your first question</button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item._id} className="bg-white border border-gray-200 p-5 flex items-start justify-between gap-4 hover:border-[#A7F515] transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-bold text-[#211951] text-sm">{item.question}</h3>
                  {item.category && <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">{item.category}</span>}
                  <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${item.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {item.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2">{item.answer}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Toggle checked={item.isActive} onChange={() => toggle({ id: item._id })} />
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
          <div className="relative bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-[#211951]">{editId ? "Edit Question" : "New FAQ Item"}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Question <span className="text-red-500">*</span></label>
                <input required value={form.question} onChange={set("question")} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Answer <span className="text-red-500">*</span></label>
                <textarea required rows={5} value={form.answer} onChange={(e) => setForm(f => ({ ...f, answer: e.target.value }))} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                  <input value={form.category} onChange={set("category")} placeholder="e.g. General, Pricing…" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Order</label>
                  <input type="number" value={form.order} onChange={(e) => setForm(f => ({ ...f, order: Number(e.target.value) }))} className={inputCls} />
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm(f => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 accent-[#A7F515]" />
                <span className="text-sm font-semibold text-gray-700">Active (show on website)</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 bg-[#A7F515] text-[#211951] py-3 font-bold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : editId ? "Save Changes" : "Add Question"}
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
            <h3 className="text-lg font-bold text-[#211951] mb-2">Delete this question?</h3>
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
