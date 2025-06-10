const express = require('express');
const router = express.Router();

router.route('/men')
    .get((req, res) => {
        res.render('page/shop/men', {title: "Men's Collection - Velvra"});
    })

module.exports = router;