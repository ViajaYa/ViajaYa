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

} from "../actions/actions";

import{

  GET_POPUP_SUCCESS,
  GET_POPUP_FAIL,
  POST_POPUP_SUCCESS,
  POST_POPUP_FAIL,  
  PUT_POPUP_SUCCESS,
  PUT_POPUP_FAIL,
  USER_REGISTER_REQUEST,
  USER_REGISTER_SUCCESS,
  USER_REGISTER_FAIL
  } from '../actions/actions-types'

const perPage = 8;

const initialState = {
  user: {},
  pagina: 1,
  paquetes: [],
  paquetesOrigin: [],
  users: [],
  usersOrigin: [],
  clases: [],
  clasesOrigin: [],
  maxPagesPacks: null,
  maxPagesUser:null,
  maxPagesClass: null,
  filter: "all",
  pay:{},
  word:"",
  popup: null,
  userInfo: null,
  loading: false,
  error: null,


};
const rootReducer = (state = initialState, { type, payload }) => {
  switch (type) {
    case SET_USER: {
      return {
        ...state,
        user: payload,
      };
    }
    case DATA_PAY: {
      return {
        ...state,
        pay: payload,
      };
    }
    case FILTER_PACKSTITLE:{
      if(payload.length == 0){
        return{
          ...state,
          paquetes: state.paquetesOrigin,
          word: payload
        }}else{
          return{
            ...state,
            word:payload,
            paquetes: state.paquetesOrigin.filter(p => p.title.toLowerCase().includes(payload.toLowerCase()))
          }
        }
    }
    case FILTER_PACKSCHARS:{
      if(payload.length == 0){
        return{
          ...state,
          paquetes: state.paquetesOrigin
        }}
      if(payload.length == 1){
      return{
        ...state,
        paquetes: state.paquetesOrigin.filter(p => p.chars.map(c => c.name).includes(payload[0]))
      }}
      if(payload.length == 2){
        return{
          ...state,
          paquetes: state.paquetesOrigin.filter(p => p.chars.map(c => c.name).includes(payload[0]) && p.chars.map(c => c.name).includes(payload[1]))
        }}
        if(payload.length >= 3){
          return{
            ...state,
            paquetes: state.paquetesOrigin.filter(p => p.chars.map(c => c.name).includes(payload[0]) && p.chars.map(c => c.name).includes(payload[1]) && p.chars.map(c => c.name).includes(payload[2]))
          }}
    }
    // eslint-disable-next-line no-fallthrough
    case FILTER_PACKS:{
      if(payload[1] == "pack"){
      if(payload[0] == "all"){
        return{
          ...state,
          paquetes: state.paquetesOrigin.slice(
            (state.pagina - 1) * perPage,
            perPage * state.pagina
          )
        }
      }else if(payload[0] == "false"){
      return{
        ...state,
        paquetes: state.paquetesOrigin.filter(p => p.status == false)
      }
    }else if(payload[0] == "true"){
        return{
          ...state,
          paquetes: state.paquetesOrigin.filter(p => p.status == true)
        }
    }
  }else{
    if(payload[0] == "all"){
      return{
        ...state,
        clases: state.clasesOrigin.slice(
          (state.pagina - 1) * perPage,
          perPage * state.pagina
        )
      }
    }else if(payload[0] == "false"){
    return{
      ...state,
      clases: state.clasesOrigin.filter(p => p.status == false)
    }
  }else if(payload[0] == "true"){
      return{
        ...state,
        clases: state.clasesOrigin.filter(p => p.status == true)
      }
  }
  }
    }
    // eslint-disable-next-line no-fallthrough
    case SET_PAQUETES: {
      return {
        ...state,
        paquetes: payload.slice(
          (state.pagina - 1) * perPage,
          perPage * state.pagina
        ),
        paquetesOrigin: payload,
        maxPagesPacks: Math.ceil(payload.length/perPage)
      };
    }
    case SET_PAGINA: {
      return {
        ...state,
        pagina: payload,
        paquetes: state.paquetes.slice(
          (payload - 1) * perPage,
          perPage * payload
        ),
        clases: state.clases.slice(
          (payload - 1) * perPage,
          perPage * payload
        ),
        users: state.usersOrigin.slice(
          (payload - 1) * perPage,
          perPage * payload
        ),
      };
    }
    case FIND_PAQUETES: {
      return {
        ...state,
        pagina: 1,
        paquetes: state.paquetesOrigin.filter((p) =>
          p.title.toLowerCase().includes(payload.toLowerCase())
        ),
      };
    }
    case SET_USERS: {
      return {
        ...state,
        pagina:1,
        users: payload.slice(
          (state.pagina - 1) * perPage,
          perPage * state.pagina
        ),
        usersOrigin: payload,
        maxPagesUser: Math.ceil(payload.length/perPage)
      };
    }
    case FIND_USERS: {
      return {
        ...state,
        users: state.usersOrigin.filter((p) =>
          p.email.toLowerCase().includes(payload.toLowerCase())
        ),
      };
    }
    case SET_CLASS: {
      return {
        ...state,
        pagina:1,
        clases: payload.slice(
          (state.pagina - 1) * perPage,
          perPage * state.pagina
        ),
        clasesOrigin: payload,
        maxPagesClass: Math.ceil(payload.length/perPage)
      };
    }
    case FIND_CLASS: {
      return {
        ...state,
        clases: state.clasesOrigin.filter((p) =>
          p.title.toLowerCase().includes(payload.toLowerCase())
        ),
      };

    }
    case GET_POPUP_SUCCESS:
      return { ...state, popup: payload, loading: false };
    case GET_POPUP_FAIL:
      return { ...state, error: payload, loading: false };
    case POST_POPUP_SUCCESS:
      return { ...state, popup: payload, loading: false };
    case POST_POPUP_FAIL:
      return { ...state, error: payload, loading: false };
    case PUT_POPUP_SUCCESS:
      return { ...state, popup: payload, loading: false };
    case PUT_POPUP_FAIL:
      return { ...state, error: payload, loading: false };

      case USER_REGISTER_REQUEST:
        return { ...state, loading: true };
    case USER_REGISTER_SUCCESS:
        return { ...state, loading: false, userInfo: payload };
    case USER_REGISTER_FAIL:
        return { ...state, loading: false, error: payload };
    default:
      return { ...state };
  }
};

export default rootReducer;
