const GET_PORTFOLIO = "portfolio/getPortfolio";
const LOAD_PRICES = "portfolio/loadPortfolioPrices";
const CLEAR_PORTFOLIO = "portfolio/clearPortfolio";

const getPortfolio = (data) => {
  return {
    type: GET_PORTFOLIO,
    payload: data,
  };
};

const clearPortfolio = () => {
  return {
    type: CLEAR_PORTFOLIO,
  }
}

export const thunkClearPortfolio = () => async (dispatch) => {
  // console.log('IN THUNK CLEAR PORTFOLIO');
  await dispatch(clearPortfolio());
  return {"message": "success"}

}

export const loadPortfolio = (userId) => async (dispatch) => {
  try {
    const response = await fetch(`/api/${userId}/stocks`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: 'Failed to load portfolio',
      }));
      throw new Error(errorData.error || 'Failed to load portfolio');
    }
    const data = await response.json();
    // console.log('     DATA FROM LOAD PORTFOLIO ==>    ', data);
    dispatch(getPortfolio(data));
    return data;
  } catch (error) {
    console.error('Portfolio load error:', error);
    // Optionally dispatch an error action here to display to the user
    return null;
  }
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
    case CLEAR_PORTFOLIO:
      return { ...state, ...initialState };
    case LOAD_PRICES:{
      let tickersArray = action.payload.tickers;
      // shares
      let portfolioSum = 0;

      tickersArray.forEach(ticker => {
        portfolioSum += ticker.shares_owned * ticker.stock_info.currentPrice

      });

      return {
        ...state,
        "livePortfolioValue": Number(portfolioSum.toFixed(2))
      }
       }
    default:
      return state;
  }
};
export default portfolioReducer;
