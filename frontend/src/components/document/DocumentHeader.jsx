import React from "react";
import { Users, Wifi, WifiOff, Cloud, CloudOff, Loader2 } from "lucide-react";

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
    <div className="px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex flex-col">
        <div className="flex items-center gap-3">
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">{title}</h1>
          {!canEdit && (
             <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs font-medium rounded-md border border-slate-200">Read-only</span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
          <span className="font-medium bg-slate-100 px-2 py-0.5 rounded-md">Role: {myRole}</span>
          
          <div className="flex items-center gap-1.5">
            {saveStatus === "saving" ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" /> <span>Saving...</span></>
            ) : saveStatus === "saved" ? (
              <><Cloud className="w-3.5 h-3.5 text-green-500" /> <span>Saved to cloud</span></>
            ) : (
              <><CloudOff className="w-3.5 h-3.5 text-red-500" /> <span className="text-red-500">Save failed</span></>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Connection Status */}
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200" title={isConnected ? "Connected to server" : "Disconnected from server"}>
           {isConnected ? <Wifi className="w-4 h-4 text-green-500" /> : <WifiOff className="w-4 h-4 text-red-500" />}
           <span className="text-sm font-medium text-slate-700 hidden sm:inline">{isConnected ? "Online" : "Offline"}</span>
        </div>

        {/* Online Users */}
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-400" />
          {uniqueOnlineUsers.length === 0 ? (
            <span className="text-sm text-slate-500">Just you</span>
          ) : (
            <div className="flex -space-x-2">
              {uniqueOnlineUsers.map((u, idx) => (
                <div
                  key={u.email || u.id || idx}
                  className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white shadow-sm ring-2 ring-transparent hover:ring-blue-400 transition-all cursor-default z-10 hover:z-20"
                  style={{ backgroundColor: u.color || "#6366f1" }}
                  title={u.name || u.email || "User"}
                >
                  {(u.name || u.email || "U").charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
          )}
        </div>

        {onDelete && isAdmin && (
          <button
            className="ml-2 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 font-medium rounded-lg transition-colors text-sm border border-red-200 shadow-sm"
            onClick={onDelete}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
};

export default React.memo(DocumentHeader);

