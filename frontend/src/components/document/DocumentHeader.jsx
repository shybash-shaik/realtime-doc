import React from "react";
import { Users } from "lucide-react";

function getUniqueUsers(users) {
  const map = {};
  users.forEach((u) => {
    const key = u.email || u.id;
    if (key && !map[key]) map[key] = u;
  });
  return Object.values(map);
}

const DocumentHeader = ({
  title,
  myRole,
  isConnected,
  onlineUsers,
  saveStatus,
  isAdmin,
  canEdit,
  onDelete,
}) => {
  const uniqueOnlineUsers = getUniqueUsers(onlineUsers);
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <span className="ml-4 text-xs text-gray-500">
            Your role: <b>{myRole}</b>
          </span>
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-green-500" : "bg-red-500"
              }`}
            ></div>
            <span className="text-sm text-gray-600">
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-gray-500" />
            {uniqueOnlineUsers.length === 0 ? (
              <span className="text-sm text-gray-600">No users online</span>
            ) : (
              <div className="flex -space-x-2">
                {uniqueOnlineUsers.map((u, idx) => (
                  <div
                    key={u.email || u.id || idx}
                    className="flex items-center space-x-1 mr-2"
                  >
                    <span
                      className="inline-block w-2 h-2 rounded-full mr-1"
                      style={{ backgroundColor: u.color || "#888" }}
                      title={u.name || u.email || u.id}
                    ></span>
                    <span
                      className="text-xs text-gray-700"
                      title={u.name || u.email || u.id}
                    >
                      {u.name || u.email || "User"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${
                saveStatus === "saving"
                  ? "bg-yellow-400 animate-pulse"
                  : saveStatus === "saved"
                  ? "bg-green-500"
                  : "bg-red-500"
              }`}
            ></div>
            <span className="text-sm text-gray-600">
              {saveStatus === "saving"
                ? "Saving..."
                : saveStatus === "saved"
                ? "All changes saved"
                : "Save failed"}
            </span>
          </div>
          {isAdmin && (
            <button
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              onClick={onDelete}
            >
              <span>Delete</span>
            </button>
          )}
          {!canEdit && <span className="text-gray-400">Read-only</span>}
        </div>
      </div>
    </div>
  );
};

export default DocumentHeader;
