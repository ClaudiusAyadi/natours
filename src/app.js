const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const compression = require('compression');
const viewRouter = require('./routes/viewRoutes');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const bookingController = require('./controllers/bookingController');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

// Instantiate the express app
const app = express();
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Global Middleware
// 1. Implement CORS
app.use(cors());
app.options('*', cors());

// 2. Static folder
app.use(express.static(path.join(__dirname, '../public')));

// 3. Set security HTTP headers
const securityPolicy = {
	directives: {
		defaultSrc: ["'self'", "'none"],
		fontSrc: ["'self'", 'https:'],
		scriptSrc: ["'self'", "'unsafe-inline"],
		scriptSrcElem: ["'self'", 'https:', 'https://*.cloudflare.com'],
		styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
		connectSrc: ["'self'", 'https:'],
		workerSrc: ["'self'", 'https', 'blob:'],
		frameSrc: ["'self'", 'https', 'https://*.stripe.com'],
	},
};
app.use(helmet.contentSecurityPolicy(securityPolicy));

// 4. Dev logging
// if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// 5. Request Rate limiting
const limiter = rateLimit({
	limit: 100,
	windowMs: 60 * 60 * 1000,
	message: 'Too many requests from this IP, please try again in an hour.',
	validate: { trustProxy: false, xForwardedForHeader: false },
});
app.use('/api', limiter);
app.post(
	'/webhook',
	express.raw({ type: 'application/json' }),
	bookingController.webhookCheckout
);

// 6. Body parser & cookie parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// 7. Data sanitization & params pollution
app.use(mongoSanitize());
app.use(
	hpp({
		whitelist: [
			'duration',
			'maxGroupSize',
			'difficulty',
			'ratingsAverage',
			'ratingsQuantity',
			'price',
		],
	})
);

// 8. Custom logging
app.use((req, res, next) => {
	const date = Date.now();

	res.on('finish', () => {
		const endTime = Date.now();
		const timeTaken = endTime - date;

		const options = {
			month: 'short',
			day: 'numeric',
			hour12: false,
			timeZone: 'Africa/Lagos',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
		};
		const timestamp = new Intl.DateTimeFormat('en-US', options).format(date);
		const icon = res.statusCode < 400 ? '🛈' : '❌';
		const color = res.statusCode < 400 ? '\x1b[32m' : '\x1b[31m'; // Green for success, Red for error
		const resetColor = '\x1b[0m'; // Reset color

		console.info(
			`${timestamp}: ${icon} [${color}${res.statusCode}${resetColor}] ${req.method} ${req.originalUrl} ${timeTaken}ms`
		);
	});

	next();
});

// 9. Compression
app.use(compression());

// 10 Mounting/Routes
app
	.use(viewRouter)
	.use('/api/v1/tours', tourRouter)
	.use('/api/v1/users', userRouter)
	.use('/api/v1/reviews', reviewRouter)
	.use('/api/v1/bookings', bookingRouter)
	.all('*', (req, res, next) => {
		next(
			new AppError(
				`This resource '${req.originalUrl}' cannot be found on this server`,
				404
			)
		);
	})
	.use(globalErrorHandler);

module.exports = app;
