import React, { useRef, useState, useEffect } from 'react';
import { X, Play, Pause, AlertCircle } from 'lucide-react';

interface AudioPlayerOverlayProps {
    title: string;
    subtitle?: string;
    audioUrl: string;
    onClose: () => void;
}

export default function AudioPlayerOverlay({ title, subtitle, audioUrl, onClose }: AudioPlayerOverlayProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Reset state when url changes
        setIsPlaying(false);
        setProgress(0);
        setError(null);

        if (audioRef.current) {
            audioRef.current.load();
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => setIsPlaying(true))
                    .catch((err) => {
                        console.error("Autoplay failed:", err);
                        setIsPlaying(false);
                        // Do not show error for autoplay block, just let user click play
                    });
            }
        }
    }, [audioUrl]);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
        if (!audioRef.current) return;
        const current = audioRef.current.currentTime;
        const total = audioRef.current.duration;
        if (total) { // avoid NaN
            setDuration(total);
            setProgress((current / total) * 100);
        }
    };

    const handleEnded = () => {
        setIsPlaying(false);
        setProgress(100);
    };

    const handleError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
        const target = e.currentTarget;
        const err = target.error;
        let msg = "Erro desconhecido";
        if (err) {
            switch (err.code) {
                case err.MEDIA_ERR_ABORTED: msg = "Interrompido"; break;
                case err.MEDIA_ERR_NETWORK: msg = "Erro de Rede (Verifique conexão)"; break;
                case err.MEDIA_ERR_DECODE: msg = "Erro de Decodificação (Arquivo corrompido?)"; break;
                case err.MEDIA_ERR_SRC_NOT_SUPPORTED: msg = "Formato não suportado/404"; break;
                default: msg = `Erro: ${err.message}`;
            }
        }
        console.error("Audio Error:", msg, err);
        setError(msg);
        setIsPlaying(false);
    };

    // Format seconds to MM:SS
    const formatTime = (seconds: number) => {
        if (!seconds) return "0:00";
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 p-4 shadow-2xl z-50 animate-in slide-in-from-bottom duration-300">
            <div className="max-w-4xl mx-auto flex items-center gap-4">
                {/* Info */}
                <div className="flex-1 min-w-0">
                    <h4 className="text-white font-bold truncate text-sm md:text-base">{title}</h4>
                    {subtitle && <p className="text-zinc-500 text-xs truncate">{subtitle}</p>}
                </div>

                {/* Controls */}
                <div className="flex items-center gap-4">
                    {error ? (
                        <div className="flex flex-col">
                            <span className="text-red-500 text-xs flex items-center gap-1 font-bold">
                                <AlertCircle className="w-4 h-4" /> Erro
                            </span>
                            <span className="text-red-400 text-[10px] truncate max-w-[150px]" title={error}>{error}</span>
                        </div>
                    ) : (
                        <>
                            <button
                                onClick={togglePlay}
                                className="w-10 h-10 rounded-full bg-brand-600 hover:bg-brand-500 text-white flex items-center justify-center transition-colors"
                            >
                                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
                            </button>
                            <div className="hidden md:flex flex-col w-64">
                                {/* Progress Bar */}
                                <div className="h-1 bg-zinc-800 rounded-full overflow-hidden w-full">
                                    <div
                                        className="h-full bg-brand-500 transition-all duration-100"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                                    <span>{formatTime(audioRef.current?.currentTime || 0)}</span>
                                    <span>{formatTime(duration)}</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Close */}
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <audio
                    ref={audioRef}
                    src={audioUrl}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={handleEnded}
                    onError={handleError}
                />
            </div>
        </div>
    );
}
