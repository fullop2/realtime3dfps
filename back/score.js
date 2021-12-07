module.exports = {
  headToTitle : `
  <!DOCTYPE html>
  <html lang="en" dir="ltr">
    <head>
      <meta charset="utf-8">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/3.7.2/animate.min.css">
      <!-- Latest compiled and minified CSS -->
      <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css">
      <!-- jQuery library -->
      <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js"></script>
      <!-- Popper JS -->
      <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.7/umd/popper.min.js"></script>
      <!-- Latest compiled JavaScript -->
      <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.min.js"></script>
      <link rel="stylesheet" href="/scrollbar.css">
      <title>`,
  titleEnd : `</title>
    </head>
    <body>
      <table class="table">
        <tbody>
          <tr>
            <th>Player</th>
            <th>Score</th>
          </tr>
  `,
  bodyEnd : `
        </tbody>
      </table>
    </body>
  </html>`,

  tr(grade,name,score){
    return `
          <tr>
            <th>${grade}</th>
            <td>${name}</td>
            <td>${score}</td>
          </tr>`;
  }
}
