const Editor = {
    locationPicker: null,
    selectedImage: null,
    imageData: { image: null, thumbnail: null },
    userinfo: null,
}




function InitEditor() {
    $("body").toggleClass("hidden", false);

    //location adder
    Editor.locationPicker = new GuessPicker("locationpicker");
    Editor.locationPicker.changeAcceptButton("Add location", () => SendNewLocation());
    Editor.locationPicker.setSubmitCondition(1, false);


    $("#screenshot .image").click(function(e){
       e.preventDefault();
       $("#screenshot input").trigger('click');
    });

    Editor.selectedImage = $("#screenshot img");

    $("#screenshot input").change(function () {
        var reader = new FileReader();
        reader.readAsDataURL($("#screenshot input")[0].files[0]);
        reader.onload = function () {
            SetImageInAdder(reader.result);
        };
    });

    RefreshLocationList();
}


function PromptLogin(first=false, promptFirst = true) {
    let secretKey = "";

    const cookieName = "secretkey";
    if (first) {
        //reading cookie
        let cookieReadValue = `; ${document.cookie}`;
        const cookieParts = cookieReadValue.split(`; ${cookieName}=`);
        if (cookieParts.length === 2) secretKey = cookieParts.pop().split(';').shift();
    }

    if (secretKey.length == 0) {
        secretKey = prompt(promptFirst ? "Type in a secret key to continue." : "Invalid secret key. Please try again.");
        promptFirst = false;
    }

    //oldest goddamn cookie
    document.cookie = cookieName + "=" + secretKey + "; expires=Fri, 31 Dec 9999 23:59:59 GMT";

    $.getJSON("/api/poweruser/verify", function (data) {
        if (!data.error) {
            userinfo = data;
            InitEditor();
        } else {
            PromptLogin(false, promptFirst);
        }
    });
    
}




function ShowLocationAdder(show = true) {
    $("#editor").toggleClass("hidden", !show);

    if (show) {
        Editor.locationPicker.resetGuess();
        SetImageInAdder("");
    }
}

function ModifyLocation(location) {
    ShowLocationAdder();
}

function DeleteLocation(location) {
    console.log("deleting location with id " + location.id);
    $.get("/api/location/remove?id=" + location.id, (result) => {
        console.log(result);
        RefreshLocationList();
    });
}


// converts an image to desirable format and stores it
function SetImageInAdder(img) {
    if (!img.startsWith("data:image/")) {
        Editor.selectedImage.removeAttr("src");
        Editor.locationPicker.setSubmitCondition(1, false);
        Editor.imageData.image = null;
        Editor.imageData.thumbnail = null;
        return;
    }
    
    var image = new Image();
    image.src = img;
    image.onload = function () {
        Editor.imageData.image = ResizeImage(image, 1920, 1080);
        Editor.imageData.thumbnail = ResizeImage(image, 192, 108);

        let dataLen1 = Editor.imageData.image.length;
        let dataLen2 = Editor.imageData.thumbnail.length;

        console.log("Generated location image (" + dataLen1 + " characters, thumbnail has " + dataLen2 +")");
        console.log(Editor.imageData.image);

        Editor.selectedImage.attr("src", Editor.imageData.image);
        Editor.locationPicker.setSubmitCondition(1, true);
    }
}

function ResizeImage(image, width, height, quality=0.5) {
    let canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    let ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    let resizedImage = canvas.toDataURL("image/jpeg", quality);
    canvas.remove();
    return resizedImage;
}


function RefreshLocationList() {

    $.getJSON("/api/location/list?thumb", (locations) => {
        let list = $("#entry-list");
        list.empty();

        if (locations.error) return;

        for (let location of locations) {
            let entry = $("<div>", { class: "location-entry" });
            $("<img>", { class: "thumbnail", src: location.thumbnail }).appendTo(entry);
            $("<i>", { class: "id" }).html(location.id).appendTo(entry);
            let locationInfo = $("<div>", { class: "location" });
            $("<h2>").html("Located in:").appendTo(locationInfo);
            $("<span>", { class:"map"}).html(location.mapname).appendTo(locationInfo);
            let coordsText = "(" + Math.floor(location.x) + "; " + Math.floor(location.y) + ")";
            $("<span>", { class: "coords" }).html(coordsText).appendTo(locationInfo);
            locationInfo.appendTo(entry);
            let submission = $("<div>", { class: "submission" });
            $("<h2>").html("Sent by:").appendTo(submission);
            $("<span>", { class: "username" }).html(location.creator).appendTo(submission);
            submission.appendTo(entry);

            if (userinfo["power_level"] >= 1) {
                let modifyButton = $("<div>", { class: "modify-btn button" }).html("Modify");
                modifyButton.click(() => ModifyLocation(location));
                modifyButton.appendTo(entry);

                let deleteButton = $("<div>", { class: "delete-btn button" }).html("Delete");
                deleteButton.click(() => DeleteLocation(location));
                deleteButton.appendTo(entry);
            }

            entry.appendTo(list);
        }

        $("#location-count").html(locations.length);
    });

    
}

function SendNewLocation() {
    Editor.locationPicker.setSubmitCondition(1, false);

    let mapname = Editor.locationPicker.guess.map;
    let x = Editor.locationPicker.guess.coords.lng;
    let y = Editor.locationPicker.guess.coords.lat;
    let image = Editor.imageData.image;
    // TODO: technically it would be better if that was generated server-side but fuck it lol
    let thumbnail = Editor.imageData.thumbnail;

    $.post("/api/location/add",
        {
            mapname: mapname,
            x: x, y: y,
            image: image,
            thumbnail: thumbnail
        }, function (result) {
            console.log(result);
            RefreshLocationList();
            ShowLocationAdder(false);
        }
    )

    
}