export const hideAlert = () => {
  const el = document.querySelector('.alert');

  if (el) el.parentElement.removeChild(el);
};

export const showAlert = (type, message, ms = 7) => {
  hideAlert();
  const div = document.createElement('div');

  div.classList.add(
    'alert',
    `alert--${type === 'error' ? 'error' : 'success'}`
  );
  div.textContent = message;

  document.querySelector('body').insertAdjacentElement('afterbegin', div);

  setTimeout(() => {
    hideAlert();
  }, ms * 1000);
};
