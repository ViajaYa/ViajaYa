
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import { store } from './redux/store/store.js';
import { Provider } from 'react-redux';



// Configuración de Axios
axios.defaults.baseURL = "https://viajaya-mve8.onrender.com";
//axios.defaults.baseURL = "http://localhost:3001";

ReactDOM.createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Provider>
);

