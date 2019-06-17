require("reflect-metadata");
const express = require("express"),
  app = express(),
  path = require("path"),
  ipfsClient = require("ipfs-http-client"),
  fs = require("fs"),
  jsonfile = require("jsonfile"),
  Buffer = require("ipfs-http-client").Buffer,
  moment = require("moment");

const sleep = milliseconds => {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
};

const ipfs = ipfsClient("blockr.verux.nl", "3031", { protocol: "http" });

/**
 * GET - Gets a file by its IPFS hash
 * @param hash The hash of the file to get. Example: QmNxx3THsByakKmr8WoMibCNUiNLbtiqxH2QDRLMWZTb5Z
 * @returns File instance to send to the client
 */
app.get("/:hash", (req, res) => {
  let ipfsHash = req.params.hash;
  ipfs.get(`/ipfs/${ipfsHash}`, (error, file) => {
    fs.writeFile(`${__dirname}/test.pdf`, file[0].content, err => {
      sleep(500).then(() => {
        // Sleep a bit to make sure the file is written
        let filePath = path.join(__dirname, "test.pdf");
        let data = fs.readFileSync(filePath);
        res.contentType("application/pdf");
        res.send(data); // Sends file directly to browser, can be changed to more friendly way
        fs.unlinkSync(filePath); // Remove file from directory after sending
      });
    });
  });
});

/**
 * GET - Gets the latest version of a file by the hash of it's first version.
 * @param hash The hash of the first version of the file to get.
 * @returns JSON object with the information of the latest version of the file. 
 * Example: {
 *    version:  1,
 *    ipfsHash: "QmNxx3THsByakKmr8WoMibCNUiNLbtiqxH2QDRLMWZTb5Z",
 *    uploader: "PUBLIC_KEY",
 *    filename: "test.pdf",
 *    uploaded: "1560332254"       
 * }
 */
app.get("/:hash/latest", (req, res) => {
  jsonfile
    .readFile("QmdYGC2M6S63a3CjG7ctwYmPFLzeQc3cviDdVRftojS9E8.json")
    .then(object => {
      const indexOfFile = object.files.findIndex(
        obj => obj.ipfsHash == req.params.hash
      );
      return res.send(
        object.files[indexOfFile].versions[
          object.files[indexOfFile].versions.length - 1
        ]
      );
    });
});

/**
 * GET - Gets all versions version of a file by the hash of it's first version.
 * @param hash The hash of the first version of the file to get.
 * @returns JSON object with the information of all versions of the file. 
 * Example: {
 *   ipfsHash: "QmNxx3THsByakKmr8WoMibCNUiNLbtiqxH2QDRLMWZTb5Z",
 *   uploader: "PUBLIC_KEY",
 *   filename: "test.pdf",
 *   uploaded: "1560332254",
 *   versions: [] 
 * }
 */
app.get("/:hash/versions", (req, res) => {
  jsonfile
    .readFile("QmdYGC2M6S63a3CjG7ctwYmPFLzeQc3cviDdVRftojS9E8.json")
    .then(object => {
      const indexOfFile = object.files.findIndex(
        obj => obj.ipfsHash == req.params.hash
      );
      return res.send(object.files[indexOfFile]);
    });
});

/**
 * POST - Adds a paper (file) to the IPFS network.
 * @param body Request body requires a base64 encoded string of the file.
 * @returns JSON object containing the hash of the just created file.
 * Example: {
 *  hash: "QmZpVM3n5dbUkYs4nLSUUV2SuakqCnSyXJseaYpTNJ2kCz"
 * }
 */
app.post("/", (request, response) => {
  const base64 = request.body.base64EncodedPDF.toString();
  const base64Trimmed = base64.split("data:application/pdf;base64,").pop();
  const buffer = Buffer.from(base64Trimmed, "base64");
  ipfs.add(buffer, (err, res) => {
    if (err) throw err;
    jsonfile
      .readFile("QmdYGC2M6S63a3CjG7ctwYmPFLzeQc3cviDdVRftojS9E8.json")
      .then(object => {
        object.files.push({
          // Get file with original public key
          ipfsHash: res[0].hash,
          uploader: "PUBKEY",
          filename: "test.pdf",
          uploaded: moment().unix(),
          versions: []
        });
        return jsonfile.writeFile(
          "QmdYGC2M6S63a3CjG7ctwYmPFLzeQc3cviDdVRftojS9E8.json",
          object
        );
      })
      .then(() => {
        response.send({
          hash: res[0].hash // [0] since the request returns an array (if you try to upload a folder it returns multiple hashes)
        });
      })
      .catch(error => console.error(error));
  });
});

/**
 * Updates a file (adds a new version of the file)
 * @param body Requires two body params: fileToUpdate and base64EncodedPDF
 * {
 *  fileToUpdate: "QmZpVM3n5dbUkYs4nLSUUV2SuakqCnSyXJseaYpTNJ2kCz",
 *  base64EncodedPDF: "....."
 * }
 */
app.put("/", (request, response) => {
  const base64 = request.body.base64EncodedPDF.toString();
  const base64Trimmed = base64.split("data:application/pdf;base64,").pop();
  const buffer = Buffer.from(base64Trimmed, "base64");
  ipfs.add(buffer, (err, res) => {
    if (err) throw err;
    jsonfile
      .readFile("QmdYGC2M6S63a3CjG7ctwYmPFLzeQc3cviDdVRftojS9E8.json")
      .then(object => {
        const index = object.files.findIndex(
          obj => obj.ipfsHash == request.body.fileToUpdate
        );
        object.files[index].versions.push({
          // Get file with original public key
          version: object.files[index].versions.length + 1,
          ipfsHash: res[0].hash,
          uploader: "PUBKEY",
          filename: "test.pdf",
          uploaded: moment().unix()
        });
        return jsonfile.writeFile(
          "QmdYGC2M6S63a3CjG7ctwYmPFLzeQc3cviDdVRftojS9E8.json",
          object
        );
      })
      .then(() => {
        response.send({
          hash: res[0].hash 
          // [0] since the request to the IPFS network returns an array (if you try to upload a folder it returns multiple hashes)
        });
      })
      .catch(error => console.error(error));
  });
});

module.exports = app;
