// client/src/utils/createPage.js
import { db } from "../components/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

// create a new page and first block
export const createNewPage = async (userId, title = "Untitled Page") => {
  try {
    // Step 1: Add the page
    const pageRef = await addDoc(collection(db, "pages"), {
      title,
      ownerId: userId,
      collaborators: { [userId]: "owner" },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const pageId = pageRef.id;

    // Step 2: Add a default empty block to that page
    await addDoc(collection(db, "blocks"), {
      pageId,
      type: "paragraph",
      content: "",
      order: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log("Page created with ID:", pageId);
    return pageId;
  } catch (error) {
    console.error("Error creating page:", error);
  }
};
