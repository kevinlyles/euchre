enum AnimType {
	NoDelay,
	DealHands,
	PlayCard,
	Discard,
	WinTrick,
}

interface Animation {
	readonly delay: number;
	readonly delegate: () => void;
}

const delays = {
	[AnimType.NoDelay]: 0,
	[AnimType.DealHands]: 200,
	[AnimType.PlayCard]: 500,
	[AnimType.Discard]: 500,
	[AnimType.WinTrick]: 500,
};

class AnimController {
	private static queuedAnimations: Animation[] = [];
	private static running = false;
	private static doDelays = true;

	public static setDoDelays(doDelays: boolean): void {
		this.doDelays = doDelays;
	}

	public static queueAnimation(animType: AnimType, delegate: () => void): void {
		//animShowText("DEBUG: started queueAnimation", MessageLevel.Game, 4);
		if (!this.doDelays) {
			delegate();
			//animShowText("DEBUG: ended queueAnimation, executed immediately", MessageLevel.Game, 4);
			return;
		}
		const animation: Animation = { delay: delays[animType], delegate };
		this.queuedAnimations.push(animation);
		//animShowText("DEBUG: ended queueAnimation, queued", MessageLevel.Game, 4);
		this.executeNextAnimation();
	}

	private static executeNextAnimation(): void {
		//animShowText("DEBUG: started executeNextAnimation", MessageLevel.Game, 4);
		if (this.queuedAnimations.length <= 0) {
			this.running = false;
			//animShowText("DEBUG: ended executeNextAnimation -- nothing to run", MessageLevel.Game, 4);
			return;
		}
		if (this.running) {
			//animShowText("DEBUG: ended executeNextAnimation -- something is already running", MessageLevel.Game, 4);
			return;
		}

		this.running = true;

		const animation = this.queuedAnimations.shift() as Animation;
		const wrapper = () => {
			//animShowText("DEBUG: started wrapper in executeNextAnimation", MessageLevel.Game, 4);
			//animShowText("DEBUG: callback function: " + animation.callback.toString(), MessageLevel.Game, 4);
			animation.delegate();
			this.running = false;
			//animShowText("DEBUG: ended wrapper in executeNextAnimation", MessageLevel.Game, 4);
			this.executeNextAnimation();
		};
		setTimeout(wrapper, animation.delay);
		//animShowText("DEBUG: ended executeNextAnimation -- called setTimeout", MessageLevel.Game, 4);
	}
}
