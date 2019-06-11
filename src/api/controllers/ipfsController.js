require("reflect-metadata");
const express = require("express"),
  app = express(),
  path = require("path"),
  ipfsClient = require("ipfs-http-client"),
  fs = require("fs"),
  Buffer = require("ipfs-http-client").Buffer,
  p2p = require("@blockr/blockr-p2p-lib"),
  Peer = require("@blockr/blockr-p2p-lib").Peer;

// const peer = new Peer();
const peer = new Peer("IPFS");
peer.init(["145.93.88.159"]);
console.log(peer);

const sleep = milliseconds => {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
};

const ipfs = ipfsClient("blockr.verux.nl", "3031", { protocol: "http" });

app.get("/", (req, res) => {
  res.send("Getting IPFS!");
  console.log(peer.getPeerOfType("IPFS"));
});

/**
 * Gets a file by its IPFS hash
 */
app.get("/:hash", (req, res) => {
  let ipfsHash = req.params.hash;
  ipfs.get(`/ipfs/${ipfsHash}`, (error, file) => {
    fs.writeFile(`${__dirname}/test.pdf`, file[0].content, err => {
      sleep(500).then(() => {
        let filePath = path.join(__dirname, "test.pdf");
        let data = fs.readFileSync(filePath);
        res.contentType("application/pdf");
        res.send(data); //Sends file directly to browser, can be changed to more friendly way
        fs.unlinkSync(filePath);
      });
    });
  });
});

/**
 * POST - adds a paper (file) to the IPFS network.
 * Request body requires a base64 encoded string of the file.
 * Returns following JSON object:
 *  {
 *    hash: "QmU2qh9BRHufNnQTXoyuEaWjipHzGGJaUbJz9s5kvs5Kt9"
 *  }
 */
app.post("/", (request, response) => {
  const base64 = request.body.base64EncodedPDF.toString();
  const base64Trimmed = base64.split("data:application/pdf;base64,").pop();
  const buffer = Buffer.from(base64Trimmed, "base64");
  ipfs.add(buffer, (err, res) => {
    if (err) throw err;
    console.log(res);
    response.send({
      hash: res[0].hash // [0] since the request returns an array (if you try to upload a folder it returns multiple )
    });
  });
});

module.exports = app;
