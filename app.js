const path = require('path')
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const { doubleCsrf: csrf } = require('csrf-csrf');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const errorController = require('./controllers/error');
const User = require('./models/user');
const MongoStore = require('connect-mongo');

require('dotenv').config();
const MONGODB_URI = process.env.MONGODB_URI;

const app = express();

const csrfProtection = csrf({
    getSecret: () => 'supersecret',
    getTokenFromRequest: (req) => req.body._csrf,
    cookieName : 'csrf-token'
});

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(
    session({
        secret: 'my secret',
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            mongoUrl: MONGODB_URI,
            collectionName: 'sessions',
            serialize: (session) => {
              return { ...session };
            }
          })
    })
);
/** CSRF-CSRF PACKAGE */
app.use(cookieParser('supersecret'));
app.use(csrfProtection.doubleCsrfProtection);

app.use((req, res, next) => {
    if (!req.session.user) {
        return next();
    }
    User.findById(req.session.user._id)
        .then((user) => {
            req.user = user;
            next();
        })
        .catch((err) => console.log(err));
});

app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorController.get404);

mongoose
    .connect(MONGODB_URI)
    .then((result) => {
        const PORT = process.env.PORT
        app.listen(PORT);
    })
    .catch((err) => {
        console.log(err);
    });
