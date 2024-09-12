// Import required packages
const dotenv = require("dotenv/config");
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const googleAuth = require('./google.auth');
const passport = require('passport');
const session = require('express-session');
const authRoutes = require('./routes/userRoutes');
const courseRouter = require('./routes/courses');
const tutorialRouter = require('./routes/tutorials');
const { routsInit } = require('./controllers/auth.google');
const MongoStore = require('connect-mongo');
const { config } = require("dotenv");
const postRoutes = require('./routes/postRoutes');
const commentRoutes = require('./routes/commentRoutes');
const path = require('path');
const csurf = require("csurf");  // CSRF protection package

// Import .env configuration
require("dotenv").config();

// Initialize port number
const PORT = process.env.PORT || 8080;

// Use dependencies
app.use(cors());  // Allows cross-origin requests

// Parse JSON using body-parser
app.use(bodyParser.json());

// Connect to MongoDB
const URI = process.env.MONGODB_URL;

// Set up session management and passport authentication
app.use(session({
    secret: 'keyboard cat',  // Session secret for security
    resave: false,           // Prevent resaving unchanged sessions
    saveUninitialized: false, // Don't create sessions for unauthenticated users
    store: MongoStore.create({ mongoUrl: URI }),  // Store sessions in MongoDB
    cookie: { secure: false, expires: new Date(Date.now() + 50000) },  // Cookie settings
    maxAge: 10000  // Session expiration
}));

app.use(passport.initialize());  // Initialize passport for authentication
app.use(passport.session());     // Enable passport sessions

// Add CSRF protection middleware
app.use(csurf());  // Enable CSRF protection to prevent cross-site request forgery

// Set CSRF token as a cookie for each request
app.use(function (req, res, next) {
    res.cookie("mytoken", req.csrfToken());  // Attach the CSRF token to a cookie named 'mytoken'
    next();  // Proceed to the next middleware
});

// Connect to MongoDB using Mongoose
mongoose.connect(URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB!!!');

    // Start the server after successful DB connection
    app.listen(PORT, () => {
        console.log(`Server is up and running on port ${PORT}`);
        routsInit(app, passport);  // Initialize Google authentication routes
        googleAuth(passport);      // Set up Google authentication strategy
    });
}).catch((error) => {
    console.log("Error Connecting MongoDb", error);
});

// Access the MongoDB connection
const db = mongoose.connection;

// Set up routes for the app
app.use('/auth', authRoutes);
app.use('/courses', courseRouter);
app.use('/tutorials', tutorialRouter);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);

// Serve static files from the TuteFiles directory
app.use('/TuteFiles', express.static(__dirname + '/TuteFiles'));
