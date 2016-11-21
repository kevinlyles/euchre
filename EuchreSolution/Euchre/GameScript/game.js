/*****************************************************************************
 * Game object
 *****************************************************************************/
function Game() {
    //#region Private variables
    //game
    var __nsScore; //north south
    var __ewScore; //east west
    //hand
    var __deck; //contains the shuffled deck or what's left of it after dealing
    var __gameStage; //bidding round 1, bidding round 2, or trick playing
    var __playersBid; //number of players who have bid so far
    var __hands; //2d array of everyone's hands
    var __trumpCandidateCard; //turned up card
    var __trumpSuit; //current trump suit
    var __dealer;
    var __maker; //player who called trump
    var __alonePlayer;
    var __numPlayers; //players playing this hand; this is usually 4 but can be 3 or 2 depending on loners
    var __nsTricksWon;
    var __ewTricksWon;
    //trick
    var __trickNum; //what trick we're on
    var __trickPlayersPlayed; //how many players have played this trick
    var __trickSuitLead; //the suit that was lead
    var __trickPlayedCards; //array of cards that have been played this trick so far
    var __currentPlayer;
    //settings
    var __sound;
    var __openHands;
    var __defendAlone;
    var __noTrump;
    var __showTrickHistory;
    var __statMode;
    var __aiPlayers = [null, null, null, null];
    var __hasHooman; //if there is a human player
    //#endregion
    //#region Get functions
    this.getGameStage = function () {
        return __gameStage;
    };
    this.getPlayersBid = function () {
        return __playersBid;
    };
    this.getNsScore = function () {
        return __nsScore;
    };
    this.getEwScore = function () {
        return __ewScore;
    };
    this.getTrumpCandidateCard = function () {
        var card;
        card = new Card(__trumpCandidateCard.suit, __trumpCandidateCard.rank);
        return card;
    };
    this.getTrumpSuit = function () {
        return __trumpSuit;
    };
    this.getDealer = function () {
        return __dealer;
    };
    this.getMaker = function () {
        return __maker;
    };
    this.getAlonePlayer = function () {
        return __alonePlayer;
    };
    this.getNumPlayers = function () {
        return __numPlayers;
    };
    this.getTrickNum = function () {
        return __trickNum;
    };
    this.getTrickPlayersPlayed = function () {
        return __trickPlayersPlayed;
    };
    this.getTrickSuit = function () {
        return __trickSuitLead;
    };
    this.getTrickPlayedCards = function () {
        var playedCards = [];
        var card;
        for (var i = 0; i < __trickPlayedCards.length; i++) {
            card = __trickPlayedCards[i];
            if (card === null) {
                playedCards[i] = null;
            }
            else {
                playedCards[i] = new Card(card.suit, card.rank);
            }
        }
        return playedCards;
    };
    this.getCurrentPlayer = function () {
        return __currentPlayer;
    };
    this.getNsTricksWon = function () {
        return __nsTricksWon;
    };
    this.getEwTricksWon = function () {
        return __ewTricksWon;
    };
    this.isOpenHands = function () {
        return __openHands;
    };
    this.isStatMode = function () {
        return __statMode;
    };
    this.getAIPlayer = function (player) {
        return (__aiPlayers[player]);
    };
    this.myHand = function () {
        var hand = [];
        var card;
        for (var i = 0; i < __hands[__currentPlayer].length; i++) {
            card = __hands[__currentPlayer][i];
            hand[i] = new Card(card.suit, card.rank);
        }
        return hand;
    };
    //#endregion
    /*******************************
    * Private functions
    ********************************/
    function startNewGame() {
        animShowText("STAGE: start");
        grabSettings();
        initGame();
        doStep();
    }
    //TODO: implement these!
    function letHumanBid(param) { }
    function letHumanClickCards() { }
    function doStep() {
        animShowText("STAGE: " + GameStage[__gameStage]);
        switch (__gameStage) {
            case GameStage.NewHand:
                initHand();
                break;
            case GameStage.BidRound1:
                if (!__aiPlayers[__currentPlayer]) {
                    letHumanBid(1);
                    return;
                }
                handleBid();
                break;
            case GameStage.BidRound2:
                if (!__aiPlayers[__currentPlayer]) {
                    letHumanBid(2);
                    return;
                }
                handleBid();
                break;
            case GameStage.Discard:
                if (!__aiPlayers[__dealer]) {
                    letHumanClickCards();
                    return;
                }
                discardCard(__aiPlayers[__dealer].pickDiscard());
                return;
            case GameStage.NewTrick:
                return;
            /*TODO: re-enable this
            initTrick();
            break;
            */
            case GameStage.PlayTricks:
                if (!__aiPlayers[__currentPlayer]) {
                    letHumanClickCards();
                    return;
                }
                playTrickStep();
                break;
        }
        doStep();
    }
    //#region Setup
    function grabSettings() {
        //checkbox settings
        __sound = document.getElementById("chkSound").checked;
        __openHands = true; //(document.getElementById("chkOpenHands") as HTMLInputElement).checked;
        __defendAlone = document.getElementById("chkDefendAlone").checked;
        __noTrump = document.getElementById("chkNoTrump").checked;
        __showTrickHistory = document.getElementById("chkShowHistory").checked;
        //ai settings
        __statMode = document.getElementById("chkStatMode").checked; //4 AIs play against each other
        __aiPlayers = [new DecentAI(), new DecentAI(), new DecentAI(), new DecentAI()];
        __hasHooman = __aiPlayers.indexOf(null) > -1;
    }
    //just sets scores to 0
    function initGame() {
        __nsScore = 0;
        __ewScore = 0;
        __gameStage = GameStage.NewHand;
    }
    //resets variables, gets dealer, shuffles deck, inits empty hands, sets currentplayer to left of dealer
    function initHand() {
        __playersBid = 0;
        __trumpCandidateCard = null;
        __trumpSuit = null;
        __maker = null;
        __alonePlayer = null;
        __numPlayers = 0;
        __nsTricksWon = 0;
        __ewTricksWon = 0;
        __dealer = getDealer();
        animPlaceDealerButt();
        __deck = getShuffledDeck();
        __hands = new Array(4);
        for (i = 0; i < 4; i++) {
            __hands[i] = new Array(5);
        }
        __currentPlayer = nextPlayer(__dealer);
        dealHands(__deck, __hands, __dealer);
        __trumpCandidateCard = __deck.pop();
        animDeal(__hands);
        //let AIs initialize
        for (i = 0; i < 4; i++) {
            __currentPlayer = i;
            if (__aiPlayers[i] !== null) {
                __aiPlayers[i].init();
            }
        }
        __currentPlayer = nextPlayer(__dealer);
        __gameStage = GameStage.BidRound1;
    }
    //resets variables, sets currentplayer to left of dealer
    function initTrick() {
        __trickNum = 0; //TODO: find this a new home
        __trickPlayersPlayed = 0;
        __trickSuitLead = null;
        __trickPlayedCards = [null, null, null, null];
        __currentPlayer = nextPlayer(__dealer);
        __gameStage = GameStage.PlayTricks;
    }
    //#endregion
    //get a bid
    function handleBid() {
        var suit;
        var alone;
        var discard;
        //see if AI bids
        suit = getAIBid(__currentPlayer);
        if (suit) {
            alone = getGoAlone(__currentPlayer);
            endBidding(suit, alone);
            return;
        }
        //animShowText(__currentPlayer + " passed.");
        advanceBidding();
    }
    function advanceBidding() {
        __playersBid++;
        //everyone bid, round is over
        if (__playersBid === 4) {
            if (__gameStage === GameStage.BidRound1) {
                __gameStage = GameStage.BidRound2;
            }
            else {
                __gameStage = GameStage.NewHand;
            }
        }
        else {
            __currentPlayer = nextPlayer(__currentPlayer);
        }
    }
    function endBidding(suit, alone) {
        animShowText(__currentPlayer + " " + Suit[suit] + " " + alone);
        setTrump(suit, __currentPlayer, alone);
        //if round 1, dealer also needs to discard
        if (__gameStage === GameStage.BidRound1) {
            __gameStage = GameStage.Discard;
        }
        else {
            __gameStage = GameStage.NewTrick;
        }
    }
    //sets trumpSuit, left/right nonsense, maker, and alone player
    function setTrump(suit, player, alone) {
        var rightID;
        var leftID;
        __trumpSuit = suit;
        //This chunk is for changing the rank and suit of the right and left bowers
        //for the duration of the hand.
        //Note: The cards' IDs stay the same
        rightID = __trumpSuit + Rank.Jack;
        DECKDICT[rightID].rank = Rank.Right;
        leftID = Suit[getOppositeSuit(__trumpSuit)] + Rank.Jack;
        DECKDICT[leftID].suit = __trumpSuit;
        DECKDICT[leftID].rank = Rank.Left;
        __maker = player;
        if (alone) {
            __alonePlayer = player;
        }
    }
    function discardCard(toDiscard) {
        removeFromHand(__dealer, toDiscard);
        __hands[__dealer].push(__trumpCandidateCard);
        __gameStage = GameStage.NewTrick;
    }
    function playTrickStep() {
        var card;
        card = __aiPlayers[__currentPlayer].pickCard();
        if (!isValidPlay(__hands[__currentPlayer], card, __trickSuitLead)) {
            //TODO: play shit
            return;
        }
        playCard(__currentPlayer, card);
    }
    function playCard(player, card) {
        //play card, store played card, iterate num players played
        //check if hand ended, then check if game ended
    }
    function endGame() {
    }
    function addToHand(player, card) {
        __hands[player].push(card);
    }
    //finds index of given ID inefficiently
    //splice removes 1 at a given index
    //fails silently if card isn't found, which should never happen
    function removeFromHand(player, card) {
        var cardID = card.id;
        for (var i = 0; i < __hands[player].length; i++) {
            if (__hands[player][i].id === cardID) {
                __hands[player].splice(i, 1);
            }
        }
    }
    /*******************************
    * Public functions
    ********************************/
    this.start = function () {
        startNewGame();
    };
}
