flowchart LR
    %% GLOBAL STYLES
    classDef portal fill:#f8f9fa,stroke:#333,stroke-width:2px;
    classDef page fill:#e3f2fd,stroke:#1565c0,stroke-width:1px;
    classDef subfeature fill:#ffffff,stroke:#666,stroke-width:1px,stroke-dasharray: 5 5;
    classDef modal fill:#fff3e0,stroke:#ef6c00,stroke-width:1px,shape:rect;
    classDef action fill:#e8f5e9,stroke:#2e7d32,stroke-width:1px,shape:rounded;

    %% === PUBLIC ZONE ===
    subgraph PublicZone [Public Zone]
        direction TB
        Login[Login Page]:::page
        ForgotPass[Forgot Password]:::page
        SSOCallback[Google OAuth Callback]:::page
        CheckIn[Check-In Processing]:::page
    end

    %% === USER PORTAL ===
    subgraph UserPortal [User Portal Context]
        direction TB
        
        %% -- Dashboard --
        subgraph UserDash [Dashboard]
            direction TB
            UD_Stats[Stats Cards: Today/Week/Upcoming]:::subfeature
            UD_Charts[Charts: Weekly Activity/Participants]:::subfeature
            UD_Quick[Quick Actions: Create/View Rooms]:::action
            UD_Upcoming[Appt List: Upcoming Meetings]:::subfeature
            UD_Detail[Meeting Detail Modal]:::modal
        end

        %% -- My Meetings --
        subgraph MyMeetings [My Meetings Page]
            direction TB
            MM_Calendar[Calendar View: Day/Week/Month]:::subfeature
            MM_Filter[Filters: Confirmed/Pending]:::subfeature
            MM_Export[Export CSV]:::action
            
            %% Modals
            MM_QuickBook[Quick Booking Modal]:::modal
            MM_Edit[Edit Meeting Modal]:::modal
            MM_QR[QR Check-in Modal]:::modal
            MM_ViewDetail[Meeting Detail View]:::modal
        end

        %% -- Create Meeting --
        subgraph CreateMeet [Create Meeting Page]
            direction TB
            CM_Form[Booking Form]:::subfeature
            CM_RoomSelect[Room Selection]:::subfeature
            CM_DeviceSelect[Device Selection]:::subfeature
            CM_Partic[Participant Picker]:::subfeature
        end

        %% -- BROWSING PAGES (Detailed) --
        
        %% 1. ROOM BROWSING
        subgraph Page_Rooms [User Rooms Page]
            direction TB
            UR_Filter[Search & Filters: Name/Status]:::subfeature
            UR_List[Room Grid List]:::subfeature
            UR_Action_3D[View 3D Building]:::action
            
            %% Detail View Overlay
            subgraph UR_Detail_View [Room Detail Overlay]
                UR_Info[Room Specs & Facilities]:::subfeature
                UR_Gallery[Image Gallery/Lightbox]:::subfeature
                UR_Btn_Book[Book This Room]:::action
            end
            
            %% Booking Flow
            UR_Modal_Cal[Room Calendar Modal]:::modal
            UR_Modal_Book[Book Room Form Modal]:::modal

            UR_List -->|Click| UR_Detail_View
            UR_Action_3D -->|Select Room| UR_Modal_Book
            UR_Btn_Book --> UR_Modal_Cal
            UR_Modal_Cal -->|Select Slot| UR_Modal_Book
        end

        %% 2. DEVICE BROWSING
        subgraph Page_Devices [User Devices Page]
            direction TB
            UDv_Filter[Search & Filters: Name/Status]:::subfeature
            UDv_List[Device Grid List]:::subfeature
            
            %% Device Detail Overlay
            subgraph UDv_Detail_View [Device Detail Overlay]
                UDv_Info[Description & Specs]:::subfeature
                UDv_Gallery[Image Lightbox]:::subfeature
                UDv_Btn_Book[Book This Device]:::action
            end

            %% Booking Modal
            UDv_Modal_Book[Book Device Modal]:::modal

            UDv_List -->|Click| UDv_Detail_View
            UDv_Btn_Book --> UDv_Modal_Book
        end

        %% 3. HISTORY
        subgraph Page_History [Meeting History Page]
            direction TB
            UH_Tabs[Tabs: Joined / Cancelled]:::subfeature
            UH_List[Meeting List Card]:::subfeature
            UH_Modal_Detail[Meeting Detail Modal]:::modal

            UH_Tabs --> UH_List
            UH_List -->|Click| UH_Modal_Detail
        end

        %% 4. CONTACT GROUPS
        subgraph Page_Contacts [Contact Groups Page]
            direction TB
            UC_Header[Header Actions]:::subfeature
            UC_Table[Groups Table]:::subfeature
            
            %% Actions
            UC_Btn_Export[Export CSV]:::action
            UC_Btn_Create[Create New Group]:::action
            
            %% Modals
            UC_Modal_Export[Export Options Modal]:::modal
            UC_Modal_Edit[Add/Edit Group Modal]:::modal
            
            %% Flow
            UC_Header --> UC_Btn_Export & UC_Btn_Create
            UC_Btn_Export --> UC_Modal_Export
            UC_Btn_Create --> UC_Modal_Edit
            UC_Table -->|Edit| UC_Modal_Edit
        end
        
        %% -- User Settings --
        subgraph UserSettings [Settings]
             U_Profile[Profile Page]:::page
             U_Pass[Change Password]:::page
        end
    end

    %% === ADMIN PORTAL ===
    subgraph AdminPortal [Admin Portal Context]
        direction TB

        %% -- Admin Dashboard --
        subgraph AdminDash [Dashboard]
            direction TB
            AD_Timeline[Resource Timeline View]:::subfeature
            AD_Stats[System Stats]:::subfeature
            AD_Chart_Usage[Room Usage Pie Chart]:::subfeature
            AD_Chart_Freq[Meeting Frequency Bar Chart]:::subfeature
            AD_Modal_Today[Today Meetings Modal]:::modal
        end

        %% -- Room Management --
        subgraph AdminRooms [Room Management]
            direction TB
            AR_List[Room Table]:::subfeature
            AR_Filter[Filters: Status/Capacity]:::subfeature
            AR_3D[3D Building Viewer]:::action
            
            %% Modals
            AR_AddEdit[Add/Edit Room Modal]:::modal
            AR_Img[Image Upload & Lightbox]:::modal
        end

        %% -- User Management --
        subgraph AdminUsers [User Management]
            direction TB
            AU_List[User Table]:::subfeature
            AU_Import[Import from Excel]:::action
            AU_Sync[Sync LDAP/Outlook]:::action
            AU_Modal[User Detail/Edit Modal]:::modal
        end
        
        %% -- Device Management --
        subgraph AdminDevices [Device Management]
            direction TB
            Dev_List[Device Inventory]:::subfeature
            Dev_Modal[Add/Edit Device Modal]:::modal
        end
        
        %% -- Reports --
        subgraph AdminReports [Reports & Analytics]
             Rep_Dash[Report Dashboard]:::page
        end
    end

    %% === NAVIGATION & FLOWS ===
    Login -->|User Auth| UserDash
    Login -->|Admin Auth| AdminDash

    %% User Flows
    UD_Quick --> UR_List
    UD_Quick --> CreateMeet
    UD_Upcoming --> UD_Detail

    MM_Calendar -->|Click Slot| MM_QuickBook
    MM_Calendar -->|Click Event| MM_ViewDetail
    MM_ViewDetail -->|Edit| MM_Edit
    MM_ViewDetail -->|Check-in| MM_QR

    %% Admin Flows
    AR_List -->|Edit| AR_AddEdit
    AR_List -->|View 3D| AR_3D
    AD_Stats --> AD_Modal_Today

    %% Layout Connection
    UserDash -.-> MyMeetings
    UserDash -.-> CreateMeet
    
    UserDash -.-> Page_Rooms
    UserDash -.-> Page_Devices
    UserDash -.-> Page_History
    UserDash -.-> Page_Contacts
    
    UserDash -.-> UserSettings

    AdminDash -.-> AdminRooms
    AdminDash -.-> AdminUsers
    AdminDash -.-> AdminDevices
    AdminDash -.-> AdminReports

    %% Legend / Color Classes Apply
    class UserPortal,AdminPortal portal
    class PublicZone page
    class Page_Rooms,Page_Devices,Page_History,Page_Contacts page