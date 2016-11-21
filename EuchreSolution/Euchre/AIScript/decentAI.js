/******************************************************
/* Bids if it has 3+ of the suit (including left, but not including pickup if first round dealer)
/* Will play the the lowest card that can beat all cards played so far
/* If last player and partner is winning, sluff
/*******************************************************/
var DecentAI = (function () {
    function DecentAI() {
        //Whatever just count trump
        this.calculateHandStrength = function (trumpSuit) {
            var smartlyCalculatedValue;
            smartlyCalculatedValue = numCardsOfSuit(this.hand, trumpSuit);
            if (this.theyHaveTheLeft(trumpSuit)) {
                smartlyCalculatedValue++;
            }
            //just number of trump you're holding yay
            return smartlyCalculatedValue;
        };
        this.theyHaveTheLeft = function (trumpSuit) {
            for (var i = 0; i < this.hand.length; i++) {
                if (this.hand[i].rank === Rank.Jack
                    && this.hand[i].suit === getOppositeSuit(trumpSuit)) {
                    return true;
                }
            }
            return false;
        };
    }
    //Called once hands have been dealt and the trump candidate is revealed
    //Params: none
    //Returns: none
    DecentAI.prototype.init = function () {
        this.hand = game.myHand();
    };
    //Bidding round 1, choose whether to order up or pass
    //Params: none
    //Returns: boolean
    DecentAI.prototype.chooseOrderUp = function () {
        this.handStrength = this.calculateHandStrength(game.getTrumpCandidateCard().suit);
        if (this.handStrength > 2)
            return true;
        return false;
    };
    //Bidding round 1, if trump is ordered up to you, pick a card to discard
    //Params: none
    //Returns: Card or null
    DecentAI.prototype.pickDiscard = function () {
        return getWorstCard();
    };
    //Bidding round 2, choose from the remaining suits or pass
    //Params: none
    //Returns: Suit or null
    DecentAI.prototype.pickTrump = function () {
        if (game.getTrumpCandidateCard().suit !== Suit.Clubs) {
            this.handStrength = this.calculateHandStrength(Suit.Clubs);
            if (this.handStrength > 2)
                return Suit.Clubs;
        }
        if (game.getTrumpCandidateCard().suit !== Suit.Diamonds) {
            this.handStrength = this.calculateHandStrength(Suit.Diamonds);
            if (this.handStrength > 2)
                return Suit.Diamonds;
        }
        if (game.getTrumpCandidateCard().suit !== Suit.Spades) {
            this.handStrength = this.calculateHandStrength(Suit.Spades);
            if (this.handStrength > 2)
                return Suit.Spades;
        }
        if (game.getTrumpCandidateCard().suit !== Suit.Hearts) {
            this.handStrength = this.calculateHandStrength(Suit.Hearts);
            if (this.handStrength > 2)
                return Suit.Hearts;
        }
        return null;
    };
    //Called at any bidding round after you've determined trump
    //Return true if going alone
    //Params: none
    //Returns: boolean
    DecentAI.prototype.chooseGoAlone = function () {
        if (this.handStrength > 150)
            return true;
        return false;
    };
    //Your turn to play a card
    //Params: none
    //Returns: Card or null
    DecentAI.prototype.pickCard = function () {
        var numPlayersPlayed;
        var playedCards;
        var lowestWinningCard = null;
        var lowestWinningValue = 1000;
        var winningValue = 0;
        var value;
        var i;
        this.hand = game.myHand(); //you need to do this or else
        numPlayersPlayed = game.getTrickPlayersPlayed();
        if (numPlayersPlayed === 0) {
            return getBestCard();
        }
        playedCards = game.getTrickPlayedCards();
        //Find currently winning value
        for (i = 0; i < playedCards.length; i++) {
            if (playedCards[i] === null)
                continue;
            value = getCardValue(playedCards[i]);
            if (value > winningValue) {
                winningValue = value;
            }
        }
        //I'm the last player
        if (numPlayersPlayed === 3) {
        }
        //If not last player, play the lowest card that can win
        //If we can't win, then sluff
        for (i = 0; i < this.hand.length; i++) {
            if (!isValidPlay(this.hand, this.hand[i], tricksuit))
                continue;
            value = getCardValue(hand[i]);
            if (value > winningValue) {
                if (value < lowestWinningValue) {
                    lowestWinningCard = this.hand[i];
                    lowestWinningValue = value;
                }
            }
        }
        if (lowestWinningCard) {
            return lowestWinningCard;
        }
        else {
            return getWorstCard(true);
        }
    };
    return DecentAI;
}());
