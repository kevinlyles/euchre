class DoesNotBidAI implements BiddingAI {
	init() { }

	chooseOrderUp() {
		return false;
	}

	public pickDiscard(hand: Card[], trump: Suit): Card {
		return this.pickDiscardWithHand(hand, trump);
	}

	private pickDiscardWithHand(hand: Card[], trump: Suit): Card {
		let {lowestCards, suitCounts, hasAce} = this.analyzeSuits(hand, trump);

		let filters: ((suit: Suit) => boolean)[] = [
			(suit: Suit) => suitCounts[suit] == 1 && !hasAce[suit],
			(suit: Suit) => !hasAce[suit],
			(_) => true,
		];

		for (let i = 0; i < filters.length; i++) {
			let lowestCard = this.filterCards(lowestCards, trump, filters[i]);
			if (lowestCard) {
				return lowestCard;
			}
		}

		let lowestCard = hand[0];
		for (let i = 1; i < hand.length; i++) {
			if (hand[i].rank < lowestCard.rank) {
				lowestCard = hand[i];
			}
		}
		return lowestCard;
	}

	private analyzeSuits(hand: Card[], trump: Suit):
		{ suitCounts: number[], hasAce: boolean[], lowestCards: (Card | null)[] } {
		let suitCounts: number[] = [0, 0, 0, 0];
		let hasAce: boolean[] = [false, false, false, false];
		let lowestCards: (Card | null)[] = [null, null, null, null];

		for (let card of hand) {
			if (this.isRight(card, trump) || this.isLeft(card, trump)) {
				suitCounts[trump]++;
				continue;
			}
			suitCounts[card.suit]++;
			if (card.rank === Rank.Ace) {
				hasAce[card.suit] = true;
			}
			let lowestCardInSuit = lowestCards[card.suit]
			if (!lowestCardInSuit || lowestCardInSuit.rank > card.rank) {
				lowestCards[card.suit] = card;
			}
		}

		return {
			suitCounts: suitCounts,
			hasAce: hasAce,
			lowestCards: lowestCards,
		};
	}

	private filterCards(lowestCards: (Card | null)[], skipSuit: Suit, filter: (suit: Suit) => boolean): Card | null {
		let lowestCard: Card | null = null;
		for (let suit of suitsArray) {
			let lowestCardInSuit = lowestCards[suit]
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

	pickTrump() {
		return null;
	}

	chooseGoAlone() {
		return false;
	}

	private isRight(card: Card, trump: Suit) {
		if (card.rank === Rank.Right && card.suit == trump) {
			return true;
		}
		return card.rank === Rank.Jack && card.suit == trump;
	}

	private isLeft(card: Card, trump: Suit) {
		if (card.rank === Rank.Left && card.suit == trump) {
			return true;
		}
		return card.rank === Rank.Jack && card.suit == getOppositeSuit(trump);
	}
}
