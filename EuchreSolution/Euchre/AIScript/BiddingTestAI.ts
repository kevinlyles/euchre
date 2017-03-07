class BiddingTestAI implements BiddingAI {
	private __orderUp: boolean;
	private __discard: Card | null;
	private __trump: Suit | null;
	private __goAlone: boolean;

	public constructor(orderUp: boolean, trump: Suit | null, goAlone: boolean, discard?: Card) {
		this.__orderUp = orderUp;
		this.__discard = discard || null;
		this.__trump = trump;
		this.__goAlone = goAlone;
	}

	public init(): void { }

	public chooseOrderUp(): boolean {
		return this.__orderUp;
	}

	public pickDiscard(): Card | null {
		return this.__discard;
	}

	public pickTrump(): Suit | null {
		return this.__trump;
	}

	public chooseGoAlone(): boolean {
		return this.__goAlone;
	}
}