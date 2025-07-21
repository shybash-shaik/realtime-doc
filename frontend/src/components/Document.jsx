import React, { useEffect, useRef, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import sanitizeHtml from "sanitize-html";
import api from "../api/docs";
import DocumentHeader from "./document/DocumentHeader";
import DocumentToolbar from "./document/DocumentToolbar";
import DocumentEditor from "./document/DocumentEditor";
import CollaboratorsList from "./document/CollaboratorsList";
import useDocumentLoader from "./document/useDocumentLoader";
import useYjsProvider from "./document/useYjsProvider";
import { Mark } from '@tiptap/core';
import CommentSidebar from "./document/CommentSidebar";
import CommentModal from "./document/CommentModal";
import ShareModal from "./document/ShareModal";

const Document = ({ onSave }) => {
  const { id: paramId } = useParams();
  const location = useLocation();
  const { user, loading } = useAuth();
  const doc = location.state?.doc;
  const documentId = doc?.id || paramId;
  const documentTitle = doc?.title || "";

  const { docObj, isLoading, setDocObj, setIsLoading, loadDocument } =
    useDocumentLoader(documentId, doc);

  const userId = user?.uid;
  const myRole =
    docObj?.permissions?.find((p) => p.userId === userId)?.role || "viewer";
  const canEdit = ["admin", "editor"].includes(myRole);
  const isAdmin = myRole === "admin";

  const [saveStatus, setSaveStatus] = useState("saved");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState("editor");
  const [permissionsError, setPermissionsError] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [userInfoMap, setUserInfoMap] = useState({});
  const autoSaveTimeoutRef = useRef(null);
  const [focusedCommentId, setFocusedCommentId] = useState(null);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentSelection, setCommentSelection] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareInfo, setShareInfo] = useState(null);

  const { editor, isYjsReady, onlineUsers, setOnlineUsers } = useYjsProvider(
    documentId,
    user,
    userId,
    canEdit,
    autoSave,
    docObj
  );

  function autoSave(editorInstance) {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    setSaveStatus("saving");
    autoSaveTimeoutRef.current = setTimeout(() => {
      saveDocument(editorInstance);
    }, 3000);
  }
  const saveDocument = async (editorInstance = editor) => {
    if (!editorInstance || !documentId) return;
    try {
      const content = editorInstance.getHTML();
      const cleanContent = sanitizeHtml(content);
      const response = await api.put(`/docs/${documentId}`, {
        content: cleanContent,
      });
      setSaveStatus("saved");
      setDocObj(response.data);
    } catch (error) {
      setSaveStatus("error");
      alert(
        "Failed to save document: " +
          (error?.response?.data?.error || error.message)
      );
    }
  };
  const handleChangeRole = async (userId, newRole) => {
    if (!docObj) return;
    const updatedPermissions = docObj.permissions.map((perm) =>
      perm.userId === userId ? { ...perm, role: newRole } : perm
    );
    await updatePermissions(updatedPermissions);
  };
  const handleRemoveUser = async (userId) => {
    if (!docObj) return;
    const updatedPermissions = docObj.permissions.filter(
      (perm) => perm.userId !== userId
    );
    await updatePermissions(updatedPermissions);
  };
  const handleAddUserByEmail = async (e) => {
    e.preventDefault();
    setLookupError("");
    setLookupLoading(true);
    try {
      const res = await api.post("/auth/lookup-uid", { email: newUserEmail });
      const uid = res.data.uid;
      if (docObj.permissions.some((perm) => perm.userId === uid)) {
        setLookupError("User already has a role");
        setLookupLoading(false);
        return;
      }
      const updatedPermissions = [
        ...docObj.permissions,
        { userId: uid, role: newUserRole },
      ];
      await updatePermissions(updatedPermissions);
      setNewUserEmail("");
      setNewUserRole("editor");
    } catch (err) {
      setLookupError(err?.response?.data?.error || "User not found");
    }
    setLookupLoading(false);
  };
  const updatePermissions = async (updatedPermissions) => {
    try {
      const response = await api.put(`/docs/${docObj.id}/permissions`, {
        permissions: updatedPermissions,
      });
      setDocObj(response.data);
    } catch (error) {
      setPermissionsError("Failed to update permissions");
    }
  };

  // Add comment to selected text
  const handleAddComment = () => {
    if (!editor || editor.state.selection.empty) return;
    const { from, to } = editor.state.selection;
    const anchor = { from, to, text: editor.state.doc.textBetween(from, to) };
    setCommentSelection(anchor);
    setShowCommentModal(true);
  };

  const handleSubmitComment = async (commentText) => {
    if (!editor || !commentSelection || !commentText) return;
    try {
      const res = await api.post(`/docs/${documentId}/comments`, {
        anchor: commentSelection,
        content: commentText,
      });
      const commentId = res.data.id;
      editor.chain().focus().setMark('comment', { commentId }).run();
      setShowCommentModal(false);
      setCommentSelection(null);
    } catch (err) {
      alert('Failed to add comment');
      console.error(err);
    }
  };

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!docObj?.permissions?.length) return;
      const uids = docObj.permissions.map((p) => p.userId);
      try {
        const res = await api.post("/auth/user-info", { uids });
        const map = {};
        res.data.users.forEach((u) => {
          map[u.uid] = u;
        });
        setUserInfoMap(map);
      } catch (err) {}
    };
    fetchUserInfo();
  }, [docObj?.permissions]);

  useEffect(() => {
    if (!doc) loadDocument();
  }, [documentId]);

  useEffect(() => {
    if (
      editor &&
      isYjsReady &&
      docObj &&
      docObj.content &&
      editor.getHTML().trim() === ""
    ) {
      editor.commands.setContent(docObj.content);
    }
  }, [editor, isYjsReady, docObj]);

  useEffect(() => {
    if (!editor) return;
    const handleClick = (event) => {
      const target = event.target;
      if (target && target.nodeType === 1 && target.hasAttribute('data-comment-id')) {
        const commentId = target.getAttribute('data-comment-id');
        setFocusedCommentId(commentId);
        setShowSidebar(true); // Auto-open sidebar on highlight click
      }
    };
    const editorEl = document.querySelector('.ProseMirror');
    if (editorEl) {
      editorEl.addEventListener('click', handleClick);
    }
    return () => {
      if (editorEl) {
        editorEl.removeEventListener('click', handleClick);
      }
    };
  }, [editor]);

  // Check for share token in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      // Fetch document by share token
      api.get(`/docs/shared/${token}`)
        .then(res => {
          setDocObj(res.data);
          // Optionally set permission in state for UI
        })
        .catch(() => {
          alert('Invalid or expired share link.');
        });
    }
  }, [documentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user...</p>
        </div>
      </div>
    );
  }
  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-600">Please log in to view this document.</p>
        </div>
      </div>
    );
  }
  if (!editor || isLoading || !isYjsReady) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isLoading
              ? "Loading document..."
              : !isYjsReady
              ? "Initializing collaboration..."
              : "Initializing editor..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <div className="flex-1">
        <DocumentHeader
          title={docObj?.title || documentTitle || "Untitled Document"}
          myRole={myRole}
          isConnected={true}
          onlineUsers={onlineUsers}
          saveStatus={saveStatus}
          isAdmin={isAdmin}
          canEdit={canEdit}
          onDelete={undefined}
        />
        <div className="flex items-center gap-2 mb-2">
          <DocumentToolbar editor={editor} onAddComment={handleAddComment} />
          <button
            className="px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 border border-blue-300"
            onClick={() => setShowShareModal(true)}
          >
            Share
          </button>
          <button
            className="ml-auto px-3 py-1 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 border border-yellow-300"
            onClick={() => setShowSidebar((v) => !v)}
            title={showSidebar ? "Hide Comments" : "Show Comments"}
          >
            {showSidebar ? "Hide Comments" : "Show Comments"}
          </button>
        </div>
        <DocumentEditor editor={editor} />
        <CollaboratorsList
          isAdmin={isAdmin}
          docObj={docObj}
          permissionsError={permissionsError}
          userInfoMap={userInfoMap}
          user={user}
          handleChangeRole={handleChangeRole}
          handleRemoveUser={handleRemoveUser}
          newUserEmail={newUserEmail}
          setNewUserEmail={setNewUserEmail}
          newUserRole={newUserRole}
          setNewUserRole={setNewUserRole}
          handleAddUserByEmail={handleAddUserByEmail}
          lookupLoading={lookupLoading}
          lookupError={lookupError}
        />
      </div>
      {showSidebar && (
        <div className="w-full md:w-80 bg-white border-l border-gray-200 p-4">
          <CommentSidebar docId={documentId} focusedCommentId={focusedCommentId} />
        </div>
      )}
      {showCommentModal && (
        <CommentModal
          anchor={commentSelection}
          onSubmit={handleSubmitComment}
          onClose={() => { setShowCommentModal(false); setCommentSelection(null); }}
        />
      )}
      {showShareModal && (
        <ShareModal
          docId={documentId}
          onClose={() => setShowShareModal(false)}
          shareInfo={shareInfo}
          setShareInfo={setShareInfo}
        />
      )}
    </div>
  );
};

export default Document;
