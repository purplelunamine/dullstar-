import { 
  collection, 
  addDoc, 
  setDoc,
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc,
  query,
  where,
  getDocFromServer
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

// Artist Helpers
export async function getArtist(artistId: string = 'dullstar') {
  try {
    const docRef = doc(db, 'artists', artistId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `artists/${artistId}`);
  }
}

// Album Helpers
export async function getAlbums() {
  try {
    const querySnapshot = await getDocs(collection(db, 'albums'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'albums');
  }
}

export async function addAlbum(album: any) {
  try {
    return await addDoc(collection(db, 'albums'), album);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'albums');
  }
}

export async function setAlbum(id: string, album: any) {
  try {
    const docRef = doc(db, 'albums', id);
    await setDoc(docRef, album);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `albums/${id}`);
  }
}

export async function updateAlbum(id: string, album: any) {
  try {
    const docRef = doc(db, 'albums', id);
    await updateDoc(docRef, album);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `albums/${id}`);
  }
}

export async function deleteAlbum(id: string) {
  try {
    await deleteDoc(doc(db, 'albums', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `albums/${id}`);
  }
}

// Song Helpers
export async function getSongs(albumId?: string) {
  try {
    const songsCol = collection(db, 'songs');
    const q = albumId ? query(songsCol, where('albumId', '==', albumId)) : songsCol;
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'songs');
  }
}

export async function addSong(song: any) {
  try {
    return await addDoc(collection(db, 'songs'), song);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'songs');
  }
}

export async function updateSong(id: string, song: any) {
  try {
    const docRef = doc(db, 'songs', id);
    await updateDoc(docRef, song);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `songs/${id}`);
  }
}

export async function deleteSong(id: string) {
  try {
    await deleteDoc(doc(db, 'songs', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `songs/${id}`);
  }
}
