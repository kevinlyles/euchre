enum AnimType {
	DealHands,
	PlayCard,
	Discard,
	WinTrick,
}

class Animation {
	public const animType: AnimType;
	public const player: Player | null;
	public const cardID: string | null;
	public const text: string | null;

	constructor(animType: AnimType, player?: Player, cardID?: string, text?: string) {
		this.animType = animType;
		this.player = player === undefined ? null : player;
		this.cardID = cardID === undefined ? null : cardID;
		this.text = text === undefined ? null : text;
	}

}

class AnimController {
	public queuedAnimations: Animation[];

	public pushAnimation(animType: AnimType, player?: Player, cardID?: string, text?: string): void {
		let animation: Animation = new Animation(animType, player, cardID, text);
		this.queuedAnimations.push(animation);
	}

	public executeAnimations(): void {
		let pauseTime: number = 500;
		let delay: number;
		let animFunction: Function;

		if (this.queuedAnimations.length <= 0) { return; }

		for (let i = 0; i < this.queuedAnimations.length; i++) {
			delay = pauseTime * i;
			animFunction = this.getAnimFunction(animType, player, cardID);

		}
	}

	public getAnimFunction(animType: AnimType, player?: Player, cardID?: string): Function {
		switch (animType) {
			case AnimType.DealHands:
				return animDeal();
			case AnimType.Discard:
				break;
			case AnimType.PlayCard;
				break;
			case AnimType.WinTrick;
				break;
			default:
				break;
		}
	}
}