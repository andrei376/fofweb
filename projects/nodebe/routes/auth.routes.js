const controller = require("../controllers/auth.controller");
const config = require("../config/auth.config");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      config.TOKEN_HEADER_KEY + ", Origin, Content-Type, Accept"
    );
    next();
  });

  app.post("/api/auth/signin", controller.signin);
};
