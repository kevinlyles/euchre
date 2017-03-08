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

	updateLog("Starting computation...<br/>");
	disappearMenu("simulateHand");
	startWorker(hand, trumpCandidate, dealer, orderItUp, discard, suitToCall, goAlone);
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

/*function startWorker(hand: Card[], trumpCandidate: Card, dealer: Player.South,
	orderItUp: true, discard: Card, suitToCall: null, goAlone: boolean): void
function startWorker(hand: Card[], trumpCandidate: Card, dealer: Player.North | Player.East | Player.West,
	orderItUp: true, discard: null, suitToCall: null, goAlone: boolean): void
function startWorker(hand: Card[], trumpCandidate: Card, dealer: Player,
	orderItUp: false, discard: null, suitToCall: Suit, goAlone: boolean): void
function startWorker(hand: Card[], trumpCandidate: Card, dealer: Player,
	orderItUp: false, discard: null, suitToCall: null, goAlone: false): void*/
function startWorker(hand: Card[], trumpCandidate: Card, dealer: Player,
	orderItUp: boolean, discard: Card | null, suitToCall: Suit | null,
	goAlone: boolean): void {
	const deck = buildDeck(hand, trumpCandidate);

	const workerAsString = "(" + simulateHand_worker.toString() + ")()";
	const blob = new Blob([workerAsString], { type: "text/javascript" });
	const worker = new Worker(URL.createObjectURL(blob));
	worker.onmessage = handleMessage;
	startTime = performance.now();
	let url = document.location.href;
	const index = url.lastIndexOf("/");
	url = url.substring(0, index + 1);
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
	]);
}

let startTime: number;

function handleMessage(message: MessageEvent) {
	const data: any[] = message.data;
	if (data[0] === "progress") {
		const count: number = data[1];
		const timeString = formatTime((performance.now() - startTime) / 1000);
		updateLog(`${formatCount(count)}: ${timeString}<br/>`);
	} else if (data[0] === "result") {
		const result = data[1];
		updateLog(`Result:<br/>`);
		updateLog(`Wins: ${formatCount(result.true)}<br/>`);
		updateLog(`Losses: ${formatCount(result.false)}<br/>`);
		let expectedPointGain = 0;
		let count = 0;
		for (const i in result) {
			if (i === "true" || i === "false") {
				continue;
			}
			const pointChange = parseInt(i, 10);
			const resultCount = result[i];
			const changeString = pointChange > 0 ? "Gained" : "Lost";
			updateLog(`${changeString} ${i} points: ${formatCount(resultCount)}<br/>`);
			count += resultCount;
			expectedPointGain += pointChange * resultCount;
		}
		expectedPointGain /= count;
		updateLog(`Expected point gain: ${expectedPointGain.toFixed(2)}<br/>`);
		const timeString = formatTime((performance.now() - startTime) / 1000);
		updateLog(`Total time: ${timeString}<br/>`);
	}
}

function formatCount(count: number): string {
	const percent = count / 617512896 * 100; // 617512896 = C(18,5) * C(13, 5) * C(8, 5)
	const percentString = percent.toFixed(4 - percent.toFixed(0).length);
	let suffix = "";
	if (count > 1e6) {
		count /= 1e6;
		suffix = "M";
	} else if (count > 1e3) {
		count /= 1e3;
		suffix = "K";
	}
	const countString = count.toFixed(4 - count.toFixed(0).length) + suffix;
	return `${countString} (${percentString}%)`;
}

function formatTime(time: number): string {
	if (time < 10) {
		return `${time.toFixed(3)}s`;
	}
	if (time < 100) {
		return `${time.toFixed(2)}s`;
	}
	const minutes = Math.floor(time / 60);
	if (minutes < 100) {
		const seconds = Math.floor(time % 60);
		return `${minutes}m${seconds}s`;
	}
	const hours = Math.floor(minutes / 60);
	if (hours < 100) {
		return `${hours}h${minutes}m`;
	}
	const days = Math.floor(hours / 24);
	return `${days}d${hours}h`;
}