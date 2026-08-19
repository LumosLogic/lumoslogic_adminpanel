import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuthMutation } from "../hooks/useAuthMutation";
import { CheckCircle2, Cloud, Loader2, AlertCircle } from "lucide-react";

export default function CloudinarySettings() {
  const config = useQuery(api.cloudinaryConfig.get);
  const save = useAuthMutation(api.cloudinaryConfig.save);
  const [cloudName, setCloudName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Populate form from existing config when it loads
  useEffect(() => {
    if (config) {
      setCloudName(config.cloudName);
      setApiKey(config.apiKey);
    }
  }, [config]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloudName.trim() || !apiKey.trim()) {
      setError("Cloud Name and API Key are required.");
      return;
    }
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await save({ cloudName: cloudName.trim(), apiKey: apiKey.trim() });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message ?? "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full px-4 py-2.5 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#A7F515] text-gray-900 text-sm";

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#211951]">Cloudinary Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Connect your Cloudinary account for fast image delivery</p>
      </div>

      {/* Status banner */}
      {config?.isConfigured ? (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 px-4 py-3 mb-6">
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
          <div>
            <p className="text-sm font-bold text-green-800">Cloudinary is connected</p>
            <p className="text-xs text-green-600">Cloud: <span className="font-mono">{config.cloudName}</span> · All new image uploads go to Cloudinary CDN</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 px-4 py-3 mb-6">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-bold text-amber-800">Cloudinary not configured</p>
            <p className="text-xs text-amber-600">Images are currently stored in Convex. Connect Cloudinary below for faster delivery.</p>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gray-50 border border-gray-200 p-4 mb-6">
        <p className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-2">How to get your credentials</p>
        <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
          <li>Log in to your Cloudinary account at cloudinary.com</li>
          <li>Go to Settings &rarr; Account</li>
          <li>Copy your <strong>Cloud Name</strong> (e.g., <code>my-company</code>)</li>
          <li>Copy your <strong>API Key</strong> (a 15-digit number)</li>
          <li>Set your <strong>API Secret</strong> in the Convex dashboard &rarr; Settings &rarr; Environment Variables as <code>CLOUDINARY_API_SECRET</code></li>
        </ol>
        <p className="text-xs text-amber-600 font-semibold mt-2">Never enter your API Secret here — it must only be set in the Convex dashboard.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Cloud Name *</label>
          <input
            value={cloudName}
            onChange={e => setCloudName(e.target.value)}
            placeholder="e.g. my-company"
            className={inputCls}
            required
          />
          <p className="text-xs text-gray-400 mt-1">Found in your Cloudinary dashboard top-left</p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">API Key *</label>
          <input
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="e.g. 123456789012345"
            className={inputCls}
            required
          />
          <p className="text-xs text-gray-400 mt-1">Found in Cloudinary Settings &rarr; Access Keys</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-[#A7F515] text-[#211951] px-6 py-3 font-bold hover:opacity-90 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
          {saving ? "Saving…" : saved ? "Saved!" : "Save Cloudinary Settings"}
        </button>
        {saved && <p className="text-green-600 text-sm font-semibold">Settings saved. New uploads will now go to Cloudinary.</p>}
      </form>
    </div>
  );
}
