describe("HandSpec", function () {
	let hand: Hand;
	let aiPlayers: EuchreAI[];
	let playerHands: Card[][];
	let trumpCandidate: Card;
	let bid: Bid;

	beforeEach(function () {
		let dealer = Player.South;
		aiPlayers = [new IdiotAI(), new IdiotAI(), new IdiotAI(), new IdiotAI()];
		hand = new Hand(dealer, aiPlayers);
		playerHands = [
			[
				new Card(Suit.Spades, Rank.Jack),
				new Card(Suit.Clubs, Rank.Jack),
				new Card(Suit.Spades, Rank.Ace),
				new Card(Suit.Spades, Rank.King),
				new Card(Suit.Spades, Rank.Queen),
			],
			[
				new Card(Suit.Diamonds, Rank.Jack),
				new Card(Suit.Diamonds, Rank.Ace),
				new Card(Suit.Diamonds, Rank.King),
				new Card(Suit.Diamonds, Rank.Queen),
				new Card(Suit.Diamonds, Rank.Ten),
			],
			[
				new Card(Suit.Hearts, Rank.Ace),
				new Card(Suit.Hearts, Rank.King),
				new Card(Suit.Hearts, Rank.Queen),
				new Card(Suit.Hearts, Rank.Jack),
				new Card(Suit.Hearts, Rank.Ten),
			],
			[
				new Card(Suit.Clubs, Rank.Ace),
				new Card(Suit.Clubs, Rank.King),
				new Card(Suit.Clubs, Rank.Queen),
				new Card(Suit.Clubs, Rank.Ten),
				new Card(Suit.Spades, Rank.Nine),
			],
		];
		(hand as any).__playerHands = playerHands;
		let jacks = [
			playerHands[0][1],
			playerHands[1][0],
			playerHands[2][4],
			playerHands[0][0],
		];
		trumpCandidate = new Card(Suit.Spades, Rank.Ten);
		(hand as any).__trumpCandidate = trumpCandidate;
		bid = new Bid(playerHands, jacks, aiPlayers, Player.South, trumpCandidate);
		(hand as any).__bid = bid;
	});

	describe("Initial state", function () {
		it("handStage", function () {
			expect(hand.handStage()).toBe(HandStage.Bidding);
		});
		it("dealer", function () {
			expect(hand.dealer()).toBe(Player.South);
		});
		it("playerHands", function () {
			expect(hand.playerHands()).toBe(playerHands);
		});
		it("trumpCandidate", function () {
			expect(hand.trumpCandidate()).toBe(trumpCandidate);
		});
		it("numTricksPlayed", function () {
			expect(hand.numTricksPlayed()).toBe(0);
		});
		it("nsTricksWon", function () {
			expect(hand.nsTricksWon()).toBe(0);
		});
		it("ewTricksWon", function () {
			expect(hand.ewTricksWon()).toBe(0);
		});
		it("nsPointsWon", function () {
			expect(hand.nsPointsWon()).toBe(0);
		});
		it("ewPointsWon", function () {
			expect(hand.ewPointsWon()).toBe(0);
		});
		it("isFinished", function () {
			expect(hand.isFinished()).toBe(false);
		});
	});

	describe("No one bids", function () {
		beforeEach(function () {
			hand.doHand();
		});
		it("handStage", function () {
			expect(hand.handStage()).toBe(HandStage.Finished);
		});
		it("dealer", function () {
			expect(hand.dealer()).toBe(Player.South);
		});
		it("playerHands", function () {
			expect(hand.playerHands()).toBe(playerHands);
		});
		it("trumpCandidate", function () {
			expect(hand.trumpCandidate()).toBe(trumpCandidate);
		});
		it("numTricksPlayed", function () {
			expect(hand.numTricksPlayed()).toBe(0);
		});
		it("nsTricksWon", function () {
			expect(hand.nsTricksWon()).toBe(0);
		});
		it("ewTricksWon", function () {
			expect(hand.ewTricksWon()).toBe(0);
		});
		it("nsPointsWon", function () {
			expect(hand.nsPointsWon()).toBe(0);
		});
		it("ewPointsWon", function () {
			expect(hand.ewPointsWon()).toBe(0);
		});
		it("isFinished", function () {
			expect(hand.isFinished()).toBe(true);
		});
	});

	describe("Actually play a hand (ordered up)", function () {
		beforeEach(function () {
			spyOn(aiPlayers[0], "chooseOrderUp").and.returnValue(true);
			hand.doHand();
		});
		it("handStage", function () {
			expect(hand.handStage()).toBe(HandStage.Finished);
		});
		it("dealer", function () {
			expect(hand.dealer()).toBe(Player.South);
		});
		it("playerHands", function () {
			expect(hand.playerHands()).toBe(playerHands);
		});
		it("trumpCandidate", function () {
			expect(hand.trumpCandidate()).toBe(trumpCandidate);
		});
		it("numTricksPlayed", function () {
			expect(hand.numTricksPlayed()).toBe(5);
		});
		it("nsTricksWon", function () {
			expect(hand.nsTricksWon()).toBe(5);
		});
		it("ewTricksWon", function () {
			expect(hand.ewTricksWon()).toBe(0);
		});
		it("nsPointsWon", function () {
			expect(hand.nsPointsWon()).toBe(2);
		});
		it("ewPointsWon", function () {
			expect(hand.ewPointsWon()).toBe(0);
		});
		it("isFinished", function () {
			expect(hand.isFinished()).toBe(true);
		});
	});

	describe("Actually play a hand (ordered up alone)", function () {
		beforeEach(function () {
			spyOn(aiPlayers[0], "chooseOrderUp").and.returnValue(true);
			spyOn(aiPlayers[0], "chooseGoAlone").and.returnValue(true);
			hand.doHand();
		});
		it("handStage", function () {
			expect(hand.handStage()).toBe(HandStage.Finished);
		});
		it("dealer", function () {
			expect(hand.dealer()).toBe(Player.South);
		});
		it("playerHands", function () {
			expect(hand.playerHands()).toBe(playerHands);
		});
		it("trumpCandidate", function () {
			expect(hand.trumpCandidate()).toBe(trumpCandidate);
		});
		it("numTricksPlayed", function () {
			expect(hand.numTricksPlayed()).toBe(5);
		});
		it("nsTricksWon", function () {
			expect(hand.nsTricksWon()).toBe(5);
		});
		it("ewTricksWon", function () {
			expect(hand.ewTricksWon()).toBe(0);
		});
		it("nsPointsWon", function () {
			expect(hand.nsPointsWon()).toBe(4);
		});
		it("ewPointsWon", function () {
			expect(hand.ewPointsWon()).toBe(0);
		});
		it("isFinished", function () {
			expect(hand.isFinished()).toBe(true);
		});
	});

	describe("Actually play a hand (called)", function () {
		beforeEach(function () {
			spyOn(aiPlayers[1], "pickTrump").and.returnValue(Suit.Diamonds);
			hand.doHand();
		});
		it("handStage", function () {
			expect(hand.handStage()).toBe(HandStage.Finished);
		});
		it("dealer", function () {
			expect(hand.dealer()).toBe(Player.South);
		});
		it("playerHands", function () {
			expect(hand.playerHands()).toBe(playerHands);
		});
		it("trumpCandidate", function () {
			expect(hand.trumpCandidate()).toBe(trumpCandidate);
		});
		it("numTricksPlayed", function () {
			expect(hand.numTricksPlayed()).toBe(5);
		});
		it("nsTricksWon", function () {
			expect(hand.nsTricksWon()).toBe(0);
		});
		it("ewTricksWon", function () {
			expect(hand.ewTricksWon()).toBe(5);
		});
		it("nsPointsWon", function () {
			expect(hand.nsPointsWon()).toBe(0);
		});
		it("ewPointsWon", function () {
			expect(hand.ewPointsWon()).toBe(2);
		});
		it("isFinished", function () {
			expect(hand.isFinished()).toBe(true);
		});
	});

	describe("Actually play a hand (called alone)", function () {
		beforeEach(function () {
			spyOn(aiPlayers[1], "pickTrump").and.returnValue(Suit.Diamonds);
			spyOn(aiPlayers[1], "chooseGoAlone").and.returnValue(true);
			hand.doHand();
		});
		it("handStage", function () {
			expect(hand.handStage()).toBe(HandStage.Finished);
		});
		it("dealer", function () {
			expect(hand.dealer()).toBe(Player.South);
		});
		it("playerHands", function () {
			expect(hand.playerHands()).toBe(playerHands);
		});
		it("trumpCandidate", function () {
			expect(hand.trumpCandidate()).toBe(trumpCandidate);
		});
		it("numTricksPlayed", function () {
			expect(hand.numTricksPlayed()).toBe(5);
		});
		it("nsTricksWon", function () {
			expect(hand.nsTricksWon()).toBe(0);
		});
		it("ewTricksWon", function () {
			expect(hand.ewTricksWon()).toBe(5);
		});
		it("nsPointsWon", function () {
			expect(hand.nsPointsWon()).toBe(0);
		});
		it("ewPointsWon", function () {
			expect(hand.ewPointsWon()).toBe(4);
		});
		it("isFinished", function () {
			expect(hand.isFinished()).toBe(true);
		});
	});

	//TODO: test jacks, test deck more thoroughly
	describe("getShuffledDeck", function () {
		let {deck} = getShuffledDeck();

		it("gets right size deck", function () {
			expect(deck.length).toBe(24);
		});
	});

	//TODO: test that each hand is the right size, etc.
	describe("dealHands", function () {
		let hands = new Array(4);
		for (let i = 0; i < 4; i++) {
			hands[i] = new Array(5);
		}

		let {deck} = getShuffledDeck();
		dealHands(deck, hands, 0);

		it("deals hands out", function () {
			for (let i = 0; i < 4; i++) {
				for (let j = 0; j < 5; j++) {
					expect(hands[i][j]).not.toBe(null);
				}
			}
		});
	});
});