class MaliciousCard extends Card {
	private __startingSuit: Suit;
	private __laterSuit: Suit;
	private __suitCount: number;
	private __suitAccessCount = 0;
	private __startingRank: Rank;
	private __laterRank: Rank;
	private __rankCount: number;
	private __rankAccessCount = 0;
	private __startingId: string;
	private __laterId: string;
	private __idCount: number;
	private __idAccessCount = 0;

	constructor(startingSuit: Suit, laterSuit: Suit, suitCount: number,
		startingRank: Rank, laterRank: Rank, rankCount: number,
		startingId: string, laterId: string, idCount: number) {
		super(startingSuit, startingRank);
		this.__startingSuit = startingSuit;
		this.__laterSuit = laterSuit;
		this.__suitCount = suitCount;
		this.__startingRank = startingRank;
		this.__laterRank = laterRank;
		this.__rankCount = rankCount;
		this.__startingId = startingId;
		this.__laterId = laterId;
		this.__idCount = idCount;
	}

	get suit(): Suit {
		this.__suitAccessCount++;
		if (this.__suitAccessCount === this.__suitCount + 1) {
			return this.__startingSuit;
		}
		return this.__laterSuit;
	}

	set suit(suit: Suit) {
		this.__startingSuit = suit;
		this.__suitAccessCount = 0;
	}

	get rank(): Rank {
		this.__rankAccessCount++;
		if (this.__suitAccessCount === this.__rankCount + 1) {
			return this.__startingRank;
		}
		return this.__laterRank;
	}

	set rank(rank: Rank) {
		this.__startingRank = rank;
		this.__rankAccessCount = 0;
	}

	get id(): string {
		this.__idAccessCount++;
		if (this.__idAccessCount === this.__idCount + 1) {
			return this.__startingId;
		}
		return this.__laterId;
	}

	set id(id: string) {
		this.__startingId = id;
		this.__idAccessCount = 0;
	}
}