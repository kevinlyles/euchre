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

	//TODO: remove this once the game (and the tests) do it for us
	private pickItUp(hand: Card[], trumpCandidateCard: Card): Card[] {
		let found = false;
		for (let i = 0; i < hand.length; i++) {
			if (hand[i].id === trumpCandidateCard.id) {
				found = true;
				break;
			}
		}
		if (!found) {
			hand.push(trumpCandidateCard);
		}
		return hand;
	}

	//TODO: remove this once the game (and the tests) do it for us
	private pickItUpAndDiscard(hand: Card[], trumpCandidateCard: Card): Card[] {
		hand = this.pickItUp(hand, trumpCandidateCard);
		if (hand.length > 5) {
			let discard = this.pickDiscardWithHand(hand) as Card;
			for (let i = 0; i < hand.length; i++) {
				if (hand[i].id === discard.id) {
					hand.splice(i, 1);
					break;
				}
			}
		}
		return hand;
	}

	public pickDiscard(): Card | null {
		let hand = game.myHand();
		let trumpCandidateCard = game.getTrumpCandidateCard() as Card;
		hand = this.pickItUp(hand, trumpCandidateCard);
		return this.pickDiscardWithHand(hand);
	}

	private pickDiscardWithHand(hand: Card[]): Card {
		let trumpSuit = game.getTrumpSuit() as Suit;

		let {lowestCards, suitCounts, hasAce} = this.analyzeSuits(hand, trumpSuit);

		let filters: ((suit: Suit) => boolean)[] = [
			(suit: Suit) => suitCounts[suit] == 1 && !hasAce[suit],
			(suit: Suit) => !hasAce[suit],
			(_) => true,
		];

		for (let i = 0; i < filters.length; i++) {
			let lowestCard = this.filterCards(lowestCards, trumpSuit, filters[i]);
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

	private analyzeSuits(hand: Card[], trumpSuit: Suit):
		{ suitCounts: number[], hasAce: boolean[], lowestCards: (Card | null)[] } {
		let suitCounts: number[] = [0, 0, 0, 0];
		let hasAce: boolean[] = [false, false, false, false];
		let lowestCards: (Card | null)[] = [null, null, null, null];

		for (let card of hand) {
			if (card.rank === Rank.Jack) {
				if (card.suit === trumpSuit || card.suit === getOppositeSuit(trumpSuit)) {
					suitCounts[trumpSuit]++;
					continue;
				}
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

	public pickTrump(): Suit | null {
		let hand: Card[] = game.myHand();
		let trumpCandidate = game.getTrumpCandidateCard();

		let suitResults = this.evaluateSuits(hand, false, trumpCandidate);

		for (let minValue = 3; minValue > 0; minValue--) {
			for (let suit of suitsArray) {
				if (suitResults[suit] >= minValue) {
					return suit;
				}
			}
		}
		return null;
	}

	//TODO: split this up
	public chooseGoAlone(): boolean {
		let hand = game.myHand();
		let trumpCandidateCard = game.getTrumpCandidateCard() as Card;
		let trumpSuit = game.getTrumpSuit() as Suit;
		let amDealer = isDealer(me());
		let hasHighestCard: boolean[] = [false, false, false, false]
		let loserCounts: number[] = [0, 0, 0, 0];
		let trumpCount = 0;

		if (amDealer && trumpCandidateCard.suit === trumpSuit) {
			hand = this.pickItUpAndDiscard(hand, trumpCandidateCard);
		} else if (trumpCandidateCard.suit !== trumpSuit) {
			hand = this.adjustHand(hand, trumpSuit, trumpCandidateCard)
		}

		for (let card of hand) {
			if (card.suit === trumpSuit) {
				trumpCount++;
				if (card.rank === Rank.Jack) {
					hasHighestCard[card.suit] = true;
				} else {
					let losesBy = Rank.Right - card.rank;
					if (loserCounts[card.suit] === 0 || loserCounts[card.suit] > losesBy) {
						loserCounts[card.suit] = losesBy;
					}
				}
			} else if (card.suit === getOppositeSuit(trumpSuit) && card.rank === Rank.Jack) {
				trumpCount++;
				loserCounts[trumpSuit] = 1;
			} else if (card.rank === Rank.Ace) {
				hasHighestCard[card.suit] = true;
			} else {
				let losesBy = Rank.Ace - card.rank;
				if (loserCounts[card.suit] === 0 || loserCounts[card.suit] > losesBy) {
					loserCounts[card.suit] = losesBy;
				}
			}
		}
		let loserCount = 0;
		for (let i = 0; i < 4; i++) {
			if (!hasHighestCard[i]) {
				loserCount += loserCounts[i]
			}
		}
		let hasBothBowers = hasHighestCard[trumpSuit] && loserCounts[trumpSuit] === 1;
		return loserCount <= 0 || (loserCount === 1 && (trumpCount >= 4 || hasBothBowers));
	}

	//TODO: split this up
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

	// Assumes that the trump suit will never match the buried card's suit
	private adjustHand(hand: Card[], trumpSuit: Suit, buriedCard?: Card): Card[] {
		if (!buriedCard) {
			return hand;
		}

		let buriedCardIsLeft = buriedCard.suit === getOppositeSuit(trumpSuit) && buriedCard.rank === Rank.Jack;
		let adjustedHand: Card[] = [];
		for (let card of hand) {
			if (card.suit === buriedCard.suit) {
				if (card.rank > buriedCard.rank || (card.suit === getOppositeSuit(trumpSuit) && card.rank === Rank.Jack)) {
					adjustedHand.push(card);
				} else {
					adjustedHand.push(new Card(card.suit, card.rank + 1));
				}
			} else if (card.suit === trumpSuit && buriedCardIsLeft) {
				if (card.rank === Rank.Jack) {
					adjustedHand.push(card);
				} else {
					adjustedHand.push(new Card(card.suit, card.rank + 1));
				}
			} else {
				adjustedHand.push(card);
			}
		}
		return adjustedHand;
	}

	private evaluateSuits(hand: Card[], givingAwayTrump: boolean, knownBuriedCard?: Card): number[] {
		let suitScore: number[] = [0, 0, 0, 0];
		for (let suit of suitsArray) {
			if (knownBuriedCard && suit === knownBuriedCard.suit) {
				continue;
			}
			let adjustedHand = this.adjustHand(hand, suit, knownBuriedCard);
			let counts = {
				offAceCount: 0,
				suitCount: 0,
				trumpCount: 0,
			}
			let hasSuit: boolean[] = [false, false, false, false];
			let hasTrump: boolean[] = [];
			for (let rank of this.ranks) {
				hasTrump[rank] = false;
			}

			for (let card of adjustedHand) {
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
					}
				}
			}
		}
		return suitScore;
	}
}
