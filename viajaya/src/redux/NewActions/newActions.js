import axios from "axios";
import { toast } from "react-toastify";
import {
  INFO_USERS,
  LOGIN_SUCCESS,
  LOGOUT,
  LOGIN_FAIL,
  VERIFY_TOKEN_SUCCESS,
  VERIFY_TOKEN_FAIL,
  UPDATE_USER,
  DELETE_USER_BY_ID,
  FETCH_PACKS_REQUEST,
  FETCH_PACKS_SUCCESS,
  FETCH_PACKS_FAILURE,
  FETCH_PACK_REQUEST,
  FETCH_PACK_SUCCESS,
  FETCH_PACK_FAILURE,
  CREATE_PACK_REQUEST,
  CREATE_PACK_SUCCESS,
  CREATE_PACK_FAILURE,
  UPDATE_PACK_REQUEST,
  UPDATE_PACK_SUCCESS,
  UPDATE_PACK_FAILURE,
  DELETE_PACK_REQUEST,
  DELETE_PACK_SUCCESS,
  DELETE_PACK_FAILURE,
  FETCH_YAPAYA_REQUEST,
  FETCH_YAPAYA_SUCCESS,
  FETCH_YAPAYA_FAILURE,
  FETCH_ACTIVE_REQUEST,
  FETCH_ACTIVE_SUCCESS,
  FETCH_ACTIVE_FAILURE,
  FETCH_VIDEOS_REQUEST,
  FETCH_VIDEOS_SUCCESS,
  FETCH_VIDEOS_FAILURE,
  REMOVE_VIDEO,
  FETCH_CAPACITACIONES_REQUEST,
  FETCH_CAPACITACIONES_SUCCESS,
  FETCH_CAPACITACIONES_FAILURE,
  REMOVE_CAPACITACION,
  CREATE_ORDER_SUCCESS,
  CREATE_ORDER_FAIL,
  GET_ORDERS_SUCCESS,
  GET_ORDERS_FAIL,
  GET_ORDER_SUCCESS,
  GET_ORDER_FAIL,
  UPDATE_ORDER_SUCCESS,
  UPDATE_ORDER_FAIL,
  DELETE_ORDER_SUCCESS,
  DELETE_ORDER_FAIL,
} from "./NewActions-Types";


// ✅ ACTUALIZADO: Usar Railway en producción
const BASE_URL = 'https://viajaya-production.up.railway.app';
//const BASE_URL = 'http://localhost:3001' // Para desarrollo local


export const loginUser = (email, password) => async (dispatch) => {
  try {
    const response = await axios.post(`${BASE_URL}/auth`, { email, password });
    const { token, id, message } = response.data;

    if (message) {
      // Almacena el token en localStorage
      localStorage.setItem("token", token);

      // Dispara la acción de inicio de sesión exitoso
      dispatch({
        type: LOGIN_SUCCESS,
        payload: { token, id },
      });
    } else {
      // Dispara una acción de error en caso de fallo de autenticación
      dispatch({
        type: LOGIN_FAIL,
        payload: "Credenciales incorrectas",
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
  localStorage.removeItem("token");

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
    dispatch(infoUsers());
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
  dispatch({ type: FETCH_YAPAYA_REQUEST });
  try {
    const response = await axios.get(`${BASE_URL}/pack/${isYapaya}`);

    dispatch({ type: FETCH_YAPAYA_SUCCESS, payload: response.data });
  } catch (error) {
    console.error("Fetch error:", error); // Muestra el error en la consola
    dispatch({ type: FETCH_YAPAYA_FAILURE, payload: error.message });
  }
};

export const fetchPackActive = (isActive) => async (dispatch) => {
  dispatch({ type: FETCH_ACTIVE_REQUEST });
  try {
    const response = await axios.get(`${BASE_URL}/pack/${isActive}`);

    dispatch({ type: FETCH_ACTIVE_SUCCESS, payload: response.data });
  } catch (error) {
    console.error("Fetch error:", error); // Muestra el error en la consola
    dispatch({ type: FETCH_ACTIVE_FAILURE, payload: error.message });
  }
};

export const fetchPack = (id) => async (dispatch) => {
  dispatch({ type: FETCH_PACK_REQUEST });
  try {
    const response = await axios.get(`${BASE_URL}/pack/${id}`);

    dispatch({ type: FETCH_PACK_SUCCESS, payload: response.data });
  } catch (error) {
    console.error("Fetch error:", error); // Muestra el error en la consola
    dispatch({ type: FETCH_PACK_FAILURE, payload: error.message });
  }
};

export const createPack = (pack) => async (dispatch) => {
  dispatch({ type: CREATE_PACK_REQUEST });
  try {
    await axios.post(`${BASE_URL}/pack`, pack, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    dispatch({ type: CREATE_PACK_SUCCESS });
    // Optionally, you can fetch packs again or handle success
  } catch (error) {
    console.error("Error al crear el pack:", error.message);
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

export const fetchVideos = () => {
  return async (dispatch) => {
    dispatch({ type: FETCH_VIDEOS_REQUEST });

    try {
      const response = await axios.get(`${BASE_URL}/insta/videosI`);
      console.log("Respuesta de la API:", response.data); // Verificar la respuesta

      const data = response.data.data; // Esto asume que la data viene en un array como "data"
      console.log(data);
      // Comprobar si data tiene elementos
      if (!data || data.length === 0) {
        console.error("No hay videos disponibles en la respuesta.");
      }

      // Limpiar las URLs eliminando las comillas dobles
      const cleanedData = data.map((video) => ({
        id: video.id,
        url: video.url,
      }));

      dispatch({ type: FETCH_VIDEOS_SUCCESS, payload: cleanedData });
    } catch (error) {
      dispatch({ type: FETCH_VIDEOS_FAILURE, payload: error.message });
    }
  };
};

export const removeVideo = (id) => async (dispatch) => {
  try {
    await axios.delete(`${BASE_URL}/insta/videosI/${id}`);
    dispatch({ type: REMOVE_VIDEO, payload: id });
  } catch (error) {
    console.error("Error eliminando video:", error);
    // Manejar error aquí (opcional)
  }
};

export const fetchCapacitaciones = () => {
  return async (dispatch) => {
    dispatch({ type: FETCH_CAPACITACIONES_REQUEST });

    try {
      const response = await axios.get(`${BASE_URL}/asesores/capacitacion`);
      console.log("Respuesta de la API:", response.data); // Verificar la respuesta

      const data = response.data.data; // Esto asume que la data viene en un array como "data"
      console.log(data);
      // Comprobar si data tiene elementos
      if (!data || data.length === 0) {
        console.error("No hay capacitaciones disponibles en la respuesta.");
      }

      // Limpiar las URLs eliminando las comillas dobles
      const cleanedData = data.map((capacitacion) => ({
        id: capacitacion.id,
        url: capacitacion.url,
      }));

      dispatch({ type: FETCH_CAPACITACIONES_SUCCESS, payload: cleanedData });
    } catch (error) {
      dispatch({ type: FETCH_CAPACITACIONES_FAILURE, payload: error.message });
    }
  };
};

export const removeCapacitacion = (id) => async (dispatch) => {
  try {
    await axios.delete(`${BASE_URL}/asesores/capacitacion/${id}`);
    dispatch({ type: REMOVE_CAPACITACION, payload: id });
  } catch (error) {
    console.error("Error eliminando capacitación:", error);
    // Manejar error aquí (opcional)
  }
};

export const createOrderReservation = (orderData) => async (dispatch) => {
  try {
    const { data } = await axios.post(`${BASE_URL}/order`, orderData);
    dispatch({
      type: CREATE_ORDER_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: CREATE_ORDER_FAIL,
      payload: error.response ? error.response.data.message : error.message,
    });
  }
};

// Acción para obtener todas las órdenes
export const getAllOrders =
  (userId = null) =>
  async (dispatch) => {
    try {
      const url = userId
        ? `${BASE_URL}/order/user/${userId}`
        : `${BASE_URL}/order`;

      const { data } = await axios.get(url);

      dispatch({
        type: GET_ORDERS_SUCCESS,
        payload: data,
      });
    } catch (error) {
      dispatch({
        type: GET_ORDERS_FAIL,
        payload: error.response ? error.response.data.message : error.message,
      });
    }
  };

// Acción para obtener una orden por ID
export const getOrderById = (id) => async (dispatch) => {
  try {
    const { data } = await axios.get(`${BASE_URL}/order/${id}`);
    dispatch({
      type: GET_ORDER_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: GET_ORDER_FAIL,
      payload: error.response ? error.response.data.message : error.message,
    });
  }
};

// Acción para actualizar una orden
export const updateOrder = (id, orderData) => async (dispatch) => {
  try {
    const { data } = await axios.put(`${BASE_URL}/order/${id}`, orderData);
    dispatch({
      type: UPDATE_ORDER_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: UPDATE_ORDER_FAIL,
      payload: error.response ? error.response.data.message : error.message,
    });
  }
};

export const deleteOrder = (idOrder) => async (dispatch) => {
  try {
    await axios.delete(`${BASE_URL}/order/${idOrder}`); // Usa idOrder aquí
    console.log("Dispatching DELETE_ORDER_SUCCESS with ID:", idOrder); // Log the action dispatch
    dispatch({
      type: DELETE_ORDER_SUCCESS,
      payload: idOrder, // Asegúrate de que esto es idOrder
    });
  } catch (error) {
    console.error("Error deleting order:", error); // Log the error
    dispatch({
      type: DELETE_ORDER_FAIL,
      payload: error.response ? error.response.data.message : error.message,
    });
    toast.error(
      "Error al cancelar la reserva: " +
        (error.response ? error.response.data.message : error.message),
      { position: "top-right" }
    );
  }
};
