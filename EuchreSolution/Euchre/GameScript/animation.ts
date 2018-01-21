///////////////////
// UI and Animation
///////////////////

//TODO: make all the card elements at once instead of making them as we deal

declare var controller: Controller | null;

function makeCardElem(cardID: string): HTMLDivElement {
	let card;

	card = document.createElement("div");
	card.className = "card";
	card.id = cardID;
	animFlipCard(card, false);

	const cardsContainer = document.getElementById("cardsContainer") as HTMLElement;
	cardsContainer.appendChild(card);

	card.style.zIndex = zIndex.toString();
	zIndex++;

	return card;
}

function animMoveCard(cardID: string, top: string, left: string, z?: string): void {
	const div = document.getElementById(cardID) as HTMLDivElement | null;
	if (!div) { return; }

	div.style.top = top;
	div.style.left = left;
	if (z) {
		div.style.zIndex = z;
	} else {
		div.style.zIndex = zIndex.toString();
	}
	zIndex++;
}

function animDeal(hands: Card[][], trumpCandidate: Card, dealer: Player,
	settings: Settings, callback: () => void): void {

	if (!controller || controller.isStatMode()) { return; }

	const isOpenHands = settings.openHands;
	const hasHooman = settings.hasHooman;

	const trumpCandidateId = trumpCandidate.id;
	const startDealDelegate = () => {
		animClearTable();
		animPlaceDealerButt(dealer);
		makeCardElem("deck");
		makeCardElem(trumpCandidateId);
	};
	AnimController.queueAnimation(AnimType.DealHands, startDealDelegate);

	let player = dealer;
	for (let i = 0; i < hands.length; i++) {
		player = getNextPlayer(player);
		const flippedUp = (isOpenHands || (hasHooman && player === Player.South));
		const dealThree = (dealer + i) % 2;
		const cardsToDeal: string[] = [];

		const playerCopy = player;
		const dealFirstRoundDelegate = () => {
			for (let j = 0; j < 2 + dealThree; j++) {
				const cardID = hands[playerCopy][j].id;
				const cardElem = makeCardElem(cardID);
				if (hasHooman && playerCopy === Player.South) {
					cardElem.addEventListener("click", clickCard);
				}
				cardsToDeal.push(cardID);
			}

			for (let j = 0; j < cardsToDeal.length; j++) {
				animDealSingle(playerCopy, cardsToDeal[j], j, flippedUp);
			}
		};
		AnimController.queueAnimation(AnimType.DealHands, dealFirstRoundDelegate);
	}
	for (let i = 0; i < hands.length; i++) {
		player = getNextPlayer(player);
		const flippedUp = (isOpenHands || (hasHooman && player === Player.South));
		const dealThree = (dealer + i) % 2;
		const cardsToDeal: string[] = [];

		const playerCopy = player;
		const dealSecondRoundDelegate = () => {
			for (let j = 2 + dealThree; j < hands[playerCopy].length; j++) {
				const cardID = hands[playerCopy][j].id;
				const cardElem = makeCardElem(cardID);
				if (hasHooman && playerCopy === Player.South) {
					cardElem.addEventListener("click", clickCard);
				}
				cardsToDeal.push(cardID);
			}

			for (let j = 0; j < cardsToDeal.length; j++) {
				animDealSingle(playerCopy, cardsToDeal[j], j + 2 + dealThree, flippedUp);
			}
		};
		AnimController.queueAnimation(AnimType.DealHands, dealSecondRoundDelegate);
	}

	const sortHandsDelegate = () => {
		for (const _ of hands) {
			player = getNextPlayer(player);
			const flippedUp = (isOpenHands || (hasHooman && player === Player.South));

			if (flippedUp) {
				animSortHand(hands[player], player);
			}
		}
	};
	AnimController.queueAnimation(AnimType.DealHands, sortHandsDelegate);

	const showTrumpCandidateCallback = () => {
		animFlipCard(trumpCandidateId, true);
		callback();
	};
	AnimController.queueAnimation(AnimType.DealHands, showTrumpCandidateCallback);
}

function animDealSingle(player: Player, cardID: string, cardPos: number, flippedUp: boolean): void {
	let top;
	let left;

	switch (player) {
		case Player.South:
			top = "450px";
			left = (cardPos * 20) + (320) + "px";
			break;
		case Player.West:
			top = "252px";
			left = (cardPos * 20) + (50) + "px";
			break;
		case Player.North:
			top = "50px";
			left = (cardPos * 20) + (320) + "px";
			break;
		case Player.East:
			top = "252px";
			left = (cardPos * 20) + (600) + "px";
			break;
		default:
			return;
	}

	if (flippedUp) {
		animFlipCard(cardID, true);
	}
	animMoveCard(cardID, top, left);
}

//gives trump to the dealer
function animTakeTrump(trumpCandidate: Card, discard: Card, isAIPlayer: boolean): void {
	if (!controller || controller.isStatMode()) { return; }

	const discardElem = document.getElementById(discard.id) as HTMLElement;
	const trumpElem = document.getElementById(trumpCandidate.id) as HTMLElement;
	const top = discardElem.style.top;
	const left = discardElem.style.left;

	animFlipCard(discardElem, false);
	setTimeout(animMoveCard, 100, discard.id, "252px", "364px");
	setTimeout(animHideCard, 400, discardElem);

	if (isAIPlayer && !controller.isOpenHands()) {
		animFlipCard(trumpElem, false);
	}
	setTimeout(animMoveCard, 200, trumpCandidate.id, top, left, discardElem.style.zIndex);
	//TODO: sort the hand again? Probably only if it's visible
	//TODO: make it look the same even if the picked up card gets discarded
	if (!isAIPlayer) {
		trumpElem.addEventListener("click", clickCard);
		discardElem.removeEventListener("click", clickCard);
	}
}

function animPlaceDealerButt(dealer: Player): void {
	if (!controller || controller.isStatMode()) { return; }

	let button;

	button = document.getElementById("dealerButton");
	if (button === null) {
		button = document.createElement("div");
		button.id = "dealerButton";
		const gameSpace = document.getElementById("gameSpace") as HTMLElement;
		gameSpace.appendChild(button);
	}
	switch (dealer) {
		case Player.South:
			button.style.top = "470px";
			button.style.left = "270px";
			break;
		case Player.West:
			button.style.top = "272px";
			button.style.left = "0px";
			break;
		case Player.North:
			button.style.top = "70px";
			button.style.left = "270px";
			break;
		case Player.East:
			button.style.top = "272px";
			button.style.left = "550px";
			break;
	}
}

//sorts human player hand by alphabetical suit (after trump), then rank
//within each suit
function animSortHand(hand: Card[], player: Player): void {
	if (!controller || controller.isStatMode()) { return; }

	const cardIds: { [index: number]: string } = {};
	const keys: number[] = [];

	for (const card of hand) {
		let key = 0;
		switch (card.suit) {
			case Suit.Spades:
				key += 100;
				break;
			case Suit.Diamonds:
				key += 200;
				break;
			case Suit.Clubs:
				key += 300;
				break;
			case Suit.Hearts:
				key += 400;
				break;
			default:
				break;
		}
		key += (20 - card.rank); //highest ranks come first
		keys.push(key);
		cardIds[key] = card.id;
	}

	keys.sort();
	let pos = 0;
	for (const key of keys) {
		animDealSingle(player, cardIds[key], pos++, false);
	}
	//TODO: make this avoid gaps, always look like things are moving
}

function animPlayCard(player: Player, cardID: string): void {
	if (!controller || controller.isStatMode()) { return; }

	const cardElem: HTMLElement | null = document.getElementById(cardID);
	if (!cardElem) { return; }

	let top: string = "";
	let left: string = "";

	animFlipCard(cardElem, true);

	switch (player) {
		case Player.South:
			top = "352px";
			left = "364px";
			break;
		case Player.West:
			top = "252px";
			left = "284px";
			break;
		case Player.North:
			top = "152px";
			left = "364px";
			break;
		case Player.East:
			top = "252px";
			left = "444px";
			break;
		default:
			return;
	}
	animMoveCard(cardID, top, left);
}

function getCardElement(cardIdOrElement: string | HTMLElement): HTMLElement | null {
	if (typeof (cardIdOrElement) === "string") {
		return document.getElementById(cardIdOrElement);
	} else {
		return cardIdOrElement;
	}
}

//check for class list and flip the other way too
//correct this in doBidding
function animFlipCard(cardIdOrElement: string | HTMLElement, faceUp: boolean): void {
	if (!controller || controller.isStatMode()) { return; }

	const cardElement = getCardElement(cardIdOrElement);
	if (!cardElement) {
		return;
	}
	if (faceUp) {
		cardElement.classList.remove("cardBack");
	} else {
		cardElement.classList.add("cardBack");
	}
}

function animWinTrick(player: Player, playedCards: PlayedCard[]): void {
	if (!controller || controller.isStatMode()) { return; }

	const callback = () => {
		let top;
		let left;

		switch (player) {
			case Player.South:
				top = "450px";
				left = "320px";
				break;
			case Player.West:
				top = "252px";
				left = "50px";
				break;
			case Player.North:
				top = "50px";
				left = "320px";
				break;
			case Player.East:
				top = "252px";
				left = "600px";
				break;
			default:
				return;
		}

		for (const playedCard of playedCards) {
			const cardElem = document.getElementById(playedCard.card.id) as HTMLElement;
			cardElem.style.top = top;
			cardElem.style.left = left;
			animFlipCard(cardElem, false);
			setTimeout(animHideCard, 400, cardElem);
		}
	};
	AnimController.queueAnimation(AnimType.WinTrick, callback);
}

/*function animRemoveKitty(): void {
	if (game.isStatMode()) return;

	let elem;
	let trumpCandidate;

	trumpCandidate = game.getTrumpCandidate() as Card;
	elem = document.getElementById("deck");
	setTimeout(animHideCard, 300, elem);
	if (trumpCandidate.suit !== game.getTrump()) { //trump candidate wasn't picked up
		elem = document.getElementById(trumpCandidate.id);
		setTimeout(animHideCard, 300, elem);
	}
}*/

function animHidePartnerHand(alonePlayer: Player, hands: Card[][]): void {
	if (!controller || controller.isStatMode()) { return; }

	const player = getPartner(alonePlayer);
	for (const card of hands[player]) {
		animHideCard(document.getElementById(card.id) as HTMLElement);
	}
}

function animHideCard(cardElem: HTMLElement): void {
	if (!controller || controller.isStatMode()) { return; }

	cardElem.style.display = "none";
}

function animClearTable(): void {
	if (!controller || controller.isStatMode()) { return; }

	const cardsContainer = document.getElementById("cardsContainer");
	if (cardsContainer) {
		cardsContainer.innerHTML = "";
	}
}

//let human player poke the buttons
function animEnableBidding(hand: Card[], bidStage: BidStage, trumpCandidate: Card): void {
	if (controller && controller.isStatMode()) { return; }

	// Make typescript happy
	const orderUpPrompt: HTMLElement = document.getElementById("orderUpPrompt") as HTMLElement;
	const orderUpButton: HTMLElement = document.getElementById("orderUp") as HTMLElement;
	const spadesButton: HTMLElement = document.getElementById("pickSpades") as HTMLElement;
	const clubsButton: HTMLElement = document.getElementById("pickClubs") as HTMLElement;
	const heartsButton: HTMLElement = document.getElementById("pickHearts") as HTMLElement;
	const diamondsButton: HTMLElement = document.getElementById("pickDiamonds") as HTMLElement;

	orderUpPrompt.style.display = "inline";

	// Bidding round 1
	if (bidStage === BidStage.Round1) {
		if (hasSuit(hand, trumpCandidate.suit)) {
			orderUpButton.style.display = "inline";
		}
		return;
	}

	// Bidding round 2
	if (trumpCandidate.suit !== Suit.Spades && hasSuit(hand, Suit.Spades)) {
		spadesButton.style.display = "inline";
	}
	if (trumpCandidate.suit !== Suit.Clubs && hasSuit(hand, Suit.Clubs)) {
		clubsButton.style.display = "inline";
	}
	if (trumpCandidate.suit !== Suit.Hearts && hasSuit(hand, Suit.Hearts)) {
		heartsButton.style.display = "inline";
	}
	if (trumpCandidate.suit !== Suit.Diamonds && hasSuit(hand, Suit.Diamonds)) {
		diamondsButton.style.display = "inline";
	}
}

function animDisableBidding(): void {
	if (controller && controller.isStatMode()) { return; }

	// Make typescript happy
	const orderUpPrompt: HTMLElement = document.getElementById("orderUpPrompt") as HTMLElement;
	const orderUpButton: HTMLElement = document.getElementById("orderUp") as HTMLElement;
	const spadesButton: HTMLElement = document.getElementById("pickSpades") as HTMLElement;
	const clubsButton: HTMLElement = document.getElementById("pickClubs") as HTMLElement;
	const heartsButton: HTMLElement = document.getElementById("pickHearts") as HTMLElement;
	const diamondsButton: HTMLElement = document.getElementById("pickDiamonds") as HTMLElement;
	const aloneButton: HTMLElement = document.getElementById("alone") as HTMLElement;

	orderUpPrompt.style.display = "none";
	orderUpButton.style.display = "none";

	spadesButton.style.display = "none";
	clubsButton.style.display = "none";
	heartsButton.style.display = "none";
	diamondsButton.style.display = "none";
	aloneButton.style.backgroundColor = "green";
}

function animShowText(text: string, messageLevel: MessageLevel, nest?: number, overwrite?: boolean): void {
	let allowedLevel: MessageLevel = MessageLevel.Step;
	if (controller) {
		allowedLevel = controller.getMessageLevel();
	}
	let logText = "";

	if (messageLevel < allowedLevel) { return; }

	if (nest === undefined) {
		nest = 0;
	}
	for (let i = 0; i < nest; i++) {
		logText += "&nbsp;&nbsp;";
	}

	logText += text + "<br>";

	if (controller && controller.isStatMode()) {
		if (overwrite) {
			controller.logText = logText;
		} else {
			controller.logText += logText;
		}
	} else {
		updateLog(logText, overwrite);
		//setTimeout(updateLog, 2000, logText, overwrite);
	}
}

function updateLog(text: string, overwrite?: boolean): void {
	const div = document.getElementById("sidebarText");
	if (!div) {
		return;
	}
	if (overwrite) {
		div.innerHTML = text;
	} else {
		div.innerHTML += text;
	}
	div.scrollTop = div.scrollHeight;
}

function animShowTextTop(text: string, overwrite?: boolean): void {
	const div = document.getElementById("sidebarTop");
	if (!div) {
		return;
	}
	if (overwrite) {
		div.innerHTML = "";
	}
	div.innerHTML += text + "<br>";
}

function disableActions(): void {
	const blanket = document.getElementById("blanket");
	if (blanket) {
		blanket.style.display = "inline";
	}
}

function enableActions(): void {
	const blanket = document.getElementById("blanket");
	if (blanket) {
		blanket.style.display = "none";
	}
}
