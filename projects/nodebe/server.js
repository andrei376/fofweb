const express = require('express');
const bodyParser    = require('body-parser');
const cors          = require('cors');

const app = express();
const port = 3080;

let RateLimit = require('express-rate-limit');
let limiter = RateLimit({
  windowMs: 1*60*1000, // 1 minute
  max: 260
});

let corsOptions = {
  origin: "http://localhost:4200"
};

// apply rate limiter to all requests
app.use(limiter);
app.use(cors(corsOptions));
// app.options('*', cors());

app.use(bodyParser.json({limit: '10mb', extended: true}));
app.use(bodyParser.urlencoded({limit: '10mb', extended: true}));

app.get('/', (req,res) => {
  res.json('App Works !!!!');
});

// routes
require('./routes/auth.routes')(app);
require('./routes/user.routes')(app);


const db = require("./models");

db.sequelize.sync({force: false, alter: false});

app.listen(port, () => {
  console.log(`Server listening on the port::${port}`);
});
