import {
  SET_USER,
  FIND_PAQUETES,
  SET_PAQUETES,
  SET_USERS,
  FIND_USERS,
  FIND_CLASS,
  SET_CLASS,
  SET_PAGINA,
  FILTER_PACKS,
  FILTER_PACKSCHARS,
  FILTER_PACKSTITLE,
  DATA_PAY,
} from "../actions/actions-types";

import {
  GET_POPUP_REQUEST,
  GET_POPUP_SUCCESS,
  GET_POPUP_FAIL,
  POST_POPUP_REQUEST,
  POST_POPUP_SUCCESS,
  POST_POPUP_FAIL,
  PUT_POPUP_REQUEST,
  PUT_POPUP_SUCCESS,
  PUT_POPUP_FAIL,
  USER_REGISTER_REQUEST,
  USER_REGISTER_SUCCESS,
  USER_REGISTER_FAIL,
} from "../actions/actions-types";

import {
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
  CREATE_RESERVATION_SUCCESS,
  CREATE_RESERVATION_FAILURE,
  FETCH_RESERVATIONS_SUCCESS,
  FETCH_RESERVATIONS_FAILURE,
  FETCH_USER_RESERVATIONS_SUCCESS,
  FETCH_USER_RESERVATIONS_FAILURE,
  UPDATE_RESERVATION_SUCCESS,
  UPDATE_RESERVATION_FAILURE,
  DELETE_RESERVATION_SUCCESS,
  DELETE_RESERVATION_FAILURE,
  LOGIN_SUCCESS,
  LOGOUT,
  LOGIN_FAIL,
  VERIFY_TOKEN_SUCCESS,
  VERIFY_TOKEN_FAIL,
  FETCH_VIDEOS_REQUEST,
  FETCH_VIDEOS_SUCCESS,
  FETCH_VIDEOS_FAILURE,
  REMOVE_VIDEO,
  INFO_USERS,
} from "../NewActions/NewActions-Types";

const perPage = 8;

const initialState = {
  user: {},
  pagina: 1,
  infoUsers: [],
  paquetes: [],
  paquetesOrigin: [],
  users: [],
  usersOrigin: [],
  clases: [],
  clasesOrigin: [],
  maxPagesPacks: null,
  maxPagesUser: null,
  maxPagesClass: null,
  filter: "all",
  isActive: false,
  isYapaya: false,
  pay: {},
  word: "",
  popup: null,
  packs: [],
  pack: {},
  reservations: [],
  userReservations: [],
  token: null,
  loading: false,
  error: null,
  videos: [],
};
const rootReducer = (state = initialState, action) => {
  switch (action.type) {
    case LOGIN_SUCCESS:
      return {
          ...state,
          token: action.payload.token,
          id: action.payload.id,
          error: null,
      };
  case LOGIN_FAIL:
      return {
          ...state,
          token: null,
          id: null,
          error: action.payload,
      };
  case VERIFY_TOKEN_SUCCESS:
      return {
          ...state,
          user: action.payload,
      };
  case VERIFY_TOKEN_FAIL:
      return {
          ...state,
          error: action.payload,
      };
  case LOGOUT:
      return initialState;
    

    case SET_USER: {
      return {
        ...state,
        user: action.payload,
      };
    }
    case DATA_PAY: {
      return {
        ...state,
        pay: action.payload,
      };
    }
    case FILTER_PACKSTITLE: {
      if (action.payload.length == 0) {
        return {
          ...state,
          paquetes: state.paquetesOrigin,
          word: action.payload,
        };
      } else {
        return {
          ...state,
          word: action.payload,
          paquetes: state.paquetesOrigin.filter((p) =>
            p.title.toLowerCase().includes(action.payload.toLowerCase())
          ),
        };
      }
    }
    case FILTER_PACKSCHARS: {
      if (action.payload.length == 0) {
        return {
          ...state,
          paquetes: state.paquetesOrigin,
        };
      }
      if (action.payload.length == 1) {
        return {
          ...state,
          paquetes: state.paquetesOrigin.filter((p) =>
            p.chars.map((c) => c.name).includes(action.payload[0])
          ),
        };
      }
      if (action.payload.length == 2) {
        return {
          ...state,
          paquetes: state.paquetesOrigin.filter(
            (p) =>
              p.chars.map((c) => c.name).includes(action.payload[0]) &&
              p.chars.map((c) => c.name).includes(action.payload[1])
          ),
        };
      }
      if (action.payload.length >= 3) {
        return {
          ...state,
          paquetes: state.paquetesOrigin.filter(
            (p) =>
              p.chars.map((c) => c.name).includes(action.payload[0]) &&
              p.chars.map((c) => c.name).includes(action.payload[1]) &&
              p.chars.map((c) => c.name).includes(action.payload[2])
          ),
        };
      }
    }
    // eslint-disable-next-line no-fallthrough
    case FILTER_PACKS: {
      if (action.payload[1] == "pack") {
        if (action.payload[0] == "all") {
          return {
            ...state,
            paquetes: state.paquetesOrigin.slice(
              (state.pagina - 1) * perPage,
              perPage * state.pagina
            ),
          };
        } else if (action.payload[0] == "false") {
          return {
            ...state,
            paquetes: state.paquetesOrigin.filter((p) => p.status == false),
          };
        } else if (action.payload[0] == "true") {
          return {
            ...state,
            paquetes: state.paquetesOrigin.filter((p) => p.status == true),
          };
        }
      } else {
        if (action.payload[0] == "all") {
          return {
            ...state,
            clases: state.clasesOrigin.slice(
              (state.pagina - 1) * perPage,
              perPage * state.pagina
            ),
          };
        } else if (action.payload[0] == "false") {
          return {
            ...state,
            clases: state.clasesOrigin.filter((p) => p.status == false),
          };
        } else if (action.payload[0] == "true") {
          return {
            ...state,
            clases: state.clasesOrigin.filter((p) => p.status == true),
          };
        }
      }
    }
    // eslint-disable-next-line no-fallthrough
    case SET_PAQUETES: {
      return {
        ...state,
        paquetes: action.payload.slice(
          (state.pagina - 1) * perPage,
          perPage * state.pagina
        ),
        paquetesOrigin: action.payload,
        maxPagesPacks: Math.ceil(action.payload.length / perPage),
      };
    }
    case SET_PAGINA: {
      return {
        ...state,
        pagina: action.payload,
        paquetes: state.paquetes.slice(
          (action.payload - 1) * perPage,
          perPage * action.payload
        ),
        clases: state.clases.slice(
          (action.payload - 1) * perPage,
          perPage * action.payload
        ),
        users: state.usersOrigin.slice(
          (action.payload - 1) * perPage,
          perPage * action.payload
        ),
      };
    }
    case FIND_PAQUETES: {
      return {
        ...state,
        pagina: 1,
        paquetes: state.paquetesOrigin.filter((p) =>
          p.title.toLowerCase().includes(action.payload.toLowerCase())
        ),
      };
    }
    case SET_USERS: {
      return {
        ...state,
        pagina: 1,
        users: action.payload.slice(
          (state.pagina - 1) * perPage,
          perPage * state.pagina
        ),
        usersOrigin: action.payload,
        maxPagesUser: Math.ceil(action.payload.length / perPage),
      };
    }
    case FIND_USERS: {
      return {
        ...state,
        users: state.usersOrigin.filter((p) =>
          p.email.toLowerCase().includes(action.payload.toLowerCase())
        ),
      };
    }
    case SET_CLASS: {
      return {
        ...state,
        pagina: 1,
        clases: action.payload.slice(
          (state.pagina - 1) * perPage,
          perPage * state.pagina
        ),
        clasesOrigin: action.payload,
        maxPagesClass: Math.ceil(action.payload.length / perPage),
      };
    }
    case FIND_CLASS: {
      return {
        ...state,
        clases: state.clasesOrigin.filter((p) =>
          p.title.toLowerCase().includes(action.payload.toLowerCase())
        ),
      };
    }
    case GET_POPUP_REQUEST:
    case POST_POPUP_REQUEST:
    case PUT_POPUP_REQUEST:
      return { ...state, loading: true, error: null };

    case GET_POPUP_SUCCESS:
      return { ...state, popup: action.payload, loading: false };

    case POST_POPUP_SUCCESS:
      return { ...state, popup: action.payload, loading: false };

    case PUT_POPUP_SUCCESS:
      return { ...state, popup: action.payload, loading: false };

    case GET_POPUP_FAIL:
    case POST_POPUP_FAIL:
    case PUT_POPUP_FAIL:
      return { ...state, error: action.payload, loading: false };

    case USER_REGISTER_REQUEST:
      return { ...state, loading: true };
    case USER_REGISTER_SUCCESS:
      return { ...state, loading: false, userInfo: action.payload };
    case USER_REGISTER_FAIL:
      return { ...state, loading: false, error: action.payload };

    case UPDATE_USER:
      return {
        ...state,
        infoUsers: state.infoUsers.map((user) =>
          user.id === action.payload.id ? action.payload : user
        ),
      };
    case DELETE_USER_BY_ID:
      return {
        ...state,
      };

    case FETCH_PACKS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case FETCH_PACKS_SUCCESS:
      return {
        ...state,
        loading: false,
        packs: action.payload,
      };
    case FETCH_PACKS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case FETCH_PACK_REQUEST:
      return {
        ...state,
        loading: true,
      };
    case FETCH_PACK_SUCCESS:
      return {
        ...state,
        loading: false,
        pack: action.payload,
      };
    case FETCH_PACK_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case FETCH_YAPAYA_REQUEST:
      return {
        ...state,
        loading: true,
      };
    case FETCH_YAPAYA_SUCCESS:
      return {
        ...state,
        loading: false,
        isYapaya: action.payload,
      };
    case FETCH_YAPAYA_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case FETCH_ACTIVE_REQUEST:
      return {
        ...state,
        loading: true,
      };
    case FETCH_ACTIVE_SUCCESS:
      return {
        ...state,
        loading: false,
        isActive: action.payload,
      };
    case FETCH_ACTIVE_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case CREATE_PACK_REQUEST:
      return { ...state, loading: true, error: null };

    case CREATE_PACK_SUCCESS:
      return { ...state, loading: false };

    case CREATE_PACK_FAILURE:
      return { ...state, loading: false, error: action.payload };

    case UPDATE_PACK_REQUEST:
      return { ...state, loading: true, error: null };

    case UPDATE_PACK_SUCCESS:
      return { ...state, loading: false };

    case UPDATE_PACK_FAILURE:
      return { ...state, loading: false, error: action.payload };

    case DELETE_PACK_REQUEST:
      return { ...state, loading: true, error: null };

    case DELETE_PACK_SUCCESS:
      return {
        ...state,
        loading: false,
        packs: state.packs.filter((pack) => pack.id !== action.payload),
      };

    case DELETE_PACK_FAILURE:
      return { ...state, loading: false, error: action.payload };
    
      case CREATE_RESERVATION_SUCCESS:
      return {
        ...state,
        reservations: [...state.reservations, action.payload],
        loading: false,
      };
    case CREATE_RESERVATION_FAILURE:
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    case FETCH_RESERVATIONS_SUCCESS:
      return {
        ...state,
        reservations: action.payload,
        loading: false,
      };
    case FETCH_RESERVATIONS_FAILURE:
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    case FETCH_USER_RESERVATIONS_SUCCESS:
      return {
        ...state,
        userReservations: action.payload,
        loading: false,
      };
    case FETCH_USER_RESERVATIONS_FAILURE:
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    case UPDATE_RESERVATION_SUCCESS:
      return {
        ...state,
        reservations: state.reservations.map((reservation) =>
          reservation.id === action.payload.id ? action.payload : reservation
        ),
        loading: false,
      };
    case UPDATE_RESERVATION_FAILURE:
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    case DELETE_RESERVATION_SUCCESS:
      return {
        ...state,
        reservations: state.reservations.filter(
          (reservation) => reservation.id !== action.payload
        ),
        loading: false,
      };
    case DELETE_RESERVATION_FAILURE:
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
      case FETCH_VIDEOS_REQUEST:
        return {
          ...state,
          loading: true
        };
        case FETCH_VIDEOS_SUCCESS:
          console.log('Fetched Videos:', action.payload); // Agrega este console.log para depuración
          return {
            ...state,
            loading: false,
            videos: action.payload,
            error: ''
          };
        
      case FETCH_VIDEOS_FAILURE:
        return {
          ...state,
          loading: false,
          videos: [],
          error: action.payload
        };
        case REMOVE_VIDEO:
          return {
            ...state,
            videos: state.videos.filter(video => video.id !== action.payload),
          };
          case INFO_USERS:
            console.log('Users information received:', action.payload); // Verifica que el payload traiga la información correcta
            return {
              ...state,
              users: action.payload,  // Almacena los usuarios en el estado
              loading: false,
              error: null,
            };

    default:
      return state;
  }
};

export default rootReducer;
