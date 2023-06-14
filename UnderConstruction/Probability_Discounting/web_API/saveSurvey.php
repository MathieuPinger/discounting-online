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
$dospert1 = $data['dospert1'];
$dospert2 = $data['dospert2'];
$dospert3 = $data['dospert3'];
$dospert4 = $data['dospert4'];
$dospert5 = $data['dospert5'];
$dospert6 = $data['dospert6'];
$dospert7 = $data['dospert7'];
$dospert8 = $data['dospert8'];
$dospert9 = $data['dospert9'];
$dospert10 = $data['dospert10'];
$dospert11 = $data['dospert11'];
$dospert12 = $data['dospert12'];
$dospert13 = $data['dospert13'];
$dospert14 = $data['dospert14'];
$dospert15 = $data['dospert15'];
$dospert16 = $data['dospert16'];
$dospert17 = $data['dospert17'];
$dospert18 = $data['dospert18'];
$dospert19 = $data['dospert19'];
$dospert20 = $data['dospert20'];
$dospert21 = $data['dospert21'];
$dospert22 = $data['dospert22'];
$dospert23 = $data['dospert23'];
$dospert24 = $data['dospert24'];
$dospert25 = $data['dospert25'];
$dospert26 = $data['dospert26'];
$dospert27 = $data['dospert27'];
$dospert28 = $data['dospert28'];
$dospert29 = $data['dospert29'];
$dospert30 = $data['dospert30'];
$dospert31 = $data['dospert31'];
$dospert32 = $data['dospert32'];
$dospert33 = $data['dospert33'];
$dospert34 = $data['dospert34'];
$dospert35 = $data['dospert35'];
$dospert36 = $data['dospert36'];
$dospert37 = $data['dospert37'];
$dospert38 = $data['dospert38'];
$dospert39 = $data['dospert39'];
$dospert40 = $data['dospert40'];
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
    `audit10`, `dospert1`, `dospert2`, `dospert3`, `dospert4`, 
    `dospert5`, `dospert6`, `dospert7`, `dospert8`, `dospert9`, `dospert10`, `dospert11`, `dospert12`,
    `dospert13`, `dospert14`, `dospert15`, `dospert16`, `dospert17`, `dospert18`, `dospert19`, `dospert20`,
    `dospert21`, `dospert22`, `dospert23`, `dospert24`, `dospert25`, `dospert26`, `dospert27`, `dospert28`,
    `dospert29`, `dospert30`, `dospert31`, `dospert32`, `dospert33`, `dospert34`, `dospert35`, `dospert36`,
    `dospert37`, `dospert38`, `dospert39`, `dospert40`,
    `bis1`,`bis2`,`bis3`,`bis4`,`bis5`,`bis6`,`bis7`,`bis8`,`bis9`,`bis10`,
    `bis11`,`bis12`,`bis13`,`bis14`,`bis15`) VALUES ('$id', '$date', '$time',
    '$audit1','$audit2','$audit3','$audit4','$audit5','$audit6','$audit7','$audit8',
    '$audit9','$audit10', 
    '$dospert1', '$dospert2', '$dospert3', '$dospert4', 
    '$dospert5', '$dospert6', '$dospert7', '$dospert8', '$dospert9', '$dospert10', '$dospert11', '$dospert12',
    '$dospert13', '$dospert14', '$dospert15', '$dospert16', '$dospert17', '$dospert18', '$dospert19', '$dospert20',
    '$dospert21', '$dospert22', '$dospert23', '$dospert24', '$dospert25', '$dospert26', '$dospert27', '$dospert28',
    '$dospert29', '$dospert30', '$dospert31', '$dospert32', '$dospert33', '$dospert34', '$dospert35', '$dospert36',
    '$dospert37', '$dospert38', '$dospert39', '$dospert40',
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