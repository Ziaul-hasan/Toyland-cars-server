const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000

// middlewares...
app.use(cors())
app.use(express.json())


// mongodb

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sjxouxn.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const toyCollection = client.db('toylandDB').collection('toys')


    // creating index on two fields

    const indexKeys = { name: 1, subcategory: 1 };
    const indexOptions = { name: "nameSubcategory" }
    const result = await toyCollection.createIndex(indexKeys, indexOptions);


    app.get('/searchToyByNameCategory/:text', async (req, res) => {
      const searchText = req.params.text;
      const result = await toyCollection.find({
        $or: [
          { name: { $regex: searchText, $options: "i" } },
          { subcategory: { $regex: searchText, $options: "i" } }
        ]
      }).toArray();
      res.send(result)
    })

    // get operation
    app.get('/toys', async (req, res) => {
      console.log(req.query?.email)
      let query = {}
      if (req.query?.email) {
        query = { sellerEmail: req.query.email }
      }
      const result = await toyCollection.find(query).sort({price: -1}).toArray()
      res.send(result)
    })

    app.get('/toys/:text', async (req, res) => {
      console.log(req.params.text)
      const result = await toyCollection.find({ subcategory: req.params.text }).toArray()
      res.send(result)
    })

    app.get('/toy/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await toyCollection.findOne(query);
      res.send(result)
    })


    // post operation
    app.post('/addToys', async (req, res) => {
      const toy = req.body;
      console.log(toy)
      const result = await toyCollection.insertOne(toy)
      res.send(result)
    })

    // Update/Put operation
    app.put('/toy/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const options = { upsert: true };
      const updatedToy = req.body
      const toy = {
        $set: {
          price: updatedToy.price,
          quantity: updatedToy.quantity,
          description: updatedToy.description
        }
      }
      const result = await toyCollection.updateOne(filter, toy, options)
      res.send(result);
    })

    // delete operation
    app.delete('/toy/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await toyCollection.deleteOne(query);
      res.send(result)
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('toy market is running smoothly')
})

app.listen(port, () => {
  console.log(`toy market is running on port: ${port}`)
})