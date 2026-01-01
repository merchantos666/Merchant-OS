// test-mongo.ts

const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://reydelhumomex:HPCQFOFZlJ7crQZB@cluster0.wksr4j3.mongodb.net/reydelhumo?retryWrites=true&w=majority";

const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const db = client.db('reydelhumo');
    const result = await db.collection('test').insertOne({ msg: 'Hola desde CommonJS' });
    console.log('✅ Inserted:', result.insertedId);
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await client.close();
  }
}

run();
