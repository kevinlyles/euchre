declare function postMessage(message: any): void;  //Workaround so TypeScript compiles

function simulateHand_worker() {  //Workaround for Chrome not allowing scripts from file://
	onmessage = function (message: MessageEvent): void {
		const data = message.data;
		let i = 0;
		const deck: Card[] = data[i++];
		const hand: Card[] = data[i++];
		const trumpCandidate: Card = data[i++];
		const dealer: Player = data[i++];
		const orderItUp: boolean = data[i++];
		const discard: Card | null = data[i++];
		const suitToCall: Suit | null = data[i++];
		const goAlone: boolean = data[i++];
		const baseURL: string = data[i++];

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

		simulate(deck, hand, trumpCandidate, dealer, orderItUp, discard,
			suitToCall, goAlone);
	};

	function simulate(deck: Card[], playerHand: Card[], trumpCandidate: Card,
		dealer: Player, orderItUp: boolean, discard: Card | null,
		suitToCall: Suit | null, goAlone: boolean): void {
		const permutation: string[] = [];
		const bidderAI = new BiddingTestAI(orderItUp, suitToCall, goAlone, discard || undefined);
		const aiPlayers = [
			new MultiAI(bidderAI, new KevinAI()),
			new MultiAI(new DoesNotBidAI(), new KevinAI()),
			new MultiAI(new DoesNotBidAI(), new KevinAI()),
			new MultiAI(new DoesNotBidAI(), new KevinAI()),
		];
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
		const results: { [index: string]: number } = {
			"true": 0,
			"false": 0,
			"-2": 0,
			"1": 0,
		};
		if (goAlone) {
			results["4"] = 0;
		} else {
			results["2"] = 0;
		}
		let i = 0;
		const startTime = performance.now();
		let cycleTime = startTime;
		while (nextPermutation(permutation)) {
			const playerHands = deal(deck, playerHand, permutation);
			const hand = new Hand(dealer, aiPlayers, settings, playerHands, trumpCandidate);
			hand.doHand();
			const points = hand.nsPointsWon() - hand.ewPointsWon();
			const wonHand = points > 0;
			results[wonHand.toString()]++;
			results[points.toString()]++;
			i++;
			if (performance.now() - cycleTime >= 10000) {
				postMessage(["progress", i]);
				cycleTime = performance.now();
			}
		}
		postMessage(["result", results]);
		close();
	}

	function deal(deck: Card[], hand: Card[], permutation: string[]): Card[][] {
		const playerHands = [hand, [], [], []];
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
		if (lastPermutation[3] === "K") {
			return false;
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