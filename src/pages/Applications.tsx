import { useState } from "react";
import { useQuery, useAction } from "convex/react";
import { useAuthMutation } from "../hooks/useAuthMutation";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { ExternalLink, Trash2, X, ChevronDown, Loader2, Search, Download, RefreshCw } from "lucide-react";
import * as XLSX from "xlsx";

export default function Applications() {
  const jobs = useQuery(api.jobs.listAll);
  const [filterJobId, setFilterJobId] = useState<string>("");
  const applications = useQuery(api.applications.listAll, {
    job_id: filterJobId || undefined,
  });
  const removeApp = useAuthMutation(api.applications.remove);
  const syncAll = useAction(api.applications.syncAllToSheets);

  const [selected, setSelected] = useState<any | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Id<"applications"> | null>(null);
  const [search, setSearch] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const filtered = applications?.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      a.candidate_name.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      a.job_title.toLowerCase().includes(q) ||
      a.skills.toLowerCase().includes(q)
    );
  });

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await syncAll({});
      setSyncResult(`Synced ${result.synced} of ${result.total} records to Google Sheets.`);
    } catch (err: any) {
      setSyncResult(`Error: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleExport = () => {
    const data = (filtered ?? []).map((a, i) => ({
      "#": i + 1,
      "Candidate Name": a.candidate_name,
      "Role / Position": a.job_title,
      "Experience": a.experience ?? "",
      "Location": a.current_location,
      "Email": a.email,
      "Mobile": a.phone,
      "Resume": a.resume_link,
      "Current CTC": a.current_ctc ?? "",
      "Expected CTC": a.expected_ctc ?? "",
      "Notice Period": a.notice_period ?? "",
      "Source": "Career Page",
      "Status": "",
      "Rating": "",
      "Notes": "",
      "Portfolio": a.portfolio_link ?? "",
      "GitHub (Test)": a.github_link ?? "",
      "Practical Status": "",
      "Test Type": "",
      "Round 1 Notes": "",
      "Round 2 Schedule": "",
      "Round 2 Result": "",
      "Round 2 Notes": "",
      "Current Company": a.current_company ?? "",
      "Current Position": a.current_position ?? "",
      "Applied On": new Date(a.applied_at).toLocaleString("en-IN"),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Candidates");
    XLSX.writeFile(wb, `candidates_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#211951]">Applications</h1>
            <p className="text-gray-500 text-sm mt-1">{applications?.length ?? 0} total</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSync}
              disabled={syncing || !applications || applications.length === 0}
              className="flex items-center gap-2 border-2 border-[#211951] text-[#211951] px-4 py-2.5 text-sm font-semibold hover:bg-[#211951]/5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing..." : "Sync to Sheets"}
            </button>
            <button
              onClick={handleExport}
              disabled={!filtered || filtered.length === 0}
              className="flex items-center gap-2 bg-[#211951] text-white px-4 py-2.5 text-sm font-semibold hover:bg-[#211951]/90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Export Excel
            </button>
          </div>
        </div>
        {syncResult && (
          <p className={`mt-3 text-sm font-medium ${syncResult.startsWith("Error") ? "text-red-500" : "text-green-600"}`}>
            {syncResult}
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <div className="relative">
          <select
            value={filterJobId}
            onChange={(e) => setFilterJobId(e.target.value)}
            className="appearance-none pl-4 pr-10 py-2.5 border border-gray-300 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#A7F515] min-w-[220px]"
          >
            <option value="">All Job Roles</option>
            {jobs?.map((j) => (
              <option key={j._id} value={j._id}>
                {j.title}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search name, email, skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#A7F515]"
          />
        </div>
      </div>

      {applications === undefined ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#211951]" />
        </div>
      ) : filtered?.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-200">
          <p className="text-gray-500">No applications found.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#211951] text-white text-left">
                  <th className="px-4 py-3 font-semibold">Candidate</th>
                  <th className="px-4 py-3 font-semibold">Applied For</th>
                  <th className="px-4 py-3 font-semibold">Location</th>
                  <th className="px-4 py-3 font-semibold">Skills</th>
                  <th className="px-4 py-3 font-semibold">Applied On</th>
                  <th className="px-4 py-3 font-semibold">Resume</th>
                  <th className="px-4 py-3 font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered?.map((app) => (
                  <tr
                    key={app._id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelected(app)}
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold text-[#211951]">{app.candidate_name}</p>
                      <p className="text-gray-400 text-xs">{app.email}</p>
                      <p className="text-gray-400 text-xs">{app.phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block bg-[#A7F515]/20 text-[#211951] border border-[#A7F515]/40 px-2 py-0.5 text-xs font-semibold">
                        {app.job_title}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{app.current_location}</td>
                    <td className="px-4 py-3">
                      <p className="text-gray-600 max-w-[200px] truncate text-xs">{app.skills}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                      {new Date(app.applied_at).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {app.resume_link ? (
                        <a
                          href={app.resume_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[#211951] font-semibold hover:text-[#A7F515] text-xs"
                        >
                          View <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setConfirmDelete(app._id)}
                        className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelected(null)} />
          <div className="relative ml-auto bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-lg font-bold text-[#211951]">{selected.candidate_name}</h2>
                <span className="inline-block bg-[#A7F515]/20 text-[#211951] border border-[#A7F515]/40 px-2 py-0.5 text-xs font-semibold mt-1">
                  {selected.job_title}
                </span>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <Section title="Contact">
                <Row label="Email" value={selected.email} />
                <Row label="Phone" value={selected.phone} />
                <Row label="Location" value={selected.current_location} />
              </Section>

              <Section title="Professional">
                <Row label="Current Company" value={selected.current_company} />
                <Row label="Current Position" value={selected.current_position} />
                <Row label="Experience" value={selected.experience} />
                <Row label="Current CTC" value={selected.current_ctc} />
                <Row label="Expected CTC" value={selected.expected_ctc} />
                <Row label="Notice Period" value={selected.notice_period} />
              </Section>

              <Section title="Skills">
                <div className="flex flex-wrap gap-2 mt-1">
                  {selected.skills.split(",").map((s: string, i: number) => (
                    <span
                      key={i}
                      className="bg-gray-100 text-gray-700 px-3 py-1 text-xs font-medium border border-gray-200"
                    >
                      {s.trim()}
                    </span>
                  ))}
                </div>
              </Section>

              <Section title="Links">
                <LinkRow label="Resume" href={selected.resume_link} />
                <LinkRow label="GitHub" href={selected.github_link} />
                <LinkRow label="Portfolio" href={selected.portfolio_link} />
              </Section>

              {selected.cover_letter && (
                <Section title="Cover Letter">
                  <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap mt-1">
                    {selected.cover_letter}
                  </p>
                </Section>
              )}

              <p className="text-xs text-gray-400">
                Applied on{" "}
                {new Date(selected.applied_at).toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-white p-8 max-w-sm w-full shadow-2xl text-center">
            <Trash2 className="w-10 h-10 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-[#211951] mb-2">Delete this application?</h3>
            <p className="text-gray-500 text-sm mb-6">This cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  await removeApp({ id: confirmDelete });
                  setConfirmDelete(null);
                  if (selected?._id === confirmDelete) setSelected(null);
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

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <h3 className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-3">{title}</h3>
    <div className="space-y-2">{children}</div>
  </div>
);

const Row = ({ label, value }: { label: string; value?: string }) =>
  value ? (
    <div className="flex gap-3">
      <span className="text-gray-400 text-sm w-36 shrink-0">{label}</span>
      <span className="text-gray-800 text-sm font-medium">{value}</span>
    </div>
  ) : null;

const LinkRow = ({ label, href }: { label: string; href?: string }) =>
  href ? (
    <div className="flex gap-3 items-center">
      <span className="text-gray-400 text-sm w-36 shrink-0">{label}</span>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#211951] text-sm font-semibold hover:text-[#A7F515] flex items-center gap-1"
      >
        Open link <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  ) : null;
