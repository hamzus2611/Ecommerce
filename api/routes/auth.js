const { signup, login ,verfUser, Verif } = require('../controllers/auth.controllers');

const router = require('express').Router();


router.post('/signup', signup)
router.post('/login', login)
router.get('/verify/:userId/:uniqueString',verfUser)
router.get('/Verif',Verif)

module.exports = router;