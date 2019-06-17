const express = require("express"),
  app = express(),
  cors = require("cors"),
  PORT = 3002,
  routes = require("./src/router/routes");

let bodyParser = require("body-parser");

// parse application/json
app.use(bodyParser({ limit: "50mb" }));
app.use(bodyParser.json());
app.use(cors());
app.use("/api", routes);


app.listen(PORT, () => console.log(`Blockr IPFS app listening on port ${PORT}!`));
