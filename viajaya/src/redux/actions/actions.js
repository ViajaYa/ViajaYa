export const SET_USER = "SET_USER"
export const FIND_PAQUETES = "FIND_PAQUETES"
export const SET_PAQUETES = "SET_PAQUETES"
export const FIND_USERS = "FIND_USERS"
export const SET_USERS = "SET_USERS"
export const FIND_CLASS = "FIND_CLASS"
export const SET_CLASS = "SET_CLASS"
export const SET_PAGINA = "SET_PAGINA"
export const FILTER_PACKS = "FILTER_PACKS"
export const FILTER_PACKSCHARS = "FILTER_PACKSCHARS"
export const FILTER_PACKSTITLE = "FILTER_PACKSTITLE"
export const DATA_PAY = "DATA_PAY"

export const setUser = (user) => {
  return (dispatch) => {
    dispatch({type:SET_USER, payload:user})
  }
}

export const setDataPay = (data) => {
  return (dispatch) => {
    dispatch({type:DATA_PAY, payload:data})
  }
}

export const findPaquetes = (word) => {
  return (dispatch) => {
    dispatch({type:FIND_PAQUETES, payload:word})
  }
}

export const setPaquetes = (paquetes) => {
  return (dispatch) => {
    dispatch({type:SET_PAQUETES, payload:paquetes})
  }
}

export const findUsers = (word) => {
  return (dispatch) => {
    dispatch({type:FIND_USERS, payload:word})
  }
}

export const setUsers = (users) => {
  return (dispatch) => {
    dispatch({type:SET_USERS, payload:users})
  }
}

export const findClass = (word) => {
  return (dispatch) => {
    dispatch({type:FIND_CLASS, payload:word})
  }
}

export const setClass = (clases) => {
  return (dispatch) => {
    dispatch({type:SET_CLASS, payload:clases})
  }
}

export const setPagina = (number) => {
  return (dispatch) => {
    dispatch({type:SET_PAGINA, payload:number})
  }
}

export const filterPacks = (why, type) => {
  return (dispatch) => {
    dispatch({type:FILTER_PACKS, payload:[why, type]})
  }
}

export const filterPacksChar = (chars) => {
  return (dispatch) => {
    dispatch({type:FILTER_PACKSCHARS, payload:chars})
  }
}

export const filterPacksTitle = (word) => {
  return (dispatch) => {
    dispatch({type:FILTER_PACKSTITLE, payload:word})
  }
}