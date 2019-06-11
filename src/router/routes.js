const express = require("express"),
  router = express.Router(),
  ipfsController = require("../api/controllers/ipfsController");

router.use("/ipfs", ipfsController);

module.exports = router;
