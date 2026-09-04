import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, Image, AlertCircle, RefreshCw, CheckCircle2, Zap } from 'lucide-react';
import { scanQRCodeFromImageData, decodeSyncQRPayload } from '@axon/shared';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [hasCamera, setHasCamera] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<string | null>(null);

  const activeStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Stop camera stream cleanly
  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach((t) => t.stop());
      activeStreamRef.current = null;
    }
    setIsScanning(false);
  };

  // Start camera
  const startCamera = async () => {
    setCameraError(null);
    setScanResult(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setHasCamera(false);
      setCameraError('Камера не поддерживается в этом браузере или окружении.');
      return;
    }

    try {
      stopCamera();
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      activeStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsScanning(true);
        requestAnimationFrame(tick);
      }
    } catch (err: any) {
      console.warn('Camera access failed:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Доступ к камере отклонен. Разрешите доступ к камере в настройках устройства или загрузите фото QR-кода.'
          : `Не удалось включить камеру: ${err.message || 'Ошибка устройства'}`
      );
    }
  };

  const handleDetectedCode = (code: string) => {
    if (scanResult) return; // Prevent double firing
    setScanResult(code);

    try {
      if (navigator.vibrate) navigator.vibrate([40, 30, 40]);
    } catch {
      // ignore
    }

    stopCamera();
    setTimeout(() => {
      onScanSuccess(code);
    }, 400);
  };

  // Scanning loop
  const tick = () => {
    if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(tick);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvasRef.current = canvas;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // 1. Try native BarcodeDetector if available
      if ('BarcodeDetector' in window) {
        try {
          const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
          detector
            .detect(canvas)
            .then((barcodes: any[]) => {
              if (barcodes && barcodes.length > 0) {
                const val = barcodes[0].rawValue || barcodes[0].displayValue;
                if (val) {
                  handleDetectedCode(val);
                  return;
                }
              }
              // If not found yet, continue scanning
              animationFrameRef.current = requestAnimationFrame(tick);
            })
            .catch(() => {
              fallbackScan(ctx, canvas);
            });
          return;
        } catch {
          // fallback
        }
      }

      fallbackScan(ctx, canvas);
      return;
    }

    animationFrameRef.current = requestAnimationFrame(tick);
  };

  const fallbackScan = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const decoded = scanQRCodeFromImageData(imageData.data, imageData.width, imageData.height);
      if (decoded) {
        handleDetectedCode(decoded);
        return;
      }
    } catch (e) {
      // ignore scan frame error
    }
    animationFrameRef.current = requestAnimationFrame(tick);
  };

  // Handle uploaded image file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = scanQRCodeFromImageData(imgData.data, imgData.width, imgData.height);
        if (code) {
          handleDetectedCode(code);
        } else {
          setCameraError('Не удалось распознать QR-код на этом фото. Попробуйте более четкий снимок.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-between p-4 select-none animate-fade-in"
      onClick={onClose}
    >
      {/* Top Bar */}
      <div
        className="w-full max-w-md flex items-center justify-between pt-2 pb-4 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#38bdf8]/20 border border-[#38bdf8]/30 flex items-center justify-center text-[#38bdf8]">
            <Camera size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold">Сканирование QR-кода</h3>
            <p className="text-[10px] text-[#94a3b8]">Наведите камеру на экран компьютера</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-[#94a3b8] hover:text-white transition-all"
        >
          <X size={18} />
        </button>
      </div>

      {/* Viewfinder Center Area */}
      <div
        className="w-full max-w-md flex-1 flex flex-col items-center justify-center relative overflow-hidden rounded-3xl border border-white/[0.1] bg-[#0c0d12]"
        onClick={(e) => e.stopPropagation()}
      >
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Scan Frame Target Box */}
        <div className="relative z-10 w-64 h-64 border-2 border-[#38bdf8]/50 rounded-2xl flex items-center justify-center shadow-2xl">
          {/* Corner highlights */}
          <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-[#38bdf8] rounded-tl-xl" />
          <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-[#38bdf8] rounded-tr-xl" />
          <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-[#38bdf8] rounded-bl-xl" />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-[#38bdf8] rounded-br-xl" />

          {/* Animated Laser Scan Line */}
          {isScanning && !scanResult && (
            <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#38bdf8] to-transparent shadow-[0_0_12px_#38bdf8] animate-bounce" />
          )}

          {scanResult && (
            <div className="p-3 rounded-2xl bg-emerald-500/90 text-white flex flex-col items-center gap-1 animate-scale-in">
              <CheckCircle2 size={32} />
              <span className="text-xs font-bold">QR-код распознан!</span>
            </div>
          )}
        </div>

        {cameraError && (
          <div className="absolute bottom-6 inset-x-6 p-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-xs text-rose-200 flex items-center gap-2.5 z-20 backdrop-blur-md">
            <AlertCircle size={16} className="shrink-0" />
            <span className="text-[11px] leading-tight">{cameraError}</span>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div
        className="w-full max-w-md pt-4 pb-2 space-y-2.5 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-[11px] text-[#94a3b8]">
          Содержит адрес ПК, порт и ключ сопряжения. Подключение произойдет автоматически.
        </p>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 py-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all border border-white/[0.08]"
          >
            <Image size={15} className="text-[#38bdf8]" />
            <span>Выбрать фото QR из галереи</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          <button
            onClick={startCamera}
            className="px-4 py-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-bold transition-all border border-white/[0.08]"
            title="Перезапустить камеру"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};
