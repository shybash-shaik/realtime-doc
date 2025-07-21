import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Plus,
  FileText,
  Calendar,
  User,
  Trash2,
  Edit,
  FolderPlus,
  Folder as FolderIcon,
  Trash,
} from "lucide-react";
import api from "../api/docs";
import sanitizeHtml from "sanitize-html";
import { useAuth } from "./AuthContext";

const DocumentList = ({ onDocumentSelect, onCreateDocument }) => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDocumentTitle, setNewDocumentTitle] = useState("");
  const [search, setSearch] = useState("");
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchFolders();
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [selectedFolder]);

  const fetchFolders = async () => {
    try {
      const response = await api.get("/docs/folders/all");
      setFolders(response.data);
    } catch (error) {
      console.error("Error fetching folders:", error);
    }
  };

  const fetchDocuments = async (query = "") => {
    try {
      setLoading(true);
      let params = {};
      if (query) params.q = query;
      if (selectedFolder) params.folder = selectedFolder;
      const response = await api.get("/docs", { params });
      setDocuments(response.data);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    if (searchTimeout) clearTimeout(searchTimeout);
    setSearchTimeout(
      setTimeout(() => {
        fetchDocuments(value);
      }, 400)
    );
  };

  const createDocument = async () => {
    const cleanTitle = sanitizeHtml(newDocumentTitle.trim());
    if (!cleanTitle) return;

    try {
      const response = await api.post("/docs", {
        title: cleanTitle,
        content: "",
        folder: selectedFolder || null,
      });
      if (!selectedFolder || response.data.folder === selectedFolder) {
        setDocuments((prev) => [response.data, ...prev]);
      }
      setNewDocumentTitle("");
      setShowCreateModal(false);

      if (onCreateDocument) {
        onCreateDocument(response.data);
      }
    } catch (error) {
      console.error("Error creating document:", error);
    }
  };

  const deleteDocument = async (documentId) => {
    if (!window.confirm("Are you sure you want to delete this document?"))
      return;

    try {
      await api.delete(`/docs/${documentId}`);
      setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
    } catch (error) {
      if (error.response?.status === 403) {
        alert("Only admin users can delete documents.");
      } else {
        console.error("Error deleting document:", error);
        alert("Failed to delete document. Please try again.");
      }
    }
  };

  const createFolder = async () => {
    const cleanName = sanitizeHtml(newFolderName.trim());
    if (!cleanName) return;
    try {
      const response = await api.post("/docs/folders", { name: cleanName });
      setFolders((prev) => [...prev, response.data]);
      setNewFolderName("");
      setShowCreateFolderModal(false);
    } catch (error) {
      console.error("Error creating folder:", error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredDocuments = useMemo(
    () => documents.filter(document => document.title && document.title.trim() !== ""),
    [documents]
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile sidebar toggle button */}
      <button
        className="md:hidden p-2 fixed top-4 left-4 z-50 bg-white rounded shadow border"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Open sidebar"
      >
        {/* Hamburger icon */}
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      {/* Sidebar */}
      <div className={`fixed md:static top-0 left-0 h-full w-64 bg-white z-40 transition-transform duration-200 ease-in-out border-r border-gray-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:block`}>
        <div className="h-full overflow-y-auto p-6 pt-16 md:pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <FolderIcon className="w-5 h-5 mr-2" />
              Folders
            </h2>
            <button
              onClick={() => setShowCreateFolderModal(true)}
              className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600"
              title="Create Folder"
            >
              <FolderPlus className="w-5 h-5" />
            </button>
          </div>
          <ul className="space-y-2">
            <li>
              <button
                className={`w-full text-left px-3 py-2 rounded-lg ${
                  selectedFolder === null
                    ? "bg-blue-100 text-blue-700 font-semibold"
                    : "hover:bg-gray-100 text-gray-800"
                }`}
                onClick={() => setSelectedFolder(null)}
              >
                All Documents
              </button>
            </li>
            {folders.map((folder) => (
              <li key={folder.id}>
                <button
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between ${
                    selectedFolder === folder.name
                      ? "bg-blue-100 text-blue-700 font-semibold"
                      : "hover:bg-gray-100 text-gray-800"
                  }`}
                  onClick={() => setSelectedFolder(folder.name)}
                >
                  <span className="flex items-center">
                    <FolderIcon className="w-4 h-4 mr-2" />
                    {folder.name}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
      {/* Main content */}
      <div className="flex-1 p-4 md:p-8 md:ml-0 mt-16 md:mt-0">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4 md:gap-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Documents</h1>
            <p className="text-gray-600 mt-2 text-sm md:text-base">
              Create and manage your collaborative documents
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full md:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span>New Document</span>
          </button>
        </div>
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search documents..."
            value={search}
            onChange={handleSearchChange}
            className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No documents yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first document to get started
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Document
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((document) => (
                <div
                  key={document.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onDocumentSelect(document)}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {document.title}
                      </h3>
                      {document.permissions?.some(p => p.userId === user?.uid && p.role === 'admin') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteDocument(document.id);
                          }}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>Updated {formatDate(document.updatedAt)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span>
                          {document.collaborators?.length || 1} collaborator
                          {(document.collaborators?.length || 1) !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDocumentSelect(document);
                        }}
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Open Document</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Create New Document
            </h2>
            <input
              type="text"
              placeholder="Document title"
              value={newDocumentTitle}
              onChange={(e) => setNewDocumentTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === "Enter" && createDocument()}
            />
            <div className="flex items-center space-x-3 mt-6">
              <button
                onClick={createDocument}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewDocumentTitle("");
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {showCreateFolderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Create New Folder
            </h2>
            <input
              type="text"
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === "Enter" && createFolder()}
            />
            <div className="flex items-center space-x-3 mt-6">
              <button
                onClick={createFolder}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowCreateFolderModal(false);
                  setNewFolderName("");
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentList;
