<?php

    //splitting url into "directories"
    $url = "http://".$_SERVER["HTTP_HOST"].$_SERVER["REQUEST_URI"];
    $paths = explode("/",parse_url($url, PHP_URL_PATH));
    array_shift($paths);

    //checking links
    switch($paths[0]){
        case "api":
            require 'api.php';
            loadAPI($paths);
            break;
        case "404":
            include '404.php';
            break;
        default: loadPublic($paths);
    }

    function loadPublic($paths){
        $content_path = "public/" . implode("/", $paths);

        if(count($paths)==0 || strlen($paths[0])==0) $content_path .= "game";

        if(strpos($content_path, "..") || strpos($content_path, ".php")){
            include '404.php';
            exit();
        }

        // trying to load php file first
        if(is_file($content_path.".php")){
            include $content_path.".php";
        }
        // then trying to load other files
        else if(is_file($content_path)){
            header('Content-Type: '.mime_content_type($content_path));
            include $content_path;
        }else{
            include '404.php';
        }
    }
?>