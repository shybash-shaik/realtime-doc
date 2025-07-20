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
    <div className="mt-6 p-4 border rounded">
      <h3 className="font-bold mb-2">Manage Permissions</h3>
      {permissionsError && <div className="text-red-500 mb-2">{permissionsError}</div>}
      <ul>
        {docObj?.permissions?.map((perm, idx) => {
          const userInfo = userInfoMap[perm.userId];
          return (
            <li key={perm.userId} className="flex items-center space-x-2 mb-1">
              <span>
                {userInfo?.name || userInfo?.email || perm.userId}
                {userInfo?.email && <span className="text-xs text-gray-500 ml-1">({userInfo.email})</span>}
              </span>
              <select
                value={perm.role}
                onChange={e => handleChangeRole(perm.userId, e.target.value)}
              >
                <option value="admin">Admin</option>
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
              {perm.userId !== user.uid && (
                <button onClick={() => handleRemoveUser(perm.userId)} className="text-red-500">Remove</button>
              )}
            </li>
          );
        })}
      </ul>
      <form onSubmit={handleAddUserByEmail} className="mt-2 flex space-x-2">
        <input
          type="email"
          placeholder="User email"
          value={newUserEmail}
          onChange={e => setNewUserEmail(e.target.value)}
          className="border px-2 py-1 rounded"
          required
        />
        <select value={newUserRole} onChange={e => setNewUserRole(e.target.value)}>
          <option value="editor">Editor</option>
          <option value="viewer">Viewer</option>
        </select>
        <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded" disabled={lookupLoading}>
          {lookupLoading ? 'Adding...' : 'Add'}
        </button>
      </form>
      {lookupError && <div className="text-red-500 mt-1">{lookupError}</div>}
    </div>
  );
};

export default CollaboratorsList; 