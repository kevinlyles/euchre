class KevinAI implements EuchreAI {
	private me: Player;
	private amDealer = false;
	private goAlone = false;
	private trumpHasBeenLead = false;
	//TODO: use the global array instead
	private suits = [Suit.Clubs, Suit.Diamonds, Suit.Hearts, Suit.Spades];
	private ranks = [Rank.Right, Rank.Left, Rank.Ace, Rank.King, Rank.Queen, Rank.Ten, Rank.Nine];

	public init(me: Player): void {
		this.trumpHasBeenLead = false;
		this.me = me;
	}

	public chooseOrderUp(hand: Card[], trumpCandidate: Card, dealer: Player): boolean {
		let hasSuit: boolean[] = [];
		for (let suit of this.suits) {
			hasSuit[suit] = false;
		}
		let counts = {
			offAceCount: 0,
			suitCount: 0,
			trumpCount: 0,
		}
		let hasTrump: boolean[] = [];
		for (let rank of this.ranks) {
			hasTrump[rank] = false;
		}

		for (let card of hand) {
			this.evaluateCard(card, trumpCandidate.suit, hasTrump, hasSuit, counts);
		}

		this.amDealer = this.me === dealer;
		if (this.amDealer) {
			this.evaluateCard(trumpCandidate, trumpCandidate.suit, hasTrump,
				hasSuit, counts);
		}

		//TODO: set goAlone
		if (counts.trumpCount >= 4) {
			return true;
		}
		if (hasTrump[Rank.Right]) {
			if (counts.trumpCount >= 3) {
				return true;
			}
			if (counts.trumpCount >= 2 && counts.offAceCount >= 1
				&& counts.suitCount <= 3 && this.amDealer) {
				return true;
			}
		}
		return false;
	}

	public pickDiscard(hand: Card[], trump: Suit): Card | null {
		let suitCounts: number[] = [];
		let hasAce: boolean[] = [];
		let lowestCards: Card[] = [];
		for (let suit of this.suits) {
			suitCounts[suit] = 0;
			hasAce[suit] = false;
		}

		for (let card of hand) {
			suitCounts[card.suit]++;
			if (card.rank === Rank.Ace) {
				hasAce[card.suit] = true;
			}
			if (!lowestCards[card.suit] || lowestCards[card.suit].rank > card.rank) {
				lowestCards[card.suit] = card;
			}
		}

		let lowestCard: Card | null = null;
		for (let suit of this.suits) {
			if (suitCounts[suit] == 1 && !hasAce[suit]) {
				if (!lowestCard || lowestCard.rank > lowestCards[suit].rank) {
					lowestCard = lowestCards[suit];
				}
			}
		}
		if (lowestCard) {
			return lowestCard;
		}

		//TODO: handle this case better
		return getWorstCard(hand, undefined, trump);
	}

	public pickTrump(hand: Card[], _trumpCandidate: Card): Suit | null {
		let suitResults: number[] = [];
		for (let suit of this.suits) {
			let counts = {
				offAceCount: 0,
				suitCount: 0,
				trumpCount: 0,
			}
			let hasSuit: boolean[] = [];
			for (let suit of this.suits) {
				hasSuit[suit] = false;
			}
			let hasTrump: boolean[] = [];
			for (let rank of this.ranks) {
				hasTrump[rank] = false;
			}

			for (let card of hand) {
				this.evaluateCard(card, suit, hasTrump, hasSuit, counts);
			}

			if (counts.trumpCount >= 4) {
				suitResults[suit] = 3;
			} else if (hasTrump[Rank.Right]) {
				if (counts.trumpCount >= 3) {
					suitResults[suit] = 2;
				}
				if (counts.trumpCount >= 2 && counts.offAceCount >= 1
					&& counts.suitCount <= 3) {
					suitResults[suit] = 1;
				}
			} else {
				suitResults[suit] = 0;
			}
		}
		for (let minValue = 3; minValue > 0; minValue--) {
			for (let suit of this.suits) {
				if (suitResults[suit] >= minValue) {
					this.goAlone = this.shouldGoAlone(hand, suit);
					return suit;
				}
			}
		}
		return null;
	}

	public chooseGoAlone(_hand: Card[], _trump: Suit): boolean {
		return this.goAlone;
	}

	public pickCard(hand: Card[], maker: Player, trump: Suit, trickSoFar: PlayedCard[]): Card | null {
		let shouldLeadTrump = false;
		if (!this.trumpHasBeenLead) {
			shouldLeadTrump = maker === this.me || maker === getPartner(this.me);
		}
		if (trickSoFar.length > 0) {
			let trickSuit: Suit = trickSoFar[0].card.suit;
			if (trickSuit === trump) {
				this.trumpHasBeenLead = true;
			}
			let {player, card} = getBestCardPlayed(trickSoFar, trump) as PlayedCard;
			if (player == getPartner(this.me)) {
				if (card.rank == Rank.Ace) {
					return getWorstCard(hand, trickSuit, trump, true);
				}
			}
			let bestCard = getBestCardInHand(hand, trickSuit, trump) as Card;
			if (greaterCard(bestCard, card, trickSuit, trump) === bestCard) {
				return bestCard;
			} else {
				return getWorstCard(hand, trickSuit, trump, true);
			}
		} else {
			if (shouldLeadTrump) {
				if (maker == this.me) {
					let maxTrump: Card | null = null;
					for (let card of hand) {
						if (isTrump(card, trump)) {
							if (!maxTrump || maxTrump.rank < card.rank) {
								maxTrump = card;
							}
						}
					}
					if (maxTrump) {
						this.trumpHasBeenLead = true;
						return maxTrump;
					}
				} else {
					let minTrump: Card | null = null;
					for (let card of hand) {
						if (isTrump(card, trump)) {
							if (!minTrump || minTrump.rank > card.rank) {
								minTrump = card;
							}
						}
					}
					if (minTrump) {
						this.trumpHasBeenLead = true;
						return minTrump;
					}
				}
			}
			return getBestCardInHand(hand);
		}
	}

	trickEnd(_playedCardsCallback: () => PlayedCard[]): void { }

	private evaluateCard(card: Card, trump: Suit,
		hasTrump: boolean[], hasSuit: boolean[],
		counts: { trumpCount: number, offAceCount: number, suitCount: number }):
		void {
		if (card.rank === Rank.Jack) {
			if (card.suit === trump) {
				hasTrump[Rank.Right] = true;
				counts.trumpCount++;
			} else if (card.suit === getOppositeSuit(trump)) {
				hasTrump[Rank.Left] = true;
				counts.trumpCount++;
			}
		} else if (card.suit === trump) {
			hasTrump[card.rank] = true;
			counts.trumpCount++;
		} else if (card.rank === Rank.Ace) {
			counts.offAceCount++;
		}
		if (!hasSuit[card.suit]) {
			hasSuit[card.suit] = true;
			counts.suitCount++;
		}
	}

	private shouldGoAlone(hand: Card[], suit: Suit): boolean {
		let hasHighestCard: boolean[] = []
		let loserCounts: number[] = [];
		for (let i = 0; i < 4; i++) {
			hasHighestCard[i] = false;
			loserCounts[i] = 0;
		}
		for (let card of hand) {
			if (card.suit === suit) {
				if (card.rank === Rank.Jack) {
					hasHighestCard[card.suit] = true;
				}
			} else if (card.suit === getOppositeSuit(suit) && card.rank === Rank.Jack) {
				// Nothing to do
			} else if (card.rank === Rank.Ace) {
				hasHighestCard[card.suit] = true;
			} else {
				let losesBy = Rank.Ace - card.rank;
				if (loserCounts[card.suit] === 0 || loserCounts[card.suit] > losesBy)
					loserCounts[card.suit] = losesBy;
			}
		}
		let loserCount = 0;
		for (let i = 0; i < 4; i++) {
			if (!hasHighestCard[i]) {
				loserCount += loserCounts[i]
			}
		}
		return loserCount <= 1;
	}
}
