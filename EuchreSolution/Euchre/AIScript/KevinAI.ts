class KevinAI implements EuchreAI {
	private hand: Card[];

	public init(): void {
		this.hand = game.myHand();
	}

	public chooseOrderUp(): boolean {
		return false;
	}

	public pickDiscard(): Card | null {
		return null;
	}

	public pickTrump(): Suit | null {
		return null;
	}

	public chooseGoAlone(): boolean {
		return false;
	}

	public pickCard(): Card | null {
		return null;
	}

	public trickEnd(): void {
		return;
	}
}
