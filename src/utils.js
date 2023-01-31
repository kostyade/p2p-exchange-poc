const crypto = require("crypto");

const port = 1024 + Math.floor(Math.random() * 1000);
const clientId = crypto.randomBytes(16).toString("hex");

class Request {
  constructor(type, payload) {
    this.host = port;
    this.type = type;
    this.payload = payload;
  }
}

module.exports = {
  Request,
  port,
  clientId,
};
