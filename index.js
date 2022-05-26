const express = require('express')
const cors = require('cors');
var jwt = require('jsonwebtoken');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// middle ware

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.fwvvr.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' })
        }
        req.decoded = decoded;
        next();
    });
}



async function run() {
    try {
        await client.connect();
        const productsCollection = client.db('toolsegy').collection('products');
        const purchaseCollection = client.db('toolsegy').collection('purchase');
        const reviewsCollection = client.db('toolsegy').collection('reviews');
        const clientsCollection = client.db('toolsegy').collection('clients');
        const usersCollection = client.db('toolsegy').collection('users');

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
            // console.log(product)
            res.send(product);
        })

        // USER API

        app.get('/user', verifyJWT, async (req, res) => {
            const users = await usersCollection.find().toArray();
            res.send(users)
        })

        app.get('/admin/:email', async (req, res) => {
            const email = req.params.email;
            const user = await usersCollection.findOne({ email: email });
            const isAdmin = user.role === 'admin';
            res.send({ admin: isAdmin })
        })

        app.put('/user/admin/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const requester = req.decoded.email;
            const requesterAccount = await usersCollection.findOne({ email: requester });
            if (requesterAccount.role === 'admin') {
                const filter = { email: email };
                const updatedDoc = {
                    $set: { role: 'admin' },
                };
                const result = await usersCollection.updateOne(filter, updatedDoc);
                res.send(result);
            }
            else {
                res.status(403).send({ message: 'Forbidden action' })
            }

        })


        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updatedDoc = {
                $set: user,
            };
            const result = await usersCollection.updateOne(filter, updatedDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
            res.send({ result, token });
        })



        // PURCHASE API

        app.post('/purchase', async (req, res) => {
            const purchase = req.body;
            const query = { product: purchase.name, product: purchase.email }
            // console.log(query)
            const exists = await purchaseCollection.findOne(query);
            if (exists) {
                return res.send({ success: false, purchase: exists })
            }
            const result = await purchaseCollection.insertOne(purchase);
            return res.send({ success: true, result });
        })

        app.get('/purchase', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            if (email === decodedEmail) {
                const query = { email: email };
                const myOrders = await purchaseCollection.find(query).toArray();
                return res.send(myOrders);
            }
            else {
                return res.status(403).send({ message: 'Forbidden access' })
            }
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