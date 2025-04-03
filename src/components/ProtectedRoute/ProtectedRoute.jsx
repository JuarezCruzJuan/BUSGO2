import { Navigate } from 'react-router-dom';
import Cookies from 'js-cookie';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const userInfo = Cookies.get('userInfo');
  const token = Cookies.get('token');

  if (!token || !userInfo) {
    return <Navigate to="/" replace />;
  }

  const user = JSON.parse(userInfo);
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.rol)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;