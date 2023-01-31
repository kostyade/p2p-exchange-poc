# P2P distrobuted exchange

Proof of Concept of simple p2p exchange using [Grenache](https://github.com/bitfinexcom/grenache).

## :bookmark_tabs: How to run

```
npm i -g grenache-grape
npm i
```

```
grape --dp 20001 --aph 30001 --bn '127.0.0.1:20002'
grape --dp 20002 --aph 40001 --bn '127.0.0.1:20001'
```

edit order in index.js

```
npm start
```

## :bookmark_tabs: Concept

Each exchange instance consist of three peers (orderbook exchange RPC Server instance, RPC Server instance with unique name to execute locks and incoming trades, RPC Client). Every client stores it's own orderbook, shared through "p2p_exchange". Each order has maker's peer name in it. At the time client submits new order, it requests all available orderbooks and looks for a match. When match is found taker requests a lock from maker's peer. After confirmation maker executes trade and notifies taker, taker adjusts it's order accordingly. If there's remaining value in order, service recursively tries to find next match. If there isn't any, remaining order goes to client's orderbook.

## :bookmark_tabs: Nice to have

Application lacks proper validations, there're just essentials for PoC, we assume that peers trust each other. Real world p2p requires escrow or consensus logic to balance between decentralization and trust.  
It would be nice to add order timestamps, so equal value oders will be taken based on time created. This introduces bunch of complexities, time sync between peers, etc.
peer.map has limit of peers it can connect to, so at certain scale there's no guaratee client will get all available orders. But this is price for decentralization in our case.
And...there's always room for perfection.

## :see_no_evil: Issues

I faced issues when some nodes disconnect and others trying to reach them it causes unhandled exceptions. I bet there's solution but I didn't have time to investigate it further.
