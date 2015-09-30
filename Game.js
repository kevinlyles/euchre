/***********
 *Game class
 ***********/

var dealerArray = ["South", "West", "North", "East"];

function Game(){
	//initialize some properties
	this.deck = [];
	this.deckSize = 24;
	this.hands = new Array(4);
	for(var i=0; i<4; i++){
			this.hands[i] = new Array(5);
		}
	
	this.trumpCandidate;
	this.trump = "";
	this.currentPlayer = "";
	this.dealer = 0;
	this.dealerName = "South";
	this.maker = "";
	this.alonePlayer = "";
	
	this.nsScore = 0; //north south
	this.weScore = 0; //west east
	
	this.handHistory = [];

	//functions start
	this.initNewGame = function(){
		this.getShuffledDeck();
		this.pickDealer();
	}

	this.pickDealer = function(){
		this.dealer = Math.floor(Math.random() * 4);
		this.dealerName = dealerArray[this.dealer];
		console.log(this.dealerName + this.dealer + " is the dealer.");
	}

	this.getShuffledDeck = function(){
		var pos,temp,size;
		size = 24;

		this.deck = [new Card("C","9"),
					 new Card("C","10"),
					 new Card("C","J"),
					 new Card("C","Q"),
					 new Card("C","K"),
					 new Card("C","A"),
					 new Card("S","9"),
					 new Card("S","10"),
					 new Card("S","J"),
					 new Card("S","Q"),
					 new Card("S","K"),
					 new Card("S","A"),
					 new Card("D","9"),
					 new Card("D","10"),
					 new Card("D","J"),
					 new Card("D","Q"),
					 new Card("D","K"),
					 new Card("D","A"),
					 new Card("H","9"),
					 new Card("H","10"),
					 new Card("H","J"),
					 new Card("H","Q"),
					 new Card("H","K"),
					 new Card("H","A")
					 ]

		for(var i=0; i<size; i++){
			pos = Math.floor(Math.random() * size)
			temp = this.deck[i];
			this.deck[i] = this.deck[pos];
			this.deck[pos] = temp;
		}
	}
}






