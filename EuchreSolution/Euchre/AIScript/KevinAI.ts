class KevinAI implements EuchreAI {
	// tslint:disable-next-line:no-empty
	public init(_me: Player): void { }

	public chooseOrderUp(_hand: Card[], _trumpCandidate: Card, _dealer: Player): boolean {
		return false;
	}

	public pickDiscard(_hand: Card[], _trump: Suit): Card | null {
		return null;
	}

	public pickTrump(_hand: Card[], _trumpCandidate: Card): Suit | null {
		return null;
	}

	public chooseGoAlone(_hand: Card[], _trump: Suit): boolean {
		return false;
	}

	public pickCard(_hand: Card[], _maker: Player, _trump: Suit, _trickSoFar: PlayedCard[]): Card | null {
		return null;
	}

	// tslint:disable-next-line:no-empty
	public trickEnd(_playedCardsCallback: () => PlayedCard[]): void { }
}
