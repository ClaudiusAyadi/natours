const stripe = require('stripe')(process.env.PAYMENT_SECRET_KEY);
const Tour = require('../models/Tour');
const Booking = require('../models/Booking');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./factory');

exports.getCheckout = catchAsync(async (req, res, next) => {
	// 1) Get the currently booked store
	const tour = await Tour.findById(req.params.tourId);

	// 2) Create checkout session
	const session = await stripe.checkout.sessions.create({
		mode: 'payment',
		payment_method_types: ['card'],

		// not secure at all
		success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
		cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
		customer_email: req.user.email,
		client_reference_id: req.params.tourId,
		line_items: [
			{
				quantity: 1,
				price_data: {
					currency: 'usd',
					unit_amount: tour.price * 100,
					product_data: {
						name: `${tour.name}  Tour`,
						description: tour.summary,
						images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
					},
				},
			},
		],
	});

	// 3) Create session as response
	res.status(200).json({
		status: 'success',
		session,
	});
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
	// This is only TEMPORARY , because it's not secure
	const { tour, user, price } = req.query;
	if (!tour && !user && !price) return next();
	await Booking.create({ tour, user, price });
	res.redirect(req.originalUrl.split('?')[0]);
});

exports.paid = catchAsync(async (req, res, next) => {
	const { id } = req.user;
	const { tourId } = req.params;
	console.log(id, tourId);

	const booking = await Booking.findOne({ tour: tourId, user: id });
	if (!booking || !booking.paid)
		return next(
			new AppError('You must book the tour before you can write a review', 403)
		);

	next();
});

exports.getAllBookings = factory.getAll(Booking, 'booking');
exports.getBooking = factory.getOne(Booking, 'booking');
exports.createBooking = factory.createOne(Booking, 'booking');
exports.updateBooking = factory.updateOne(Booking, 'booking');
exports.deleteBooking = factory.deleteOne(Booking, 'booking');
