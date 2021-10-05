const { authJwt } = require("../middleware");
const controller = require("../controllers/user.controller");
const config = require("../config/auth.config");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      config.TOKEN_HEADER_KEY + ", Origin, Content-Type, Accept"
    );
    next();
  });

  app.get("/api/test/all", controller.allAccess);

  app.get(
    "/api/test/user",
    [authJwt.verifyToken],
    controller.userBoard
  );

  app.get(
    '/api/feeds',
    [authJwt.verifyToken],
    controller.getFeeds
  );

  app.get(
    '/api/tagstbl',
    [authJwt.verifyToken],
    controller.getTagsTable
  );
};
