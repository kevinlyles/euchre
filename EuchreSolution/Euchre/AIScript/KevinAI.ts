class KevinAI implements EuchreAI {
	private me: Player;
	private goAlone = false;
	private trumpHasBeenLead = false;
	//TODO: use the global array instead
	private suits = [Suit.Clubs, Suit.Diamonds, Suit.Hearts, Suit.Spades];
	private ranks = [Rank.Right, Rank.Left, Rank.Ace, Rank.King, Rank.Queen, Rank.Ten, Rank.Nine];

	public init(): void {
		this.trumpHasBeenLead = false;
		this.me = me();
		return;
	}

	public chooseOrderUp(): boolean {
		let hand: Card[] = game.myHand();
		let trumpCandidate = game.getTrumpCandidateCard() as Card;
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

		//TODO: use the new API once it exists
		let amDealer = isDealer(me());
		if (amDealer) {
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
				&& counts.suitCount <= 3 && amDealer) {
				return true;
			}
		}
		return false;
	}

	public pickDiscard(): Card | null {
		let hand = game.myHand();
		let trumpSuit = game.getTrumpSuit();
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
		return getWorstCard(hand, undefined, trumpSuit);
	}

	public pickTrump(): Suit | null {
		let hand: Card[] = game.myHand();
		let suitResults: number[] = [];
		for (let suit of this.suits) {
			let trumpCandidate = game.getTrumpCandidateCard() as Card;
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
				this.evaluateCard(card, trumpCandidate.suit, hasTrump, hasSuit, counts);
			}

			//TODO: use the new API once it exists 
			let amDealer = isDealer(me());
			if (amDealer) {
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
			for (let suit of this.suits) {
				if (suitResults[suit] >= minValue) {
					return suit;
				}
			}
		}
		return null;
	}

	public chooseGoAlone(): boolean {
		animShowText("***KJL: skipped going alone", MessageLevel.Step);
		return this.goAlone;
	}

	public pickCard(): Card | null {
		let hand = game.myHand();
		let maker = game.getMaker();
		let trump = game.getTrumpSuit() as Suit;
		let shouldLeadTrump = false;
		if (!this.trumpHasBeenLead) {
			shouldLeadTrump = maker === this.me || maker === getPartner(this.me);
		}
		let playedCards: PlayedCard[] = game.getTrickPlayedCards();
		if (playedCards.length > 0) {
			if (playedCards[0].card.suit === trump) {
				this.trumpHasBeenLead = true;
			}
			let trickSuit: Suit = game.getTrickSuit() as Suit;
			let {player, card} = getBestCardPlayed(playedCards, trump) as PlayedCard;
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

	public trickEnd(): void {
		//TODO: implement
		return;
	}

	private evaluateCard(card: Card, trumpSuit: Suit,
		hasTrump: boolean[], hasSuit: boolean[],
		counts: { trumpCount: number, offAceCount: number, suitCount: number }):
		void {
		if (card.rank === Rank.Jack) {
			if (card.suit === trumpSuit) {
				hasTrump[Rank.Right] = true;
				counts.trumpCount++;
			} else if (card.suit === getOppositeSuit(trumpSuit)) {
				hasTrump[Rank.Left] = true;
				counts.trumpCount++;
			}
		} else if (card.suit === trumpSuit) {
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
