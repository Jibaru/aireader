type AudioChunkItem = {
	id: string;
	url: string;
};

export class AudioQueuePlayer {
	private audio: HTMLAudioElement;
	private queue: AudioChunkItem[] = [];
	private isPlaying = false;
	private onEndCallback?: () => void;
	private playbackRate = 1;

	constructor() {
		this.audio = new Audio();
		this.audio.addEventListener("ended", () => this.playNext());
	}

	setOnEnded(callback: () => void) {
		this.onEndCallback = callback;
	}

	setPlaybackRate(rate: number) {
		this.playbackRate = rate;
		this.audio.playbackRate = rate;
	}

	getPlaybackRate(): number {
		return this.playbackRate;
	}

	enqueue(item: AudioChunkItem) {
		this.queue.push(item);
		if (!this.isPlaying) {
			void this.playNext();
		}
	}

	clear() {
		this.queue = [];
		this.audio.pause();
		this.audio.currentTime = 0;
		this.isPlaying = false;
	}

	private async playNext() {
		const next = this.queue.shift();
		if (!next) {
			this.isPlaying = false;
			if (this.onEndCallback) this.onEndCallback();
			return;
		}
		this.isPlaying = true;
		this.audio.src = next.url;
		this.audio.playbackRate = this.playbackRate; // Apply playback rate to new audio
		try {
			await this.audio.play();
		} catch (e) {
			// swallow errors to keep queue running
			void this.playNext();
		}
	}
}
