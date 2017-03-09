declare function postMessage(message: SimulationResponse): void;  //Workaround so TypeScript compiles

interface StartParams {
	workerId: number;
	deck: Card[];
	hand: Card[];
	trumpCandidate: Card;
	dealer: Player;
	orderItUp: boolean;
	discard: Card | null;
	suitToCall: Suit | null;
	goAlone: boolean;
	baseURL: string;
	startPermutation?: string;
	endPermutation?: string;
}

interface StartRequest {
	type: "start";
	data: StartParams;
}

interface ProgressRequest {
	type: "progress";
}

type SimulationRequest = StartRequest | ProgressRequest;

interface Results {
	won: number;
	lost: number;
	pointValues: { [points: number]: number };
}

interface ProgressResponse {
	type: "progress";
	workerId: number;
	numberProcessed: number;
}

interface ResultsResponse {
	type: "results";
	workerId: number;
	results: Results;
}

type SimulationResponse = ProgressResponse | ResultsResponse;

function simulateHand_worker() {  //Workaround for Chrome not allowing scripts from file://
	let simulationCount: number;
	let workerId: number;

	onmessage = function (message: MessageEvent): void {
		const data: SimulationRequest = message.data;

		switch (data.type) {
			case "start":
				startSimulation(data.data);
				break;
			case "progress":
				const responseMessage: ProgressResponse = {
					type: "progress",
					workerId,
					numberProcessed: simulationCount,
				};
				postMessage(responseMessage);
				break;
		}
	};

	function simulate(deck: Card[], playerHand: Card[], trumpCandidate: Card,
		dealer: Player, orderItUp: boolean, discard: Card | undefined,
		suitToCall: Suit | null, goAlone: boolean,
		startPermutation: string[], endPermutation: string | undefined): void {
		const bidderAI = new BiddingTestAI(orderItUp, suitToCall, goAlone, discard);
		const aiPlayers = [
			new MultiAI(bidderAI, new KevinAI()),
			new MultiAI(new DoesNotBidAI(), new KevinAI()),
			new MultiAI(new DoesNotBidAI(), new KevinAI()),
			new MultiAI(new DoesNotBidAI(), new KevinAI()),
		];
		const results = createBlankResults();
		simulationCount = 0;
		simulateLoop(aiPlayers, deck, playerHand, trumpCandidate, dealer, orderItUp,
			discard, suitToCall, goAlone, startPermutation, endPermutation, results);
	}

	function simulateLoop(aiPlayers: EuchreAI[], deck: Card[], playerHand: Card[],
		trumpCandidate: Card, dealer: Player, orderItUp: boolean,
		discard: Card | undefined, suitToCall: Suit | null, goAlone: boolean,
		startPermutation: string[], endPermutation: string | undefined,
		results: Results) {
		const permutation: string[] = startPermutation;
		while (nextPermutation(permutation)) {
			const playerHands = deal(deck, playerHand, permutation);
			simulateHand(playerHands, aiPlayers, dealer, trumpCandidate, results);
			simulationCount++;
			if (endPermutation && permutation.join("") === endPermutation) {
				break;
			} else if (simulationCount % 1e4 === 0) {
				setTimeout(simulateLoop, 0, aiPlayers, deck, playerHand,
					trumpCandidate, dealer, orderItUp, discard, suitToCall, goAlone,
					permutation, endPermutation, results);
				return;
			}
		}
		const message: ResultsResponse = {
			type: "results",
			workerId,
			results,
		};
		postMessage(message);
		close();
	}

	function simulateHand(playerHands: Card[][], aiPlayers: EuchreAI[], dealer: Player,
		trumpCandidate: Card, results: Results): void {
		const settings: Settings = {
			sound: false,
			openHands: false,
			enableDefendAlone: false,
			enableNoTrump: false,
			showTrickHistory: false,
			statMode: true,
			messageLevel: MessageLevel.Multigame,
			aiPlayers,
			hasHooman: false,
			numGamesToPlay: 1,
		};
		const hand = new Hand(dealer, aiPlayers, settings, playerHands, trumpCandidate);
		hand.doHand();
		const points = hand.nsPointsWon() - hand.ewPointsWon();
		if (points > 0) {
			results.won++;
		} else {
			results.lost++;
		}
		results.pointValues[points]++;
	}

	function startSimulation(data: StartParams) {
		workerId = data.workerId;

		const baseURL: string = data.baseURL;
		importScripts(baseURL + "GameScript/xor4096.js");
		importScripts(baseURL + "GameScript/globs.js");
		importScripts(baseURL + "GameScript/utils.js");
		importScripts(baseURL + "GameScript/playerAPI.js");
		importScripts(baseURL + "GameScript/animation.js");
		importScripts(baseURL + "GameScript/bid.js");
		importScripts(baseURL + "GameScript/trick.js");
		importScripts(baseURL + "GameScript/hand.js");
		importScripts(baseURL + "AIScript/BiddingTestAI.js");
		importScripts(baseURL + "AIScript/DoesNotBidAI.js");
		importScripts(baseURL + "AIScript/MultiAI.js");
		importScripts(baseURL + "AIScript/KevinAI.js");
		importScripts(baseURL + "SimulationScript/simulateHand.js");

		const startPermutationString = data.startPermutation;
		let startPermutation: string[] = [];
		if (startPermutationString) {
			startPermutation = startPermutationString.split("");
		}

		simulate(data.deck, data.hand, data.trumpCandidate, data.dealer,
			data.orderItUp, data.discard || undefined, data.suitToCall, data.goAlone,
			startPermutation, data.endPermutation);
	}

	function deal(deck: Card[], hand: Card[], permutation: string[]): Card[][] {
		const playerHands = [hand.slice(), [], [], []];
		const pushTo: { [index: string]: Card[] } = {
			E: playerHands[Player.East],
			K: [],
			N: playerHands[Player.North],
			W: playerHands[Player.West],
		};
		for (let i = 0; i < permutation.length; i++) {
			pushTo[permutation[i]].push(deck[i]);
		}
		return playerHands;
	}

	function nextPermutation(lastPermutation: string[]): boolean {
		if (lastPermutation.length === 0) {
			for (const character of "EEEEEKKKNNNNNWWWWW".split("")) {
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