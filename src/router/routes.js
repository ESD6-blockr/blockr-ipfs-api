const express = require("express"),
  router = express.Router(),
  ipfsController = require("../api/controllers/ipfsController"),
  ipnsController = require("../api/controllers/ipnsController");

router.use("/ipfs", ipfsController);
router.use("/ipns", ipnsController);

module.exports = router;
