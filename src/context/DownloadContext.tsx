import React, { createContext, useContext, useState, useRef } from "react";
import * as FileSystem from "expo-file-system/legacy";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
  getLocalVideoUri: (filmId: number) => string | undefined;
}

const DownloadContext = createContext<DownloadContextType | undefined>(undefined);

export const DownloadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [downloads, setDownloads] = useState<Record<number, ActiveDownload>>({});
  const [savedVideos, setSavedVideos] = useState<Record<number, string>>({});
  const resumablesRef = useRef<Record<number, FileSystem.DownloadResumable>>({});

  React.useEffect(() => {
    const loadSaved = async () => {
      try {
        const stored = await AsyncStorage.getItem("@guava_imported_videos");
        if (stored) {
          const list: { id: string; name: string; uri: string }[] = JSON.parse(stored);
          const map: Record<number, string> = {};
          list.forEach((item) => {
            const numId = Number(item.id);
            if (!isNaN(numId)) {
              map[numId] = item.uri;
            }
          });
          setSavedVideos(map);
        }
      } catch (e) {}
    };
    loadSaved();
  }, []);

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

      const sanitizeFilename = filmTitle.replace(/[^a-zA-Z0-9_-]/g, "_").replace(/_+/g, "_").trim();
      const fileUri = `${FileSystem.documentDirectory}${sanitizeFilename}.mp4`;
      const RESUME_KEY = `@guava_download_resume_${filmId}`;

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

      let downloadResumable = FileSystem.createDownloadResumable(
        vidzyUrl,
        fileUri,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Referer: vidzyUrl.startsWith("http") ? new URL(vidzyUrl).origin + "/" : "https://vidzy.org/",
          },
          sessionType: FileSystem.FileSystemSessionType.BACKGROUND,
        },
        callback
      );

      resumablesRef.current[filmId] = downloadResumable;

      const result = await downloadResumable.downloadAsync();

      delete resumablesRef.current[filmId];
      await AsyncStorage.removeItem(RESUME_KEY);

      const fileInfo = result?.uri ? await FileSystem.getInfoAsync(result.uri) : null;
      const isValidVideo = result && result.status === 200 && fileInfo?.exists && fileInfo.size && fileInfo.size > 50000;

      if (isValidVideo && result?.uri) {
        updateState(filmId, {
          status: "completed",
          progress: 100,
          message: "Téléchargement terminé !",
        });

        try {
          const STORAGE_KEY = "@guava_imported_videos";
          const existingStr = await AsyncStorage.getItem(STORAGE_KEY);
          const existing = existingStr ? JSON.parse(existingStr) : [];
          const updated = [
            {
              id: filmId.toString(),
              name: `${filmTitle}.mp4`,
              uri: result.uri,
            },
            ...existing.filter((item: any) => item.id !== filmId.toString() && item.uri !== result.uri),
          ];
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          setSavedVideos((prev) => ({ ...prev, [filmId]: result.uri }));
        } catch (e) {}
      } else {
        if (result?.uri) {
          try {
            await FileSystem.deleteAsync(result.uri, { idempotent: true });
          } catch (e) {}
        }
        updateState(filmId, {
          status: "error",
          progress: 0,
          message: "Échec du téléchargement (fichier invalide)",
        });
      }
    } catch (err: any) {
      const resumable = resumablesRef.current[filmId];
      if (resumable) {
        try {
          const snapshot = await resumable.pauseAsync();
          const RESUME_KEY = `@guava_download_resume_${filmId}`;
          await AsyncStorage.setItem(RESUME_KEY, JSON.stringify(snapshot));
        } catch (e) {}
        delete resumablesRef.current[filmId];
      }
      updateState(filmId, {
        status: "error",
        message: "Interrompu. Appuyez pour reprendre",
      });
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
    const RESUME_KEY = `@guava_download_resume_${filmId}`;
    await AsyncStorage.removeItem(RESUME_KEY);

    updateState(filmId, {
      status: "idle",
      progress: 0,
      message: "",
    });
  };

  const getDownloadState = (filmId: number): ActiveDownload => {
    const active = downloads[filmId];
    if (active) return active;
    if (savedVideos[filmId]) {
      return {
        filmId,
        filmTitle: "",
        status: "completed",
        progress: 100,
        message: "Téléchargement terminé !",
      };
    }
    return {
      filmId,
      filmTitle: "",
      status: "idle",
      progress: 0,
      message: "",
    };
  };

  const getLocalVideoUri = (filmId: number): string | undefined => {
    return savedVideos[filmId];
  };

  return (
    <DownloadContext.Provider
      value={{
        downloads,
        startDownload,
        cancelDownload,
        getDownloadState,
        getLocalVideoUri,
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
