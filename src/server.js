const { PeerRPCServer } = require("grenache-nodejs-ws");
const Link = require("grenache-nodejs-link");
const { port, clientId } = require("./utils");
const { orderbook } = require("./orderbook");

const serverLink = new Link({
  grape: "http://127.0.0.1:30001",
});
serverLink.start();

const orderbookPeer = new PeerRPCServer(serverLink, {});
orderbookPeer.init();

const tradingPeer = new PeerRPCServer(serverLink, {});
tradingPeer.init();

const tradingService = tradingPeer.transport("server");
tradingService.listen(port + 1);

const orderbookService = orderbookPeer.transport("server");
orderbookService.listen(port);

setInterval(function () {
  serverLink.announce("p2p_exchange", orderbookService.port, {});
  serverLink.announce(clientId, tradingService.port, {});
}, 1000);

orderbookService.on("request", (rid, key, request, handler) => {
  switch (request.type) {
    case "getOrderook":
      if (request.host === port) {
        handler.reply(null, null);
        return;
      }
      handler.reply(null, orderbook.getOrders());
      break;
    default:
      console.log("unknown request");
  }
  handler.reply(null, { msg: Math.random() });
});

tradingService.on("request", (rid, key, request, handler) => {
  console.log(request);
  switch (request.type) {
    case "lock":
      //TODO: make check of the offer, here I skip this step to save time and assume we checked this on client and we trust client
      let lockId = request.payload.match.id;
      const order = orderbook.getOrder(lockId);
      if (order.lock && order.match.taker !== request.payload.match.taker) {
        handler.reply(null, false);
      }
      orderbook.lockOrder(lockId);
      orderbook.setTaker(lockId, request.payload.match.taker);
      handler.reply(null, true);
      break;
    case "completeTrade":
      //TODO: check that caller and orded is correct, skipped to save time
      let id = request.payload.order.id;
      let processedOrder = orderbook.getOrder(id);
      if (request.payload.remainingValue) {
        processedOrder.value = request.payload.remainingValue;
        orderbook.unLockOrder(processedOrder);
      } else {
        orderbook.deleteOrder(id);
      }
      handler.reply(null, true);
      console.log("remaining orderbook:", orderbook.getOrders());
      break;
    default:
      console.log("unknown request");
  }
  handler.reply(null, { msg: Math.random() });
});

//it takes some  time for server to bootstrap, added this method to avoid errors
const init = async () => {
  return new Promise((resolve, reject) => {
    const maxLookupRetries = 30;
    const lookupInterval = 5000;
    let isServerUp = false;
    let retries = 0;

    const i = setInterval(() => {
      serverLink.lookup("p2p_exchange", { retry: 5 }, (err, data) => {
        isServerUp =
          !!data &&
          data.length &&
          data.findIndex((item) => item.includes(`:${port}`)) > -1;
        if (isServerUp) {
          clearInterval(i);
          resolve();
        }
        retries++;
        if (retries > maxLookupRetries) {
          reject("could not reach server");
        }
      });
    }, lookupInterval);
  });
};

exports.init = init;
