const mongoose = require('mongoose');
const Tour = require('./Tour');

const reviewSchema = new mongoose.Schema(
	{
		review: {
			type: String,
			required: [true, 'Review cannot be blank!'],
		},
		rating: {
			type: Number,
			min: 1,
			max: 5,
		},
		tour: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Tour',
			required: [true, 'Review must belong to a tour!'],
		},
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: [true, 'Review must belong to a user!'],
		},
	},
	{
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	},
	{
		timestamps: true,
	}
);

reviewSchema.pre(/^find/, function (next) {
	this.populate({ path: 'user', select: 'name photo' });

	next();
});

reviewSchema.statics.calcAverageRatings = async function (tour) {
	const stats = await this.aggregate([
		{
			$match: { tour },
		},
		{
			$group: {
				_id: '$tour',
				nRating: { $sum: 1 },
				avgRating: { $avg: '$rating' },
			},
		},
	]);

	if (stats.length > 0) {
		await Tour.findByIdAndUpdate(tour, {
			ratingsAverage: stats[0].avgRating,
			ratingsQuantity: stats[0].nRating,
		});
	} else {
		await Tour.findByIdAndUpdate(tour, {
			ratingsAverage: 0,
			ratingsQuantity: 0,
		});
	}
};

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.post('save', function () {
	this.constructor.calcAverageRatings(this.tour);
});

reviewSchema.pre(/^findOneAnd/, async function (next) {
	this.r = await this.findOne().clone(); // @TODO: find a better solution;
	next();
});

reviewSchema.post(/^findOneAnd/, async function () {
	// await this.findOne() does not work here, query has already been executed
	await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
