/**
 * Genera un thumbnail JPEG (Blob) capturando un frame del video en el navegador.
 * Funciona solo en cliente. Apunta a 720x1280 (9:16) por defecto.
 */
export async function generateVideoThumbnail(
  file: File,
  options: {
    seekSeconds?: number;
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  } = {}
): Promise<Blob> {
  const {
    seekSeconds = 1,
    maxWidth = 720,
    maxHeight = 1280,
    quality = 0.82,
  } = options;

  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";
    video.src = URL.createObjectURL(file);

    const cleanup = () => {
      URL.revokeObjectURL(video.src);
      video.remove();
    };

    video.addEventListener(
      "loadedmetadata",
      () => {
        const target = Math.min(seekSeconds, Math.max(0, video.duration - 0.1));
        video.currentTime = target;
      },
      { once: true }
    );

    video.addEventListener(
      "seeked",
      () => {
        try {
          const ratio = Math.min(
            maxWidth / video.videoWidth,
            maxHeight / video.videoHeight,
            1
          );
          const w = Math.round(video.videoWidth * ratio);
          const h = Math.round(video.videoHeight * ratio);

          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            cleanup();
            reject(new Error("Canvas 2D no disponible"));
            return;
          }
          ctx.drawImage(video, 0, 0, w, h);
          canvas.toBlob(
            (blob) => {
              cleanup();
              if (!blob) {
                reject(new Error("No se pudo generar thumbnail"));
                return;
              }
              resolve(blob);
            },
            "image/jpeg",
            quality
          );
        } catch (err) {
          cleanup();
          reject(err);
        }
      },
      { once: true }
    );

    video.addEventListener(
      "error",
      () => {
        cleanup();
        reject(new Error("Error cargando el video para thumbnail"));
      },
      { once: true }
    );
  });
}
