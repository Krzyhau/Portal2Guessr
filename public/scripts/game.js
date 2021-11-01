const Game = {
    state: "game",
    round: 0,
    maxRounds: 5,
    score: 0,
    time: 0,
    
    guessPicker: null,
    resultMap: null,
    timeInterval: null,
    locations: null,
}


// shows the main div with given name, hiding others main divs (divs being direct children of body)
function SetMainDiv(name) {
    $("body>div").toggleClass("inactive", true);
    $("body>#"+name).toggleClass("inactive", false);
}

// loads a list of random locations to use in the game
function LoadRandomLocations() {
    $.get("/api/location/random?count=" + Game.maxRounds, (locations) => {
        if (locations.error) {
            alert("Error: couldn't load locations from the database.");
            return;
        } else {
            Game.locations = locations;
            InitiateGame();
        }
    });
}


function InitiateGame() {
    if (Game.locations == null) {
        LoadRandomLocations();
    } else {
        Game.round = 0;
        Game.score = 0;
        Game.time = 0;

        Game.resultMap = GuessPicker.createMap($("#resultmap")[0]);

        StartGuessing();
    }
    
}

function EndGame() {
    if (Game.round < Game.maxRounds) return;
    //TODO: implement end game here.
}


// opens guessing part of the game.
function StartGuessing() {
    if (Game.round == Game.maxRounds) return;

    SetMainDiv("game");

    Game.state = "game";
    Game.round++;

    $("#photo").css("background-image", "url(/api/img/"+Game.locations[Game.round-1].id+"/full)");

    if (Game.guessPicker == null) {
        Game.guessPicker = new GuessPicker("game-guesspicker");
        Game.guessPicker.changeAcceptButton("Make a guess", () => FinalizeGuess());
    }
    Game.guessPicker.resetGuess();

    $("#info-round").html(Game.round + "/" + Game.maxRounds);
    $("#info-score").html(Game.score);
    
    timeInterval = setInterval(() => {
        Game.time += 1;
        $("#info-time").html(Game.time + "s");
    }, 1000);
}

// opens result part of the game
function FinalizeGuess(timeout = false) {
    // in case trying to guess without a guess and without timeout, cancel finalizing
    if ((Game.guessPicker.guess == null || Game.guessPicker.guess.map != Game.guessPicker.selectedMap) && !timeout) return;
    SetMainDiv("guess");
    EnableGuessWindow(false);

    clearInterval(timeInterval);
    timeInterval = null;

    let result = EvaluateGuessResult();

    //updating the map
    if (result.targetMapID >= 0) {

        let guess = Game.guessPicker.guess;
        let target = Game.locations[Game.round - 1];
        let targetCoords = [target.y, target.x];

        Game.resultMap.selectGameMap(Maps[result.targetMapID], () => {
            let correctMap = false;
            if (guess && guess.map == target.mapname) {
                let line = L.polyline([guess.coords, targetCoords], {weight:1, color: '#fff8', dashArray:"16 16"}).addTo(Game.resultMap);
                Game.resultMap.fitBounds(line.getBounds());
                let guessMarker = new L.marker(guess.coords);
                guessMarker.addTo(Game.resultMap);

                Game.resultMap.setGameLayer(Game.guessPicker.guessMinimap.getGameLayer());
                correctMap = true;
            }
            
            let targetMarker = new L.marker(targetCoords);
            targetMarker.on("add", () => {
                $(targetMarker._icon).css("filter", "hue-rotate(180deg)");
                if (!correctMap) Game.resultMap.setView(targetCoords,1);
            });
            targetMarker.addTo(Game.resultMap);
        });
    }

    // updating the rest of the interface
    $("#guess #result-points").html(result.points + " point" + (result.points == 1 ? "" : "s"));
    $("#guess #result-points-bar").css("width", (result.points / 1000 * 100) + "%");
    $("#guess #result-title").html(result.text);

    $("#guess #next-round-btn").toggleClass("inactive", Game.round == Game.maxRounds)
    $("#guess #end-game-btn").toggleClass("inactive", Game.round < Game.maxRounds)

    Game.score += result.points;
}


// function that calculates points for given guess
function EvaluateGuessResult() {
    let points = 0;
    let resultText = "Your guess was extraordinarily bad.";

    let guess = Game.guessPicker.guess;
    let target = Game.locations[Game.round - 1];

    let targetMapID = -1;
    for (let i = 0; i < Maps.length; i++) {
        if (Maps[i].mapname == target.mapname) {
            targetMapID = i;
        }
    }

    if (!guess) return {
        points: 0,
        targetMapID: targetMapID,
        text: resultText,
    };

    let guessMapID = -1;
    for (let i = 0; i < Maps.length; i++){
        if (Maps[i].mapname == guess.map) {
            guessMapID= i;
        }
    }

    if (guessMapID < 0 || targetMapID <0) return {
        points: 0,
        targetMapID: targetMapID,
        text: resultText,
    };

    if (guessMapID != targetMapID) {
        //didn't guess the right map

        //giving up to 100 points for being close to the target map
        let closeCallCount = Math.abs(guessMapID - targetMapID);
        points += Math.max(0, 100 - (closeCallCount - 1) * 10);

        let resultSubText = "off by " + closeCallCount + " map" + (closeCallCount == 1 ? "" : "s") + ".";

        if(points>0) resultText = "Your guess was " + resultSubText;

        //points for getting the right chapter
        if (Maps[guessMapID].chapter == Maps[targetMapID].chapter) {
            points += 100;
            resultText = "Your guess was in the right chapter, but still " + resultSubText;
        }
    } else {
        //guessed the right map
        points += 500;

        //calculating the rest of the points based on the distance from the target, maxing out at 1000
        let g = { x: guess.coords.lng, y: guess.coords.lat };
        let t = { x: target.x, y: target.y };
        let distance = Math.floor(Math.sqrt(Math.pow(g.x - t.x, 2) + Math.pow(g.y - t.y, 2)));

        resultText = "Your guess was in the good map, "+distance+" units away from the target."

        const minDist = 32;
        const maxDist = 2048;

        points += Math.ceil(500 * Math.min(1,((Math.max(0,maxDist-distance)) / (maxDist - minDist))));
    }
    // what the fuck am I even doing here? what's the point of making a function 
    // if it's only used once and everything is dumped into one object anyway?
    // am i going insane?
    return {
        points: points,
        targetMapID: targetMapID,
        text: resultText,
    };
}


function EnableGuessWindow(state) {
    $("#game .guess-popup").toggleClass("hidden", !state);
}