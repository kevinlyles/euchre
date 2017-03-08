declare function postMessage(message: any): void;  //Workaround so TypeScript compiles

function simulateHand_worker() {  //Workaround for Chrome not allowing scripts from file://
	onmessage = function (message: MessageEvent): void {
		let data = message.data;
		let i = 0;
		let deck: Card[] = data[i++];
		let hand: Card[] = data[i++];
		let trumpCandidate: Card = data[i++];
		let dealer: Player = data[i++];
		let orderItUp: boolean = data[i++];
		let discard: Card | null = data[i++];
		let suitToCall: Suit | null = data[i++];
		let goAlone: boolean = data[i++];
		let baseURL: string = data[i++];

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

		simulate(deck, hand, trumpCandidate, dealer, orderItUp, discard,
			suitToCall, goAlone);
	}

	function simulate(deck: Card[], playerHand: Card[], trumpCandidate: Card,
		dealer: Player, orderItUp: boolean, discard: Card | null,
		suitToCall: Suit | null, goAlone: boolean): void {
		let permutation: string[] = [];
		let bidderAI = new BiddingTestAI(orderItUp, suitToCall, goAlone, discard || undefined);
		let aiPlayers = [
			new MultiAI(bidderAI, new KevinAI()),
			new MultiAI(new DoesNotBidAI(), new KevinAI()),
			new MultiAI(new DoesNotBidAI(), new KevinAI()),
			new MultiAI(new DoesNotBidAI(), new KevinAI()),
		];
		let results: { [index: string]: number } = {};
		let i = 0;
		let startTime = performance.now();
		let cycleTime = startTime;
		while (nextPermutation(permutation)) {
			let playerHands = deal(deck, playerHand, permutation);
			let hand = new Hand(dealer, aiPlayers, playerHands, trumpCandidate);
			hand.doHand();
			let points = hand.nsPointsWon() - hand.ewPointsWon();
			let wonHand = points > 0;
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
		let playerHands = [hand, [], [], []];
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