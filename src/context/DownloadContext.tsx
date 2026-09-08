import React, { createContext, useContext, useState, useRef } from "react";
import * as FileSystem from "expo-file-system/legacy";
import { GetVidzyLink } from "@/services/fs";

export type DownloadStatus = "idle" | "initialization" | "downloading" | "completed" | "error";

export interface ActiveDownload {
  filmId: number;
  filmTitle: string;
  status: DownloadStatus;
  progress: number;
  message: string;
  resumable?: FileSystem.DownloadResumable;
}

interface DownloadContextType {
  downloads: Record<number, ActiveDownload>;
  startDownload: (filmId: number, filmTitle: string) => Promise<void>;
  cancelDownload: (filmId: number) => Promise<void>;
  getDownloadState: (filmId: number) => ActiveDownload;
}

const DownloadContext = createContext<DownloadContextType | undefined>(undefined);

export const DownloadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [downloads, setDownloads] = useState<Record<number, ActiveDownload>>({});
  const resumablesRef = useRef<Record<number, FileSystem.DownloadResumable>>({});

  const updateState = (filmId: number, patch: Partial<ActiveDownload>) => {
    setDownloads((prev) => ({
      ...prev,
      [filmId]: {
        ...(prev[filmId] || {
          filmId,
          filmTitle: "",
          status: "idle",
          progress: 0,
          message: "",
        }),
        ...patch,
      },
    }));
  };

  const startDownload = async (filmId: number, filmTitle: string) => {
    const current = downloads[filmId];
    if (current && (current.status === "initialization" || current.status === "downloading")) {
      return;
    }

    updateState(filmId, {
      filmId,
      filmTitle,
      status: "initialization",
      progress: 0,
      message: "Initialisation...",
    });

    try {
      const vidzyUrl = await GetVidzyLink(filmTitle, (status, msg) => {
        updateState(filmId, { status, message: msg || "" });
      });

      if (!vidzyUrl) {
        updateState(filmId, { status: "error", progress: 0, message: "Lien non disponible" });
        return;
      }

      updateState(filmId, { status: "downloading", progress: 0, message: "Début du téléchargement..." });

      const sanitizeFilename = filmTitle.replace(/[^a-zA-Z0-9 àâäéèêëîïôöùûüçÀÂÄÉÈÊËÎÏÔÖÙÛÜÇ._-]/g, "_").trim();
      const fileUri = `${FileSystem.documentDirectory}${sanitizeFilename}.mp4`;

      let startTime = Date.now();
      let lastTime = Date.now();
      let lastWritten = 0;
      let smoothedSpeed = 0;
      let lastFormattedTime = "";

      const callback = (downloadProgress: FileSystem.DownloadProgressData) => {
        const written = downloadProgress.totalBytesWritten;
        const total = downloadProgress.totalBytesExpectedToWrite;
        const progressPercent = Math.round((written / total) * 100);
        const validPercent = isNaN(progressPercent) || progressPercent < 0 ? 0 : Math.min(progressPercent, 100);

        const now = Date.now();
        const timeDiff = (now - lastTime) / 1000;

        if (timeDiff >= 1.5 && written > lastWritten && total > 0) {
          const bytesDiff = written - lastWritten;
          const currentSpeed = bytesDiff / timeDiff;

          smoothedSpeed = smoothedSpeed === 0 ? currentSpeed : smoothedSpeed * 0.75 + currentSpeed * 0.25;

          lastTime = now;
          lastWritten = written;

          if (smoothedSpeed > 0) {
            const remainingBytes = total - written;
            const remainingSeconds = Math.round(remainingBytes / smoothedSpeed);

            const hours = Math.floor(remainingSeconds / 3600);
            const minutes = Math.floor((remainingSeconds % 3600) / 60);
            const seconds = remainingSeconds % 60;

            if (hours > 0) {
              lastFormattedTime = `${hours}h ${minutes}m restantes`;
            } else if (minutes > 0) {
              lastFormattedTime = `${minutes}m ${seconds}s restantes`;
            } else {
              lastFormattedTime = `${seconds}s restantes`;
            }
          }
        }

        updateState(filmId, {
          status: "downloading",
          progress: validPercent,
          message: lastFormattedTime || `${validPercent}%`,
        });
      };

      const downloadResumable = FileSystem.createDownloadResumable(
        vidzyUrl,
        fileUri,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Referer: "https://vidzy.cc/",
          },
          sessionType: FileSystem.FileSystemSessionType.BACKGROUND,
        },
        callback
      );

      resumablesRef.current[filmId] = downloadResumable;

      const result = await downloadResumable.downloadAsync();
      delete resumablesRef.current[filmId];

      if (result && result.uri && result.status === 200) {
        updateState(filmId, {
          status: "completed",
          progress: 100,
          message: "Téléchargement terminé !",
        });
      } else {
        updateState(filmId, {
          status: "error",
          progress: 0,
          message: "Échec du téléchargement",
        });
      }
    } catch (err: any) {
      if (resumablesRef.current[filmId]) {
        delete resumablesRef.current[filmId];
      }
    }
  };

  const cancelDownload = async (filmId: number) => {
    const resumable = resumablesRef.current[filmId];
    if (resumable) {
      try {
        await resumable.cancelAsync();
      } catch (e) {}
      delete resumablesRef.current[filmId];
    }

    updateState(filmId, {
      status: "idle",
      progress: 0,
      message: "",
    });
  };

  const getDownloadState = (filmId: number): ActiveDownload => {
    return (
      downloads[filmId] || {
        filmId,
        filmTitle: "",
        status: "idle",
        progress: 0,
        message: "",
      }
    );
  };

  return (
    <DownloadContext.Provider
      value={{
        downloads,
        startDownload,
        cancelDownload,
        getDownloadState,
      }}
    >
      {children}
    </DownloadContext.Provider>
  );
};

export const useDownloads = () => {
  const context = useContext(DownloadContext);
  if (!context) {
    throw new Error("useDownloads context missing");
  }
  return context;
};
