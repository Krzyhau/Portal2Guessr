<?php
    require 'database.php';

    function loadAPI($paths){
        array_shift($paths);

        $output = handleAPI($paths);
        
        // default output: json with api result
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($output);
    }


    function handleAPI($commands){

        $secretkey = $_COOKIE["secretkey"] ?? "";

        if(strlen($secretkey)>0) $secretkey = hash("sha256", $secretkey);

        $output = array();
        $valid = false;
        $accessDenied = false;

        if(!p2g_init()){
            return ["error"=>"Cannot connect to the database"];
        }

        if(count($commands)== 3 && $commands[0]=="img"){
            $imgid = intval($commands[1]);
            if($commands[2]=="full" || $commands[2]=="thumb"){
                $valid = true;
                $isThumb = $commands[2]=="thumb";
                $output = p2g_getImage($imgid, $isThumb);
                if(isset($output["image"])){
                    header('Content-Type: image/jpeg');
                    echo $output["image"];
                    exit();
                }
            }
        }else if(count($commands) == 2 && $commands[0]=="location"){
            $valid = true;
            if($commands[1]=="add"){

                $locationID = intval($_POST["locationid"] ?? "-1");

                if(!p2g_verifyPowerUser($secretkey, ($locationID>=0) ? 1 : 0)){
                    $accessDenied = true;
                }else if(
                    empty($_POST["mapname"]) ||
                    empty($_POST["x"]) || empty($_POST["y"]) ||
                    empty($_POST["image"]) || empty($_POST["thumbnail"])
                ){
                    $object = ["error" => "Not enough data provided"];
                }
                else{
                    $location = [
                        "creator" => p2g_getPowerUserInfo($secretkey)["poweruser_id"],
                        "mapname" => $_POST["mapname"],
                        "x" => $_POST["x"],
                        "y" => $_POST["y"],
                        "image" => imageBase64ToBlob($_POST["image"]),
                        "thumbnail" => imageBase64ToBlob($_POST["thumbnail"]),
                    ];
                    $output = p2g_addLocation($location, $locationID);
                }
            }
            else if($commands[1]=="remove"){
                if(!p2g_verifyPowerUser($secretkey, 1)){
                    $accessDenied = true;
                }elseif(isset($_GET["id"])){
                    $output = p2g_removeLocation(intval($_GET["id"]));
                }else{
                    $valid = false;
                }
            }
            else if($commands[1]=="list"){
                $output = p2g_getLocationList(isset($_GET["thumb"]));
            }
            else if($commands[1]=="get"){
                if(isset($_GET["id"])){
                    $output = p2g_getLocation($_GET["id"], isset($_GET["thumb"]));
                }else{
                    $valid = false;
                }
            }
            else if($commands[1]=="random"){
                $randCount = intval($_GET["count"] ?? "1");
                $output = p2g_getRandomLocations($randCount, isset($_GET["thumb"]));
            }else{
                $valid = false;
            }
        }else if(count($commands) == 2 && $commands[0]=="poweruser"){
            $valid = true;
            if($commands[1]=="add"){
                if(!p2g_verifyPowerUser($secretkey, 2)){
                    $accessDenied = true;
                }
                else if(isset($_GET["username"])){
                    $username = $_GET["username"];
                    $powerlevel = $_GET["powerlevel"] ?? 0;
                    $output = p2g_createPowerUser($username, $powerlevel);
                }else{
                    $valid = false;
                }
            }
            else if($commands[1]=="verify"){
                // PLEASE DO NOT TRY TO BRUTEFORCE THIS =[
                // I JUST WANT TO MAKE PEOPLE HAPPY 
                $output = p2g_getPowerUserInfo($secretkey);
            }else{
                $valid = false;
            }
        }

        p2g_close();


        if(!$valid){
            $output = ["error" => "Invalid request"];   
        }
        if($accessDenied){
            $output = ["error" => "Access denied"];
        }
        return $output;
    }

?>