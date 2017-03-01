declare function postMessage(message: any): void;  //Workaround so TypeScript compiles

function simulateHand_worker() {  //Workaround for Chrome not allowing scripts from file://
	onmessage = function (message: MessageEvent): void {
		let data = message.data;
		let i = 0;
		let deck: Card[] = data[i++];
		let hand: Card[] = data[i++];
		let trumpCandidateCard: Card = data[i++];
		let dealer: Player = data[i++];
		let orderItUp: boolean = data[i++];
		let discard: Card | null = data[i++];
		let suitToCall: Suit | null = data[i++];
		let goAlone: boolean = data[i++];

		simulate(deck, hand, trumpCandidateCard, dealer, orderItUp, discard,
			suitToCall, goAlone);
	}

	function simulate(deck: Card[], hand: Card[], trumpCandidateCard: Card,
		dealer: Player, orderItUp: boolean, discard: Card | null,
		suitToCall: Suit | null, goAlone: boolean): void {
		let permutation: string[] = [];
		let i = 0;
		let startTime = performance.now();
		let cycleTime = startTime;
		while (nextPermutation(permutation)) {
			i++
			if (performance.now() - cycleTime >= 1000) {
				postMessage(["progress", i]);
				cycleTime = performance.now();
			}
		}
		postMessage(["result", 3]);
		close();
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