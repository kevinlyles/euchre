//TODO: copy everything before passing to the AIs

enum BidStage {
	Round1,
	Discard,
	Round2,
	Alone,
	Finished,
}

interface BidInitialResult {
	stage: BidStage.Round1 | BidStage.Round2;
	trump: Suit;
	maker: Player;
}

interface BidResult extends BidInitialResult {
	alone: boolean;
}

class Bid {
	private __playerHands: Card[][]; //2d array of everyone's hands
	private __jacks: Card[];
	private __dealer: Player;
	private __currentPlayer: Player;
	private __aiPlayers: (EuchreAI | null)[];
	private __stage: BidStage;
	private __playersBid: number = 0; //number of players who have bid so far
	private __trumpCandidate: Card; //turned up card
	private __bidInitialResult: BidInitialResult | null = null;
	private __bidResult: BidResult | null = null;

	/* constructor */
	constructor(hands: Card[][], jacks: Card[], aiPlayers: (EuchreAI | null)[],
		dealer: Player, trumpCandidate: Card) {
		this.__playerHands = hands;
		this.__jacks = jacks;
		this.__aiPlayers = aiPlayers;
		this.__dealer = dealer;
		this.__currentPlayer = nextPlayer(dealer);
		this.__stage = BidStage.Round1;
		this.__trumpCandidate = trumpCandidate;
	}

	private advanceBid(): void {
		let player: Player;

		switch (this.__stage) {
			case BidStage.Round1:
				this.__bidInitialResult = this.bidRound1();
				player = this.__currentPlayer;
				this.advancePlayer();
				if (this.__bidInitialResult) {
					let trump = this.__trumpCandidate.suit;
					this.setTrump(trump);
					this.pickItUp(this.__dealer, this.__trumpCandidate);
					this.__stage = BidStage.Alone;
				} else {
					animShowText(player + " passed.", MessageLevel.Step, 1);
					if (this.everyoneBid()) {
						this.__playersBid = 0;
						this.__stage = BidStage.Round2;
					}
				}
				break;
			case BidStage.Round2:
				this.__bidInitialResult = this.bidRound2();
				player = this.__currentPlayer;
				this.advancePlayer();
				if (this.__bidInitialResult) {
					this.setTrump(this.__bidInitialResult.trump);
					this.__stage = BidStage.Alone;
				} else {
					animShowText(player + " passed.", MessageLevel.Step, 1);
					if (this.everyoneBid()) {
						this.__stage = BidStage.Finished;
					}
				}
				break;
			case BidStage.Alone:
				let bidResult = this.goAlone(this.__bidInitialResult as BidInitialResult);
				this.__bidResult = bidResult
				animShowText(bidResult.maker + " " + Suit[bidResult.trump] + " " + bidResult.alone, MessageLevel.Step, 1);
				if (bidResult.stage === BidStage.Round1) {
					this.__stage = BidStage.Discard;
				} else {
					this.__stage = BidStage.Finished;
				}
				break;
			case BidStage.Discard:
				this.getDiscard(this.__dealer);
				this.__stage = BidStage.Finished;
				break;
			default:
				break;
		}
	}

	private bidRound1(): BidInitialResult | null {
		let aiPlayer = this.__aiPlayers[this.__currentPlayer];
		if (!aiPlayer) {
			return null;
		}
		let hand = this.__playerHands[this.__currentPlayer];
		let trumpCandidate = this.__trumpCandidate;
		let orderItUp = aiPlayer.chooseOrderUp(hand.slice(), trumpCandidate, this.__dealer);
		if (!orderItUp || !hasSuit(hand, trumpCandidate.suit)) {
			return null;
		}
		return {
			stage: BidStage.Round1,
			trump: trumpCandidate.suit,
			maker: this.__currentPlayer,
		}
	}

	private pickItUp(dealer: Player, trumpCandidate: Card) {
		let hand = this.__playerHands[dealer];
		hand.push(trumpCandidate);
	}

	private goAlone(bidInitialResult: BidInitialResult): BidResult {
		let bidResult = bidInitialResult as BidResult;
		let aiPlayer = this.__aiPlayers[bidResult.maker];
		if (aiPlayer) {
			let hand = this.__playerHands[bidResult.maker];
			bidResult.alone = aiPlayer.chooseGoAlone(hand, bidResult.trump);
		} else {
			bidResult.alone = false;
		}
		return bidResult;
	}

	private getDiscard(dealer: Player): void {
		let aiPlayer = this.__aiPlayers[dealer];
		let hand = this.__playerHands[dealer];
		let discard: Card | null = null;
		if (aiPlayer) {
			discard = aiPlayer.pickDiscard(hand, this.__trumpCandidate.suit);
		}
		if (!discard || !isInHand(hand, discard)) {
			discard = hand[0];
		}
		for (let i = 0; i < hand.length; i++) {
			if (hand[i].id === discard.id) {
				hand.splice(i, 1);
				break;
			}
		}
	}

	private bidRound2(): BidInitialResult | null {
		let aiPlayer = this.__aiPlayers[this.__currentPlayer];
		if (!aiPlayer) {
			return null;
		}
		let hand = this.__playerHands[this.__currentPlayer];
		let trumpCandidate = this.__trumpCandidate
		let trump = aiPlayer.pickTrump(hand, trumpCandidate);
		if (trump === null || trump === trumpCandidate.suit || !hasSuit(hand, trump)) {
			return null;
		}
		return {
			stage: BidStage.Round2,
			trump: trump,
			maker: this.__currentPlayer,
		};
	}

	private advancePlayer(): void {
		this.__currentPlayer = nextPlayer(this.__currentPlayer);
		this.__playersBid++;
	}

	private setTrump(trump: Suit) {
		let right = this.__jacks[trump];
		right.rank = Rank.Right;
		let left = this.__jacks[getOppositeSuit(trump)];
		left.suit = trump;
		left.rank = Rank.Left;
	}

	private everyoneBid() {
		return this.__playersBid === 4;
	}

	private isFinished(): boolean {
		return this.__stage === BidStage.Finished;
	}

	/* Public functions */
	public doBidding(): BidResult | null {
		while (!this.isFinished()) {
			this.advanceBid();
		}
		return this.__bidResult;
	}
}
