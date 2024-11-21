const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.getAll = (Model, modelName) =>
	catchAsync(async (req, res, next) => {
		// To allow nested routes for tour reviews
		let filter = {};
		if (req.params.tourId) filter = { tour: req.params.tourId };

		// Execute query
		const features = new APIFeatures(Model.find(filter), req.query)
			.filter()
			.sort()
			.selectFields()
			.paginate()
			.createdOff()
			.updatedOff();

		// const doc = await features.query.explain();
		const doc = await features.query;

		// SEND RESPONSE
		res.status(200).json({
			status: 'success',
			results: doc.length,
			data: {
				[modelName]: doc,
			},
		});
	});

exports.getOne = (Model, modelName, options) =>
	catchAsync(async (req, res, next) => {
		let query = Model.findById(req.params.id);
		if (options) query = query.populate(options);
		const doc = await query;

		if (!doc)
			return next(
				new AppError(
					`No ${modelName} found with the id of '${req.params.id}'`,
					404
				)
			);

		res.status(200).json({
			status: 'success',
			data: {
				[modelName]: doc,
			},
		});
	});

exports.createOne = (Model, modelName) =>
	catchAsync(async (req, res, next) => {
		const doc = await Model.create(req.body);

		res.status(201).json({
			status: 'success',
			data: {
				[modelName]: doc,
			},
		});
	});

exports.updateOne = (Model, modelName) =>
	catchAsync(async (req, res, next) => {
		const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
			new: true,
			runValidators: true,
		});

		if (!doc)
			return next(
				new AppError(
					`No ${modelName} found with the id of '${req.params.id}'`,
					404
				)
			);

		res.status(200).json({
			status: 'success',
			data: {
				[modelName]: doc,
			},
		});
	});

exports.deleteOne = (Model, modelName) =>
	catchAsync(async (req, res, next) => {
		const doc = await Model.findByIdAndDelete(req.params.id);

		if (!doc)
			return next(
				new AppError(
					`No ${modelName} found with the id of '${req.params.id}'`,
					404
				)
			);

		res.status(204).json({
			status: 'success',
			data: {
				[modelName]: null,
			},
		});
	});
