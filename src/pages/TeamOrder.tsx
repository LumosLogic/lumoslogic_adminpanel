import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { useAuthMutation } from "../hooks/useAuthMutation";
import { api } from "../../convex/_generated/api";
import { ChevronUp, ChevronDown, RotateCcw, Save, Loader2, Plus, X } from "lucide-react";

const PAGES = [
  { id: "about",               label: "About Page" },
  { id: "web-development",     label: "Web Development" },
  { id: "mobile-app-development", label: "Mobile App Development" },
  { id: "ai-data-solutions",   label: "AI & Data Solutions" },
  { id: "cloud-devops",        label: "Cloud & DevOps" },
  { id: "cybersecurity",       label: "Cybersecurity" },
  { id: "ui-ux-design",        label: "UI/UX Design" },
  { id: "seo-services",        label: "SEO Services" },
  { id: "automation",          label: "Automation" },
];

export default function TeamOrder() {
  const [selectedPage, setSelectedPage] = useState("about");
  const [orderedIds, setOrderedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const allEmployees = useQuery(api.employees.listAll);
  const pageOrder    = useQuery(api.teamPageOrder.getForPage, { page: selectedPage });
  const setForPage   = useAuthMutation(api.teamPageOrder.setForPage);
  const resetForPage = useAuthMutation(api.teamPageOrder.resetForPage);

  // Rebuild the ordered list whenever page or saved order changes
  useEffect(() => {
    if (!allEmployees) return;

    if (pageOrder && pageOrder.employeeIds.length > 0) {
      // Use saved order — show only included employees
      const empMap = new Map(allEmployees.map(e => [e._id, e]));
      const ordered = pageOrder.employeeIds
        .filter(id => empMap.has(id))
        .map(id => id);
      setOrderedIds(ordered);
    } else {
      // Default: employees relevant to this page in global order
      const fallbackServiceId = selectedPage === "about" ? null : selectedPage;
      const candidates = allEmployees
        .filter(e =>
          e.isActive &&
          (fallbackServiceId ? (e.serviceIds ?? []).includes(fallbackServiceId) : true)
        )
        .sort((a, b) => a.order - b.order)
        .map(e => e._id);
      setOrderedIds(candidates);
    }
  }, [allEmployees, pageOrder, selectedPage]);

  const empMap = new Map((allEmployees ?? []).map(e => [e._id, e]));

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    setOrderedIds(ids => {
      const next = [...ids];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  };

  const moveDown = (idx: number) => {
    if (idx === orderedIds.length - 1) return;
    setOrderedIds(ids => {
      const next = [...ids];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  };

  const removeEmployee = (idx: number) => {
    setOrderedIds(ids => ids.filter((_, i) => i !== idx));
  };

  const addEmployee = (id: string) => {
    if (!orderedIds.includes(id)) setOrderedIds(ids => [...ids, id]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setForPage({ page: selectedPage, employeeIds: orderedIds });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally { setSaving(false); }
  };

  const handleReset = async () => {
    await resetForPage({ page: selectedPage });
    // Effect will reload defaults via useEffect
  };

  const unlistedEmployees = (allEmployees ?? [])
    .filter(e => e.isActive && !orderedIds.includes(e._id))
    .sort((a, b) => a.order - b.order);

  const pageLabel = PAGES.find(p => p.id === selectedPage)?.label ?? selectedPage;

  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#211951]">Team Display Order</h1>
        <p className="text-sm text-gray-500 mt-1">
          Set the exact order and members shown on each page. Changes here don't affect other pages.
        </p>
      </div>

      {/* Page selector */}
      <div className="mb-6">
        <label className="block text-xs font-bold text-[#211951] uppercase tracking-widest mb-2">Select Page</label>
        <select
          value={selectedPage}
          onChange={e => setSelectedPage(e.target.value)}
          className="w-full max-w-sm px-4 py-2.5 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#A7F515] text-sm font-semibold text-gray-800 bg-white"
        >
          {PAGES.map(p => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
      </div>

      {allEmployees === undefined ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#211951]" /></div>
      ) : (
        <>
          {/* Order list */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-[#211951] uppercase tracking-widest">
                Showing on <span className="text-[#A7F515]">{pageLabel}</span> — {orderedIds.length} member{orderedIds.length !== 1 ? "s" : ""}
              </p>
              {pageOrder && pageOrder.employeeIds.length > 0 && (
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-red-500 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset to default
                </button>
              )}
            </div>

            <div className="space-y-2">
              {orderedIds.map((id, idx) => {
                const emp = empMap.get(id);
                if (!emp) return null;
                return (
                  <div
                    key={id}
                    className="flex items-center gap-3 bg-white border border-gray-200 px-4 py-3 hover:border-[#A7F515] transition-colors"
                  >
                    {/* Position */}
                    <span className="w-6 text-center text-xs font-bold text-gray-300 shrink-0">{idx + 1}</span>

                    {/* Avatar */}
                    {emp.profileImageUrl
                      ? <img src={emp.profileImageUrl} alt={emp.name} className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0" />
                      : <div className="w-10 h-10 rounded-full bg-[#211951] flex items-center justify-center text-white text-sm font-bold shrink-0">{emp.name[0]}</div>
                    }

                    {/* Name / role */}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[#211951] text-sm truncate">{emp.name}</div>
                      <div className="text-xs text-gray-400 truncate">{emp.role}</div>
                    </div>

                    {/* Arrows */}
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => moveUp(idx)}
                        disabled={idx === 0}
                        className="w-7 h-7 flex items-center justify-center border border-gray-200 hover:border-[#A7F515] hover:bg-[#A7F515]/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronUp className="w-4 h-4 text-[#211951]" />
                      </button>
                      <button
                        onClick={() => moveDown(idx)}
                        disabled={idx === orderedIds.length - 1}
                        className="w-7 h-7 flex items-center justify-center border border-gray-200 hover:border-[#A7F515] hover:bg-[#A7F515]/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronDown className="w-4 h-4 text-[#211951]" />
                      </button>
                      <button
                        onClick={() => removeEmployee(idx)}
                        className="w-7 h-7 flex items-center justify-center border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-all"
                      >
                        <X className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {orderedIds.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm border border-dashed border-gray-200">
                  No members in this page's order. Add from below.
                </div>
              )}
            </div>
          </div>

          {/* Add unlisted employees */}
          {unlistedEmployees.length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Add to this page</p>
              <div className="flex flex-wrap gap-2">
                {unlistedEmployees.map(emp => (
                  <button
                    key={emp._id}
                    onClick={() => addEmployee(emp._id)}
                    className="flex items-center gap-2 px-3 py-1.5 border border-dashed border-gray-300 hover:border-[#A7F515] hover:bg-[#A7F515]/5 text-xs font-semibold text-gray-600 hover:text-[#211951] transition-all"
                  >
                    <Plus className="w-3 h-3" /> {emp.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-[#A7F515] text-[#211951] px-8 py-3 font-bold hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
              : saved
              ? <><Save className="w-4 h-4" /> Saved!</>
              : <><Save className="w-4 h-4" /> Save Order for {pageLabel}</>
            }
          </button>

          <p className="text-xs text-gray-400 mt-3">
            Only members in the list above will appear on <strong>{pageLabel}</strong>. Other pages are unaffected.
          </p>
        </>
      )}
    </div>
  );
}
