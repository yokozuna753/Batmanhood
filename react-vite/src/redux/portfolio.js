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
  // const data = await response;
  if (response.ok) {
    const data = await response.json(); // Convert response to JSON
    console.log('DATA FROM API:', data); // Log the data here
    dispatch(loadPortfolioPrices(data)); // Dispatch the action with the fetched data
  } else {
    console.error('Failed to fetch portfolio prices:', response.statusText);
  }
};

let initialState = {};

export const portfolioReducer = (state = initialState, action) => {
  switch (action.type) {
    case GET_PORTFOLIO:
      return { ...state, ...action.payload };
    case LOAD_PRICES:{
      let tickersArray = action.payload.tickers;
      let portfolioSum = 0;

      tickersArray.forEach(ticker => {
        console.log('this is ticker ====>', ticker);
      });

      console.log('DATA FROM REDUCER ==>', tickersArray);

      // console.log()

      return {
        ...state,
        // "livePortfolioValue": 
      }
       }
    default:
      return state;
  }
};
export default portfolioReducer;
