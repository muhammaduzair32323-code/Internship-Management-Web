import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loader from './Loader';

const InternRoute = ({ children }) => {
  const { intern, loading } = useAuth();
  if (loading) return <Loader />;
  return intern ? children : <Navigate to="/intern/login" />;
};

export default InternRoute;