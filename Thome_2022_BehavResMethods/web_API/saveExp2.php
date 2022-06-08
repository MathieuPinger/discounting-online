<?php
// debugging: if needed, remove redirect in jspych_experiment1 to display PHP errors
ini_set('display_errors', 1);

// decode data from HTTP request
$post_data = json_decode(file_get_contents('php://input'), true);

// extract ID and JSPsych data
$id = $post_data['prolific_id'];
$save_data = $post_data['data'];

// the directory "data" must be writable by the www-data user!
// path to directory
$name = "../data/".$id."_exp2.csv";

// write the file to disk
file_put_contents($name, $save_data);
?>