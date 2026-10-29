import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";
import { createRemoteJWKSet, jwtVerify } from "jose";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI);

async function mongodbconnect() {
  try {
    // connect to the mongodb database
    await client.connect();
    return client;
  } catch (err) {
    console.log(err);
  }
}

const MongodbDataBase = await mongodbconnect();

// select database and collection
const database = MongodbDataBase.db("wanderlast");
const destinationCollections = database.collection("destinations");
const usersBookingCollectons = database.collection("Bookings");

const verifyToken = async (req, res, next) => {
  const jwtToken = req.headers.authorization;

  if (!jwtToken) return res.status(401).send({ msg: "unauthorized" });

  const token = jwtToken.split(" ")[1];

  if (!token) return res.status(401).send({ msg: "unauthorized" });

  console.log(token);

  const jwks = createRemoteJWKSet(
    new URL("http://localhost:3000/api/auth/jwks"),
  );

  try {
    const { payload } = await jwtVerify(token, jwks);

    console.log(payload);

    next();
  } catch (error) {
    return res.status(500).send({ msg: "Internal server error!" });
  }
};

// base url http://localhost:8000/
app.get("/", verifyToken, async (req, res) => {
  const data = await destinationCollections.find().toArray();
  res.send(data);
});

// base url http://localhost:8000/add-destination
app.post("/add-destination", async (req, res) => {
  const data = req.body;
  const result = await destinationCollections.insertOne(data);
  res.send(result);
});

app.get("/add-destination/:id", async (req, res) => {
  const { id } = req.params;
  const result = await destinationCollections.findOne({
    _id: new ObjectId(id),
  });

  app.patch("/update-destination/:id", async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    const result = await destinationCollections.updateOne(
      { _id: new ObjectId(id) },
      { $set: data },
    );
    res.send(result);
  });

  // base url http://localhost:8000/add-booking
  app.post("/add-booking", async (req, res) => {
    const data = req.body;
    const result = await usersBookingCollectons.insertOne(data);
    console.log(data);
    res.send(result);
  });

  app.get("/get-userBooking", async (req, res) => {});

  app.delete("/delete-destination/:id", async (req, res) => {
    const { id } = req.params;
    const result = await destinationCollections.deleteOne({
      _id: new ObjectId(id),
    });
    res.send(result);
  });

  res.send(result);
});

app.get("/my-bookings/:email", async (req, res) => {
  const email = req.params.email;
  const result = await usersBookingCollectons.find({ email:email}).toArray();
  console.log(email);

  res.send(result);
});

// run the server and liseten to the port
app.listen(PORT, () => {
  console.log("server is runnign..");
});
