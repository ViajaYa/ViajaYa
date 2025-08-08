import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { store } from './redux/store/store.js';
import { Provider } from 'react-redux';
import validateEnv from './utils/env.js';

// Validar variables de entorno al iniciar
validateEnv();

ReactDOM.createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Provider>
);