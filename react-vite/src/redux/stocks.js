// src/redux/stocks.js

// Action Types
const SET_STOCK_DETAILS = 'stocks/SET_STOCK_DETAILS';
const SET_LOADING = 'stocks/SET_LOADING';
const SET_ERROR = 'stocks/SET_ERROR';
const SET_TRADE_SUCCESS = 'stocks/SET_TRADE_SUCCESS';
const SET_TRADE_ERROR = 'stocks/SET_TRADE_ERROR';

// Action Creators
const setStockDetails = (details) => ({
  type: SET_STOCK_DETAILS,
  payload: details
});

const setLoading = (isLoading) => ({
  type: SET_LOADING,
  payload: isLoading
});

const setError = (error) => ({
  type: SET_ERROR,
  payload: error
});

const setTradeSuccess = (message) => ({
  type: SET_TRADE_SUCCESS,
  payload: message
});

const setTradeError = (error) => ({
  type: SET_TRADE_ERROR,
  payload: error
});

// Thunk Actions
export const getStockDetails = (stockId) => async (dispatch) => {
  dispatch(setLoading(true));
  dispatch(setError(null));
  
  try {
    const response = await fetch(`/api/stocks/${stockId}`);
    if (!response.ok) throw new Error('Failed to fetch stock details');
    
    const data = await response.json();
    dispatch(setStockDetails(data));
  } catch (err) {
    dispatch(setError(err.message));
  } finally {
    dispatch(setLoading(false));
  }
};

export const executeTrade = (stockId, tradeData) => async (dispatch) => {
  dispatch(setTradeError(null));
  dispatch(setTradeSuccess(null));

  try {
    const response = await fetch(`/api/stocks/${stockId}/trade`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CSRF-Token': document.cookie.match(/csrf_token=([\w-]+)/)?.[1],
      },
      body: JSON.stringify(tradeData),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Trade failed');

    dispatch(setTradeSuccess('Trade executed successfully!'));
    // Refresh stock details after successful trade
    dispatch(getStockDetails(stockId));
  } catch (err) {
    dispatch(setTradeError(err.message));
  }
};

// Initial State
const initialState = {
  currentStock: null,
  loading: false,
  error: null,
  tradeSuccess: null,
  tradeError: null
};

// Reducer
export default function stocksReducer(state = initialState, action) {
  switch (action.type) {
    case SET_STOCK_DETAILS:
      return {
        ...state,
        currentStock: action.payload
      };
    
    case SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
    
    case SET_ERROR:
      return {
        ...state,
        error: action.payload
      };
    
    case SET_TRADE_SUCCESS:
      return {
        ...state,
        tradeSuccess: action.payload
      };
    
    case SET_TRADE_ERROR:
      return {
        ...state,
        tradeError: action.payload
      };
    
    default:
      return state;
  }
}