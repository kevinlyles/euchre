class MaliciousAI implements PlayingAI {
	//tslint:disable-next-line:no-empty
	public init(): void { }

	public pickCard(hand: Card[], _maker: Player, trump: Suit, trickSoFar: PlayedCard[]): Card | null {
		let trickSuit: Suit | undefined = undefined;
		if (trickSoFar.length > 0) {
			trickSuit = trickSoFar[0].card.suit;
		}
		let card = getFirstLegalCard(hand, trickSuit);
		if (!card) {
			return null;
		}
		let fakeSuit = trickSuit !== undefined && hasSuit(hand, trickSuit);
		for (let i = 0; i < hand.length; i++) {
			if (card.id === hand[i].id) {
				return new MaliciousCard(card.suit, trump, fakeSuit ? 1 : 0,
					card.rank, Rank.Right, 0,
					card.id, new Card(trump, Rank.Right).id, i + 1);
			}
		}
		return null;
	}

	//tslint:disable-next-line:no-empty
	public trickEnd(): void { }
}
