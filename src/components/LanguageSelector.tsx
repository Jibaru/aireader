"use client";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { LANGUAGE_OPTIONS } from "@/lib/constants/ocr";
import { useLanguageStore } from "@/store/language";

export function LanguageSelector() {
	const { selectedLanguage, selectLanguage } = useLanguageStore();

	return (
		<div className="space-y-2">
			<Label htmlFor="language">Language</Label>
			<Select value={selectedLanguage} onValueChange={selectLanguage}>
				<SelectTrigger id="language" className="w-full">
					<SelectValue placeholder="Select a language" />
				</SelectTrigger>
				<SelectContent>
					{LANGUAGE_OPTIONS.map((language) => (
						<SelectItem key={language.code} value={language.code}>
							{language.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
