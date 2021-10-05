const db = require("../models");
const config = require("../config/auth.config");
const User = db.user;

const Op = db.Sequelize.Op;

let jwt = require("jsonwebtoken");
const {Md5} = require("ts-md5");

exports.signin = (req, res) => {
  User.findOne({
    where: {
      user_name: req.body.username
    }
  })
    .then(user => {
      if (!user) {
        return res.status(404).send({ message: "User Not found." });
      }

      let passwordIsValid = Md5.hashAsciiStr(req.body.password + req.body.username) === user.user_password_hash;

      if (!passwordIsValid) {
        return res.status(401).send({
          accessToken: null,
          message: "Invalid Password!"
        });
      }

      let token = jwt.sign({ id: user.user_id, username: user.user_name, roles: user.user_level }, config.secret, {
        expiresIn: 86400 // 24 hours
      });

      res.status(200).send({
        id: user.user_id,
        username: user.user_name,
        roles: user.user_level,
        prefs: user.user_prefs,
        accessToken: token
      });
    })
    .catch(err => {
      res.status(500).send({ message: err.message });
    });
};
