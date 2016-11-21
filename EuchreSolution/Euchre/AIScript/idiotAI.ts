/******************************************************
/* Never bids
/* Plays its first legal move
/*******************************************************/

class IdiotAI implements EuchreAI{

    init() {
        //just chillin'
    }

	chooseOrderUp(){
		return false;
	}

	pickDiscard(){
		var hand;

		hand = game.myHand();
		return hand[0];
	}

	pickTrump(){
		return null;
	}

	chooseGoAlone(){
		return false;
	}

	pickCard(){
		var hand;

		hand = game.myHand();
		for(var i=0; i<hand.length; i++){
		    if (isValidPlay(hand, hand[i], game.getTrickSuit())) {
				return hand[i];
			}
		}
		//we will never reach this but just in case
		return hand[0];
	}
}