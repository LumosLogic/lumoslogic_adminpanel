import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Plus, Pencil, Trash2, Loader2, X } from "lucide-react";
import { useAuthMutation } from "../hooks/useAuthMutation";

type JobForm = {
  title: string;
  department: string;
  location: string;
  expMin: string;
  expMax: string;
  isFresher: boolean;
  description: string;
  type: string;
  skills: string;
  status: "Open" | "Closed";
};

const EMPTY_FORM: JobForm = {
  title: "",
  department: "",
  location: "",
  expMin: "",
  expMax: "",
  isFresher: false,
  description: "",
  type: "On-Site",
  skills: "",
  status: "Open",
};

const experienceToForm = (exp: string): Pick<JobForm, "expMin" | "expMax" | "isFresher"> => {
  if (exp === "0" || exp === "Fresher" || exp === "0-0") return { expMin: "", expMax: "", isFresher: true };
  const parts = exp.split("-");
  if (parts.length === 2) return { expMin: parts[0], expMax: parts[1], isFresher: false };
  return { expMin: exp, expMax: "", isFresher: false };
};

const formToExperience = (form: JobForm): string => {
  if (form.isFresher) return "Fresher";
  if (form.expMin && form.expMax) return `${form.expMin}-${form.expMax}`;
  if (form.expMin) return form.expMin;
  return "";
};

// Toggle switch component
const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button
    type="button"
    onClick={onChange}
    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-200 focus:outline-none ${
      checked ? "bg-green-500" : "bg-gray-300"
    }`}
  >
    <span
      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
        checked ? "translate-x-8" : "translate-x-1"
      }`}
    />
  </button>
);

export default function Jobs() {
  const jobs = useQuery(api.jobs.listAll);
  const createJob = useAuthMutation(api.jobs.create);
  const updateJob = useAuthMutation(api.jobs.update);
  const toggleStatus = useAuthMutation(api.jobs.toggleStatus);
  const removeJob = useAuthMutation(api.jobs.remove);

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<Id<"jobs"> | null>(null);
  const [form, setForm] = useState<JobForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Id<"jobs"> | null>(null);

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (job: any) => {
    setEditId(job._id);
    setForm({
      title: job.title,
      department: job.department,
      location: job.location,
      ...experienceToForm(job.experience),
      description: job.description,
      type: job.type,
      skills: job.skills,
      status: job.status,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const experience = formToExperience(form);
    const payload = {
      title: form.title,
      department: form.department,
      location: form.location,
      experience,
      description: form.description,
      type: form.type,
      skills: form.skills,
      status: form.status,
    };
    try {
      if (editId) {
        await updateJob({ id: editId, ...payload });
      } else {
        await createJob(payload);
      }
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };

  const set = (key: keyof JobForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#211951]">Job Postings</h1>
          <p className="text-gray-500 text-sm mt-1">{jobs?.length ?? 0} total positions</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-[#A7F515] text-[#211951] px-5 py-2.5 font-bold text-sm hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" /> New Job
        </button>
      </div>

      {jobs === undefined ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#211951]" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-200">
          <p className="text-gray-500 mb-4">No job postings yet.</p>
          <button onClick={openCreate} className="text-[#211951] font-bold underline text-sm">
            Create your first job
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div
              key={job._id}
              className="bg-white border border-gray-200 p-5 flex items-start justify-between gap-4 hover:border-[#A7F515] transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <h3 className="font-bold text-[#211951] text-base">{job.title}</h3>
                  <span
                    className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                      job.status === "Open"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {job.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {job.department} · {job.location} · {job.experience} yrs · {job.type}
                </p>
                {job.skills && (
                  <p className="text-xs text-gray-400 mt-1 truncate max-w-xl">{job.skills}</p>
                )}
              </div>
              <div className="flex items-center gap-4 shrink-0">
                {/* Big toggle */}
                <div className="flex items-center gap-2">
                  <Toggle
                    checked={job.status === "Open"}
                    onChange={() => toggleStatus({ id: job._id })}
                  />
                  <span className={`text-xs font-semibold w-12 ${job.status === "Open" ? "text-green-600" : "text-gray-400"}`}>
                    {job.status}
                  </span>
                </div>
                <button
                  onClick={() => openEdit(job)}
                  className="p-2 text-gray-400 hover:text-[#211951] transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setConfirmDelete(job._id)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-[#211951]">
                {editId ? "Edit Job" : "New Job Posting"}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Job Title <span className="text-red-500">*</span>
                  </label>
                  <input required value={form.title} onChange={set("title")} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <input required value={form.department} onChange={set("department")} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <input required value={form.location} onChange={set("location")} className={inputCls} />
                </div>

                {/* Experience field */}
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Experience <span className="text-red-500">*</span>
                  </label>
                  <label className="flex items-center gap-2 mb-3 cursor-pointer w-fit">
                    <input
                      type="checkbox"
                      checked={form.isFresher}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, isFresher: e.target.checked, expMin: "", expMax: "" }))
                      }
                      className="w-4 h-4 accent-[#A7F515]"
                    />
                    <span className="text-sm font-medium text-gray-700">Fresher (0 experience required)</span>
                  </label>
                  {!form.isFresher && (
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">Min years</label>
                        <input
                          type="number"
                          min="0"
                          max="30"
                          placeholder="e.g. 1"
                          value={form.expMin}
                          onChange={set("expMin")}
                          className={inputCls}
                        />
                      </div>
                      <span className="text-gray-400 mt-5">—</span>
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">Max years</label>
                        <input
                          type="number"
                          min="0"
                          max="30"
                          placeholder="e.g. 3"
                          value={form.expMax}
                          onChange={set("expMax")}
                          className={inputCls}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Type</label>
                  <select value={form.type} onChange={set("type")} className={inputCls}>
                    <option>On-Site</option>
                    <option>Remote</option>
                    <option>Hybrid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={set("status")} className={inputCls}>
                    <option value="Open">Open</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Skills (comma-separated)
                  </label>
                  <input
                    value={form.skills}
                    onChange={set("skills")}
                    placeholder="React, Node.js, TypeScript"
                    className={inputCls}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    className={inputCls}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-[#A7F515] text-[#211951] py-3 font-bold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                  ) : editId ? "Save Changes" : "Create Job"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-white p-8 max-w-sm w-full shadow-2xl text-center">
            <Trash2 className="w-10 h-10 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-[#211951] mb-2">Delete this job?</h3>
            <p className="text-gray-500 text-sm mb-6">This cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  await removeJob({ id: confirmDelete });
                  setConfirmDelete(null);
                }}
                className="flex-1 bg-red-500 text-white py-2.5 font-bold hover:bg-red-600"
              >
                Delete
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 border-2 border-gray-200 text-gray-600 py-2.5 font-bold hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls =
  "w-full px-4 py-2.5 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#A7F515] text-gray-900 text-sm";
