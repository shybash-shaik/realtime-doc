# API Documentation

## Authentication

### POST `/api/auth/login`
- Login with Firebase ID token
- **Body:** `{ idToken: string }`
- **Response:** `{ uid, email, name }`

### POST `/api/auth/logout`
- Logout (clears cookie)

### GET `/api/auth/protected`
- Returns current user info if authenticated

### POST `/api/auth/user-info`
- Get info for multiple user IDs
- **Body:** `{ uids: [string] }`
- **Response:** `{ users: [{ uid, email, name }] }`

---

## Documents

### GET `/api/docs`
- List all documents (optionally filter by folder or search)
- **Query:** `?folder=FOLDER_NAME&q=search`
- **Response:** `[ { id, title, ... } ]`

### GET `/api/docs/:id`
- Get a single document by ID

### POST `/api/docs`
- Create a new document
- **Body:** `{ title, content, folder }`

### PUT `/api/docs/:id`
- Update a document (title, content, folder)

### DELETE `/api/docs/:id`
- Delete a document (admin only)

### PUT `/api/docs/:id/permissions`
- Update document permissions (admin only)
- **Body:** `{ permissions: [{ userId, role }] }`

---

## Comments

### GET `/api/docs/:docId/comments`
- List all comments for a document

### POST `/api/docs/:docId/comments`
- Add a comment to a document
- **Body:** `{ anchor, content }`

### PATCH `/api/docs/:docId/comments/:commentId`
- Update a comment (content only)

### DELETE `/api/docs/:docId/comments/:commentId`
- Delete a comment

---

## Sharing

### POST `/api/docs/:id/share`
- Generate or update a shareable link for a document (admin only)
- **Body:** `{ permission: 'viewer' | 'commenter' | 'editor' }`
- **Response:** `{ shareToken, sharePermission }`

### GET `/api/docs/shared/:token`
- Fetch a document by share token
- **Response:** `{ id, title, content, sharePermission, ... }`

---

## Folders

### GET `/api/docs/folders/all`
- List all folders

### POST `/api/docs/folders`
- Create a new folder
- **Body:** `{ name }`

### DELETE `/api/docs/folders/:id`
- Delete a folder (and all its documents)

---

## Permissions

- **admin**: Full control (CRUD, manage permissions, share)
- **editor**: Edit content
- **commenter**: Add comments
- **viewer**: Read-only

---

## Notes
- All endpoints require authentication unless accessed via a valid share token.
- Share links grant access based on the selected permission.
- Comments are anchored to text selections and support real-time updates. 