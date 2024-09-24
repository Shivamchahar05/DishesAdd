const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('./models/User');
const Dish = require('./models/Dish');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: 'http://localhost:3000', // Your frontend URL
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

const upload = multer({ dest: 'uploads/' });

const corsOptions = {
    origin: 'http://localhost:3000', // Your frontend URL
    methods: ['GET', 'POST'],
    credentials: true,
};

app.use(cors(corsOptions)); // Apply CORS middleware
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB connection
mongoose.connect('mongodb://127.0.0.1:27017/dish_management', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('MongoDB connected successfully');
})
.catch(err => {
    console.error('MongoDB connection error:', err);
});

// Register Route
app.post('/register', async (req, res) => {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        const newUser = new User({ email, password: hashedPassword });
        await newUser.save();
        res.status(201).send('User registered');
    } catch (err) {
        res.status(400).send('Email already exists');
    }
});

// Login Route
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
        const token = jwt.sign({ id: user._id }, 'secret', { expiresIn: '1h' });
        res.json({ token });
    } else {
        res.status(401).send('Invalid credentials');
    }
});

// Dish Route
app.post('/dishes', upload.single('image'), async (req, res) => {
    const { name, day, userId } = req.body;
    const imageUrl = `http://localhost:3000/uploads/${req.file.filename}`;
    console.log('Request Body:', req.body); // Log request body
    console.log('Uploaded File:', req.file); // Log uploaded file

    try {
        const newDish = new Dish({ name, day, imageUrl, user: userId });
        const result = await newDish.save();
        console.log(result, ":result");
        io.emit('newDish', newDish); // Emit to all connected clients
        res.status(201).json(newDish);
    } catch (err) {
        console.error('Error adding dish:', err); // Log detailed error
        res.status(400).send('Error adding dish');
    }
});

// Fetch Dishes by User
app.get('/dishes/:userId', async (req, res) => {
    const { userId } = req.params;
    const dishes = await Dish.find({ user: userId });
    res.json(dishes);
});

// Socket.IO Connection
io.on('connection', (socket) => {
    console.log('User connected');

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });

    socket.on('updateDish', async (data) => {
        console.log(data, "data")
        const { id, day } = data;
        const updatedDish = await Dish.findByIdAndUpdate(id, { day }, { new: true });
        // consoel.log(updatedDish, "updatedDish")

        // io.emit('dishUpdated', updatedDish); 
    });
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
