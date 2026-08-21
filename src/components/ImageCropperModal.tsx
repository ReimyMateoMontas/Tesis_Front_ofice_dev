import { useEffect, useRef, useState } from "react";
import {
  IconArrowsMove,
  IconCrop,
  IconPhotoOff,
  IconX,
  IconZoomIn,
  IconZoomOut,
} from "@tabler/icons-react";

const OUTPUT_WIDTH = 1280;
const OUTPUT_HEIGHT = 560;

interface Props {
  imageSrc: string;
  onCancel: () => void;
  onConfirm: (croppedImage: string) => void;
}

interface Size {
  width: number;
  height: number;
}

interface Point {
  x: number;
  y: number;
}

export function ImageCropperModal({
  imageSrc,
  onCancel,
  onConfirm,
}: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<
    | {
        pointerId: number;
        pointerX: number;
        pointerY: number;
        imageX: number;
        imageY: number;
      }
    | undefined
  >(undefined);

  const [imageSize, setImageSize] = useState<Size>({ width: 0, height: 0 });
  const [viewportSize, setViewportSize] = useState<Size>({
    width: 0,
    height: 0,
  });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const image = new Image();
    if (!imageSrc.startsWith("data:") && !imageSrc.startsWith("blob:")) {
      image.crossOrigin = "anonymous";
    }
    image.onload = () => {
      imageRef.current = image;
      setImageSize({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      imageRef.current = null;
      setError("No se pudo cargar la imagen para ajustarla.");
    };
    image.src = imageSrc;

    return () => {
      image.onload = null;
      image.onerror = null;
    };
  }, [imageSrc]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const updateSize = () =>
      setViewportSize({
        width: viewport.clientWidth,
        height: viewport.clientHeight,
      });

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  const baseScale =
    imageSize.width && imageSize.height && viewportSize.width
      ? Math.max(
          viewportSize.width / imageSize.width,
          viewportSize.height / imageSize.height,
        )
      : 0;
  const containScale =
    imageSize.width && imageSize.height && viewportSize.width
      ? Math.min(
          viewportSize.width / imageSize.width,
          viewportSize.height / imageSize.height,
        )
      : 0;
  const minZoom = baseScale
    ? Math.max(0.1, Math.min(1, (containScale / baseScale) * 0.9))
    : 0.1;
  const renderedScale = baseScale * zoom;
  const renderedWidth = imageSize.width * renderedScale;
  const renderedHeight = imageSize.height * renderedScale;
  const maxOffsetX = Math.max(0, (renderedWidth - viewportSize.width) / 2);
  const maxOffsetY = Math.max(0, (renderedHeight - viewportSize.height) / 2);
  const isImageReady = imageSize.width > 0 && imageSize.height > 0 && !error;

  const clampOffset = (point: Point): Point => ({
    x: Math.min(maxOffsetX, Math.max(-maxOffsetX, point.x)),
    y: Math.min(maxOffsetY, Math.max(-maxOffsetY, point.y)),
  });
  const visibleOffset = clampOffset(offset);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isImageReady) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      pointerX: event.clientX,
      pointerY: event.clientY,
      imageX: visibleOffset.x,
      imageY: visibleOffset.y,
    };
    setIsDragging(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    setOffset(
      clampOffset({
        x: drag.imageX + event.clientX - drag.pointerX,
        y: drag.imageY + event.clientY - drag.pointerY,
      }),
    );
  };

  const stopDragging = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = undefined;
    setIsDragging(false);
  };

  const handleConfirm = () => {
    const image = imageRef.current;
    if (!image || !renderedScale || !viewportSize.width) return;

    try {
      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_WIDTH;
      canvas.height = OUTPUT_HEIGHT;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas no disponible");

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";

      // Fondo de relleno: mantiene la tarjeta completamente cubierta cuando
      // el usuario aleja la foto principal para mostrar al animal completo.
      const backgroundScale =
        Math.max(OUTPUT_WIDTH / imageSize.width, OUTPUT_HEIGHT / imageSize.height) *
        1.12;
      const backgroundWidth = imageSize.width * backgroundScale;
      const backgroundHeight = imageSize.height * backgroundScale;
      context.save();
      context.filter = "blur(28px)";
      context.globalAlpha = 0.72;
      context.drawImage(
        image,
        (OUTPUT_WIDTH - backgroundWidth) / 2,
        (OUTPUT_HEIGHT - backgroundHeight) / 2,
        backgroundWidth,
        backgroundHeight,
      );
      context.restore();
      context.fillStyle = "rgba(0, 0, 0, 0.12)";
      context.fillRect(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);

      const outputScale = OUTPUT_WIDTH / viewportSize.width;
      const outputImageWidth = renderedWidth * outputScale;
      const outputImageHeight = renderedHeight * outputScale;
      const outputImageX =
        (viewportSize.width / 2 + visibleOffset.x - renderedWidth / 2) *
        outputScale;
      const outputImageY =
        (viewportSize.height / 2 + visibleOffset.y - renderedHeight / 2) *
        outputScale;

      context.drawImage(
        image,
        outputImageX,
        outputImageY,
        outputImageWidth,
        outputImageHeight,
      );
      onConfirm(canvas.toDataURL("image/jpeg", 0.88));
    } catch {
      setError(
        "Esta dirección no permite editar la imagen. Descárgala y súbela desde tu dispositivo.",
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cropper-title"
    >
      <div className="absolute inset-0 bg-gray-950/75" />
      <div className="relative max-h-[95vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 sm:px-6 sm:py-4">
          <div>
            <h2
              id="cropper-title"
              className="text-base font-semibold text-gray-900"
            >
              Ajustar fotografía
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Arrastra la foto y usa el control para acercar o alejar.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cerrar ajuste de fotografía"
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <IconX size={21} stroke={1.8} />
          </button>
        </div>

        <div className="bg-gray-100 p-3 sm:p-6">
          <div
            ref={viewportRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={stopDragging}
            onPointerCancel={stopDragging}
            className={`relative mx-auto aspect-[16/7] w-full touch-none overflow-hidden rounded-xl bg-gray-900 select-none ${
              isImageReady
                ? isDragging
                  ? "cursor-grabbing"
                  : "cursor-grab"
                : "cursor-default"
            }`}
          >
            {isImageReady && (
              <>
                <img
                  src={imageSrc}
                  alt=""
                  aria-hidden="true"
                  draggable={false}
                  className="pointer-events-none absolute inset-[-8%] h-[116%] w-[116%] object-cover blur-2xl opacity-75"
                />
                <div className="pointer-events-none absolute inset-0 bg-black/10" />
              </>
            )}

            {isImageReady && renderedScale > 0 && (
              <img
                src={imageSrc}
                alt="Fotografía para ajustar"
                draggable={false}
                className="pointer-events-none absolute max-w-none"
                style={{
                  width: renderedWidth,
                  height: renderedHeight,
                  left: `calc(50% + ${visibleOffset.x}px)`,
                  top: `calc(50% + ${visibleOffset.y}px)`,
                  transform: "translate(-50%, -50%)",
                }}
              />
            )}

            {!isImageReady && !error && (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-white/70">
                Cargando imagen...
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-8 text-center text-sm text-white/80">
                <IconPhotoOff size={32} stroke={1.5} />
                <span>{error}</span>
              </div>
            )}

            {isImageReady && (
              <>
                <div className="pointer-events-none absolute inset-0 border-2 border-white/80" />
                <div className="pointer-events-none absolute inset-y-0 left-1/3 border-l border-white/30" />
                <div className="pointer-events-none absolute inset-y-0 left-2/3 border-l border-white/30" />
                <div className="pointer-events-none absolute inset-x-0 top-1/3 border-t border-white/30" />
                <div className="pointer-events-none absolute inset-x-0 top-2/3 border-t border-white/30" />
                <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur-sm">
                  <IconArrowsMove size={14} />
                  Arrastra para centrar
                </div>
              </>
            )}
          </div>
        </div>

        <div className="space-y-4 px-4 py-4 sm:px-6">
          <label className="flex items-center gap-2.5 text-sm text-gray-600">
            <IconZoomOut size={19} className="shrink-0 text-gray-400" />
            <input
              type="range"
              aria-label="Alejar o acercar fotografía"
              min={minZoom}
              max="3"
              step="0.01"
              value={zoom}
              disabled={!isImageReady}
              onChange={(event) => {
                setOffset(visibleOffset);
                setZoom(Number(event.target.value));
              }}
              className="w-full accent-green-600 disabled:opacity-40"
            />
            <IconZoomIn size={19} className="shrink-0 text-gray-400" />
            <span className="w-11 text-right text-xs font-medium text-gray-500">
              {Math.round(zoom * 100)}%
            </span>
          </label>

          <div className="flex gap-3 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!isImageReady}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-300"
            >
              <IconCrop size={17} />
              Aplicar ajuste
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
