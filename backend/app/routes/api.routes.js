module.exports = (app) => {
  const api = require("../controllers/api.controller.js");
  const fileHandler = require("../upload/fileHandler.js");
  var router = require("express").Router();
  router.post("/api/login", api.login);
  router.post("/api/reboot/:id", api.reboot);
  router.post("/api/upload/:id", fileHandler.uploader, api.fileUpload);
  router.post("/api/useComputer/", api.useComputer);
  router.post("/api/releaseComputer/", api.releaseComputer);
  router.post("/api/userActivity/", api.userActivity);
  app.use("", router);
};
