"use client";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import type { AudioQueuePlayer } from "@/lib/audio/queue";
import { Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";

type AudioProgressBarProps = {
	player: AudioQueuePlayer | null;
};

export function AudioProgressBar({ player }: AudioProgressBarProps) {
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const [percentage, setPercentage] = useState(0);

	useEffect(() => {
		if (!player) return;

		// Set up progress callback
		player.setOnProgress((progress) => {
			setCurrentTime(progress.currentTime);
			setDuration(progress.duration);
			setPercentage(progress.percentage);
		});

		// Update playing state periodically
		const interval = setInterval(() => {
			setIsPlaying(player.getIsPlaying());
		}, 100);

		return () => {
			clearInterval(interval);
		};
	}, [player]);

	const handlePlayPause = () => {
		if (!player) return;

		if (isPlaying) {
			player.pause();
		} else {
			player.resume();
		}
	};

	const handleSeek = (value: number[]) => {
		if (!player || !duration) return;

		const targetTime = (value[0] / 100) * duration;
		player.seekTo(targetTime);
	};

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	if (!player || duration === 0) {
		return null;
	}

	return (
		<div className="flex items-center gap-3 rounded-lg border bg-card p-4">
			<Button
				variant="outline"
				size="sm"
				onClick={handlePlayPause}
				className="h-8 w-8 p-0"
			>
				{isPlaying ? (
					<Pause className="h-4 w-4" />
				) : (
					<Play className="h-4 w-4" />
				)}
			</Button>

			<div className="flex-1 space-y-1">
				<Slider
					value={[percentage]}
					onValueChange={handleSeek}
					max={100}
					step={0.1}
					className="w-full"
				/>
				<div className="flex justify-between text-muted-foreground text-xs">
					<span>{formatTime(currentTime)}</span>
					<span>{formatTime(duration)}</span>
				</div>
			</div>
		</div>
	);
}
