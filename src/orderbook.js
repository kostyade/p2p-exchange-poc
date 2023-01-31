const crypto = require("crypto");
const { port, clientId } = require("./utils");

class Order {
  constructor(type, price, value) {
    this.id = crypto.randomBytes(16).toString("hex");
    this.type = type;
    this.price = price;
    this.value = value;
    this.peer = clientId;
    this.lock = true;
    this.taker = null;
  }
}

class OrderBook {
  ownOrders = {};

  static findMatch(order, orders) {
    const swapSide = order.type === "buy" ? "sell" : "buy";
    const swapArr = Object.values(orders)
      .filter((o) => !o.lock && o.type === swapSide && o.maker !== port)
      .sort((o1, o2) => {
        if (swapSide === "sell") {
          return o1.price - o2.price;
        }
        return o2.price - o1.price;
      });

    if (swapArr.length) {
      return swapArr[0];
    }
    return null;
  }

  addOrder(order) {
    this.ownOrders[order.id] = order;
  }

  getOrders() {
    return this.ownOrders;
  }

  getOrder(id) {
    return this.ownOrders[id];
  }

  setTaker(id, taker) {
    this.ownOrders[id].taker = taker;
  }

  lockOrder(id) {
    if (this.ownOrders[id]) {
      this.ownOrders[id].lock = true;
    }
  }

  unLockOrder(id) {
    if (this.ownOrders[id]) {
      this.ownOrders[id].lock = false;
    }
  }

  deleteOrder(id) {
    delete this.ownOrders[id];
  }
}

const orderbook = new OrderBook();

module.exports = { orderbook, Order, OrderBook };
