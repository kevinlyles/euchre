declare function postMessage(message: Response): void;  //Workaround so TypeScript compiles

type StartParams = {
	workerId: number,
	deck: Card[],
	hand: Card[],
	trumpCandidate: Card,
	dealer: Player,
	orderItUp: boolean,
	discard: Card | null,
	suitToCall: Suit | null,
	goAlone: boolean,
	baseURL: string,
	startPermutation?: string,
	endPermutation?: string,
};

type StartRequest = {
	type: "start",
	data: StartParams,
};

type ProgressRequest = {
	type: "progress",
}

type Request = StartRequest | ProgressRequest;

type Results = {
	won: number,
	lost: number,
	pointValues: { [points: number]: number };
}

type ProgressResponse = {
	type: "progress",
	workerId: number,
	numberProcessed: number,
}

type ResultsResponse = {
	type: "results",
	workerId: number,
	results: Results,
}

type Response = ProgressResponse | ResultsResponse;

function simulateHand_worker() {  //Workaround for Chrome not allowing scripts from file://
	let i: number;
	let workerId: number;

	onmessage = function (message: MessageEvent): void {
		let data: Request = message.data;

		switch (data.type) {
			case "start":
				startSimulation(data.data);
				break;
			case "progress":
				let message: ProgressResponse = {
					type: "progress",
					workerId: workerId,
					numberProcessed: i,
				};
				postMessage(message);
				break;
		}
	}

	function simulate(deck: Card[], playerHand: Card[], trumpCandidate: Card,
		dealer: Player, orderItUp: boolean, discard: Card | undefined,
		suitToCall: Suit | null, goAlone: boolean,
		startPermutation: string[], endPermutation: string | undefined): void {
		let bidderAI = new BiddingTestAI(orderItUp, suitToCall, goAlone, discard);
		let aiPlayers = [
			new MultiAI(bidderAI, new KevinAI()),
			new MultiAI(new DoesNotBidAI(), new KevinAI()),
			new MultiAI(new DoesNotBidAI(), new KevinAI()),
			new MultiAI(new DoesNotBidAI(), new KevinAI()),
		];
		let results = createBlankResults();
		i = 0;
		simulateLoop(aiPlayers, deck, playerHand, trumpCandidate, dealer, orderItUp,
			discard, suitToCall, goAlone, startPermutation, endPermutation, results);
	}

	function simulateLoop(aiPlayers: EuchreAI[], deck: Card[], playerHand: Card[],
		trumpCandidate: Card, dealer: Player, orderItUp: boolean,
		discard: Card | undefined, suitToCall: Suit | null, goAlone: boolean,
		startPermutation: string[], endPermutation: string | undefined,
		results: Results) {
		let permutation: string[] = startPermutation;
		while (nextPermutation(permutation)) {
			let playerHands = deal(deck, playerHand, permutation);
			simulateHand(playerHands, aiPlayers, dealer, trumpCandidate, results);
			i++;
			if (endPermutation && permutation.join("") === endPermutation) {
				break;
			} else if (i % 1e4 === 0) {
				setTimeout(simulateLoop, 0, aiPlayers, deck, playerHand,
					trumpCandidate, dealer, orderItUp, discard, suitToCall, goAlone,
					permutation, endPermutation, results);
				return;
			}
		}
		let message: ResultsResponse = {
			type: "results",
			workerId: workerId,
			results: results,
		}
		postMessage(message);
		close();
	}

	function simulateHand(playerHands: Card[][], aiPlayers: EuchreAI[], dealer: Player,
		trumpCandidate: Card, results: Results): void {
		let hand = new Hand(dealer, aiPlayers, playerHands, trumpCandidate);
		hand.doHand();
		let points = hand.nsPointsWon() - hand.ewPointsWon();
		if (points > 0) {
			results.won++;
		} else {
			results.lost++;
		}
		results.pointValues[points]++;
	}

	function startSimulation(data: StartParams) {
		workerId = data.workerId;

		let baseURL: string = data.baseURL;
		importScripts(baseURL + 'GameScript/xor4096.js');
		importScripts(baseURL + 'GameScript/globs.js');
		importScripts(baseURL + 'GameScript/utils.js');
		importScripts(baseURL + 'GameScript/playerAPI.js');
		importScripts(baseURL + 'GameScript/animation.js');
		importScripts(baseURL + 'GameScript/bid.js');
		importScripts(baseURL + 'GameScript/trick.js');
		importScripts(baseURL + 'GameScript/hand.js');
		importScripts(baseURL + 'AIScript/BiddingTestAI.js');
		importScripts(baseURL + 'AIScript/DoesNotBidAI.js');
		importScripts(baseURL + 'AIScript/MultiAI.js');
		importScripts(baseURL + 'AIScript/KevinAI.js');
		importScripts(baseURL + 'SimulationScript/simulateHand.js');

		let startPermutationString = data.startPermutation;
		let startPermutation: string[] = [];
		if (startPermutationString) {
			startPermutation = startPermutationString.split("");
		}

		simulate(data.deck, data.hand, data.trumpCandidate, data.dealer,
			data.orderItUp, data.discard || undefined, data.suitToCall, data.goAlone,
			startPermutation, data.endPermutation);
	}

	function deal(deck: Card[], hand: Card[], permutation: string[]): Card[][] {
		let playerHands = [hand.slice(), [], [], []];
		let pushTo: { [index: string]: Card[] } = {
			E: playerHands[Player.East],
			K: [],
			N: playerHands[Player.North],
			W: playerHands[Player.West],
		}
		for (let i = 0; i < permutation.length; i++) {
			pushTo[permutation[i]].push(deck[i]);
		}
		return playerHands;
	}

	function nextPermutation(lastPermutation: string[]): boolean {
		if (lastPermutation.length === 0) {
			for (let character of "EEEEEKKKNNNNNWWWWW".split("")) {
				lastPermutation.push(character);
			}
			return true;
		}
		let i = lastPermutation.length - 1;
		let j = i;
		while (i > 0 && lastPermutation[i - 1] >= lastPermutation[i]) {
			i--;
		}
		if (i <= 0) {
			return false;
		}

		while (lastPermutation[j] <= lastPermutation[i - 1]) {
			j--;
		}

		let temp = lastPermutation[i - 1];
		lastPermutation[i - 1] = lastPermutation[j];
		lastPermutation[j] = temp;

		j = lastPermutation.length - 1;
		while (i < j) {
			temp = lastPermutation[i];
			lastPermutation[i] = lastPermutation[j];
			lastPermutation[j] = temp;
			i++;
			j--;
		}
		return true;
	}
}

if (window !== self) {
	simulateHand_worker();
}