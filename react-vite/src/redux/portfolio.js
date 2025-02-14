const GET_PORTFOLIO = "portfolio/getPortfolio";
const LOAD_PRICES = "portfolio/loadPortfolioPrices";

const getPortfolio = (data) => {
  return {
    type: GET_PORTFOLIO,
    payload: data,
  };
};

export const loadPortfolio = (userId) => async (dispatch) => {
  const response = await fetch(`/api/${userId}/stocks`);
  const data = await response.json();
  if (response.ok) {
    await dispatch(getPortfolio(data));
  }
  return response;
};

const loadPortfolioPrices = (data) => {
  return {
    type: LOAD_PRICES,
    payload: data,
  };
};

export const fetchPortfolioPrices = (userId) => async (dispatch) => {
  const response = await fetch(`/api/${userId}/stocks`);
  const data = await response.json();
  if (response.ok) {
    await dispatch(getPortfolio(data));
  }
  return response;
};

let initialState = {};

export const portfolioReducer = (state = initialState, action) => {
  switch (action.type) {
    case GET_PORTFOLIO:
      return { ...state, ...action.payload };
    case LOAD_PRICES:
      return {} //! WORKING ON LOADING ONLY UPDATED PORTFOLIO PRICES
    default:
      return state;
  }
};
export default portfolioReducer;
