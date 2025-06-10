const express = require('express');
const router = express.Router();


router.route('/')
    .get((req, res) => {
        res.render('../views/page/index.ejs', {
            title: 'Home'});
    })


module.exports = router;