/**
 * Extracts evenly-spaced frames from a video file using the browser's
 * <video> + <canvas> APIs. Returns base64 JPEG data URLs.
 */
export async function extractVideoFrames(
  file: File,
  frameCount = 5,
): Promise<string[]> {
  const url = URL.createObjectURL(file);

  try {
    const video = document.createElement("video");
    video.src = url;
    video.muted = true;
    video.preload = "auto";

    // Wait for metadata so we know the duration and dimensions
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("Failed to load video"));
    });

    const { duration, videoWidth, videoHeight } = video;
    if (!duration || !videoWidth || !videoHeight) {
      throw new Error("Invalid video file");
    }

    // Cap frame dimensions to 512px on the longest side (keeps base64 small)
    const scale = Math.min(1, 512 / Math.max(videoWidth, videoHeight));
    const width = Math.round(videoWidth * scale);
    const height = Math.round(videoHeight * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;

    const frames: string[] = [];

    for (let i = 0; i < frameCount; i++) {
      // Seek to evenly spaced points (skip the very start/end)
      const time = (duration * (i + 0.5)) / frameCount;
      video.currentTime = time;

      await new Promise<void>((resolve) => {
        video.onseeked = () => resolve();
      });

      ctx.drawImage(video, 0, 0, width, height);
      frames.push(canvas.toDataURL("image/jpeg", 0.7));
    }

    return frames;
  } finally {
    URL.revokeObjectURL(url);
  }
}
