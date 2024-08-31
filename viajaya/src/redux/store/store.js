// reducer/reducer.js
// store.js
import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import rootReducer from '../reducer/reducer';

// Combina applyMiddleware y la configuración de Redux DevTools en una sola función usando compose
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

// Crea la tienda de Redux sin Redux Persist
export const store = createStore(
  rootReducer,
  composeEnhancers(applyMiddleware(thunk))
);

