"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

const LISTING_TYPES = ["VINYL", "CD", "CASSETTE", "MERCH", "EQUIPMENT"];
const CONDITIONS = ["BRAND_NEW", "LIKE_NEW", "LIGHTLY_USED", "WELL_USED", "HEAVILY_USED"];

const CONDITION_LABELS: Record<string, string> = {
  BRAND_NEW: "Brand New",
  LIKE_NEW: "Like New",
  LIGHTLY_USED: "Lightly Used",
  WELL_USED: "Well Used",
  HEAVILY_USED: "Heavily Used",
};

interface ImageUpload {
  file: File;
  preview: string;
  uploading: boolean;
  publicUrl?: string;
}

export default function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [images, setImages] = useState<ImageUpload[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    artist: "",
    description: "",
    type: "",
    condition: "",
    price: "",
    year: "",
    genre: "",
    label: "",
  });

  // Load existing listing data
  useEffect(() => {
    const loadListing = async () => {
      try {
        const res = await fetch(`/api/listings/${id}`);
        if (!res.ok) throw new Error("Failed to load listing");

        const data = await res.json() as { listing: {
          title: string;
          artist: string;
          description: string;
          type: string;
          condition: string;
          price: number;
          year: number | null;
          genre: string | null;
          label: string | null;
          images: string;
          sellerId: string;
        }};

        const listing = data.listing;

        // Check if user owns this listing
        if (session?.user?.id !== listing.sellerId) {
          router.push(`/listings/${id}`);
          return;
        }

        setFormData({
          title: listing.title,
          artist: listing.artist,
          description: listing.description,
          type: listing.type,
          condition: listing.condition,
          price: listing.price.toString(),
          year: listing.year?.toString() ?? "",
          genre: listing.genre ?? "",
          label: listing.label ?? "",
        });

        // Parse existing images
        try {
          const parsedImages = JSON.parse(listing.images) as string[];
          setExistingImages(parsedImages);
        } catch {
          setExistingImages([]);
        }

        setIsLoading(false);
      } catch (err) {
        console.error(err);
        setError("Failed to load listing");
        setIsLoading(false);
      }
    };

    if (session?.user?.id) {
      void loadListing();
    }
  }, [id, session, router]);

  // Redirect if not authenticated
  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/auth/signin");
    return null;
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);

    if (images.length + files.length > 5) {
      setError("Maximum 5 images allowed");
      return;
    }

    const newImages: ImageUpload[] = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      uploading: false,
    }));

    setImages([...images, ...newImages]);
    setError("");
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    URL.revokeObjectURL(newImages[index]!.preview);
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(existingImages.filter((_, i) => i !== index));
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage!);
    setImages(newImages);
  };

  const uploadImages = async (): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (let i = 0; i < images.length; i++) {
      const image = images[i]!;

      // Update uploading status
      setImages((prev) => {
        const newImages = [...prev];
        newImages[i] = { ...newImages[i]!, uploading: true };
        return newImages;
      });

      try {
        // Get presigned URL
        const presignedResponse = await fetch("/api/upload/presigned-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: image.file.name,
            fileType: image.file.type,
          }),
        });

        if (!presignedResponse.ok) {
          throw new Error("Failed to get upload URL");
        }

        const { presignedUrl, publicUrl } = await presignedResponse.json() as { presignedUrl: string; publicUrl: string };

        // Upload to S3
        const uploadResponse = await fetch(presignedUrl, {
          method: "PUT",
          body: image.file,
          headers: {
            "Content-Type": image.file.type,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload image");
        }

        uploadedUrls.push(publicUrl);

        // Update with public URL
        setImages((prev) => {
          const newImages = [...prev];
          newImages[i] = { ...newImages[i]!, uploading: false, publicUrl };
          return newImages;
        });
      } catch (err) {
        console.error("Upload error:", err);
        throw new Error(`Failed to upload image ${i + 1}`);
      }
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      // Validation
      if (!formData.title || !formData.artist || !formData.description || !formData.type || !formData.condition || !formData.price) {
        setError("Please fill in all required fields");
        setIsSubmitting(false);
        return;
      }

      if (images.length === 0 && existingImages.length === 0) {
        setError("Please add at least one image");
        setIsSubmitting(false);
        return;
      }

      // Upload new images if any
      let newImageUrls: string[] = [];
      if (images.length > 0) {
        newImageUrls = await uploadImages();
      }

      // Combine existing and new images
      const allImages = [...existingImages, ...newImageUrls];

      // Update listing
      const response = await fetch(`/api/listings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          year: formData.year ? parseInt(formData.year) : undefined,
          images: allImages,
        }),
      });

      const data = await response.json() as { error?: string; listing?: { id: string } };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to update listing");
      }

      // Redirect to listing detail page
      router.push(`/listings/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto max-w-3xl px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Edit Listing</CardTitle>
            <CardDescription>
              Update your listing details and images
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Image Upload */}
              <div className="space-y-2">
                <Label>
                  Images <span className="text-destructive">*</span>
                </Label>
                <div className="space-y-4">
                  {/* Existing Images */}
                  {existingImages.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Current Images</p>
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                        {existingImages.map((imageUrl, index) => (
                          <div
                            key={`existing-${index}`}
                            className="group relative aspect-square overflow-hidden rounded-lg border-2 border-border"
                          >
                            <Image
                              src={imageUrl}
                              alt={`Existing ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeExistingImage(index)}
                              className="absolute right-2 top-2 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* New Image Preview Grid */}
                  {images.length > 0 && (
                    <div>
                      {existingImages.length > 0 && <p className="text-sm text-muted-foreground mb-2">New Images to Upload</p>}
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                        {images.map((image, index) => (
                        <div
                          key={index}
                          className={`group relative aspect-square overflow-hidden rounded-lg border-2 ${
                            index === 0 ? "border-primary" : "border-border"
                          }`}
                        >
                          <Image
                            src={image.preview}
                            alt={`Upload ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                          {index === 0 && (
                            <div className="absolute left-2 top-2 rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
                              Main
                            </div>
                          )}
                          {image.uploading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                            </div>
                          )}
                          <div className="absolute inset-x-0 bottom-0 flex gap-1 bg-black/50 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                            {index > 0 && (
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={() => moveImage(index, index - 1)}
                                className="flex-1"
                              >
                                ←
                              </Button>
                            )}
                            {index < images.length - 1 && (
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={() => moveImage(index, index + 1)}
                                className="flex-1"
                              >
                                →
                              </Button>
                            )}
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              onClick={() => removeImage(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      </div>
                    </div>
                  )}

                  {/* Upload Button */}
                  {images.length < 5 && (
                    <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-8 transition-colors hover:border-primary">
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                      <div className="text-center">
                        <p className="font-medium">Click to upload images</p>
                        <p className="text-sm text-muted-foreground">
                          PNG, JPG, WebP up to 10MB (max 5 images)
                        </p>
                        {images.length > 0 && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            First image will be the main display image
                          </p>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        multiple
                        onChange={handleImageSelect}
                        className="hidden"
                        disabled={isSubmitting}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., Abbey Road"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  disabled={isSubmitting}
                  required
                />
              </div>

              {/* Artist */}
              <div className="space-y-2">
                <Label htmlFor="artist">
                  Artist <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="artist"
                  placeholder="e.g., The Beatles"
                  value={formData.artist}
                  onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                  disabled={isSubmitting}
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">
                  Description <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe the item condition, any notable features, etc."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={isSubmitting}
                  rows={4}
                  required
                />
              </div>

              {/* Type and Condition */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="type">
                    Type <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                    disabled={isSubmitting}
                    required
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {LISTING_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="condition">
                    Condition <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.condition}
                    onValueChange={(value) => setFormData({ ...formData, condition: value })}
                    disabled={isSubmitting}
                    required
                  >
                    <SelectTrigger id="condition">
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONDITIONS.map((condition) => (
                        <SelectItem key={condition} value={condition}>
                          {CONDITION_LABELS[condition]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Price and Year */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="price">
                    Price (USD) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    min="1900"
                    max={new Date().getFullYear()}
                    placeholder="e.g., 1969"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Genre and Label */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="genre">Genre</Label>
                  <Input
                    id="genre"
                    placeholder="e.g., Rock, Jazz, Pop"
                    value={formData.genre}
                    onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="label">Label</Label>
                  <Input
                    id="label"
                    placeholder="e.g., Apple Records"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? "Updating..." : "Update Listing"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* AI Verification Section */}
        <Card className="mt-6 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-xl">✨</span>
              AI Verification
            </CardTitle>
            <CardDescription>
              Boost buyer confidence with an AI-generated authenticity score
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Run our AI verification process to analyze your listing and provide an authenticity score.
              This helps buyers trust your listing and can increase your chances of selling.
            </p>
            <Button
              variant="default"
              onClick={() => router.push(`/listings/${id}/ai-verify`)}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              <span className="mr-2">✨</span>
              {isLoading ? "Loading..." : "Start AI Verification"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
