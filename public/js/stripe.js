import showAlert from './alert';
import catchAsync from '../../utils/catchAsync';

// this function will make a request once the user click the button
export const checkoutPayment = catchAsync(async (tourId) => {
  try {
    const stripe = Stripe(
      'pk_test_51QEBjYBu51br3YiuUVtbEpOEOtjIeOv1ZyCzsGv2avO8q0l4THzt4wfkSlhg7j1PZmvH28WNNpzjTgxUVESOoZLU00iGcLi7p8'
    );

    // 1. fetch session based on id
    const session = await fetch(`/api/v1/bookings/checkout-session/${tourId}`);

    const sessionJson = await session.json();

    // 2. redirect user to Sripe's secure checkout page
    // info: here inside 'redirectToCheckout' we need to pass sessionId, this redirect the user to the checkout page based on that session
    // review: "Stripe’s hosted checkout page simplifies compliance with security and regulatory standards (like PCI-DSS), allowing you to process payments without handling sensitive data on your own server."
    await stripe.redirectToCheckout({
      sessionId: sessionJson.data.session.id
    });
  } catch (err) {
    showAlert('error', err);
  }
});
