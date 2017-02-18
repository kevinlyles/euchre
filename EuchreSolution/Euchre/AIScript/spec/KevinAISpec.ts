function testBidding(description: string, hand: Card[], trumpCandidate: Card, dealer: Player, ordersUp: boolean, discards: Card | null, callsSuit: Suit | null, goesAlone: boolean): void {
	describe(description, function () {
		// Brittle, but I don't see another way to do this without passing it in
		let amDealer = dealer === Player.South;

		beforeEach(function () {
			spyOn(game, "myHand").and.returnValue(hand);
			spyOn(game, "getTrumpCandidateCard").and.returnValue(trumpCandidate);
			spyOn(game, "getDealer").and.returnValue(dealer);
			if (ordersUp) {
				spyOn(game, "getTrumpSuit").and.returnValue(trumpCandidate.suit);
			} else if (callsSuit !== null) {
				spyOn(game, "getTrumpSuit").and.returnValue(callsSuit);
			}
			amDealer = isDealer(me());
		});

		it("Test code was called properly", function () {
			expect(discards !== null || !ordersUp || !amDealer).toBe(true);
		});

		let ai = new KevinAI();
		it("Can init", function () {
			ai.init();
			expect(true).toBe(true);
		});

		it(ordersUp && "Orders it up" || "Passes ordering up", function () {
			expect(ai.chooseOrderUp()).toBe(ordersUp);
		});

		if (ordersUp && amDealer) {
			hand.push(trumpCandidate);
			discards = discards as Card;
			it("Discards " + Rank[discards.rank] + " of " + Suit[discards.suit], function () {
				expect(ai.pickDiscard()).toEqual(discards);
			});
			hand.slice(hand.indexOf(discards), 1);
		}

		if (!ordersUp) {
			it(callsSuit !== null && ("Calls " + Suit[callsSuit]) || "Passes calling trump", function () {
				expect(ai.pickTrump()).toBe(callsSuit);
			});
		}

		if (ordersUp || callsSuit !== null) {
			it(goesAlone && "Goes alone" || "Keeps partner", function () {
				expect(ai.chooseGoAlone()).toBe(goesAlone);
			})
		}
	});
}

describe("Kevin AI", function () {
	game = new Game();

	beforeEach(function () {
		spyOn(game, "getCurrentPlayer").and.returnValue(Player.South);
	});

	describe("Smoke tests", function () {
		it("Can be instantiated", function () {
			expect(new KevinAI()).toBeDefined();
		});
	});

	describe("Bidding", function () {
		testBidding(
			"All nines and tens, dealer, candidate trump matches",
			[
				new Card(Suit.Spades, Rank.Ten),
				new Card(Suit.Spades, Rank.Nine),
				new Card(Suit.Diamonds, Rank.Nine),
				new Card(Suit.Clubs, Rank.Nine),
				new Card(Suit.Hearts, Rank.Nine),
			],
			new Card(Suit.Spades, Rank.King),
			Player.South,
			false,
			null,
			null,
			false,
		);

		testBidding(
			"Right nine, off ace, off king, off king, candidate trump does not match",
			[
				new Card(Suit.Spades, Rank.Jack),
				new Card(Suit.Spades, Rank.Nine),
				new Card(Suit.Diamonds, Rank.Ace),
				new Card(Suit.Clubs, Rank.King),
				new Card(Suit.Hearts, Rank.King),
			],
			new Card(Suit.Diamonds, Rank.King),
			Player.West,
			false,
			null,
			null,
			false,
		);

		testBidding(
			"Right, off ace, off jack ten nine, dealer, candidate trump matches",
			[
				new Card(Suit.Spades, Rank.Jack),
				new Card(Suit.Clubs, Rank.Ace),
				new Card(Suit.Diamonds, Rank.Jack),
				new Card(Suit.Diamonds, Rank.Ten),
				new Card(Suit.Diamonds, Rank.Nine),
			],
			new Card(Suit.Spades, Rank.Nine),
			Player.South,
			true,
			new Card(Suit.Diamonds, Rank.Nine),
			null,
			false,
		);

		testBidding(
			"Right nine, off ace, off ten nine, dealer, candidate trump matches",
			[
				new Card(Suit.Spades, Rank.Jack),
				new Card(Suit.Spades, Rank.Nine),
				new Card(Suit.Clubs, Rank.Ace),
				new Card(Suit.Diamonds, Rank.Ten),
				new Card(Suit.Diamonds, Rank.Nine),
			],
			new Card(Suit.Spades, Rank.Ten),
			Player.South,
			true,
			new Card(Suit.Diamonds, Rank.Nine),
			null,
			false,
		);

		testBidding(
			"Right, off ace, off jack ten nine, dealer, candidate trump matches",
			[
				new Card(Suit.Spades, Rank.Jack),
				new Card(Suit.Clubs, Rank.Ace),
				new Card(Suit.Diamonds, Rank.Jack),
				new Card(Suit.Diamonds, Rank.Ten),
				new Card(Suit.Diamonds, Rank.Nine),
			],
			new Card(Suit.Spades, Rank.Nine),
			Player.South,
			true,
			new Card(Suit.Diamonds, Rank.Nine),
			null,
			false,
		);

		testBidding(
			"Perfect hand, candidate trump does not match",
			[
				new Card(Suit.Spades, Rank.Jack),
				new Card(Suit.Clubs, Rank.Jack),
				new Card(Suit.Spades, Rank.Ace),
				new Card(Suit.Spades, Rank.King),
				new Card(Suit.Spades, Rank.Queen),
			],
			new Card(Suit.Diamonds, Rank.Ace),
			Player.West,
			false,
			null,
			Suit.Spades,
			true,
		);

		testBidding(
			"Right king queen, two off queens, candidate trump does not match",
			[
				new Card(Suit.Spades, Rank.Jack),
				new Card(Suit.Spades, Rank.King),
				new Card(Suit.Spades, Rank.Queen),
				new Card(Suit.Hearts, Rank.Queen),
				new Card(Suit.Diamonds, Rank.Queen),
			],
			new Card(Suit.Diamonds, Rank.Ace),
			Player.West,
			false,
			null,
			Suit.Spades,
			false,
		);

		testBidding(
			"Right left king, off king nine, candidate trump does not match",
			[
				new Card(Suit.Spades, Rank.Jack),
				new Card(Suit.Spades, Rank.King),
				new Card(Suit.Clubs, Rank.Jack),
				new Card(Suit.Hearts, Rank.King),
				new Card(Suit.Hearts, Rank.Nine),
			],
			new Card(Suit.Diamonds, Rank.Ace),
			Player.West,
			false,
			null,
			Suit.Spades,
			true,
		);

		testBidding(
			"Right nine, off ace, off ten nine, candidate trump does not match",
			[
				new Card(Suit.Spades, Rank.Jack),
				new Card(Suit.Spades, Rank.Nine),
				new Card(Suit.Diamonds, Rank.Ace),
				new Card(Suit.Hearts, Rank.Ten),
				new Card(Suit.Hearts, Rank.Nine),
			],
			new Card(Suit.Diamonds, Rank.King),
			Player.West,
			false,
			null,
			Suit.Spades,
			false,
		);

		testBidding(
			"Right nine, off ace, off king queen, dealer, candidate trump matches",
			[
				new Card(Suit.Spades, Rank.Jack),
				new Card(Suit.Spades, Rank.Nine),
				new Card(Suit.Diamonds, Rank.Ace),
				new Card(Suit.Hearts, Rank.King),
				new Card(Suit.Hearts, Rank.Queen),
			],
			new Card(Suit.Spades, Rank.Ten),
			Player.South,
			true,
			new Card(Suit.Hearts, Rank.Queen),
			null,
			false,
		);

		testBidding(
			"Right nine, off ace, off ten nine, candidate trump matches but goes to opponents",
			[
				new Card(Suit.Spades, Rank.Jack),
				new Card(Suit.Spades, Rank.Nine),
				new Card(Suit.Clubs, Rank.Ace),
				new Card(Suit.Diamonds, Rank.Ten),
				new Card(Suit.Diamonds, Rank.Nine),
			],
			new Card(Suit.Spades, Rank.Ten),
			Player.West,
			false,
			null,
			null,
			false,
		);

		testBidding(
			"Right nine, off ace, off ten nine, candidate trump matches and goes to partner",
			[
				new Card(Suit.Spades, Rank.Jack),
				new Card(Suit.Spades, Rank.Nine),
				new Card(Suit.Clubs, Rank.Ace),
				new Card(Suit.Diamonds, Rank.Ten),
				new Card(Suit.Diamonds, Rank.Nine),
			],
			new Card(Suit.Spades, Rank.Ten),
			Player.North,
			true,
			null,
			null,
			false,
		);

		testBidding(
			"Right nine, off ace, off ace, off nine, candidate trump does not match",
			[
				new Card(Suit.Spades, Rank.Jack),
				new Card(Suit.Spades, Rank.Nine),
				new Card(Suit.Clubs, Rank.Ace),
				new Card(Suit.Hearts, Rank.Ace),
				new Card(Suit.Diamonds, Rank.Nine),
			],
			new Card(Suit.Diamonds, Rank.Ace),
			Player.West,
			false,
			null,
			Suit.Spades,
			false,
		);

		testBidding(
			"Perfect hand, candidate trump matches",
			[
				new Card(Suit.Spades, Rank.Jack),
				new Card(Suit.Spades, Rank.Ace),
				new Card(Suit.Spades, Rank.King),
				new Card(Suit.Spades, Rank.Queen),
				new Card(Suit.Clubs, Rank.Jack),
			],
			new Card(Suit.Spades, Rank.Ten),
			Player.West,
			true,
			null,
			null,
			true,
		);

		testBidding(
			"Right left ace, off ace king, follow dealer, other suit is better",
			[
				new Card(Suit.Spades, Rank.Jack),
				new Card(Suit.Spades, Rank.Ace),
				new Card(Suit.Clubs, Rank.Jack),
				new Card(Suit.Clubs, Rank.Ace),
				new Card(Suit.Clubs, Rank.King),
			],
			new Card(Suit.Spades, Rank.King),
			Player.East,
			false,
			null,
			Suit.Clubs,
			true,
		);

		testBidding(
			"Right left ace, off ace king, second after dealer, other suit is better",
			[
				new Card(Suit.Spades, Rank.Jack),
				new Card(Suit.Spades, Rank.Ace),
				new Card(Suit.Clubs, Rank.Jack),
				new Card(Suit.Clubs, Rank.Ace),
				new Card(Suit.Clubs, Rank.King),
			],
			new Card(Suit.Spades, Rank.King),
			Player.North,
			true,
			null,
			null,
			true,
		);

		testBidding(
			"Right nine, off ace, off king, off king, candidate trump does not match but makes one of the off kings good",
			[
				new Card(Suit.Spades, Rank.Jack),
				new Card(Suit.Spades, Rank.Nine),
				new Card(Suit.Clubs, Rank.Ace),
				new Card(Suit.Diamonds, Rank.King),
				new Card(Suit.Hearts, Rank.King),
			],
			new Card(Suit.Diamonds, Rank.Ace),
			Player.West,
			false,
			null,
			Suit.Spades,
			false,
		);
	});
});
