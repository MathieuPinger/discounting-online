<?php
include('../php/database_config.php');
$table_data = 'questionnaires';


// decode data from HTTP request
$post_data = json_decode(file_get_contents('php://input'), true);

// extract ID and JSPsych data
$id = $post_data['prolific_id'];
$data = $post_data['data'];
//print_r($post_data);

// the directory "data" must be writable by the www-data user!
// path to directory
$name = "../data/".$id."_surveys.json";

// write the file to disk
file_put_contents($name, json_encode($data));

// save to DB
$date = $data['date'];
$time = $data['time'];
$audit1 = $data['audit1'];
$audit2 = $data['audit2'];
$audit3 = $data['audit3'];
$audit4 = $data['audit4'];
$audit5 = $data['audit5'];
$audit6 = $data['audit6'];
$audit7 = $data['audit7'];
$audit8 = $data['audit8'];
$audit9 = $data['audit9'];
$audit10 = $data['audit10'];
$qf1= $data['QF1'];
$qf2= $data['QF2'];
$qf3= $data['QF3'];
$qf4= $data['QF4'];
$qf5= $data['QF5'];
$qf6= $data['QF6'];
$qf7= $data['QF7'];
$bis1 = $data['bis1'];
$bis2 = $data['bis2'];
$bis3 = $data['bis3'];
$bis4 = $data['bis4'];
$bis5 = $data['bis5'];
$bis6 = $data['bis6'];
$bis7 = $data['bis7'];
$bis8 = $data['bis8'];
$bis9 = $data['bis9'];
$bis10 = $data['bis10'];
$bis11 = $data['bis11'];
$bis12 = $data['bis12'];
$bis13 = $data['bis13'];
$bis14 = $data['bis14'];
$bis15 = $data['bis15'];



try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $sql = "INSERT INTO $table_data(`new_id`, `date`, `time`,
    `audit1`,`audit2`,`audit3`,`audit4`,`audit5`,`audit6`,`audit7`,`audit8`,`audit9`,
    `audit10`, `qf1`, `qf2`, `qf3`, `qf4`, `qf5`, `qf6`, `qf7`,
    `bis1`,`bis2`,`bis3`,`bis4`,`bis5`,`bis6`,`bis7`,`bis8`,`bis9`,`bis10`,
    `bis11`,`bis12`,`bis13`,`bis14`,`bis15`) VALUES ('$id', '$date', '$time',
    '$audit1','$audit2','$audit3','$audit4','$audit5','$audit6','$audit7','$audit8',
    '$audit9','$audit10',
    '$qf1', '$qf2', '$qf3', '$qf4', '$qf5', '$qf6', '$qf7',
    '$bis1','$bis2','$bis3','$bis4','$bis5','$bis6','$bis7','$bis8','$bis9','$bis10',
    '$bis11','$bis12','$bis13','$bis14','$bis15')";


    $insertstmt = $conn->prepare($sql);

    $insertstmt->execute();
    echo '{"success": true}';
  } catch(PDOException $e) {
    echo '{"success": false, "message": ' . $e->getMessage();
  }
  $conn = null;
?>