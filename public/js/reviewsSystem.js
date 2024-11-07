import { showAlert } from './alert';

export const createUpdateReview = async (type, data, id) => {
  try {
    const options = {
      method: type === 'create' ? 'POST' : 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    };
    const url = `/api/v1/reviews/${id}`;

    const response = await fetch(url, options);
    const responseJson = await response.json();

    if (response.ok) {
      return showAlert('success', 'Thanks for your review.');
    } else {
      throw new Error(responseJson.message);
    }
  } catch (err) {
    showAlert('error', err);
  }
};
