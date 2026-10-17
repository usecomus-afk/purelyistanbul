"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ImageOff, Plus, Star, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { HostGuard } from "@/components/marketplace/HostGuard";
import { uploadListingImage } from "@/lib/marketplace/storage";
import {
  addListingImage,
  deleteDraftListing,
  removeListingImage,
  setCoverImage,
  submitListingForReview,
  unpublishListing,
  updateListingFields,
  watchListing,
  withdrawListingToDraft
} from "@/lib/marketplace/listings";
import type { MarketplaceListing } from "@/lib/marketplace/types";
import { useCategoryConfigs } from "@/lib/marketplace/use-category-configs";

const CURRENCIES = ["TRY", "USD", "EUR"];

function EditListingInner() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [listing, setListing] = useState<MarketplaceListing | null | undefined>(undefined);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [district, setDistrict] = useState("");
  const [category, setCategory] = useState("");
  const [basePrice, setBasePrice] = useState(0);
  const [currency, setCurrency] = useState("TRY");
  const [capacity, setCapacity] = useState(2);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [amenityInput, setAmenityInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const categoryConfigs = useCategoryConfigs();

  useEffect(() => {
    const unsub = watchListing(id, (data) => {
      setListing(data);
      if (data) {
        setTitle(data.title);
        setDescription(data.description);
        setDistrict(data.district);
        setCategory(data.category);
        setBasePrice(data.pricing.basePrice);
        setCurrency(data.pricing.currency);
        setCapacity(data.capacity);
        setAmenities(data.amenities);
      }
    });
    return () => unsub();
  }, [id]);

  if (listing === undefined) {
    return <div className="max-w-2xl mx-auto px-5 py-16 text-sm text-ink-muted">Loading...</div>;
  }
  if (listing === null) {
    return <div className="max-w-2xl mx-auto px-5 py-16 text-sm text-ink-muted">Listing not found.</div>;
  }
  if (listing.hostId !== user?.uid) {
    return <div className="max-w-2xl mx-auto px-5 py-16 text-sm text-ink-muted">You do not have access to this listing.</div>;
  }

  const isEditable = listing.status === "draft" || listing.status === "pending_review" || listing.status === "rejected";

  async function handleSave() {
    setSaving(true);
    try {
      await updateListingFields(listing!.id, {
        title,
        description,
        district,
        category,
        pricing: { basePrice, currency, cleaningFee: listing!.pricing.cleaningFee },
        capacity,
        amenities
      });
      toast.success("Saved.");
    } catch (err: any) {
      toast.error(err?.message || "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  function addAmenity() {
    const value = amenityInput.trim();
    if (value && !amenities.includes(value)) setAmenities((a) => [...a, value]);
    setAmenityInput("");
  }

  async function handleFiles(files: FileList | null) {
    if (!files || !user) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const image = await uploadListingImage(user.uid, listing!.id, file);
        await addListingImage(listing!.id, image, listing!.images.length === 0 && !listing!.coverImageUrl);
      }
    } catch (err: any) {
      toast.error(err?.message || "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSubmitForReview() {
    if (!title || !description || !district || !category || basePrice <= 0 || listing!.images.length === 0) {
      toast.error("Please provide a title, description, district, category, price, and at least 1 photo before submitting.");
      return;
    }
    await handleSave();
    await submitListingForReview(listing!.id);
    toast.success("Listing submitted for admin review.");
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this draft listing?")) return;
    await deleteDraftListing(listing!);
    toast.success("Listing deleted.");
    router.push("/marketplace/host/listings");
  }

  return (
    <div className="max-w-2xl mx-auto px-5 md:px-8 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-light tracking-tight text-ink">Edit Listing</h1>
        <StatusBadge listing={listing} />
      </div>

      {listing.status === "rejected" && listing.rejectedReason && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Rejection reason: {listing.rejectedReason}
        </div>
      )}
      {listing.status === "pending_review" && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Your listing is pending admin review. You can still update details before approval.
        </div>
      )}

      {/* Photos */}
      <div>
        <h2 className="text-sm font-semibold text-ink mb-3">Photos</h2>
        <div className="grid grid-cols-3 gap-3 mb-3">
          {listing.images.map((img) => (
            <div key={img.path} className="relative aspect-square rounded-xl overflow-hidden bg-sand-card group">
              <Image src={img.url} alt="" fill className="object-cover" sizes="200px" />
              {listing.coverImageUrl === img.url && (
                <span className="absolute top-1.5 left-1.5 bg-terracotta text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                  Cover
                </span>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                {listing.coverImageUrl !== img.url && (
                  <button
                    onClick={() => setCoverImage(listing!.id, img.url)}
                    title="Set as cover photo"
                    className="p-1.5 rounded-full bg-white/90 hover:bg-white"
                  >
                    <Star className="w-3.5 h-3.5 text-terracotta" />
                  </button>
                )}
                <button
                  onClick={() => removeListingImage(listing!, img)}
                  title="Remove"
                  className="p-1.5 rounded-full bg-white/90 hover:bg-white"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-xl border-2 border-dashed border-sand-border flex flex-col items-center justify-center gap-1 text-ink-muted hover:border-terracotta/50 transition disabled:opacity-60"
          >
            {uploading ? (
              <span className="text-xs">Uploading...</span>
            ) : (
              <>
                <ImageOff className="w-5 h-5" />
                <Plus className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Form fields */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-sand-border bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30"
            placeholder="e.g., Sunset Bosphorus Yacht Cruise with Local Sommelier"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="w-full rounded-xl border border-sand-border bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">District / Location</label>
            <input
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="e.g., Sultanahmet, Fatih"
              className="w-full rounded-xl border border-sand-border bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">Category</label>
            {listing.type === "stay" ? (
              <div className="w-full rounded-xl border border-sand-border bg-sand-card px-4 py-2.5 text-sm text-ink-muted">
                Stay
              </div>
            ) : (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-sand-border bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30"
              >
                <option value="">Select category</option>
                {categoryConfigs
                  .filter((c) => c.type === "experience" && (!c.hidden || c.key === category))
                  .map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
              </select>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">
              Price ({listing.type === "stay" ? "per night" : "per guest"})
            </label>
            <input
              type="number"
              min={0}
              value={basePrice}
              onChange={(e) => setBasePrice(Number(e.target.value))}
              className="w-full rounded-xl border border-sand-border bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full rounded-xl border border-sand-border bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">Capacity</label>
            <input
              type="number"
              min={1}
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              className="w-full rounded-xl border border-sand-border bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">Included Highlights &amp; Amenities</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {amenities.map((a) => (
              <span
                key={a}
                className="inline-flex items-center gap-1.5 bg-sand-card border border-sand-border rounded-full px-3 py-1 text-xs"
              >
                {a}
                <button onClick={() => setAmenities((arr) => arr.filter((x) => x !== a))}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={amenityInput}
              onChange={(e) => setAmenityInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addAmenity();
                }
              }}
              placeholder="e.g., Skip-the-Line Entry, Licensed Guide, Hotel Pickup — Press Enter"
              className="flex-1 rounded-xl border border-sand-border bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30"
            />
            <button
              onClick={addAmenity}
              className="rounded-xl border border-sand-border px-4 text-xs font-semibold text-ink hover:bg-sand-card"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2 border-t border-sand-border">
        <button
          onClick={handleSave}
          disabled={saving || !isEditable}
          className="rounded-full border border-sand-border px-5 py-2.5 text-xs font-semibold text-ink hover:bg-sand-card transition disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>

        {(listing.status === "draft" || listing.status === "rejected") && (
          <button
            onClick={handleSubmitForReview}
            className="rounded-full bg-terracotta text-white px-5 py-2.5 text-xs font-semibold hover:bg-terracotta/90 transition"
          >
            Submit for Review
          </button>
        )}

        {listing.status === "pending_review" && (
          <button
            onClick={() => withdrawListingToDraft(listing!.id)}
            className="rounded-full border border-sand-border px-5 py-2.5 text-xs font-semibold text-ink hover:bg-sand-card transition"
          >
            Withdraw to Draft
          </button>
        )}

        {listing.status === "approved" && (
          <button
            onClick={() => unpublishListing(listing!.id)}
            className="rounded-full border border-red-200 text-red-600 px-5 py-2.5 text-xs font-semibold hover:bg-red-50 transition"
          >
            Unpublish
          </button>
        )}

        {listing.status === "suspended" && (
          <button
            onClick={handleSubmitForReview}
            className="rounded-full bg-terracotta text-white px-5 py-2.5 text-xs font-semibold hover:bg-terracotta/90 transition"
          >
            Resubmit for Review
          </button>
        )}

        {listing.status === "draft" && (
          <button onClick={handleDelete} className="ml-auto text-xs font-semibold text-red-600 hover:underline">
            Delete Listing
          </button>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ listing }: { listing: MarketplaceListing }) {
  const map: Record<string, { label: string; className: string }> = {
    draft: { label: "Draft", className: "bg-zinc-100 text-zinc-700" },
    pending_review: { label: "Pending Review", className: "bg-amber-100 text-amber-800" },
    approved: { label: "Published", className: "bg-emerald-100 text-emerald-800" },
    rejected: { label: "Rejected", className: "bg-red-100 text-red-700" },
    suspended: { label: "Suspended", className: "bg-zinc-200 text-zinc-700" }
  };
  const s = map[listing.status];
  return <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${s.className}`}>{s.label}</span>;
}

export default function EditListingPage() {
  return (
    <HostGuard>
      <EditListingInner />
    </HostGuard>
  );
}
