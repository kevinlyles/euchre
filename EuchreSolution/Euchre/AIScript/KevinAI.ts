class KevinAI implements EuchreAI {
	private me: Player;
	private trumpHasBeenLead = false;
	//TODO: use the global array instead
	private ranks = [Rank.Right, Rank.Left, Rank.Ace, Rank.King, Rank.Queen, Rank.Ten, Rank.Nine];

	public init(me: Player): void {
		this.trumpHasBeenLead = false;
		this.me = me;
	}

	public chooseOrderUp(hand: Card[], trumpCandidate: Card, dealer: Player): boolean {
		const amDealer = this.me === dealer;
		const goesToPartner = getPartner(this.me) === dealer;

		if (amDealer) {
			hand.push(trumpCandidate);
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

	public pickDiscard(hand: Card[], trump: Suit): Card | null {
		const suitCounts: number[] = [0, 0, 0, 0];
		const hasAce: boolean[] = [false, false, false, false];
		const lowestCards: (Card | null)[] = [null, null, null, null];

		for (const card of hand) {
			if (card.rank === Rank.Jack) {
				if (card.suit === trump || card.suit === getOppositeSuit(trump)) {
					suitCounts[trump]++;
					continue;
				}
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

		let lowestCard: Card | null = null;
		for (const suit of suitsArray) {
			const lowestCardInSuit = lowestCards[suit];
			if (suit === trump || !lowestCardInSuit) {
				continue;
			}
			if (suitCounts[suit] === 1 && !hasAce[suit]) {
				if (!lowestCard || lowestCard.rank > lowestCardInSuit.rank) {
					lowestCard = lowestCardInSuit;
				}
			}
		}
		if (lowestCard) {
			return lowestCard;
		}

		for (const suit of suitsArray) {
			const lowestCardInSuit = lowestCards[suit];
			if (suit === trump || !lowestCardInSuit) {
				continue;
			}
			if (!hasAce[suit]) {
				if (!lowestCard || lowestCard.rank > lowestCardInSuit.rank) {
					lowestCard = lowestCardInSuit;
				}
			}
		}
		if (lowestCard) {
			return lowestCard;
		}

		for (const suit of suitsArray) {
			const lowestCardInSuit = lowestCards[suit];
			if (suit === trump || !lowestCardInSuit) {
				continue;
			}
			if (!lowestCard || lowestCard.rank > lowestCardInSuit.rank) {
				lowestCard = lowestCardInSuit;
			}
		}
		if (lowestCard) {
			return lowestCard;
		}

		for (const suit of suitsArray) {
			const lowestCardInSuit = lowestCards[suit];
			if (!lowestCardInSuit) {
				continue;
			}
			if (!lowestCard || lowestCard.rank > lowestCardInSuit.rank) {
				lowestCard = lowestCardInSuit;
			}
		}
		if (lowestCard) {
			return lowestCard;
		}

		//TODO: handle this case better
		return getWorstCardInHand(hand, undefined, trump);
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

	public chooseGoAlone(hand: Card[], trump: Suit): boolean {
		const hasHighestCard: boolean[] = [false, false, false, false];
		const loserCounts: number[] = [0, 0, 0, 0];
		let trumpCount = 0;
		for (const card of hand) {
			if (card.suit === trump) {
				trumpCount++;
				if (card.rank === Rank.Jack) {
					hasHighestCard[card.suit] = true;
				} else {
					const losesBy = Rank.Right - card.rank;
					if (loserCounts[card.suit] === 0 || loserCounts[card.suit] > losesBy) {
						loserCounts[card.suit] = losesBy;
					}
				}
			} else if (card.suit === getOppositeSuit(trump) && card.rank === Rank.Jack) {
				trumpCount++;
				loserCounts[trump] = 1;
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

	// Assumes that the trump suit will never match the buried card's suit
	private adjustHand(hand: Card[], trump: Suit, buriedCard?: Card): Card[] {
		if (!buriedCard) {
			return hand;
		}

		const buriedCardIsLeft = buriedCard.suit === getOppositeSuit(trump) && buriedCard.rank === Rank.Jack;
		const adjustedHand: Card[] = [];
		for (const card of hand) {
			if (card.suit === buriedCard.suit) {
				if (card.rank > buriedCard.rank || (card.suit === getOppositeSuit(trump) && card.rank === Rank.Jack)) {
					adjustedHand.push(card);
				} else {
					adjustedHand.push(new Card(card.suit, card.rank + 1));
				}
			} else if (card.suit === trump && buriedCardIsLeft) {
				if (card.rank > buriedCard.rank || card.rank === Rank.Jack) {
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
			const hasSuit: boolean[] = [];
			for (const clearSuit of suitsArray) {
				hasSuit[clearSuit] = false;
			}
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
}
