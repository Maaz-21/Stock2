const express = require('express');
const mongoose = require('mongoose');
const kafka = require('kafka-node');
const axios = require('axios');
const cors = require('cors');
const Stock = require('./models/stock.js'); // Import the Stock model

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/stock-prediction', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Kafka setup
const kafkaClient = new kafka.KafkaClient({ kafkaHost: 'localhost:9092' });
const kafkaProducer = new kafka.Producer(kafkaClient);
const kafkaConsumer = new kafka.Consumer(kafkaClient, [{ topic: 'stock-data', partition: 0 }]);

kafkaProducer.on('ready', () => {
  console.log('Kafka producer is ready');
});

kafkaProducer.on('error', (err) => {
  console.error('Kafka producer error:', err);
});

kafkaConsumer.on('message', async (message) => {
  console.log('Received Kafka message:', message);
  // Process Kafka messages and store in MongoDB
  const stockData = JSON.parse(message.value);
  try {
    await Stock.create(stockData);
  } catch (error) {
    console.error('Error saving stock data:', error);
  }
});

kafkaConsumer.on('error', (err) => {
  console.error('Kafka consumer error:', err);
});

// API Routes
app.get('/', (req, res) => {
  res.send('Welcome to the Stock Prediction Backend!');
});

// Route to fetch stock data
app.get('/stocks/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const stock = await Stock.findOne({ symbol });
    if (!stock) {
      return res.status(404).json({ message: 'Stock not found' });
    }
    res.json(stock);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route to add stock data (for testing)
app.post('/stocks', async (req, res) => {
  try {
    const stockData = req.body;
    const stock = new Stock(stockData);
    await stock.save();
    res.status(201).json(stock);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Fetch stock data from external API
const fetchStockData = async (symbol) => {
  try {
    const response = await axios.get(`https://api.example.com/stocks/${symbol}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching stock data from API:', error);
    throw error;
  }
};

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
