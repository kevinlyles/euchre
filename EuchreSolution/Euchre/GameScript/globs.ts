/*****************************************************************************
 * Globals n stuff
 *****************************************************************************/

//the game being played
let game: Game;

enum Player {
	South,
	West,
	North,
	East,
}

enum Team {
	NorthSouth,
	EastWest,
}

enum MessageLevel {
	Step,
	Game,
	Multigame,
}

const DECKSIZE = 24;

//sorted deck of cards
//we create all the card objects used here
const SORTEDDECK: Card[] = buildSortedDeck();

function buildSortedDeck(): Card[] {
	let deck: Card[] = [];
	let ranks: Rank[] = [Rank.Nine, Rank.Ten, Rank.Jack, Rank.Queen, Rank.King, Rank.Ace];

	for (let suit of suitsArray) {
		for (let rank of ranks) {
			deck.push(new Card(suit, rank));
		}
	}
	return deck;
}

//dictionary of cards, keyed by card ID
//points to the cards we made for the sorted deck
let DECKDICT: { [index: string]: Card } = {};
for (let i = 0; i < DECKSIZE; i++) {
	DECKDICT[SORTEDDECK[i].id] = SORTEDDECK[i];
}

let zIndex = 0; //iterated to make sure recently moved cards end up on top