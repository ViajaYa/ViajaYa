import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = ({canActivate, redirect = "/"}) => {
    if(!canActivate){
        return <Navigate to={redirect} replace/>
    }
    return <Outlet/>
};

export default ProtectedRoute