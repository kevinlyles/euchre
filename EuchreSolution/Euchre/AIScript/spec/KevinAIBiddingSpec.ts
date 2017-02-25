function testBidding(description: string, hand: Card[], trumpCandidate: Card,
	dealer: Player, ordersUp: boolean, discard: Card | null, callsSuit: Suit | null,
	goesAlone: boolean): void {
	const amDealer = dealer === Player.South;

	it(description + " Test code was called properly", function () {
		expect(discard !== null || !ordersUp || !amDealer).toBe(true);
		if (discard && ordersUp && amDealer) {
			let found = isInHand(hand, discard);
			if (!found && ordersUp && amDealer) {
				found = trumpCandidate.id === discard.id;
			}
			expect(found).toBe(true, "Expected discard is neither in hand nor trump candidate");
		}
		if (!ordersUp) {
			expect(callsSuit).not.toBe(trumpCandidate.suit, "Expected to call trump candidate's suit in round 2");
		}
	});

	describe(description, function () {
		let ai: EuchreAI;
		let bid: Bid;
		let bidResult: BidResult | null;
		let testHand: Card[];

		beforeEach(function () {
			const jacks = [
				new Card(Suit.Clubs, Rank.Jack),
				new Card(Suit.Diamonds, Rank.Jack),
				new Card(Suit.Hearts, Rank.Jack),
				new Card(Suit.Spades, Rank.Jack),
			];
			testHand = [];
			for (const card of hand) {
				const newCard = new Card(card);
				testHand.push(newCard);
				if (newCard.rank === Rank.Jack) {
					jacks[newCard.suit] = newCard;
				}
			}
			const hands = [testHand, [], [], []];
			const newTrumpCandidate = new Card(trumpCandidate);
			if (newTrumpCandidate.rank === Rank.Jack) {
				jacks[newTrumpCandidate.suit] = newTrumpCandidate;
			}
			ai = new KevinAI();
			ai.init(Player.South);
			const aiPlayers = [ai, new IdiotAI(), new IdiotAI(), new IdiotAI()];
			bid = new Bid(hands, jacks, aiPlayers, dealer, newTrumpCandidate);
			bidResult = bid.doBidding();
		});

		it(ordersUp && "Orders it up" || "Passes ordering up", function () {
			if (ordersUp) {
				expect(bidResult).not.toBeNull("Bid result was null");
				bidResult = bidResult as BidResult;
				expect(bidResult.maker).toBe(Player.South, "Wrong maker");
				expect(bidResult.stage).toBe(BidStage.Round1, "Wrong bidding round");
				expect(bidResult.trump).toBe(trumpCandidate.suit, "Wrong suit");
			} else {
				expect(!bidResult || bidResult.stage !== BidStage.Round1).toBe(true);
			}
		});

		if (ordersUp && amDealer) {
			discard = discard as Card;
			it("Discards " + Rank[discard.rank] + " of " + Suit[discard.suit], function () {
				expect(isInHand(testHand, discard as Card)).toBe(false);
			});
		}

		if (!ordersUp) {
			it(callsSuit !== null && ("Calls " + Suit[callsSuit]) || "Passes calling trump", function () {
				if (callsSuit !== null) {
					expect(bidResult).not.toBeNull();
					bidResult = bidResult as BidResult;
					expect(bidResult.maker).toBe(Player.South);
					expect(bidResult.stage).toBe(BidStage.Round2);
					expect(bidResult.trump).toBe(callsSuit);
				} else {
					expect(bidResult).toBeNull();
				}
			});
		}

		if (ordersUp || callsSuit !== null) {
			it(goesAlone && "Goes alone" || "Keeps partner", function () {
				expect(bidResult).not.toBeNull();
				bidResult = bidResult as BidResult;
				expect(bidResult.alone).toBe(goesAlone);
			});
		}
	});
}

describe("Kevin AI Bidding", function () {
	describe("Smoke tests", function () {
		it("Can be instantiated", function () {
			expect(new KevinAI()).toBeDefined();
		});
	});

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
		"Right nine, off ace, off king queen, dealer, candidate trump is ten",
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
		"Right left, off ace, off king queen, dealer, candidate trump is nine",
		[
			new Card(Suit.Spades, Rank.Jack),
			new Card(Suit.Clubs, Rank.Jack),
			new Card(Suit.Diamonds, Rank.Ace),
			new Card(Suit.Hearts, Rank.King),
			new Card(Suit.Hearts, Rank.Queen),
		],
		new Card(Suit.Spades, Rank.Ten),
		Player.South,
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
		Player.South,
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
		Player.South,
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
		Player.South,
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
		Player.South,
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
		Player.South,
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
		Player.South,
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
		Player.South,
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