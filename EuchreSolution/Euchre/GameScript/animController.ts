enum AnimType {
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
	[AnimType.DealHands]: 200,
	[AnimType.PlayCard]: 500,
	[AnimType.Discard]: 500,
	[AnimType.WinTrick]: 500,
};

class AnimController {
	public queuedAnimations: Animation[];

	public pushAnimation(animType: AnimType, callback: () => void): void {
		const animation: Animation = { delay: delays[animType], callback };
		this.queuedAnimations.push(animation);
	}

	public executeAnimations(): void {
		if (this.queuedAnimations.length <= 0) { return; }

		const animation = this.queuedAnimations.shift() as Animation;
		const wrapper = () => {
			animation.callback();
			this.executeAnimations();
		};
		setTimeout(wrapper, animation.delay, this);
	}
}
