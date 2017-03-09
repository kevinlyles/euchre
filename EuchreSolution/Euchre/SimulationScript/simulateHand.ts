function startSimulation(): void {
	let hand: Card[] = [];

	for (let i = 1; i <= 5; i++) {
		let card = getCard("card" + i, "Card " + i);
		if (!card) {
			return;
		}
		hand.push(card);
	}

	let trumpCandidate = getCard("trumpCandidate", "Trump candidate card");
	if (!trumpCandidate) {
		return;
	}

	let dealerSelect = document.getElementById("dealerSelect") as HTMLSelectElement;
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

	let orderItUpCheckbox = document.getElementById("orderItUp") as HTMLInputElement;
	let discard: Card | null = null;
	let orderItUp = false;
	let suitToCall: Suit | null = null;
	let goAlone = false;
	if (!orderItUpCheckbox.disabled) {
		orderItUp = orderItUpCheckbox.checked;
	}
	if (orderItUp) {
		if (dealer === Player.South) {
			let discardSelect = document.getElementById("discardSelect") as HTMLSelectElement;
			let discardIndex = discardSelect.selectedIndex;
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
		let suitToCallSelect = document.getElementById("suitToCall") as HTMLSelectElement;
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
		let goAloneCheckbox = document.getElementById("goAlone") as HTMLInputElement;
		goAlone = goAloneCheckbox.checked;
	}
	let numberOfThreadsSelect = document.getElementById("numberOfThreads") as HTMLSelectElement;
	let numberOfThreads = parseInt(numberOfThreadsSelect.value);

	updateLog("Starting computation...<br/>");
	disappearMenu("simulateHand");
	startWorkers(hand, trumpCandidate, dealer, orderItUp, discard, suitToCall, goAlone, numberOfThreads);
}

function getCard(elementIdBase: string, cardName?: string): Card | null {
	let suitSelect = document.getElementById(elementIdBase + "Suit") as HTMLSelectElement;
	if (!suitSelect.value) {
		if (cardName) alert(cardName + " has no suit.");
		suitSelect.focus();
		return null;
	}
	let rankSelect = document.getElementById(elementIdBase + "Rank") as HTMLSelectElement;
	if (!rankSelect.value) {
		if (cardName) alert(cardName + " has no rank.");
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
			if (cardName) alert("Invalid suit for " + cardName.toLocaleLowerCase() + ": " + suitSelect.value);
			return null;
	}

	let rank = +rankSelect.value;
	if (!Rank[rank]) {
		if (cardName) alert("Invalid rank for " + cardName.toLocaleLowerCase() + ": " + rankSelect.value);
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
			let compareCard = getCard("card" + i);
			if (compareCard && compareCard.id === card.id) {
				let rankSelect = document.getElementById("card" + i + "Rank") as HTMLSelectElement;
				rankSelect.value = "";
			}
		}
	}
	if (cardNumber !== 0) {
		let compareCard = getCard("trumpCandidate");
		if (compareCard && compareCard.id === card.id) {
			let rankSelect = document.getElementById("trumpCandidateRank") as HTMLSelectElement;
			rankSelect.value = "";
		}
	}
}

function updateDiscardCard(index: number, card: Card | null): void {
	let discardSelect = document.getElementById("discardSelect") as HTMLSelectElement;
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
	let hand: (Card | null)[] = [];
	let discardSelect = document.getElementById("discardSelect") as HTMLSelectElement;
	for (let i = 1; i <= 5; i++) {
		let card = getCard("card" + i);
		hand.push(card);
		updateDiscardCard(i, card);
	}

	let trumpCandidate = getCard("trumpCandidate");
	updateDiscardCard(6, trumpCandidate);

	let orderItUpCheckbox = document.getElementById("orderItUp") as HTMLInputElement;
	let hasSuit = false;
	if (trumpCandidate) {
		for (let card of hand) {
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

	let dealerSelect = document.getElementById("dealerSelect") as HTMLSelectElement;
	if (dealerSelect.value === "S" && orderItUpCheckbox.checked) {
		discardSelect.disabled = false;
	} else {
		discardSelect.disabled = true;
		if (dealerSelect.value !== "S") {
			discardSelect.value = "";
		}
	}

	let suitToCallSelect = document.getElementById("suitToCall") as HTMLSelectElement;
	if (!orderItUpCheckbox.disabled && orderItUpCheckbox.checked) {
		suitToCallSelect.disabled = true;
		suitToCallSelect.value = "";
	} else {
		suitToCallSelect.disabled = false;
	}

	let goAloneCheckbox = document.getElementById("goAlone") as HTMLInputElement;
	if ((!orderItUpCheckbox.disabled && orderItUpCheckbox.checked) || suitToCallSelect.value) {
		goAloneCheckbox.disabled = false;
	} else {
		goAloneCheckbox.disabled = true;
		goAloneCheckbox.checked = false;
	}
}

function buildDeck(hand: Card[], trumpCandidate: Card): Card[] {
	let idsToSkip = { [trumpCandidate.id]: true };
	for (let card of hand) {
		idsToSkip[card.id] = true;
	}
	let deck: Card[] = [];
	for (let suit of suitsArray) {
		for (let rank = Rank.Nine; rank <= Rank.Ace; rank++) {
			let card = new Card(suit, rank);
			if (!idsToSkip[card.id]) {
				deck.push(card);
			}
		}
	}
	return deck;
}

/*function startWorkers(hand: Card[], trumpCandidate: Card, dealer: Player.South, orderItUp: true, discard: Card, suitToCall: null, goAlone: boolean): void
function startWorkers(hand: Card[], trumpCandidate: Card, dealer: Player.North | Player.East | Player.West, orderItUp: true, discard: null, suitToCall: null, goAlone: boolean): void
function startWorkers(hand: Card[], trumpCandidate: Card, dealer: Player, orderItUp: false, discard: null, suitToCall: Suit, goAlone: boolean): void
function startWorkers(hand: Card[], trumpCandidate: Card, dealer: Player, orderItUp: false, discard: null, suitToCall: null, goAlone: false): void*/
function startWorkers(hand: Card[], trumpCandidate: Card, dealer: Player,
	orderItUp: boolean, discard: Card | null, suitToCall: Suit | null,
	goAlone: boolean, numberOfThreads: number = 1): void {
	let deck = buildDeck(hand, trumpCandidate);

	var workerAsString = "(" + simulateHand_worker.toString() + ")()";
	var blob = new Blob([workerAsString], { type: 'text/javascript' });
	startTime = performance.now();
	threadNumber = 0;
	let url = document.location.href;
	let index = url.lastIndexOf("/");
	url = url.substring(0, index + 1);

	//TODO: switch this from the workers checking each time to a timer?
	for (let i = 0; i < numberOfThreads; i++) {
		var worker = new Worker(URL.createObjectURL(blob));
		worker.onmessage = handleMessage(numberOfThreads);
		worker.postMessage([
			deck,
			hand,
			trumpCandidate,
			dealer,
			orderItUp,
			discard,
			suitToCall,
			goAlone,
			url,
			breakPoints[numberOfThreads][threadNumber - 1],
			breakPoints[numberOfThreads][threadNumber],
		]);
	}
}

const breakPoints: { [index: number]: string[] } = {
	1: [],
	2: ["NENWWNNEWKKNEKEEWW"],
	3: ["KKKNEEEEENNNNWWWWW", "NWKEENENKWNKWWEENW"],
	4: ["EWNNWNWEKKEENNEKWW", "NENWWNNEWKKNEKEEWW", "WEKNEWNENWWWEKEKNN"],
	5: ["EWEEWWKWNENNWKKNEN", "KWEKEWNKWNNNEEEWWN", "NNKKENWKWEEWWNWENE", "WEWWEENNEEKNNKWWNK"],
	6: ["ENNWKNWWEENWKNEEKW", "KKKNEEEEENNNNWWWWW", "NENWWNNEWKKNEKEEWW", "NWKEENENKWNKWWEENW", "WKNNENKNNWKEWEWEWE"],
	7: ["ENKNNEWENWWNEWEKKW", "KEENWWNENWWWEKEKNN", "KWNWEKEEWNNNNWEEKW", "NKWWEEWENENKKNENWW", "NWWNEWENKKEWEWNEKN", "WNEENNWNENWEWEKWKK"],
	8: ["ENENNENEWEWWNKKWWK", "EWNNWNWEKKEENNEKWW", "KNNNNNWEEEEEKKWWWW", "NENWWNNEWKKNEKEEWW", "NNWEWEEKKNKNNWEEWW", "WEKNEWNENWWWEKEKNN", "WNEWKWNWKEEKNWNENE"],
	9: ["EKWWENWKEENNWWNEKN", "EWKKWEWWNEKNENNWNE", "KKKNEEEEENNNNWWWWW", "NEEEEEKKKNNNNWWWWW", "NKNNWWENEKWEEKEWWN", "NWKEENENKWNKWWEENW", "WENWENKKEENWWNKNEW", "WNKNWEWEKENEWENNWK"],
	10: ["EKWEKENNWNENNEKWWW", "EWEEWWKWNENNWKKNEN", "KENEWWNENEKEWWWNNK", "KWEKEWNKWNNNEEEWWN", "NENWWNNEWKKNEKEEWW", "NNKKENWKWEEWWNWENE", "NWNWNKEWEKWEWEENKN", "WEWWEENNEEKNNKWWNK", "WNNEWNNKKEWKEEWWEN"],
	11: ["EKNNEWWENNEWNKEKWW", "ENWKWNEWWEENKNWEKN", "EWWNWKEKNNWEENEWKN", "KNKEWWNEEENWNEWNKW", "NEENKWENEWNWKNEKWW", "NKKNWWKWENEEWEWNEN", "NNWWENKWENNKKWEEEW", "WEEKKEWEENWNKWNNNW", "WKEWNWKNNWNEKEENWE", "WNNWEENENKENWKWKEW"],
	12: ["EKKWWEWWNEKNENNWNE", "ENNWKNWWEENWKNEEKW", "EWNNWNWEKKEENNEKWW", "KKKNEEEEENNNNWWWWW", "KWKWWKNEEEEENNNNWW", "NENWWNNEWKKNEKEEWW", "NNEKWEEWNWKKNEENWW", "NWKEENENKWNKWWEENW", "WEKNEWNENWWWEKEKNN", "WKNNENKNNWKEWEWEWE", "WNWEKKEWENENWKENNW"],
	13: ["EKEWWNEKNEKWNWNEWN", "ENNEWENKNKWWEWWEKN", "EWKWNWKWEEWENNKENN", "KENWEWNWKENNNWEEKW", "KNWEWNKNENWEKWNEEW", "NEEWNKEWWWKNWENEKN", "NKEWKWNNNWNKEEWEEW", "NNNNNWEEEEEKKKWWWW", "NWNNEEEKWKEWENWKNW", "WENKWNEWNNEEKWWEKN", "WKWKWENNWEKNEWEENN", "WNWKNEEEKKNWNWEENW"],
	14: ["EKENNNKEWNWEWNEKWW", "ENKNNEWENWWNEWEKKW", "EWEWNKWWNNWNKEEKEN", "KEENWWNENWWWEKEKNN", "KNEWEKWNNEKNNWEEWW", "KWNWEKEEWNNNNWEEKW", "NENWWNNEWKKNEKEEWW", "NKWWEEWENENKKNENWW", "NWEEKNWEKWNKNEENWW", "NWWNEWENKKEWEWNEKN", "WEWEKWNKNENNNWEEKW", "WNEENNWNENWEWEKWKK", "WNWNNEWEKEKEWENNWK"],
	15: ["EKEENWKKNNWNENEWWW", "ENEWWKEKKNWNWNWNEE", "EWEEWWKWNENNWKKNEN", "EWWKWNNNNWKEKWEEEN", "KKKNEEEEENNNNWWWWW", "KWEKEWNKWNNNEEEWWN", "NEKENKNEWNWWENKWWE", "NKENEWWKENNEKNWEWW", "NNKKENWKWEEWWNWENE", "NWKEENENKWNKWWEENW", "WEENNEEKWNNWNKWKEW", "WEWWEENNEEKNNKWWNK", "WNENEWWEKNKWENNEWK", "WNWWNEWWEKKNENKEEN"],
	16: ["EEWWNENKWWENWKEKNN", "ENENNENEWEWWNKKWWK", "ENWNWEKENWEWNWEKKN", "EWNNWNWEKKEENNEKWW", "KEWEKKNEEENNNNWWWW", "KNNNNNWEEEEEKKWWWW", "KWWKNWNEKEWNEWEENN", "NENWWNNEWKKNEKEEWW", "NKWENKEEWWENKWENNW", "NNWEWEEKKNKNNWEEWW", "NWNEWNKNEWENWEEKKW", "WEKNEWNENWWWEKEKNN", "WKENNENWEKNWEKENWW", "WNEWKWNWKEEKNWNENE", "WWEENKENWNKNENEKWW"],
};

let startTime: number;
let threadNumber: number;
let totalCount: number[] = [];
let totalResults: { [index: string]: number }[] = [];

function handleMessage(numberOfThreads: number): (message: MessageEvent) => void {
	let thread = threadNumber;
	let handler = function (message: MessageEvent) {
		let data: any[] = message.data;
		if (data[0] === "progress") {
			let count: number = data[1];
			totalCount[thread] = count;
			count = 0;
			for (let i = 0; i < numberOfThreads; i++) {
				if (!totalCount[i]) {
					return;
				}
				count += totalCount[i];
			}
			let timeString = formatTime((performance.now() - startTime) / 1000);
			updateLog(`${formatCount(count)}: ${timeString}<br/>`);
			totalCount = [];
		} else if (data[0] === "result") {
			let result: { [index: string]: number } = data[1];
			totalResults[thread] = result;
			result = {};
			for (let i = 0; i < numberOfThreads; i++) {
				if (!totalResults[i]) {
					return;
				}
				for (let j in totalResults[i]) {
					if (result[j] === undefined) {
						result[j] = totalResults[i][j]
					} else {
						result[j] += totalResults[i][j];
					}
				}
			}
			updateLog(`<h4>Results:</h4>`);
			updateLog(`Wins: ${formatCount(result["true"])}<br/>`);
			updateLog(`Losses: ${formatCount(result["false"])}<br/>`);
			let expectedPointGain = 0;
			let count = 0;
			for (let i in result) {
				if (i === "true" || i === "false") {
					continue;
				}
				let pointChange = parseInt(i);
				let resultCount = result[i];
				let changeString = pointChange > 0 ? "Gained " + pointChange : "Lost " + -pointChange;
				updateLog(`${changeString} points: ${formatCount(resultCount)}<br/>`);
				count += resultCount;
				expectedPointGain += pointChange * resultCount;
			}
			expectedPointGain /= count;
			updateLog(`Expected point gain: ${expectedPointGain.toFixed(2)}<br/>`);
			let timeString = formatTime((performance.now() - startTime) / 1000);
			updateLog(`Total time: ${timeString}<br/>`);
		}
	}
	threadNumber++;
	return handler;
}

function formatCount(count: number): string {
	let percent = count / 617512896 * 100; // 617512896 = C(18,5) * C(13, 5) * C(8, 5)
	let percentString = percent.toFixed(4 - percent.toFixed(0).length);
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
		return `${seconds.toFixed(3)}s`
	}
	if (seconds < 100) {
		return `${seconds.toFixed(2)}s`
	}
	let minutes = Math.floor(seconds / 60);
	if (minutes < 100) {
		seconds = Math.floor(seconds) % 60;
		return `${minutes}m${seconds}s`
	}
	let hours = Math.floor(minutes / 60);
	if (hours < 100) {
		minutes = minutes % 60;
		return `${hours}h${minutes}m`
	}
	let days = Math.floor(hours / 24);
	hours = hours % 24;
	return `${days}d${hours}h`
}