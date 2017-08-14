function startSimulation(): void {
	const hand: Card[] = [];

	for (let i = 1; i <= 5; i++) {
		const card = getCard("card" + i, "Card " + i);
		if (!card) {
			return;
		}
		hand.push(card);
	}

	const trumpCandidate = getCard("trumpCandidate", "Trump candidate card");
	if (!trumpCandidate) {
		return;
	}

	const dealerSelect = document.getElementById("dealerSelect") as HTMLSelectElement;
	let dealer: Player;
	switch (dealerSelect.value) {
		case "S":
			dealer = Player.South;
			break;
		case "W":
			dealer = Player.West;
			break;
		case "N":
			dealer = Player.North;
			break;
		case "E":
			dealer = Player.East;
			break;
		default:
			alert("Invalid dealer: " + dealerSelect.value);
			return;
	}

	const orderItUpCheckbox = document.getElementById("orderItUp") as HTMLInputElement;
	let discard: Card | null = null;
	let orderItUp = false;
	let suitToCall: Suit | null = null;
	let goAlone = false;
	if (!orderItUpCheckbox.disabled) {
		orderItUp = orderItUpCheckbox.checked;
	}
	if (orderItUp) {
		if (dealer === Player.South) {
			const discardSelect = document.getElementById("discardSelect") as HTMLSelectElement;
			const discardIndex = discardSelect.selectedIndex;
			if (discardIndex === 0) {
				alert("Invalid discard");
				return;
			} else if (discardIndex === 6) {
				discard = trumpCandidate;
			} else {
				discard = hand[discardIndex - 1];
			}
		}
	} else {
		const suitToCallSelect = document.getElementById("suitToCall") as HTMLSelectElement;
		switch (suitToCallSelect.value) {
			case "C":
				suitToCall = Suit.Clubs;
				break;
			case "D":
				suitToCall = Suit.Diamonds;
				break;
			case "H":
				suitToCall = Suit.Hearts;
				break;
			case "S":
				suitToCall = Suit.Spades;
				break;
			default:
				alert("Invalid suit to call");
				return;
		}
	}
	if (orderItUp || suitToCall !== null) {
		const goAloneCheckbox = document.getElementById("goAlone") as HTMLInputElement;
		goAlone = goAloneCheckbox.checked;
	}
	const numberOfThreadsSelect = document.getElementById("numberOfThreads") as HTMLSelectElement;
	const numberOfThreads = parseInt(numberOfThreadsSelect.value, 10);

	updateLog("Starting computation...<br/>");
	disappearMenu("simulateHand");
	startWorkers(hand, trumpCandidate, dealer, orderItUp, discard, suitToCall, goAlone, numberOfThreads);
}

function getCard(elementIdBase: string, cardName?: string): Card | null {
	const suitSelect = document.getElementById(elementIdBase + "Suit") as HTMLSelectElement;
	if (!suitSelect.value) {
		if (cardName) { alert(cardName + " has no suit."); }
		suitSelect.focus();
		return null;
	}
	const rankSelect = document.getElementById(elementIdBase + "Rank") as HTMLSelectElement;
	if (!rankSelect.value) {
		if (cardName) { alert(cardName + " has no rank."); }
		rankSelect.focus();
		return null;
	}

	let suit: Suit;
	switch (suitSelect.value) {
		case "C":
			suit = Suit.Clubs;
			break;
		case "D":
			suit = Suit.Diamonds;
			break;
		case "H":
			suit = Suit.Hearts;
			break;
		case "S":
			suit = Suit.Spades;
			break;
		default:
			if (cardName) { alert(`Invalid suit for ${cardName.toLocaleLowerCase()}: "${suitSelect.value}`); }
			return null;
	}

	const rank = +rankSelect.value;
	if (!Rank[rank]) {
		if (cardName) { alert(`Invalid rank for ${cardName.toLocaleLowerCase()}: ${rankSelect.value}`); }
		return null;
	}

	return new Card(suit, rank);
}

function cardChanged(cardNumber: number) {
	updateActions();

	let card: Card | null;
	if (cardNumber === 0) {
		card = getCard("trumpCandidate");
	} else {
		card = getCard("card" + cardNumber);
	}
	if (!card) {
		return;
	}

	if (card.suit) {
		for (let i = 1; i <= 5; i++) {
			if (i === cardNumber) {
				continue;
			}
			const compareCard = getCard("card" + i);
			if (compareCard && compareCard.id === card.id) {
				const rankSelect = document.getElementById("card" + i + "Rank") as HTMLSelectElement;
				rankSelect.value = "";
			}
		}
	}
	if (cardNumber !== 0) {
		const compareCard = getCard("trumpCandidate");
		if (compareCard && compareCard.id === card.id) {
			const rankSelect = document.getElementById("trumpCandidateRank") as HTMLSelectElement;
			rankSelect.value = "";
		}
	}
}

function updateDiscardCard(index: number, card: Card | null): void {
	const discardSelect = document.getElementById("discardSelect") as HTMLSelectElement;
	if (card) {
		discardSelect.options[index].text = Rank[card.rank] + " of " + Suit[card.suit];
	} else {
		if (index === 6) {
			discardSelect.options[index].text = "Trump candidate";
		} else {
			discardSelect.options[index].text = "Card " + index;
		}
	}
}

function updateActions(): void {
	const hand: (Card | null)[] = [];
	const discardSelect = document.getElementById("discardSelect") as HTMLSelectElement;
	for (let i = 1; i <= 5; i++) {
		const card = getCard("card" + i);
		hand.push(card);
		updateDiscardCard(i, card);
	}

	const trumpCandidate = getCard("trumpCandidate");
	updateDiscardCard(6, trumpCandidate);

	const orderItUpCheckbox = document.getElementById("orderItUp") as HTMLInputElement;
	let hasSuit = false;
	if (trumpCandidate) {
		for (const card of hand) {
			if (card && card.suit === trumpCandidate.suit) {
				hasSuit = true;
				break;
			}
		}
		if (!hasSuit) {
			orderItUpCheckbox.checked = false;
		}
	}
	orderItUpCheckbox.disabled = !hasSuit;

	const dealerSelect = document.getElementById("dealerSelect") as HTMLSelectElement;
	if (dealerSelect.value === "S" && orderItUpCheckbox.checked) {
		discardSelect.disabled = false;
	} else {
		discardSelect.disabled = true;
		if (dealerSelect.value !== "S") {
			discardSelect.value = "";
		}
	}

	const suitToCallSelect = document.getElementById("suitToCall") as HTMLSelectElement;
	if (!orderItUpCheckbox.disabled && orderItUpCheckbox.checked) {
		suitToCallSelect.disabled = true;
		suitToCallSelect.value = "";
	} else {
		suitToCallSelect.disabled = false;
	}

	const goAloneCheckbox = document.getElementById("goAlone") as HTMLInputElement;
	if ((!orderItUpCheckbox.disabled && orderItUpCheckbox.checked) || suitToCallSelect.value) {
		goAloneCheckbox.disabled = false;
	} else {
		goAloneCheckbox.disabled = true;
		goAloneCheckbox.checked = false;
	}
}

function buildDeck(hand: Card[], trumpCandidate: Card): Card[] {
	const idsToSkip = { [trumpCandidate.id]: true };
	for (const card of hand) {
		idsToSkip[card.id] = true;
	}
	const deck: Card[] = [];
	for (const suit of suitsArray) {
		for (let rank = Rank.Nine; rank <= Rank.Ace; rank++) {
			const card = new Card(suit, rank);
			if (!idsToSkip[card.id]) {
				deck.push(card);
			}
		}
	}
	return deck;
}

let startTime: number;
let totalCount: number[] = [];
let totalResults: Results;
let hasResults: boolean[] = [];
let workers: Worker[];
let intervalHandle: number;
let segmentNumber: number;
let dataTemplate: SimulateParamsTemplate;
let precalcPermutations: string[] = [];

function calculateMorePermutations() {
	const length = precalcPermutations.length;
	let precalcSegmentNumber = segmentNumber + length;
	for (let i = precalcPermutations.length; i < 16; i++) {
		precalcPermutations.push(getNthPermutation(DEAL_SET, precalcSegmentNumber));
		precalcSegmentNumber++;
	}
}
setTimeout(calculateMorePermutations, 0);

function startWorkers(hand: Card[], trumpCandidate: Card, dealer: Player,
	orderItUp: boolean, discard: Card | null, suitToCall: Suit | null,
	goAlone: boolean, numberOfThreads: number = 1): void {
	const deck = buildDeck(hand, trumpCandidate);

	const workerAsString = "(" + simulateHand_worker.toString() + ")()";
	const blob = new Blob([workerAsString], { type: "text/javascript" });
	startTime = performance.now();
	let url = document.location.href;
	url = url.substring(0, url.lastIndexOf("/") + 1);
	workers = [];
	segmentNumber = 0;
	totalResults = createBlankResults();
	dataTemplate = {
		deck,
		hand,
		trumpCandidate,
		dealer,
		orderItUp,
		discard,
		suitToCall,
		goAlone,
	};

	for (let i = 0; i < numberOfThreads; i++) {
		const worker = new Worker(URL.createObjectURL(blob));
		worker.onmessage = handleMessage;
		workers[i] = worker;
		const message: StartRequest = {
			type: "start",
			workerId: i,
			baseURL: url,
		};
		worker.postMessage(message);
		startSimulatingChunk(i);
	}
	intervalHandle = setInterval(checkProgress, 10000);
}

function startSimulatingChunk(workerId: number): void {
	const data: SimulateParams = dataTemplate as SimulateParams;
	let permutation = precalcPermutations.shift();
	if (!permutation) {
		permutation = getNthPermutation(DEAL_SET.slice(), segmentNumber * SEGMENT_SIZE);
	}
	data.startPermutation = permutation;
	data.segmentNumber = segmentNumber;
	const message: SimulateRequest = { type: "simulate", data };
	workers[workerId].postMessage(message);
	segmentNumber++;
	if (precalcPermutations.length < 8) {
		setTimeout(calculateMorePermutations, 0);
	}
}

function checkProgress(): void {
	totalCount = [];
	const message: ProgressRequest = { type: "progress" };
	for (const worker of workers) {
		worker.postMessage(message);
	}
}

const DEAL_SET = ["E", "E", "E", "E", "E", "K", "K", "K", "N", "N", "N", "N", "N", "W", "W", "W", "W", "W"];
const SEGMENT_SIZE = 127008;
const SEGMENT_COUNT = 4862;
const TOTAL_HANDS = SEGMENT_SIZE * SEGMENT_COUNT; // 617512896 = C(18, 5) * C(13, 5) * C(8, 5)

function getNthPermutation(set: string[], n: number): string {
	if (set.length === 0) {
		return "";
	}
	const uniqueCharacters: string[] = [];
	const counts: { [key: string]: number } = {};
	for (const character of set) {
		if (!counts[character]) {
			counts[character] = 1;
			uniqueCharacters.push(character);
		} else {
			counts[character]++;
		}
	}
	let permutations = 0;
	for (const character of uniqueCharacters) {
		const subset = set.slice();
		subset.splice(set.indexOf(character), 1);
		const subsetPermutations = numberOfPermutations(subset);
		if (permutations + subsetPermutations > n) {
			return character + getNthPermutation(subset, n - permutations);
		}
		permutations += subsetPermutations;
	}
	return "";
}

function numberOfPermutations(set: string[]): number {
	const uniqueCharacters: string[] = [];
	const counts: { [key: string]: number } = {};
	for (const character of set) {
		if (!counts[character]) {
			counts[character] = 1;
			uniqueCharacters.push(character);
		} else {
			counts[character]++;
		}
	}
	let totalCharacters = set.length;
	let permutations = 1;
	for (const character of uniqueCharacters) {
		const n = totalCharacters;
		const k = counts[character];
		permutations *= factorial(n, k) / factorial(n - k, 1);
		totalCharacters -= k;
	}
	return permutations;
}

let factorialCache: number[][] = [];
function factorial(n: number, k: number): number {
	if (!factorialCache[n]) {
		factorialCache[n] = [];
	}
	if (!factorialCache[n][k]) {
		if (n <= k) {
			factorialCache[n][k] = 1;
		} else {
			factorialCache[n][k] = n * factorial(n - 1, k);
		}
	}
	return factorialCache[n][k];
}

function handleMessage(message: MessageEvent): void {
	const data: SimulationResponse = message.data;
	switch (data.type) {
		case "progress":
			totalCount[data.workerId] = data.numberProcessed;
			let count = 0;
			for (let i = 0; i < workers.length; i++) {
				if (!totalCount[i]) {
					return;
				}
				count += totalCount[i];
			}
			const timeString = formatTime((performance.now() - startTime) / 1000);
			for (let i = 0; i < segmentNumber; i++) {
				if (hasResults[i]) {
					count += SEGMENT_SIZE;
				}
			}
			updateLog(`${formatCount(count)}: ${timeString}<br/>`);
			break;
		case "results":
			hasResults[data.segmentNumber] = true;
			const results = data.results;
			totalResults.won += results.won;
			totalResults.lost += results.lost;
			for (const i of POINT_VALUES) {
				totalResults.pointValues[i] += results.pointValues[i];
			}
			if (segmentNumber < SEGMENT_COUNT) {
				startSimulatingChunk(data.workerId);
				return;
			}
			for (let i = 0; i < SEGMENT_COUNT; i++) {
				if (!hasResults[i]) {
					return;
				}
			}
			done(totalResults);
			break;
	}
}

function done(results: Results): void {
	clearInterval(intervalHandle);
	displayResults(results);
	const message: StopRequest = { type: "stop" };
	for (const worker of workers) {
		worker.postMessage(message);
	}
}

const POINT_VALUES = [-2, 1, 2, 4];
function createBlankResults(): Results {
	const results: Results = {
		won: 0,
		lost: 0,
		pointValues: {},
	};
	for (const i of POINT_VALUES) {
		results.pointValues[i] = 0;
	}
	return results;
}

function displayResults(results: Results): void {
	updateLog(`<h4>Results:</h4>`);
	updateLog(`Wins: ${formatCount(results.won)}<br/>`);
	updateLog(`Losses: ${formatCount(results.lost)}<br/>`);
	let expectedPointGain = 0;
	let count = 0;
	for (const pointChange of POINT_VALUES) {
		const resultCount = results.pointValues[pointChange];
		const changeString = pointChange > 0 ? "Gained " + pointChange : "Lost " + -pointChange;
		updateLog(`${changeString} points: ${formatCount(resultCount)}<br/>`);
		count += resultCount;
		expectedPointGain += pointChange * resultCount;
	}
	expectedPointGain /= count;
	updateLog(`Expected point gain: ${expectedPointGain.toFixed(2)}<br/>`);
	const timeString = formatTime((performance.now() - startTime) / 1000);
	updateLog(`Total time: ${timeString}<br/>`);

}

function formatCount(count: number): string {
	const percent = count / TOTAL_HANDS * 100;
	const percentString = percent.toFixed(7 - percent.toFixed(3).length);
	let suffix = "";
	if (count > 1e6) {
		count /= 1e6;
		suffix = "M";
	} else if (count > 1e3) {
		count /= 1e3;
		suffix = "K";
	}
	let countString = count.toFixed(0);
	if (suffix) {
		countString = count.toFixed(4 - countString.length) + suffix;
	}
	return `${countString} (${percentString}%)`;
}

function formatTime(seconds: number): string {
	if (seconds < 10) {
		return `${seconds.toFixed(3)}s`;
	}
	if (seconds < 100) {
		return `${seconds.toFixed(2)}s`;
	}
	let minutes = Math.floor(seconds / 60);
	if (minutes < 100) {
		seconds = Math.floor(seconds) % 60;
		return `${minutes}m${seconds}s`;
	}
	let hours = Math.floor(minutes / 60);
	if (hours < 100) {
		minutes = minutes % 60;
		return `${hours}h${minutes}m`;
	}
	const days = Math.floor(hours / 24);
	hours = hours % 24;
	return `${days}d${hours}h`;
}