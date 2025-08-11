"use client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import type { AudioQueuePlayer } from "@/lib/audio/queue";
import { useVelocityStore } from "@/store/velocity";
import { Pause, Play, Square } from "lucide-react";
import { useEffect, useState } from "react";

type MediaControlsProps = {
	player: AudioQueuePlayer | null;
	onStop: () => void;
	onPlay?: () => void;
	isLoading?: boolean;
	canPlay?: boolean; // Para saber si se puede iniciar reproducción
	playLabel?: string; // Texto personalizado para el botón de play inicial
};

const VELOCITY_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export function MediaControls({
	player,
	onStop,
	onPlay,
	isLoading = false,
	canPlay = false,
	playLabel = "Play",
}: MediaControlsProps) {
	const { playbackRate, setPlaybackRate } = useVelocityStore();
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const [percentage, setPercentage] = useState(0);

	// Component is always visible, but disabled when there's no player or audio
	const hasAudio = player && duration > 0;

	useEffect(() => {
		if (!player) return;

		// Configurar callback de progreso
		player.setOnProgress((progress) => {
			setCurrentTime(progress.currentTime);
			setDuration(progress.duration);
			setPercentage(progress.percentage);
		});

		// Actualizar estado de reproducción periódicamente
		const interval = setInterval(() => {
			setIsPlaying(player.getIsPlaying());
		}, 100);

		return () => {
			clearInterval(interval);
		};
	}, [player]);

	// Actualizar velocidad de reproducción cuando cambia
	useEffect(() => {
		if (player) {
			player.setPlaybackRate(playbackRate);
		}
	}, [player, playbackRate]);

	const handlePlayPause = () => {
		// Si no hay audio cargado y tenemos función onPlay, iniciar reproducción
		if (!hasAudio && onPlay && canPlay) {
			onPlay();
			return;
		}

		// Si hay audio cargado, pausar/resumir
		if (!player || !hasAudio) return;

		if (isPlaying) {
			player.pause();
		} else {
			player.resume();
		}
	};

	const handleStop = () => {
		onStop();
		setCurrentTime(0);
		setDuration(0);
		setPercentage(0);
		setIsPlaying(false);
	};

	const handleSeek = (value: number[]) => {
		if (!player || !hasAudio) return;

		const targetTime = (value[0] / 100) * duration;
		player.seekTo(targetTime);
	};

	// Encontrar el índice más cercano para el slider de velocidad
	const getSliderValue = (vel: number) => {
		const index = VELOCITY_OPTIONS.findIndex((v) => v === vel);
		return index === -1 ? 2 : index; // Por defecto a 1x (índice 2) si no se encuentra
	};

	const handleVelocityChange = (values: number[]) => {
		const newVelocity = VELOCITY_OPTIONS[values[0]];
		setPlaybackRate(newVelocity);
	};

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	return (
		<Card className="space-y-4 p-4">
			{/* Barra de progreso */}
			<div className="space-y-2">
				<Slider
					value={[percentage]}
					onValueChange={handleSeek}
					max={100}
					step={0.1}
					className="w-full"
					disabled={!hasAudio || isLoading}
				/>
				<div className="flex justify-between text-muted-foreground text-xs">
					<span>{formatTime(currentTime)}</span>
					<span>{formatTime(duration)}</span>
				</div>
			</div>

			{/* Controles de reproducción */}
			<div className="flex items-center gap-2">
				{/* Botón principal: Play inicial o Play/Pause */}
				{!hasAudio && onPlay ? (
					<Button
						variant="default"
						size="sm"
						onClick={handlePlayPause}
						disabled={!canPlay || isLoading}
						className="gap-2"
					>
						{isLoading ? (
							<div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
						) : (
							<Play className="h-4 w-4" />
						)}
						{isLoading ? "Loading..." : playLabel}
					</Button>
				) : (
					<Button
						variant="outline"
						size="sm"
						onClick={handlePlayPause}
						disabled={!hasAudio || isLoading}
						className="h-10 w-10 p-0"
					>
						{isLoading ? (
							<div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
						) : isPlaying ? (
							<Pause className="h-4 w-4" />
						) : (
							<Play className="h-4 w-4" />
						)}
					</Button>
				)}

				<Button
					variant="outline"
					size="sm"
					onClick={handleStop}
					disabled={!hasAudio && !isPlaying}
					className="h-10 w-10 p-0"
				>
					<Square className="h-4 w-4" />
				</Button>
			</div>

			{/* Control de velocidad */}
			<div className="space-y-2">
				<Slider
					value={[getSliderValue(playbackRate)]}
					onValueChange={handleVelocityChange}
					max={VELOCITY_OPTIONS.length - 1}
					min={0}
					step={1}
					className="w-full"
				/>
				<div className="flex justify-between text-muted-foreground text-xs">
					{VELOCITY_OPTIONS.map((speed) => (
						<span key={speed}>{speed}x</span>
					))}
				</div>
			</div>
		</Card>
	);
}
