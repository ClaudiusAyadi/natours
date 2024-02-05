const AppError = require('../utils/appError');

const handleCastErrorDB = err => {
	const message = `Invalid ${err.path}: '${err.value}'`;
	return new AppError(message, 400);
};

const handleDuplicateErrorDB = err => {
	const message = `Duplicate field value: '${err.keyValue.name}' already exists`;
	return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
	const message = Object.values(err.errors)
		.map(val => {
			if (val.name === 'CastError') return handleCastErrorDB(val).message;
			if (val.name === 'ValidationError')
				return handleValidationErrorDB(val).message;
			return `Invalid ${val.path}: ${val.message}`;
		})
		.join('. ');

	return new AppError(message, 400);
};

const handleJWTError = () =>
	new AppError('Invalid token! Please log in again.', 401);

const handleJWTExpiredError = () =>
	new AppError('Access token has expired! Please login again.', 401);

const sendErrorDev = (err, req, res) => {
	// A. API
	if (req.originalUrl.startsWith('/api'))
		return res.status(err.statusCode).json({
			status: err.status,
			error: err,
			message: err.message,
			stack: err.stack,
		});

	// B. RENDERED WEBSITE
	// 1. Log error to hosting server log (Programming or other unknown errors)
	console.error('ERROR 💣', err);

	// 2. Send error message to client
	return res.status(err.statusCode).render('error', {
		title: 'Something went wrong!',
		msg: err.message,
	});
};

const sendErrorProd = (err, req, res) => {
	// A. API
	if (req.originalUrl.startsWith('/api')) {
		// Operation or trusted errors: send to client
		if (err.isOperational)
			return res.status(err.statusCode).json({
				status: err.status,
				message: err.message,
			});

		// 1. Log error (Programming or other unknown errors)
		console.error('ERROR 💣', err);

		// 2. Send generic message to client
		return res.status(500).json({
			status: 'error',
			message: 'Something went wrong!',
		});
	}
	// B. RENDERED WEBSITE
	if (err.isOperational)
		return res.status(err.statusCode).render('error', {
			title: 'Something went wrong!',
			msg: err.message,
		});

	// 1. Log error (Programming or other unknown errors)
	console.error('ERROR 💣', err);

	// 2. Send generic message to client
	return res.status(500).json({
		status: 'error',
		message: 'Please try again later!',
	});
};

module.exports = (err, req, res, next) => {
	err.statusCode = err.statusCode || 500;
	err.status = err.status || 'error';

	if (process.env.NODE_ENV === 'development') {
		sendErrorDev(err, req, res);
	} else if (process.env.NODE_ENV === 'production') {
		let error = { ...err };
		error.message = err.message;

		if (error.name === 'CastError') error = handleCastErrorDB(error);
		if (error.code === 11000) error = handleDuplicateErrorDB(error);
		if (error.name === 'ValidationError')
			error = handleValidationErrorDB(error);
		if (error.name === 'JsonWebTokenError') error = handleJWTError();
		if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

		sendErrorProd(error, req, res);
	}
};
