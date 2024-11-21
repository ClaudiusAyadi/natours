const router = require('express').Router();
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');

router
	.route('/')
	.get(tourController.getAllTours)
	.post(
		authController.protect,
		authController.restrictTo('admin', 'lead-guide'),
		tourController.createTour
	);

router
	.route('/:id')
	.get(tourController.getTour)
	.patch(
		authController.protect,
		authController.restrictTo('admin', 'lead-guide'),
		tourController.tourImages,
		tourController.imagesResizer,
		tourController.updateTour
	)
	.delete(
		authController.protect,
		authController.restrictTo('admin', 'lead-guide'),
		tourController.deleteTour
	);

// /tours/top-5-cheap
router
	.route('/top-5-cheap')
	.get(tourController.topFive, tourController.getAllTours);

// /tours/tours-within/233/center/6.5623207226213625,3.2511161415325422/unit/mi
router
	.route('/tours-within/:distance/center/:latlng/unit/:unit')
	.get(tourController.getToursWithin);

// /tours/distances/:latlng/unit/:unit
router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

// /tours/stats | /tours/plans/2024
router.route('/stats').get(tourController.getTourStats);
router
	.route('/plans/:year')
	.get(
		authController.protect,
		authController.restrictTo('admin', 'lead-guide', 'guide'),
		tourController.getPlans
	);

// /tours/:tourId/reviews
router.use('/:tourId/reviews', reviewRouter);

module.exports = router;
