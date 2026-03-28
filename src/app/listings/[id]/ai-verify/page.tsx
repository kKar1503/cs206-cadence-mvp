"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Camera,
  Video,
  FileCheck,
  CheckCircle2,
  Upload,
  X,
  ArrowRight,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Disc3,
} from "lucide-react";
import { extractVideoFrames } from "@/lib/extract-video-frames";
import { getScoringLabels } from "@/lib/scoring-labels";

type Step = 1 | 2 | 3 | 3.5 | 4;

interface Listing {
  id: string;
  title: string;
  artist: string;
  sellerId: string;
  images: string;
  year?: number | null;
  label?: string | null;
  condition: string;
  type: string;
}

interface VerificationScores {
  authenticityScore: number;
  labelMatchScore: number;
  matrixNumberScore: number;
  typographyScore: number;
  serialRangeScore: number;
  authenticityNotes: string;
  conditionScore: number;
  vinylSurfaceScore: number;
  sleeveScore: number;
  labelConditionScore: number;
  edgesScore: number;
  conditionNotes: string;
}

export default function AIVerifyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();

  const [listing, setListing] = useState<Listing | null>(null);
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Step 1: Additional Photos
  const [additionalPhotos, setAdditionalPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  // Step 2: Video
  const [video, setVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

  // Step 3: Certifications
  const [certifications, setCertifications] = useState<File[]>([]);
  const [certificationPreviews, setCertificationPreviews] = useState<string[]>([]);

  // Step 4: Results
  const [aiScore, setAiScore] = useState<number | null>(null);
  const [scores, setScores] = useState<VerificationScores | null>(null);

  // Processing state
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingMessage, setProcessingMessage] = useState("");

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const res = await fetch(`/api/listings/${id}`);
        if (!res.ok) {
          router.push("/listings");
          return;
        }
        const data = (await res.json()) as { listing: Listing };
        setListing(data.listing);

        // Check ownership
        if (session?.user?.id && data.listing.sellerId !== session.user.id) {
          router.push(`/listings/${id}`);
          return;
        }

        setIsLoading(false);
      } catch (err) {
        console.error("Failed to fetch listing:", err);
        router.push("/listings");
      }
    };

    if (session?.user?.id) {
      void fetchListing();
    }
  }, [id, session, router]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setAdditionalPhotos((prev) => [...prev, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setAdditionalPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideo(file);
      const url = URL.createObjectURL(file);
      setVideoPreview(url);
    }
  };

  const removeVideo = () => {
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    setVideo(null);
    setVideoPreview(null);
  };

  const handleCertificationUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setCertifications((prev) => [...prev, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCertificationPreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeCertification = (index: number) => {
    setCertifications((prev) => prev.filter((_, i) => i !== index));
    setCertificationPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const compressImage = (dataUrl: string, maxSize = 1024): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.src = dataUrl;
    });
  };

  const handleNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as Step);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
    }
  };

  const handleSkipStep = () => {
    handleNextStep();
  };

  const handleFinishVerification = async () => {
    setIsProcessing(true);
    setCurrentStep(3.5 as Step);

    try {
      // Step 1: Prepare images
      setProcessingMessage("Preparing images...");
      setProcessingProgress(5);

      // Compress additional photos
      const compressedPhotos = await Promise.all(
        photoPreviews.map((p) => compressImage(p)),
      );

      // Step 2: Extract video frames if video exists
      let videoFrameData: string[] = [];
      if (video) {
        setProcessingMessage("Extracting video frames...");
        setProcessingProgress(15);
        try {
          videoFrameData = await extractVideoFrames(video, 5);
        } catch (err) {
          console.warn("Video frame extraction failed, continuing without:", err);
        }
      }

      // Compress certifications
      const compressedCerts = await Promise.all(
        certificationPreviews.map((c) => compressImage(c)),
      );

      // Get listing's existing image URLs
      let listingImageUrls: string[] = [];
      try {
        listingImageUrls = JSON.parse(listing!.images) as string[];
      } catch {
        // images field might be empty or malformed
      }

      setProcessingMessage("Analyzing authenticity...");
      setProcessingProgress(30);

      // Step 3: Call the real AI verification API
      const res = await fetch(`/api/listings/${id}/ai-verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingImageUrls,
          photos: compressedPhotos,
          videoFrames: videoFrameData,
          certificates: compressedCerts,
          listing: {
            title: listing!.title,
            artist: listing!.artist,
            year: listing!.year,
            label: listing!.label,
            condition: listing!.condition,
            type: listing!.type,
          },
        }),
      });

      // Animate progress while waiting
      setProcessingMessage("Assessing condition...");
      setProcessingProgress(60);

      if (!res.ok) {
        const errorData = await res.json() as { error: string };
        throw new Error(errorData.error || "Verification failed");
      }

      setProcessingMessage("Compiling results...");
      setProcessingProgress(90);

      const data = await res.json() as {
        authenticity: VerificationScores;
        condition: VerificationScores;
      };

      // Merge authenticity + condition into one scores object
      const allScores: VerificationScores = {
        ...data.authenticity,
        ...data.condition,
      };

      setProcessingProgress(100);
      setAiScore(allScores.authenticityScore);
      setScores(allScores);

      await new Promise((resolve) => setTimeout(resolve, 500));
      setCurrentStep(4);
    } catch (err) {
      console.error("AI verification failed:", err);
      // Go back to step 3 so user can retry
      setCurrentStep(3);
      alert(err instanceof Error ? err.message : "Verification failed. Please try again.");
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
      setProcessingMessage("");
    }
  };

  const getStepProgress = () => {
    return ((currentStep - 1) / 3) * 100;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!listing) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">AI Verification</h1>
          </div>
          <p className="text-muted-foreground">
            Verifying: <span className="font-medium">{listing.title}</span> by {listing.artist}
          </p>
        </div>

        {/* Progress Bar */}
        {currentStep < 4 && currentStep !== 3.5 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Step {currentStep} of 3</span>
              <span className="text-sm text-muted-foreground">{Math.round(getStepProgress())}% Complete</span>
            </div>
            <Progress value={getStepProgress()} className="h-2" />
          </div>
        )}

        {/* Step Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              {currentStep === 1 && <Camera className="h-6 w-6 text-primary" />}
              {currentStep === 2 && <Video className="h-6 w-6 text-primary" />}
              {currentStep === 3 && <FileCheck className="h-6 w-6 text-primary" />}
              {currentStep === 3.5 && <Sparkles className="h-6 w-6 text-primary" />}
              {currentStep === 4 && <CheckCircle2 className="h-6 w-6 text-green-600" />}
              <div>
                <CardTitle>
                  {currentStep === 1 && "Additional Photos"}
                  {currentStep === 2 && "360° Video View"}
                  {currentStep === 3 && "Authenticity Certifications"}
                  {currentStep === 3.5 && "AI Verification in Progress"}
                  {currentStep === 4 && "Verification Complete!"}
                </CardTitle>
                <CardDescription>
                  {currentStep === 1 && "Upload more photos to increase your authenticity score"}
                  {currentStep === 2 && "Provide a video showing all angles of your item"}
                  {currentStep === 3 && "Upload any certificates or proof of authenticity"}
                  {currentStep === 3.5 && "Analyzing your materials with AI"}
                  {currentStep === 4 && "Your listing has been AI-verified"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Step 1: Additional Photos */}
            {currentStep === 1 && (
              <>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    More photos = higher authenticity score. Show different angles, close-ups of details, labels, etc.
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    {photoPreviews.map((preview, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden border-2 border-border">
                        <Image src={preview} alt={`Additional photo ${index + 1}`} fill className="object-cover" />
                        <button
                          onClick={() => removePhoto(index)}
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}

                    <label className="aspect-square border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors">
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-xs text-muted-foreground">Add Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-3 text-sm">
                    <p className="font-medium mb-1">Photos uploaded: {additionalPhotos.length}</p>
                    <p className="text-muted-foreground text-xs">
                      More photos help improve authenticity verification
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={handleSkipStep}>
                    Skip
                  </Button>
                  <Button className="flex-1 gap-2" onClick={handleNextStep}>
                    Next Step
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}

            {/* Step 2: Video */}
            {currentStep === 2 && (
              <>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Upload a video showing a 360° view of your item. Rotate it slowly to show all angles, front, back, sides, top, and bottom.
                  </div>

                  {videoPreview ? (
                    <div className="relative aspect-video rounded-lg overflow-hidden border-2 border-border">
                      <video src={videoPreview} controls className="w-full h-full">
                        Your browser does not support the video tag.
                      </video>
                      <button
                        onClick={removeVideo}
                        className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-2 hover:bg-destructive/90"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="aspect-video border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors">
                      <Video className="h-12 w-12 text-muted-foreground mb-2" />
                      <span className="text-sm font-medium mb-1">Upload 360° Video</span>
                      <span className="text-xs text-muted-foreground">MP4, MOV, or AVI</span>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleVideoUpload}
                        className="hidden"
                      />
                    </label>
                  )}

                  <div className="bg-muted/50 rounded-lg p-3 text-sm">
                    <p className="font-medium mb-1">Video uploaded: {video ? "Yes" : "No"}</p>
                    <p className="text-muted-foreground text-xs">
                      A 360° video significantly improves verification accuracy
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="ghost" onClick={handlePreviousStep}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={handleSkipStep}>
                    Skip
                  </Button>
                  <Button className="flex-1 gap-2" onClick={handleNextStep}>
                    Next Step
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}

            {/* Step 3: Certifications */}
            {currentStep === 3 && (
              <>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Upload any certificates of authenticity, receipts, appraisals, or other documents that verify your item&apos;s authenticity.
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {certificationPreviews.map((preview, index) => (
                      <div key={index} className="relative aspect-[3/4] rounded-lg overflow-hidden border-2 border-border">
                        <Image src={preview} alt={`Certification ${index + 1}`} fill className="object-cover" />
                        <button
                          onClick={() => removeCertification(index)}
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}

                    <label className="aspect-[3/4] border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors">
                      <FileCheck className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-xs text-muted-foreground text-center px-2">Add Certificate</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        multiple
                        onChange={handleCertificationUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-3 text-sm">
                    <p className="font-medium mb-1">Certifications uploaded: {certifications.length}</p>
                    <p className="text-muted-foreground text-xs">
                      Official documentation greatly enhances authenticity verification
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="ghost" onClick={handlePreviousStep}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={handleSkipStep}>
                    Skip
                  </Button>
                  <Button
                    className="flex-1 gap-2"
                    onClick={handleFinishVerification}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Calculate Score
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}

            {/* Processing Screen */}
            {currentStep === 3.5 && (
              <>
                <div className="text-center space-y-6 py-12">
                  <div className="mx-auto mb-6">
                    <Sparkles className="h-16 w-16 text-primary mx-auto mb-4 animate-pulse" />
                    <h3 className="text-2xl font-bold mb-2">Processing Verification</h3>
                    <p className="text-muted-foreground">
                      Our AI is analyzing your materials...
                    </p>
                  </div>

                  <div className="max-w-md mx-auto space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{processingMessage}</span>
                        <span className="text-muted-foreground">{Math.round(processingProgress)}%</span>
                      </div>
                      <Progress value={processingProgress} className="h-3" />
                    </div>

                    <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                      <p className="text-center">
                        Please wait while we verify your listing materials using advanced AI algorithms
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Step 4: Results */}
            {currentStep === 4 && aiScore !== null && (
              <>
                <div className="space-y-6 py-8">
                  {/* Overall Score */}
                  <div className="text-center">
                    <div className="mx-auto w-32 h-32 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
                      <div className="text-4xl font-bold text-primary-foreground">
                        {Math.round(aiScore)}%
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold mt-4 mb-2">Authenticity Score</h3>
                    <p className="text-muted-foreground">
                      {aiScore >= 90 && "Outstanding! Your item has an exceptional authenticity score."}
                      {aiScore >= 80 && aiScore < 90 && "Excellent! Your item has a high authenticity score."}
                      {aiScore >= 60 && aiScore < 80 && "Good! Your item has a solid authenticity score."}
                      {aiScore >= 40 && aiScore < 60 && "Fair. Consider adding more verification materials."}
                      {aiScore < 40 && "Low score. We recommend adding more photos, video, and certifications."}
                    </p>
                  </div>

                  {/* Authenticity Breakdown */}
                  {scores && (
                    <div className="space-y-4">
                      <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                          <ShieldCheck className="h-4 w-4 text-primary" />
                          <span className="font-semibold text-sm">Authenticity Breakdown</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {(() => {
                            const l = getScoringLabels(listing?.type ?? "VINYL");
                            return [
                              { label: l.authenticity.labelMatch, value: scores.labelMatchScore },
                              { label: l.authenticity.matrixNumber, value: scores.matrixNumberScore },
                              { label: l.authenticity.typography, value: scores.typographyScore },
                              { label: l.authenticity.serialRange, value: scores.serialRangeScore },
                            ];
                          })().map(({ label, value }) => (
                            <div key={label} className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">{label}</span>
                              <span className="font-medium">{Math.round(value)}%</span>
                            </div>
                          ))}
                        </div>
                        {scores.authenticityNotes && (
                          <p className="text-xs text-muted-foreground mt-2 italic">
                            {scores.authenticityNotes}
                          </p>
                        )}
                      </div>

                      {/* Condition Breakdown */}
                      <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Disc3 className="h-4 w-4 text-primary" />
                          <span className="font-semibold text-sm">Condition Breakdown</span>
                          <span className="ml-auto font-medium text-sm">{Math.round(scores.conditionScore)}%</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {(() => {
                            const l = getScoringLabels(listing?.type ?? "VINYL");
                            return [
                              { label: l.condition.surface, value: scores.vinylSurfaceScore },
                              { label: l.condition.sleeve, value: scores.sleeveScore },
                              { label: l.condition.label, value: scores.labelConditionScore },
                              { label: l.condition.edges, value: scores.edgesScore },
                            ];
                          })().map(({ label, value }) => (
                            <div key={label} className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">{label}</span>
                              <span className="font-medium">{Math.round(value)}%</span>
                            </div>
                          ))}
                        </div>
                        {scores.conditionNotes && (
                          <p className="text-xs text-muted-foreground mt-2 italic">
                            {scores.conditionNotes}
                          </p>
                        )}
                      </div>

                      {/* Materials Summary */}
                      <div className="bg-muted/50 rounded-lg p-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-primary">{additionalPhotos.length}</div>
                            <div className="text-xs text-muted-foreground">Photos</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-primary">{video ? "✓" : "—"}</div>
                            <div className="text-xs text-muted-foreground">Video</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-primary">{certifications.length}</div>
                            <div className="text-xs text-muted-foreground">Certificates</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="text-center">
                    <Badge variant={aiScore >= 80 ? "default" : "secondary"} className="text-lg px-4 py-2">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      AI Verified
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={() => router.push(`/listings/${id}`)}
                  >
                    View Listing
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setCurrentStep(1);
                      setAdditionalPhotos([]);
                      setPhotoPreviews([]);
                      setVideo(null);
                      setVideoPreview(null);
                      setCertifications([]);
                      setCertificationPreviews([]);
                      setAiScore(null);
                      setScores(null);
                    }}
                  >
                    Run Verification Again
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Help Text */}
        {currentStep < 4 && (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Images are sent to our AI for analysis and are not permanently stored.</p>
            <p>Verification is powered by advanced computer vision technology.</p>
          </div>
        )}
      </div>
    </div>
  );
}
