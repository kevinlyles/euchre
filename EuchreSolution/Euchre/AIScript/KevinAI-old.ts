class KevinAIOld implements EuchreAI {
	private me: Player;
	private trumpHasBeenLead: boolean;
	private trumpCandidate: Card;
	//TODO: use the global array instead
	private ranks = [Rank.Right, Rank.Left, Rank.Ace, Rank.King, Rank.Queen, Rank.Ten, Rank.Nine];

	public init(me: Player): void {
		this.trumpHasBeenLead = false;
		this.me = me;
	}

	public chooseOrderUp(hand: Card[], trumpCandidate: Card, dealer: Player): boolean {
		this.trumpCandidate = trumpCandidate;
		const amDealer = this.me === dealer;
		const goesToPartner = getPartner(this.me) === dealer;

		if (amDealer) {
			hand.push(trumpCandidate);
			const discard = this.pickDiscard(hand, trumpCandidate.suit);
			for (let i = 0; i < hand.length; i++) {
				if (discard.id === hand[i].id) {
					hand.splice(i, 1);
					break;
				}
			}
		}

		const suitScores = this.evaluateSuits(hand, !amDealer && !goesToPartner);
		if (nextPlayer(dealer) === this.me) {
			let maxScore = -1;
			let maxSuit = Suit.Clubs;
			for (const suit of suitsArray) {
				if (suitScores[suit] > maxScore) {
					maxScore = suitScores[suit];
					maxSuit = suit;
				}
			}
			return maxSuit === trumpCandidate.suit;
		}
		return suitScores[trumpCandidate.suit] > 0;
	}

	private doDiscard(hand: Card[], trump: Suit): Card[] {
		if (hand.length > 5) {
			const discard = this.pickDiscard(hand, trump) as Card;
			for (let i = 0; i < hand.length; i++) {
				if (hand[i].id === discard.id) {
					hand.splice(i, 1);
					break;
				}
			}
		}
		return hand;
	}

	public pickDiscard(hand: Card[], trump: Suit): Card {
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

	public pickTrump(hand: Card[], trumpCandidate: Card): Suit | null {
		const suitResults = this.evaluateSuits(hand, false, trumpCandidate);

		for (let minValue = 3; minValue > 0; minValue--) {
			for (const suit of suitsArray) {
				if (suitResults[suit] >= minValue) {
					return suit;
				}
			}
		}
		return null;
	}

	//TODO: split this up
	public chooseGoAlone(hand: Card[], trump: Suit): boolean {
		const hasHighestCard: boolean[] = [false, false, false, false];
		const loserCounts: number[] = [0, 0, 0, 0];
		let trumpCount = 0;

		let buriedCard: Card | undefined;
		if (this.trumpCandidate.suit !== trump) {
			buriedCard = this.trumpCandidate;
		}
		for (const card of this.adjustHand(this.doDiscard(hand, trump), trump, buriedCard)) {
			if (card.suit === trump) {
				trumpCount++;
				if (this.isRight(card, trump)) {
					hasHighestCard[card.suit] = true;
				} else {
					const losesBy = Rank.Right - card.rank;
					if (loserCounts[card.suit] === 0 || loserCounts[card.suit] > losesBy) {
						loserCounts[card.suit] = losesBy;
					}
				}
			} else if (card.rank === Rank.Ace) {
				hasHighestCard[card.suit] = true;
			} else {
				const losesBy = Rank.Ace - card.rank;
				if (loserCounts[card.suit] === 0 || loserCounts[card.suit] > losesBy) {
					loserCounts[card.suit] = losesBy;
				}
			}
		}
		let loserCount = 0;
		for (let i = 0; i < 4; i++) {
			if (!hasHighestCard[i]) {
				loserCount += loserCounts[i];
			}
		}
		const hasBothBowers = hasHighestCard[trump] && loserCounts[trump] === 1;
		return loserCount <= 0 || (loserCount === 1 && (trumpCount >= 4 || hasBothBowers));
	}

	//TODO: split this up
	public pickCard(hand: Card[], maker: Player, trump: Suit, trickSoFar: PlayedCard[]): Card | null {
		let shouldLeadTrump = false;
		if (!this.trumpHasBeenLead) {
			shouldLeadTrump = maker === this.me || maker === getPartner(this.me);
		}
		if (trickSoFar.length > 0) {
			const trickSuit = trickSoFar[0].card.suit;
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
		if (this.isRight(card, trump)) {
			hasTrump[Rank.Right] = true;
			counts.trumpCount++;
		} else if (this.isLeft(card, trump)) {
			hasTrump[Rank.Left] = true;
			counts.trumpCount++;
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

	// Assumes that the trump suit will never match the buried card's suit
	private adjustHand(hand: Card[], trump: Suit, buriedCard?: Card): Card[] {
		if (!buriedCard) {
			return hand;
		}

		const buriedCardIsLeft = this.isLeft(buriedCard, trump);
		const adjustedHand: Card[] = [];
		for (const card of hand) {
			if (card.suit === buriedCard.suit) {
				if (card.rank > buriedCard.rank || this.isLeft(card, trump)) {
					adjustedHand.push(card);
				} else {
					adjustedHand.push(new Card(card.suit, card.rank + 1));
				}
			} else if (card.suit === trump && buriedCardIsLeft) {
				if (this.isRight(card, trump)) {
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
		const suitScore: number[] = [0, 0, 0, 0];
		for (const suit of suitsArray) {
			if (knownBuriedCard && suit === knownBuriedCard.suit) {
				continue;
			}
			const adjustedHand = this.adjustHand(hand, suit, knownBuriedCard);
			const counts = {
				offAceCount: 0,
				suitCount: 0,
				trumpCount: 0,
			};
			const hasSuit: boolean[] = [false, false, false, false];
			const hasTrump: boolean[] = [];
			for (const rank of this.ranks) {
				hasTrump[rank] = false;
			}

			for (const card of adjustedHand) {
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
