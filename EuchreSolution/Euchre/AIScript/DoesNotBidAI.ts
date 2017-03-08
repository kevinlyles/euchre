class DoesNotBidAI implements BiddingAI {
	// tslint:disable-next-line:no-empty
	public init() { }

	public chooseOrderUp() {
		return false;
	}

	public pickDiscard(hand: Card[], trump: Suit): Card {
		return this.pickDiscardWithHand(hand, trump);
	}

	private pickDiscardWithHand(hand: Card[], trump: Suit): Card {
		const { lowestCards, suitCounts, hasAce } = this.analyzeSuits(hand, trump);

		const filters: ((suit: Suit) => boolean)[] = [
			(suit: Suit) => suitCounts[suit] === 1 && !hasAce[suit],
			(suit: Suit) => !hasAce[suit], _ => true,
		];

		for (const filter of filters) {
			const lowestCard = this.filterCards(lowestCards, trump, filter);
			if (lowestCard) {
				return lowestCard;
			}
		}

		return getWorstCardInHand(hand, undefined, trump) as Card;
	}

	private analyzeSuits(hand: Card[], trump: Suit): {
		suitCounts: number[],
		hasAce: boolean[],
		lowestCards: (Card | null)[],
	} {
		const suitCounts: number[] = [0, 0, 0, 0];
		const hasAce: boolean[] = [false, false, false, false];
		const lowestCards: (Card | null)[] = [null, null, null, null];

		for (const card of hand) {
			if (this.isRight(card, trump) || this.isLeft(card, trump)) {
				suitCounts[trump]++;
				continue;
			}
			suitCounts[card.suit]++;
			if (card.rank === Rank.Ace) {
				hasAce[card.suit] = true;
			}
			const lowestCardInSuit = lowestCards[card.suit];
			if (!lowestCardInSuit || lowestCardInSuit.rank > card.rank) {
				lowestCards[card.suit] = card;
			}
		}

		return {
			suitCounts,
			hasAce,
			lowestCards,
		};
	}

	private filterCards(lowestCards: (Card | null)[], skipSuit: Suit, filter: (suit: Suit) => boolean): Card | null {
		let lowestCard: Card | null = null;
		for (const suit of suitsArray) {
			const lowestCardInSuit = lowestCards[suit];
			if (suit === skipSuit || !lowestCardInSuit) {
				continue;
			}
			if (filter(suit)) {
				if (!lowestCard || lowestCard.rank > lowestCardInSuit.rank) {
					lowestCard = lowestCardInSuit;
				}
			}
		}
		return lowestCard;
	}

	public pickTrump() {
		return null;
	}

	public chooseGoAlone() {
		return false;
	}

	private isRight(card: Card, trump: Suit) {
		if (card.rank === Rank.Right && card.suit === trump) {
			return true;
		}
		return card.rank === Rank.Jack && card.suit === trump;
	}

	private isLeft(card: Card, trump: Suit) {
		if (card.rank === Rank.Left && card.suit === trump) {
			return true;
		}
		return card.rank === Rank.Jack && card.suit === getOppositeSuit(trump);
	}
}
