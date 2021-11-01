

class GuessPicker{
    
    constructor(divID) {
        this.selectedChapter = 0;
        this.selectedMap = null;

        this.guess = null;
        this.submitConditions = [false];
        
        this.guessMinimap = null;
        this.guessMnimapMarker = null;

        this.createDOM(divID);
    }


    createDOM(divID) {
        this.dom = {};
        let mainDiv = $("#" + divID);

        mainDiv.addClass("guess-picker")

        if (!mainDiv) return;

        // ==creating list container==
        let listContainer = $("<div></div>").addClass("list-container");

        // creating header
        let listHeader = $("<div></div>").addClass("list-header");

        this.dom.chapterArrowLeft = $('<i>◀</i>').addClass("navarrow prev");
        this.dom.chapterArrowLeft.on("click", () => this.prevMapList());
        listHeader.append(this.dom.chapterArrowLeft);

        this.dom.chapterTitle  = $("<span></span>");
        listHeader.append(this.dom.chapterTitle);

        this.dom.chapterArrowRight = $('<i>▶</i>').addClass("navarrow next");
        this.dom.chapterArrowRight.on("click", () => this.nextMapList());
        listHeader.append(this.dom.chapterArrowRight);

        listContainer.append(listHeader);

        // creating actual list
        this.dom.levelList = $("<ul></ul>").addClass("list");
        listContainer.append(this.dom.levelList);

        mainDiv.append(listContainer);

        // ==creating map container==

        let mapContainer = $("<div></div>").addClass("map-container");

        // creating map div
        let mapDiv = $("<div></div>").addClass("map");
        mapContainer.append(mapDiv);

        // creating button for accepting the guess
        this.dom.guessBtn = $("<div></div>").addClass("guess-btn");
        this.dom.guessBtnText = $("<span></span>").html("Make a guess");
        this.dom.guessBtn.append(this.dom.guessBtnText);
        mapContainer.append(this.dom.guessBtn);

        mainDiv.append(mapContainer);

        // ==creating an actual map==
        this.guessMinimap = GuessPicker.createMap(mapDiv[0]);

        // making a guess event
        this.guessMinimap.on('click', (e)=>{
            this.makeAGuess(e.latlng);
        });

        // open up container ride as a default map
        this.selectMap(0);
    }


    static createMap(div) {
        let map = new L.Map(div, {
            crs: L.CRS.Simple,
            minZoom: -3,
            maxZoom: 1,
            zoomSnap: 0,
            zoomDelta: 0.25,
            wheelPxPerZoomLevel: 100,
            wheelDebounceTime: 20,
            attributionControl: false,
            doubleClickZoom: false,
            zoomAnimation: false
        });

        // creating controls for switching layers
        let layerControls = $("<div>", { class: "leaflet-top leaflet-right" }).appendTo($(map._controlContainer));
        let layerControlInner = $("<div>", { class: "leaflet-bar leaflet-control" }).appendTo(layerControls);
        map._layerControlUp = $("<a>", { class: "leaflet-control-zoom-in leaflet-disabled", href: "#", title: "Higher layer", role: "button" }).html("▲").appendTo(layerControlInner);
        map._layerControlDown = $("<a>", { class: "leaflet-control-zoom-out leaflet-disabled", href: "#", title: "Lower layer", role: "button" }).html("▼").appendTo(layerControlInner);

        map._layerControlUp.on("click", (e) => {
            e.preventDefault();
            map.setGameLayer(map.getGameLayer()+1);
            return false;
        });
        map._layerControlDown.on("click", (e) => {
            e.preventDefault();
            map.setGameLayer(map.getGameLayer()-1);
            return false;
        });


        map.gameLayerIndex = 0;
        map.getGameLayer = function () {
            return this.gameLayerIndex;
        };

        map.setGameLayer = function (layer) {
            layer = Math.min(Math.max(layer, 0), this.gameMapLayers.length - 1);

            for (let i = 0; i < this.gameMapLayers.length; i++){
                this.gameMapLayers[i].setOpacity((i <= layer ? 1 : 0));
            }

            this.gameLayerIndex = layer;

            //toggling the state of layer control buttons
            this._layerControlUp.toggleClass("leaflet-disabled", layer >= this.gameMapLayers.length - 1);
            this._layerControlDown.toggleClass("leaflet-disabled", layer <= 0);
        };

        map.selectGameMap = function(map,whenDone) {
            //updating the minimap.
            this.eachLayer((l) => {
                this.removeLayer(l);
            });
            
            let layerCount = map.layers ?? 1;
            this.gameMapLayers = [];

            let readyLayers = 0;

            for (let i = 0; i < layerCount; i++) {
                let img = new Image();
                img.src = 'maps/' + map.mapname + '_layer' + i + '.webp';
                img.onload = () => {
                    let bounds = [[0, 0], [img.height, img.width]];
                    this.gameMapLayers[i] = L.imageOverlay(img.src, bounds);

                    readyLayers++;
                    //executed when all layers have been loaded
                    if (readyLayers == layerCount) {
                        for (let j = 0; j < layerCount; j++) {
                            this.gameMapLayers[j].addTo(this);
                        }
                        this.fitBounds(bounds);
                        let layer = map.defaultLayer ?? 0;
                        this.setGameLayer(layer);

                        if(whenDone)whenDone();
                    }
                }
            }
        }

        return map;
    }


    changeAcceptButton(name, func) {
        this.dom.guessBtnText.html(name);
        this.dom.guessBtn.off("click").on("click", () => {
            if (!this.dom.guessBtn.hasClass("inactive")) func();
        });
    }


    //saves a guess into a variable and places a marker on the map
    makeAGuess(coords, map = null) {
        if (map == null) map = this.selectedMap;
        this.guess = {
            map: map,
            coords: coords
        };

        if (this.guessMinimapMarker != null) {
            this.guessMinimap.removeLayer(this.guessMinimapMarker);
        }
        this.guessMinimapMarker = new L.marker(coords).addTo(this.guessMinimap);

        this.setSubmitCondition(0, true);
        console.log(coords);
    }

    //switches chapter in map list to the previous one
    prevMapList() {
        if (this.selectedChapter > 0) {
            this.selectedChapter--;
            this.updateMapList();
        }
    }

    //switches chapter in map list to the next one
    nextMapList() {
        if (this.selectedChapter < Chapters.length-1) {
            this.selectedChapter++;
            this.updateMapList();
        }
    }

    // updates a list of map entries in the guess window.
    updateMapList() {
        //changing chapter title
        this.dom.chapterTitle.html(Chapters[this.selectedChapter]);

        //adding maps entries
        this.dom.levelList.empty();

        for (let map of Maps) {
            if (map.chapter != this.selectedChapter) continue;
            let mapDOM = $("<li></li>");

            if (this.selectedMap == map.mapname) mapDOM.addClass("selected");
            else {
                mapDOM.click(() => {
                    this.selectMap(map);
                })
            }
            mapDOM.html(map.name);
            this.dom.levelList.append(mapDOM);
        }

        //hiding or showing arrows
        this.dom.chapterArrowLeft.toggle(this.selectedChapter != 0);
        this.dom.chapterArrowRight.toggle(this.selectedChapter != Chapters.length-1);
    }

    // executed when map is selected from the list
    // saves map into a variable and updates the map view
    selectMap(map) {
        if (typeof map == "number") map = Maps[map];
        this.selectedMap = map.mapname;

        // updating map list so the record is actually highlighted
        this.updateMapList();


        this.guessMinimapMarker = null;
        this.setSubmitCondition(0, false);
        
        // update layers on the map
        this.guessMinimap.selectGameMap(map);

        if (this.guess != null && this.guess.map == map.mapname) {
            this.makeAGuess(this.guess.coords);
        }
    }


    setSubmitCondition(id, state) {
        this.submitConditions[id] = state;

        this.dom.guessBtn.toggleClass("inactive", !this.canSubmit());
    }

    canSubmit() {
        let can = true;

        for (let cond of this.submitConditions) {
            if (!cond) {
                can = false;
                break;
            }
        }

        return can;
    }

    resetGuess() {
        this.guess = null;
        this.selectMap(0);
    }
}