const express = require("express"),
  app = express(),
  jsonFile = require("jsonfile");

/**
 *  Publishes a IPNS name address with a given PeerID.
 *  Creates a JSON file which is then saved to the generated IPNS address.
 *  @param PeerID BODY - PeerID of the node to publish.
 *  @returns The hash from where the IPNS address is available from now on.
 */
app.post("/publish", (request, response) => {
  const addr = `/ipfs/${request.body.peerId}`;
  // In an optimal situation (network with more peers), you would publish the PeerID to the network as an IPNS hash.
  // ipfs.name.publish(request.body.peerId, ()); 
  // https://docs.ipfs.io/guides/concepts/ipns/
  // Now, we deploy a JSON file with the PeerID to mock it.
  const newPeer = {
    files: []
  };
  jsonFile
    .writeFile(`${request.body.peerId}.json`, newPeer)
    .then(object => response.send(object))
    .catch(err => {
      console.error(err);
      response.status(400).send({
        message: `Couldn't add new peer ${request.body.peerId} to IPNS!`,
        actual: JSON.parse(error)
      });
    });
});

/**
 * Gets the IPNS record for a given PeerID.
 * @param peerId PATH - The PeerID for the IPNS record.
 * @returns The JSON version file that is saved on the IPNS record.
 */
app.get("/:peerId", (request, response) => {
  // Normally, we would get the Peer from the network, 
  // but now we return the JSON file that we have saved locally.
  jsonFile.readFile(`${request.params.peerId}.json`)
  .then(object => response.send(object))
  .catch(err => {
    console.error(err);
    response.status(400).send({
      message: `Couldn't get peer ${request.body.peerId} from IPNS!`,
      actual: JSON.parse(error)
    });
  });
});

module.exports = app;
