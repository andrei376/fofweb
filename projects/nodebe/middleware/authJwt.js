const jwt = require("jsonwebtoken");
const config = require("../config/auth.config.js");

verifyToken = (req, res, next) => {
  let token = req.headers[config.TOKEN_HEADER_KEY];

  if (!token) {
    return res.status(403).send({
      message: "No token provided!"
    });
  }

  const bearer = token.split(' ');
  token = bearer[1];

  if (!token) {
    return res.status(403).send({
      message: "No token provided!"
    });
  }

  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({
        message: "Unauthorized!"
      });
    }
    // console.log('decode=', decoded);
    req.userId = decoded.id;
    req.username = decoded.username;
    req.roles = decoded.roles;
    next();
  });
};

const authJwt = {
  verifyToken: verifyToken
};

module.exports = authJwt;
