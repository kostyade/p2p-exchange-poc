const { submitOrder } = require("./client");
const { init } = require("./server");
const { Order } = require("./orderbook");

(async () => {
  try {
    console.log("Initialising");
    await init();
    console.log("Up and running");
    //creating random order for trade simulation
    const order = new Order("sell", 5, 210);
    console.log("Initial order:", order);
    await submitOrder(order);
  } catch (err) {
    console.error(err);
    //process.exit(1);
  }
})();
