const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const compression = require('compression');
const viewRouter = require('./routes/viewRoutes');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

// Instantiate the express app
const app = express();

/**
 * GLOBAL MIDDLEWARES
 */

// Implement CORS
app.use(cors());
app.options('*', cors());
app.enable('trust proxy');

// Set security HTTP headers
app.use(
	helmet.contentSecurityPolicy({
		directives: {
			defaultSrc: ["'self'", 'data:', 'blob:'],
			fontSrc: ["'self'", 'https:', 'data:'],
			scriptSrc: ["'self'", 'unsafe-inline'],
			scriptSrcElem: ["'self'", 'https:', 'https://*.cloudflare.com'],
			styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
			connectSrc: ["'self'", 'data:', 'https:'],
			workerSrc: ["'self'", 'blob:', 'unsafe-inline'],
			frameSrc: ["'self'", 'https', 'https://*.stripe.com'],
		},
	})
);

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Static folder
app.use(express.static(path.join(__dirname, 'public')));

// Dev logging
if (process.env.NODE_ENV === 'development') {
	app.use(morgan('dev'));
}

// Rate limiting
const limiter = rateLimit({
	limit: 100,
	windowMs: 60 * 60 * 1000,
	message: 'Too many requests from this IP, please try again in an hour.',
});
app.use('/api', limiter);

// Body parser & cookie parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// Data sanitization & params pollution
app.use(mongoSanitize());
app.use(xss());
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

// Test middleware
app.use((req, res, next) => {
	req.requestTime = new Date().toISOString();
	next();
});

// Compression
app.use(compression());

// Mounting/Routes
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
