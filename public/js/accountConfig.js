import { showAlert } from './alert';

export const login = async (email, password) => {
  try {
    let data;
    const res = await fetch('/api/v1/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password
      })
    });

    if (res.ok) {
      data = await res.json();
      if (data.status === 'success') {
        showAlert('success', 'Loged successfully');
        window.setTimeout(() => {
          location.assign('/');
        }, 1000);
      }
    } else {
      showAlert('error', 'Login or password incorect. Try Again.');
    }
  } catch (err) {
    showAlert('error', err.message);
  }
};
export const logout = async () => {
  try {
    const res = await fetch('/api/v1/users/logout', {
      method: 'GET'
    });

    if (res.ok) {
      showAlert('success', 'Logout successful');
      window.location.reload(true);
      location.assign('/');
    } else {
      showAlert('error', `${err.message}: ${err.status}`);
    }
  } catch (err) {
    showAlert('error', ('Error during logout:', err.message));
  }
};
export const signup = async (name, email, password, passwordConfirm) => {
  try {
    let data;
    const res = await fetch('/api/v1/users/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        email,
        password,
        passwordConfirm
      })
    });
    data = await res.json();
    if (res.ok) {
      if (data.status === 'success') {
        showAlert('success', 'Account created successfully');
        window.setTimeout(() => {
          location.assign('/');
        }, 1000);
      }
    } else {
      showAlert('error', `${data.message}`);
    }
  } catch (err) {
    showAlert('error', err.message);
  }
};
