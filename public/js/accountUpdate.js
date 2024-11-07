import { showAlert } from './alert';

export const accountUpdateSettings = async (type, data) => {
  try {
    let options = {};
    const url =
      type === 'password'
        ? '/api/v1/users/updatePassword'
        : '/api/v1/users/updateMe';
    if (type === 'password') {
      options = {
        method: 'PATCH',
        // don't forget for headers, they are important
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      };
    } else {
      options = {
        method: 'PATCH',
        body: data
      };
    }

    const response = await fetch(url, options);
    const resJSON = await response.json();

    if (!response.ok) {
      throw new Error(resJSON.message);
    } else {
      showAlert('success', 'User settings saved.');
    }
  } catch (err) {
    showAlert('error', err);
  }
};
