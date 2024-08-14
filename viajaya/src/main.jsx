import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import axios from "axios"
import store from './redux/store/store';
import { Provider } from 'react-redux';

axios.defaults.baseURL = "https://viajayabacktest.onrender.com"
// axios.defaults.baseURL = "https://viajaya.onrender.com"
// axios.defaults.baseURL = "http://localhost:3001"


ReactDOM.createRoot(document.getElementById('root')).render(
    <Provider store={store}>
    <BrowserRouter>
    <App />
    </BrowserRouter>
    </Provider>,
)
