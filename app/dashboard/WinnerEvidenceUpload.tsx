"use client";

import { useState } from "react";
import { CheckCircle2, Upload, XCircle } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type WinnerEvidenceUploadProps = {
  winnerId: string;
  userId: string;
  existingEvidence?: string | null;
  disabled?: boolean;
};

export default function WinnerEvidenceUpload({
  winnerId,
  userId,
  existingEvidence,
  disabled = false,
}: WinnerEvidenceUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setMessage("");
    setError("");

    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        "Please upload a PNG, JPG, or WebP image."
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5 MB.");
      return;
    }

    try {
      setUploading(true);

      const supabase = createClient();

      const extension =
        file.name.split(".").pop()?.toLowerCase() || "jpg";

      const filePath = `${userId}/${winnerId}-${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("winner-evidence")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const response = await fetch(
        "/api/winners/evidence",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            winnerId,
            filePath,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to save winner evidence."
        );
      }

      setMessage(
        "Evidence uploaded successfully. It is now pending admin verification."
      );

      event.target.value = "";
    } catch (uploadError) {
      console.error(uploadError);

      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Unable to upload evidence."
      );
    } finally {
      setUploading(false);
    }
  }

  if (disabled) {
    return (
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
        <div className="flex items-center gap-2 text-sm text-white/45">
          <CheckCircle2
            size={17}
            className="text-emerald-300"
          />
          Payout completed. Evidence can no longer be changed.
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
          <Upload size={17} />
        </div>

        <div>
          <p className="text-sm font-medium">
            {existingEvidence
              ? "Update score evidence"
              : "Submit score evidence"}
          </p>

          <p className="mt-1 text-xs leading-5 text-white/40">
            Upload a screenshot showing your golf platform
            score. PNG, JPG or WebP · maximum 5 MB.
          </p>
        </div>
      </div>

      <label
        className={`mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium transition ${
          uploading
            ? "cursor-not-allowed opacity-50"
            : "hover:bg-white/[0.05]"
        }`}
      >
        <Upload size={15} />

        {uploading
          ? "Uploading..."
          : existingEvidence
          ? "Upload new screenshot"
          : "Choose screenshot"}

        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleUpload}
          disabled={uploading}
          className="hidden"
        />
      </label>

      {message ? (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-xs leading-5 text-emerald-300">
          <CheckCircle2
            size={15}
            className="mt-0.5 shrink-0"
          />
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-xs leading-5 text-red-300">
          <XCircle
            size={15}
            className="mt-0.5 shrink-0"
          />
          {error}
        </div>
      ) : null}
    </div>
  );
}