"use client";

import { useState, useRef } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

export function useFFmpeg() {
  const [loaded, setLoaded] = useState(false);
  const [converting, setConverting] = useState(false);
  const ffmpegRef = useRef(new FFmpeg());

  const load = async () => {
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
    const ffmpeg = ffmpegRef.current;
    
    // Bind progress
    ffmpeg.on("log", ({ message }) => {
      console.log(message);
    });

    try {
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
      });
      setLoaded(true);
      return true;
    } catch (error) {
      console.error("FFmpeg Load Error:", error);
      return false;
    }
  };

  const convertToWebM = async (file: File): Promise<File> => {
    if (!loaded) {
      const isLoaded = await load();
      if (!isLoaded) throw new Error("FFmpeg failed to load");
    }

    setConverting(true);
    const ffmpeg = ffmpegRef.current;
    const inputPath = "input" + file.name.substring(file.name.lastIndexOf("."));
    const outputPath = "output.webm";

    try {
      await ffmpeg.writeFile(inputPath, await fetchFile(file));

      // Execute conversion with "High Speed" optimizations:
      // -preset ultrafast: prioritize speed over compression
      // -vf scale=...: limit resolution to max 720p height for background video
      // -deadline realtime: fastest possible encoding for VP8
      await ffmpeg.exec([
        "-i", inputPath,
        "-c:v", "libvpx", 
        "-preset", "ultrafast",
        "-vf", "scale='min(1280,iw)':-2", // Scale to 1280 width max, keep aspect ratio (must be even height)
        "-crf", "32",
        "-b:v", "1500k", // Sufficient for background
        "-maxrate", "2500k",
        "-bufsize", "3000k",
        "-deadline", "realtime",
        "-an", // Remove audio for background video - makes it FASTER and smaller
        outputPath
      ]);

      const data = await ffmpeg.readFile(outputPath);
      const webmBlob = new Blob([data as any], { type: "video/webm" });
      
      // Cleanup
      await ffmpeg.deleteFile(inputPath);
      await ffmpeg.deleteFile(outputPath);

      return new File([webmBlob], file.name.replace(/\.[^/.]+$/, "") + ".webm", {
        type: "video/webm",
      });
    } catch (error) {
      console.error("FFmpeg Conversion Error:", error);
      throw error;
    } finally {
      setConverting(false);
    }
  };

  return {
    loaded,
    converting,
    load,
    convertToWebM,
  };
}
