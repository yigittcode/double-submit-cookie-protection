const User = require('../models/user');
const bcrypt = require('bcryptjs');

exports.getLogin = (req, res, next) => {
    const errorMessage = req.query.errorMessage;
    res.render('auth/login', {
        path: '/login',
        pageTitle: 'Login',
        errorMessage: errorMessage  
    });
};

exports.getSignup = (req, res, next) => {
    const errorMessage = req.query.errorMessage;
    res.render('auth/signup', {
        path: '/signup',
        pageTitle: 'Signup',
        errorMessage: errorMessage  
    });
};

exports.postLogin = async (req, res, next) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.redirect('/login?errorMessage=Invalid email or password.');
        }
        const doMatch = await bcrypt.compare(password, user.password);
        if (doMatch) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save((err) => {
                if (err) console.log(err);
                res.redirect('/');
            });
        }
        res.redirect('/login?errorMessage=Invalid email or password.');
    } catch (err) {
        console.log(err);
        res.redirect('/login');
    }
};

exports.postSignup = async (req, res, next) => {
    const { email, password, confirmPassword } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 12);
        const user = new User({
            email: email,
            password: hashedPassword,
            cart: { items: [] },
        });
        await user.save();
        res.redirect('/login');
    } catch (err) {
        res.redirect('/signup?errorMessage=This email already used.');
    }
};

exports.postLogout = (req, res, next) => {
    req.session.destroy((err) => {
        if (err) console.log(err);
        res.redirect('/');
    });
};
