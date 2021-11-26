const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;
require("dotenv").config();
const { MongoClient } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xdeet.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  await client.connect();
  const database = client.db("zerairo");
  const usersCollection = database.collection("users");
  const productsCollection = database.collection("products");
  const ordersCollection = database.collection("orders");
  const reviewsCollection = database.collection("reviews");

  // send users data to server
  app.post("/users", async (req, res) => {
    const user = req.body;
    const result = await usersCollection.insertOne(user);
    console.log(result);
    res.json(result);
  });

  // add products to database
  app.post("/products", async (req, res) => {
    const product = req.body;
    const result = await productsCollection.insertOne(product);
    res.json(result);
  });

  //get all products from database
  app.get("/products", async (req, res) => {
    const cursor = productsCollection.find({});
    const allProducts = await cursor.toArray();
    res.send(allProducts);
  });

  // delete a single product
  app.delete("/products/:id", async (req, res) => {
    const id = req.params.id;
    const query = { _id: ObjectId(id) };
    const result = await productsCollection.deleteOne(query);
    res.json(result);
  });

  // get reviews to database
  app.get("/reviews", async (req, res) => {
    const result = reviewsCollection.find({});
    const allReviews = await result.toArray();
    res.json(allReviews);
  });
  // add reviews to database
  app.post("/reviews", async (req, res) => {
    const review = req.body;
    const result = await reviewsCollection.insertOne(review);
    res.json(result);
  });

  //get all orders from database
  app.get("/orders", async (req, res) => {
    const cursor = ordersCollection.find({});
    const allOrders = await cursor.toArray();
    res.send(allOrders);
  });

  //update orders status from pending to shipped
  app.put("/orders/:id", async (req, res) => {
    const id = req.params.id;
    const query = { _id: ObjectId(id) };
    const options = { upsert: true };
    const updateDoc = { $set: { status: "Shipped" } };
    const result = await ordersCollection.updateOne(query, updateDoc, options);
    res.json(result);
  });

  // delete a single order
  app.delete("/orders/:id", async (req, res) => {
    const id = req.params.id;
    const query = { _id: ObjectId(id) };
    const result = await ordersCollection.deleteOne(query);
    res.json(result);
  });

  // get a single product to purchase
  app.get("/purchase/:id", async (req, res) => {
    const id = req.params.id;
    const query = { _id: ObjectId(id) };
    const product = await productsCollection.findOne(query);
    res.send(product);
  });

  // send data to database with user info after clicking place order
  app.post("/purchase", async (req, res) => {
    const order = req.body;
    const result = await ordersCollection.insertOne(order);
    res.json(result);
  });

  // get a users own order
  app.get("/myorders", async (req, res) => {
    const email = req.query.email;
    const query = { email: email };
    const cursor = ordersCollection.find(query);
    const result = await cursor.toArray();
    res.json(result);
  });

  //check if a user is admin or not
  app.get("/users/:email", async (req, res) => {
    const email = req.params.email;
    const query = { email: email };
    const user = await usersCollection.findOne(query);
    let isAdmin = false;
    if (user?.role === "admin") {
      isAdmin = true;
    }
    res.json({ admin: isAdmin });
  });

  //make an user to an admin
  app.put("/users/admin", async (req, res) => {
    const user = req.body;
    const filter = { email: user.email };
    const updateDoc = { $set: { role: "admin" } };
    const result = await usersCollection.updateOne(filter, updateDoc);
    res.json(result);
  });
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Welcome to zerairo");
});

app.listen(port, () => {
  console.log(`Zerairo listening at http://localhost:${port}`);
});
