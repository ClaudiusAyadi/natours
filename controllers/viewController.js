const Booking = require('../models/Booking');
const Tour = require('../models/Tour');
const User = require('../models/User');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getOverview = catchAsync(async (req, res) => {
	const tours = await Tour.find();

	res.status(200).render('overview', {
		title: 'All Tours',
		tours,
	});
});

exports.getTour = catchAsync(async (req, res, next) => {
	const tour = await Tour.findOne({ slug: req.params.slug }).populate({
		path: 'reviews',
		fields: 'review rating user',
	});

	if (!tour)
		return next(
			new AppError('No tour found with the id of with that name', 404)
		);
	res.status(200).render('tour', {
		title: `${tour.name} Tour`,
		tour,
	});
});

exports.getLogin = (req, res) => {
	res.status(200).render('login', {
		title: 'Login | Natours',
	});
};

exports.getAccount = (req, res) => {
	res.status(200).render('account', {
		title: 'My account',
	});
};

exports.updateUserData = catchAsync(async (req, res, next) => {
	const updatedUser = await User.findByIdAndUpdate(
		req.user.id,
		{
			name: req.body.name,
			email: req.body.email,
		},
		{
			new: true,
			runValidators: true,
		}
	);

	res.status(200).render('account', {
		title: 'Your account',
		user: updatedUser,
	});
});

exports.getMyTours = catchAsync(async (req, res, next) => {
	// 1. Find all bookings
	const bookings = await Booking.find({ user: req.user.id });

	// 2. Find tours with returned IDs
	const tourIds = bookings.map(booking => booking.tour);
	const tours = await Tour.find({ _id: { $in: tourIds } });

	res.status(200).render('overview', {
		title: 'My Tours',
		tours,
	});
});
