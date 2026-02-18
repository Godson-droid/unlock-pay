import { useState, useRef, useCallback } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL, fetchFile } from "@ffmpeg/util";

interface CompressionState {
  isCompressing: boolean;
  progress: number;
  originalSize: number;
  compressedSize: number;
}

export function useVideoCompression() {
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [state, setState] = useState<CompressionState>({
    isCompressing: false,
    progress: 0,
    originalSize: 0,
    compressedSize: 0,
  });

  const loadFFmpeg = useCallback(async () => {
    if (ffmpegRef.current && loaded) return;

    const ffmpeg = new FFmpeg();
    ffmpegRef.current = ffmpeg;

    ffmpeg.on("progress", ({ progress }) => {
      setState((prev) => ({
        ...prev,
        progress: Math.round(progress * 100),
      }));
    });

    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";

    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    });

    setLoaded(true);
  }, [loaded]);

  const compressVideo = useCallback(
    async (file: File): Promise<File> => {
      setState({
        isCompressing: true,
        progress: 0,
        originalSize: file.size,
        compressedSize: 0,
      });

      try {
        await loadFFmpeg();
        const ffmpeg = ffmpegRef.current!;

        const inputName = "input" + getExtension(file.name);
        const outputName = "output.mp4";

        await ffmpeg.writeFile(inputName, await fetchFile(file));

        // Compress with CRF 28 (good balance of quality/size), scale down if over 1080p
        await ffmpeg.exec([
          "-i", inputName,
          "-vf", "scale='min(1920,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease",
          "-c:v", "libx264",
          "-crf", "28",
          "-preset", "fast",
          "-c:a", "aac",
          "-b:a", "128k",
          "-movflags", "+faststart",
          outputName,
        ]);

        const data = await ffmpeg.readFile(outputName);
        const uint8 = data as Uint8Array;
        const compressedBlob = new Blob([new Uint8Array(uint8)], { type: "video/mp4" });

        // Clean up
        await ffmpeg.deleteFile(inputName);
        await ffmpeg.deleteFile(outputName);

        const compressedFile = new File(
          [compressedBlob],
          file.name.replace(/\.[^.]+$/, ".mp4"),
          { type: "video/mp4" }
        );

        setState((prev) => ({
          ...prev,
          isCompressing: false,
          compressedSize: compressedFile.size,
        }));

        return compressedFile;
      } catch (error) {
        setState((prev) => ({ ...prev, isCompressing: false }));
        throw error;
      }
    },
    [loadFFmpeg]
  );

  return { compressVideo, ...state };
}

function getExtension(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  return ext ? `.${ext}` : ".mp4";
}
