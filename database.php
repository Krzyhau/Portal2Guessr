<?php
    require 'SECRET.php';

    $p2g_conn = null;

    function p2g_init(){
        if(!empty($p2g_conn))return;

        global $DB_SERVERNAME, $DB_USERNAME, $DB_PASSWORD, $DB_DATABASE, $p2g_conn;
        $p2g_conn = new mysqli($DB_SERVERNAME, $DB_USERNAME, $DB_PASSWORD, $DB_DATABASE);

        if ($p2g_conn->connect_error) {
            return false;
        } 
        return true;
    }

    function p2g_close(){
        global $p2g_conn;
        $p2g_conn->close();
    }


    // returns an image of location with given id. can return a "thumbnail" which is much smaller version of an image
    function p2g_getImage($id, $isThumb=false){
        global $p2g_conn;

        $imagequery = $p2g_conn->prepare("SELECT location_id,image,thumbnail FROM locations WHERE location_id=?");
        $imagequery->bind_param('i', $id);
        $imagequery->execute();
        $result = $imagequery->get_result();

        if($result->num_rows == 0){
            return ["error" => "No location with given ID"];
        }else {
            $image = $result->fetch_assoc();
            return ["image" => $isThumb ? $image["thumbnail"] : $image["image"]];
        }
    }



    // returns info about location with given id. Can return thumbnail if requested
    function p2g_getLocation($id, $withThumb=false){
        global $p2g_conn;

        $locationquery = $p2g_conn->prepare(
            "SELECT location_id as id, creation_date, username as creator, mapname, x, y" . ($withThumb ? ", thumbnail " : " ") .
            "FROM locations INNER JOIN powerusers 
            ON powerusers.poweruser_id=locations.creator_id 
            WHERE location_id=?"
        );
        $locationquery->bind_param('i', $id);
        $locationquery->execute();
        $result = $locationquery->get_result();

        if($result->num_rows == 0){
            return ["error" => "No location with given ID"];
        }else {
            $location = $result->fetch_assoc();
            if($withThumb){
                $location["thumbnail"] = imageBlobToBase64($location["thumbnail"]);
            }
            return $location;
        }
    }

    // returns info about given amount of randoms location. Can return thumbnail if requested
    function p2g_getRandomLocations($count=1, $withThumb=false){
        global $p2g_conn;

        $locationquery = $p2g_conn->prepare(
            "SELECT location_id as id, creation_date, username as creator, mapname, x, y" . ($withThumb ? ", thumbnail " : " ") .
            "FROM locations INNER JOIN powerusers 
            ON powerusers.poweruser_id=locations.creator_id 
            ORDER BY RAND() LIMIT " . $count
        );
        $locationquery->execute();
        $result = $locationquery->get_result();

        if($result->num_rows == 0){
            return ["error" => "Couldn't retrieve a list of locations"];
        }else {
            $locations = $result->fetch_all(MYSQLI_ASSOC);
            if($withThumb)foreach($locations as &$location){
                $location["thumbnail"] = imageBlobToBase64($location["thumbnail"]);
            }
            return $locations;
        }
    }

    // returns a list of info about all locations stored in the database. Can return thumbnail if requested
    function p2g_getLocationList($withThumb=false){
        global $p2g_conn;

        $locationquery = $p2g_conn->prepare(
            "SELECT location_id as id, creation_date, username as creator, mapname, x, y" . ($withThumb ? ", thumbnail " : " ") .
            "FROM locations INNER JOIN powerusers 
            ON powerusers.poweruser_id=locations.creator_id"
        );
        $locationquery->execute();
        $result = $locationquery->get_result();

        if($result->num_rows == 0){
            return ["error" => "Couldn't retrieve a list of locations"];
        }else {
            $locations = $result->fetch_all(MYSQLI_ASSOC);
            if($withThumb)foreach($locations as &$location){
                $location["thumbnail"] = imageBlobToBase64($location["thumbnail"]);
            }
            return $locations;
        }
    }

    // removes location with given id. requires powerlevel>=1
    function p2g_removeLocation($id){

        if(isset(p2g_getLocation($id)["error"])) return ["error"=>"Location with given ID does not exist"];

        global $p2g_conn;

        $locationquery = $p2g_conn->prepare("DELETE FROM locations WHERE location_id=?");
        $locationquery->bind_param('i', $id);
        $locationquery->execute();

        return ["result"=>"Successfully removed location"];
    }

    // adds new location (requires powerlevel>=0). Can also override existing location when id is provided (requires powerlevel>=1)
    function p2g_addLocation($location, $id=-1){
        global $p2g_conn;

        $locationquery = null;
        if($id>=0){
            p2g_removeLocation($id);
            $locationquery = $p2g_conn->prepare("INSERT INTO locations(location_id, creator_id, mapname, x, y, image, thumbnail) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $locationquery->bind_param('iisddss', $id, $location["creator"], $location["mapname"], $location["x"], $location["y"], $location["image"], $location["thumbnail"]);
        }else{
            $locationquery = $p2g_conn->prepare("INSERT INTO locations(creator_id, mapname, x, y, image, thumbnail) VALUES (?, ?, ?, ?, ?, ?)");
            $locationquery->bind_param('isddss', $location["creator"], $location["mapname"], $location["x"], $location["y"], $location["image"], $location["thumbnail"]);
        }
        
        $locationquery->execute();

        return ["result"=>"Successfully added new location"];
    }



    // gets power user info by given secret key.
    function p2g_getPowerUserInfo($secretkey){
        global $p2g_conn;

        $userinfo = $p2g_conn->prepare("SELECT poweruser_id,username,power_level FROM powerusers WHERE secret_key=?");
        $userinfo->bind_param('s', $secretkey);
        $userinfo->execute();
        $result = $userinfo->get_result();

        if($result->num_rows == 0){
            return ["error"=>"Username not found"];
        }else {
            return $result->fetch_assoc();
        }
        
    }

    // checks if power user is allowed to perform action
    function p2g_verifyPowerUser($secretkey, $powerlevel){
        $userinfo = p2g_getPowerUserInfo($secretkey);
        $userpowerlevel = $userinfo["power_level"] ?? -1;
        return $userpowerlevel >= $powerlevel;
    }


    // creates poweruser with given name and given powerlevel. Requires powerlevel >=2
    function p2g_createPowerUser($username,$powerlevel){
        global $p2g_conn;
        
        // make sure the username is not taken already
        $namecheck = $p2g_conn->prepare("SELECT * FROM powerusers WHERE username=?");
        $namecheck->bind_param('s', $username);
        $namecheck->execute();
        $namecheck->store_result();

        if($namecheck->num_rows() > 0){
            return ["error"=>"Username already exists"];
        }

        // make sure new random secret key doesn't exist already
        $secretkey = "";
        $keycheck = $p2g_conn->prepare("SELECT * FROM powerusers WHERE secret_key=?");
        do{
            $secretkey = md5(rand() . rand() . rand() . rand());
            $keycheck->bind_param('s', $secretkey);
            $keycheck->execute();
            $keycheck->store_result();
        }while($keycheck->num_rows() > 0);
        
        $secretkeyHashed = hash("sha256", $secretkey);

        // adding user
        $query = $p2g_conn->prepare("INSERT INTO powerusers(username, secret_key, power_level) VALUES (?, ?, ?)");
        $query->bind_param('ssi', $username,$secretkeyHashed,$powerlevel);
        $query->execute();

        return ["secretkey"=>$secretkey];
    }




    function imageBase64ToBlob($encodedImg){
        $data = explode( ',', $encodedImg );
        return base64_decode($data[1]);
    }

    function imageBlobToBase64($rawImg){
        return 'data:image/jpeg;base64,' . base64_encode($rawImg);
    }

?>