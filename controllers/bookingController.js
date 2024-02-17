const stripe = require('stripe')(process.env.PAYMENT_SECRET_KEY);
const Tour = require('../models/Tour');
const User = require('../models/User');
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
		success_url: `${req.protocol}://${req.get('host')}/my-tours`,
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
						images: [
							`${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`,
						],
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

exports.paid = catchAsync(async (req, res, next) => {
	const { id } = req.user;
	const { tourId } = req.params;

	const booking = await Booking.findOne({ tour: tourId, user: id });
	if (!booking || !booking.paid)
		return next(
			new AppError('You must book the tour before you can write a review', 403)
		);

	next();
});

const createBookingCheckout = async session => {
	const tour = session.client_reference_id;
	const user = (await User.findOne({ email: session.customer_email })).id;
	const price = session.line_items[0].price_data.unit_amount / 100;
	await Booking.create({ tour, user, price });
};

exports.checkout = catchAsync(async (req, res, next) => {
	const sig = req.headers['stripe-signature'];
	let event;
	try {
		event = stripe.webhooks.constructEvent(
			req.body,
			sig,
			process.env.PAYMENT_WEBHOOK_KEY
		);
	} catch (err) {
		res.status(400).send(`Webhook Error: ${err.message}`);
	}

	// Handle the event
	console.log(`Unhandled event type ${event.type}`);
	if (event.type === 'checkout.session.completed')
		createBookingCheckout(event.data.object);
	res.status(200).json({ received: true });
});

exports.getAllBookings = factory.getAll(Booking, 'booking');
exports.getBooking = factory.getOne(Booking, 'booking');
exports.createBooking = factory.createOne(Booking, 'booking');
exports.updateBooking = factory.updateOne(Booking, 'booking');
exports.deleteBooking = factory.deleteOne(Booking, 'booking');
