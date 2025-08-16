type AudioChunkItem = {
	id: string;
	url: string;
	duration?: number;
};

type ProgressCallback = (progress: {
	currentTime: number;
	duration: number;
	percentage: number;
}) => void;

export class AudioQueuePlayer {
	private audio: HTMLAudioElement;
	private queue: AudioChunkItem[] = [];
	private playedChunks: AudioChunkItem[] = [];
	private currentChunk: AudioChunkItem | null = null;
	private isPlaying = false;
	private onEndCallback?: () => void;
	private onProgressCallback?: ProgressCallback;
	private playbackRate = 1;
	private progressInterval: NodeJS.Timeout | null = null;

	constructor() {
		this.audio = new Audio();
		this.audio.addEventListener("ended", () => this.playNext());
		this.audio.addEventListener("loadedmetadata", () => this.updateProgress());
		this.audio.addEventListener("timeupdate", () => this.updateProgress());
	}

	setOnEnded(callback: () => void) {
		this.onEndCallback = callback;
	}

	setOnProgress(callback: ProgressCallback) {
		this.onProgressCallback = callback;
	}

	setPlaybackRate(rate: number) {
		this.playbackRate = rate;
		this.audio.playbackRate = rate;
	}

	getPlaybackRate(): number {
		return this.playbackRate;
	}

	getCurrentTime(): number {
		const playedTime = this.playedChunks.reduce(
			(total, chunk) => total + (chunk.duration || 0),
			0,
		);
		return playedTime + this.audio.currentTime;
	}

	getTotalDuration(): number {
		const queuedTime = this.queue.reduce(
			(total, chunk) => total + (chunk.duration || 0),
			0,
		);
		const playedTime = this.playedChunks.reduce(
			(total, chunk) => total + (chunk.duration || 0),
			0,
		);
		const currentTime = this.audio.duration || 0;
		return playedTime + currentTime + queuedTime;
	}

	getIsPlaying(): boolean {
		return this.isPlaying && !this.audio.paused;
	}

	pause() {
		this.audio.pause();
	}

	resume() {
		if (this.currentChunk) {
			void this.audio.play();
		}
	}

	seekTo(timeInSeconds: number) {
		let targetTime = timeInSeconds;
		let chunkIndex = 0;

		// Find which chunk contains the target time
		for (const chunk of this.playedChunks) {
			if (targetTime <= (chunk.duration || 0)) {
				// Reconstruct queue from this point
				this.queue = [
					...this.playedChunks.slice(chunkIndex),
					...(this.currentChunk ? [this.currentChunk] : []),
					...this.queue,
				];
				this.playedChunks = this.playedChunks.slice(0, chunkIndex);
				this.currentChunk = null;
				this.audio.currentTime = targetTime;
				void this.playNext();
				return;
			}
			targetTime -= chunk.duration || 0;
			chunkIndex++;
		}

		// Target is in current chunk
		if (this.currentChunk && targetTime <= this.audio.duration) {
			this.audio.currentTime = targetTime;
			return;
		}

		// Target is in future chunks - not supported yet
		// Would need to know duration of queued chunks
	}

	enqueue(item: AudioChunkItem) {
		this.queue.push(item);
		if (!this.isPlaying) {
			void this.playNext();
		}
	}

	clear() {
		this.queue = [];
		this.playedChunks = [];
		this.currentChunk = null;
		this.audio.pause();
		this.audio.currentTime = 0;
		this.isPlaying = false;
		if (this.progressInterval) {
			clearInterval(this.progressInterval);
			this.progressInterval = null;
		}
	}

	private updateProgress() {
		if (this.onProgressCallback) {
			const currentTime = this.getCurrentTime();
			const duration = this.getTotalDuration();
			const percentage = duration > 0 ? (currentTime / duration) * 100 : 0;

			this.onProgressCallback({
				currentTime,
				duration,
				percentage,
			});
		}
	}

	private async playNext() {
		// Move current chunk to played chunks
		if (this.currentChunk) {
			this.currentChunk.duration = this.audio.duration || 0;
			this.playedChunks.push(this.currentChunk);
		}

		const next = this.queue.shift();
		if (!next) {
			this.isPlaying = false;
			this.currentChunk = null;
			if (this.onEndCallback) this.onEndCallback();
			return;
		}

		this.isPlaying = true;
		this.currentChunk = next;
		this.audio.src = next.url;

		// Ensure playback rate is applied after setting new source
		// Add a small delay to ensure the audio element is ready
		await new Promise((resolve) => setTimeout(resolve, 10));
		this.audio.playbackRate = this.playbackRate;

		try {
			await this.audio.play();
		} catch {
			// swallow errors to keep queue running
			void this.playNext();
		}
	}
}
