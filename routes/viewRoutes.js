const router = require('express').Router();
const viewController = require('../controllers/viewController');
const authController = require('../controllers/authController');

router.use(viewController.alerts);

router.get('/account', authController.protect, viewController.getAccount);
router.get('/my-tours', authController.protect, viewController.getMyTours);

router.use(authController.isLoggedIn);
router.get('/', viewController.getOverview);

router.get('/tour/:slug', viewController.getTour);
router.get('/login', viewController.getLogin);

module.exports = router;
