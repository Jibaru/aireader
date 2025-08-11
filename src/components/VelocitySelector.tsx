"use client";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useVelocityStore } from "@/store/velocity";

const VELOCITY_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5];

export function VelocitySelector() {
	const { playbackRate, setPlaybackRate } = useVelocityStore();

	// Find the closest index for the slider
	const getSliderValue = (vel: number) => {
		const index = VELOCITY_OPTIONS.findIndex((v) => v === vel);
		return index === -1 ? 2 : index; // Default to 1x (index 2) if not found
	};

	const handleVelocityChange = (values: number[]) => {
		const newVelocity = VELOCITY_OPTIONS[values[0]];
		setPlaybackRate(newVelocity);
	};

	return (
		<Card className="p-4">
			<div className="space-y-3">
				<Label className="font-medium text-sm">
					Playback Speed: {playbackRate}x
				</Label>
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
			</div>
		</Card>
	);
}
