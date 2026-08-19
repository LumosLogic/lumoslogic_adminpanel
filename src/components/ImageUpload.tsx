import { useRef, useState } from "react";
import { useQuery, useMutation, useAction, useConvex } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Upload, X, Loader2 } from "lucide-react";
import { getToken } from "../lib/auth";

interface CloudinaryUploadResult {
  publicId: string;
  secureUrl: string;
}

interface Props {
  label?: string;
  currentUrl?: string | null;
  currentId?: Id<"_storage"> | null;
  cloudinaryPublicId?: string | null;
  onUpload: (
    storageId: Id<"_storage"> | null,
    previewUrl: string | null,
    cloudinary?: CloudinaryUploadResult
  ) => void;
  onRemove: () => void;
}

export default function ImageUpload({ label = "Image", currentUrl, currentId, cloudinaryPublicId, onUpload, onRemove }: Props) {
  const [uploading, setUploading] = useState(false);
  const cloudinaryConfig = useQuery(api.cloudinaryConfig.get);
  const getSignedParams = useAction(api.cloudinary.getSignedUploadParams);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const deleteFile = useMutation(api.files.deleteFile);
  const convex = useConvex();
  const inputRef = useRef<HTMLInputElement>(null);

  const isCloudinaryConfigured = cloudinaryConfig?.isConfigured === true;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      if (isCloudinaryConfigured) {
        // Cloudinary upload path
        const folder = "Lumoslogic website";
        const params = await getSignedParams({ folder, token: getToken() ?? "" });

        const fd = new FormData();
        fd.append("file", file);
        fd.append("api_key", params.apiKey);
        fd.append("timestamp", String(params.timestamp));
        fd.append("signature", params.signature);
        fd.append("folder", params.folder);

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${params.cloudName}/image/upload`,
          { method: "POST", body: fd }
        );
        if (!res.ok) throw new Error("Cloudinary upload failed");
        const data = await res.json();

        onUpload(null, data.secure_url, { publicId: data.public_id, secureUrl: data.secure_url });
      } else {
        // Fallback: Convex storage upload
        const postUrl = await generateUploadUrl();
        const result = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        const { storageId } = await result.json();
        const previewUrl = await convex.query(api.files.getUrlForStorage, { storageId });
        onUpload(storageId, previewUrl);
      }
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    if (currentId && !cloudinaryPublicId) {
      await deleteFile({ storageId: currentId });
    }
    onRemove();
  };

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      {isCloudinaryConfigured && (
        <p className="text-xs text-green-600 font-semibold mb-2">&#x2601; Cloudinary connected</p>
      )}
      <div className="flex items-start gap-4">
        {currentUrl ? (
          <div className="relative w-28 h-28 bg-gray-100 border border-gray-200 shrink-0">
            <img src={currentUrl} alt="preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="w-28 h-28 bg-gray-50 border-2 border-dashed border-gray-300 flex items-center justify-center shrink-0">
            <Upload className="w-6 h-6 text-gray-300" />
          </div>
        )}
        <div className="flex flex-col gap-2">
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? "Uploading…" : currentUrl ? "Replace" : "Upload"}
          </button>
          <p className="text-xs text-gray-400">
            {isCloudinaryConfigured ? "Uploads to Cloudinary CDN" : "Uploads to storage"}
          </p>
        </div>
      </div>
    </div>
  );
}
