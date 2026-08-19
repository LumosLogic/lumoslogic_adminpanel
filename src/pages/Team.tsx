import { useState } from "react";
import { useQuery } from "convex/react";
import { useAuthMutation } from "../hooks/useAuthMutation";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Plus, Pencil, Trash2, Loader2, X, PlusCircle, MinusCircle } from "lucide-react";
import ImageUpload from "../components/ImageUpload";

const SERVICE_OPTIONS = [
  "web-development", "mobile-app-development", "ai-data-solutions",
  "cloud-devops", "cybersecurity", "ui-ux-design", "seo-services", "automation",
];

type Project = { name: string; description: string; technologies: string[] };

type EmpForm = {
  name: string; role: string; email: string; headline: string;
  employmentType: "Full-time" | "Part-time" | "Intern" | "Contract";
  profileImageId?: Id<"_storage">; linkedinUrl: string; githubUrl: string; portfolioUrl: string;
  experience: string; bio: string;
  skills: string; industries: string; hobbies: string; preferredContact: string;
  projects: Project[]; quote: string; funFact: string; serviceIds: string[];
  isActive: boolean; order: number;
  cloudinaryPublicId?: string; cloudinarySecureUrl?: string;
};

const EMPTY: EmpForm = {
  name: "", role: "", email: "", headline: "", employmentType: "Full-time",
  linkedinUrl: "", githubUrl: "", portfolioUrl: "", experience: "", bio: "",
  skills: "", industries: "", hobbies: "", preferredContact: "",
  projects: [], quote: "", funFact: "", serviceIds: [], isActive: true, order: 0,
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

export default function Team() {
  const employees = useQuery(api.employees.listAll);
  const create = useAuthMutation(api.employees.create);
  const update = useAuthMutation(api.employees.update);
  const toggleActive = useAuthMutation(api.employees.toggleActive);
  const remove = useAuthMutation(api.employees.remove);

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<Id<"employees"> | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [currentImageId, setCurrentImageId] = useState<Id<"_storage"> | undefined>();
  const [form, setForm] = useState<EmpForm>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Id<"employees"> | null>(null);

  const openCreate = () => {
    setEditId(null); setForm(EMPTY);
    setCurrentImageUrl(null); setCurrentImageId(undefined);
    setShowModal(true);
  };

  const openEdit = (emp: any) => {
    setEditId(emp._id);
    setCurrentImageUrl(emp.profileImageUrl ?? null);
    setCurrentImageId(emp.profileImageId);
    setForm({
      name: emp.name, role: emp.role, email: emp.email, headline: emp.headline,
      employmentType: emp.employmentType, profileImageId: emp.profileImageId,
      linkedinUrl: emp.linkedinUrl ?? "", githubUrl: emp.githubUrl ?? "",
      portfolioUrl: emp.portfolioUrl ?? "", experience: emp.experience, bio: emp.bio,
      skills: toLines(emp.skills), industries: toLines(emp.industries),
      hobbies: toLines(emp.hobbies), preferredContact: toLines(emp.preferredContact),
      projects: emp.projects ?? [], quote: emp.quote ?? "", funFact: emp.funFact ?? "",
      serviceIds: emp.serviceIds ?? [], isActive: emp.isActive, order: emp.order,
      cloudinaryPublicId: emp.cloudinaryPublicId ?? undefined,
      cloudinarySecureUrl: emp.cloudinarySecureUrl ?? undefined,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        profileImageId: form.profileImageId,
        linkedinUrl: form.linkedinUrl || undefined,
        githubUrl: form.githubUrl || undefined,
        portfolioUrl: form.portfolioUrl || undefined,
        skills: lines(form.skills), industries: lines(form.industries),
        hobbies: lines(form.hobbies), preferredContact: lines(form.preferredContact),
      };
      if (editId) await update({ id: editId, ...payload });
      else await create(payload);
      setShowModal(false);
    } finally { setSaving(false); }
  };

  const set = (key: keyof EmpForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const addProject = () => setForm(f => ({ ...f, projects: [...f.projects, { name: "", description: "", technologies: [] }] }));
  const removeProject = (i: number) => setForm(f => ({ ...f, projects: f.projects.filter((_, idx) => idx !== i) }));
  const setProject = (i: number, field: keyof Project, val: string) =>
    setForm(f => ({ ...f, projects: f.projects.map((p, idx) => idx === i ? { ...p, [field]: field === "technologies" ? val.split(",").map(t => t.trim()).filter(Boolean) : val } : p) }));

  const toggleService = (s: string) =>
    setForm(f => ({ ...f, serviceIds: f.serviceIds.includes(s) ? f.serviceIds.filter(x => x !== s) : [...f.serviceIds, s] }));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#211951]">Team</h1>
          <p className="text-gray-500 text-sm mt-1">{employees?.length ?? 0} members</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-[#A7F515] text-[#211951] px-5 py-2.5 font-bold text-sm hover:opacity-90">
          <Plus className="w-4 h-4" /> Add Member
        </button>
      </div>

      {employees === undefined ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#211951]" /></div>
      ) : employees.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-200">
          <p className="text-gray-500 mb-4">No team members yet.</p>
          <button onClick={openCreate} className="text-[#211951] font-bold underline text-sm">Add your first member</button>
        </div>
      ) : (
        <div className="space-y-3">
          {employees.map((emp) => (
            <div key={emp._id} className="bg-white border border-gray-200 p-5 flex items-center justify-between gap-4 hover:border-[#A7F515] transition-colors">
              <div className="flex items-center gap-4 min-w-0">
                {emp.profileImageUrl
                  ? <img src={emp.profileImageUrl} alt={emp.name} className="w-12 h-12 rounded-full object-cover shrink-0 border border-gray-200" />
                  : <div className="w-12 h-12 rounded-full bg-[#211951] flex items-center justify-center text-white font-bold text-sm shrink-0">{emp.name[0]}</div>
                }
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-[#211951] text-base">{emp.name}</h3>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">{emp.employmentType}</span>
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${emp.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {emp.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{emp.role} · {emp.experience}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Toggle checked={emp.isActive} onChange={() => toggleActive({ id: emp._id })} />
                <button onClick={() => openEdit(emp)} className="p-2 text-gray-400 hover:text-[#211951]"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => setConfirmDelete(emp._id)} className="p-2 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-[#211951]">{editId ? "Edit Member" : "New Team Member"}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-6">
              {/* Basic */}
              <section>
                <h3 className="text-xs font-bold text-[#211951] uppercase tracking-widest mb-3">Basic Info</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name *</label>
                    <input required value={form.name} onChange={set("name")} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Role / Title *</label>
                    <input required value={form.role} onChange={set("role")} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Work Email *</label>
                    <input required type="email" value={form.email} onChange={set("email")} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Employment Type</label>
                    <select value={form.employmentType} onChange={set("employmentType")} className={inputCls}>
                      <option>Full-time</option><option>Part-time</option><option>Intern</option><option>Contract</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Headline *</label>
                    <input required value={form.headline} onChange={set("headline")} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Experience</label>
                    <input value={form.experience} onChange={set("experience")} placeholder="e.g. 2 years" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Order</label>
                    <input type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: Number(e.target.value) }))} className={inputCls} />
                  </div>
                </div>
              </section>

              {/* Profile Image */}
              <section>
                <h3 className="text-xs font-bold text-[#211951] uppercase tracking-widest mb-3">Profile Image</h3>
                <ImageUpload
                  currentUrl={currentImageUrl}
                  currentId={currentImageId}
                  cloudinaryPublicId={form.cloudinaryPublicId}
                  onUpload={(sid, url, cloudinary) => {
                    setForm(f => ({
                      ...f,
                      profileImageId: sid ?? undefined,
                      cloudinaryPublicId: cloudinary?.publicId,
                      cloudinarySecureUrl: cloudinary?.secureUrl,
                    }));
                    setCurrentImageId(sid ?? undefined);
                    setCurrentImageUrl(cloudinary?.secureUrl ?? url);
                  }}
                  onRemove={() => {
                    setForm(f => ({ ...f, profileImageId: undefined, cloudinaryPublicId: undefined, cloudinarySecureUrl: undefined }));
                    setCurrentImageUrl(null);
                    setCurrentImageId(undefined);
                  }}
                />
              </section>

              {/* Links */}
              <section>
                <h3 className="text-xs font-bold text-[#211951] uppercase tracking-widest mb-3">Links</h3>
                <div className="space-y-3">
                  {[{ key: "linkedinUrl" as const, label: "LinkedIn URL" }, { key: "githubUrl" as const, label: "GitHub URL" }, { key: "portfolioUrl" as const, label: "Portfolio URL" }].map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
                      <input value={form[key] as string} onChange={set(key)} placeholder="https://…" className={inputCls} />
                    </div>
                  ))}
                </div>
              </section>

              {/* Bio & Arrays */}
              <section>
                <h3 className="text-xs font-bold text-[#211951] uppercase tracking-widest mb-3">Profile</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Bio *</label>
                    <textarea required rows={5} value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} className={inputCls} />
                  </div>
                  {[
                    { key: "skills" as const, label: "Skills (one per line)" },
                    { key: "industries" as const, label: "Industries (one per line)" },
                    { key: "hobbies" as const, label: "Hobbies (one per line)" },
                    { key: "preferredContact" as const, label: "Preferred Contact (one per line)" },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
                      <textarea rows={3} value={form[key] as string} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className={inputCls} />
                    </div>
                  ))}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Quote</label>
                    <input value={form.quote} onChange={set("quote")} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Fun Fact</label>
                    <input value={form.funFact} onChange={set("funFact")} className={inputCls} />
                  </div>
                </div>
              </section>

              {/* Projects */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-[#211951] uppercase tracking-widest">Projects</h3>
                  <button type="button" onClick={addProject} className="flex items-center gap-1 text-xs font-bold text-[#211951] hover:text-[#A7F515] transition-colors">
                    <PlusCircle className="w-4 h-4" /> Add Project
                  </button>
                </div>
                <div className="space-y-4">
                  {form.projects.map((proj, i) => (
                    <div key={i} className="border border-gray-200 p-4 bg-gray-50 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-500">Project {i + 1}</span>
                        <button type="button" onClick={() => removeProject(i)} className="text-red-400 hover:text-red-600"><MinusCircle className="w-4 h-4" /></button>
                      </div>
                      <input placeholder="Project name" value={proj.name} onChange={e => setProject(i, "name", e.target.value)} className={inputCls} />
                      <textarea placeholder="Description" rows={2} value={proj.description} onChange={e => setProject(i, "description", e.target.value)} className={inputCls} />
                      <input placeholder="Technologies (comma-separated)" value={proj.technologies.join(", ")} onChange={e => setProject(i, "technologies", e.target.value)} className={inputCls} />
                    </div>
                  ))}
                </div>
              </section>

              {/* Services */}
              <section>
                <h3 className="text-xs font-bold text-[#211951] uppercase tracking-widest mb-3">Associated Services</h3>
                <div className="grid grid-cols-2 gap-2">
                  {SERVICE_OPTIONS.map(s => (
                    <label key={s} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="checkbox" checked={form.serviceIds.includes(s)} onChange={() => toggleService(s)} className="w-4 h-4 accent-[#A7F515]" />
                      <span className="text-gray-700">{s}</span>
                    </label>
                  ))}
                </div>
              </section>

              {/* Active */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 accent-[#A7F515]" />
                <span className="text-sm font-semibold text-gray-700">Active (show on website)</span>
              </label>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 bg-[#A7F515] text-[#211951] py-3 font-bold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : editId ? "Save Changes" : "Add Member"}
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
            <h3 className="text-lg font-bold text-[#211951] mb-2">Delete this member?</h3>
            <p className="text-gray-500 text-sm mb-6">Their profile image will also be deleted. This cannot be undone.</p>
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
