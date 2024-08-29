import axios from 'axios';
import {
    INFO_USERS,
    UPDATE_USER,
    DELETE_USER_BY_ID,
    FETCH_PACKS_REQUEST,    FETCH_PACKS_SUCCESS,    FETCH_PACKS_FAILURE,    
    CREATE_PACK_REQUEST,    CREATE_PACK_SUCCESS,    CREATE_PACK_FAILURE,    
    UPDATE_PACK_REQUEST,    UPDATE_PACK_SUCCESS,    UPDATE_PACK_FAILURE,    
    DELETE_PACK_REQUEST,    DELETE_PACK_SUCCESS,    DELETE_PACK_FAILURE,} from './NewActions-Types';

const BASE_URL = 'http://localhost:3001';
// const BASE_URL = 'https://sunyaweb.onrender.com';

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


