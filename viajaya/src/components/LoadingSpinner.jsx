import PropTypes from "prop-types";

const LoadingSpinner = ({ size = "default", message = "Cargando..." }) => {
  const sizeClasses = {
    small: "h-4 w-4",
    default: "h-8 w-8",
    large: "h-12 w-12"
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size]}`}></div>
      {message && (
        <p className="mt-2 text-sm text-gray-600 animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
};

LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(["small", "default", "large"]),
  message: PropTypes.string
};

export default LoadingSpinner;