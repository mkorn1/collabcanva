graph TB
    subgraph "Client Browser 1"
        U1[User 1]
        U1 --> App1[React App]
        
        subgraph "React Components"
            App1 --> Auth1[Auth Components<br/>Login/Signup]
            App1 --> Canvas1[Canvas Component<br/>Konva Stage/Layer]
            App1 --> Collab1[Collaboration<br/>Cursors/Presence]
        end
        
        subgraph "Custom Hooks"
            Auth1 --> useAuth1[useAuth]
            Canvas1 --> useCanvas1[useCanvas]
            Canvas1 --> useCursor1[useCursor]
            Collab1 --> usePresence1[usePresence]
            Canvas1 --> useRealtime1[useRealtime]
        end
        
        subgraph "Services Layer"
            useAuth1 --> AuthService1[auth.js]
            useCanvas1 --> FirestoreService1[firestore.js]
            useCursor1 --> RealtimeService1[realtime.js]
            usePresence1 --> RealtimeService1
            useRealtime1 --> FirestoreService1
        end
        
        subgraph "Utils"
            AuthService1 --> ColorUtil1[colors.js]
            Canvas1 --> CanvasHelpers1[canvasHelpers.js]
            Canvas1 --> Constants1[constants.js]
        end
        
        AuthService1 --> Firebase1[Firebase SDK]
        FirestoreService1 --> Firebase1
        RealtimeService1 --> Firebase1
    end
    
    subgraph "Client Browser 2"
        U2[User 2]
        U2 --> App2[React App]
        
        subgraph "React Components 2"
            App2 --> Auth2[Auth Components]
            App2 --> Canvas2[Canvas Component]
            App2 --> Collab2[Collaboration]
        end
        
        subgraph "Custom Hooks 2"
            Auth2 --> useAuth2[useAuth]
            Canvas2 --> useCanvas2[useCanvas]
            Canvas2 --> useCursor2[useCursor]
            Collab2 --> usePresence2[usePresence]
            Canvas2 --> useRealtime2[useRealtime]
        end
        
        subgraph "Services Layer 2"
            useAuth2 --> AuthService2[auth.js]
            useCanvas2 --> FirestoreService2[firestore.js]
            useCursor2 --> RealtimeService2[realtime.js]
            usePresence2 --> RealtimeService2
            useRealtime2 --> FirestoreService2
        end
        
        AuthService2 --> Firebase2[Firebase SDK]
        FirestoreService2 --> Firebase2
        RealtimeService2 --> Firebase2
    end
    
    subgraph "Firebase Backend (Google Cloud)"
        subgraph "Firebase Authentication"
            FirebaseAuth[Firebase Auth]
            FirebaseAuth --> UserDB[(Users Database)]
        end
        
        subgraph "Cloud Firestore"
            Firestore[(Firestore Database)]
            
            subgraph "Collections"
                Firestore --> UsersCol[users collection]
                Firestore --> CanvasCol[canvas collection]
                Firestore --> ObjectsCol[objects collection]
                Firestore --> PresenceCol[presence collection]
            end
            
            UsersCol --> UserDoc1[User Doc<br/>id, name, email<br/>cursorColor]
            CanvasCol --> CanvasDoc[Canvas Doc<br/>id, lastUpdated]
            ObjectsCol --> RectDoc[Rectangle Docs<br/>id, x, y, width<br/>height, color]
            PresenceCol --> PresenceDoc[Presence Docs<br/>userId, isOnline<br/>lastSeen]
        end
        
        subgraph "Real-time Listeners"
            Snapshot[onSnapshot Listeners]
            OnDisconnect[onDisconnect Triggers]
        end
    end
    
    subgraph "Deployment Platform"
        Deploy[Vercel/Firebase Hosting/AWS]
        Deploy --> StaticAssets[Static Assets<br/>HTML, CSS, JS]
        Deploy --> EnvVars[Environment Variables<br/>Firebase Config]
    end
    
    Firebase1 -.->|WebSocket<br/>Real-time Sync| Firestore
    Firebase2 -.->|WebSocket<br/>Real-time Sync| Firestore
    
    Firebase1 -.->|Auth Requests| FirebaseAuth
    Firebase2 -.->|Auth Requests| FirebaseAuth
    
    Snapshot -.->|Push Updates| Firebase1
    Snapshot -.->|Push Updates| Firebase2
    
    OnDisconnect -.->|Cleanup| PresenceCol
    
    Deploy --> App1
    Deploy --> App2
    
    style Firebase1 fill:#FFA500
    style Firebase2 fill:#FFA500
    style Firestore fill:#4285F4
    style FirebaseAuth fill:#4285F4
    style Deploy fill:#00C853
    style U1 fill:#E91E63
    style U2 fill:#9C27B0
    
    classDef hookStyle fill:#FF6F00,stroke:#E65100,stroke-width:2px
    classDef serviceStyle fill:#0288D1,stroke:#01579B,stroke-width:2px
    classDef componentStyle fill:#7CB342,stroke:#558B2F,stroke-width:2px
    
    class useAuth1,useCanvas1,useCursor1,usePresence1,useRealtime1,useAuth2,useCanvas2,useCursor2,usePresence2,useRealtime2 hookStyle
    class AuthService1,FirestoreService1,RealtimeService1,AuthService2,FirestoreService2,RealtimeService2 serviceStyle
    class Auth1,Canvas1,Collab1,Auth2,Canvas2,Collab2 componentStyle