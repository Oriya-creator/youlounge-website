
<?php
$email = $_GET['email'] ?? '';
if (!$email) {
    header('Location: /');
    exit;
}
?>
<!DOCTYPE html>
<html>
<body>
  <h1>Payment successful!</h1>
  <p>Your access link: <a href="course-page.php?access_email=<?php echo urlencode($email); ?>">Start the course</a></p>
  <p>Bookmark this link – you’ll need it to return.</p>
</body>
</html>

