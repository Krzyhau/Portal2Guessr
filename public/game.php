<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Portal 2 Guessr</title>

    
    <link rel="stylesheet/less" href="styles/style.less">


    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>

    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>

    <script src="https://cdn.jsdelivr.net/npm/less@4.1.1"></script>

    <script src="scripts/maplist.js"></script>
    <script src="scripts/guesspicker.js"></script>
    <script src="scripts/game.js"></script>
</head>
<body onload="InitiateGame()">
    <div id="start" class="inactive">
        <div class="header">
            <h1>Portal 2 Guessr</h1>
            <p>Test your knowledge about Portal 2 locations!</p>
        </div>
        <div class="startbox">
            <p>Here I'll put some settings if I'll find time to add some lol</p>
            <button id="play-btn">Start</button>
        </div>
        <div class="footer">
            <p>Made with laziness by <a href="https://github.com/Krzyhau/">Krzyhau</a>.</p>
        </div>
    </div>

    <div id="game" class="inactive">
        <div id="photo" onclick="EnableGuessWindow(false)">
        </div>
        <div class="info">
            <div class="time">
                <p>Time</p>
                <span id="info-time">0s</span>
            </div>
            <div class="round">
                <p>Round</p>
                <span id="info-round">1/5</span>
            </div>
            <div class="score">
                <p>Score</p>
                <span id="info-score">0</span>
            </div>
        </div>
        <div class="guess-popup hidden">
            <h2 onclick="EnableGuessWindow(true)">Guess location</h2>
            <div id="game-guesspicker"></div>
        </div>
    </div>

    <div id="guess" class="inactive">
        <div id="resultmap"></div>
        <div class="result-container">
            <div class="result-container-inner">
                <h1 id="result-points"></h1>
                <div class="points-bar"><div id="result-points-bar"></div></div>
                <h2 id="result-title"></h2>
                <div id="next-round-btn" class="result-button" onclick="StartGuessing()">Next round</div>
                <div id="end-game-btn" class="result-button inactive">End game</div>
            </div>
        </div>
    </div>

    <div id="end" class="inactive">
        
    </div>
</body>
</html>