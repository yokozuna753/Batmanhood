const GET_PORTFOLIO = "portfolio/getPortfolio";

const getPortfolio = (data) => {
  return {
    type: GET_PORTFOLIO,
    payload: data,
  };
};

export const loadPortfolio = (userId) => async (dispatch) => {
  const response = await fetch(`/api/${userId}/stocks`);
  const data = await response.json();
  // if(response.ok){

  // }
  console.log("DATA ==>    ", data);
//   dispatch(getPortfolio(data));
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
export default portfolioReducer
