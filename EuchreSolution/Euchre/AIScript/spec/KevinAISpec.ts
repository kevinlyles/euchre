function testBidding(description: string, hand: Card[], trumpCandidate: Card, dealer: Player | true, ordersUp: false, discard: null, callsSuit: null, goesAlone: false): void;
function testBidding(description: string, hand: Card[], trumpCandidate: Card, dealer: Player | true, ordersUp: false, discard: null, callsSuit: Suit, goesAlone: boolean): void;
function testBidding(description: string, hand: Card[], trumpCandidate: Card, dealer: Player, ordersUp: true, discard: null, callsSuit: null, goesAlone: boolean): void;
function testBidding(description: string, hand: Card[], trumpCandidate: Card, dealer: true, ordersUp: true, discard: Card, callsSuit: null, goesAlone: boolean): void;
function testBidding(description: string, hand: Card[], trumpCandidate: Card, dealer: Player | true, ordersUp: boolean, discard: Card | null, callsSuit: Suit | null, goesAlone: boolean): void {
	describe(description, function () {
		let amDealer = dealer === true;

		beforeEach(function () {
			spyOn(game, "myHand").and.callFake(function (): Card[] {
				return hand.slice();
			})
			spyOn(game, "getTrumpCandidateCard").and.returnValue(trumpCandidate);
			spyOn(game, "getDealer").and.returnValue(dealer === true ? game.getCurrentPlayer() : dealer);
			if (ordersUp) {
				spyOn(game, "getTrumpSuit").and.returnValue(trumpCandidate.suit);
			} else if (callsSuit !== null) {
				spyOn(game, "getTrumpSuit").and.returnValue(callsSuit);
			}
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
			//hand.push(trumpCandidate);
			discard = discard as Card;
			it("Discards " + Rank[discard.rank] + " of " + Suit[discard.suit], function () {
				expect(ai.pickDiscard()).toEqual(discard);
			});
			//hand.slice(hand.indexOf(discard), 1);
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

/* TODO: re-implement this when the game does it (ideally, use the game's logic)
function adjustHand(hand: Card[], trumpCandidate: Card) {
	let trumpSuit = trumpCandidate.suit;

	hand.push(trumpCandidate);
	for (let i = 0; i < hand.length; i++) {
		let card = hand[i];
		if (card.rank === Rank.Jack) {
			if (card.suit === trumpSuit) {
				hand[i] = new Card(trumpSuit, Rank.Right);
			} else if (card.suit === getOppositeSuit(trumpSuit)) {
				hand[i] = new Card(trumpSuit, Rank.Left);
			}
		}
	}
}*/

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
			true,
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
			true,
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
			true,
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
			"Right nine, off ace, off king queen, dealer, candidate trump is ten",
			[
				new Card(Suit.Spades, Rank.Jack),
				new Card(Suit.Spades, Rank.Nine),
				new Card(Suit.Diamonds, Rank.Ace),
				new Card(Suit.Hearts, Rank.King),
				new Card(Suit.Hearts, Rank.Queen),
			],
			new Card(Suit.Spades, Rank.Ten),
			true,
			true,
			new Card(Suit.Hearts, Rank.Queen),
			null,
			false,
		);

		testBidding(
			"Right left, off ace, off king queen, dealer, candidate trump is nine",
			[
				new Card(Suit.Spades, Rank.Jack),
				new Card(Suit.Clubs, Rank.Jack),
				new Card(Suit.Diamonds, Rank.Ace),
				new Card(Suit.Hearts, Rank.King),
				new Card(Suit.Hearts, Rank.Queen),
			],
			new Card(Suit.Spades, Rank.Ten),
			true,
			true,
			new Card(Suit.Hearts, Rank.Queen),
			null,
			true,
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

		testBidding(
			"King queen ten nine, off nine, candidate trump does not match",
			[
				new Card(Suit.Spades, Rank.King),
				new Card(Suit.Spades, Rank.Queen),
				new Card(Suit.Spades, Rank.Ten),
				new Card(Suit.Spades, Rank.Nine),
				new Card(Suit.Hearts, Rank.Nine),
			],
			new Card(Suit.Diamonds, Rank.Ace),
			Player.West,
			false,
			null,
			Suit.Spades,
			false,
		);

		testBidding(
			"Perfect hand, candidate trump matches, dealer",
			[
				new Card(Suit.Spades, Rank.Jack),
				new Card(Suit.Clubs, Rank.Jack),
				new Card(Suit.Spades, Rank.Ace),
				new Card(Suit.Spades, Rank.King),
				new Card(Suit.Spades, Rank.Queen),
			],
			new Card(Suit.Spades, Rank.Ten),
			true,
			true,
			new Card(Suit.Spades, Rank.Ten),
			null,
			true,
		);

		testBidding(
			"Perfect hand after picking it up, candidate trump matches, dealer",
			[
				new Card(Suit.Spades, Rank.Jack),
				new Card(Suit.Clubs, Rank.Jack),
				new Card(Suit.Spades, Rank.Ace),
				new Card(Suit.Spades, Rank.King),
				new Card(Suit.Diamonds, Rank.Ten),
			],
			new Card(Suit.Spades, Rank.Queen),
			true,
			true,
			new Card(Suit.Diamonds, Rank.Ten),
			null,
			true,
		);

		testBidding(
			"Right left ace, off queen, off ten, candidate trump matches, dealer",
			[
				new Card(Suit.Spades, Rank.Jack),
				new Card(Suit.Clubs, Rank.Jack),
				new Card(Suit.Spades, Rank.Ace),
				new Card(Suit.Diamonds, Rank.Queen),
				new Card(Suit.Hearts, Rank.Ten),
			],
			new Card(Suit.Spades, Rank.King),
			true,
			true,
			new Card(Suit.Hearts, Rank.Ten),
			null,
			false,
		);

		testBidding(
			"Right left ace, off queen, off ten, candidate trump matches, dealer (other order of offsuits)",
			[
				new Card(Suit.Spades, Rank.Jack),
				new Card(Suit.Clubs, Rank.Jack),
				new Card(Suit.Spades, Rank.Ace),
				new Card(Suit.Hearts, Rank.Queen),
				new Card(Suit.Diamonds, Rank.Ten),
			],
			new Card(Suit.Spades, Rank.King),
			true,
			true,
			new Card(Suit.Diamonds, Rank.Ten),
			null,
			false,
		);

		testBidding(
			"Right left ace, off king queen, candidate trump matches, dealer",
			[
				new Card(Suit.Spades, Rank.Jack),
				new Card(Suit.Clubs, Rank.Jack),
				new Card(Suit.Spades, Rank.Ace),
				new Card(Suit.Hearts, Rank.King),
				new Card(Suit.Hearts, Rank.Queen),
			],
			new Card(Suit.Spades, Rank.King),
			true,
			true,
			new Card(Suit.Hearts, Rank.Queen),
			null,
			true,
		);

		testBidding(
			"Right left ace, off king queen, candidate trump matches, dealer (other order of offsuits)",
			[
				new Card(Suit.Spades, Rank.Jack),
				new Card(Suit.Clubs, Rank.Jack),
				new Card(Suit.Spades, Rank.Ace),
				new Card(Suit.Hearts, Rank.Queen),
				new Card(Suit.Hearts, Rank.King),
			],
			new Card(Suit.Spades, Rank.King),
			true,
			true,
			new Card(Suit.Hearts, Rank.Queen),
			null,
			true,
		);

		testBidding(
			"Right left ace king, off ace, candidate trump matches, dealer",
			[
				new Card(Suit.Spades, Rank.Jack),
				new Card(Suit.Clubs, Rank.Jack),
				new Card(Suit.Spades, Rank.Ace),
				new Card(Suit.Spades, Rank.King),
				new Card(Suit.Hearts, Rank.Ace),
			],
			new Card(Suit.Spades, Rank.Queen),
			true,
			true,
			new Card(Suit.Hearts, Rank.Ace),
			null,
			true,
		);

		testBidding(
			"Right ace king, off king queen, candidate trump is left, dealer",
			[
				new Card(Suit.Spades, Rank.Jack),
				new Card(Suit.Spades, Rank.Ace),
				new Card(Suit.Spades, Rank.King),
				new Card(Suit.Hearts, Rank.King),
				new Card(Suit.Hearts, Rank.Queen),
			],
			new Card(Suit.Clubs, Rank.Jack),
			Player.East,
			false,
			null,
			Suit.Spades,
			true,
		);
	});
});
