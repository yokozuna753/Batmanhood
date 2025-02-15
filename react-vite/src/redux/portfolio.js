const GET_PORTFOLIO = "portfolio/getPortfolio";

const getPortfolio = (data) => {
  return {
    type: GET_PORTFOLIO,
    payload: data,
  };
};

export const loadPortfolio = (userId) => async (dispatch) => {
  try {
    const response = await fetch(`/api/${userId}/stocks`);
    if (!response.ok) {
      throw new Error('Failed to load portfolio');
    }
    const data = await response.json();
    dispatch(getPortfolio(data));
    return data;
  } catch (error) {
    console.error('Portfolio load error:', error);
    return null;
  }
};

let initialState = {};

export const portfolioReducer = (state = initialState, action) => {
  switch (action.type) {
    case GET_PORTFOLIO: 
      return { ...state, ...action.payload };
    default:
      return state;
  }
};
export default portfolioReducer;
