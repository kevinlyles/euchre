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
			if (cardName) { alert("Invalid suit for " + cardName.toLocaleLowerCase() + ": " + suitSelect.value); }
			return null;
	}

	const rank = +rankSelect.value;
	if (!Rank[rank]) {
		if (cardName) { alert("Invalid rank for " + cardName.toLocaleLowerCase() + ": " + rankSelect.value); }
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
let totalResults: Results[] = [];
let workers: Worker[];
let intervalHandle: number;

function startWorkers(hand: Card[], trumpCandidate: Card, dealer: Player,
	orderItUp: boolean, discard: Card | null, suitToCall: Suit | null,
	goAlone: boolean, numberOfThreads: number = 1): void {
	const deck = buildDeck(hand, trumpCandidate);

	const workerAsString = "(" + simulateHand_worker.toString() + ")()";
	const blob = new Blob([workerAsString], { type: "text/javascript" });
	startTime = performance.now();
	let url = document.location.href;
	const index = url.lastIndexOf("/");
	url = url.substring(0, index + 1);
	workers = [];

	for (let i = 0; i < numberOfThreads; i++) {
		const worker = new Worker(URL.createObjectURL(blob));
		worker.onmessage = handleMessage;
		const message: StartRequest = {
			type: "start",
			data: {
				workerId: i,
				deck,
				hand,
				trumpCandidate,
				dealer,
				orderItUp,
				discard,
				suitToCall,
				goAlone,
				baseURL: url,
				startPermutation: breakPoints[numberOfThreads][i - 1],
				endPermutation: breakPoints[numberOfThreads][i],
			},
		};
		worker.postMessage(message);
		workers[i] = worker;
	}
	intervalHandle = setInterval(checkProgress, 10000);
}

function checkProgress(): void {
	const message: ProgressRequest = { type: "progress" };
	for (const worker of workers) {
		worker.postMessage(message);
	}
}

const breakPoints: { [index: number]: string[] } = {
	1: [],
	2: ["NENWWNNEWKKNEKEEWW"],
	3: ["KKKNEEEEENNNNWWWWW", "NWKEENENKWNKWWEENW"],
	4: ["EWNNWNWEKKEENNEKWW", "NENWWNNEWKKNEKEEWW", "WEKNEWNENWWWEKEKNN"],
	5: ["EWEEWWKWNENNWKKNEN", "KWEKEWNKWNNNEEEWWN", "NNKKENWKWEEWWNWENE", "WEWWEENNEEKNNKWWNK"],
	6: ["ENNWKNWWEENWKNEEKW", "KKKNEEEEENNNNWWWWW", "NENWWNNEWKKNEKEEWW", "NWKEENENKWNKWWEENW", "WKNNENKNNWKEWEWEWE"],
	// tslint:disable-next-line:max-line-length
	7: ["ENKNNEWENWWNEWEKKW", "KEENWWNENWWWEKEKNN", "KWNWEKEEWNNNNWEEKW", "NKWWEEWENENKKNENWW", "NWWNEWENKKEWEWNEKN", "WNEENNWNENWEWEKWKK"],
	// tslint:disable-next-line:max-line-length
	8: ["ENENNENEWEWWNKKWWK", "EWNNWNWEKKEENNEKWW", "KNNNNNWEEEEEKKWWWW", "NENWWNNEWKKNEKEEWW", "NNWEWEEKKNKNNWEEWW", "WEKNEWNENWWWEKEKNN", "WNEWKWNWKEEKNWNENE"],
	// tslint:disable-next-line:max-line-length
	9: ["EKWWENWKEENNWWNEKN", "EWKKWEWWNEKNENNWNE", "KKKNEEEEENNNNWWWWW", "NEEEEEKKKNNNNWWWWW", "NKNNWWENEKWEEKEWWN", "NWKEENENKWNKWWEENW", "WENWENKKEENWWNKNEW", "WNKNWEWEKENEWENNWK"],
	// tslint:disable-next-line:max-line-length
	10: ["EKWEKENNWNENNEKWWW", "EWEEWWKWNENNWKKNEN", "KENEWWNENEKEWWWNNK", "KWEKEWNKWNNNEEEWWN", "NENWWNNEWKKNEKEEWW", "NNKKENWKWEEWWNWENE", "NWNWNKEWEKWEWEENKN", "WEWWEENNEEKNNKWWNK", "WNNEWNNKKEWKEEWWEN"],
	// tslint:disable-next-line:max-line-length
	11: ["EKNNEWWENNEWNKEKWW", "ENWKWNEWWEENKNWEKN", "EWWNWKEKNNWEENEWKN", "KNKEWWNEEENWNEWNKW", "NEENKWENEWNWKNEKWW", "NKKNWWKWENEEWEWNEN", "NNWWENKWENNKKWEEEW", "WEEKKEWEENWNKWNNNW", "WKEWNWKNNWNEKEENWE", "WNNWEENENKENWKWKEW"],
	// tslint:disable-next-line:max-line-length
	12: ["EKKWWEWWNEKNENNWNE", "ENNWKNWWEENWKNEEKW", "EWNNWNWEKKEENNEKWW", "KKKNEEEEENNNNWWWWW", "KWKWWKNEEEEENNNNWW", "NENWWNNEWKKNEKEEWW", "NNEKWEEWNWKKNEENWW", "NWKEENENKWNKWWEENW", "WEKNEWNENWWWEKEKNN", "WKNNENKNNWKEWEWEWE", "WNWEKKEWENENWKENNW"],
	// tslint:disable-next-line:max-line-length
	13: ["EKEWWNEKNEKWNWNEWN", "ENNEWENKNKWWEWWEKN", "EWKWNWKWEEWENNKENN", "KENWEWNWKENNNWEEKW", "KNWEWNKNENWEKWNEEW", "NEEWNKEWWWKNWENEKN", "NKEWKWNNNWNKEEWEEW", "NNNNNWEEEEEKKKWWWW", "NWNNEEEKWKEWENWKNW", "WENKWNEWNNEEKWWEKN", "WKWKWENNWEKNEWEENN", "WNWKNEEEKKNWNWEENW"],
	// tslint:disable-next-line:max-line-length
	14: ["EKENNNKEWNWEWNEKWW", "ENKNNEWENWWNEWEKKW", "EWEWNKWWNNWNKEEKEN", "KEENWWNENWWWEKEKNN", "KNEWEKWNNEKNNWEEWW", "KWNWEKEEWNNNNWEEKW", "NENWWNNEWKKNEKEEWW", "NKWWEEWENENKKNENWW", "NWEEKNWEKWNKNEENWW", "NWWNEWENKKEWEWNEKN", "WEWEKWNKNENNNWEEKW", "WNEENNWNENWEWEKWKK", "WNWNNEWEKEKEWENNWK"],
	// tslint:disable-next-line:max-line-length
	15: ["EKEENWKKNNWNENEWWW", "ENEWWKEKKNWNWNWNEE", "EWEEWWKWNENNWKKNEN", "EWWKWNNNNWKEKWEEEN", "KKKNEEEEENNNNWWWWW", "KWEKEWNKWNNNEEEWWN", "NEKENKNEWNWWENKWWE", "NKENEWWKENNEKNWEWW", "NNKKENWKWEEWWNWENE", "NWKEENENKWNKWWEENW", "WEENNEEKWNNWNKWKEW", "WEWWEENNEEKNNKWWNK", "WNENEWWEKNKWENNEWK", "WNWWNEWWEKKNENKEEN"],
	// tslint:disable-next-line:max-line-length
	16: ["EEWWNENKWWENWKEKNN", "ENENNENEWEWWNKKWWK", "ENWNWEKENWEWNWEKKN", "EWNNWNWEKKEENNEKWW", "KEWEKKNEEENNNNWWWW", "KNNNNNWEEEEEKKWWWW", "KWWKNWNEKEWNEWEENN", "NENWWNNEWKKNEKEEWW", "NKWENKEEWWENKWENNW", "NNWEWEEKKNKNNWEEWW", "NWNEWNKNEWENWEEKKW", "WEKNEWNENWWWEKEKNN", "WKENNENWEKNWEKENWW", "WNEWKWNWKEEKNWNENE", "WWEENKENWNKNENEKWW"],
};

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
			updateLog(`${formatCount(count)}: ${timeString}<br/>`);
			totalCount = [];
			break;
		case "results":
			totalResults[data.workerId] = data.results;
			const results = createBlankResults();
			for (let i = 0; i < workers.length; i++) {
				if (!totalResults[i]) {
					return;
				}
				results.won += totalResults[i].won;
				results.lost += totalResults[i].lost;
				for (const j of POINT_VALUES) {
					results.pointValues[j] += totalResults[i].pointValues[j];
				}
			}
			clearInterval(intervalHandle);
			displayResults(results);
			const stopMessage: StopRequest = { type: "stop" };
			for (const worker of workers) {
				worker.postMessage(stopMessage);
			}
			break;
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
	const percent = count / 617512896 * 100; // 617512896 = C(18,5) * C(13, 5) * C(8, 5)
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