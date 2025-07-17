import React from "react";
import { useAuth } from "./AuthContext"; // or adjust the path as needed
import { useNavigate } from "react-router-dom";

const Home = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 flex flex-col items-center justify-center px-4">
      <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4 text-center">
        Welcome to CollabDocs
      </h1>
      <p className="text-gray-600 text-lg mb-8 text-center max-w-md">
        Create, edit, and collaborate on documents in real-time with your team.
      </p>

      {currentUser ? (
        <button
          onClick={() => navigate("/dashboard")}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md transition duration-200"
        >
          Go to Dashboard
        </button>
      ) : (
        <div className="flex space-x-4">
          <button
            onClick={() => navigate("/login")}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition duration-200"
          >
            Login
          </button>
          <button
            onClick={() => navigate("/register")}
            className="px-6 py-3 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-semibold rounded-xl transition duration-200"
          >
            Register
          </button>
        </div>
      )}
    </div>
  );
};

export default Home;
