const express = require('express')
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// middle ware

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.fwvvr.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const productsCollection = client.db('toolsegy').collection('products');
        const purchaseCollection = client.db('toolsegy').collection('purchase');
        const reviewsCollection = client.db('toolsegy').collection('reviews');
        const clientsCollection = client.db('toolsegy').collection('clients');

        // PRODUCTS API
        app.get('/products', async (req, res) => {
            const query = {};
            const cursor = productsCollection.find(query);
            const products = await cursor.toArray();
            res.send(products);
        })

        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const product = await productsCollection.findOne(query);
            console.log(product)
            res.send(product);
        })


        // PURCHASE API

        app.post('/purchase', async (req, res) => {
            const purchase = req.body;
            const query = { product: purchase.productId, product: purchase.email }
            console.log(query)
            const exists = await purchaseCollection.findOne(query);
            if (exists) {
                return res.send({ success: false, purchase: exists })
            }
            const result = await purchaseCollection.insertOne(purchase);
            return res.send({ success: true, result });
        })

        // REVIEWS API

        app.get('/reviews', async (req, res) => {
            const query = {};
            const cursor = reviewsCollection.find(query);
            const reviews = await cursor.toArray();
            res.send(reviews);
        })


        // CLIENT API

        app.get('/clients', async (req, res) => {
            const query = {};
            const cursor = clientsCollection.find(query);
            const clients = await cursor.toArray();
            res.send(clients);
        })


    }
    finally {

    }

}

run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Hello Toolsegy')
})

app.listen(port, () => {
    console.log(`Toolsegy app listening on port ${port}`)
})