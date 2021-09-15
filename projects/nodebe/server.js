const express = require('express');
const bodyParser    = require('body-parser');
const cors          = require('cors');
const jwt           = require('jsonwebtoken');
let expressJWT      = require('express-jwt');

const app = express();
const port = 3080;

app.use(cors());
app.options('*', cors());
app.use(bodyParser.json({limit: '10mb', extended: true}));
app.use(bodyParser.urlencoded({limit: '10mb', extended: true}));

app.get('/', (req,res) => {
  res.json('App Works !!!!');
});

app.listen(port, () => {
  console.log(`Server listening on the port::${port}`);
});

// SECRET FOR JWT
let secret = 'some_secret'; // a secret key is set here

/* Create token to be used */
app.get('/api/token/sign', (req, res) => {
  var userData = {
    "name": "My Name",
    "id": "1234"
  }
  let token = jwt.sign(userData, secret, { expiresIn: '25s'})
  res.status(200).json({"token": token});
});

app.use(expressJWT({ secret: secret, algorithms: ['HS256']})
  .unless( // This allows access to /token/sign without token authentication
    { path:
      [
        '/api/token/sign'
      ]
    }
  )
);

// upon successful token authentication, access to path1 is granted
app.get('/api/path1', (req, res) => {
  res.status(200)
    .json({
      "success": true,
      "msg": "Secret Access Granted"
    });
});
