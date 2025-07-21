import React from "react";
import { useAuth } from "./AuthContext"; 
import { useNavigate } from "react-router-dom";

const Home = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 flex flex-col items-center justify-center px-2 md:px-4">
      <h1 className="text-3xl md:text-5xl font-bold text-gray-800 mb-4 text-center">
        Welcome to CollabDocs
      </h1>
      <p className="text-gray-600 text-base md:text-lg mb-8 text-center max-w-md">
        Create, edit, and collaborate on documents in real-time with your team.
      </p>

      {currentUser ? (
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 w-full md:w-auto items-center justify-center">
          <button
            onClick={() => navigate("/documents")}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md transition duration-200 w-full md:w-auto"
          >
            Go to Documents
          </button>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 w-full md:w-auto items-center justify-center">
          <button
            onClick={() => navigate("/login")}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition duration-200 w-full md:w-auto"
          >
            Login
          </button>
          <button
            onClick={() => navigate("/register")}
            className="px-6 py-3 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-semibold rounded-xl transition duration-200 w-full md:w-auto"
          >
            Register
          </button>
        </div>
      )}
    </div>
  );
};

export default Home;
