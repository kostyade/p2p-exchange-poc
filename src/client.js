const { PeerRPCClient } = require("grenache-nodejs-ws");
const Link = require("grenache-nodejs-link");
const { Request } = require("./utils");
const { orderbook, OrderBook } = require("./orderbook");

const clientLink = new Link({
  grape: "http://127.0.0.1:30001",
  requestTimeout: 10000,
});
clientLink.start();

const peerClient = new PeerRPCClient(clientLink, {});
peerClient.init();

const getOrderbook = async () => {
  return new Promise((resolve, reject) => {
    const r = new Request("getOrderook", {});
    peerClient.map("p2p_exchange", r, { timeout: 10000 }, (err, data) => {
      let orders = {};
      if (data && data.length) {
        orders = data.reduce((acc, cur) => {
          if (cur) {
            return { ...acc, ...cur };
          }
          return acc;
        }, {});
      }
      resolve(orders);
    });
  });
};

const lockOrder = async (order, match) => {
  return new Promise((resolve, reject) => {
    const r = new Request("lock", { order, match });
    peerClient.request(match.peer, r, { timeout: 10000 }, (err, data) => {
      resolve(data);
    });
  });
};

//Trivial simulation
const completeTrade = async (order, remainingValue) => {
  return new Promise((resolve, reject) => {
    const r = new Request("completeTrade", { order, remainingValue });
    peerClient.request(order.peer, r, { timeout: 10000 }, (err, data) => {
      resolve(data);
    });
  });
};

//We assume that we trust each other, escrow is needed in real world
//Trivial execution simulation,
const executeOrders = async (order, match) => {
  if (order.value > match.value) {
    order.value -= match.value;
    await completeTrade(match, 0);
    return order;
  }
  if (order.value < match.value) {
    //order filled in full
    //match partially filled
    await completeTrade(match, match.value - order.value);
    delete order;
    return null;
  }
  //both filled
  //match filled in full
  await completeTrade(match, 0);
  delete order;
  return null;
};

const submitOrder = async (order) => {
  const orders = await getOrderbook();
  const match = OrderBook.findMatch(order, orders);
  if (match) {
    const lockSuccess = await lockOrder(order, match);
    if (lockSuccess) {
      const remained = await executeOrders(order, match);
      if (remained) {
        await submitOrder(remained);
      }
    }
    return;
  }
  orderbook.addOrder(order);
  orderbook.unLockOrder(order.id);
  console.log("current orderbook:", orderbook.getOrders());
};

module.exports = {
  submitOrder,
};
