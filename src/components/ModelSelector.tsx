"use client";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { MODEL_OPTIONS } from "@/lib/constants/ocr";
import { useModelStore } from "@/store/model";

export function ModelSelector() {
	const { selectedModel, selectModel } = useModelStore();

	return (
		<div className="space-y-2">
			<Label htmlFor="model">Model</Label>
			<Select value={selectedModel} onValueChange={selectModel}>
				<SelectTrigger id="model" className="w-full">
					<SelectValue placeholder="Select a model" />
				</SelectTrigger>
				<SelectContent>
					{MODEL_OPTIONS.map((model) => (
						<SelectItem key={model.code} value={model.code}>
							{model.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
