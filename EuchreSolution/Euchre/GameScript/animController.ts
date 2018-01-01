enum AnimType {
	DealHands,
	PlayCard,
	Discard,
	WinTrick,
}

interface Animation {
	readonly animType: AnimType;
	readonly delay: number;
	readonly callback: () => void;
	readonly player?: Player;
	readonly cardID?: string;
	readonly text?: string;
}

const delays = {
	[AnimType.DealHands]: 200,
	[AnimType.PlayCard]: 500,
	[AnimType.Discard]: 500,
	[AnimType.WinTrick]: 500,
};

class AnimController {
	public queuedAnimations: Animation[];

	public pushAnimation(animType: AnimType, callback: () => void, player?: Player, cardID?: string, text?: string): void {
		const animation: Animation = { animType, delay: delays[animType], callback, player, cardID, text };
		this.queuedAnimations.push(animation);
	}

	public executeAnimations(): void {
		if (this.queuedAnimations.length <= 0) { return; }

		const animation = this.queuedAnimations.shift() as Animation;
		setTimeout(animation.callback, animation.delay, animation.player, animation.cardID, animation.text);
	}
}
