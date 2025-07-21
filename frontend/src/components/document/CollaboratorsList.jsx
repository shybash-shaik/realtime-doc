import React from 'react';

const CollaboratorsList = ({
  isAdmin,
  docObj,
  permissionsError,
  userInfoMap,
  user,
  handleChangeRole,
  handleRemoveUser,
  newUserEmail,
  setNewUserEmail,
  newUserRole,
  setNewUserRole,
  handleAddUserByEmail,
  lookupLoading,
  lookupError
}) => {
  if (!isAdmin) return null;
  return (
    <div className="mt-4 md:mt-6 p-3 md:p-4 border rounded text-xs md:text-base">

      <h3 className="font-bold mb-2">Manage Permissions</h3>
      {permissionsError && <div className="text-red-500 mb-2">{permissionsError}</div>}
      <ul>
        {docObj?.permissions?.map((perm, idx) => {
          const userInfo = userInfoMap[perm.userId];
          return (
            <li key={perm.userId} className="flex flex-col md:flex-row items-start md:items-center space-y-1 md:space-y-0 md:space-x-2 mb-1">

              <span>
                {userInfo?.name || userInfo?.email || perm.userId}
                {userInfo?.email && <span className="text-xs text-gray-500 ml-1">({userInfo.email})</span>}
              </span>
              <select
                value={perm.role}
                onChange={e => handleChangeRole(perm.userId, e.target.value)}
                className="text-xs md:text-base"

              >
                <option value="admin">Admin</option>
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
              {perm.userId !== user.uid && (
                <button onClick={() => handleRemoveUser(perm.userId)} className="text-red-500 text-xs md:text-base">Remove</button>

              )}
            </li>
          );
        })}
      </ul>
      <form onSubmit={handleAddUserByEmail} className="mt-2 flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">

        <input
          type="email"
          placeholder="User email"
          value={newUserEmail}
          onChange={e => setNewUserEmail(e.target.value)}
          className="border px-2 py-1 rounded text-xs md:text-base"
          required
        />
        <select value={newUserRole} onChange={e => setNewUserRole(e.target.value)} className="text-xs md:text-base">
          <option value="editor">Editor</option>
          <option value="viewer">Viewer</option>
        </select>
        <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded text-xs md:text-base" disabled={lookupLoading}>

          {lookupLoading ? 'Adding...' : 'Add'}
        </button>
      </form>
      {lookupError && <div className="text-red-500 mt-1">{lookupError}</div>}
    </div>
  );
};

export default React.memo(CollaboratorsList); 

