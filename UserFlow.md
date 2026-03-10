
graph TD
    %% === STYLES ===
    classDef page fill:#e3f2fd,stroke:#1565c0,stroke-width:2px,shape:rect,rx:5,ry:5;
    classDef decision fill:#fff3e0,stroke:#ef6c00,stroke-width:2px,shape:rhombus;
    classDef action fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px,shape:rounded;
    classDef entry fill:#f3e5f5,stroke:#4a148c,stroke-width:2px,shape:circle;
    classDef terminator fill:#ffebee,stroke:#c62828,stroke-width:2px,shape:rect,rx:10,ry:10;
    classDef subfeature fill:#fff,stroke:#666,stroke-width:1px,stroke-dasharray: 5 5;

    %% === 1. AUTHENTICATION ===
    Start((start)):::entry --> Login[Page: Login]:::page
    Login -->|Input Credentials| CheckCreds{Valid Creds?}:::decision
    CheckCreds -- No --> ErrorMsg[Show Error Message]:::page
    ErrorMsg --> Login
    CheckCreds -- Yes: User Role --> UserDash[Page: User Dashboard]:::page
    CheckCreds -- Yes: Admin Role --> AdminDash[Page: Admin Dashboard]:::page

    %% === 2. USER PORTAL WORKFLOWS ===
    
    %% Dashboard Actions
    UserDash -->|Quick Action| QuickCreate[Mod: Quick Create Meeting]:::page
    UserDash -->|View List| Upcoming[Comp: Upcoming Meetings]:::page
    Upcoming -->|Select Meeting| MeetDetail[Mod: Meeting Details]:::page
    
    %% Meeting Management Flow
    UserDash -->|Nav| MyMeetings[Page: My Meetings]:::page
    MyMeetings -->|View Calendar| CalendarView[Comp: Calendar]:::page
    CalendarView -->|Click Event| MeetDetail
    CalendarView -->|Click Empty Slot| QuickBook[Mod: Quick Book]:::page
    
    MeetDetail -->|Check-In| QRScan[Mod: QR Scanner]:::page
    QRScan -->|Success| CheckedIn[State: Checked In]:::terminator
    MeetDetail -->|Cancel| CancelConf{Confirm?}:::decision
    CancelConf -- Yes --> Cancelled[State: Meeting Cancelled]:::terminator
    
    %% Create Meeting Full Flow
    UserDash -->|Nav| CreatePage[Page: Create Meeting]:::page
    CreatePage -->|Fill Info| FormInfo[Action: Input Details]:::action
    FormInfo -->|Select Room| SelectRoom[Comp: Room Picker]:::subfeature
    FormInfo -->|Add Participants| SelectPeople[Comp: User Picker]:::subfeature
    CreatePage -->|Submit| Validate{Available?}:::decision
    Validate -- No --> ValError[Show Conflict]:::page
    Validate -- Yes --> SuccessBook[Success Notification]:::terminator

    %% Room Browsing & 3D
    UserDash -->|Nav| RoomPage[Page: Room List]:::page
    RoomPage -->|Filter| FilterRes[Action: Filter Status/Type]:::action
    RoomPage -->|View 3D| View3D[Mod: 3D Building Viewer]:::page
    View3D -->|Select Room| RoomDetailOverlay[Mod: Room Detail]:::page
    RoomPage -->|Click Room| RoomDetailOverlay
    RoomDetailOverlay -->|Book This Room| CreatePage

    %% Device Browsing
    UserDash -->|Nav| DevicePage[Page: Device List]:::page
    DevicePage -->|Filter| FilterDev[Action: Search/Filter]:::action
    DevicePage -->|Select Device| DevDetail[Mod: Device Detail]:::page
    DevDetail -->|Book Device| DeviceBookMod[Mod: Book Device]:::page
    DeviceBookMod -->|Confirm| DevSuccess[Success Notification]:::terminator

    %% Contact Groups
    UserDash -->|Nav| Contacts[Page: Contact Groups]:::page
    Contacts -->|Create New| GroupMod[Mod: Add/Edit Group]:::page
    Contacts -->|Export| ExportCSV[Action: Download CSV]:::action
    GroupMod -->|Save| GroupSaved[State: Group Updated]:::terminator

    %% History
    UserDash -->|Nav| History[Page: History]:::page
    History -->|Switch Tab| HistoryList[Comp: Joined/Cancelled List]:::page
    HistoryList -->|View Detail| MeetDetail

    %% === 3. ADMIN PORTAL WORKFLOWS ===
    
    %% Admin Dashboard
    AdminDash -->|View Stats| StatsView[Comp: Global Stats]:::page
    AdminDash -->|View Timeline| Timeline[Comp: Room Timeline]:::page
    Timeline -->|Click Slot| RoomDetailAdmin[Mod: Room Detail]:::page

    %% Room Management
    AdminDash -->|Nav| ManageRooms[Page: Room Management]:::page
    ManageRooms -->|Add Room| RoomForm[Mod: Add/Edit Room]:::page
    RoomForm -->|Upload Img| ImgUpload[Action: Upload to Cloudinary]:::action
    ManageRooms -->|Edit Room| RoomForm
    ManageRooms -->|Delete| DelConf{Confirm?}:::decision
    DelConf -- Yes --> RoomDeleted[State: Room Deleted]:::terminator

    %% User Management
    AdminDash -->|Nav| ManageUsers[Page: User Management]:::page
    ManageUsers -->|Import| ExcelImport[Mod: Import Users]:::page
    ManageUsers -->|Edit User| UserForm[Mod: Edit User]:::page
    ManageUsers -->|Sync LDAP| SyncAction[Action: Sync System]:::action

    %% Device Management
    AdminDash -->|Nav| ManageDevices[Page: Device Management]:::page
    ManageDevices -->|Add Device| DeviceForm[Mod: Add/Edit Device]:::page

    %% Reports
    AdminDash -->|Nav| Reports[Page: Reports]:::page
    Reports -->|View Chart| UsageChart[Comp: Usage Analytics]:::page

    %% === LEGEND ===
    subgraph Legend
        L_Page[Screen/Page]:::page
        L_Dec[Decision]:::decision
        L_Act[Action/Process]:::action
        L_Start[Entry Point]:::entry
        L_End[Final State]:::terminator
    end

