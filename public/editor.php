<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Portal 2 Guessr</title>


    <link rel="stylesheet/less" href="styles/style.less">
    <link rel="stylesheet/less" href="styles/editor.less">

    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>

    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>

    <script src="https://cdn.jsdelivr.net/npm/less@4.1.1"></script>

    <script src="scripts/maplist.js"></script>
    <script src="scripts/guesspicker.js"></script>
    <script src="scripts/editor.js"></script>
</head>
<script>$(()=>PromptLogin(true))</script>
<body class="hidden">
    <div id="list">
        <div class="header">
            <div class="info">
                Found <span id="location-count">0</span> locations in the database.
            </div>
            <div class="add-btn button" onclick="ShowLocationAdder()">Add location</div>
        </div>
        <div id="entry-list">  
            
        </div>
    </div>
    <div id="editor" class="hidden">
        <div class="editor-window">
            <dic class="editor-close-btn" onclick="ShowLocationAdder(false)">X</dic>
            <div class="locationparams">
                <div id="screenshot">
                    <div class="image">
                        <img>
                    </div>
                    <input type="file">
                </div>
                <div class="params">
                    
                </div>
            </div>
            <div id="locationpicker"></div>
        </div>
    </div>
</body>

</html>