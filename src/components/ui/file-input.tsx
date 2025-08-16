"use client";

import { Label } from "@/components/ui/label";
import { useState } from "react";

interface FileInputProps {
	label?: string;
	accept?: string;
	onChange?: (file: File | null) => void;
	placeholder?: string;
	dragText?: string;
	className?: string;
}

export function FileInput({
	label,
	accept,
	onChange,
	placeholder = "Click to upload file",
	dragText = "or drag and drop",
	className = "",
}: FileInputProps) {
	const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0] || null;
		setSelectedFileName(file?.name || null);
		onChange?.(file);
	};

	return (
		<div className={`space-y-2 ${className}`}>
			{label && <Label>{label}</Label>}
			<div className="relative">
				<input
					type="file"
					accept={accept}
					onChange={handleFileChange}
					className="sr-only"
					id="file-input"
				/>
				<label
					htmlFor="file-input"
					className={`flex w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed p-4 transition-colors ${
						selectedFileName
							? "border-primary bg-primary/5"
							: "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
					}`}
				>
					{selectedFileName ? (
						<div className="flex w-full items-center justify-center">
							<span className="max-w-full truncate px-2 text-center font-medium text-sm">
								{selectedFileName}
							</span>
						</div>
					) : (
						<div className="text-center">
							<svg
								className="mx-auto h-12 w-12 text-gray-400"
								stroke="currentColor"
								fill="none"
								viewBox="0 0 48 48"
								role="img"
								aria-label="Upload file icon"
							>
								<title>Upload file icon</title>
								<path
									d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
									strokeWidth={2}
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
							<div className="mt-2">
								<span className="font-medium text-gray-900 text-sm">
									{placeholder}
								</span>
								<p className="text-gray-500 text-xs">{dragText}</p>
							</div>
						</div>
					)}
				</label>
			</div>
		</div>
	);
}
