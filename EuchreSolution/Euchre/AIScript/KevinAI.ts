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
		const hasSuit: boolean[] = [];
		for (const suit of this.suits) {
			hasSuit[suit] = false;
		}
		const counts = {
			offAceCount: 0,
			suitCount: 0,
			trumpCount: 0,
		};
		const hasTrump: boolean[] = [];
		for (const rank of this.ranks) {
			hasTrump[rank] = false;
		}

		for (const card of hand) {
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
		const suitCounts: number[] = [];
		const hasAce: boolean[] = [];
		const lowestCards: Card[] = [];
		for (const suit of this.suits) {
			suitCounts[suit] = 0;
			hasAce[suit] = false;
		}

		for (const card of hand) {
			suitCounts[card.suit]++;
			if (card.rank === Rank.Ace) {
				hasAce[card.suit] = true;
			}
			if (!lowestCards[card.suit] || lowestCards[card.suit].rank > card.rank) {
				lowestCards[card.suit] = card;
			}
		}

		let lowestCard: Card | null = null;
		for (const suit of this.suits) {
			if (suitCounts[suit] === 1 && !hasAce[suit]) {
				if (!lowestCard || lowestCard.rank > lowestCards[suit].rank) {
					lowestCard = lowestCards[suit];
				}
			}
		}
		if (lowestCard) {
			return lowestCard;
		}

		//TODO: handle this case better
		return getWorstCardInHand(hand, undefined, trump);
	}

	public pickTrump(hand: Card[], trumpCandidate: Card): Suit | null {
		const suitResults: number[] = [];
		for (const suit of this.suits) {
			const counts = {
				offAceCount: 0,
				suitCount: 0,
				trumpCount: 0,
			};
			const hasSuit: boolean[] = [];
			for (const clearSuit of this.suits) {
				hasSuit[clearSuit] = false;
			}
			const hasTrump: boolean[] = [];
			for (const rank of this.ranks) {
				hasTrump[rank] = false;
			}

			for (const card of hand) {
				this.evaluateCard(card, trumpCandidate.suit, hasTrump, hasSuit, counts);
			}

			if (this.amDealer) {
				this.evaluateCard(trumpCandidate, trumpCandidate.suit, hasTrump,
					hasSuit, counts);
			}

			//TODO: set goAlone
			if (counts.trumpCount >= 4) {
				suitResults[suit] = 3;
			}
			if (hasTrump[Rank.Right]) {
				if (counts.trumpCount >= 3) {
					suitResults[suit] = 2;
				}
				if (counts.trumpCount >= 2 && counts.offAceCount >= 1
					&& counts.suitCount <= 3) {
					suitResults[suit] = 1;
				}
			}
			suitResults[suit] = 0;
		}
		for (let minValue = 3; minValue > 0; minValue--) {
			for (const suit of this.suits) {
				if (suitResults[suit] >= minValue) {
					return suit;
				}
			}
		}
		return null;
	}

	public chooseGoAlone(_hand: Card[], _trump: Suit): boolean {
		animShowText("***KJL: skipped going alone", MessageLevel.Step);
		return this.goAlone;
	}

	public pickCard(hand: Card[], maker: Player, trump: Suit, trickSoFar: PlayedCard[]): Card | null {
		let shouldLeadTrump = false;
		if (!this.trumpHasBeenLead) {
			shouldLeadTrump = maker === this.me || maker === getPartner(this.me);
		}
		if (trickSoFar.length > 0) {
			const trickSuit: Suit = trickSoFar[0].card.suit;
			if (trickSuit === trump) {
				this.trumpHasBeenLead = true;
			}
			const { player, card } = getBestCardPlayed(trickSoFar, trump) as PlayedCard;
			if (player === getPartner(this.me)) {
				if (card.rank === Rank.Ace) {
					return getWorstCardInHand(hand, trickSuit, trump);
				}
			}
			const bestCard = getBestCardInHand(hand, trickSuit, trump) as Card;
			if (greaterCard(bestCard, card, trickSuit, trump) === bestCard) {
				return bestCard;
			} else {
				return getWorstCardInHand(hand, trickSuit, trump);
			}
		} else {
			if (shouldLeadTrump) {
				if (maker === this.me) {
					let maxTrump: Card | null = null;
					for (const card of hand) {
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
					for (const card of hand) {
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

	// tslint:disable-next-line:no-empty
	public trickEnd(_playedCardsCallback: () => PlayedCard[]): void { }

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
}
