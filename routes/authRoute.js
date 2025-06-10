const express = require('express');
const router = express.Router();

router.route('/signup')
    .get((req, res) => {
        res.render('page/signup', {
            title: 'Sign Up'
        });
    })

router.route('/login')
    .get((req, res) => {
        res.render('page/login', {
            title: 'Login'
        });
    });

module.exports = router;