enum AnimType {
	NoDelay,
	DealHands,
	PlayCard,
	Discard,
	WinTrick,
}

interface Animation {
	readonly delay: number;
	readonly callback: () => void;
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

	public static pushAnimation(animType: AnimType, callback: () => void): void {
		const animation: Animation = { delay: delays[animType], callback };
		this.queuedAnimations.push(animation);
		this.executeAnimations();
	}

	private static executeAnimations(): void {
		if (this.queuedAnimations.length <= 0) {
			this.running = false;
			return;
		}
		if (this.running) {
			return;
		}

		this.running = true;

		const animation = this.queuedAnimations.shift() as Animation;
		const wrapper = () => {
			animation.callback();
			this.running = false;
			this.executeAnimations();
		};
		setTimeout(wrapper, animation.delay, this);
	}
}
