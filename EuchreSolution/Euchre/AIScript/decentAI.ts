/******************************************************
/* Bids if it has 3+ of the suit (including left, but not including pickup if first round dealer)
/* Will play the the lowest card that can beat all cards played so far
/* If last player and partner is winning, sluff
/*******************************************************/
class DecentAI implements EuchreAI {
	private hand: Card[];
	private handStrength: number;
	private trickSuit: Suit;
	private trumpSuit: Suit;

	init(): void {
		this.hand = game.myHand();
		this.trickSuit = game.getTrickSuit();
		this.trumpSuit = game.getTrumpSuit();
		this.handStrength = this.calculateHandStrength(this.trumpSuit);
	}

	chooseOrderUp(): boolean {
		if (this.handStrength > 2) return true;
		return false;
	}

	pickDiscard(): Card {
		return getWorstCard(this.hand, this.trickSuit, this.trumpSuit);
	}

	pickTrump(): Suit {
		if (this.trumpSuit !== Suit.Clubs) {
			this.handStrength = this.calculateHandStrength(Suit.Clubs);
			if (this.handStrength > 2) return Suit.Clubs;
		}

		if (this.trumpSuit !== Suit.Diamonds) {
			this.handStrength = this.calculateHandStrength(Suit.Diamonds);
			if (this.handStrength > 2) return Suit.Diamonds;
		}

		if (this.trumpSuit !== Suit.Spades) {
			this.handStrength = this.calculateHandStrength(Suit.Spades);
			if (this.handStrength > 2) return Suit.Spades;
		}

		if (this.trumpSuit !== Suit.Hearts) {
			this.handStrength = this.calculateHandStrength(Suit.Hearts);
			if (this.handStrength > 2) return Suit.Hearts;
		}

		return null;
	}

	chooseGoAlone(): boolean {
		if (this.handStrength > 150) return true;
		return false;
	}

	pickCard(): Card {
		let numPlayersPlayed;
		let playedCards;
		let lowestWinningCard = null;
		let lowestWinningValue = 9999;
		let winningValue = 0;
		let value;
		let i;
		let trickSuit = game.getTrickSuit();
		let trumpSuit = game.getTrumpSuit();

		this.hand = game.myHand(); //you need to do this or else

		numPlayersPlayed = game.getTrickPlayersPlayed();
		if (numPlayersPlayed === 0) {
			return getBestCardInHand(this.hand, trickSuit, trumpSuit)[0];
		}

		//Find currently winning value
		playedCards = game.getTrickPlayedCards();
		winningValue = getCardValue(getBestCardPlayed(playedCards, trumpSuit).card, trumpSuit);

		//I'm the last player
		if (numPlayersPlayed === 3) {
			//if partner is winning, sluff
			//Implement later
		}

		//If not last player, play the lowest card that can win
		//If we can't win, then sluff
		for (i = 0; i < this.hand.length; i++) {
			if (!isValidPlay(this.hand, this.hand[i], trickSuit)) continue;
			value = getCardValue(this.hand[i], trickSuit, trumpSuit);
			if (value > winningValue) {
				if (value < lowestWinningValue) {
					lowestWinningCard = this.hand[i];
					lowestWinningValue = value;
				}
			}
		}

		if (lowestWinningCard) {
			return lowestWinningCard;
		}
		else {
			return getWorstCard(this.hand, trickSuit, trumpSuit);
		}
	}

	trickEnd(): void {
		return;
	}
	//Whatever just count trump
	calculateHandStrength = function (trumpSuit) {
		let smartlyCalculatedValue;

		smartlyCalculatedValue = numCardsOfSuit(this.hand, trumpSuit);
		if (this.theyHaveTheLeft(trumpSuit)) {
			smartlyCalculatedValue++;
		}

		//just number of trump you're holding yay
		return smartlyCalculatedValue;
	}

	theyHaveTheLeft = function (trumpSuit) {
		for (let i = 0; i < this.hand.length; i++) {
			if (this.hand[i].rank === Rank.Jack
				&& this.hand[i].suit === getOppositeSuit(trumpSuit)) {
				return true;
			}
		}
		return false;
	}


}
