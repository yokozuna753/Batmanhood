// Action Types
const SET_STOCK_DETAILS = 'stocks/SET_STOCK_DETAILS';
const SET_LOADING = 'stocks/SET_LOADING';
const SET_ERROR = 'stocks/SET_ERROR';
const SET_TRADE_SUCCESS = 'stocks/SET_TRADE_SUCCESS';
const SET_TRADE_ERROR = 'stocks/SET_TRADE_ERROR';
const SET_TRADE_LOADING = 'stocks/SET_TRADE_LOADING';

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

const setTradeLoading = (isLoading) => ({
  type: SET_TRADE_LOADING,
  payload: isLoading
});

const getCsrfToken = () => {
  return document.cookie.split('; ').find(row => row.startsWith('csrf_token='))?.split('=')[1];
};

// Thunk Actions
export const getStockDetails = (stockId) => async (dispatch) => {
  dispatch(setLoading(true));
  dispatch(setError(null));
  
  try {
    const csrf_token = getCsrfToken();
    const response = await fetch(`/api/stock_details/${stockId}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrf_token || '',
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch stock details');
    }
    
    const stockData = await response.json();
    
    if (!stockData.ticker || typeof stockData.regularMarketPrice === 'undefined') {
      throw new Error('Invalid stock data received');
    }
    
    dispatch(setStockDetails(stockData));
    return true;
  } catch (err) {
    console.error('Stock details error:', err);
    dispatch(setError(err.message));
    return false;
  } finally {
    dispatch(setLoading(false));
  }
};

export const executeTrade = (stockId, tradeData) => async (dispatch) => {
  dispatch(setTradeLoading(true));
  dispatch(setTradeError(null));
  dispatch(setTradeSuccess(null));

  try {
      const requestId = Date.now().toString();
      const csrf_token = getCsrfToken();
      
      const response = await fetch(`/api/stock_details/${stockId}/trade`, {
          method: 'POST',
          credentials: 'include',  
          headers: {
              'Content-Type': 'application/json',
              'X-CSRF-Token': csrf_token,
              'X-Request-ID': requestId
          },
          body: JSON.stringify(tradeData),
      });

      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Trade failed');
      }
      
      const data = await response.json();
      dispatch(setTradeSuccess(
          `Transaction successful! ${
              tradeData.buy_in === 'Shares' 
                  ? `${data.shares_traded.toFixed(2)} shares at $${data.price.toFixed(2)}` 
                  : `$${data.total_value.toFixed(2)} worth of shares`
          }`
      ));

      await dispatch(getStockDetails(stockId));
      return true;
  } catch (err) {
      console.error('Trade execution error:', err);
      dispatch(setTradeError(err.message));
      return false;
  } finally {
      dispatch(setTradeLoading(false));
  }
};

// Initial State
const initialState = {
  currentStock: null,
  loading: false,
  error: null,
  tradeSuccess: null,
  tradeError: null,
  tradeLoading: false
};

// Reducer
export default function stocksReducer(state = initialState, action) {
  switch (action.type) {
    case SET_STOCK_DETAILS:
      return {
        ...state,
        currentStock: action.payload,
        error: null
      };
    
    case SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
    
    case SET_ERROR:
      return {
        ...state,
        error: action.payload,
        currentStock: state.currentStock
      };
    
    case SET_TRADE_SUCCESS:
      return {
        ...state,
        tradeSuccess: action.payload,
        tradeError: null
      };
    
    case SET_TRADE_ERROR:
      return {
        ...state,
        tradeError: action.payload,
        tradeSuccess: null
      };

    case SET_TRADE_LOADING:
      return {
        ...state,
        tradeLoading: action.payload
      };
    
    default:
      return state;
  }
}