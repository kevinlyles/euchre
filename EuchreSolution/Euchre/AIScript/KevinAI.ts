class KevinAI implements EuchreAI {
	private me: Player;
	private trumpHasBeenLead = false;
	//TODO: use the global array instead
	private ranks = [Rank.Right, Rank.Left, Rank.Ace, Rank.King, Rank.Queen, Rank.Ten, Rank.Nine];

	public init(): void {
		this.trumpHasBeenLead = false;
		this.me = me();
	}

	public chooseOrderUp(): boolean {
		let hand: Card[] = game.myHand();
		let trumpCandidate = game.getTrumpCandidateCard() as Card;
		let dealer = game.getDealer();
		let amDealer = this.me === dealer;
		let goesToPartner = getPartner(this.me) === dealer;

		if (amDealer) {
			hand.push(trumpCandidate);
		}

		let suitScores = this.evaluateSuits(hand, !amDealer && !goesToPartner);
		if (nextPlayer(dealer) === this.me) {
			let maxScore = -1;
			let maxSuit = Suit.Clubs;
			for (let suit of suitsArray) {
				if (suitScores[suit] > maxScore) {
					maxScore = suitScores[suit];
					maxSuit = suit;
				}
			}
			return maxSuit == trumpCandidate.suit;
		}
		return suitScores[trumpCandidate.suit] > 0;
	}

	public pickDiscard(): Card | null {
		let hand = game.myHand();
		let trumpSuit = game.getTrumpSuit();
		let suitCounts: number[] = [];
		let hasAce: boolean[] = [];
		let lowestCards: Card[] = [];
		for (let suit of suitsArray) {
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
		for (let suit of suitsArray) {
			if (suit === trumpSuit || lowestCards[suit] === undefined) {
				continue;
			}
			if (suitCounts[suit] == 1 && !hasAce[suit]) {
				if (!lowestCard || lowestCard.rank > lowestCards[suit].rank) {
					lowestCard = lowestCards[suit];
				}
			}
		}
		if (lowestCard) {
			return lowestCard;
		}
		for (let suit of suitsArray) {
			if (suit === trumpSuit || lowestCards[suit] === undefined) {
				continue;
			}
			if (!hasAce[suit]) {
				if (!lowestCard || lowestCard.rank > lowestCards[suit].rank) {
					lowestCard = lowestCards[suit];
				}
			}
		}
		if (lowestCard) {
			return lowestCard;
		}
		for (let suit of suitsArray) {
			if (suit === trumpSuit || lowestCards[suit] === undefined) {
				continue;
			}
			if (!lowestCard || lowestCard.rank > lowestCards[suit].rank) {
				lowestCard = lowestCards[suit];
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
		let trumpCandidate = game.getTrumpCandidateCard() as Card;

		let suitResults = this.evaluateSuits(hand);

		for (let minValue = 3; minValue > 0; minValue--) {
			for (let suit of suitsArray) {
				if (suit === trumpCandidate.suit) {
					continue;
				}
				if (suitResults[suit] >= minValue) {
					return suit;
				}
			}
		}
		return null;
	}

	public chooseGoAlone(): boolean {
		let hand = game.myHand();
		let trumpSuit = game.getTrumpSuit() as Suit;
		let hasHighestCard: boolean[] = []
		let loserCounts: number[] = [];
		for (let i = 0; i < 4; i++) {
			hasHighestCard[i] = false;
			loserCounts[i] = 0;
		}
		for (let card of hand) {
			if (card.suit === trumpSuit) {
				if (card.rank === Rank.Jack) {
					hasHighestCard[card.suit] = true;
				}
			} else if (card.suit === getOppositeSuit(trumpSuit) && card.rank === Rank.Jack) {
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

	public pickCard(): Card | null {
		let hand = game.myHand();
		let maker = game.getMaker();
		let trump = game.getTrumpSuit() as Suit;
		let playedCards = game.getTrickPlayedCards();
		let shouldLeadTrump = false;
		if (!this.trumpHasBeenLead) {
			shouldLeadTrump = maker === this.me || maker === getPartner(this.me);
		}
		if (playedCards.length > 0) {
			let trickSuit = game.getTrickSuit() as Suit;
			if (playedCards[0].card.suit === trump) {
				this.trumpHasBeenLead = true;
			}
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

	private evaluateSuits(hand: Card[], givingAwayTrump?: boolean): number[] {
		let suitScore: number[] = [];
		for (let suit of suitsArray) {
			let counts = {
				offAceCount: 0,
				suitCount: 0,
				trumpCount: 0,
			}
			let hasSuit: boolean[] = [];
			for (let suit of suitsArray) {
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
				suitScore[suit] = 3;
			} else if (hasTrump[Rank.Right]) {
				if (counts.trumpCount >= 3) {
					suitScore[suit] = 2;
				} else if (!givingAwayTrump) {
					if (counts.trumpCount >= 2 && counts.offAceCount >= 1
						&& counts.suitCount <= 3) {
						suitScore[suit] = 1;
					} else if (counts.trumpCount >= 2 && counts.offAceCount >= 2) {
						suitScore[suit] = 1;
					} else {
						suitScore[suit] = 0;
					}
				} else {
					suitScore[suit] = 0;
				}
			} else {
				suitScore[suit] = 0;
			}
		}
		return suitScore;
	}
}
