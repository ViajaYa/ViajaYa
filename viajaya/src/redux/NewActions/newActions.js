import axios from 'axios';
import {
    INFO_USERS,LOGIN_SUCCESS,LOGOUT,LOGIN_FAIL,VERIFY_TOKEN_SUCCESS,VERIFY_TOKEN_FAIL,
    UPDATE_USER,
    DELETE_USER_BY_ID,
    FETCH_PACKS_REQUEST,    FETCH_PACKS_SUCCESS,    FETCH_PACKS_FAILURE, 
    FETCH_PACK_REQUEST,     FETCH_PACK_SUCCESS,     FETCH_PACK_FAILURE,    
    CREATE_PACK_REQUEST,    CREATE_PACK_SUCCESS,    CREATE_PACK_FAILURE,    
    UPDATE_PACK_REQUEST,    UPDATE_PACK_SUCCESS,    UPDATE_PACK_FAILURE,    
    DELETE_PACK_REQUEST,    DELETE_PACK_SUCCESS,    DELETE_PACK_FAILURE,
    FETCH_YAPAYA_REQUEST,   FETCH_YAPAYA_SUCCESS,   FETCH_YAPAYA_FAILURE, 
    FETCH_ACTIVE_REQUEST,   FETCH_ACTIVE_SUCCESS,   FETCH_ACTIVE_FAILURE, 
    CREATE_RESERVATION_SUCCESS, CREATE_RESERVATION_FAILURE, FETCH_RESERVATIONS_SUCCESS,
    FETCH_RESERVATIONS_FAILURE, FETCH_USER_RESERVATIONS_SUCCESS,FETCH_USER_RESERVATIONS_FAILURE,
    UPDATE_RESERVATION_SUCCESS, UPDATE_RESERVATION_FAILURE,DELETE_RESERVATION_SUCCESS,
    DELETE_RESERVATION_FAILURE, 


  } from './NewActions-Types';

const BASE_URL = 'http://localhost:3001';
// const BASE_URL = 'https://sunyaweb.onrender.com';

export const loginUser = (email, password) => async (dispatch) => {
  try {
      const response = await axios.post(`${BASE_URL}/auth`, { email, password });
      const { token, id, message } = response.data;

      if (message) {
          // Almacena el token en localStorage
          localStorage.setItem('token', token);

          // Dispara la acción de inicio de sesión exitoso
          dispatch({
              type: LOGIN_SUCCESS,
              payload: { token, id },
          });
      } else {
          // Dispara una acción de error en caso de fallo de autenticación
          dispatch({
              type: LOGIN_FAIL,
              payload: 'Credenciales incorrectas',
          });
      }
  } catch (error) {
      dispatch({
          type: LOGIN_FAIL,
          payload: error.message,
      });
  }
};

// Acción para verificar el token y obtener la información del usuario
export const verifyToken = (token) => async (dispatch) => {
  try {
      const response = await axios.get(`${BASE_URL}/verify/${token}`);
      const user = response.data;

      dispatch({
          type: VERIFY_TOKEN_SUCCESS,
          payload: user,
      });
  } catch (error) {
      dispatch({
          type: VERIFY_TOKEN_FAIL,
          payload: error.message,
      });
  }
};


export const logoutUser = () => (dispatch) => {
  // Elimina el token del almacenamiento local
  localStorage.removeItem('token');

  dispatch({
      type: LOGOUT,
  });
};

export const infoUsers = () => async (dispatch) => {
  try {
    const url = `${BASE_URL}/user`;
    const { data } = await axios.get(url);
    dispatch({ type: INFO_USERS, payload: data });
    return { success: true }; 
  } catch (error) {
    return { success: false, errorMessage: error.message }; 
  }
};

export const updateUser = (userData) => async (dispatch) => {
  try {
    const url = `${BASE_URL}/user/update/${userData.id}`; 
    const { data } = await axios.put(url, userData);
    dispatch({ type: UPDATE_USER, payload: data });
    return { success: true };
  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
};
export const deleteUser = (id /*{ headers }*/) => async (dispatch) => {
  try {
    const url = `${BASE_URL}/user/${id}`;
    await axios.delete(url /*{ headers }*/);

    dispatch({ type: DELETE_USER_BY_ID });
    dispatch(infoUsers())
    return { success: true }; // Indica que la solicitud fue exitosa
  } catch (error) {
    return { success: false, errorMessage: error.message }; 
  }
};
export const fetchPacks = () => async (dispatch) => {
  dispatch({ type: FETCH_PACKS_REQUEST });
  try {
      const response = await axios.get(`${BASE_URL}/pack`);
      dispatch({ type: FETCH_PACKS_SUCCESS, payload: response.data });
  } catch (error) {
      dispatch({ type: FETCH_PACKS_FAILURE, payload: error.message });
  }
};

export const fetchYapaya = (isYapaya) => async (dispatch) => {
  console.log('Fetching pack with id:', isYapaya); // Para verificar si se despacha la acción
  dispatch({ type: FETCH_YAPAYA_REQUEST });
  try {
    const response = await axios.get(`${BASE_URL}/pack/${isYapaya}`);
    console.log('Fetched data:', response.data); // Verifica la respuesta del servidor
    dispatch({ type: FETCH_YAPAYA_SUCCESS, payload: response.data });
  } catch (error) {
    console.error('Fetch error:', error); // Muestra el error en la consola
    dispatch({ type: FETCH_YAPAYA_FAILURE, payload: error.message });
  }
};

export const fetchPackActive = (isActive) => async (dispatch) => {
  console.log('Fetching pack with id:', isActive); // Para verificar si se despacha la acción
  dispatch({ type: FETCH_ACTIVE_REQUEST });
  try {
    const response = await axios.get(`${BASE_URL}/pack/${isActive}`);
    console.log('Fetched data:', response.data); // Verifica la respuesta del servidor
    dispatch({ type: FETCH_ACTIVE_SUCCESS, payload: response.data });
  } catch (error) {
    console.error('Fetch error:', error); // Muestra el error en la consola
    dispatch({ type: FETCH_ACTIVE_FAILURE, payload: error.message });
  }
};

export const fetchPack = (id) => async (dispatch) => {
  console.log('Fetching pack with id:', id); // Para verificar si se despacha la acción
  dispatch({ type: FETCH_PACK_REQUEST });
  try {
    const response = await axios.get(`${BASE_URL}/pack/${id}`);
    console.log('Fetched data:', response.data); // Verifica la respuesta del servidor
    dispatch({ type: FETCH_PACK_SUCCESS, payload: response.data });
  } catch (error) {
    console.error('Fetch error:', error); // Muestra el error en la consola
    dispatch({ type: FETCH_PACK_FAILURE, payload: error.message });
  }
};


export const createPack = (pack) => async (dispatch) => {
  dispatch({ type: CREATE_PACK_REQUEST });
  try {
    await axios.post(`${BASE_URL}/pack`, pack, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    dispatch({ type: CREATE_PACK_SUCCESS });
    // Optionally, you can fetch packs again or handle success
  } catch (error) {
    console.error('Error al crear el pack:', error.message);
    dispatch({ type: CREATE_PACK_FAILURE, payload: error.message });
  }
};



export const updatePack = (pack) => async (dispatch) => {
  dispatch({ type: UPDATE_PACK_REQUEST });
  try {
      await axios.put(`${BASE_URL}/pack/${pack.id}`, pack);
      dispatch({ type: UPDATE_PACK_SUCCESS });
      // Optionally, you can fetch packs again or handle success
  } catch (error) {
      dispatch({ type: UPDATE_PACK_FAILURE, payload: error.message });
  }
};

export const deletePack = (id) => async (dispatch) => {
  dispatch({ type: DELETE_PACK_REQUEST });
  try {
      await axios.delete(`${BASE_URL}/pack/${id}`);
      dispatch({ type: DELETE_PACK_SUCCESS, payload: id });
  } catch (error) {
      dispatch({ type: DELETE_PACK_FAILURE, payload: error.message });
  }
};

// Acción para crear una nueva reserva
export const createReservation = (reservationData) => async (dispatch) => {
  try {
    const response = await fetch(`${BASE_URL}/reservation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reservationData),
    });

    if (!response.ok) {
      throw new Error('Failed to create reservation');
    }

    const data = await response.json();
    dispatch({
      type: 'CREATE_RESERVATION_SUCCESS',
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: 'CREATE_RESERVATION_FAILURE',
      payload: error.message,
    });
  }
};

// Acción para obtener todas las reservas
export const fetchReservations = () => async (dispatch) => {
  try {
    const response = await axios.get(`${BASE_URL}/reservations`);
    dispatch({ type: FETCH_RESERVATIONS_SUCCESS, payload: response.data });
  } catch (error) {
    dispatch({ type: FETCH_RESERVATIONS_FAILURE, payload: error.message });
  }
};

// Acción para obtener reservas de un usuario específico
export const fetchUserReservations = (id) => async (dispatch) => {
  try {
    const response = await axios.get(`${BASE_URL}/reservations/user/${id}`);
    dispatch({ type: FETCH_USER_RESERVATIONS_SUCCESS, payload: response.data });
  } catch (error) {
    dispatch({ type: FETCH_USER_RESERVATIONS_FAILURE, payload: error.message });
  }
};

// Acción para actualizar una reserva
export const updateReservation = (id, status) => async (dispatch) => {
  try {
    const response = await axios.put(`${BASE_URL}/reservations/${id}`, { status });
    dispatch({ type: UPDATE_RESERVATION_SUCCESS, payload: response.data });
  } catch (error) {
    dispatch({ type: UPDATE_RESERVATION_FAILURE, payload: error.message });
  }
};

// Acción para eliminar una reserva
export const deleteReservation = (id) => async (dispatch) => {
  try {
    await axios.delete(`${BASE_URL}/reservations/${id}`);
    dispatch({ type: DELETE_RESERVATION_SUCCESS, payload: id });
  } catch (error) {
    dispatch({ type: DELETE_RESERVATION_FAILURE, payload: error.message });
  }
};

