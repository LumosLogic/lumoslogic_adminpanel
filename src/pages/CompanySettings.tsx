import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { useAuthMutation } from "../hooks/useAuthMutation";
import { api } from "../../convex/_generated/api";
import { Loader2, Save, CheckCircle } from "lucide-react";

type InfoForm = {
  name: string;
  email: string;
  phone: string;
  address: { street: string; landmark: string; city: string; state: string; pincode: string; country: string };
  social: { instagram: string; linkedin: string; youtube: string };
  stats: { projectsCompleted: string; clientSatisfaction: string; yearsExperience: string; teamMembers: string; supportAvailability: string };
};

const DEFAULT: InfoForm = {
  name: "Lumos Logic",
  email: "hello@lumoslogic.com",
  phone: "+91 7984774840",
  address: { street: "E-1102 Ganesh Glory 11, Jagatpur Rd", landmark: "near BSNL Office", city: "Ahmedabad", state: "Gujarat", pincode: "382470", country: "India" },
  social: { instagram: "", linkedin: "", youtube: "" },
  stats: { projectsCompleted: "500+", clientSatisfaction: "98%", yearsExperience: "5+", teamMembers: "13+", supportAvailability: "24/7" },
};

export default function CompanySettings() {
  const info = useQuery(api.companyInfo.get);
  const upsert = useAuthMutation(api.companyInfo.upsert);
  const [form, setForm] = useState<InfoForm>(DEFAULT);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (info) {
      setForm({
        name: info.name,
        email: info.email,
        phone: info.phone,
        address: { ...info.address },
        social: { ...info.social },
        stats: { ...info.stats },
      });
    }
  }, [info]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await upsert(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally { setSaving(false); }
  };

  const setAddr = (k: keyof InfoForm["address"]) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, address: { ...f.address, [k]: e.target.value } }));
  const setSocial = (k: keyof InfoForm["social"]) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, social: { ...f.social, [k]: e.target.value } }));
  const setStat = (k: keyof InfoForm["stats"]) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, stats: { ...f.stats, [k]: e.target.value } }));

  if (info === undefined) return (
    <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-[#211951]" /></div>
  );

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#211951]">Company Settings</h1>
          <p className="text-gray-500 text-sm mt-1">Contact info, social links and stats shown on the website</p>
        </div>
        {saved && (
          <div className="flex items-center gap-2 text-green-600 font-semibold text-sm">
            <CheckCircle className="w-5 h-5" /> Saved!
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Basic */}
        <section>
          <h2 className="text-sm font-bold text-[#211951] uppercase tracking-widest mb-4 pb-2 border-b border-gray-200">Basic Info</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Company Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={inputCls} />
            </div>
          </div>
        </section>

        {/* Address */}
        <section>
          <h2 className="text-sm font-bold text-[#211951] uppercase tracking-widest mb-4 pb-2 border-b border-gray-200">Address</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Street</label>
              <input value={form.address.street} onChange={setAddr("street")} className={inputCls} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Landmark</label>
              <input value={form.address.landmark} onChange={setAddr("landmark")} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">City</label>
              <input value={form.address.city} onChange={setAddr("city")} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">State</label>
              <input value={form.address.state} onChange={setAddr("state")} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Pincode</label>
              <input value={form.address.pincode} onChange={setAddr("pincode")} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Country</label>
              <input value={form.address.country} onChange={setAddr("country")} className={inputCls} />
            </div>
          </div>
        </section>

        {/* Social */}
        <section>
          <h2 className="text-sm font-bold text-[#211951] uppercase tracking-widest mb-4 pb-2 border-b border-gray-200">Social Links</h2>
          <div className="space-y-3">
            {(["instagram", "linkedin", "youtube"] as const).map(k => (
              <div key={k}>
                <label className="block text-sm font-semibold text-gray-700 mb-1 capitalize">{k}</label>
                <input value={form.social[k]} onChange={setSocial(k)} placeholder={`https://www.${k}.com/…`} className={inputCls} />
              </div>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section>
          <h2 className="text-sm font-bold text-[#211951] uppercase tracking-widest mb-4 pb-2 border-b border-gray-200">Company Stats</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: "projectsCompleted" as const, label: "Projects Completed" },
              { key: "clientSatisfaction" as const, label: "Client Satisfaction" },
              { key: "yearsExperience" as const, label: "Years Experience" },
              { key: "teamMembers" as const, label: "Team Members" },
              { key: "supportAvailability" as const, label: "Support Availability" },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
                <input value={form.stats[key]} onChange={setStat(key)} placeholder="e.g. 500+" className={inputCls} />
              </div>
            ))}
          </div>
        </section>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-[#A7F515] text-[#211951] px-8 py-3 font-bold hover:opacity-90 disabled:opacity-50"
        >
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> Save Settings</>}
        </button>
      </form>
    </div>
  );
}

const inputCls = "w-full px-4 py-2.5 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#A7F515] text-gray-900 text-sm";
