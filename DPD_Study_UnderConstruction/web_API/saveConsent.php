<?php
include('../php/database_config.php');
$table_data = 'consent';

$data = json_decode(file_get_contents('php://input'), true);
// json format: $data['prolific_id']

$prolific_id = $data['prolific_id'];
//$prolific_id = filter_var($prolific_string, FILTER_VALIDATE_REGEXP, array("options" => array("regexp"=>"[a-zA-Z0-9-]+")));

$new_id = $data['new_id'];
$consent1 = $data['consent1'];
$consent2 = $data['consent2'];
$consent3 = $data['consent3'];
$consent4 = $data['consent4'];
$consent5 = $data['consent5'];
$consent6 = $data['consent6'];
$consent7 = $data['consent7'];
$date = $data['date'];
$time = $data['time'];

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $sql = "INSERT INTO $table_data(`prolific_id`, 
    `new_id`, `consent1`, `consent2`, 
    `consent3`, `consent4`, `consent5`, 
    `consent6`, `consent7`, `date`, `time`) VALUES ('$prolific_id',
    '$new_id','$consent1','$consent2', '$consent3',
    '$consent4', '$consent5', '$consent6','$consent7', '$date', '$time')";


    $insertstmt = $conn->prepare($sql);

    $insertstmt->execute();
    echo '{"success": true}';
  } catch(PDOException $e) {
    echo '{"success": false, "message": ' . $e->getMessage();
  }
  $conn = null;
?>