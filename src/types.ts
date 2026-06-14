export interface UserPublic {
  uid: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  isPremium?: boolean;
  isAdmin?: boolean;
  lastSeen?: any;
}

export interface UserPrivate {
  email: string;
  createdAt: any; // Firestore Timestamp
}

export interface Message {
  id?: string;
  text: string;
  senderId: string;
  senderName: string;
  createdAt: any; // Firestore Timestamp
  chatId: string;
}

export interface Chat {
  id: string;
  name: string;
  createdBy: string;
  createdAt: any;
  lastMessageVisible?: string;
  updatedAt?: any;
}
