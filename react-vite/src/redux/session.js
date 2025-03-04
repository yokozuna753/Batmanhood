const SET_USER = 'session/setUser';
const REMOVE_USER = 'session/removeUser';
const DELETE_USER = 'session/deleteUser';

const setUser = (user) => ({
  type: SET_USER,
  payload: user
});

const removeUser = () => ({
  type: REMOVE_USER
});

// const deleteUser = () => ({
//   type: DELETE_USER
// })

export const thunkAuthenticate = () => async (dispatch) => {
	const response = await fetch("/api/auth/");
	if (response.ok) {
		const data = await response.json();
		if (data.errors) {
			return;
		}

		dispatch(setUser(data));
	}
};

export const thunkLogin = (credentials) => async (dispatch) => {
  const csrfToken = document.cookie.match(/csrf_token=([^;]+)/)?.[1];  // Get the CSRF token from the cookies

  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrfToken  // Include the CSRF token in the headers
    },
    body: JSON.stringify(credentials),
  });

  if(response.ok) {
    const data = await response.json();
    dispatch(setUser(data));
  } else if (response.status < 500) {
    const errorMessages = await response.json();
    return errorMessages;
  } else {
    return { server: "Something went wrong. Please try again" };
  }
};

export const thunkSignup = (user) => async (dispatch) => {
  const response = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user)
  });

  if(response.ok) {
    const data = await response.json();
    dispatch(setUser(data));
  } else if (response.status < 500) {
    const errorMessages = await response.json();
    return errorMessages
  } else {
    return { server: "Something went wrong. Please try again" }
  }
};

export const thunkLogout = () => async (dispatch) => {
  await fetch("/api/auth/logout");
  dispatch(removeUser());
};


export const thunkDelete = (userId) => async (dispatch) => {
  const response = await fetch(`/api/users/${userId}/delete`);
  // const data = await response.json()
  dispatch(removeUser());
  return response
};



const initialState = { user: null };

function sessionReducer(state = initialState, action) {
  switch (action.type) {
    case SET_USER:
      return { ...state, user: action.payload };
    case REMOVE_USER:
      return { ...state, user: null };
    case DELETE_USER:
      return {...state, user: null}
    default:
      return state;
  }
}

export default sessionReducer;
