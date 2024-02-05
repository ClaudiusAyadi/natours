/* eslint-disable */
import { loadStripe } from '@stripe/stripe-js';
import axios from 'axios';
import { showAlert } from './alert';

export const bookTour = async tourId => {
	try {
		const stripe = await loadStripe(
			'pk_test_51OdGE5DrjbcrnAybG3fKPw3wOCAuaClwua0p5Zibyty9ySYwth9Mjavu4J53uB6TJzQMD4XKNuMZcGX95gEeJW6D00SWBp4t8n'
		);
		// 1. Get checkout session from api
		const session = await axios(
			`http://127.0.0.1:3000/api/v1/bookings/checkout/${tourId}`
		);

		// 2. Create checkout form and charge card
		await stripe.redirectToCheckout({
			sessionId: session.data.session.id,
		});
	} catch (err) {
		console.log(err);
		showAlert('error', err);
	}
};
